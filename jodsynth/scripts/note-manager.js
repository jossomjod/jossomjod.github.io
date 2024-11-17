
function AutomationNode(time = 0, value = 0) {
	this.time = time;
	this.value = value;
}

function Note(tone, start, dur, gain, automations) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.tone = tone || 24;
	this.gain = gain || 1.0;
	this.automations = automations || [{
		gain: [], // AutomationNode[]
		pitch: [], // AutomationNode[]
		pan: [], // AutomationNode[]
	}];
}


/**
 * @param {Note} note
 * @param {AudioContext} ac
 * @param {AudioNode} output
 * @param {number} bpm
 */
function playNote (note, oscArr, ac, output, currentTime, bpm) {
	const startTime = currentTime + beatsToSeconds(note.startTime, bpm);
	if (startTime < 0) return;
	const endTime = startTime + beatsToSeconds(note.duration, bpm);
	const osc = ac.createOscillator();
	osc.type = 'square';
	osc.frequency.setValueAtTime(toneToFreq(note.tone), startTime);
	osc.connect(output);
	osc.start(startTime);
	osc.stop(endTime);
	oscArr.push(osc);
}

function envelopeToAutomation(env, bpm, duration, valueMultiplier = 1) {
	const arr = env.points.map((p) => {
		const t = secondsToBeats(p.time, bpm);
		const time = Math.max(0, Math.min(duration, t));
		const value = p.value * valueMultiplier;
		return { time, value };
	});
	return arr;
	if (!arr.length) return arr;
	if (arr.length < 2) return arr; // TODO: handle better
	
	const penult = arr.at(-2);
	const release = arr.at(-1).time - penult.time;

	if (penult.time < duration) {
		const last = arr.pop();
		//last.time = duration + release;
		arr.push(new AutomationNode(duration, penult.value), last);
	} else {
		const idx = arr.findLastIndex((a) => a.time < duration);
		if (idx === -1) {
			// lerp from 0 to 1st value, stopping at duration
			// add release
			const ddt = duration / arr[0].time;
			const val = lerp(0, arr[0].value, ddt);
			arr[0].value = val;
			arr[0].time = duration;
		} else {
			// lerp from arr[idx] to arr[idx+1], stopping at duration
			// add release
			const next = arr[idx + 1];
			const tDiff = next.time - arr[idx].time;
			const dDiff = duration - arr[idx].time;
			const ddt = dDiff / tDiff;
			const val = lerp(arr[idx].value, next.value, ddt);
			next.value = val;
			next.time = duration;
		}
	}
	arr.at(-1).time = duration;// + release;

	return arr;
}

function getAutomationFromSynth(synth, bpm, duration) {
	return synth.oscillators.map((o) => {
		const gain = envelopeToAutomation(o.gainEnvelope, bpm, duration);
		const pitch = envelopeToAutomation(o.pitchEnvelope, bpm, duration, 12);
		const pan = [];
		return { gain, pitch, pan };
	});
}

/**
 * @param {AudioContext} ac
 * @param {AudioNode} output
 */
function NoteManager(ac, output) {
	this.version = 0;
	this.bpm = 140;
	this.lookaheadBeats = 0.09
	this.intervalMs = 18;
	this.intervalBeats = secondsToBeats(0.001 * this.intervalMs, this.bpm);

	this.isPlaying = false;
	this.playbackStartTime = 0;
	this.activeOscillators = [];
	this.tracks = [];
	this.selectedTrack = 0;
	this.selectedTrackId = 1;
	this.soloTrack = false;

	this.loop = {
		start: 0,
		end: 4,
		active: false,
	};
	this.loopEnd = 4;

	this.intervalId = 0;
	this.latestNoteStartTime = 0;

	this.trackIdCounter = 0;
	this.onNoteScheduled = (currentTrackIndex, startsIn, duration, track) => null; // set in UI

	this.addNote = (startTime, tone, duration) => {
		const synth = this.getSelectedTrack().synth;
		if (startTime < 0) startTime = 0;
		const newNote = new Note(tone, startTime, duration, 1, getAutomationFromSynth(synth, this.bpm, duration));
		this.getSelectedTrack().notes.push(newNote);
		return newNote;
	};

	this.addAutomationNode = (nodeArray, node = { time: 0, value: 0 }) => {
		nodeArray.push(node);
	};

	this.deleteAutomationNode = (nodeArray, node) => {
		const idx = nodeArray.indexOf(node);
		nodeArray.splice(idx, 1);
	};

	this.resetNoteAutomation = (note, synth = this.getSelectedTrack().synth) => {
		note.automations = getAutomationFromSynth(synth, this.bpm, note.duration);
	};


	this.toggleLooping = (active = !this.loop.active) => this.loop.active = active;
	this.setLoopStart = (beats) => this.loop.start = beats;
	this.setLoopEnd = (beats) => this.loop.end = beats;
	this.getStartTime = () => this.loop.active ? this.loop.start : 0;
	this.setEndTime = (beats) => this.loopEnd = beats;

	this.toggleSolo = (track) => {
		track.solo = !track.solo;
		this.soloTrack = this.tracks.some((t) => t.solo);
	};

	this.playTrack = (track, startTimeSec) => {
		const oscs = [];
		track.notes.forEach((n) => {
			const startTime = startTimeSec + beatsToSeconds(n.startTime, this.bpm);
			if (startTime < 0) return;
			const duration = beatsToSeconds(n.duration, this.bpm);
			const freq = toneToFreq(n.tone);
			oscs.push(track.synth.schedulePlayback({ startTime, duration, freq }));
		});
		return oscs;
	};

	this.stopTrack = (track, oscs) => {
		oscs.forEach((osc) => track.synth.stop(osc));
	};

	this.playAll = (startTimeBeats = this.getStartTime()) => {
		this.playbackStartTime = ac.currentTime - beatsToSeconds(startTimeBeats, this.bpm);
		this.isPlaying = true;
		this.activeOscillators = this.tracks.filter((t) => !t.muted).map((t) => {
			return this.playTrack(t, this.playbackStartTime);
		});
	};

	this.stopAll = () => {
		this.isPlaying = false;
		this.activeOscillators.forEach((oscs, i) => {
			this.stopTrack(this.tracks[i], oscs);
		});
	};

	// For use in the playback loop
	this.scheduleTrackNotesPlayback = (track, trackIndex, currentBeats, loopEnd, beatsPastEnd, latestTime) => {
		const ns = track.notes;
		const startBeats = this.getStartTime();
		const pastEnd = beatsPastEnd > 0;

		let boie = -0.00001;

		for (let i = 0; i < ns.length; i++) {
			const n = ns[i];
			const automations = !track.disableNoteAutomation ? n.automations : null;

			if (pastEnd && n.startTime < this.latestNoteStartTime) {
				if (!(n.startTime > boie && n.startTime < startBeats + beatsPastEnd)) continue;
				boie = Math.max(n.startTime, boie);
			} else {
				if (!(n.startTime > this.latestNoteStartTime && n.startTime < currentBeats + this.lookaheadBeats)) continue;
			}

			latestTime = Math.max(n.startTime, latestTime);
			const startTime = this.playbackStartTime + beatsToSeconds(n.startTime, this.bpm);
			if (startTime < 0) continue;
			const durationBeats = Math.min(loopEnd - n.startTime, n.duration);
			if (durationBeats <= 0.00001) continue;
			const duration = beatsToSeconds(durationBeats, this.bpm);
			const freq = toneToFreq(n.tone);
			track.synth.schedulePlayback({ startTime, duration, freq, automations, bpm: this.bpm });
			
			const delay = (startTime - ac.currentTime) * 1000;
			this.onNoteScheduled(trackIndex, delay, duration * 1000, track);
		}
		return pastEnd ? boie : latestTime;
	};

	this.playbackLoop = (startTimeBeats = this.getStartTime()) => {
		this.intervalBeats = secondsToBeats(0.001 * this.intervalMs, this.bpm);
		this.playbackStartTime = ac.currentTime - beatsToSeconds(startTimeBeats, this.bpm);
		this.latestNoteStartTime = -0.00001;
		
		if (this.isPlaying) return;
		this.isPlaying = true;

		clearInterval(this.intervalId);
		this.intervalId = setInterval(() => {
			const loopEnd = this.loop.active ? this.loop.end : this.loopEnd;
			const currentBeats = secondsToBeats(ac.currentTime - this.playbackStartTime, this.bpm);
			const beatsPastEnd = this.intervalBeats + currentBeats - loopEnd;

			let latestTime = this.latestNoteStartTime;

			this.tracks.forEach((t, i) => {
				if (t.muted || (this.soloTrack && !t.solo)) return;
				latestTime = this.scheduleTrackNotesPlayback(t, i, currentBeats, loopEnd, beatsPastEnd, latestTime);
			});
			this.latestNoteStartTime = latestTime;

			if (this.isPlaying && beatsPastEnd >= 0) {
				this.playbackStartTime = ac.currentTime - beatsToSeconds(this.getStartTime() + beatsPastEnd, this.bpm);
				this.latestNoteStartTime = -0.00001;
			}
		}, this.intervalMs);
	}

	this.stopPlaybackLoop = () => {
		this.isPlaying = false;
		clearInterval(this.intervalId);
	};

	this.getCurrentTime = () => secondsToBeats(ac.currentTime - this.playbackStartTime, this.bpm);

	this.getEndTime = () => {
		let time = 0;
		this.tracks.forEach((t) => t.notes.forEach((n) => time = Math.max(time, n.startTime + n.duration)));
		return time;
	};

	this.setBpm = (bpm) => {
		const prev = this.bpm;
		this.bpm = bpm;
		this.intervalBeats = secondsToBeats(0.001 * this.intervalMs, this.bpm);
		if (!this.isPlaying) return;

		const currentBeats = secondsToBeats(ac.currentTime - this.playbackStartTime, prev);
		this.playbackStartTime = ac.currentTime - beatsToSeconds(currentBeats, this.bpm);
	};

	this.createTrack = () => {
		const index = this.tracks.length + 1;
		const track = {
			notes: [],
			name: 'Track ' + index,
			active: true,
			muted: false,
			solo: false,
			gain: 1,
			id: ++this.trackIdCounter,
			disableNoteAutomation: false,
		};
		track.fx = new FxManager(ac, output);
		track.synth = new Synth(ac, track.fx.input);
		this.tracks.push(track);
		return track;
	};

	this.deleteTrack = (track) => {
		if (!track) throw 'Can\'t delete track because it doesn\'t exist';
		if (this.tracks.length === 1) throw 'You really should not remove the only remaining track';

		const index = this.tracks.findIndex((t) => t.id === track.id);
		let selectedIdx = this.tracks.findIndex((t) => t.id === this.selectedTrackId);
		
		this.tracks.splice(index, 1);
		if (index <= selectedIdx) selectedIdx = Math.max(0, selectedIdx - 1);
		this.selectTrackByIndex(selectedIdx);
		return this.tracks[selectedIdx];
	};

	this.selectTrack = (track) => {
		this.selectedTrack = Math.max(0, this.tracks.indexOf(track));
		this.selectedTrackId = track.id;
		this.tracks.forEach((t, i) => t.active = i === this.selectedTrack);
	};

	this.selectTrackByIndex = (index) => {
		if (index < 0) index = 0;
		this.tracks.forEach((t, i) => t.active = i === index);
		this.selectedTrack = index;
		this.selectedTrackId = this.tracks[index].id;
	};

	this.selectTrackById = (id) => {
		if (!id) throw 'missing id wtf';
		this.tracks.forEach((t) => t.active = t.id === id);
		this.selectedTrackId = id;
	};

	this.getTrackById = (id) => {
		return this.tracks.find((t) => t.id === id);
	};

	this.getTrackIndex = (id) => {
		return this.tracks.findIndex((t) => t.id === id);
	};

	this.getSelectedTrack = () => {
		if (!this.tracks[this.selectedTrack]) this.selectedTrack = 0;
		return this.tracks[this.selectedTrack];
	};

	this.getStringableTracks = () => {
		return this.tracks.map((t) => ({ ...t, synth: t.synth.save(), fx: t.fx.save() }));
	};

	this.save = () => {
		return {
			version: this.version,
			bpm: this.bpm,
			tracks: this.getStringableTracks(),
		};
	};

	this.load = (data) => {
		this.toggleLooping(false);
		if (data.version !== this.version) {
			console.warn('Version mismatch');
		}
		this.bpm = data.bpm ?? 140;
		this.loadTracks(data.tracks);
	};

	this.loadTracks = (tracks) => {
		this.trackIdCounter = 0;

		if (!tracks?.length) {
			this.tracks = [];
			this.createTrack();
			this.selectedTrack = 0;
			return;
		}
		this.tracks = tracks.map((t, i) => {
			if (t.active) {
				this.selectedTrack = i;
				this.selectedTrackId = t.id;
			}

			const track = t;
			track.fx = new FxManager(ac, output, t.fx, t.gain);
			track.synth = new Synth(ac, track.fx.input, t.synth);
			if (track.id > this.trackIdCounter) this.trackIdCounter = track.id;
			else if (!track.id) track.id = ++this.trackIdCounter;
			return track;
		});
		this.soloTrack = this.tracks.some((t) => t.solo);
	};
}



function MonoNote(freq, start, dur) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.frequency = freq || 440.0;
	this.gain = 1.0;

	/**
 	 * @param {AudioContext} ac
	 * @param {OscillatorNode} osc
	 * @param {GainNode} gain
	 */
	this.play = (ac, osc, gain) => {
		const startTime = ac.currentTime + this.startTime;
		osc.frequency.setValueAtTime(this.frequency, startTime);
		gain.gain.setValueAtTime(this.gain, startTime);
		gain.gain.setValueAtTime(0, startTime + this.duration);
	}
}


/**
 * @param {AudioContext} ac
 * @param {AudioNode} output
 */
function MonoTrack(ac, output) {
	this.notes = [
		new MonoNote(220, 0, 0.3),
		new MonoNote(330, 0.4, 0.3),
		new MonoNote(221, 0.8, 0.3),
		new MonoNote(282, 1.2, 0.3),
	];
	this.osc = ac.createOscillator();
	this.gain = ac.createGain();
	this.gain.connect(output);
	this.osc.connect(this.gain);

	this.play = () => {
		this.osc.start();
		this.osc.stop(ac.currentTime + 2);
		this.notes.forEach((n) => {
			n.play(ac, this.osc, this.gain);
		});
	}
}