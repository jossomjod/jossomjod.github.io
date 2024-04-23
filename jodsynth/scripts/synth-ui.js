/**
 * @param {ArrayEnvelope} envelope
 * @param {HTMLElement} container 
 */
function EnvelopeUI(envelope, container, zeroCentered = false) {
	this.nodes = [];
	this.envelope = envelope;
	this.container = container;
	this.zeroCentered = zeroCentered;
	this.canvas = this.container.querySelector('#oscEnvCanvas');
	this.ctx = this.canvas.getContext('2d');
	this.dragData = null;
	this.rect = {
		x: this.container.offsetLeft,
		y: this.container.offsetTop,
		w: this.container.clientWidth,
		h: this.container.clientHeight,
	};
	this.maxTime = 4.0;
	this.radius = 8.0;

	this.canvas.width = this.rect.w;
	this.canvas.height = this.rect.h;


	this.tooltip = document.createElement('div');
	this.tooltip.classList.add('tooltip', 'invisible');
	this.container.appendChild(this.tooltip);
	this.tooltip.insertAdjacentHTML('afterbegin', `<div id="timeDiv"></div><div id="valueDiv"></div>`);
	this.timeDiv = this.tooltip.querySelector('#timeDiv');
	this.valueDiv = this.tooltip.querySelector('#valueDiv');

	this.setTooltipText = (params) => {
		const time = `${params.time * 1000.0}`.slice(0, 7);
		const value = `${params.value * 100.0}`.slice(0, 7);
		this.timeDiv.textContent = `${time} ms`;
		this.valueDiv.textContent = `${value} %`;
	};
	this.moveTooltipTo = (pos) => {
		this.tooltip.style.left = `${pos.x + 30.0}px`;
		this.tooltip.style.top = `${pos.y}px`;
		this.setTooltipText(this.pos2Point(pos));
	};
	this.toggleTooltip = (hidden) => this.tooltip.classList.toggle('invisible', hidden);

	
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
		let value = 1 - (pos.y + r) / this.rect.h;
		if (this.zeroCentered) value = value * 2.0 - 1.0;
		return { time, value };
	};
	this.point2Pos = (point) => {
		const value = this.zeroCentered ? point.value * 0.5 + 0.5 : point.value;
		const r = this.radius;
		const left = (this.rect.w * point.time / this.maxTime) - r;
		const top = this.rect.h - (this.rect.h * value) + r;
		return { left, top };
	};
	this.putNode = (left, top) => { // TODO: snap - PRIORITY UNO
		const element = this.dragData.element;
		const r = this.radius;
		if (left < -r) left = -r;
		else if (left > this.rect.w - r) left = this.rect.w - r;
		if (top < -r) top = -r;
		else if (top > this.rect.h - r) top = this.rect.h - r;

		if (!this.zeroCentered && this.isRelease(element)) top = this.rect.h - r;

		element.style.left = left + 'px';
		element.style.top = top + 'px';

		this.moveTooltipTo({ x: left, y: top });

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
		this.toggleTooltip(true);

		if (!this.dragData) return;
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(left, top);
		
		this.dragData = null;
	});

	this.container.addEventListener('mousedown', (e) => {
		let left = e.pageX - this.rect.x;
		let top = e.pageY - this.rect.y;
		this.moveTooltipTo({ x: left, y: top });
		if (e.button === 0) {
			if (!this.dragData) this.addNode(left, top, e);
			this.toggleTooltip(false);
		}
		else e.preventDefault();
	});

	this.addNode = (x, y, event) => {
		const element = document.createElement('div');
		element.classList.add('envelope-node');
		element.style.left = `${x - this.radius}px`;
		element.style.top = `${y - this.radius}px`;
		this.container.appendChild(element);


		element.addEventListener('mousedown', (e) => {
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
		node.remove();
		this.nodes.splice(this.nodes.indexOf(node), 1);
		node = undefined;
		this.envelope.points = this.elements2Points(this.nodes);
		this.drawLines();
	};

	this.generateNodes = (points) => {
		this.nodes = points.map((point) => {
			const pos = this.point2Pos(point);
			return this.addNode(pos.left + this.radius, pos.top - this.radius);
		});
	};

	this.drawLines = () => {
		const ctx = this.ctx;
		const h = this.zeroCentered ? this.rect.h * 0.5 : this.rect.h;

		ctx.fillStyle = '#010a1d';
		ctx.fillRect(0, 0, this.rect.w, this.rect.h);
		ctx.lineWidth = 4;
		ctx.strokeStyle = '#3279ff';
		ctx.beginPath();
		ctx.moveTo(0, h);

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
	this.control.setAttribute('value', this.oscillator.gain + '');
	this.control.addEventListener('changed', (e) => {
		this.oscillator.gain = +this.control.value;
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
		this.oscillator.setWave(this.oscWaveformUI.value);
		document.activeElement.blur();
	});


	// MODULATE SELECT
	this.oscModulateSelectUI = this.oscUi.querySelector('#oscModulateSelect');

	this.oscModulateSelectUI.value = `${this.oscillator.mod ?? 'none'}`;
	this.oscModulateSelectUI.addEventListener('input', () => {
		const val = this.oscModulateSelectUI.value;
		this.oscillator.mod = val === 'none' ? null : +val;
		this.setGainRange();
		document.activeElement.blur();
	});

	this.updateModulateOptions = (newOptions) => {
		this.oscModulateSelectUI.replaceChildren(...newOptions);
		this.oscModulateSelectUI.value = `${this.oscillator.mod ?? 'none'}`;
	};


	// MODULATE MODE SELECT
	this.oscModulateModeSelectUI = this.oscUi.querySelector('#oscModulateModeSelect');

	this.oscModulateModeSelectUI.value = `${this.oscillator.modType ?? 0}`;
	this.oscModulateModeSelectUI.addEventListener('input', () => {
		this.oscillator.modType = +this.oscModulateModeSelectUI.value;
		this.setGainRange();
		document.activeElement.blur();
	});


	// GAIN
	this.oscGainControl = this.oscUi.querySelector('#oscGain');
	this.oscGainControlUI = new GainControlUI(this.oscillator, this.oscGainControl);


	// DETUNE
	this.oscDetuneUI = this.oscUi.querySelector('#oscDetune'); // TODO: Use jodnumb
	this.oscCoarseUI = this.oscUi.querySelector('#oscCoarse');
	const coarse = Math.round(this.oscillator.detune / 100);
	this.oscCoarseUI.value = Math.round(this.oscillator.detune / 100);
	this.oscDetuneUI.value = this.oscillator.detune - coarse * 100;
	
	this.oscDetuneInput = () => {
		this.oscillator.detune = +this.oscCoarseUI.value * 100 + +this.oscDetuneUI.value;
		document.activeElement.blur();
	}
	this.oscCoarseUI.addEventListener('input', this.oscDetuneInput);
	this.oscDetuneUI.addEventListener('input', this.oscDetuneInput);


	// PHASE
	this.oscPhaseUI = this.oscUi.querySelector('#oscPhase');
	this.oscPhaseUI.value = '' + this.oscillator.phase;
	this.oscPhaseUI.addEventListener('input', () => {
		this.oscillator.setPhase(+this.oscPhaseUI.value);
		document.activeElement.blur();
	});


	// LFO
	this.oscLFOFreqUI = this.oscUi.querySelector('#oscLFOFreq');
	this.oscLFOFreqUI.value = this.oscillator.fixedFreq;
	this.oscLFOFreqUI.addEventListener('changed', () => {
		this.oscillator.fixedFreq = +this.oscLFOFreqUI.value;
	});
	this.oscLFOToggleUI = this.oscUi.querySelector('#oscLFOToggle');
	this.oscLFOToggleUI.value = !!this.oscillator.isLFO;
	this.oscLFOToggleUI.addEventListener('change', () => {
		this.oscillator.isLFO = this.oscLFOToggleUI.checked;
	});


	// PAN
	this.oscPanUI = this.oscUi.querySelector('#oscPan');
	this.oscPanUI.value = '' + this.oscillator.pan;
	this.oscPanUI.addEventListener('input', () => {
		this.oscillator.pan = +this.oscPanUI.value;
	});


	this.oscGainEnvelope = this.oscUi.querySelector('#oscGainEnvelope');
	this.oscPitchEnvelope = this.oscUi.querySelector('#oscPitchEnvelope');
	
	this.container.appendChild(this.oscUi);

	// GAIN ENVELOPE
	this.oscGainEnvelopeUI = new EnvelopeUI(this.oscillator.gainEnvelope, this.oscGainEnvelope);
	this.oscPitchEnvelopeUI = new EnvelopeUI(this.oscillator.pitchEnvelope, this.oscPitchEnvelope, true);

	

	this.setGainRange = () => { // TODO: prevent hearing damage without compromising functionality
		if (this.oscillator.mod === null /* || this.oscillator.modType > 0 */) {
			this.oscillator.gain = this.oscillator.gain < 1.0 ? this.oscillator.gain : 1.0;
			this.oscGainControl.max = 1.0;
			this.oscGainControl.speed = 1.0;
		} else {
			this.oscGainControl.max = 1000000.0;
			this.oscGainControl.speed = 100.0;
		}
	};

	
	// INIT
	this.setGainRange();
}

function SynthUi(synth) {
	this.synth = synth;
	this.container = document.querySelector('.oscillators-container');
	this.template = document.querySelector('#oscillator-template');

	this.oscillators = this.synth.oscillators.map((osc, i) => {
		return new OscillatorUi(osc, this.container, `Oscillator ${i+1}`);
	});

	this.addOsc = () => {
		const len = this.synth.addOsc();
		const osc = this.synth.oscillators[len-1];
		const newOscUi = new OscillatorUi(osc, this.container, `Oscillator ${len}`);
		
		this.oscillators.push(newOscUi);
		this.updateModulateOptions();
	}

	this.updateModulateOptions = () => {
		this.oscillators.forEach((o, oi) => {
			const none = document.createElement('option');
			none.value = `none`;
			none.innerHTML = `None`;

			const options = this.oscillators.map((o, i) => {
				const option = document.createElement('option');
				option.value = `${i}`;
				option.innerHTML = `${o.name}`;
				if (oi !== i) return option;
			});
			o.updateModulateOptions([ none, ...options ]);
		});
	};
	this.updateModulateOptions();
}