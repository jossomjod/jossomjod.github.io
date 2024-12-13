const playTrackAnimationFrames = [
	{ backgroundColor: '#bbbbbb', scale: '1.02' },
	{ backgroundColor: '#376cf3', scale: '1' },
];
const playSelectedTrackAnimationFrames = [
	{ backgroundColor: '#ffffff', scale: '1.05' },
	{ backgroundColor: '#77b5ff', scale: '1' },
];

function playTrackAnimation(trackElement, delay, duration, selectedTrack = false) {
	trackElement.animate(
		selectedTrack ? playSelectedTrackAnimationFrames : playTrackAnimationFrames,
		{
			delay,
			duration,
			easing: 'ease-out',
		}
	);
}


function openContextMenu(attachTo, options = [{ name: 'The Nothing option', callback: () => null }]) {
	const div = document.createElement('div');
	div.classList.add('context-menu', 'track-context-menu');
	div.replaceChildren(
		...options.map((o) => {
			const btn = document.createElement('button');
			btn.innerText = o.name;
			btn.onclick = () => { div.remove(); o.callback(); };
			btn.classList.add('context-menu-option');
			return btn;
		})
	);

	div.firstChild.focus();


	attachTo.appendChild(div);
	div.onmouseleave = () => div.remove();
}

function createTrackNameEditor(labelElement, track, trackHandler) {
	const input = document.createElement('input');
	input.classList.add('track-name-editor', 'text-input', 'invisible');
	input.value = labelElement.innerText;
	input.onkeydown = (e) => {
		e.stopPropagation();
		switch (e.code) {
			case 'Enter':
				if (input.value) trackHandler.setTrackName(track, input.value);
				labelElement.innerHTML = track.name;
			case 'Escape':
				input.classList.toggle('invisible', true);
				break;
		}
	};
	input.onblur = () => input.classList.toggle('invisible', true);

	labelElement.addEventListener('dblclick', (e) => {
		e.stopPropagation();
		e.preventDefault();
		input.value = track.name;
		input.classList.toggle('invisible', false);
		input.focus();
	});

	return input;
}

function createTrackToggleButton({ track, property, label, onclick, inverse, cssClass }) {
	const btn = document.createElement('button');
	btn.innerHTML = label;
	btn.className = 'clickable sandwich-btn';
	btn.classList.toggle(cssClass ?? 'enabled', !!track[property] === !inverse);
	btn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		onclick();
		btn.classList.toggle(cssClass ?? 'enabled', !!track[property] === !inverse);
	});
	return btn;
}


function createTrackEntryUi(track, trackHandler) {
	const div = document.createElement('div');
	const gainAndBtnRowContainer = document.createElement('div');
	const btnRow = document.createElement('div');
	const btnColumn = document.createElement('div');
	const label = document.createElement('span');
	const gain = document.createElement('jod-numb');
	const nameEditor = createTrackNameEditor(label, track, trackHandler);

	const screenShakeBtn = createTrackToggleButton({ track, property: 'screenShake', label: 'SH', onclick: () => {
		track.screenShake = !track.screenShake;
		if (track.screenShake && jodConfiguration.animations) trackHandler.screenShaker.start();
	}});
	const screenFlashBtn = createTrackToggleButton({ track, property: 'screenFlash', label: 'SF', onclick: () => {
		track.screenFlash = !track.screenFlash;
		if (track.screenFlash && jodConfiguration.animations) trackHandler.screenFlasher.start();
	}});
	const monoPitchBtn = createTrackToggleButton({ track, property: 'monoPitch', label: 'MP', onclick: () => (track.monoPitch = !track.monoPitch)});
	const muteBtn = createTrackToggleButton({ track, property: 'muted', cssClass: 'muted', label: 'M', onclick: () => trackHandler.toggleMuteTrack(track)});
	const soloBtn = createTrackToggleButton({ track, property: 'solo', label: 'S', onclick: () => trackHandler.toggleSoloTrack(track)});
	const automationBtn = createTrackToggleButton({ track, property: 'disableNoteAutomation', inverse: true, label: 'A', onclick: () => {
		trackHandler.toggleDisableNoteAutomationForTrack(track);
	}});
	
	btnRow.append(screenShakeBtn, screenFlashBtn, monoPitchBtn);
	gainAndBtnRowContainer.append(gain, btnRow);
	btnColumn.append(soloBtn, muteBtn, automationBtn);
	div.append(nameEditor, label, gainAndBtnRowContainer, btnColumn);
	
	div.id = 'track-entry-' + track.id;
	div.classList.add('jodroll-track');
	if (track.active) div.classList.add('active');

	div.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.selectTrack(div, track);
	});
	div.addEventListener('contextmenu', (e) => {
		e.stopPropagation();
		e.preventDefault();
		openContextMenu(div, [
			{ name: 'Delete', callback: () => trackHandler.deleteTrack(track) },
		]);
	});
	
	label.classList.add('track-label');
	label.innerHTML = track.name;

	gainAndBtnRowContainer.className = 'track-gain-and-btn-row';
	btnRow.className = 'track-btn-row'

	gain.setAttribute('min', 0);
	gain.setAttribute('max', 1);
	gain.setAttribute('speed', 0.1);
	gain.setAttribute('value', track.gain ?? 1);
	gain.addEventListener('changed', () => {
		trackHandler.setTrackGain(track, +gain.value);
		muteBtn.classList.toggle('muted', track.muted); // unmute when changing gain
	});

	btnColumn.className = 'track-btn-column';
	return div;
}