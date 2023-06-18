
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
		const value = 1 + -pos.y / this.rect.h;
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
	this.container.addEventListener('dragenter', (e) => {
		e.preventDefault();
	})
	this.container.addEventListener('dragover', (e) => {
		e.preventDefault();
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		this.putNode(this.dragData.element, left, top);
	});

	this.generateNodes = (points) => {
		console.log('generating nodes', points);
		return points.map((point, i) => {
			const pos = this.point2Pos(point);
			const element = document.createElement('div');
			element.setAttribute('draggable', true);
			element.classList.add('envelope-node');
			element.style.left = `${pos.left}px`;
			element.style.bottom = `${pos.bottom}px`;
			this.container.appendChild(element);

			element.addEventListener('dragstart', (e) => {
				console.log('dragstart', e);
				this.dragData = {
					element,
					offsetX: e.clientX - element.offsetLeft,
					offsetY: e.clientY - element.offsetTop,
				};
			});
			element.addEventListener('dragend', (e) => {
				console.log('dragend', e);
				let left = e.clientX - this.dragData.offsetX;
				let top = e.clientY - this.dragData.offsetY;
				this.putNode(element, left, top);
				this.envelope.points[i] = this.pos2Point({ x: left, y: top });
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


function SynthControlBindings(synth) {
	this.synth = synth;

	// Oscar

	this.oscarGainControl = document.querySelector('#oscarGain');
	this.oscarGainControlUI = new GainControlUI(this.synth.oscar, this.oscarGainControl);

	this.oscarGainEnvelope = document.querySelector('#oscarGainEnvelope');
	this.oscarGainEnvelopeUI = new EnvelopeUI(this.synth.oscar.gainEnvelope, oscarGainEnvelope);


	// Osiris

	this.osirisGainControl = document.querySelector('#osirisGain');
	this.osirisGainControlUI = new GainControlUI(this.synth.osiris, this.osirisGainControl);

	this.osirisGainEnvelope = document.querySelector('#osirisGainEnvelope');
	this.osirisGainEnvelopeUI = new EnvelopeUI(this.synth.osiris.gainEnvelope, osirisGainEnvelope);
}