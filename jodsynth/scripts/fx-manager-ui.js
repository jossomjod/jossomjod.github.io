

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
function createParamControl(param, parent, setParam) {
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

	parent.appendChild(container);
	input.addEventListener('input', () => {
		setParam(param.param, input.value);
	});
}

function FxUi(fx, parent, titleText) {
	this.container = document.createElement('div');
	this.title = document.createElement('h3');
	this.title.innerText = titleText ?? 'Unnamed effect';
	this.container.appendChild(this.title);

	this.fx = fx;
	this.controls = [];

	parent.appendChild(this.container);

	this.setFx = (_fx) => {
		this.fx = _fx;
	};
}

function createReverbFxUi(fx, parent, titleText) {
	const fxUi = new FxUi(fx.params, parent, titleText);
	fxUi.controls = [
		createParamControl({ label: 'Reverb time', param: 'reverbTime', type: 'range', value: fx.params.reverbTime, min: 0.1, max: 5 }, fxUi.container, fx.setParam),
		createParamControl({ label: 'Wet', param: 'wet', type: 'range', value: fx.params.wet, min: 0, max: 1 }, fxUi.container, fx.setParam),
		createParamControl({ label: 'Dry', param: 'dry', type: 'range', value: fx.params.dry, min: 0, max: 1 }, fxUi.container, fx.setParam),
	];
	return fxUi;
}

function createFxUi(fx, parent) {
	switch (fx.fxType) {
		case 'reverb':
			return createReverbFxUi(fx, parent, 'Reverb');
		default:
			throw 'Unknown effect type';
	}
}

function FxManagerUi(fxManager) {
	this.container = document.querySelector('.fx-container');
	this.fxManager;
	this.fxUis;

	this.setFxManager = (fxMan) => {
		this.fxManager = fxMan;
		this.fxUis = this.fxManager.fxChain.map((f) => createFxUi(f, this.container));
	};

	if (fxManager) this.setFxManager(fxManager);
}