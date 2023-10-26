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
	this.start = (prop, base = 0.0, mult = this.multiplier) => {
		if (!prop) return;
		const acc = ac.currentTime;
		prop.cancelScheduledValues(acc);
		prop.setValueAtTime(base, acc);

		this.points.forEach((p) => {
			if (p === this.points.at(-1)) return;
			prop.linearRampToValueAtTime(base + p.value * mult, ac.currentTime + p.time);
		});
	};

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop, base = 0.0) => {
		if (!prop) return;
		const endValue = base + this.points.at(-1).value * this.multiplier;
		prop.cancelScheduledValues(ac.currentTime);
		prop.linearRampToValueAtTime(endValue, ac.currentTime + this.getRelease());
	};
}


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];

function getPhaseShiftedSawWave(ac, phaseOffset = 0.0) { // ChatGPT is... hmmm...
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	for (let i = 1; i <= numHarmonics; i++) {
		const phase = i * phaseOffset;
		real[i-1] = (phase % 2 === 0 ? -1 : 1) / i; // Inverse amplitude of even harmonics
		imag[i-1] = 0;
	}
	return ac.createPeriodicWave(real, imag);
}

function getPeriodicWave(ac, type = 'sawtooth', phase) {
	switch (type) {
		case 'sawtooth':
			return getPhaseShiftedSawWave(ac, phase);
	}//TODO
}



function Oscillator(ac, type = 'square', detune = 0.0, gainEnvelope, pitchEnvelope, mod, phase) {
	this.type = type;
	this.detune = detune;
	this.gain = 1.0;
	this.gainEnvelope = gainEnvelope;
	this.pitchEnvelope = pitchEnvelope;
	this.mod = null;//mod;
	this.isCarrier = () => this.mod === null;
	this.isLFO = false;
	this.fixedFreq = 1.0;
	this.name = '';
	this.phase = phase;
	this.customeWave = getPhaseShiftedSawWave(ac, this.phase);

	this.start = (frequency, gainNode) => {
		const freq = this.isLFO ? this.fixedFreq : frequency;
		// You have to make a new osc every time
		const osc = new OscillatorNode(ac, { /* type: this.type, */ detune: this.detune, frequency: freq });
		console.log('OSCSC', osc);
		osc.setPeriodicWave(this.customeWave);

		//osc.onended = () => console.log('the end');
		gainNode.gain.value = this.gain;
		osc.connect(gainNode);
		osc.start();

		if (this.gainEnvelope) this.gainEnvelope.start(gainNode.gain, 0.0, this.gain);
		if (this.pitchEnvelope) this.pitchEnvelope.start(osc.detune, this.detune, 1200.0);

		return osc;
	}
	this.stop = (time, osc, gainNode) => {
		if (this.gainEnvelope) {
			this.gainEnvelope.stop(gainNode.gain, 0.0);
			this.pitchEnvelope?.stop(osc.detune, this.detune);
			osc.stop(time + this.gainEnvelope.getRelease());
		}
		else osc.stop(time);
	}
}


var oscarGainPoints = [
	{ value: 1.0, time: 0.001 },
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.8 },
	{ value: 0.0, time: 1.0 },
];

var osmanGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.9 },
	{ value: 0.0, time: 1.0 },
];

var pitchPoints = [
	{ value: 0.0, time: 0.0 },
	{ value: 0.0, time: 0.3 },
	{ value: 0.0, time: 0.5 },
];

//TODO: Experiment with multiplying gain by 2^(12/tone)

function Synth(ac) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 1.0;

	this.connect = (audioNode) => this.gain.connect(audioNode);

	this.oscillators = []; /* [
		new Oscillator(ac, 'square', 0.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), null, 0.0),
		new Oscillator(ac, 'sine', 0.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), 0, 0.0),
	]; */
	for (let i = -6; i < 6; i++) { // SUPERSAAAAAAW
		const mul = i % 6;
		const detune = mul * mul;
		const phase = mul * mul;
		this.oscillators.push(new Oscillator(ac, 'sawtooth', detune, new ArrayEnvelope(ac, osmanGainPoints, 0.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), null, phase))
	}
	
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
		return this.oscillators.push(new Oscillator(
			ac,
			'sine',
			0.0,
			new ArrayEnvelope(ac, osmanGainPoints, 0.0),
			new ArrayEnvelope(ac, pitchPoints, 1200.0),
			null
		));
	}
}