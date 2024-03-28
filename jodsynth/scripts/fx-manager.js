



function ReverbManager2(ac, input, output, reverb) {
	this.reverbGain = ac.createGain();
	this.reverbGain.gain.value = reverb;
	this.reverb = ac.createConvolver();
	this.reverb.buffer = createNoiseBuffer2(ac);

	input.connect(output);
	input.connect(this.reverb).connect(this.reverbGain).connect(output);
}


function createNoiseBuffer(ac, time) {
	const bufferSize = ac.sampleRate * time;
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



/**
 * @param {AudioContext} ac 
 */
function ReverbEffect(ac, params = { reverbTime: 2, preDelay: 0.22, wet: 0.5, dry: 0.5 }) {
	this.fxType = 'reverb';
	this.params = params;
	this.reverb = ac.createConvolver();
	this.wet = ac.createGain();
	this.dry = ac.createGain();
	this.preDelay = ac.createDelay(1);
	this.input = new GainNode(ac, { gain: 1 });
	this.timeOutId;

	this.connect = (destination) => {
		this.input.connect(this.dry).connect(destination);
		this.input
			.connect(this.preDelay)
			.connect(this.reverb)
			.connect(this.wet)
			.connect(destination);
		return destination;
	};

	this.setParam = (param, value) => {
		this.params[param] = value;

		switch (param) {
			case 'preDelay':
				this.preDelay.delayTime.setValueAtTime(this.params.preDelay, ac.currentTime);
				break;
			case 'wet':
				this.wet.gain.setValueAtTime(this.params.wet, ac.currentTime);
				break;
			case 'dry':
				this.dry.gain.setValueAtTime(this.params.dry, ac.currentTime);
				break;
			default:
				clearTimeout(this.timeOutId);
				this.timeOutId = setTimeout(() => {
					this.load(this.params);
				}, 400);

		}
	};

	this.renderTail = () => {
		const reverbTime = this.params.reverbTime;
		const tailAc = new OfflineAudioContext(2, ac.sampleRate * reverbTime, ac.sampleRate);
		const tailSource = new AudioBufferSourceNode(tailAc, {
			buffer: createNoiseBuffer(tailAc, reverbTime),
		});
		const gain = new GainNode(tailAc, { gain: 1 });

		tailSource.connect(gain).connect(tailAc.destination);
		gain.gain.linearRampToValueAtTime(0, tailAc.currentTime + reverbTime);
		tailSource.start();

		tailAc.startRendering().then((buffer) => {
			this.reverb.buffer = buffer;
		});
	};

	this.save = () => this.params;
	this.load = (_params) => {
		this.params = _params;
		this.wet.gain.setValueAtTime(this.params.wet, ac.currentTime);
		this.dry.gain.setValueAtTime(this.params.dry, ac.currentTime);
		this.preDelay.delayTime.setValueAtTime(this.params.preDelay, ac.currentTime);
		this.renderTail();
	};
	this.load(params);
}




/**
 * @param {AudioContext} ac 
 */
function FilterEffect(ac, params = { frequency: 350.0, detune: 0.0, Q: 1, gain: 0, type: 'lowpass' }) {
	this.fxType = 'filter';
	this.params = params;
	this.input = new GainNode(ac, { gain: 1 });
	this.filter = new BiquadFilterNode(ac, params);
	console.log('dfjjhdfjhfd', this.filter);

	this.connect = (destination) => {
		this.input
			.connect(this.filter)
			.connect(destination);
		return destination;
	};

	this.setParam = (param, value) => {
		this.params[param] = value;
		this.filter[param].setValueAtTime(value, ac.currentTime);
	};

	this.setType = (type) => {
		this.params.type = type;
		this.filter.type = type;
	};

	this.save = () => this.params;
	this.load = (_params) => {
		this.params = _params;
		Object.entries(this.params).forEach(([key, value]) => this.filter[key].setValueAtTime?.(value, ac.currentTime));
		this.filter.type = _params.type;
	};
}



function effectFromType(ac, type, params) {
	switch (type) {
		case 'filter':
			return new FilterEffect(ac, params);
		case 'reverb':
			return new ReverbEffect(ac, params);
		default:
			throw `No effect exists with type ${type}`;
	}
}

function FxManager(ac, output, fromObject) {
	this.input = new GainNode(ac, { gain: 1 });
	this.output = output;
	this.fxChain = [new FilterEffect(ac), new ReverbEffect(ac)];

	this.connect = (destination) => {
		let prev = this.input;
		this.fxChain.forEach((fx) => {
			prev.connect(fx.input);
			prev = fx;
		});
		prev.connect(destination);
	};

	this.addFx = (type, params) => {
		const fx = effectFromType(ac, type, params);
		this.fxChain.push(fx);
		this.connect(this.output);
		return { fx, index: this.fxChain.length - 1 };
	};

	this.removeFx = (index, newDestination) => {
		this.fxChain.splice(index, 1);
		this.connect(newDestination ?? this.output);
	};

	this.save = () => this.fxChain.reduce((obj, fx) => {
		obj[fx.fxType] = fx.save();
		return obj;
	}, {});

	this.load = (obj) => {
		this.fxChain = Object.entries(obj).map(([type, params]) => effectFromType(ac, type, params));
	};

	if (fromObject) this.load(fromObject);
	if (this.output) this.connect(this.output);
}