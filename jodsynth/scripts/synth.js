



function Envelope(ac, att, dec, sus, rel, multiplier) {
    
	this.attack  = att || new Vector2(0.01, 1.0);
	this.decay   = dec || new Vector2(0.3, 0.7);
	this.sustain = sus || new Vector2(0.6, 0.5);
	this.release = rel || 0.1;
	
	this.multiplier = multiplier || 1.0;
	
	this.prop;
	
	// Call this when starting a note. prop must be an AudioParam.
	this.begin = function(prop, mult) {
		this.prop = prop;
		let m = mult || this.multiplier;
		
		this.prop.cancelScheduledValues(ac.currentTime);
		this.prop.setValueAtTime(0, ac.currentTime);

		// Set attack:
		this.prop.linearRampToValueAtTime(
			this.attack.y * m, ac.currentTime + this.attack.x
		);
		// Set decay:
		this.prop.linearRampToValueAtTime(
			this.decay.y * m,
			ac.currentTime + this.attack.x + this.decay.x
		);
		// Set sustain:
		this.prop.linearRampToValueAtTime(
			this.sustain.y * m, ac.currentTime
			+ this.attack.x + this.decay.x + this.sustain.x
		);
	};
	
	
	// Call this when ending a note.
	this.end = function() {
		this.prop.linearRampToValueAtTime(
				0, ac.currentTime + this.release
		);
	};
}

/**
* points: { value: number, time: number }[]
*/
function ArrayEnvelope(ac, points = [], release = 0.0, multiplier = 1.0) {
	this.points = points;
	this.release = release;
	this.multiplier = multiplier;

	// Call this when starting a note. prop must be an AudioParam.
	this.start = (prop, mult = this.multiplier) => {
		if (!prop) return;
		let acc = ac.currentTime;
		prop.cancelScheduledValues(acc);
		prop.setValueAtTime(0, acc);

		points.forEach((p) => {
			acc += p.time;
			prop.linearRampToValueAtTime(p.value * mult, acc);
		});
	}

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop) => {
		if (!prop) return;
		prop.linearRampToValueAtTime(0, ac.currentTime + this.release);
	}
}





function Oscillator(ac, type = 'square', detune = 0.0, gain = 1.0, gainEnvelope) {
	this.osc;
	this.gainNode = ac.createGain();
	this.gainNode.gain.value = gain;
	this.gainEnvelope = gainEnvelope;

	this.connect = (node) => {
		this.gainNode.connect(node);
	}
	this.start = (freq) => {
		this.osc = ac.createOscillator(); // You have to make a new osc every time
		this.osc.type = type;
		this.osc.detune = detune;
		this.osc.frequency.value = freq;
		this.osc.connect(this.gainNode);
		this.osc.start();

		if (this.gainEnvelope) this.gainEnvelope.start(this.gainNode.gain);
	}
	this.stop = (time) => {
		this.osc.stop(time);
	}
}



function generateGainPoints() {
	return [
		{ value: 1.0, time: 0.1 },
		{ value: 0.7, time: 0.2 },
		{ value: 0.9, time: 2.3 },
	];
}

function Synth(ac, connectTo) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 0.2;
	this.gain.connect(connectTo);
	this.gainRelease = 0.6
	this.gainEnv = new ArrayEnvelope(ac, generateGainPoints(), this.gainRelease, this.gain.gain.value);

	this.oscillators = [
		new Oscillator(ac, 'sawtooth', 3.0, 1.0),
		new Oscillator(ac, 'sawtooth', -3.0, 1.0),
		new Oscillator(ac, 'sawtooth', -9.0, 0.8),
		new Oscillator(ac, 'sawtooth', 9.0, 0.8),
		new Oscillator(ac, 'sawtooth', -13.0, 0.9),
		new Oscillator(ac, 'sawtooth', 13.0, 0.9),
		new Oscillator(ac, 'sawtooth', -17.0, 0.7),
		new Oscillator(ac, 'sawtooth', 17.0, 0.7),
	];
	this.oscillators.forEach(o => o.connect(this.gain));
	
	
	this.start = (freq) => {
		if (this.playing) return;
		this.playing = true;
		this.gainEnv.start(this.gain.gain);
		this.oscillators.forEach(o => o.start(freq));
	};
	
	this.stop = () => {
		if (!this.playing) return;
		this.playing = false;
		this.gainEnv.stop(this.gain.gain);
		this.oscillators.forEach(o => o.stop(ac.currentTime + this.gainRelease));
	};
}

