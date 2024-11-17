const playTrackAnimationFrames = [
	{ backgroundColor: '#bbbbbb', scale: '1.1' },
	{ backgroundColor: '#376cf3', scale: '1' },
];
const playSelectedTrackAnimationFrames = [
	{ backgroundColor: '#ffffff', scale: '1.2' },
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


function createTrackEntryUi(track, trackHandler) {
	const div = document.createElement('div');
	const gainAndBtnRowContainer = document.createElement('div');
	const btnRow = document.createElement('div');
	const btnColumn = document.createElement('div');
	const label = document.createElement('span');
	const gain = document.createElement('jod-numb');
	const screenShakeBtn = document.createElement('button');
	const screenFlashBtn = document.createElement('button');
	const muteBtn = document.createElement('button');
	const soloBtn = document.createElement('button');
	const automationBtn = document.createElement('button');
	const nameEditor = createTrackNameEditor(label, track, trackHandler);
	
	btnRow.append(screenShakeBtn, screenFlashBtn);
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

	screenShakeBtn.innerHTML = 'SH';
	screenShakeBtn.className = 'clickable sandwich-btn';
	screenShakeBtn.classList.toggle('enabled', !!track.screenShake);
	screenShakeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		track.screenShake = !track.screenShake;
		screenShakeBtn.classList.toggle('enabled', !!track.screenShake);
		if (track.screenShake) trackHandler.screenShaker.start();
	});
	screenFlashBtn.innerHTML = 'FL';
	screenFlashBtn.className = 'clickable sandwich-btn';
	screenFlashBtn.classList.toggle('enabled', !!track.screenFlash);
	screenFlashBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		track.screenFlash = !track.screenFlash;
		screenFlashBtn.classList.toggle('enabled', !!track.screenFlash);
		if (track.screenFlash) trackHandler.screenFlasher.start();
	});

	btnColumn.className = 'track-btn-column';

	soloBtn.innerHTML = 'S';
	soloBtn.className = 'clickable sandwich-btn';
	soloBtn.classList.toggle('enabled', !!track.solo);
	soloBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.toggleSoloTrack(track);
		soloBtn.classList.toggle('enabled', !!track.solo);
	});

	muteBtn.innerHTML = 'M';
	muteBtn.className = 'clickable sandwich-btn';
	muteBtn.classList.toggle('muted', track.muted);
	muteBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.toggleMuteTrack(track);
		muteBtn.classList.toggle('muted', track.muted);
	});

	automationBtn.innerHTML = 'A';
	automationBtn.className = 'clickable sandwich-btn';
	automationBtn.classList.toggle('enabled', !track.disableNoteAutomation);
	automationBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.toggleDisableNoteAutomationForTrack(track);
		automationBtn.classList.toggle('enabled', !track.disableNoteAutomation);
	});
	return div;
}