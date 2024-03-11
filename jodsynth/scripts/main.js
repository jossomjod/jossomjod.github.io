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

/* 
const synthUi = new SynthUi(synth);

const addOscBtn = document.querySelector('#addOscBtn');
addOscBtn.onclick = () => synthUi.addOsc();
 */



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

var noteManager = new NoteManager(ac, noteManagerGain, synth);

var noteManagerUi = new NoteManagerUI(noteManager, synth);

noteManagerUi.drawNotes(noteManager.notes);





// SAVE / LOAD ---------------------------------
var saveNameInput = document.querySelector('#saveNameInput');

function quickSave() {
	const notes = JSON.stringify(noteManager.notes);
	localStorage.setItem('notes', notes);
}

function quickLoad() {
	const notes = localStorage.getItem('notes') ?? '[]';
	noteManager.notes = JSON.parse(notes);
	noteManagerUi.drawNotes();
}

quickLoad();

// TODO: save synth preset
function saveAll() {
	const saveName = saveNameInput.value;
	if (!saveName) return;
	console.log('Saving as ', saveName);

	const data = {
		notes: noteManager.notes, // deprecated
		//tracks: noteManager.tracks, // TODO: Make the synth storable
	};
	localStorage.setItem(saveName, JSON.stringify(data));
}

function loadAll() {
	const saveName = saveNameInput.value || saveNameInput.innerHTML;
	if (!saveName) return;
	console.log('Loading ', saveName);
	
	const data = JSON.parse(localStorage.getItem(saveName));
	console.log('load data:', data);
	if (data) {
		noteManager.notes = data.notes;
		//noteManager.tracks = data.tracks; // Won't work until the Synth is made storable
		noteManagerUi.drawNotes();
	}
}


// EVENTS----------------------------------------------------------------------

const synthBody = document.querySelector('.synth-body');
const topBar = document.querySelector('.top-bar');

synthBody.oncontextmenu = (e) => {
  e.preventDefault();
};

topBar.onkeydown = (e) => {
	e.stopPropagation();
};
topBar.onkeyup = (e) => {
	e.stopPropagation();
};


// KEY STUFF

document.body.onkeydown = (e) => {
	if (e.repeat) return;
	e.preventDefault();
	switch (e.which) {
		case 32: // space
			noteManagerUi.togglePlayback({ fromCursor: keys.ctrl });
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
		case 115: // F4
			noteManagerUi.snapY = !noteManagerUi.snapY;
			break;
		case 119: // F8
			quickSave();
			break;
		case 120: // F9
			quickLoad();
			break;
		case 172: // That key under Esc, left of 1, above Tab
			noteManagerUi.toggleVisible();
			break;
		default:
			toggleKeys(e, true);
	}
};


document.body.onkeyup = (e) => {
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
