class CssAnimator {
	element;
	duration;
	strength;
	time = 0;
	active = false;

	animate = (_element, _time) => null;

	/**
	 * @param {HTMLElement} element
	 * @param {number} duration
	 * @param {number} strength
	 */
	constructor(element, duration = 500, strength = 20) {
		this.element = element;
		this.duration = duration;
		this.strength = strength;
	}

	doFrame = () => {
		const time = performance.now() - this.time;
		if (time >= this.duration) {
			this.reset();
			return;
		}
		const invTime = 1 - time / this.duration;
		this.animate(this.element, invTime);
		
		requestAnimationFrame(this.doFrame);
	};

	start(duration = this.duration, strength = this.strength)  {
		this.duration = duration;
		this.strength = strength;
		this.time = performance.now();
		if (!this.active) this.doFrame();
		this.active = true;
	}

	reset() {
		this.active = false;
	}
}

class CssShaker extends CssAnimator {
	animate = (element, time) => {
		const str = this.strength * time * time;
		const dx = str * Math.cos(Math.random() * Math.PI * 2);
		const dy = str * Math.sin(Math.random() * Math.PI * 2);
		element.style.translate = `${dx}px ${dy}px`;
	};

	reset() {
		super.reset();
		this.element.style.removeProperty('translate');
	}
}

class CssFlasher extends CssAnimator {
	constructor(element, duration = 400, strength = 1) {
		super(element, duration, strength);
	}

	animate = (element, time) => {
		const str = this.strength * time * time;
		element.style.opacity = str;
	};

	reset() {
		super.reset();
		this.element.style.removeProperty('opacity');
	}
}