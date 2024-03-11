
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

function Note(tone, start, dur) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.tone = tone || 24;
	this.gain = 1.0;
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
function NoteManager(ac, output, synth) {
	this.bpm = 140;
	this.notes = [];
	this.isPlaying = false;
	this.playbackStartTime = 0;
	this.activeOscillators = [];
	this.synth = synth; // TODO: more synths
	this.tracks = [];
	this.selectedTrack = 0;
	this.soloTrack = false;

	this.addNote = (startTime, tone, duration) => {
		if (startTime < 0) startTime = 0;
		const newNote = new Note(tone, startTime, duration);
		this.getSelectedTrack().notes.push(newNote);
		return newNote;
	};

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

	this.stop = () => {
		this.isPlaying = false;
		this.activeOscillators.forEach((osc) => this.getSelectedTrack().synth.stop(osc));
		this.activeOscillators = [];
	};

	this.getNotesToPlay = () => {
		// TODO
	};

	this.playbackLoop = () => {
		setInterval(() => {
			// TODO: start all notes that should begin within the interval
		}, 1000);
	}

	this.getCurrentTime = () => secondsToBeats(ac.currentTime - this.playbackStartTime, this.bpm);

	this.createTrack = () => {
		const index = this.tracks.length + 1;
		const track = { synth: new Synth(ac, output), notes: [], name: 'Track ' + index, active: true, muted: false };
		this.tracks.push(track);
		return track;
	};

	this.selectTrack = (track) => {
		this.tracks[this.selectedTrack].active = false;
		track.active = true;
		this.selectedTrack = this.tracks.indexOf(track);
		console.log('Selected track ', this.selectedTrack);
	};

	this.getSelectedTrack = () => {
		return this.tracks[this.selectedTrack];
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