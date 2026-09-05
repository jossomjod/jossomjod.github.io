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

	//TODO: use points passed in from note. Get those points from the env and cut out nodes that don't fit the note-length
	this.schedulePlayback = (prop, base = 0.0, mult = this.multiplier, startTime = ac.currentTime, duration = 1) => {
		if (!prop) return;
		prop.setValueAtTime(base, startTime);

		const endTime = startTime + duration;
		const endValue = base + this.points.at(-1).value * mult;

		let prevVal = base;

/*
		const pts = this.points.filter((p, i) => p.time < duration && i !== this.points.length - 1);
		pts.forEach((p) => {
			prop.linearRampToValueAtTime(base + p.value * mult, startTime + p.time);
		}); */


		for (let i = 0; i < this.points.length-1; i++) {
			const p = this.points[i];
			if (p.time >= duration) {
				const endVal = lerp(prevVal, p.value, (p.time - duration) / duration);
				prop.linearRampToValueAtTime(base + endVal * mult, endTime);
				break;
			}
			prop.linearRampToValueAtTime(base + p.value * mult, startTime + p.time);
			prevVal = p.value;
		};
		const sustain = this.points.at(-2);
		if (sustain.time < duration) {
			prop.linearRampToValueAtTime(base + sustain.value, endTime);
		}
		prop.linearRampToValueAtTime(endValue, endTime + this.getRelease());
	};
}


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];

// The web audio API doesn't support phase-shifting the oscillator
// so we need to generate each waveform with a phase offset
function getPhaseShiftedSawWave(audioContext, phaseOffset = 0.0) {
	const phase = phaseOffset * Math.PI * 2;
	const numberOfHarmonics = 30;
	const real = new Float32Array(numberOfHarmonics);
	const imag = new Float32Array(numberOfHarmonics);
	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i < numberOfHarmonics; i++) {
		imag[i] = -(1 ** (i + 1)) * (2 / (i * Math.PI));
		real[i] = -imag[i] * Math.sin(phase);
		imag[i] *= Math.cos(phase);
	}
	return audioContext.createPeriodicWave(real, imag);
}

function getPhaseShiftedSquareWave(ac, phaseOffset = 0.0) {
	const phase = phaseOffset * Math.PI * 2;
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i < numHarmonics; i++) {
		imag[i] = (2 / (i * Math.PI)) * (1 - (-1) ** i);
		real[i] = -imag[i] * Math.sin(phase);
		imag[i] *= Math.cos(phase);
	}
	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedTriangleWave(ac, phaseOffset = 0.0) {
	const phase = phaseOffset * Math.PI * 2;
	const numHarmonics = 30;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = 0.0;
	imag[0] = 0.0;

	for (let i = 1; i < numHarmonics; i++) {
		const pii = i * Math.PI;
		imag[i] = (8 * Math.sin(pii / 2)) / pii ** 2;
		real[i] = -imag[i] * Math.sin(phase);
		imag[i] *= Math.cos(phase);
	}
	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedSineWave(ac, phaseOffset = 0.0) {
	const phase = phaseOffset * Math.PI * 2;
	const numHarmonics = 2;
	const real = new Float32Array(numHarmonics);
	const imag = new Float32Array(numHarmonics);

	real[0] = Math.cos(phase);
	imag[0] = Math.sin(phase);
	real[1] = Math.cos(phase);
	imag[1] = Math.sin(Math.PI * 2 + phase);

	return ac.createPeriodicWave(real, imag);
}

function getPhaseShiftedCustomWave(audioContext, harmonics, phaseOffset = 0.0) {
	const phase = phaseOffset * Math.PI * 2;
	const numberOfHarmonics = harmonics.imag.length;

	// Apply phase shift
	for (let i = 0; i < numberOfHarmonics; i++) {
		const tempReal = harmonics.real[i];
		harmonics.real[i] = tempReal * Math.cos(phase) - harmonics.imag[i] * Math.sin(phase);
		harmonics.imag[i] = tempReal * Math.sin(phase) + harmonics.imag[i] * Math.cos(phase);
	}
	return audioContext.createPeriodicWave(real, imag);
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
	this.mod1 = mod != null ? mod + 1 : 0;
	this.mod2 = 0;
	this.mod3 = 0;
	this.isCarrier = () => !this.mod1;
	this.isLFO = false;
	this.fixedFreq = 1.0;
	this.name = '';
	this.phase = phase ?? 0.0;
	this.customWave;
	this.customWaveform = getPeriodicWave(ac, 'sine', this.phase);
	this.pan = 0.0;
	this.rndGain = 0.0;
	this.rndPitch = 0.0;

	this.getPeriodicWave = (_type) => {
		if (_type === 'custom') return this.customWaveform;
		return getPeriodicWave(ac, _type, this.phase);
	};

	this.setWave = (waveform) => {
		this.type = waveform;
		this.customWave = this.getPeriodicWave(waveform);
	};
	this.setWave(this.type);

	this.setPhase = (phs) => {
		this.phase = phs;
		this.customWave = this.getPeriodicWave(this.type);
	};

	this.getGain = (gain = this.gain) => {
		return /* Math.random() * this.rndGain +  */gain;
	};

	this.getFreq = (freq) => {
		return freq + Math.random() * this.rndPitch * freq;
	};

	this.getFreeRelease = () => this.mod1 > 0;

	this.start = (frequency, gainNode, panner, onset = 1) => {
		const time = ac.currentTime;
		const freq = this.getFreq(this.isLFO ? this.fixedFreq : frequency);
		const gain = this.getGain(onset * this.gain);
		const osc = new OscillatorNode(ac, { detune: this.detune, frequency: freq });
		osc.setPeriodicWave(this.customWave);

		gainNode.gain.value = gain;
		osc.connect(panner).connect(gainNode);
		osc.start(time);

		this.gainEnvelope.start(gainNode.gain, 0.0, gain, time);
		this.pitchEnvelope.start(osc.detune, this.detune, 1200.0, time);

		return osc;
	}

	this.stop = (osc, gainNode) => {
		const time = ac.currentTime;
		this.gainEnvelope.stop(gainNode.gain, 0.0);
		this.pitchEnvelope.stop(osc.detune, this.detune);
		osc.stop(time + this.gainEnvelope.getRelease());
	}

	this.restart = ({ oscillator, gain }, onset = 1) => {
		const time = ac.currentTime;
		this.gainEnvelope.start(gain.gain, 0.0, this.getGain(onset * this.gain), time);
		this.pitchEnvelope.start(oscillator.detune, this.detune, 1200.0, time);
	}



	this.startWithFixedProperties = ({ frequency, gainNode, panner, detune, gain, pan }) => {
		const freq = this.getFreq(this.isLFO ? this.fixedFreq : frequency);
		const thisGain = this.getGain();
		const osc = new OscillatorNode(ac, { detune: this.detune + (detune ?? 0), frequency: freq });
		osc.setPeriodicWave(this.customWave);

		gainNode.gain.value = thisGain * (gain ?? 1);
		panner.pan = (pan ?? 0);
		osc.connect(panner).connect(gainNode);
		osc.start(ac.currentTime);

		return osc;
	}

	this.updateFixedProperties = ({ osc, gainNode, panner, gain, pan, detune }) => {
		const thisGain = this.gain;
		osc.detune.setValueAtTime(this.detune + (detune ?? 0), ac.currentTime);
		gainNode.gain.setValueAtTime(thisGain * (gain ?? 1), ac.currentTime);
		panner.pan.setValueAtTime(pan ?? 0, ac.currentTime);
	};

	this.stopWithFixedProperties = (osc) => {
		osc.stop(ac.currentTime);
	}

	this.schedulePlayback = (ac, frequency, gainNode, panner, startTime = ac.currentTime, duration = 1) => {
		const freq = this.getFreq(this.isLFO ? this.fixedFreq : frequency);
		const gain = this.getGain();
		const osc = new OscillatorNode(ac, { detune: this.detune, frequency: freq });
		osc.setPeriodicWave(this.customWave);

		gainNode.gain.value = gain;
		osc.connect(panner).connect(gainNode);
		osc.start(startTime);

		this.gainEnvelope.schedulePlayback(gainNode.gain, 0.0, gain, startTime, duration);
		this.pitchEnvelope.schedulePlayback(osc.detune, this.detune, 1200.0, startTime, duration);

		const endTime = startTime + duration;
		osc.stop(endTime + this.gainEnvelope.getRelease());

		return osc;
	}

	this.schedulePlaybackWithAutomation = (ac, frequency, gainNode, panner, startTime = ac.currentTime, duration = 1, automation, bpm) => {
		const freq = this.getFreq(this.isLFO ? this.fixedFreq : frequency);
		const gain = this.getGain();
		const osc = new OscillatorNode(ac, { detune: this.detune, frequency: freq });
		osc.setPeriodicWave(this.customWave);

		let endTime = startTime + duration;

		gainNode.gain.value = gain;
		osc.connect(panner).connect(gainNode);
		osc.start(startTime);


		gainNode.gain.setValueAtTime(0, startTime);

		if (automation.gain?.length) {
			automation.gain.forEach((g) => {
				const time = beatsToSeconds(g.time, bpm);
				if (time <= duration) gainNode.gain.linearRampToValueAtTime(g.value * gain, time + startTime);
			});
		} else {
			this.gainEnvelope.schedulePlayback(gainNode.gain, 0.0, gain, startTime, duration);
			endTime += this.gainEnvelope.getRelease();
		}

		if (automation.pitch?.length) {
			automation.pitch.forEach((p) => {
				osc.detune.linearRampToValueAtTime(this.detune + p.value * 100, beatsToSeconds(p.time, bpm) + startTime);
			});
		} else {
			this.pitchEnvelope.schedulePlayback(osc.detune, this.detune, 1200.0, startTime, duration);
		}

		automation.pan?.forEach((p) => {
			panner.pan.linearRampToValueAtTime(p.value, beatsToSeconds(p.time, bpm) + startTime);
		});

		osc.stop(endTime);

		return osc;
	}

	this.createEnvelopeFromObject = (obj) => {
		if (!obj) return undefined;
		return new ArrayEnvelope(ac, Object.values(obj.points), obj.multiplier);
	};

	this.save = () => {
		return makeSerializable(this);
	};
	this.load = (data) => {
		if (data.mod1 === undefined) {
			data.mod1 = data.mod != null ? data.mod + 1 : 0;
			data.mod2 = data.mod3 = 0;
		}
		data.gainEnvelope = this.createEnvelopeFromObject(data.gainEnvelope);
		data.pitchEnvelope = this.createEnvelopeFromObject(data.pitchEnvelope);
		Object.assign(this, data);
		this.setWave(this.type);
		return this;
	};
}


const oscarGainPoints = [
	{ value: 1.0, time: 0.001 },
	{ value: 1.0, time: 0.8 },
	{ value: 0.0, time: 0.81 },
];

const osmanGainPoints = [
	{ value: 1.0, time: 0.0 },
	{ value: 1.0, time: 0.9 },
	{ value: 0.0, time: 0.91 },
];

const pitchPoints = [
	{ value: 0.0, time: 0.0 },
	{ value: 0.0, time: 0.5 },
];


// TODO: move to separate file

class Automation {
	/** @type {number} */
	time;
	/** @type {number} */
	number;
}

class SynthFx {
	/** @type {AudioNode} */
	destination;
	/** @type {AudioNode} */
	source;
	properties = {};
	constructor(properties, destination, source) {
		this.properties = properties;
		this.destination = destination;
		this.source = source;
	}
	/**
 * @param {AudioContext} ac
 * @param {number} time
 * @param {{ [string]: Automation[] }} automations
 */
	start(ac, time, automations) {}
	/**
 * @param {AudioContext} ac
 * @param {number} time
 */
	stop(ac, time) {}
	/**
 * @param {string} name
 * @param {string | number} value
 */
	setProperty(name, value) {
		this.properties[name] = value;
	}
}

const synthFilterObjectPool = {
	available: 0,
	pool: [],
	get: (props) => {
		if (!available) {
			pool.push(new BiquadFilterNode(props));
			return pool.at(-1);
		}
		Object.assign(pool[0], props);
		return pool[0];
	}
}

class SynthFxFilter extends SynthFx {

	start(ac, time, automations) {
		const fx = new BiquadFilterNode(ac, this.properties); // TODO: object pool maybe?
		Object.entries(automations).forEach(([key, automation]) => {
			automation.forEach((a) => {
				fx[key].linearRampToValueAtTime(a.value, time + a.time);
			});
		});
		this.source.connect(fx).connect(this.destination);
	}
}


function Synth(acc, output, fromObject) {
	this.playing = false;
	this.gain = new GainNode(acc, { value: 1 });
	this.oscillators = [];
	this.effects = []; // TODO
	this.preset;// = 'phase_saws';// 'supersaw';

	this.connect = (audioNode) => {
		this.gain.connect(audioNode);
	};

	this.applyPreset = (preset = this.preset) => {
		switch(preset) {
			case 'supersaw':
				this.oscillators = this.generateSupersaw(5);
				break;
			case 'phase_saws':
				this.oscillators = [
					new Oscillator(acc, 'sawtooth', 0.0, new ArrayEnvelope(acc, oscarGainPoints, 1.0), new ArrayEnvelope(acc, pitchPoints, 600.0), null, -0.1),
					new Oscillator(acc, 'sawtooth', 0.0, new ArrayEnvelope(acc, oscarGainPoints, 0.0), new ArrayEnvelope(acc, pitchPoints, 600.0), null, 0.2),
				];
				break;
			default:
				this.oscillators = [
					new Oscillator(acc, 'square', 0.0, new ArrayEnvelope(acc, oscarGainPoints, 1.0), new ArrayEnvelope(acc, pitchPoints, 600.0), null, 0.0),
					new Oscillator(acc, 'sine', 0.0, new ArrayEnvelope(acc, oscarGainPoints, 1.0), new ArrayEnvelope(acc, pitchPoints, 600.0), 0, 0.0),
				];
		}
	}


	this.start = (freq, onset = 1) => {
		const oscs = this.oscillators.map((osc) => {
			const gain = acc.createGain();
			const pan = new StereoPannerNode(acc, { pan: osc.pan });
			const oscillator = osc.start(freq, gain, pan, !osc.mod1 ? onset : undefined);
			return { gain, oscillator };
		});

		oscs.forEach((t, i) => {
			let mod = this.oscillators[i].mod1;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			} else {
				t.gain.connect(this.gain);
			}

			mod = this.oscillators[i].mod2;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}

			mod = this.oscillators[i].mod3;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}
		});

		return oscs;
	};

	this.stop = (oscs) => {
		oscs.forEach((o, i) => {
			this.oscillators[i]?.stop(o.oscillator, o.gain);
		});
	};

	this.restart = (oscs, onset = 1) => {
		oscs.forEach((o, i) => this.oscillators[i]?.restart(o, onset));
	}

	this.startWithFixedProperties = (frequency, properties) => {
		const oscs = this.oscillators.map((osc, i) => {
			const gainNode = acc.createGain();
			const panner = new StereoPannerNode(acc, { pan: osc.pan });
			const oscillator = osc.startWithFixedProperties({ frequency, gainNode, panner, ...properties[i] });
			return { gain: gainNode, oscillator, panner };
		});

		oscs.forEach((t, i) => {
			let mod = this.oscillators[i].mod1;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			} else {
				t.gain.connect(this.gain);
			}

			mod = this.oscillators[i].mod2;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}

			mod = this.oscillators[i].mod3;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}
		});

		return oscs;
	};

	this.updateFixedProperties = (oscillators, properties) => {
		oscillators.forEach((o, i) => {
			const osc = o.oscillator;
			const gainNode = o.gain;
			const panner = o.panner;
			this.oscillators[i]?.updateFixedProperties({ osc, gainNode, panner, ...properties[i] });
		});
	};

	this.stopWithFixedProperties = (oscs) => {
		oscs.forEach((o, i) => {
			this.oscillators[i]?.stopWithFixedProperties(o.oscillator);
		});
	};

	this.schedulePlayback = ({ context, startTime, duration, freq, automations, bpm, monoPitch }) => {
		const aco = context ?? acc;
		const oscs = this.oscillators.map((osc, i) => {
			const gain = aco.createGain();
			const pan = new StereoPannerNode(aco, { pan: osc.pan });
			let automation = automations?.[i];
			let oscillator;

			if (monoPitch) {
				if (automation) {
					automation.pitch = automations[0].pitch;
					if (osc.mod1 === 0) automation.gain = automations[0].gain;
				} else {
					automation = automations?.[0];
				}
			}
			if (automation) {
				oscillator = osc.schedulePlaybackWithAutomation(aco, freq, gain, pan, startTime, duration, automation, bpm);
			} else {
				oscillator = osc.schedulePlayback(aco, freq, gain, pan, startTime, duration);
			}
			return { gain, oscillator };
		});

		oscs.forEach((t, i) => {
			let mod = this.oscillators[i].mod1;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			} else {
				t.gain.connect(this.gain);
			}

			mod = this.oscillators[i].mod2;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}

			mod = this.oscillators[i].mod3;
			if (mod) {
				mod--;
				const modType = this.oscillators[i].modType;
				switch (modType) {
					case 1: t.gain.connect(oscs[mod].gain.gain); break;
					case 2: t.gain.connect(oscs[mod].gain); break;
					default: t.gain.connect(oscs[mod].oscillator.frequency); break;
				}
			}
		});
		return oscs;
	};

	this.addOsc = () => {
		return this.oscillators.push(new Oscillator(
			acc,
			'sine',
			0.0,
			new ArrayEnvelope(acc, oscarGainPoints, 0.0),
			new ArrayEnvelope(acc, pitchPoints, 600.0),
			null,
			0.0
		));
	}

	this.generateSupersaw = (numOsc = 5, spread = 20) => {
		const oscs = [];
		for (let i = -numOsc; i < numOsc; i++) {
			let mul = i / numOsc;
			const detune = mul * mul * spread;
			const phase = mul * mul + mul < 0 ? -0.01 : 0.03;
			oscs.push(new Oscillator(
				acc,
				'sawtooth',
				detune,
				new ArrayEnvelope(acc, oscarGainPoints, 0.0),
				new ArrayEnvelope(acc, pitchPoints, 600.0),
				null,
				phase
			));
		}
		return oscs;
	}

	this.createOscillatorFromObject = (obj) => {
		const osc = new Oscillator(acc);
		return osc.load(obj);
	};

	this.save = () => {
		return { oscillators: this.oscillators.map((o) => o.save()) };
	};
	this.load = (data) => {
		this.oscillators = data.oscillators.map((o) => this.createOscillatorFromObject(o));
		this.effects = data.effects ?? [];
	};

	if (fromObject) {
		this.load(fromObject);
	} else this.applyPreset();
	if (output) this.connect(output);
}
