

function FxParam() {
	this.type;
	this.param;
	this.label;
	this.value = 1;
	this.min = 0;
	this.max = 1;
	this.step = 0.01;
}

/**
 * @param {FxParam} param 
 */
function createParamControl(param, setParam) {
	const container = document.createElement('div');
	const input = document.createElement('input');
	const label = document.createElement('label');

	container.appendChild(input);
	container.appendChild(label);

	label.innerText = param.label ?? 'Unnamed param';

	input.setAttribute('type', param.type ?? 'range');
	input.setAttribute('min', param.min ?? 0);
	input.setAttribute('max', param.max ?? 1);
	input.setAttribute('step', param.step ?? 0.01);
	input.value = param.value;

	input.addEventListener('input', () => {
		setParam(param.param, input.value);
	});

	return container;
}


function createParamSelect(param) {
	const container = document.createElement('div');
	const select = document.createElement('select');
	const label = document.createElement('label');

	container.appendChild(select);
	container.appendChild(label);

	param.options.forEach((o) => {
		const el = document.createElement('option');
		el.setAttribute('value', o.value);
		el.innerText = o.text ?? o.value;
		select.appendChild(el);
	});

	label.innerText = param.label ?? 'Unnamed param';
	select.value = param.value;

	select.addEventListener('change', () => {
		param.setter(select.value);
	});

	return container;
}

function FxUi(params, parent, rmCallback, titleText) {
	this.container = document.createElement('div');
	this.ctrlBox = document.createElement('div');
	this.title = document.createElement('h4');
	this.title.innerText = titleText ?? 'Unnamed effect';
	this.rmBtn = document.createElement('button');
	this.rmBtn.innerText = 'DELET';
	this.container.appendChild(this.title);
	this.container.appendChild(this.ctrlBox);
	this.container.appendChild(this.rmBtn);
	this.container.setAttribute('draggable', true);

	this.params = params;
	this.controls = [];

	this.setControls = (controls = []) => {
		this.controls = controls;
		controls.forEach((c) => this.ctrlBox.appendChild(c));
	};

	parent.appendChild(this.container);
	this.rmBtn.addEventListener('click', rmCallback);
}

const filterTypeOptions = ['lowpass', 'highpass', 'bandpass', 'allpass', 'lowshelf', 'highshelf', 'peaking', 'notch'].map((o) => {
	return { value: o, text: o };
});

function createReverbFxUi(fx, parent, rmCallback, titleText) {
	const fxUi = new FxUi(fx.params, parent, rmCallback, titleText);
	const controls = [
		createParamControl({ label: 'Predelay', param: 'preDelay', type: 'number', value: fx.params.preDelay, min: 0, max: 1 }, fx.setParam),
		createParamControl({ label: 'Wet', param: 'wet', type: 'range', value: fx.params.wet, min: 0, max: 1 }, fx.setParam),
		createParamControl({ label: 'Dry', param: 'dry', type: 'range', value: fx.params.dry, min: 0, max: 1 }, fx.setParam),
		createParamControl({ label: 'Reverb time', param: 'reverbTime', type: 'range', value: fx.params.reverbTime, min: 0.1, max: 5 }, fx.setParam),
	];
	fxUi.setControls(controls);
	return fxUi;
}

function createFilterFxUi(fx, parent, rmCallback, titleText) {
	const fxUi = new FxUi(fx.params, parent, rmCallback, titleText);
	const controls = [
		createParamSelect({ label: 'Type', param: 'type', value: fx.params.type, setter: fx.setType, options: filterTypeOptions }),
		createParamControl({ label: 'Freq', param: 'frequency', type: 'range', value: fx.params.frequency, min: 10, max: 22050, step: 0.1 }, fx.setParam),
		createParamControl({ label: 'Detune', param: 'detune', type: 'number', value: fx.params.detune, min: -2400, max: 2400, step: 1 }, fx.setParam),
		createParamControl({ label: 'Q', param: 'Q', type: 'range', value: fx.params.Q, min: 0.0001, max: 1000 }, fx.setParam),
		createParamControl({ label: 'Gain', param: 'gain', type: 'range', value: fx.params.gain, min: -40, max: 40 }, fx.setParam),
	];
	fxUi.setControls(controls);
	return fxUi;
}

function createFxUi(fx, parent, rmCallback) {
	switch (fx.fxType) {
		case 'filter':
			return createFilterFxUi(fx, parent, rmCallback, 'Filter');
		case 'reverb':
			return createReverbFxUi(fx, parent, rmCallback, 'Reverb');
		default:
			throw 'Unknown effect type';
	}
}

function FxManagerUi(fxManager) {
	this.container = document.querySelector('.fx-container');
	this.fxManager;
	this.fxUis;

	this.addFx = (type = 'filter') => {
		const {fx, index} = this.fxManager.addFx(type);
		this.fxUis.push(createFxUi(fx, this.container, () => this.rmCallback(index)));
		this.fxUis[index].container.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('text/plain', `${index}`);
		});
	};

	this.rmCallback = (index) => {
		this.fxManager.removeFx(index);

		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
		this.setFxManager(this.fxManager);
	};

	this.setFxManager = (fxMan) => {
		this.fxManager = fxMan;
		this.fxUis = this.fxManager.fxChain.map((f, i) => createFxUi(f, this.container, () => this.rmCallback(i)));
	};

	if (fxManager) this.setFxManager(fxManager);
}