
customElements.define('envelope', Envelope);
export class Envelope extends HTMLElement {
	constructor() {
		super();
	}
}





/**
* points: { value: number, time: number }[]
*//* 
function ArrayEnvelope(ac, points = [], release = 0.0, multiplier = 1.0) {
	this.points = points;
	this.release = release;
	this.multiplier = multiplier;

	// Call this when starting a note. prop must be an AudioParam.
	this.start = (prop, mult = this.multiplier) => {
		if (!prop) return;
		let acc = ac.currentTime;
		prop.cancelScheduledValues(acc);
		prop.setValueAtTime(0, acc);

		points.forEach((p) => {
			acc += p.time;
			prop.linearRampToValueAtTime(p.value * mult, acc);
		});
	}

	// Call this when ending a note. prop must be an AudioParam.
	this.stop = (prop) => {
		if (!prop) return;
		prop.linearRampToValueAtTime(0, ac.currentTime + this.release);
	}
} */
