function EnvelopePoint(value, time) {
	this.value = value;
	this.time = time;
}


/**
* points: { value: number, time: number }[]
*/
function ArrayEnvelope(ac, points = [], multiplier = 1.0) {
	this.points = points.slice();
	this.multiplier = multiplier;

	this.getRelease = () => this.points.at(-1).time - this.points.at(-2).time;

	// Call this when starting a note. prop must be an AudioParam.
	this.start = (prop, base = 0.0, mult = this.multiplier, startTime = ac.currentTime) => {
		if (!prop) return;
		prop.cancelScheduledValues(startTime);
		prop.setValueAtTime(base, startTime);

		this.points.forEach((p) => {
			if (p === this.points.at(-1)) return;
			prop.linearRampToValueAtTime(base + p.value * mult, startTime + p.time);
		});
	};

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop, base = 0.0) => {
		if (!prop) return;
		const endValue = base + this.points.at(-1).value * this.multiplier;
		prop.cancelScheduledValues(ac.currentTime);
		prop.linearRampToValueAtTime(endValue, ac.currentTime + this.getRelease());
	};

	this.schedulePlayback = (prop, base = 0.0, mult = this.multiplier, startTime = ac.currentTime, duration = 1) => {
		if (!prop) return;
		prop.setValueAtTime(base, startTime);

		const endTime = startTime + duration;
		const endValue = base + this.points.at(-1).value * this.multiplier;

		let prevVal = base;

/* 
		const pts = this.points.filter((p, i) => p.time < duration && i !== this.points.length - 1);
		pts.forEach((p) => {
			prop.linearRampToValueAtTime(base + p.value * mult, startTime + p.time);
		}); */


		for (let i = 0; i < this.points.length-1; i++) {
			const p = this.points[i];
			if (p.time >= duration) {
				const endVal = lerp(p.value, prevVal, (p.time - duration) / duration);
				prop.linearRampToValueAtTime(base + endVal * mult, endTime);
				break;
			}
			prop.linearRampToValueAtTime(base + p.value * mult, startTime + p.time);
			prevVal = p.value;
		};
		const sustain = this.points.at(-2);
		if (sustain.time < duration) {
			prop.linearRampToValueAtTime(sustain.value, endTime);
		}
		prop.linearRampToValueAtTime(endValue, endTime + this.getRelease());
	};
}


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];

// The web audio API doesn't support phase-shifting the oscillator
// so we need to generate each waveform with a phase offset
function getPhaseShiftedSawWave(ac, phaseOffset = 0.0) {
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);
	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i <= numHarmonics-1; i++) {
		imag[i] = ((-1) ** (i + 1)) * (2 / (i * Math.PI + phaseOffset));
	}
	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedSquareWave(ac, phaseOffset = 0.0) {
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i <= numHarmonics-1; i++) {
		imag[i] = (2 / ((i + phaseOffset) * Math.PI)) * (1 - (-1) ** i);
	}
	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedTriangleWave(ac, phaseOffset = 0.0) {
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i <= numHarmonics-1; i++) {
		const pii = (i + phaseOffset) * Math.PI;
		imag[i] = (8 * Math.sin(pii / 2)) / pii ** 2;
	}
	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedSineWave(ac, phaseOffset = 0.0) {
	const numHarmonics = 2;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = 0 + phaseOffset;
	imag[0] = 0;
	real[1] = 1 - phaseOffset;
	imag[1] = 0;

	return ac.createPeriodicWave(real, imag);
}

function getPeriodicWave(ac, type = 'sawtooth', phase) {
	switch (type) {
		case 'sawtooth':
			return getPhaseShiftedSawWave(ac, phase);
		case 'square':
			return getPhaseShiftedSquareWave(ac, phase);
		case 'triangle':
			return getPhaseShiftedTriangleWave(ac, phase);
		case 'sine':
		default:
			return getPhaseShiftedSineWave(ac, phase);
	}
}




function Oscillator(ac, type = 'square', detune = 0.0, gainEnvelope, pitchEnvelope, mod, phase) {
	this.type = type;
	this.detune = detune;
	this.gain = 1.0;
	this.gainEnvelope = gainEnvelope;
	this.pitchEnvelope = pitchEnvelope;
	this.modType = 0; // 0: FM, 1: AM
	this.mod = mod;
	this.isCarrier = () => this.mod === null;
	this.isLFO = false;
	this.fixedFreq = 1.0;
	this.name = '';
	this.phase = phase;
	this.customeWave;

	this.setWave = (waveform) => {
		this.type = waveform;
		this.customeWave = getPeriodicWave(ac, waveform, this.phase);
	}
	this.setWave(type);

	this.setPhase = (phs) => {
		this.phase = phs;
		this.customeWave = getPeriodicWave(ac, this.type, this.phase);
	}

	this.start = (frequency, gainNode, time = ac.currentTime) => {
		const freq = this.isLFO ? this.fixedFreq : frequency;
		// You have to make a new osc every time
		const osc = new OscillatorNode(ac, { /* type: this.type, */ detune: this.detune, frequency: freq });
		osc.setPeriodicWave(this.customeWave);

		//osc.onended = () => console.log('the end');
		gainNode.gain.value = this.gain;
		osc.connect(gainNode);
		osc.start(time);

		this.gainEnvelope?.start(gainNode.gain, 0.0, this.gain, time);
		this.pitchEnvelope?.start(osc.detune, this.detune, 1200.0, time);

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

	this.schedulePlayback = (frequency, gainNode, startTime = ac.currentTime, duration = 1) => {
		const freq = this.isLFO ? this.fixedFreq : frequency;
		const osc = new OscillatorNode(ac, { detune: this.detune, frequency: freq });
		osc.setPeriodicWave(this.customeWave);

		gainNode.gain.value = this.gain;
		osc.connect(gainNode);
		osc.start(startTime);

		this.gainEnvelope?.schedulePlayback(gainNode.gain, 0.0, this.gain, startTime, duration);
		this.pitchEnvelope?.schedulePlayback(osc.detune, this.detune, 1200.0, startTime, duration);

		const endTime = startTime + duration;
		if (this.gainEnvelope) {
			osc.stop(endTime + this.gainEnvelope.getRelease());
		}
		else osc.stop(endTime);

		return osc;
	}
}


var oscarGainPoints = [
	{ value: 1.0, time: 0.001 },
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.8 },
	{ value: 0.0, time: 0.81 },
];

var osmanGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 1.0, time: 0.3 },
	{ value: 1.0, time: 0.9 },
	{ value: 0.0, time: 0.91 },
];

var pitchPoints = [
	{ value: 0.0, time: 0.0 },
	{ value: 0.0, time: 0.3 },
	{ value: 0.0, time: 0.5 },
];


function Synth(ac, output) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 1.0;
	this.oscillators = [];
	this.preset;// = 'phase_saws';// 'supersaw';

	this.connect = (audioNode) => this.gain.connect(audioNode);
	if (output) this.connect(output);

	this.applyPreset = (preset = this.preset) => {
		switch(preset) {
			case 'supersaw':
				this.oscillators = this.generateSupersaw(5);
				break;
			case 'phase_saws':
				this.oscillators = [
					new Oscillator(ac, 'sawtooth', 0.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), null, -0.1),
					new Oscillator(ac, 'sawtooth', 0.0, new ArrayEnvelope(ac, oscarGainPoints, 0.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), null, 0.2),
				];
				break;
			default:
				this.oscillators = [
					new Oscillator(ac, 'square', 0.0, new ArrayEnvelope(ac, oscarGainPoints, 1.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), null, 0.0),
					new Oscillator(ac, 'sine', 0.0, new ArrayEnvelope(ac, osmanGainPoints, 0.0), new ArrayEnvelope(ac, pitchPoints, 1200.0), 0, 0.0),
				];
		}
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
				const modType = this.oscillators[i].modType;
				if (modType === 1) t.gain.connect(oscs[mod].gain.gain);
				else t.gain.connect(oscs[mod].oscillator.frequency);
			} else {
				t.gain.connect(this.gain);
			}
		});

		return oscs;
	};
	
	this.stop = (oscs, time = ac.currentTime) => {
		oscs.forEach((o, i) => this.oscillators[i]?.stop(time, o.oscillator, o.gain));
	};

	this.schedulePlayback = ({ startTime, duration, freq }) => {
		const oscs = this.oscillators.map((osc) => {
			const gain = ac.createGain();
			const oscillator = osc.schedulePlayback(freq, gain, startTime, duration);
			return { gain, oscillator };
		});

		oscs.forEach((t, i) => {
			const mod = this.oscillators[i].mod;
			if (mod !== null && typeof mod === 'number') {
				const modType = this.oscillators[i].modType;
				if (modType === 1) t.gain.connect(oscs[mod].gain.gain);
				else t.gain.connect(oscs[mod].oscillator.frequency);
			} else {
				t.gain.connect(this.gain);
			}
		});
		return oscs;
	};

	this.addOsc = () => {
		return this.oscillators.push(new Oscillator(
			ac,
			'sine',
			0.0,
			new ArrayEnvelope(ac, osmanGainPoints, 0.0),
			new ArrayEnvelope(ac, pitchPoints, 1200.0),
			null,
			0.0
		));
	}

	this.generateSupersaw = (numOsc = 5) => {
		const oscs = [];
		for (let i = -numOsc; i < numOsc; i++) {
			let mul = i % numOsc;
			const detune = mul * mul;
			const phase = mul * mul + Math.random() * 0.01;
			oscs.push(new Oscillator(
				ac,
				'sawtooth',
				detune,
				new ArrayEnvelope(ac, oscarGainPoints, 0.0),
				new ArrayEnvelope(ac, pitchPoints, 1200.0),
				null,
				phase
			));
		}
		return oscs;
	}

	this.applyPreset();
}