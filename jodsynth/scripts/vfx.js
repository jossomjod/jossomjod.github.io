
class Shaker {
	element;
	duration;
	strength;
	time = 0;
	active = false;

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

	shakeFrame = () => {
		const time = performance.now() - this.time;
		if (time >= this.duration) {
			this.reset();
			return;
		}
		const kek = 1 - time / this.duration;
		const str = this.strength * kek * kek;
		const dx = str * Math.cos(Math.random() * Math.PI * 2);
		const dy = str * Math.sin(Math.random() * Math.PI * 2);
		this.element.style.translate = `${dx}px ${dy}px`;
		
		requestAnimationFrame(this.shakeFrame);
	};

	shake(duration = this.duration, strength = this.strength)  {
		this.duration = duration;
		this.strength = strength;
		this.time = performance.now();
		if (!this.active) this.shakeFrame();
		this.active = true;
	}

	reset() {
		this.active = false;
		this.element.style.removeProperty('translate');
	}
}

