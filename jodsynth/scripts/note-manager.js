
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
function NoteManager(ac, output) {
	this.bpm = 140;
	this.notes = [];
	this.isPlaying = false;
	this.playbackStartTime = 0;
	this.activeOscillators = [];

	this.addNote = (startTime, tone, duration) => {
		if (startTime < 0) startTime = 0;
		const newNote = new Note(tone, startTime, duration);
		this.notes.push(newNote);
		return newNote;
	};

	this.play = (startTime = 0) => {
		this.playbackStartTime = ac.currentTime - beatsToSeconds(startTime, this.bpm);
		this.isPlaying = true;
		this.notes.forEach((n) => playNote(n, this.activeOscillators, ac, output, this.playbackStartTime, this.bpm));
	};

	this.stop = () => {
		this.isPlaying = false;
		this.activeOscillators.forEach((osc) => osc.stop());
		this.activeOscillators = [];
	};

	this.getCurrentTime = () => secondsToBeats(ac.currentTime - this.playbackStartTime, this.bpm);
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