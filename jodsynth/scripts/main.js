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





// CONFIGURATION

const defaultConfig = {
	animations: true,
	autoSave: false,
	autoScroll: true,
};

function loadConfig() {
	const config = defaultConfig;
	const loaded = SaveManager.loadConfiguration();
	if (loaded) Object.assign(config, loaded);
	return config;
}

var jodConfiguration = loadConfig();

const animationsCheckbox = document.querySelector('#animationsCheckbox');
animationsCheckbox.checked = !!jodConfiguration.animations;
animationsCheckbox.onchange = () => {
	jodConfiguration.animations = animationsCheckbox.checked;
	SaveManager.saveConfiguration(jodConfiguration);
};





// MASTER Gain

const masterGain = ac.createGain();
masterGain.connect(ac.destination);
masterGain.gain.value = 0.2;

const masterGainUI = document.querySelector('#masterGain');
masterGainUI.value = masterGain.gain.value;
masterGainUI.addEventListener('input', () => {
	masterGain.gain.value = masterGainUI.value;
});




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

function generateSaveSelectOptions(selectValue) {
	const value = selectValue ?? saveSelect.value;
	const optionNodes = SaveManager.getSaveNames().map((n) => {
		const option = document.createElement('option');
		option.value = n;
		option.innerText = n;
		return option;
	});
	saveSelect.replaceChildren(...optionNodes);
	saveSelect.value = value;
}
generateSaveSelectOptions();

templateSelect.addEventListener('change', () => {
	const index = +templateSelect.value;
	const tracks = trackerTemplates[index]
	if (!tracks) throw 'No template found for index' + index;
	
	noteManager.load(SaveManager.parseTrackData(tracks));
	noteManagerUi.renderAll();
	saveNameInput.value = saveSelect.value = null;
	document.activeElement.blur();
});

function quickSave() {
	SaveManager.quickSave(noteManager.save());
}

function quickLoad() {
	noteManager.load(SaveManager.quickLoad());
	noteManagerUi.renderAll();
}


function saveAll(name) {
	const saveName = name || saveNameInput.value;
	if (!saveName) return;

	const data = noteManager.save();
	if (saveName.length < 250) SaveManager.saveAll(data, saveName);
	else saveNameInput.value = '';

	generateSaveSelectOptions();
}

function loadAll(name) {
	const saveName = name || saveNameInput.value || saveNameInput.innerHTML;
	if (!saveName) return;
	
	const data = SaveManager.loadAll(saveName);
	if (data) {
		noteManager.load(data);
		noteManagerUi.renderAll();
	}
}




// OVERLAY / DIALOGS ------------------------------------------------------

var jodOverlayOpen = false;
var jodOverlayContainer = document.querySelector('.jod-overlay-container');
var jodOverlayContent = document.querySelector('.jod-overlay-content');
var jodOverlay = document.querySelector('#jodOverlay');

const helpIcon = document.querySelector('.help-icon');
const helpPanelTemplate = document.querySelector('#helpPanel');
const helpPanel = helpPanelTemplate.content.cloneNode(true);
const helpBox = helpPanel.querySelector('.help-box');

function toggleOverlay(visible = false) {
	return jodOverlay.classList.toggle('overlay-visible', visible);
}

function toggleHelp() {
	openPopup(helpBox, { right: 5 + '%', top: 5 + '%' });
}

function toggleHelpSection(id) {
	const section = document.querySelector(id);
	const header = section.previousElementSibling;
	const height = section.firstElementChild.clientHeight;
	const expanded = section.classList.toggle('expanded');
	section.style = expanded ? `height: calc(3em + ${height}px)` : '';
	header.classList.toggle('expanded');
}

jodOverlay.onclick = () => {
	closePopup();
};

/**
 * @param {HTMLElement} element 
 */
function openPopup(element, style = { left: 0, top: 0 }) {
	jodOverlayContent.replaceChildren(element);
	Object.assign(element.style, style);
	toggleOverlay(true);
}

function closePopup() {
	jodOverlayContent.replaceChildren();
	toggleOverlay(false);
	jodOverlayOpen = false;
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
			noteManagerUi.togglePlayback({ fromCursor: e.ctrlKey || e.shiftKey });
	}
};
topBar.onkeyup = (e) => {
	e.stopPropagation();
};

saveNameInput.onkeydown = (e) => {
	e.stopPropagation();
};
/* 
window.onload = () => {
	const autoSave = SaveManager.loadAutoSave();
	if (!autoSave) return;
	noteManager.load(autoSave);
	noteManagerUi.renderAll();
}; */

window.onbeforeunload = (e) => {
	if (SaveManager.hasUnsavedChanges) {
		e.preventDefault();
		e.returnValue = false;
		return 'unsaved changes are unsaved, oh no, how terrible';
	}
	//SaveManager.autoSave(noteManager.save());
};


// KEY STUFF

document.body.onkeydown = (e) => {
	if (e.repeat || e.isComposing || e.which === 229) return;
	e.preventDefault();
	switch (e.which) {
		case 9: // tab
			noteManagerUi.toggleMode();
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
		case 76: // L
			if (e.ctrlKey) noteManagerUi.toggleLooping();
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
		case 'KeyQ':
			if (noteManagerUi.mode) noteManagerUi.toggleMode(EModes.pitchAutomation);
			break;
		case 'KeyW':
			if (noteManagerUi.mode) noteManagerUi.toggleMode(EModes.automation);
			break;
		case 'KeyE':
			if (noteManagerUi.mode) noteManagerUi.toggleMode(EModes.panAutomation);
			break;
		case 'KeyA':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(noteManagerUi.selectedOsc - 1);
			break;
		case 'KeyD':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(noteManagerUi.selectedOsc + 1);
			break;
		case 'Digit1':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(0);
			break;
		case 'Digit2':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(1);
			break;
		case 'Digit3':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(2);
			break;
		case 'Digit4':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(3);
			break;
		case 'Digit5':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(4);
			break;
		case 'Digit6':
			if (noteManagerUi.mode) noteManagerUi.selectOsc(5);
			break;
	}
	toggleKeys(e, true);
};


document.body.onkeyup = (e) => {
	e.preventDefault();
	toggleKeys(e, false);
};

function toggleKeys(e, bool) {
	//console.log('Key event - physical:', e.code, 'which:', e.which);
	if (e.ctrlKey) return;
	//if (e.code === 'BracketRight') return; // Chrome really hates this key on Nordic keyboard layouts :(
	if (noteManagerUi.mode) return;

	const key = keyboardKeys[e.code];
	if (key && key.down !== bool) {
		key.down = bool;
		if (bool) key.id = noteManager.getSelectedTrack().synth.start(toneToFreq(key.index + noteOffset + 12 * octave));
		else noteManager.getSelectedTrack().synth.stop(key.id);
		return;
	}
}
