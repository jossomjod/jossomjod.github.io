console.log('Is secure context:', window.isSecureContext);


const ac = new (window.AudioContext || window.webkitAudioContext);
var clipboard = {
	notes: '',
	synth: '',
};

function saveNotesToClipboard(notes) {
	clipboard.notes = JSON.stringify(notes);
}
function getNotesFromClipboard() {
	return JSON.parse(clipboard.notes ?? '{}');
}

function saveSynthToClipboard(synth) {
	clipboard.synth = JSON.stringify(synth);
}
function getSynthFromClipboard() {
	return JSON.parse(clipboard.synth ?? '{}');
}

var jodConfiguration = {
	animations: true,
};

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
let noteOffset = 3;


var keyboardKeys = {};

function generateKeyDict() {
	lowerKeys.forEach((k, i) => keyboardKeys[k] = { down: false, id: null, index: i });
	upperKeys.forEach((k, i) => keyboardKeys[k] = { down: false, id: null, index: i + 13 });
}
generateKeyDict();




// MASTER Gain

const masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.2;

const masterGainUI = document.querySelector('#masterGain');
masterGainUI.value = masterGain.gain.value;
masterGainUI.addEventListener('input', () => {
	masterGain.gain.value = masterGainUI.value;
});



// CONFIGURATION


const animationsCheckbox = document.querySelector('#animationsCheckbox');
animationsCheckbox.onchange = () => jodConfiguration.animations = this.animationsCheckbox.checked;




// OVERLAY

var jodOverlay = document.querySelector('#jodOverlay');

function openOverlay(onClose = () => null) {
	jodOverlay.classList.toggle('invisible', false);
	
}








// NOTE MANAGER STUFF-----------------------------

const noteManagerGain = ac.createGain();
noteManagerGain.gain.value = 1.0;
noteManagerGain.connect(masterGain);

var noteManager = new NoteManager(ac, noteManagerGain);

var noteManagerUi = new NoteManagerUI(noteManager);

noteManagerUi.renderAll();


const addOscBtn = document.querySelector('#addOscBtn');
addOscBtn.onclick = () => noteManagerUi.addOsc();

const fxAddSelect = document.querySelector('#fxAddSelect');
const addFxBtn = document.querySelector('#addFxBtn');
addFxBtn.onclick = () => noteManagerUi.addFx(fxAddSelect.value);



// SAVE / LOAD ---------------------------------
const quickSaveName = 'joddaw-save-data';
var saveNameInput = document.querySelector('#saveNameInput');
var templateSelect = document.querySelector('#templateSelect');
var saveSelect = document.querySelector('#saveSelect');


saveSelect.addEventListener('change', () => {
	let name = saveSelect.value;
	if (name) {
		try {
			loadAll(name);
		} catch {
			name = 'ERROR';
		}
	}
	saveNameInput.value = name;
	templateSelect.value = 0;
	document.activeElement.blur();
});


function getSaveNameList() {
	const list = [];
	for (let i = 0; i < localStorage.length; i++) {
		const name = localStorage.key(i);
		if (name !== quickSaveName) list.push(name);
	}
	return list;
}

function generateSaveSelectOptions(selectValue) {
	const value = selectValue ?? saveSelect.value;
	const optionNodes = getSaveNameList().map((n) => {
		const option = document.createElement('option');
		option.value = n;
		option.innerText = n;
		return option;
	});
	saveSelect.replaceChildren(...optionNodes);
	saveSelect.value = value;
}
generateSaveSelectOptions();

function parseTrackData(data) {
	const parsed = JSON.parse(data);
	return parsed.tracks ? parsed : { bpm: 140, tracks: parsed };
}

templateSelect.addEventListener('change', () => {
	const index = +templateSelect.value;
	const tracks = trackerTemplates[index]
	if (!tracks) throw 'No template found for index' + index;
	
	noteManager.load(parseTrackData(tracks));
	noteManagerUi.renderAll();
	saveNameInput.value = saveSelect.value = null;
	document.activeElement.blur();
});

function quickSave() {
	const data = JSON.stringify(noteManager.save());
	localStorage.setItem(quickSaveName, data);
	navigator.clipboard.writeText(data).then(() => console.log('data copied to clipboard'));
}

function quickLoad() {
	const data = localStorage.getItem(quickSaveName) ?? '[]';
	noteManager.load(parseTrackData(data));
	noteManagerUi.renderAll();
}


function saveAll(name) {
	const saveName = name || saveNameInput.value;
	if (!saveName) return;
	console.log('Saving as ', saveName);

	const data = noteManager.save();
	const stringData = JSON.stringify(data);
	if (saveName.length < 100) localStorage.setItem(saveName, stringData);
	else saveNameInput.value = '';
	navigator.clipboard.writeText(stringData).then(() => console.log('data copied to clipboard'));

	generateSaveSelectOptions();
}

function loadAll(name) {
	const saveName = name || saveNameInput.value || saveNameInput.innerHTML;
	if (!saveName) return;
	console.log('Loading ', saveName);
	
	const dataString = localStorage.getItem(saveName) ?? saveName;
	const data = parseTrackData(dataString);
	if (data) {
		noteManager.load(data);
		noteManagerUi.renderAll();
	}
}




// MISC UI STUFF ig ------------------------------------------------------


var helpBox = document.querySelector('#help-box');
function toggleHelp() {
	helpBox.classList.toggle('invisible');
}






// EVENTS----------------------------------------------------------------------

const synthBody = document.querySelector('.synth-body');
const topBar = document.querySelector('.top-bar');

synthBody.oncontextmenu = (e) => {
  e.preventDefault();
};

topBar.onkeydown = (e) => {
	e.stopPropagation();
	switch (e.which) {
		case 32: // space
			e.preventDefault();
			document.activeElement.blur();
			noteManagerUi.togglePlayback({ fromCursor: keys.ctrl });
	}
};
topBar.onkeyup = (e) => {
	e.stopPropagation();
};

saveNameInput.onkeydown = (e) => {
	e.stopPropagation();
};


// KEY STUFF

document.body.onkeydown = (e) => {
	if (e.repeat || e.isComposing || e.which === 229) return;
	e.preventDefault();
	switch (e.which) {
		case 9: // tab
			noteManagerUi.automationMode = !noteManagerUi.automationMode;
			noteManagerUi.render();
			break;
		case 32: // space
			noteManagerUi.togglePlayback({ fromCursor: e.ctrlKey || e.shiftKey });
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
		case 46: // Delete
			noteManagerUi.deleteSelectedNotes();
			break;
		case 65: // A
			if (e.ctrlKey && e.shiftKey) noteManagerUi.selectAllNotes();
			else if (e.ctrlKey) noteManagerUi.selectAllNotesInTrack();
			break;
		case 67: // C
			if (e.ctrlKey) noteManagerUi.copyNotes();
			break;
		case 86: // V
			if (e.ctrlKey) noteManagerUi.pasteNotes();
			break;
		case 83: // S
			if (e.ctrlKey) quickSave();
			break;
		case 90: // Z
			if (e.ctrlKey) quickLoad();
			break;
		case 114: // F3
			noteManagerUi.snapX = !noteManagerUi.snapX;
			break;
		case 115: // F4
			noteManagerUi.snapY = !noteManagerUi.snapY;
			break;
		case 118: // F7
			noteManagerUi.autoScrollOnPlayback = !noteManagerUi.autoScrollOnPlayback;
			break;
		case 119: // F8
			quickSave();
			break;
		case 120: // F9
			quickLoad();
			break;
	}

	switch (e.code) {
		case 'Backquote':
			noteManagerUi.toggleVisible();
			break;
	}
	toggleKeys(e, true);
};


document.body.onkeyup = (e) => {
	e.preventDefault();
	toggleKeys(e, false);
};

function toggleKeys(e, bool) {
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
			//console.log('Key event - physical:', e.code, 'which:', e.which);
			break;
	}
	if (e.ctrlKey) return;
	//if (e.code === 'BracketRight') return; // Chrome really hates this key on Nordic keyboard layouts :(

	const key = keyboardKeys[e.code];
	if (key && key.down !== bool) {
		key.down = bool;
		if (bool) key.id = noteManager.getSelectedTrack().synth.start(toneToFreq(key.index + noteOffset + 12 * octave));
		else noteManager.getSelectedTrack().synth.stop(key.id);
		return;
	}
}
