function EnvelopePoint(value, time) {
	this.value = value;
	this.time = time;
	this.totalTime;
}


/**
* points: { value: number, time: number }[]
*/
function ArrayEnvelope(ac, points = [], multiplier = 1.0) {
	this.points = points.slice();
	this.multiplier = multiplier;

	this.getRelease = () => this.points.at(-1).time - this.points.at(-2).time;

	// Call this when starting a note. prop must be an AudioParam.
	this.start = (prop, mult = this.multiplier) => {
		if (!prop) return;
		const acc = ac.currentTime;
		prop.cancelScheduledValues(acc);
		prop.setValueAtTime(0, acc);

		this.points.forEach((p) => {
			if (p === this.points.at(-1)) return;
			prop.linearRampToValueAtTime(p.value * mult, ac.currentTime + p.time);
		});
	};

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop) => {
		if (!prop) return;
		const release = this.getRelease();
		prop.cancelScheduledValues(ac.currentTime);
		prop.linearRampToValueAtTime(0, ac.currentTime + release);
	};
}


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];



//function Oscillator(ac, type = 'square', detune = 0.0, gainMult = 1.0, gainEnvelope, mod, isLFO = false) {
function Oscillator(ac, type = 'square', detune = 0.0, gainMult = 1.0, gainEnvelope, mod, isLFO = false) {
	this.type = type;
	this.detune = detune;
	this.gain = 1.0;
	this.multiplier = gainMult;
	this.gainEnvelope = gainEnvelope;
	this.mod = mod;
	this.isCarrier = !mod;
	this.isLFO = isLFO;
	this.fixedFreq = 1.0;
	this.name = '';

	this.start = (frequency, gainNode) => {
		const freq = this.isLFO ? this.fixedFreq : frequency;
		// You have to make a new osc every time
		const osc = new OscillatorNode(ac, { type: this.type, detune: this.detune, frequency: freq });

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
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.8 },
	{ value: 0.0, time: 1.5 },
];

var osirisGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 0.3, time: 0.2 },
	{ value: 0.2, time: 0.8 },
	{ value: 0.0, time: 1.4 },
];

var osmanGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.9 },
	{ value: 0.0, time: 1.7 },
];

//TODO: Experiment with multiplying gain by 2^(12/tone)

function Synth(ac, connectTo) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 1.0;
	this.gain.connect(connectTo);

	this.oscillators = [
		new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0), null),
		new Oscillator(ac, 'sawtooth', 0.0, 1.0, new ArrayEnvelope(ac, osirisGainPoints, 0.0), 0),
		new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), 1, true),
		new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), 2),
	];
	
	this.start = (freq) => {
		const oscs = this.oscillators.map((osc) => {
			const gain = ac.createGain();
			const oscillator = osc.start(freq, gain);
			return { gain, oscillator };
		});

		oscs.forEach((t, i) => {
			const mod = this.oscillators[i].mod;
			if (mod !== null && typeof mod === 'number') {
				t.gain.connect(oscs[mod].oscillator.frequency);
			} else {
				t.gain.connect(this.gain);
			}
		});

		return oscs;
	};
	
	this.stop = (oscs) => {
		oscs.forEach((o, i) => this.oscillators[i].stop(ac.currentTime, o.oscillator, o.gain));
	};

	this.addOsc = () => {
		console.log('[synth.js Synth] Adding oscillator');
		const i = this.oscillators.length-2;
		const modIdx = i < 0 ? 0 : i;
		return this.oscillators.push(new Oscillator(ac, 'sine', 0.0, 1.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), modIdx));
	}
}