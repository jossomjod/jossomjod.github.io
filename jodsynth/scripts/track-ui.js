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
	const label = document.createElement('span');
	const gain = document.createElement('jod-numb');
	const muteBtn = document.createElement('button');
	const nameEditor = createTrackNameEditor(label, track, trackHandler);
	div.replaceChildren(nameEditor, label, gain, muteBtn);

	div.shaker = new Shaker(div, 400, 10);
	
	div.classList.add('jodroll-track');
	if (track.active) div.classList.add('active');
	console.log('WTF????', track.active, div.className);

	div.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.selectTrack(div, track);
	});
	div.addEventListener('contextmenu', (e) => {
		e.stopPropagation();
		e.preventDefault();
		openContextMenu(div, [{ name: 'Delete', callback: () => trackHandler.deleteTrack(track) }]);
	});
	
	label.classList.add('track-label');
	label.innerHTML = track.name;

	gain.setAttribute('min', 0);
	gain.setAttribute('max', 1);
	gain.setAttribute('speed', 0.1);
	gain.setAttribute('value', track.gain ?? 1);
	gain.addEventListener('changed', () => {
		trackHandler.setTrackGain(track, +gain.value);
		muteBtn.classList.toggle('muted', track.muted); // unmute when changing gain
	});

	muteBtn.innerHTML = 'M';
	muteBtn.className = 'clickable circle small btn';
	muteBtn.classList.toggle('muted', track.muted);
	muteBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.toggleMuteTrack(track);
		muteBtn.classList.toggle('muted', track.muted);
	});
	return div;
}