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


const oscillatorContainer = document.querySelector('.oscillator-container');
const oscillatorTemplate = document.querySelector('#oscillator-template');
const oscTemplateContent = oscillatorTemplate.content;
oscillatorContainer.appendChild(oscTemplateContent);



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
	'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight',
];


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, index: i + 12 });
}
generateKeyDict();
console.log(keyboardKeys);






// EVENTS----------------------------------------------------------------------

window.oncontextmenu = (e) => {
  e.preventDefault();
};




// KEY STUFF

document.body.onkeydown = function(e) {
	if (e.repeat) return;
	e.preventDefault();
	toggleKeys(e, true);
};


document.body.onkeyup = function(e) {
	e.preventDefault();
	toggleKeys(e, false);
};

function toggleKeys(e, bool) {
	const key = keyboardKeys[e.code];
	if (key) {
		key.down = bool;
		if (bool) key.synth.start(toneToFreq(key.index + 24));
		else key.synth.stop();
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
			console.log('Key event - physical:', e.code);
			break;
	}
}
