

function createTrackEntryUi(track, trackHandler) {
	const div = document.createElement('div');
	const label = document.createElement('span');
	const gain = document.createElement('jod-numb');
	const muteBtn = document.createElement('button');
	div.appendChild(label);
	div.appendChild(gain);
	div.appendChild(muteBtn);
	
	div.className = 'jodroll-track';
	div.classList.toggle('active', track.active);
	div.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		trackHandler.selectTrack(div, track);
	});
	
	label.innerHTML = track.name;
	label.addEventListener('dblclick', (e) => {
		e.stopPropagation();
		e.preventDefault();
		console.log('WOOOOOOOO');
	});

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