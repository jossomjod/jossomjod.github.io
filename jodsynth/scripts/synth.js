/**
* points: { value: number, time: number }[]
*/
function ArrayEnvelope(ac, points = [], multiplier = 1.0) {
	this.points = points;
	this.multiplier = multiplier;

	this.getRelease = () => this.points.at(-1).time - this.points.at(-2).time;

	// Call this when starting a note. prop must be an AudioParam.
	this.start = (prop, mult = this.multiplier) => {
		if (!prop) return;
		let acc = ac.currentTime;
		prop.cancelScheduledValues(acc);
		prop.setValueAtTime(0, acc);

		this.points.forEach((p) => {
			if (p === this.points.at(-1)) return;
			acc += p.time;
			prop.linearRampToValueAtTime(p.value * mult, acc);
		});
	}

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop) => {
		if (!prop) return;
		const release = this.getRelease();
		prop.cancelScheduledValues(ac.currentTime);
		prop.linearRampToValueAtTime(0, ac.currentTime + release);
	}
}


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];


function Oscillator(ac, type = 'square', detune = 0.0, gainMult = 1.0, gainEnvelope, connectIndex) {
	this.type = type;
	this.detune = detune;
	this.gain = 1.0;
	this.multiplier = gainMult;
	this.gainEnvelope = gainEnvelope;
	this.connectIndex = connectIndex;

	this.start = (frequency, gainNode) => {
		// You have to make a new osc every time
		const osc = new OscillatorNode(ac, { type: this.type, detune: this.detune, frequency });

		//osc.onended = () => console.log('the end');
		gainNode.gain.value = this.gain;
		osc.connect(gainNode);
		osc.start();

		if (this.gainEnvelope) this.gainEnvelope.start(gainNode.gain, this.multiplier * this.gain);

		return osc;
	}
	this.stop = (time, osc, gainNode) => {
		if (this.gainEnvelope) {
			this.gainEnvelope.stop(gainNode.gain);
			osc.stop(time + this.gainEnvelope.getRelease());
		}
		else osc.stop(time);
	}
}


var oscarGainPoints = [
	{ value: 1.0, time: 0.001 },
	{ value: 0.8, time: 0.2 },
	{ value: 0.5, time: 2.3 },
	{ value: 0.0, time: 2.7 },
];

var osirisGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 0.3, time: 0.2 },
	{ value: 0.2, time: 0.8 },
	{ value: 0.0, time: 1.0 },
];

var osmanGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 0.6, time: 0.3 },
	{ value: 0.2, time: 0.9 },
	{ value: 0.0, time: 1.0 },
];


function Synth(ac, connectTo) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 1.0;
	this.gain.connect(connectTo);

	this.oscillators = [
		new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0), null),
		new Oscillator(ac, 'sawtooth', 0.0, 1.0, new ArrayEnvelope(ac, osirisGainPoints, 1600.0), 0),
		new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), 1),
	];
/* 
	this.oscar = new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0));
	this.osiris = new Oscillator(ac, 'sawtooth', 0.0, 1.0, new ArrayEnvelope(ac, osirisGainPoints, 1600.0));
	this.osman = new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0)); */
	
	this.start = (freq) => {
		/* const oscarGain = ac.createGain();
		const osirisGain = ac.createGain();
		const osmanGain = ac.createGain();
		const oscar = this.oscar.start(freq, oscarGain);
		const osiris = this.osiris.start(freq, osirisGain);
		const osman = this.osman.start(freq, osmanGain);

		oscarGain.connect(this.gain);
		osirisGain.connect(oscar.frequency);
		osmanGain.connect(osiris.frequency); */

		prevOsc = null;
		return this.oscillators.map((osc, i) => {
			const gain = ac.createGain();
			const oscillator = osc.start(freq, gain);
			if (prevOsc) gain.connect(prevOsc.frequency);
			else gain.connect(this.gain);
			prevOsc = oscillator;
			return { gain, oscillator };
		})

		//return { oscar, osiris, osman, oscarGain, osirisGain, osmanGain };
	};
	
	this.stop = (oscs) => {
		oscs.forEach((o, i) => this.oscillators[i].stop(ac.currentTime, o.oscillator, o.gain));
/* 
		this.oscar.stop(ac.currentTime, oscs.oscar, oscs.oscarGain);
		this.osiris.stop(ac.currentTime, oscs.osiris, oscs.osirisGain);
		this.osman.stop(ac.currentTime, oscs.osman, oscs.osmanGain); */
	};
}