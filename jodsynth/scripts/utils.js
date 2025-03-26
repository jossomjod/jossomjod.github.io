
function freqToTone(freq) {
	return 12 * Math.log2(freq / 440) + 49;
}

function toneToFreq(tone) {
	return 440 * Math.pow(2, (tone - 49) / 12);
}

function beatsToSeconds(beats, bpm) {
	return 60 * beats / bpm;
}

function secondsToBeats(sec, bpm) {
	return bpm * sec / 60;
}


function lerp(b, a, t) {
	return a * t + b * (1 - t);
}


function makeSerializable(obj) {
	return Object.entries(obj)
		.filter(([,v]) => typeof v !== 'function')
		.reduce((prev, [key, value]) => {
			prev[key] = (!!value && typeof value === 'object') ? makeSerializable(value) : value;
			return prev;
		}, {});
}


function getRandomColor(range = 255) {
	if (range > 255) range = 255;
	if (range < 0) range = 0;
	const diff = 255 - range;
	const r = Math.floor(Math.random() * range + diff);
	const g = Math.floor(Math.random() * range + diff);
	const b = Math.floor(Math.random() * range + diff);
	const col = r << 16 | g << 8 | b;
	return `#${col.toString(16)}`;
}