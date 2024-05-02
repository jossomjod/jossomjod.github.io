function Rect(x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
}

const jodColors = {
	background: '#000000',
	caret: '#c7bc8f',
	gridReference: '#579cef',
	gridLine: '#a7cab322',
	gridOctave: '#97a6ca44',
	gridBar: '#97a6ca44',
	gridBeat: '#a3adba2c',
	selectArea: '#88ccff66',
	selectedNote: '#9259f2',
	note: '#6699ff',
	resizeHandle: '#99c9ff',
	fadedNote: '#6699ff3c',
	fadedResizeHandle: '#99c9ff6c',
	automationBox: '#387f6caa',
	automationNode: '#fca372',
	automationLine: '#3afa8c99',
	releaseBox: '#386e62aa',
};

function NoteManagerUI(noteManager) {
	this.trackerContainer = document.querySelector('.tracker-container');
	this.jodrollTemplate = document.querySelector('#jodroll-template');
	this.jodroll = this.jodrollTemplate.content.cloneNode(true);
	this.trackContainer = document.querySelector('.track-container');
	this.addTrackBtn = document.querySelector('#addTrackBtn');
	this.bpmUi = document.querySelector('#bpmUi');
	this.bpmUi.onchange = () => noteManager.setBpm(this.bpmUi.value);
	this.canvas = this.jodroll.querySelector('#jodroll-main-canvas');
	this.ctx = this.canvas.getContext('2d');

	this.currentSynthUi;
	this.currentFxUi;

	this.pxPerBeat = 50;
	this.pxPerTone = 10;
	this.width = this.trackerContainer.width = window.innerWidth - 222;
	this.height = this.canvas.height = this.trackerContainer.height = 600;
	this.canvas.width = this.width;
	this.scrollX = 0;
	this.scrollY = 0;
	this.noteHeight = this.pxPerTone;
	this.newNoteDuration = 1;
	this.isPlaying = () => noteManager.isPlaying;
	this.autoScrollOnPlayback = false;

	this.primaryAction = 1;
	this.secondaryAction = 2;
	this.scrollAction = 4;

	this.beatsPerBar = 4; // the top number in the time signature
	this.beatDivisor = 4; // the bottom number in the time signature
	this.gridSizeTime = 0.25; // 4 vertical lines per beat   TODO
	this.gridSizeX = this.pxPerBeat;
	this.offsetY = this.pxPerTone / 2;
	this.snapX = true;
	this.snapY = true;

	this.clickedNoteIndex = -1;
	this.clickedNote = null;
	this.noteMinDuration = 0.01;
	this.previewNoteId = null;
	this.isResizing = false;
	this.resizeTriggerSize = 10;
	this.automationBoxHeight = 70;
	this.automationMode = false;

	this.selectedNotes = [];
	this.isSelectingArea = false;
	this.areaSelectAABB = { ax: 0, ay: 0, bx: 0, by: 0 };

	this.cursorX = 0;
	this.cursorTime = 0;
	this.endTime = noteManager.getEndTime() || this.beatsPerBar;

	this.trackerContainer.addEventListener('mousedown', (e) => {
		e.preventDefault();
		e.stopPropagation();
		document.activeElement.blur();

		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);
		
		const time = this.xToTime(realX);
		const snappedTime = this.snapToGridTime(time);
		const tone = this.yToTone(realY); // TODO: use time and tone instead of x and y as much as possible
		const snappedTone = this.snapToGridTone(tone);

		switch (e.buttons) {
			case this.primaryAction:
				if (this.clickedNote) this.previewNote(false);
				this.clickedNoteIndex = this.getNoteIndexAtPos(realX, realY);

				if (e.ctrlKey) {
					if (this.clickedNoteIndex > -1) {
						const idx = this.selectedNotes.findIndex((s) => s === this.clickedNoteIndex);
						if (idx > -1) this.selectedNotes.splice(idx, 1);
						else this.selectedNotes.push(this.clickedNoteIndex);
						this.render();
						break;
					}

					this.areaSelectAABB.ax = realX;
					this.areaSelectAABB.ay = realY;
					this.areaSelectAABB.bx = realX;
					this.areaSelectAABB.by = realY;
					this.isSelectingArea = true;
					break;
				}


				if (this.clickedNoteIndex > -1) {
					const idx = this.selectedNotes.findIndex((s) => s === this.clickedNoteIndex);
					if (idx === -1) {
						this.selectedNotes = [this.clickedNoteIndex];
						this.render();
					}

					this.clickedNote = noteManager.getSelectedTrack().notes[this.clickedNoteIndex];
					this.clickedNoteInitial = { ...this.clickedNote };
					this.isResizing = this.checkResizeTrigger(this.clickedNote, realX);
				} else {
					if (this.snapY) realY = this.snapToGridY(realY);
					if (this.snapX) realX = this.snapToGridX(realX);
					this.addNote(realX, realY);
					this.selectedNotes = [this.clickedNoteIndex];
					this.render();
				}
				this.previewNote(true);
				break;
			case this.secondaryAction:
				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
		}
	});
	this.trackerContainer.addEventListener('mouseup', (e) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (~e.buttons & this.primaryAction) {
			if (this.isSelectingArea) {
				this.isSelectingArea = false;
				this.selectedNotes = this.getNoteIndicesInAABB(this.areaSelectAABB.ax, this.areaSelectAABB.ay, this.areaSelectAABB.bx, this.areaSelectAABB.by);
				this.render();
			}

			if (this.clickedNote) {
				this.newNoteDuration = this.clickedNote.duration;
				this.endTime = Math.ceil(noteManager.getEndTime() / this.beatsPerBar) * this.beatsPerBar;
			}

			this.previewNote(false);
			this.clickedNote = null;
			this.clickedNoteIndex = -1;
			this.isResizing = false;
		}
	});

	this.trackerContainer.oncontextmenu = (e) => e.preventDefault();

	this.trackerContainer.addEventListener('mousemove', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);
		this.cursorX = realX;
		this.cursorTime = this.xToTime(this.cursorX);

		const scrollHack = +e.altKey * this.scrollAction; // alternative to middle mouse button
		const fakeButtons = e.buttons | scrollHack;

		switch (fakeButtons) {
			case this.primaryAction:
				if (this.snapX) realX = this.snapToGridX(realX);
				if (this.snapY) realY = this.snapToGridY(realY);

				if (this.isSelectingArea) {
					this.areaSelectAABB.bx = realX;
					this.areaSelectAABB.by = realY;
					this.render();
					break;
				}

				if (this.clickedNote) {
					const dTime = this.xToTime(realX) - this.clickedNote.startTime;
					if (this.isResizing) {
						this.resizeNotesBy(dTime);
						break;
					}
					const dTone = this.yToTone(realY) - this.clickedNote.tone;
					this.moveNotesBy(dTime, dTone);
					this.previewNoteId.forEach((pn) => pn.oscillator.frequency.value = toneToFreq(this.clickedNote.tone));
				}
				break;
			case this.secondaryAction:
				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
			case this.scrollAction:
				this.scrollX += e.movementX;
				this.scrollY -= e.movementY;
				this.render();
				break;
		}
	});


	this.trackerContainer.addEventListener('wheel', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const cursorTime = this.xToTime(this.cursorX);
		this.pxPerBeat -= Math.sign(e.deltaY) * this.pxPerBeat * 0.2;
		this.gridSizeX = this.pxPerBeat;
		this.scrollX = -cursorTime * this.pxPerBeat + this.cursorX;
		this.render();
	});
	
	this.trackerContainer.appendChild(this.jodroll);

	this.timeToX = (time) => {
		return this.scrollX + time * this.pxPerBeat;
	};
	this.xToTime = (x) => {
		return (x - this.scrollX) / this.pxPerBeat;
	};
	this.toneToY = (tone) => {
		return this.height - (this.scrollY + tone * this.pxPerTone);
	};
	this.yToTone = (y) => {
		return (y - this.scrollY) / this.pxPerTone;
	};
	this.noteToRect = (note) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		return { x, y, w, h };
	};
	this.getNotePos = (note) => {
		return { x: this.timeToX(note.startTime), y: this.toneToY(note.tone) };
	};

	this.snapToGridX = (x) => {
		const t = this.xToTime(x);
		return this.timeToX(Math.floor(t / this.gridSizeTime) * this.gridSizeTime);
	};
	this.snapToGridY = (y) => {
		const t = this.yToTone(y);
		return this.height - this.toneToY(Math.ceil(t));
	};
	this.snapToGridTime = (t) => {
		return Math.floor(t / this.gridSizeTime) * this.gridSizeTime;
	};
	this.snapToGridTone = (t) => {
		return Math.floor(t / this.pxPerTone) * this.pxPerTone;
	};

	this.getNoteAtPos = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		return noteManager.getSelectedTrack().notes.find((n) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			return time > t && time < d && tone < nt && tone > (nt - 1);
		});
	};

	this.getNoteIndexAtPos = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		return noteManager.getSelectedTrack().notes.findIndex((n) => {
			const t = n.startTime;
			const d = t + n.duration + this.resizeTriggerSize / this.pxPerBeat / 2;
			const nt = n.tone;
			return time > t && time < d && tone < nt && tone > (nt - 1);
		});
	};
	this.checkResizeTrigger = (note, realX) => {
		const endX = this.timeToX(note.startTime + note.duration);
		return Math.abs(realX - endX) < this.resizeTriggerSize;
	};

	this.getNoteIndicesInAABB = (aX, aY, bX, bY) => {
		const ax = this.xToTime(Math.min(aX, bX));
		const ay = this.yToTone(Math.min(aY, bY));
		const bx = this.xToTime(Math.max(aX, bX));
		const by = this.yToTone(Math.max(aY, bY));

		return noteManager.getSelectedTrack().notes.map((n, i) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			const isIn = d > ax && t < bx && nt >= ay && nt <= by;
			return isIn ? i : null;
		}).filter((i) => i !== null);
	};

	this.addNote = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		const duration = this.newNoteDuration;
		this.clickedNote = noteManager.addNote(time, tone, duration);
		this.clickedNoteIndex = noteManager.getSelectedTrack().notes.length - 1;
	};

	this.moveNote = (note, x, y) => {
		let time = this.xToTime(x);
		if (time < 0) time = 0;
		note.startTime = time;
		note.tone = this.yToTone(y);
		this.render();
	};

	this.moveNoteBy = (note, dTime, dTone) => {
		note.startTime += dTime;
		note.tone += dTone;
	};

	this.moveNotesBy = (dTime, dTone) => {
		const notes = noteManager.getSelectedTrack().notes;
		this.selectedNotes.forEach((ni) => this.moveNoteBy(notes[ni], dTime, dTone));
		const earlyNotes = this.selectedNotes.filter((ni) => notes[ni].startTime < 0);
		if (earlyNotes.length) {
			let earliestTime = 0;
			earlyNotes.forEach((ni) => earliestTime = Math.min(notes[ni].startTime, earliestTime));
			this.selectedNotes.forEach((ni) => this.moveNoteBy(notes[ni], -earliestTime, 0));
		}
		this.render();
	};

	this.resizeNoteBy = (note, t) => {
		note.duration += t;
		if (note.duration < 0) note.duration = this.noteMinDuration;
	};

	this.resizeNotesBy = (t) => {
		const notes = noteManager.getSelectedTrack().notes;
		const initDur = this.clickedNote.duration;
		const delta = t - initDur;

		if (initDur <= this.noteMinDuration && delta < 0) return;

		this.selectedNotes.forEach((ni) => this.resizeNoteBy(notes[ni], delta));
		this.render();
	};

	this.deleteNote = (index) => {
		noteManager.getSelectedTrack().notes.splice(index, 1);
		this.selectedNotes = [];
		this.render();
	};

	this.deleteSelectedNotes = () => {
		const notes = noteManager.getSelectedTrack().notes;
		this.selectedNotes.forEach((si) => {
			delete notes[si];
		});
		noteManager.getSelectedTrack().notes = notes.filter((n) => n);
		this.selectedNotes = [];
		this.render();
	};

	this.copyNotes = (notes = this.selectedNotes) => {
		const realNotes = noteManager.getSelectedTrack().notes;
		const noteArr = notes.map((i) => realNotes[i]);
		clipboard = JSON.stringify(noteArr);
	};

	this.pasteNotes = () => {
		const pastedNotes = JSON.parse(clipboard);
		if (!pastedNotes?.length) return;
		const sorted = pastedNotes.sort((a, b) => a.startTime - b.startTime);
		let timeDiff = this.cursorTime - sorted[0].startTime;
		if (this.snapX) timeDiff = this.snapToGridTime(timeDiff);
		sorted.forEach((n) => n.startTime += timeDiff);
		const track = noteManager.getSelectedTrack();
		track.notes = track.notes.concat(sorted);
		this.selectedNotes = sorted.map((p) => track.notes.indexOf(p));
		this.endTime = Math.ceil(noteManager.getEndTime() / this.beatsPerBar) * this.beatsPerBar;
		this.render();
	};

	this.previewNote = (bool) => {
		const tone = this.clickedNote?.tone ?? 12;
		if (bool) this.previewNoteId = noteManager.getSelectedTrack().synth.start(toneToFreq(tone));
		else if (this.previewNoteId) noteManager.getSelectedTrack().synth.stop(this.previewNoteId);
	};

	this.renderAll = () => {
		this.render();
		this.renderTracks();
		this.bpmUi.value = noteManager.bpm;
		this.endTime = Math.ceil(noteManager.getEndTime() / this.beatsPerBar) * this.beatsPerBar;
	};

	this.renderTracks = (tracks = noteManager.tracks) => {
		while (this.trackContainer.firstChild) {
			this.trackContainer.removeChild(this.trackContainer.firstChild);
		}
		tracks.forEach((t) => {
			const div = createTrackEntryUi(t, this);
			this.trackContainer.appendChild(div);
			if (t.active) {
				this.setSynthUi(t);
			}
		});
	};

	this.addTrack = () => {
		const track = noteManager.createTrack();
		const div = createTrackEntryUi(track, this);
		this.trackContainer.appendChild(div);
		this.selectTrack(div, track);
	};
	
	this.addTrackBtn.addEventListener('mousedown', (e) => {
		e.stopPropagation();
		e.preventDefault();
		this.addTrack();
	});

	this.removeTrack = (track) => {
		// TODO
	};

	this.setTrackGain = (track, gain) => {
		track.gain = gain;
		track.fx.gain.gain.value = gain;
		track.muted = false;
	}

	this.toggleMuteTrack = (track) => {
		track.muted = !track.muted;
	}

	this.selectTrack = (element, track) => {
		this.trackContainer.childNodes.forEach((c) => c.className = 'jodroll-track');
		noteManager.selectTrack(track);
		this.render();
		this.setSynthUi(track);
		element.className += ' active';
	};

	this.setSynthUi = (track) => {
		if (this.currentSynthUi) {
			const container = document.querySelector('.oscillators-container');
			while (container.firstChild) container.removeChild(container.firstChild);
			delete this.currentSynthUi;
		}
		this.currentSynthUi = new SynthUi(track.synth);


		if (this.currentFxUi) {
			const container = document.querySelector('.fx-container');
			while (container.firstChild) container.removeChild(container.firstChild);
			delete this.currentFxUi;
		}
		this.currentFxUi = new FxManagerUi(track.fx);
	};

	this.addOsc = () => {
		this.currentSynthUi?.addOsc();
	}
	this.addFx = (type) => {
		this.currentFxUi?.addFx(type);
	}

	this.drawClear = (ctx = this.ctx) => {
		ctx.fillStyle = jodColors.background;
		ctx.fillRect(0, 0, this.width, this.height);
	};


	this.drawNote = (note, color = jodColors.note, resizeColor = jodColors.resizeHandle) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		const r = this.resizeTriggerSize;
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x, y, w, h);

		this.ctx.fillStyle = resizeColor;
		this.ctx.fillRect(x + w - r * 0.5, y, r, h);
	};

	this.drawCircle = (x, y, r, color = jodColors.automationNode) => {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, Math.PI * 2);
		this.ctx.fill();
	}

	this.drawNoteAutomation = (
		note,
		nodes,
		boxColor = jodColors.automationBox,
		nodeColor = jodColors.automationNode,
		lineColor = jodColors.automationLine
	) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone) + this.automationBoxHeight * 0.5;
		const w = note.duration * this.pxPerBeat;
		const h = -this.automationBoxHeight;
		this.ctx.fillStyle = boxColor;
		this.ctx.fillRect(x, y, w, h);

		if (!nodes?.length) return;

		// Release box
		const releaseW = (nodes.at(-1).time ?? 0) * this.pxPerBeat;
		this.ctx.fillStyle = jodColors.releaseBox;
		this.ctx.fillRect(x + w, y, releaseW, h);

		// Automation nodes
		nodes.forEach((n) => {
			//if (n.time > note.duration) // TODO
			const nx = this.timeToX(note.startTime + n.time);
			const ny = y + n.value * -this.automationBoxHeight;
			this.drawCircle(nx, ny, 7, nodeColor);
		});
	};

	this.drawNotes = (notes = noteManager.getSelectedTrack().notes, color = jodColors.note, resizeColor = jodColors.resizeHandle) => {
		notes.forEach((n, i) => {
			if (this.timeToX(n.startTime + n.duration) < 0.0) return;
			if (this.timeToX(n.startTime) > this.width) return;
			if (this.automationMode) {
				this.drawNoteAutomation(n, n.gainNodes);
			} else {
				const isSelected = notes === noteManager.getSelectedTrack().notes;
				if (isSelected && this.selectedNotes.some((s) => s === i)) this.drawNote(n, jodColors.selectedNote, resizeColor);
				else this.drawNote(n, color, resizeColor);
			}
		});
	};

	this.drawAllTracks = () => {
		noteManager.tracks.forEach((t) => {
			if (t.active) this.drawNotes(t.notes);
			else this.drawNotes(t.notes, jodColors.fadedNote, jodColors.fadedResizeHandle);
		});
	};

	this.drawAABB = (aabb, color = jodColors.selectArea) => {
		const y = this.height - aabb.ay;
		const w = aabb.bx - aabb.ax;
		const h = (this.height - aabb.by) - y;

		this.ctx.fillStyle = color;
		this.ctx.fillRect(aabb.ax, y, w, h);
	};

	this.render = () => {
		this.drawClear();
		this.drawGrid();
		this.drawAllTracks();
		if (this.isSelectingArea) this.drawAABB(this.areaSelectAABB);
	};

	this.drawGrid = (ctx = this.ctx) => {
		const visColsMult = 1 + Math.floor(this.pxPerBeat / 30);
		const gridX = this.pxPerBeat / visColsMult;
		const visibleRows = this.height / this.pxPerTone;
		const visibleCols = this.width / gridX;
		const offsetRows = Math.floor(-this.scrollY / this.pxPerTone);
		const offsetCols = Math.floor(-this.scrollX / gridX);
		
		// horizontal lines
		ctx.beginPath();
		ctx.strokeStyle = jodColors.gridLine;
		for (let i = 0; i < visibleRows; i++) {
			const y = i * this.pxPerTone - this.scrollY % this.pxPerTone;
			const isOctave = (i - offsetRows) % 12 === 0;

			if (isOctave) {
				ctx.stroke();
				ctx.beginPath();
				ctx.strokeStyle = jodColors.gridOctave;
			}
			ctx.moveTo(0, y);
			ctx.lineTo(this.width, y);

			if (isOctave) {
				ctx.stroke();
				ctx.beginPath();
				ctx.strokeStyle = jodColors.gridLine;
			}
		}
		ctx.stroke();

		// vertical lines
		ctx.beginPath();
		ctx.strokeStyle = jodColors.gridLine;
		for (let i = 0; i < visibleCols; i++) {
			const x = i * gridX + this.scrollX % gridX;
			const isBar = ((i + offsetCols) % (this.beatsPerBar * visColsMult)) === 0;

			if (isBar) {
				ctx.stroke();
				ctx.beginPath();
				ctx.strokeStyle = jodColors.gridBar;
			}
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.height);

			if (isBar) {
				ctx.stroke();
				ctx.beginPath();
				ctx.strokeStyle = jodColors.gridLine;
			}
		}
		ctx.stroke();

		// center tone line
		ctx.beginPath();
		ctx.strokeStyle = jodColors.gridReference;
		ctx.moveTo(0, -this.scrollY);
		ctx.lineTo(this.width, -this.scrollY);
		ctx.stroke();

		// start line
		ctx.beginPath();
		ctx.strokeStyle = jodColors.gridReference;
		ctx.moveTo(this.scrollX, 0);
		ctx.lineTo(this.scrollX, this.height);
		ctx.stroke();
	};

	this.drawCaret = (x, ctx = this.ctx) => {
		ctx.beginPath();
		ctx.strokeStyle = jodColors.caret;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, this.height);
		ctx.stroke();
	};

	this.playbackAnimationFrame = () => {
		const time = noteManager.getCurrentTime();
		const caretPos = this.timeToX(time);
		
		if (this.autoScrollOnPlayback) this.scrollX = -time * this.pxPerBeat + this.width * 0.2;
		this.render();
		this.drawCaret(caretPos);

		if (noteManager.isPlaying) {
			if (time >= this.endTime) {
				noteManager.playbackLoop();
			}
			requestAnimationFrame(this.playbackAnimationFrame);
		} else {
			this.render();
		}
	};

	this.togglePlayback = (options) => {
		if (noteManager.isPlaying) {
			noteManager.stopPlaybackLoop();
		} else {
			if (options.fromCursor) noteManager.playbackLoop(this.cursorTime);
			else noteManager.playbackLoop();
			this.playbackAnimationFrame();
		}
	};

	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.setAttribute('style', `width: ${this.width}px`);
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
	this.addTrack();
}