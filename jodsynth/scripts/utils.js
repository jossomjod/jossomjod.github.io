
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
