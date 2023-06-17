
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
//TODO: toPoint(), toPos()

	this.container.addEventListener('dragenter', (e) => {
		//console.log('dragenter', e);
		e.preventDefault();
	})
	document.addEventListener('dragover', (e) => {
		e.preventDefault();
		let left = e.clientX - this.dragData.offsetX;
		let top = e.clientY - this.dragData.offsetY;
		if (left < 0) left = 0;
		else if (left > this.rect.w) left = this.rect.w;
		if (top < 0) top = 0;
		else if (top > this.rect.h) top = this.rect.h;
		this.dragData.element.style.left = left + 'px';
		this.dragData.element.style.top = top + 'px';
	});

	this.generateNodes = (points) => {
		return points.map((point) => {
			const element = document.createElement('div');
			element.setAttribute('draggable', true);
			element.classList.add('envelope-node');
			element.style.left = `${point.time * 100}px`;
			element.style.bottom = `${point.value * 100}px`;
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
				if (left < 0) left = 0;
				else if (left > this.rect.w) left = this.rect.w;
				if (top < 0) top = 0;
				else if (top > this.rect.h) top = this.rect.h;
				element.style.left = left + 'px';
				element.style.top = top + 'px';
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

	this.oscarGainControl = document.querySelector('#oscarGain');
	this.oscarGainControlUI = new GainControlUI(this.synth.oscar, this.oscarGainControl);

	this.oscarGainEnvelope = document.querySelector('#oscarGainEnvelope');
	this.oscarGainEnvelopeUI = new EnvelopeUI(this.synth.oscar.gainEnvelope, oscarGainEnvelope);
}