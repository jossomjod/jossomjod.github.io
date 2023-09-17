/**
 * 
 * @param {ArrayEnvelope} envelope
 * @param {HTMLElement} container 
 */
function EnvelopeUI(envelope, container) {
	this.envelope = envelope;
	this.container = container;
	this.canvas = this.container.querySelector('#oscEnvCanvas');
	this.ctx = this.canvas.getContext('2d');
	this.dragData = null;
	this.rect = {
		x: this.container.offsetLeft,
		y: this.container.offsetTop,
		w: this.container.clientWidth,
		h: this.container.clientHeight,
	};
	this.maxTime = 10.0;
	this.radius = 10.0;

	this.canvas.width = this.rect.w;
	this.canvas.height = this.rect.h;


	this.pos2Point = (pos) => {
		const r = this.radius;
		const time = this.maxTime * (pos.x + r) / this.rect.w;
		const value = 1 - (pos.y + r) / this.rect.h;
		return { time, value };
	};
	this.point2Pos = (point) => {
		const r = this.radius;
		const left = (this.rect.w * point.time / this.maxTime) - r;
		const bottom = (this.rect.h * point.value) + r;
		return { left, bottom };
	};
	this.putNode = (left, top) => {
		const element = this.dragData.element
		const r = this.radius;
		if (left < -r) left = -r;
		else if (left > this.rect.w - r) left = this.rect.w - r;
		if (top < -r) top = -r;
		else if (top > this.rect.h - r) top = this.rect.h - r;

		const isRelease = this.envelope.points.length === this.dragData.index + 1;
		if (isRelease) top = this.rect.h - r;

		element.style.left = left + 'px';
		element.style.top = top + 'px';

		this.envelope.points[this.dragData.index] = this.pos2Point({ x: left, y: top });
		this.drawLines();
	}

	this.container.addEventListener('click', (e) => {
		console.log('Clicked envelope', e); // TODO: add new node
	})
	document.addEventListener('mousemove', (e) => {
		if (!this.dragData) return;
		e.preventDefault();
		let left = (e.clientX - this.dragData.offsetX);
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(left, top);
	});

	document.addEventListener('mouseup', (e) => {
		console.log('mouseup', e);
		if (!this.dragData) return;
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(left, top);
		
		this.dragData = null;
	});

	this.generateNodes = (points) => {
		console.log('generating nodes', points);
		points.forEach((point, i) => {
			const prev = this.envelope.points[i-1];
			if (i > 0) {
				point.totalTime = (prev.totalTime ?? prev.time) + point.time;
			} else {
				point.totalTime = point.time;
			}
			const pos = this.point2Pos(point);
			const element = document.createElement('div');
			element.classList.add('envelope-node');
			element.style.left = `${pos.left}px`;
			element.style.bottom = `${pos.bottom - this.radius * 2}px`;
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
		});
	};
	this.generateNodes(this.envelope.points);

	this.drawLines = () => {
		const ctx = this.ctx;

		ctx.fillStyle = '#010a1d';
		ctx.fillRect(0, 0, this.rect.w, this.rect.h);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#3279ff';
		ctx.beginPath();
		ctx.moveTo(0, this.rect.h);

		this.envelope.points.forEach((p) => {
			const pos = this.point2Pos(p);
			const top = (this.rect.h - pos.bottom) + this.radius;
			const left = pos.left + this.radius;
			ctx.lineTo(left, top);
		});

		ctx.stroke();
	}
	this.drawLines();
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



	// DETUNE
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


	// LFO
	this.oscLFOFreqUI = this.oscUi.querySelector('#oscLFOFreq');
	this.oscLFOFreqUI.value = this.oscillator.fixedFreq;
	this.oscLFOFreqUI.addEventListener('input', () => {
		this.oscillator.fixedFreq = +this.oscLFOFreqUI.value;
		document.activeElement.blur();
	});
	this.oscLFOToggleUI = this.oscUi.querySelector('#oscLFOToggle');
	this.oscLFOToggleUI.value = !!this.oscillator.isLFO;
	this.oscLFOToggleUI.addEventListener('change', (r) => {
		this.oscillator.isLFO = this.oscLFOToggleUI.checked;
		console.log('LFOToggle', this.oscillator.isLFO, this.oscLFOToggleUI.checked, r);
	});


	this.oscGainEnvelope = this.oscUi.querySelector('#oscGainEnvelope');
	
	this.container.appendChild(this.oscUi);

	// GAIN ENVELOPE
	this.oscGainEnvelopeUI = new EnvelopeUI(this.oscillator.gainEnvelope, this.oscGainEnvelope);
}


function SynthUi(synth) {
	this.synth = synth;
	this.container = document.querySelector('.synth-container');
	this.template = document.querySelector('#oscillator-template');

	console.log('template', this.template);

	this.oscillators = this.synth.oscillators.map((osc, i) => {
		const isCarrier = i === 0;
		return new OscillatorUi(osc, this.container, `Oscillator ${i+1}`, isCarrier);
	});

	this.addOsc = () => {
		console.log('[synth-ui.js SynthUi] Adding oscillator UI');
		const len = this.synth.addOsc();
		const osc = this.synth.oscillators[len-1];
		this.oscillators.push(new OscillatorUi(osc, this.container, `Oscillator ${len}`, len === 0));
	}
}