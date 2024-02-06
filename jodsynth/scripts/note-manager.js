
function Note(freq, start, dur) {
	this.startTime = start || 0.0;
	this.duration = dur || 1.0;
	this.frequency = freq || 440.0;
	this.gain = 1.0;

	/**
	 * @param {AudioContext} ac
	 * @param {AudioNode} output
	 */
	this.play = (ac, output) => {
		const osc = ac.createOscillator();
		osc.type = 'square';
		osc.frequency.setValueAtTime(this.frequency, ac.currentTime);
		osc.connect(output);
		osc.start(ac.currentTime + this.startTime);
		osc.stop(ac.currentTime + this.startTime + this.duration);
	}
}


/**
 * @param {AudioContext} ac
 * @param {AudioNode} output
 */
function NoteManager(ac, output) {
	this.notes = [
		new Note(220, 0, 0.3), new Note(330, 0, 0.3),
		new Note(330, 0.4, 0.3), new Note(440, 0.4, 0.3),
		new Note(221, 0.8, 0.3), new Note(330.8, 0.8, 0.3),
		new Note(282, 1.2, 0.3), new Note(417, 1.2, 0.3),
	];

	this.play = () => {
		this.notes.forEach((n) => n.play(ac, output));
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