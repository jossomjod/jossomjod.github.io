const ac = new (window.AudioContext || window.webkitAudioContext);




// REVERB EXPERIMENTS

// Buffer
const bufferSize = ac.sampleRate * 1.0;
const buford = ac.createBuffer(2, bufferSize, ac.sampleRate);
const bufL = buford.getChannelData(0);
const bufR = buford.getChannelData(1);
for (let i = 0; i < bufferSize; i++) {
	bufL[i] = Math.random() * 2 - 1;
	bufR[i] = Math.random() * 2 - 1;
}

const convolo = ac.createConvolver();
convolo.buffer = buford;

const reverbGain = new GainNode(ac, { value: 1.0 });


const reverbGainUI = document.querySelector('#reverbGain');
reverbGainUI.value = reverbGain.gain.value;
reverbGainUI.addEventListener('input', () => {
	reverbGain.gain.value = reverbGainUI.value;
});


// MASTER Gain

const masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.2;

const masterGainUI = document.querySelector('#masterGain');
masterGainUI.value = masterGain.gain.value;
masterGainUI.addEventListener('input', () => {
	masterGain.gain.value = masterGainUI.value;
});


const synth = new Synth(ac);

const synthGain = ac.createGain();
synthGain.gain.value = 1.0;

synth.connect(masterGain);

synth.connect(convolo).connect(reverbGain).connect(synthGain).connect(masterGain);


const masterDelay = ac.createDelay(2);
masterDelay.delayTime.value = 0.4;
const masterDelayFeedback = ac.createGain();
masterDelayFeedback.gain.value = 0.16;

if (true) { // Delay
synthGain
	.connect(masterDelay)
	.connect(masterDelayFeedback)
	.connect(masterDelay)
	.connect(masterGain);
}


const synthUi = new SynthUi(synth);

const addOscBtn = document.querySelector('#addOscBtn');
addOscBtn.onclick = () => synthUi.addOsc();




var keys = {
	left: false,
	up: false,
	right: false,
	down: false,
	ctrl: false
};

var lowerKeys = [
	'IntlBackslash', 'KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ',
	'KeyM', 'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash', 'ShiftRight', 'Backslash',
];
var upperKeys = [
	'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7',
	'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight', 'Backspace', 'Enter'
];

let octave = 2;
let noteOffset = 0;


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i + 13 });
}
generateKeyDict();


// EVENTS----------------------------------------------------------------------

window.oncontextmenu = (e) => {
  e.preventDefault();
};




// KEY STUFF

document.body.onkeydown = function(e) {
	if (e.repeat) return;
	e.preventDefault();
	switch (e.which) {
		case 33:
			octave++;
			break;
		case 34:
			octave--;
			break;
		case 35:
			noteOffset--;
			break;
		case 36:
			noteOffset++;
			break;
		default:
			toggleKeys(e, true);
	}
};


document.body.onkeyup = function(e) {
	e.preventDefault();
	toggleKeys(e, false);
};

function toggleKeys(e, bool) {
	const key = keyboardKeys[e.code];
	if (key) {
		key.down = bool;
		if (bool) key.id = synth.start(toneToFreq(key.index + noteOffset + 12 * octave));
		else synth.stop(key.id);
		return;
	}

	switch (e.which) {
		case 37:
			keys.left = bool;
			break;
		case 38:
			keys.up = bool;
			break;
		case 39:
			keys.right = bool;
			break;
		case 40:
			keys.down = bool;
			break;
		case 17:
			keys.ctrl = bool;
			break;
		default:
			console.log('Key event - physical:', e.code, 'which:', e.which);
			break;
	}
}
