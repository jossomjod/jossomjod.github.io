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
let noteOffset = 2;


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { synth: new Synth(ac, masterGain), down: false, id: null, index: i + 13 });
}
generateKeyDict();





// NOTE MANAGER STUFF-----------------------------

const noteManagerGain = ac.createGain();
noteManagerGain.gain.value = 1.0;
noteManagerGain.connect(masterGain);

var noteManager = new NoteManager(ac, noteManagerGain);

var noteManagerUi = new NoteManagerUI(noteManager, synth);

noteManagerUi.drawNotes(noteManager.notes);





// SAVE / LOAD ---------------------------------
var saveData = { notes: '[]' };


function saveState() {
	saveData.notes = JSON.stringify(noteManager.notes);
	console.log('saving...', saveData.notes);
	localStorage.setItem('notes', saveData.notes);
}

function loadState() {
	console.log('loading...');
	saveData.notes = localStorage.getItem('notes') ?? '[]';
	noteManager.notes = JSON.parse(saveData.notes);
	noteManagerUi.drawNotes();
}



// EVENTS----------------------------------------------------------------------

window.oncontextmenu = (e) => {
  e.preventDefault();
};




// KEY STUFF

document.body.onkeydown = function(e) {
	if (e.repeat) return;
	e.preventDefault();
	switch (e.which) {
		case 32: // space
			noteManager.play();
			break;
		case 33: // pgup
			octave++;
			break;
		case 34: // pgdown
			octave--;
			break;
		case 35: // End
			noteOffset--;
			break;
		case 36: // Home
			noteOffset++;
			break;
		case 114: // F3
			noteManagerUi.snapX = !noteManagerUi.snapX;
			break;
		case 115: // F5
			noteManagerUi.snapY = !noteManagerUi.snapY;
			break;
		case 116: // F5
			saveState();
			break;
		case 120: // F9
			loadState();
			break;
		case 172: // That key under Esc, left of 1, above Tab
			noteManagerUi.toggleVisible();
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
