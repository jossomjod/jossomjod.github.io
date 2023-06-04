
/* 
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
} */

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


const waveforms = ['square', 'sine', 'sawtooth', 'triangle'];


function Oscillator(ac, connectTo, type = 'square', detune = 0.0, gain = 1.0, gainEnvelope) {
	this.osc; // TODO: Add auxilliary oscs for whatever
	this.type = type;
	this.detune = detune;

	this.gainNode = ac.createGain();
	this.gainNode.gain.value = gain;
	this.gainEnvelope = gainEnvelope;

	this.fmod = null; // Oscillator | null
	this.amod = null;
	this.pmod = null;

	if (connectTo) this.gainNode.connect(connectTo);

	this.connect = (node) => {
		this.gainNode.connect(node);
	}
	this.start = (frequency) => {
		// You have to make a new osc every time
		this.osc = new OscillatorNode(ac, { type: this.type, detune: this.detune, frequency });

		if (this.fmod) this.fmod.connect(this.osc.frequency);

		this.osc.onended = () => console.log('the end');
		this.osc.connect(this.gainNode);
		this.osc.start();

		if (this.gainEnvelope) this.gainEnvelope.start(this.gainNode.gain);
	}
	this.stop = (time) => {
		if (this.gainEnvelope) {
			this.gainEnvelope.stop(this.gainNode.gain);
			this.osc.stop(time + this.gainEnvelope.release);
		}
		else this.osc.stop(time);
	}
}



function generateGainPoints() {
	return [
		{ value: 1.0, time: 0.001 },
		{ value: 0.6, time: 0.2 },
		{ value: 0.4, time: 2.3 },
	];
}

function Synth(ac, connectTo) {
	this.playing = false;
	this.gain = ac.createGain();
	this.gain.gain.value = 0.4;
	this.gain.connect(connectTo);
	this.gainEnv = new ArrayEnvelope(ac, generateGainPoints(), 0.1, this.gain.gain.value);


	this.oscar = new Oscillator(ac, this.gain, 'sine', 0.0, 1.0);
	this.osiris = new Oscillator(ac, null, 'sine', 10.0, 1000.0);

	this.oscar.fmod = this.osiris;

	
	this.start = (freq) => {
		if (this.playing) return;
		this.playing = true;
		this.gainEnv.start(this.gain.gain);

		this.oscar.start(freq);
		this.osiris.start(freq);
	};
	
	this.stop = () => {
		if (!this.playing) return;
		this.playing = false;
		this.gainEnv.stop(this.gain.gain);

		this.oscar.stop(ac.currentTime + this.gainEnv.release);
		this.osiris.stop(ac.currentTime + this.gainEnv.release);
	};
}


function SynthHandler(ac, connectTo) {
	this.synths = [];
	for (let i = 0; i < 16; i++) {
		this.synths.push(new Synth(ac, connectTo));
	}

	this.start = (freq) => {
		let id = 0
		const synth = this.synths.find((s, i) => {
			id = i;
			return !s.playing;
		});
		if (!synth) return null;
		synth.start(freq);
		return id;
	}

	this.stop = (id) => {
		if (id === null) return;
		this.synths[id].stop();
	}
}