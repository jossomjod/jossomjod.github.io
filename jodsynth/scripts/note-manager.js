
function freqToTone(freq) {
	return 12 * Math.log2(freq / 440) + 49;
}

function toneToFreq(tone) {
	return 440 * Math.pow(2, (tone - 49) / 12);
}

function Note(tone, start, dur) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.tone = tone || 24;
	this.frequency = toneToFreq(this.tone);
	this.gain = 1.0;

	this.setTone = (_tone) => {
		this.tone = _tone;
		this.frequency = toneToFreq(this.tone);
	};

	/**
	 * @param {AudioContext} ac
	 * @param {AudioNode} output
	 */
	this.play = (ac, output, startTimeOffset) => {
		const currentTime = ac.currentTime - startTimeOffset;
		const osc = ac.createOscillator();
		osc.type = 'square';
		osc.frequency.setValueAtTime(this.frequency, currentTime);
		osc.connect(output);
		osc.start(currentTime + this.startTime);
		osc.stop(currentTime + this.startTime + this.duration);
	}
}


/**
 * @param {AudioContext} ac
 * @param {AudioNode} output
 */
function NoteManager(ac, output) {
	this.startTimeOffset = 0;
	this.notes = [
		new Note(24, 0, 0.3), new Note(32, 0, 0.3),
		new Note(32, 0.4, 0.3), new Note(48, 0.4, 0.3),
		new Note(24.01, 0.8, 0.3), new Note(32.04, 0.8, 0.3),
		new Note(30, 1.2, 0.3), new Note(46, 1.2, 0.3),
	];
	this.isPlaying = false;

	this.addNote = (startTime, tone, duration) => {
		const newNote = new Note(tone, startTime, duration);
		this.notes.push(newNote);
		if (startTime < this.startTimeOffset) this.startTimeOffset = startTime;
		return newNote;
	}

	this.play = () => {
		this.notes.forEach((n) => n.play(ac, output, this.startTimeOffset));
	}
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