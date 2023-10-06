/**
 * 
 * @param {ArrayEnvelope} envelope
 * @param {HTMLElement} container 
 */
function EnvelopeUI(envelope, container) {
	this.nodes = [];
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

	
	this.elements2Points = (elements) => {
		return elements.map((el) => {
			const pos = { x: el.offsetLeft, y: el.offsetTop };
			return this.pos2Point(pos);
		});
	};
	this.sortNodes = () => {
		this.nodes.sort((a, b) => a.offsetLeft - b.offsetLeft);
	}
	this.isRelease = (node) => {
		return !this.nodes.find((n) => n.offsetLeft > node.offsetLeft);
	};

	this.pos2Point = (pos) => {
		const r = this.radius;
		const time = this.maxTime * (pos.x + r) / this.rect.w;
		const value = 1 - (pos.y + r) / this.rect.h;
		return { time, value };
	};
	this.point2Pos = (point) => {
		const r = this.radius;
		const left = (this.rect.w * point.time / this.maxTime) - r;
		const top = this.rect.h - (this.rect.h * point.value) + r;
		return { left, top };
	};
	this.putNode = (left, top) => {
		const element = this.dragData.element;
		const r = this.radius;
		if (left < -r) left = -r;
		else if (left > this.rect.w - r) left = this.rect.w - r;
		if (top < -r) top = -r;
		else if (top > this.rect.h - r) top = this.rect.h - r;

		if (this.isRelease(element)) top = this.rect.h - r;

		element.style.left = left + 'px';
		element.style.top = top + 'px';

		this.sortNodes();
		this.envelope.points = this.elements2Points(this.nodes);
		this.drawLines();
	}

	document.addEventListener('mousemove', (e) => {
		if (!this.dragData) return;
		e.preventDefault();
		let left = (e.clientX - this.dragData.offsetX);
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(left, top);
	});

	document.addEventListener('mouseup', (e) => {
		//console.log('mouseup', e);
		if (!this.dragData) return;
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(left, top);
		
		this.dragData = null;
	});

	this.container.addEventListener('mousedown', (e) => {
		if (!!this.dragData) return;
		let left = e.pageX - this.rect.x;
		let top = e.pageY - this.rect.y;
		if (e.button === 0) this.addNode(left, top, e);
		else e.preventDefault();
	});

	this.addNode = (x, y, event) => {
		const element = document.createElement('div');
		element.classList.add('envelope-node');
		element.style.left = `${x - this.radius}px`;
		element.style.top = `${y - this.radius}px`;
		this.container.appendChild(element);


		element.addEventListener('mousedown', (e) => {
			console.log('BUTTTONN', e.button);
			if (e.button === 0) {
				this.dragData = {
					element,
					offsetX: e.clientX - element.offsetLeft,
					offsetY: e.clientY - element.offsetTop,
				};
			} else {
				e.preventDefault();
				this.removeNode(element);
				e.stopImmediatePropagation();
			}
		});

		if (event) {
			this.dragData = {
				element,
				offsetX: event.clientX - element.offsetLeft,
				offsetY: event.clientY - element.offsetTop,
			};
		}

		this.nodes.push(element);
		this.sortNodes();
		this.envelope.points = this.elements2Points(this.nodes);
		this.drawLines();
		return element;
	};

	this.removeNode = (node) => {
		//node.removeEventListener('mousedown');
		node.remove();
		this.nodes.splice(this.nodes.indexOf(node), 1);
		node = undefined;
		this.envelope.points = this.elements2Points(this.nodes);
		this.drawLines();
	};

	this.generateNodes = (points) => {
		console.log('generating nodes', points);
		this.nodes = points.map((point) => {
			const pos = this.point2Pos(point);
			return this.addNode(pos.left + this.radius, pos.top - this.radius);
		});
	};

	this.drawLines = () => {
		const ctx = this.ctx;

		ctx.fillStyle = '#010a1d';
		ctx.fillRect(0, 0, this.rect.w, this.rect.h);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#3279ff';
		ctx.beginPath();
		ctx.moveTo(0, this.rect.h);

		this.nodes.forEach((n) => {
			const pos = { left: n.offsetLeft, top: n.offsetTop };
			const top = pos.top + this.radius;
			const left = pos.left + this.radius;
			ctx.lineTo(left, top);
		});

		ctx.stroke();
	}
	this.generateNodes(this.envelope.points);
	this.drawLines();
}



function GainControlUI(oscillator, control) {
	this.oscillator = oscillator;
	this.control = control;

	this.control.value = this.oscillator.gain;
	this.control.addEventListener('changed', (e) => {
		this.oscillator.gain = +this.control.value;
	});
}

function MultiplierControlUI(oscillator, control) {
	this.oscillator = oscillator;
	this.control = control;

	this.control.value = this.oscillator.multiplier;
	this.control.addEventListener('changed', () => {
		this.oscillator.multiplier = +this.control.value;
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


function OscillatorUi(oscillator, container, name) {
	this.oscillator = oscillator;
	this.container = container;
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

	// MODULATE SELECT
	this.oscModulateSelectUI = this.oscUi.querySelector('#oscModulateSelect');

	this.oscModulateSelectUI.value = `${this.oscillator.mod ?? 'none'}`;
	this.oscModulateSelectUI.addEventListener('input', () => {
		const val = this.oscModulateSelectUI.value;
		this.oscillator.mod = val === 'none' ? null : +val;

		if (this.oscillator.mod === null) {
			this.oscillator.gain = this.oscillator.gain < 1.0 ? this.oscillator.gain : 1.0;
			this.oscGainControl.setAttribute('max', '1.0');
			this.oscGainControl.setAttribute('speed', '1.0');
			this.oscillator.multiplier = 1.0;
		} else {
			this.oscGainControl.setAttribute('max', '1000000.0');
			this.oscGainControl.setAttribute('speed', '100.0');
		}
		document.activeElement.blur();
	});



	this.oscGainControl = this.oscUi.querySelector('#oscGain');
	this.oscGainControlUI = new GainControlUI(this.oscillator, this.oscGainControl);
	
	this.oscMultiplierControl = this.oscUi.querySelector('#oscMultiplierControl');
	this.oscMultiplier = this.oscUi.querySelector('#oscMultiplier');
	if (!this.oscillator.isCarrier()) { // DANGER! DO NOT LET THE CARRIER HAVE A MULTIPLIER! SERIOUS HEARING DAMAGE MAY OCCUR!
		oscMultiplierUI = new MultiplierControlUI(this.oscillator, this.oscMultiplier);
	} else {
		this.oscMultiplier.remove();
		this.oscMultiplierControl.remove();
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
	this.oscLFOFreqUI.addEventListener('changed', () => {
		this.oscillator.fixedFreq = +this.oscLFOFreqUI.value;
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
		return new OscillatorUi(osc, this.container, `Oscillator ${i+1}`);
	});

	this.addOsc = () => {
		console.log('[synth-ui.js SynthUi] Adding oscillator UI');
		const len = this.synth.addOsc();
		const osc = this.synth.oscillators[len-1];
		const newOscUi = new OscillatorUi(osc, this.container, `Oscillator ${len}`);


		this.oscillators.push(newOscUi);
	}
}