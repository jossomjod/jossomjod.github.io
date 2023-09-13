const ac = new (window.AudioContext || window.webkitAudioContext);


// MASTER Gain

const masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.2;

const masterGainUI = document.querySelector('#masterGain');
masterGainUI.value = masterGain.gain.value;
masterGainUI.addEventListener('input', () => {
	masterGain.gain.value = masterGainUI.value;
});


const synth = new Synth(ac, masterGain);
//const synthUi = new SynthControlBindings(synth);

/* 
const oscarWaveformUI = document.querySelector('#oscarWaveform');
oscarWaveformUI.value = synth.oscillators[0].type;
oscarWaveformUI.addEventListener('input', () => {
	synth.oscillators[0].type = oscarWaveformUI.value;
	document.activeElement.blur();
});

const osirisWaveformUI = document.querySelector('#osirisWaveform');
osirisWaveformUI.value = synth.oscillators[1].type;
osirisWaveformUI.addEventListener('input', () => {
	synth.oscillators[1].type = osirisWaveformUI.value;
	document.activeElement.blur();
});

const osmanWaveformUI = document.querySelector('#osmanWaveform');
osmanWaveformUI.value = synth.oscillators[2].type;
osmanWaveformUI.addEventListener('input', () => {
	synth.oscillators[2].type = osmanWaveformUI.value;
	document.activeElement.blur();
});

const osirisMultiplierUI = document.querySelector('#osirisMultiplier');
osirisMultiplierUI.value = synth.oscillators[1].multiplier;
osirisMultiplierUI.addEventListener('input', () => {
	synth.oscillators[1].multiplier = osirisMultiplierUI.value;
});

const osmanMultiplierUI = document.querySelector('#osmanMultiplier');
osmanMultiplierUI.value = synth.oscillators[2].multiplier;
osmanMultiplierUI.addEventListener('input', () => {
	synth.oscillators[2].multiplier = osmanMultiplierUI.value;
});


const osirisDetuneUI = document.querySelector('#osirisDetune');
const osirisCoarseUI = document.querySelector('#osirisCoarse');
osirisCoarseUI.value = Math.round(synth.oscillators[1].detune / 100);
osirisDetuneUI.value = 0.0;

const osirisDetuneInput = () => {
	synth.oscillators[1].detune = +osirisCoarseUI.value * 100 + +osirisDetuneUI.value;
	document.activeElement.blur();
}
osirisCoarseUI.addEventListener('input', osirisDetuneInput);
osirisDetuneUI.addEventListener('input', osirisDetuneInput);

const osmanDetuneUI = document.querySelector('#osmanDetune');
const osmanCoarseUI = document.querySelector('#osmanCoarse');
osmanCoarseUI.value = Math.round(synth.oscillators[2].detune / 100);
osmanDetuneUI.value = 0.0;

const osmanDetuneInput = () => {
	synth.oscillators[2].detune = +osmanCoarseUI.value * 100 + +osmanDetuneUI.value;
	document.activeElement.blur();
}
osmanCoarseUI.addEventListener('input', osmanDetuneInput);
osmanDetuneUI.addEventListener('input', osmanDetuneInput);
 */




const synthUiStuff = new SynthUi(synth);






/* const oscillatorTemplate = document.querySelector('#oscillator-template');
const oscTemplateContent = oscillatorTemplate.content;

oscillatorContainer.appendChild(oscTemplateContent); */


// TODO: Debug info element


var keys = {
	left: false,
	up: false,
	right: false,
	down: false,
	ctrl: false
};

var lowerKeys = [
	'KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ',
	'KeyM', 'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash', 'ShiftRight', 'Backslash',
];
var upperKeys = [
	'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7',
	'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight', 'Backspace', 'Enter'
];

let octave = 2;


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i + 12 });
}
generateKeyDict();


// EVENTS----------------------------------------------------------------------

/* window.oncontextmenu = (e) => {
  e.preventDefault();
}; */




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
		if (bool) key.id = synth.start(toneToFreq(key.index + 12 * octave));
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
