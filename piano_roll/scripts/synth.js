

function Synth(ac) {
	
	this.oscAmount    = 2;
	this.oscs         = [];
	this.detuneValues = [3, -3];
	this.gain         = ac.createGain();
	this.gain.gain.value = 0.0;
	
	
	this.start = (connectTo, freq, gain) => {
		
		this.gain.gain.value = gain || 0.0;
		this.gain.connect(connectTo);
		
		
		this.oscs[0] = ac.createOscillator();
		this.oscs[1] = ac.createOscillator();
		this.oscs[0].type = "square";
		this.oscs[1].type = "sine";
		
		
		for (let o = 0; o < this.oscAmount; o++) {
		
			this.oscs[o].frequency.value = freq;
			this.oscs[o].detune.value = this.detuneValues[o];
			
			
			this.oscs[o].connect(this.gain);
			
			this.oscs[o].start();
		}
	};
	
	
	this.update = (freq, gain) => {
		
		this.gain.gain.value = gain || 0.0;
		
		for (let o in this.oscs) {
		
			this.oscs[o].frequency.value = freq;
		}
	};
	
	
	this.stop = () => {
	
		for (let o in this.oscs) {
		
			this.oscs[o].stop();
		}
	};
}

