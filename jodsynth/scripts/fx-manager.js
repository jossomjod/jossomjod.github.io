

class BaseEffect { // TODO
	ac;
	fxType = 'base';
	params;
	input;
	effectNode;
	destination;
	/** @type {{[string]: { time: number, value: number }[]}} */
	automations = {};

	/**
	 * @param {AudioContext} context
	 */
	constructor(context, params) {
		this.ac = context;
		this.params = params;
		this.input = new GainNode(context, { gain: 1 });
	}

	connect(destination) {
		this.destination = destination;

		if (this.params.bypass) {
			this.input.connect(destination);
			return destination;
		}
		this.input
			.connect(this.effectNode)
			.connect(destination);
		return destination;
	}

	disconnect() {
		this.input.disconnect();
		this.effectNode.disconnect();
	}

	refreshConnection() {
		this.disconnect();
		this.connect(this.destination);
	}

	setParam = (param, value) => {
		if (param === 'bypass') {
			this.params.bypass = value;
			this.refreshConnection();
			return;
		}
		this.params[param] = value;
		this.effectNode[param].setValueAtTime(value, this.ac.currentTime);
	};

	save() {
		return { params: this.params, fxType: this.fxType };
	}
	load(params){
		this.params = params;
		this.effectNode.type = params.type;
	}
}


function ReverbManager2(context, input, output, reverb) {
	this.reverbGain = context.createGain();
	this.reverbGain.gain.value = reverb;
	this.reverb = context.createConvolver();
	this.reverb.buffer = createNoiseBuffer(context);

	input.connect(output);
	input.connect(this.reverb).connect(this.reverbGain).connect(output);
}


function createNoiseBuffer(context, time) {
	const bufferSize = context.sampleRate * time;
	const buford = context.createBuffer(2, bufferSize, context.sampleRate);
	const bufL = buford.getChannelData(0);
	const bufR = buford.getChannelData(1);
	for (let i = 0; i < bufferSize; i++) {
		bufL[i] = Math.random() * 2 - 1;
		bufR[i] = Math.random() * 2 - 1;
	}
	return buford;
}



/**
 * @param {AudioContext} context
 */
function ReverbEffect(context, params = { bypass: false, reverbTime: 2, preDelay: 0.01, wet: 0.5, dry: 0.5 }) {
	this.fxType = 'reverb';
	this.params = params;
	this.reverb = context.createConvolver();
	this.wet = context.createGain();
	this.dry = context.createGain();
	this.preDelay = context.createDelay(1);
	this.input = new GainNode(context, { gain: 1 });
	this.timeOutId;
	this.destination;

	this.connect = (destination) => {
		this.destination = destination;

		if (this.params.bypass) {
			this.input.connect(destination);
			return destination;
		}
		this.input.connect(this.dry).connect(destination);
		this.input
			.connect(this.preDelay)
			.connect(this.reverb)
			.connect(this.wet)
			.connect(destination);
		return destination;
	};

	this.disconnect = () => {
		this.input.disconnect();
		this.dry.disconnect();
		this.wet.disconnect();
		this.reverb.disconnect();
		this.preDelay.disconnect();
	};

	this.refreshConnection = () => {
		this.disconnect();
		this.connect(this.destination);
	}

	this.setParam = (param, value) => {
		this.params[param] = value;

		switch (param) {
			case 'bypass':
				this.refreshConnection();
				break;
			case 'preDelay':
				this.preDelay.delayTime.setValueAtTime(this.params.preDelay, context.currentTime);
				break;
			case 'wet':
				this.wet.gain.setValueAtTime(this.params.wet, context.currentTime);
				break;
			case 'dry':
				this.dry.gain.setValueAtTime(this.params.dry, context.currentTime);
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
		const tailAc = new OfflineAudioContext(2, context.sampleRate * reverbTime, context.sampleRate);
		const tailSource = new AudioBufferSourceNode(tailAc, {
			buffer: createNoiseBuffer(tailAc, reverbTime),
		});
		const gain = new GainNode(tailAc, { gain: 1 });

		tailSource.connect(gain).connect(tailAc.destination);
		gain.gain.linearRampToValueAtTime(0.5, tailAc.currentTime + reverbTime * 0.3);
		gain.gain.linearRampToValueAtTime(0.0, tailAc.currentTime + reverbTime);
		tailSource.start();

		tailAc.startRendering().then((buffer) => {
			this.reverb.buffer = buffer;
		});
	};

	this.save = () => ({ params: this.params, fxType: this.fxType });
	this.load = (_params) => {
		this.params = _params;
		this.wet.gain.setValueAtTime(this.params.wet, context.currentTime);
		this.dry.gain.setValueAtTime(this.params.dry, context.currentTime);
		this.preDelay.delayTime.setValueAtTime(this.params.preDelay, context.currentTime);
		this.renderTail();
	};
	this.load(params);
}




/**
 * @param {AudioContext} context
 */
function FilterEffect(context, params = { bypass: false, frequency: 11025.0, detune: 0.0, Q: 1, gain: 0, type: 'lowpass' }) {
	this.fxType = 'filter';
	this.params = params;
	this.input = new GainNode(context, { gain: 1 });
	this.filter = new BiquadFilterNode(context, params);
	this.destination;
	this.automation = {};

	this.connect = (destination) => {
		this.destination = destination;

		if (this.params.bypass) {
			this.input.connect(destination);
			return destination;
		}
		this.input
			.connect(this.filter)
			.connect(destination);
		return destination;
	};

	this.disconnect = () => {
		this.input.disconnect();
		this.filter.disconnect();
	};

	this.refreshConnection = () => {
		this.disconnect();
		this.connect(this.destination);
	};

	this.setParam = (param, value) => {
		if (param === 'bypass') {
			this.params.bypass = value;
			this.refreshConnection();
			return;
		}
		this.params[param] = value;
		this.filter[param].setValueAtTime(value, context.currentTime);
	};

	this.setType = (type) => {
		this.params.type = type;
		this.filter.type = type;
	};

	this.save = () => ({ params: this.params, fxType: this.fxType, automation: this.automation });
	this.load = (_params) => {
		this.params = _params;
		Object.entries(this.params).forEach(([key, value]) => this.filter[key].setValueAtTime?.(value, context.currentTime));
		this.filter.type = _params.type;
	};
}


class CompressorEffect {
	ac;
	fxType = 'compressor';
	params;
	input
	compressor
	destination;

	/**
	 * @param {AudioContext} context
	 */
	constructor(
		context, params = {
			bypass: false,
			threshold: -24,  // -100-0 dB
			knee: 30,        // 0-40 dB
			ratio: 12,       // 1-20 dB
			attack: 0.003,   // 0-1 s
			release: 0.25 ,  // 0-1 s
		}
	) {
		this.ac = context;
		this.params = params;
		this.input = new GainNode(context, { gain: 1 });
		this.compressor = new DynamicsCompressorNode(context, params);
	}

	connect(destination) {
		this.destination = destination;

		if (this.params.bypass) {
			this.input.connect(destination);
			return destination;
		}
		this.input
			.connect(this.compressor)
			.connect(destination);
		return destination;
	}

	disconnect() {
		this.input.disconnect();
		this.compressor.disconnect();
	}

	refreshConnection() {
		this.disconnect();
		this.connect(this.destination);
	}

	setParam = (param, value) => {
		if (param === 'bypass') {
			this.params.bypass = value;
			this.refreshConnection();
			return;
		}
		this.params[param] = value;
		this.compressor[param].setValueAtTime(value, this.ac.currentTime);
	};

	save() {
		return { params: this.params, fxType: this.fxType };
	}
	load(params){
		this.params = params;
		Object.entries(this.params).forEach(([key, value]) => this.compressor[key].setValueAtTime?.(value, this.ac.currentTime));
		this.compressor.type = params.type;
	}
}


class DelayEffect {
	ac;
	fxType = 'delay';
	params;
	input;
	delay;
	wet;
	dry;
	feedback;
	destination;

	/**
	 * @param {AudioContext} context
	 */
	constructor(
		context, params = {
			bypass: false,
			time: 0.25,
			wet: 0.5,
			dry: 1,
			feedback: 0.3,
		}
	) {
		this.ac = context;
		this.params = params;
		this.input = new GainNode(context, { gain: 1 });
		this.delay = new DelayNode(context, { delayTime: this.params.time });
		this.wet = new GainNode(context, { gain: this.params.wet });
		this.dry = new GainNode(context, { gain: this.params.dry });
		this.feedback = new GainNode(context, { gain: this.params.feedback });
	}

	connect(destination) {
		this.destination = destination;

		if (this.params.bypass) {
			this.input.connect(destination);
			return destination;
		}
		this.input
			.connect(this.delay)
			.connect(this.wet)
			.connect(destination);
		this.input
			.connect(this.dry)
			.connect(destination);
		this.wet.connect(this.feedback)
		this.feedback.connect(this.delay);
		return destination;
	}

	disconnect() {
		this.input.disconnect();
		this.delay.disconnect();
		this.wet.disconnect();
		this.dry.disconnect();
		this.feedback.disconnect();
	}

	refreshConnection() {
		this.disconnect();
		this.connect(this.destination);
	}

	setParam = (param, value) => {
		if (param === 'bypass') {
			this.params.bypass = value;
			this.refreshConnection();
			return;
		}
		this.params[param] = value;
		if (param === 'time') this.delay.delayTime.setValueAtTime(value, this.ac.currentTime);
		else this[param].gain.setValueAtTime(value, this.ac.currentTime);
	};

	save() {
		return { params: this.params, fxType: this.fxType };
	}
	load(params){
		this.params = params;
		Object.entries(this.params).forEach(([key, value]) => this.setParam(key, value));
	}
}


function effectFromType(context, type, params) {
	switch (type) {
		case 'filter':
			return new FilterEffect(context, params);
		case 'reverb':
			return new ReverbEffect(context, params);
		case 'compressor':
			return new CompressorEffect(context, params);
		case 'delay':
			return new DelayEffect(context, params);
		default:
			throw `No effect exists with type ${type}`;
	}
}

function FxManager(context, output, fromArray, gain = 1) {
	this.input = new GainNode(context, { gain: 1 });
	this.gain = new GainNode(context, { gain });
	this.output = output;
	this.fxChain = [];

	this.connect = (destination) => {
		let prev = this.input;
		this.fxChain.forEach((fx) => {
			prev.disconnect();
			prev.connect(fx.input);
			prev = fx;
		});
		prev.connect(this.gain);
		this.gain.connect(destination);
	};

	this.addFx = (type, params) => {
		const fx = effectFromType(context, type, params);
		this.fxChain.push(fx);
		this.connect(this.output);
		return { fx, index: this.fxChain.length - 1 };
	};

	this.removeFx = (index, newDestination) => {
		this.fxChain[index].disconnect();
		this.gain.disconnect();
		Object.values(this.fxChain[index]).forEach((_v, i) => delete this.fxChain[index][i]);
		delete this.fxChain[index];
		this.fxChain.splice(index, 1);
		this.connect(newDestination ?? this.output);
	};

	this.save = () => this.fxChain.map((fx) => fx.save());

	this.load = (arr) => {
		this.fxChain = arr.map(({fxType, params, automation}) => {
			const fx = effectFromType(context, fxType, params);
			fx.automation = automation ?? {};
			return fx;
		});
		if (this.output) this.connect(this.output);
	};

	if (fromArray) this.load(fromArray);
	else if (this.output) this.connect(this.output);
}
