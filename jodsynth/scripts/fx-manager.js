



function ReverbManager2(ac, input, output, reverb) {
	this.reverbGain = ac.createGain();
	this.reverbGain.gain.value = reverb;
	this.reverb = ac.createConvolver();
	this.reverb.buffer = createNoiseBuffer2(ac);

	input.connect(output);
	input.connect(this.reverb).connect(this.reverbGain).connect(output);
}


function createNoiseBuffer2(ac) {
	const bufferSize = ac.sampleRate * 2.0;
	const buford = ac.createBuffer(2, bufferSize, ac.sampleRate);
	const bufL = buford.getChannelData(0);
	const bufR = buford.getChannelData(1);
	for (let i = 0; i < bufferSize; i++) {
		bufL[i] = Math.random() * 2 - 1;
		bufR[i] = Math.random() * 2 - 1;
	}
	return buford;
}

// COPYPASTA
function setupReverb() {
	this.effect = this.context.createConvolver();

	this.reverbTime = reverbTime;

	this.attack = 0;
	this.decay = 0.0;
	this.release = reverbTime/3;

	this.preDelay = this.context.createDelay(reverbTime);
	this.preDelay.delayTime.setValueAtTime(preDelay,    this.context.currentTime);
	this.multitap = [];
	for(let i = 2; i > 0; i--) {
		this.multitap.push(this.context.createDelay(reverbTime));
	}
	this.multitap.map((t,i)=>{
		if(this.multitap[i+1]) {
			t.connect(this.multitap[i+1])
		}
		t.delayTime.setValueAtTime(0.001+(i*(preDelay/2)), this.context.currentTime);
	})

	this.multitapGain = this.context.createGain();
	this.multitap[this.multitap.length-1].connect(this.multitapGain);
	this.multitapGain.gain.value = 0.2;

	this.multitapGain.connect(this.output);
	this.wet = this.context.createGain();

	this.input.connect(this.wet);
	this.wet.connect(this.preDelay);
	this.wet.connect(this.multitap[0]);
	this.preDelay.connect(this.effect);
	this.effect.connect(this.output);

	this.renderTail();
}

// COPYPASTA
function renderTail () {
	const tailContext = new OfflineAudioContext(2, this.context.sampleRate * this.reverbTime, this.context.sampleRate);
	const tailOsc = new Noise(tailContext, 1);
	const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
	const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

	tailOsc.init();
			tailOsc.connect(tailHPFilter.input);
			tailHPFilter.connect(tailLPFilter.input);
			tailLPFilter.connect(tailContext.destination);
			tailOsc.attack = this.attack;
			tailOsc.decay = this.decay;
			tailOsc.release = this.release;

	setTimeout(()=>{
		tailContext.startRendering().then((buffer) => {
			this.effect.buffer = buffer;
		});

		tailOsc.on({frequency: 500, velocity: 127});
		tailOsc.off();
	}, 20)
}



/**
 * @param {AudioContext} ac 
 */
function ReverbEffect(ac, values = {}) {
	this.values = values;
	this.reverb = ac.createConvolver();
	this.wet = ac.createGain();
	this.input = ac.createGain();
	this.preDelay = ac.createDelay(3);

	this.connect = (destination) => {

	};

	this.save = () => this.values;
	this.load = (_values) => {
		this.values = _values;
	};
	this.load(values);
}

// COPYPASTA
ReverbEffect.prototype.renderTail = () => {
	const tailContext = new OfflineAudioContext(2, this.context.sampleRate * this.reverbTime, this.context.sampleRate);
	const tailOsc = new Noise(tailContext, 1);
	const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
	const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

	tailOsc.init();
	tailOsc.connect(tailHPFilter.input);
	tailHPFilter.connect(tailLPFilter.input);
	tailLPFilter.connect(tailContext.destination);
	tailOsc.attack = this.attack;
	tailOsc.decay = this.decay;
	tailOsc.release = this.release;

	setTimeout(()=>{
		tailContext.startRendering().then((buffer) => {
			this.effect.buffer = buffer;
		});

		tailOsc.on({frequency: 500, velocity: 127});
		tailOsc.off();
	}, 20)
};





function FxManager(ac) {
	this.fxChain = [];

	this.connect = (destination) => {

	};
}