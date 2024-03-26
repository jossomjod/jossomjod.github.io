
function freqToTone(freq) {
	return 12 * Math.log2(freq / 440) + 49;
}

function toneToFreq(tone) {
	return 440 * Math.pow(2, (tone - 49) / 12);
}

function beatsToSeconds(beats, bpm) {
	return 60 * beats / bpm;
}

function secondsToBeats(sec, bpm) {
	return bpm * sec / 60;
}

function AutomationNode(time = 0, value = 0) {
	this.time = time;
	this.value = value;
}

function Note(tone, start, dur, gain, gainNodes, pitchNodes) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.tone = tone || 24;
	this.gain = gain || 1.0;
	this.gainNodes = gainNodes || []; // AutomationNode[]
	this.pitchNodes = pitchNodes || []; // AutomationNode[]
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

/**
 * @param {AudioContext} ac
 * @param {AudioNode} output
 */
function NoteManager(ac, output) {
	this.bpm = 140;
	this.isPlaying = false;
	this.playbackStartTime = 0;
	this.activeOscillators = [];
	this.tracks = [];
	this.selectedTrack = 0;
	this.soloTrack = false;
	this.loopEnd = 4 * this.bpm;
	this.isLooping = true;
	this.intervalId = 0;

	this.addNote = (startTime, tone, duration) => {
		const synth = this.getSelectedTrack().synth.oscillators[0];
		if (startTime < 0) startTime = 0;
		const newNote = new Note(tone, startTime, duration, 1, synth.gainEnvelope.points.slice(), synth.pitchEnvelope.points.slice());
		this.getSelectedTrack().notes.push(newNote);
		return newNote;
	};

	/** @deprecated */
	this.play = (startTime = 0) => {
		this.playbackStartTime = ac.currentTime - beatsToSeconds(startTime, this.bpm);
		this.isPlaying = true;
		this.getSelectedTrack().notes.forEach((n) => {
			const startTime = this.playbackStartTime + beatsToSeconds(n.startTime, this.bpm);
			if (startTime < 0) return;
			const duration = beatsToSeconds(n.duration, this.bpm);
			const freq = toneToFreq(n.tone);
			this.activeOscillators.push(this.getSelectedTrack().synth.schedulePlayback({ startTime, duration, freq }));
		});
	};

	/** @deprecated */
	this.stop = () => {
		this.isPlaying = false;
		this.activeOscillators.forEach((osc) => this.getSelectedTrack().synth.stop(osc));
		this.activeOscillators = [];
	};


	this.playTrack = (track, startTimeMs) => {
		const oscs = [];
		track.notes.forEach((n) => {
			const startTime = startTimeMs + beatsToSeconds(n.startTime, this.bpm);
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

	this.playAll = (startTimeBeats = 0) => {
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

	this.getNotesToPlay = (notes, start, end) => {
		return notes.filter((n) => n.startTime >= start && n.startTime < end);
	};

	this.playbackLoop = (startTimeBeats = 0) => {
		const interval = 600;
		this.isPlaying = true;
		this.playbackStartTime = ac.currentTime - beatsToSeconds(startTimeBeats, this.bpm);
		clearInterval(this.intervalId);
		this.intervalId = setInterval(() => {
			this.tracks.forEach((t) => {
				if (t.muted) return;
				const notes = this.getNotesToPlay(t.notes, ac.currentTime - this.playbackStartTime, interval);
				
				notes.forEach((n) => {
					const startTime = this.playbackStartTime + beatsToSeconds(n.startTime, this.bpm);
					if (startTime < 0) return;
					const duration = beatsToSeconds(n.duration, this.bpm);
					const freq = toneToFreq(n.tone);
					t.synth.schedulePlayback({ startTime, duration, freq });
				});
			});
		}, interval);
	}

	this.stopPlaybackLoop = () => {
		this.isPlaying = false;
		clearInterval(this.intervalId);
	};

	this.getCurrentTime = () => secondsToBeats(ac.currentTime - this.playbackStartTime, this.bpm);

	this.createTrack = () => {
		const index = this.tracks.length + 1;
		const track = { notes: [], name: 'Track ' + index, active: true, muted: false };
		track.fx = new FxManager(ac, output);
		track.synth = new Synth(ac, track.fx.input);
		this.tracks.push(track);
		return track;
	};

	this.selectTrack = (track) => {
		this.tracks[this.selectedTrack].active = false;
		track.active = true;
		this.selectedTrack = this.tracks.indexOf(track);
	};

	this.getSelectedTrack = () => {
		return this.tracks[this.selectedTrack];
	};

	this.getStringableTracks = () => {
		return this.tracks.map((t) => ({ ...t, synth: t.synth.save(), fx: t.fx.save() }));
	};

	this.loadTracks = (tracks) => {
		if (!tracks?.length) {
			this.tracks = [];
			this.createTrack();
			this.selectedTrack = 0;
			return;
		}
		this.tracks = tracks.map((t, i) => {
			if (t.active) this.selectedTrack = i;

			const track = t;
			track.fx = new FxManager(ac, output, t.fx);
			track.synth = new Synth(ac, track.fx.input, t.synth);
			return track;
		});
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