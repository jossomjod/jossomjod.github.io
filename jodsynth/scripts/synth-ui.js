/**
 * 
 * @param {ArrayEnvelope} envelope
 * @param {HTMLElement} container 
 */
function EnvelopeUI(envelope, container) {
	this.envelope = envelope;
	this.container = container;
	this.dragData = null;
	this.nodeHalfRadius = 9;
	this.rect = {
		x: this.container.offsetLeft,
		y: this.container.offsetTop,
		w: this.container.clientWidth,
		h: this.container.clientHeight,
	};
	this.maxTime = 10.0;


	this.pos2Point = (pos) => {
		const time = this.maxTime * pos.x / this.rect.w;
		const value = 1 - pos.y / this.rect.h;
		return { time, value };
	};
	this.point2Pos = (point) => {
		const left = this.rect.w * point.time / this.maxTime;
		const bottom = this.rect.h * point.value;
		return { left, bottom };
	};
	this.putNode = (element, left, top) => {
		if (left < 0) left = 0;
		else if (left > this.rect.w) left = this.rect.w;
		if (top < 0) top = 0;
		else if (top > this.rect.h) top = this.rect.h;
		element.style.left = left + 'px';
		element.style.top = top + 'px';
	}

	this.container.addEventListener('click', (e) => {
		console.log('Clicked envelope', e); // TODO: add new node
	})
	document.addEventListener('mousemove', (e) => {
		if (!this.dragData) return;
		e.preventDefault();
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(this.dragData.element, left, top);
	});

	document.addEventListener('mouseup', (e) => {
		console.log('mouseup', e);
		if (!this.dragData) return;
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(this.dragData.element, left, top);
		this.envelope.points[this.dragData.index] = this.pos2Point({ x: left, y: top });

		this.dragData = null;
	});

	this.generateNodes = (points) => {
		console.log('generating nodes', points);
		return points.map((point, i) => {
			const pos = this.point2Pos(point);
			const element = document.createElement('div');
			element.classList.add('envelope-node');
			element.style.left = `${pos.left}px`;
			element.style.bottom = `${pos.bottom}px`;
			this.container.appendChild(element);

			element.addEventListener('mousedown', (e) => {
				console.log('mousedown', e);
				this.dragData = {
					element,
					offsetX: e.clientX - element.offsetLeft,
					offsetY: e.clientY - element.offsetTop,
					index: i,
				};
			});

			return { element, point };
		});
	};
	this.nodes = this.generateNodes(this.envelope.points);
}



function GainControlUI(oscillator, control) {
	this.oscillator = oscillator;
	this.control = control;

	this.control.value = this.oscillator.gain;
	this.control.addEventListener('input', () => {
		this.oscillator.gain = this.control.value;
	});
}

function MultiplierControlUI(oscillator, control) {
	this.oscillator = oscillator;
	this.control = control;

	this.control.value = this.oscillator.multiplier;
	this.control.addEventListener('input', () => {
		this.oscillator.multiplier = this.control.value;
	});
}

function ControlUI(param, control) {
	this.param = param;
	this.control = control;

	this.control.value = this.param;
	this.control.addEventListener('input', () => {
		this.param = this.control.value;
	});
}


function SynthControlBindings(synth) {
	this.synth = synth;

	// Oscar

	this.oscarGainControl = document.querySelector('#oscarGain');
	this.oscarGainControlUI = new GainControlUI(this.synth.oscillators[0], this.oscarGainControl);

	this.oscarGainEnvelope = document.querySelector('#oscarGainEnvelope');
	this.oscarGainEnvelopeUI = new EnvelopeUI(this.synth.oscillators[0].gainEnvelope, oscarGainEnvelope);


	// Osiris

	this.osirisGainControl = document.querySelector('#osirisGain');
	this.osirisGainControlUI = new GainControlUI(this.synth.oscillators[1], this.osirisGainControl);

	this.osirisGainEnvelope = document.querySelector('#osirisGainEnvelope');
	this.osirisGainEnvelopeUI = new EnvelopeUI(this.synth.oscillators[1].gainEnvelope, osirisGainEnvelope);


	// Osman

	this.osmanGainControl = document.querySelector('#osmanGain');
	this.osmanGainControlUI = new GainControlUI(this.synth.oscillators[2], this.osmanGainControl);

	this.osmanGainEnvelope = document.querySelector('#osmanGainEnvelope');
	this.osmanGainEnvelopeUI = new EnvelopeUI(this.synth.oscillators[2].gainEnvelope, osmanGainEnvelope);
}


function OscillatorUi(oscillator, container, name, isCarrier = false) {
	this.oscillator = oscillator;
	this.container = container;
	this.isCarrier = isCarrier;
	this.template = document.querySelector('#oscillator-template');
	this.oscUi = this.template.content.cloneNode(true);

	this.name = name;
	this.nameElement = this.oscUi.querySelector('#oscillator-name');
	if (this.nameElement) this.nameElement.textContent = this.name;

	
	this.oscWaveformUI = this.oscUi.querySelector('#oscWaveform');

	this.oscWaveformUI.value = this.oscillator.type;
	this.oscWaveformUI.addEventListener('input', () => {
		this.oscillator.type = this.oscWaveformUI.value;
		document.activeElement.blur();
	});



	this.oscGainControl = this.oscUi.querySelector('#oscGain');
	this.oscGainControlUI = new GainControlUI(this.oscillator, this.oscGainControl);
	
	this.oscMultiplier;
	if (!isCarrier) { // DANGER! DO NOT LET THE CARRIER HAVE A MULTIPLIER! SERIOUS HEARING DAMAGE MAY OCCUR!
		this.oscMultiplier = this.oscUi.querySelector('#oscMultiplier');
		oscMultiplierUI = new MultiplierControlUI(this.oscillator, this.oscMultiplier);
	}




	this.oscDetuneUI = this.oscUi.querySelector('#oscDetune');
	this.oscCoarseUI = this.oscUi.querySelector('#oscCoarse');
	this.oscCoarseUI.value = Math.round(this.oscillator.detune / 100);
	this.oscDetuneUI.value = 0.0;
	
	this.oscDetuneInput = () => {
		this.oscillator.detune = +this.oscCoarseUI.value * 100 + +this.oscDetuneUI.value;
		document.activeElement.blur();
	}
	this.oscCoarseUI.addEventListener('input', this.oscDetuneInput);
	this.oscDetuneUI.addEventListener('input', this.oscDetuneInput);



	this.oscGainEnvelope = this.oscUi.querySelector('#oscGainEnvelope');
	
	
	this.container.appendChild(this.oscUi);
	
	this.oscGainEnvelopeUI = new EnvelopeUI(this.oscillator.gainEnvelope, this.oscGainEnvelope);
}


function SynthUi(synth) {
	this.synth = synth;
	this.container = document.querySelector('.synth-container');
	this.template = document.querySelector('#oscillator-template');

	console.log('template', this.template);

	this.oscillators = this.synth.oscillators.map((osc, i) => {
		const isCarrier = i === 0;
		return new OscillatorUi(osc, this.container, 'Oscillator name yay', isCarrier);
	});
}