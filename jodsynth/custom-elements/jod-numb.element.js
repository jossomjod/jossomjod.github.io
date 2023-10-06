class JodNumbElement extends HTMLElement {
	_value = 0;
	lastValue = 0;
	_max = 1;
	min = 0;
	dragging = 0;
	offsetX = 0;
	offsetY = 0;
	wrapper = null;
	speed = 1;

	get value() {
		return this.getAttribute('value');
	}
	set value(v) {
		this._value = v ?? 0.0;
		this.setAttribute('value', v ?? 0.0);
		this.wrapper.textContent = this._value.toFixed(5);
		this.dispatchEvent(this.changed);
	}

	get max() {
		return this.getAttribute('max');
	}
	set max(v) {
		this._max = v ?? 1.0;
		this.setAttribute('max', v ?? 1.0);
	}

	attributeChangedCallback(name, old, newVal) {
		console.log('AUIOEWHIAUEH', name, old, newVal);
	}

	setValue = (value) => {
		this._value = value;
		this.wrapper.textContent = this._value.toFixed(5);
		this.dispatchEvent(this.changed);
	}
	changed = new Event('changed');

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		const wrapper = document.createElement("div");
		this.wrapper = wrapper;
		wrapper.setAttribute("class", "wrapper");
		wrapper.textContent = this._value;

		wrapper.addEventListener('mousedown', (e) => {
			console.log('MOUSEDOWN on JOD NUMB', e);
			e.preventDefault();
			e.stopPropagation();
			switch (e.buttons) {
				case 1:
					this.offsetX = e.clientX;
					this.offsetY = e.clientY;
					this.lastValue = this._value;
					this.dragging = e.buttons;
					break;
				case 4:
					this.setValue(0.0);
					break;
			}
		});

		document.addEventListener('mouseup', (e) => {
			this.dragging = e.buttons;
			this.dragObject = null;
		});

		document.addEventListener('mousemove', (e) => {
			if (this.dragging) {
				const x = Math.abs(e.clientX - this.offsetX);
				const y = e.clientY - this.offsetY;
				let mod = e.shiftKey ? 100 : e.ctrlKey ? 0.001 : 1;
				let mult = (1 + Math.floor(x / 100)) * 0.01 * this.speed;
				let value = this.lastValue + y * mult * -mod;
				value = value < this.min ? this.min : value > this._max ? this._max : value;
				this.setValue(value);
			}
		});

		this.min = +(this.getAttribute('min') ?? 0);
		this._max = +(this.getAttribute('max') ?? 1);
		this.speed = +(this.getAttribute('speed') ?? 1);

		const style = document.createElement("style");
		style.textContent = `.wrapper {
			padding: 5px;
			min-width: 40px;
			max-width: 100px;
			min-height: 20px;
			max-height: 40px;
			background-color: #3c4a5b;
			color: #cfdcff;
			border: 1px solid #345;
			border-radius: 5px;
		}`;

		this.shadowRoot.append(style, wrapper);
	}
}

customElements.define('jod-numb', JodNumbElement);