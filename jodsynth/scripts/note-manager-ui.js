function Rect(x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
}

const EModes = {
	notes: 0,
	pitchAutomation: 1,
	automation: 2,
	panAutomation: 3,
};

const AutomationProperties = [
	null,
	'pitch',
	'gain',
	'pan',
];

const jodColors = {
	background: '#000000',
	caret: '#e7fc8f68',
	cursorLine: '#9ca5ff66',
	gridReference: '#579cef',
	gridLine: '#a7cab322',
	gridOctave: '#97a6ca64',
	gridBar: '#97a6ca64',
	gridBeat: '#a3adba2c',
	selectArea: '#88ccff66',
	selectedNote: '#9259f2',
	note: '#6699ff',
	resizeHandle: '#99c9ff',
	fadedNote: '#6699ff3c',
	fadedResizeHandle: '#99c9ff6c',
	fadedSelectedNote: '#7c42e176',
	playingNote: '#aceaff',
	playingNoteBorder: '#aceaff',
	mutedNote: '#55426253',
	automationBox: '#384c6caa',
	automationNode: '#eca592',
	automationLine: '#3a8afc77',
	fadedAutomationNode: '#eca59244',
	fadedAutomationLine: '#ffff7044',
	releaseBox: '#283e6299',
	loopLine: '#58c34ab2',
};


class TimelineUI {
	noteManager;
	rect;
	color = '#0a0c1f';
	backgroundColor = '#020305';

	selectionRange = { start: 0, end: 0 };
	isSelecting = 0; // 1: ctrl, 2: ctrl + shift
	selectionColor = '#31426f53';

	/** @param {Rect} rect  */
	constructor(rect, noteManager) {
		this.rect = rect;
		this.noteManager = noteManager;
	}

	isPointInside(_x, y) { // currently the x pos and width always matches the canvas
		return y > this.rect.y && y < this.rect.y + this.rect.h;
	}

	startSelecting(posX, all) {
		posX /= this.rect.w;
		this.isSelecting = 1 + all;
		this.selectionRange.start = posX;
		this.selectionRange.end = posX;
	}

	updateSelection(posX) {
		this.selectionRange.end = posX / this.rect.w;
	}

	endSelecting(posX) {
		this.isSelecting = 0;
		this.selectionRange.end = posX / this.rect.w;
	}

	/** @param {CanvasRenderingContext2D} ctx  */
	draw(ctx, scrollX, pxPerBeat, endTime, tracks, isPlaying, caretTime) {
		const { x, y, w, h } = this.rect;
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(x, y, w, h);

		const left = (-scrollX / (endTime * pxPerBeat)) * w;
		const width = w * w / (pxPerBeat * endTime);
		
		ctx.fillStyle = this.color;
		ctx.fillRect(left, y, width, h);
		
		const caretX = w * (caretTime / endTime);
		tracks.forEach((t) => {
			const shouldAnimate = isPlaying && jodConfiguration.animations && !t.muted && (!this.noteManager.soloTrack || t.solo);

			t.notes.forEach((n) => {
				const nx = w * n.startTime / endTime;
				const ny = y + (h - n.tone);
				const nw = w * n.duration / endTime;

				ctx.fillStyle = t.active ? jodColors.note : jodColors.fadedNote;
				ctx.fillRect(nx, ny, nw, 1);
				
				const time = (caretX - nx) / nw;
				const dur = 1.5;
				if (shouldAnimate && time >= 0 && time <= dur) {
					const invert = dur - time;
					const ease = invert * invert;
					const thicc = 0.5 + 1.5 * ease;
					ctx.fillStyle = `rgb(200, 230, 255, ${ease})`;
					ctx.fillRect(nx, ny - thicc, nw, thicc * 2);
				}
			})
		});

		if (this.isSelecting) this.drawSelectionBox(ctx);
	}

	/** 
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} pos A number between 0 and 1, where 1 is the end time.
	 */
	drawCaret(ctx, pos) {
		const x = this.rect.w * pos;
		ctx.beginPath();
		ctx.strokeStyle = jodColors.caret;
		ctx.moveTo(x, this.rect.y);
		ctx.lineTo(x, this.rect.y + this.rect.h);
		ctx.stroke();
	}

	drawLoopLines(ctx, start, end) {
		const xs = start * this.rect.w;
		const xe = end * this.rect.w;

		ctx.beginPath();
		ctx.strokeStyle = jodColors.loopLine;
		ctx.moveTo(xs, this.rect.y);
		ctx.lineTo(xs, this.rect.y + this.rect.h);
		ctx.moveTo(xe, this.rect.y);
		ctx.lineTo(xe, this.rect.y + this.rect.h);
		ctx.stroke();
	};

	/** @param {CanvasRenderingContext2D} ctx  */
	drawSelectionBox(ctx) {
		const { y, w, h } = this.rect;
		const { start, end } = this.selectionRange;
		ctx.fillStyle = this.selectionColor;
		ctx.fillRect(w * start, y, w * (end - start), h);
	}
}

class ToggleButton {
	element;
	active = false;

	constructor(element, toggleFn, initialActive) {
		this.element = element;
		this.toggle(!!initialActive);
		this.element.onclick = () => {
			this.toggle();
			toggleFn();
		};
	}

	toggle(force) {
		this.active = this.element.classList.toggle('active', force);
		return this.active;
	}
}

class EditingModeUI {
	currentOscInfo = document.querySelector('#jodrollCurrentOscInfo');
	btnNormalMode = document.querySelector('#jodrollBtnNormalMode');
	btnPitchMode = document.querySelector('#jodrollBtnPitchAutomationMode');
	btnGainMode = document.querySelector('#jodrollBtnGainAutomationMode');
	btnPanMode = document.querySelector('#jodrollBtnPanAutomationMode');
	buttonsss = [this.btnNormalMode, this.btnPitchMode, this.btnGainMode, this.btnPanMode];

	callback;

	constructor(mode = 0, modeChangeCallback = (_mode) => null) {
		this.modeChange(mode);
		this.callback = modeChangeCallback;
		this.buttonsss.forEach((b, i) => b.addEventListener('click', () => this.callback(i)));
	}

	modeChange(mode = 0) {
		this.buttonsss.forEach((b, i) => b.classList.toggle('active', mode === i));
	}

	oscChange(osc = 0) {
		this.currentOscInfo.innerHTML = `Osc: ${osc + 1}`;
	}
}


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

	this.overlay = document.querySelector('#jodOverlay');
	this.screenFlasher = new CssFlasher(this.overlay, 650, 0.7);
	this.screenShaker = new CssShaker(document.querySelector('.main-content'), 500, 8);

	this.playBtn = new ToggleButton(document.querySelector('#jodrollBtnPlay'), () => this.togglePlayback());
	this.toggleLoopingBtn = new ToggleButton(document.querySelector('#jodrollBtnLoop'), () => this.toggleLooping(), noteManager.loop.active);
	this.toggleAutoScrollBtn = new ToggleButton(
		document.querySelector('#jodrollBtnAutoScroll'),
		() => this.autoScrollOnPlayback = !this.autoScrollOnPlayback
	);

	this.timeDisplayContainer = document.querySelector('.jodroll-playback-time');
	this.timeDisplayContainer.onclick = () => this.displaySeconds = !this.displaySeconds;
	this.timeDisplay = document.querySelector('#jodrollPlaybackTimeBeats');
	this.timeDecimalsDisplay = document.querySelector('#jodrollPlaybackTimeDecimals');
	this.editingModeUi = new EditingModeUI(EModes.notes, (mode = 0) => this.toggleMode(mode));
	this.currentSynthUi;
	this.currentFxUi;

	this.pxPerBeat = 50;
	this.pxPerTone = 10;
	this.width = this.trackerContainer.width = window.innerWidth - 222;
	this.height = this.canvas.height = this.trackerContainer.height = 700;
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
	this.timeLineAction = 8;

	this.beatsPerBar = 4; // the top number in the time signature
	this.beatDivisor = 4; // the bottom number in the time signature
	this.gridSizeTime = 0.125; // 8 vertical lines per beat   TODO
	this.gridSizeX = this.pxPerBeat * this.gridSizeTime;
	this.offsetY = this.pxPerTone / 2;
	this.snapX = true;
	this.snapY = true;

	this.clickedNote = null;
	this.noteMinDuration = 0.01;
	this.previewNoteId = null;
	this.isResizing = false;
	this.resizeTriggerSize = 10;
	this.automationBoxHeight = 40;
	this.clickedNode = null;
	this.nodeRadius = 8;
	this.mode = EModes.notes;
	this.selectedOsc = 0;
	this.automationProperty = AutomationProperties[this.mode];

	this.selectedNotes = [];
	this.isSelectingArea = false;
	this.isSelectingAllTracks = false;
	this.areaSelectAABB = { ax: 0, ay: 0, bx: 0, by: 0 };

	this.isCursorInside = false;
	this.showCursorLine = true;
	this.cursorX = 0;
	this.cursorTime = 0;
	this.endTime = this.beatsPerBar;
	this.displaySeconds = false;

	this.caretPos = 0; // used ONLY for animating notes during playback
	this.caretTime = 0; // used ONLY for animating timeline notes during playback

	this.timeLine = new TimelineUI({ x: 0, y: this.height - 100, w: this.width, h: 100 }, noteManager);
	this.timeLineClicked = false;


	this.trackerContainer.addEventListener('mousedown', (e) => {
		e.preventDefault();
		e.stopPropagation();
		document.activeElement.blur();

		const rect = this.canvas.getBoundingClientRect();
		const unFlippedY = e.y - rect.top;
		let realX = e.x - rect.left;
		let realY = this.height - unFlippedY;

		this.timeLineClicked = this.timeLine.isPointInside(realX, unFlippedY);

		// PITCH AUTOMATION
		if (!this.timeLineClicked && this.mode === EModes.pitchAutomation) {
			switch (e.buttons) {
				case this.primaryAction:
					const time = this.xToTime(realX);
					const tone = this.yToTone(realY);

					let { note, node } = this.getPitchNodeAndNoteAtTime(time, tone);
					if (!note) note = this.getNoteAtPos(realX, realY);
					this.clickedNote = note;
					if (!note) break;
					if (!node) node = this.addPitchAutomationNode(note, time, tone);
					if (!node) this.clickedNote = null;
					this.clickedNode = node ?? null;
					this.render();
					if (this.clickedNode) this.previewAutomation();
					break;
				case this.secondaryAction:
					const time2 = this.xToTime(realX);
					const tone2 = this.yToTone(realY);
					const { note: note2, node: node2 } = this.getPitchNodeAndNoteAtTime(time2, tone2);
					if (!note2 || !node2) break;
					const nodeArray = this.getCurrentAutomationArray(note2, 'pitch');
					this.deleteAutomationNode(nodeArray, node2);
					this.render();
					break;
			}
			return;
		}

		// AUTOMATION
		if (!this.timeLineClicked && this.mode >= EModes.automation) {
			switch (e.buttons) {
				case this.primaryAction:
					const note = this.getNoteAutomationAtPos(realX, unFlippedY);
					this.clickedNote = note;

					if (!note) {
						const clickedNote = this.getNoteAtPos(realX, realY);

						if (clickedNote) {
							const idx = this.selectedNotes.findIndex((s) => s === clickedNote);
							if (idx === -1) {
								this.selectedNotes = [clickedNote];
								this.render();
							}
	
							this.clickedNote = clickedNote;
						} else {
							this.selectedNotes = [];
							this.render();
						}
						break;
					}

					let node = this.getAutomationNodeAtPos(note, realX, unFlippedY);
					if (!node) node = this.addAutomationNode(note, realX, unFlippedY);
					if (!node) this.clickedNote = null;
					this.clickedNode = node ?? null;
					this.render();
					if (this.clickedNode) this.previewAutomation();
					break;
				case this.secondaryAction:
					const note2 = this.getNoteAutomationAtPos(realX, unFlippedY);
					if (!note2) break;
					const nodeArray = this.getCurrentAutomationArray(note2);
					if (!nodeArray) break;
					const node2 = this.getAutomationNodeAtPos(note2, realX, unFlippedY);
					if (!node2) break;
					this.deleteAutomationNode(nodeArray, node2);
					this.updateNoteAndAutomation(note2, nodeArray);
					this.render();
					break;
			}
			return;
		}

		switch (e.buttons) {
			case this.primaryAction:
				if (this.clickedNote) this.previewNote(false);
				if (this.timeLineClicked) {
					if (e.ctrlKey) {
						this.timeLine.startSelecting(realX, e.shiftKey);
						break;
					}
					this.scrollToAbsolute(realX);
					break;
				}
				const clickedNote = this.getNoteAtPos(realX, realY);

				if (e.ctrlKey) {
					if (clickedNote) {
						const idx = this.selectedNotes.findIndex((s) => s === clickedNote);
						if (idx > -1) this.selectedNotes.splice(idx, 1);
						else this.selectedNotes.push(clickedNote);
						this.render();
						break;
					}

					this.areaSelectAABB.ax = realX;
					this.areaSelectAABB.ay = realY;
					this.areaSelectAABB.bx = realX;
					this.areaSelectAABB.by = realY;

					if (e.shiftKey) this.isSelectingAllTracks = true;
					else this.isSelectingArea = true;
					break;
				}

				if (e.shiftKey) {
					const time = this.xToTime(this.snapX ? this.snapToGridX(realX) : realX);
					this.setLoopPoint(time);
					break;
				}

				if (clickedNote) {
					const idx = this.selectedNotes.findIndex((s) => s === clickedNote);
					if (idx === -1) {
						this.selectedNotes = [clickedNote];
						this.render();
					}

					this.clickedNote = clickedNote;
					this.clickedNoteInitial = { ...this.clickedNote };
					this.isResizing = this.checkResizeTrigger(this.clickedNote, realX);
				} else {
					if (this.snapY) realY = this.snapToGridY(realY);
					if (this.snapX) realX = this.snapToGridX(realX);
					this.addNote(realX, realY);
					this.selectedNotes = [this.clickedNote];
					this.render();
				}
				this.previewNote(true);
				break;
			case this.secondaryAction:
				if (this.timeLineClicked) {
					this.togglePlayback({ fromTime: this.endTime * realX / this.timeLine.rect.w });
					break;
				}

				if (e.shiftKey) {
					const time = this.xToTime(this.snapX ? this.snapToGridX(realX) : realX);
					this.setLoopPoint(time, false);
					break;
				}

				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
			case this.scrollAction | this.primaryAction:
				this.copyNotes();
				break;
			case this.scrollAction | this.secondaryAction:
				this.pasteNotes();
				break;
			case this.primaryAction | this.secondaryAction:
				this.areaSelectAABB.ax = realX;
				this.areaSelectAABB.ay = realY;
				this.areaSelectAABB.bx = realX;
				this.areaSelectAABB.by = realY;

				if (e.shiftKey) this.isSelectingAllTracks = true;
				else this.isSelectingArea = true;
				break;
		}
	});

	this.onMouseUpOrEnter = (e) => {
		e.preventDefault();
		e.stopPropagation();

		this.isCursorInside = true;
		
		if (~e.buttons & this.primaryAction) {
			if (this.isSelectingArea) {
				this.isSelectingArea = false;
				this.selectedNotes = this.getNotesInAABB(this.areaSelectAABB.ax, this.areaSelectAABB.ay, this.areaSelectAABB.bx, this.areaSelectAABB.by);
				this.render();
			}
			else if (this.isSelectingAllTracks) {
				this.isSelectingAllTracks = false;
				this.selectedNotes = this.getAllNotesInAABB(this.areaSelectAABB.ax, this.areaSelectAABB.ay, this.areaSelectAABB.bx, this.areaSelectAABB.by);
				this.render();
			}
			else if (this.timeLine.isSelecting) {
				const allTracks = this.timeLine.isSelecting > 1;
				this.timeLine.endSelecting(this.cursorX);

				const { start, end } = this.timeLine.selectionRange;
				const ax = this.timeToX(start * this.endTime);
				const bx = this.timeToX(end * this.endTime);
				const func = allTracks ? this.getAllNotesInAABB : this.getNotesInAABB;
				this.selectedNotes = func(ax, -9999, bx, 9999);
				this.render();
			}
			else if (this.clickedNote) {
				this.newNoteDuration = this.clickedNote.duration;
				if (this.isResizing) this.finalizeResizing();
				this.updateEndTime();
				this.render();
			}

			if (this.mode > 0) this.stopAutomationPreview();
			else this.previewNote(false);
			this.clickedNote = null;
			this.clickedNode = null;
			this.isResizing = false;
			this.timeLineClicked = false;
			if (this.showCursorLine) this.render();
		}
	};

	this.trackerContainer.addEventListener('mouseup', this.onMouseUpOrEnter);
	this.trackerContainer.addEventListener('mouseenter', this.onMouseUpOrEnter);
	this.trackerContainer.addEventListener('mouseleave', () => {
		this.isCursorInside = false;
		if (this.showCursorLine) this.render();
	});

	this.trackerContainer.oncontextmenu = (e) => e.preventDefault();

	this.trackerContainer.addEventListener('mousemove', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		const unFlippedY = e.y - rect.top;
		let realX = e.x - rect.left;
		let realY = this.height - unFlippedY;
		this.cursorX = realX;
		this.cursorTime = this.xToTime(this.cursorX);

		const timeLineHovered = this.timeLine.isPointInside(realX, unFlippedY);
		const timeLineClicked = +timeLineHovered * this.timeLineAction;
		const scrollHack = +e.altKey * this.scrollAction; // alternative to middle mouse button
		const fakeButtons = e.buttons | scrollHack | timeLineClicked;

		switch (fakeButtons) {
			case this.primaryAction | this.scrollAction:
			case this.primaryAction | this.secondaryAction:
			case this.primaryAction:
				if (this.timeLineClicked) {
					if (this.timeLine.isSelecting) {
						this.timeLine.updateSelection(realX);
						this.drawTimeLine();
					}
					else this.scrollToAbsolute(realX);
					break;
				}

				if (this.mode === EModes.pitchAutomation) {
					if (!this.clickedNode || !this.clickedNote) break;
					if (!e.shiftKey && !(fakeButtons & this.scrollAction)) realY = this.snapToGridY(realY);
					if (!e.ctrlKey && !(fakeButtons & this.scrollAction)) realX = this.snapToGridX(realX);
					const dTime = this.xToTime(realX) - (this.clickedNote.startTime + this.clickedNode.time);
					const dValue = this.yToTone(realY) - (this.clickedNote.tone + this.clickedNode.value);
					this.movePitchAutomationNodeBy(this.clickedNode, dTime, dValue);
					this.getCurrentAutomationArray(this.clickedNote).sort((a, b) => a.time - b.time);
					this.render();
					this.updateAutomationPreview();
					break;
				}

				if (this.mode >= EModes.automation) {
					if (!this.clickedNode || !this.clickedNote) break;
					if (e.ctrlKey) realX = this.snapToGridX(realX);
					if (e.shiftKey) realY = this.snapToGridY(realY);
					const pos = this.automationNodeToPos(this.clickedNote, this.clickedNode);
					const dTime = this.xToTime(realX) - (this.clickedNote.startTime + this.clickedNode.time);
					const dValue = (pos.y - unFlippedY) / this.automationBoxHeight;
					this.moveAutomationNodeBy(this.clickedNode, dTime, dValue);
					this.updateNoteAndAutomation(this.clickedNote, this.getCurrentAutomationArray(this.clickedNote));
					this.render();
					this.updateAutomationPreview();
					break;
				}

				if (this.snapX && !e.ctrlKey && !(fakeButtons & this.scrollAction)) realX = this.snapToGridX(realX);
				if (this.snapY && !e.shiftKey && !(fakeButtons & this.scrollAction)) realY = this.snapToGridY(realY);

				if (this.isSelectingArea || this.isSelectingAllTracks) {
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
					this.moveSelectedNotesBy(dTime, dTone);
					this.previewNoteId.forEach((pn) => pn.oscillator.frequency.value = toneToFreq(this.clickedNote.tone));
				}
				break;
			case this.secondaryAction:
				if (this.mode) break; // TODO: delete nodes
				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
			case this.scrollAction:
			case this.scrollAction | this.timeLineAction:
				this.scrollX += e.movementX;
				this.scrollY -= e.movementY;
				this.render();
				break;
			case this.timeLineAction | this.primaryAction:
				if (this.clickedNote) break;
				if (this.timeLine.isSelecting) {
					this.timeLine.updateSelection(realX);
					this.drawTimeLine();
				}
				else this.scrollToAbsolute(realX);
				break;
		}

		const prevIsCursorInside = this.isCursorInside;
		this.isCursorInside = !timeLineHovered;
		if (e.movementX && this.showCursorLine && this.isCursorInside) this.render();
		else if (timeLineHovered && prevIsCursorInside) this.render();

		// TODO: better snap handling
		if (this.snapX && !e.ctrlKey) realX = this.snapToGridX(realX);
		if (!this.isPlaying()) this.setTimeDisplay(this.xToTime(realX));
	});


	this.trackerContainer.addEventListener('wheel', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const cursorTime = this.xToTime(this.cursorX);
		this.pxPerBeat -= Math.sign(e.deltaY) * this.pxPerBeat * 0.2;
		this.pxPerBeat = Math.max(3, Math.min(600, this.pxPerBeat));
		//this.gridSizeX = this.pxPerBeat;
		this.scrollX = -cursorTime * this.pxPerBeat + this.cursorX;
		this.render();
		//console.log('zoom:', this.gridSizeX, this.gridSizeTime, this.width / this.pxPerBeat);
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

	this.scrollToAbsolute = (x) => {
		const w = this.timeLine.rect.w;
		this.scrollX = -(x / w) * this.endTime * this.pxPerBeat + w * 0.5;
		this.render();
	};

	this.updateEndTime = () => {
		this.endTime = Math.ceil(noteManager.getEndTime() / this.beatsPerBar) * this.beatsPerBar;
		noteManager.setEndTime(this.endTime);
	};

	this.getNoteAtPos = (x, y, noteArray = noteManager.getSelectedTrack().notes) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		return noteArray.find((n) => {
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

	this.getNoteAutomationAtPos = (x, y) => {
		const padding = this.nodeRadius;
		const timePadding = padding / this.pxPerBeat;
		const time = this.xToTime(x);
		return this.selectedNotes.find((n) => {
			const t = n.startTime - timePadding;
			const d = t + n.duration + timePadding;
			const ny = this.toneToY(n.tone);
			const nr = this.automationBoxHeight * 0.5 + padding;
			return time > t && time < d && Math.abs(ny - y) <= nr;
		});
	};

	this.pitchAutomationNodeToPos = (note, node) => {
		const x = this.timeToX(note.startTime + node.time);
		const y = this.toneToY(note.tone + node.value);
		return { x, y };
	};

	this.automationNodeToPos = (note, node) => {
		const zeroCentered = this.mode === EModes.panAutomation;
		const offsetY = (
			zeroCentered
				? -node.value * this.automationBoxHeight * 0.5
				: this.automationBoxHeight * 0.5 - node.value * this.automationBoxHeight
		);
		const x = this.timeToX(note.startTime + node.time);
		const y = this.toneToY(note.tone) + offsetY;
		return { x, y };
	};

	this.automationNodeToLocalPos = (node) => {
		const x = this.timeToX(node.time);
		const y = this.automationBoxHeight * 0.5 - node.value * this.automationBoxHeight;
		return { x, y };
	};

	this.posToAutomation = (note, x, y) => {
		const zeroCentered = this.mode === EModes.panAutomation;
		const offsetY = zeroCentered ? (this.toneToY(note.tone) - y) * 2 : this.toneToY(note.tone) + this.automationBoxHeight * 0.5 - y;
		const time = this.xToTime(x) - note.startTime;
		const value = offsetY / this.automationBoxHeight;
		return { time, value };
	};

	this.getAutomationNodeAtPos = (note, x, y) => {
		return this.getCurrentAutomationArray(note)?.find((a) => {
			const pos = this.automationNodeToPos(note, a);
			const vecTo = { x: pos.x - x, y: pos.y - y };
			const dist = Math.sqrt(vecTo.x * vecTo.x + vecTo.y * vecTo.y);
			return dist <= this.nodeRadius + 3;
		});
	}

	this.getPitchNodeAndNoteAtTime = (time, tone, track = noteManager.getSelectedTrack()) => {
		let node;
		const note = track.notes.find((n) => {
			const arr = this.getCurrentAutomationArray(n, 'pitch');
			node = arr?.find((a) => {
				const x = this.timeToX(n.startTime + a.time) - this.timeToX(time);
				const y = this.toneToY(n.tone + a.value) - this.toneToY(tone);
				const dist = Math.sqrt(x * x + y * y);
				return dist <= this.nodeRadius;
			});
			return !!node;
		});
		return { note, node };
	};

	this.getNotesAtTime = (time, track = noteManager.getSelectedTrack()) => {
		return track.notes.filter((n) => n.startTime <= time && n.startTime + n.duration >= time);
	};

	this.getAutomationArray = (note, prop = this.automationProperty, osc = this.selectedOsc) => {
		return note.automations?.[osc]?.[prop];
	};

	this.getCurrentAutomationArray = (note, prop = this.automationProperty) => {
		return note.automations?.[this.selectedOsc]?.[prop];
	};

	this.moveAutomationNodeBy = (node, dTime, dValue) => {
		const min = this.mode === EModes.panAutomation ? -1 : 0;
		node.time += dTime;
		node.value += dValue;
		node.time = Math.max(0, node.time);
		node.value = Math.max(min, Math.min(1, node.value));
	};

	this.movePitchAutomationNodeBy = (node, dTime, dValue) => {
		node.time += dTime;
		node.value += dValue;
		node.time = Math.max(0, node.time);
	};

	this.updateNoteAndAutomation = (note, nodes) => {
		const min = this.mode === EModes.panAutomation ? -1 : 0;
		nodes.forEach((n) => {
			n.value = Math.max(min, Math.min(1, n.value));
			n.time = Math.max(0, Math.min(note.duration, n.time));
		});
		nodes.sort((a, b) => a.time - b.time);
		//const penult = nodes.at(-2);
		const last = nodes.at(-1);
		if (!last) return;
		/* if (penult) {
			const diff = last.time - note.duration;
			//note.duration = penult.time;
			last.time = penult.time + diff;
		} */
		//last.value = 0;
	};

	this.addAutomationNode = (note, x, y) => {
		const nodeArray = this.getCurrentAutomationArray(note);
		if (!nodeArray) return false;
		const node = this.posToAutomation(note, x, y);
		noteManager.addAutomationNode(nodeArray, node);
		this.updateNoteAndAutomation(note, nodeArray);
		return node;
	};

	this.addPitchAutomationNode = (note, time, tone) => {
		const nodeArray = this.getCurrentAutomationArray(note, 'pitch');
		if (!nodeArray) return false;
		const node = { time: time - note.startTime, value: tone - note.tone };
		noteManager.addAutomationNode(nodeArray, node);
		nodeArray.sort((a, b) =>  a.time - b.time);
		return node;
	};

	this.deleteAutomationNode = (nodeArray, node) => {
		const idx = nodeArray.indexOf(node);
		nodeArray.splice(idx, 1);
	};

	this.resetNoteAutomation = (note) => {
		noteManager.resetNoteAutomation(note);
	};

	this.getNotesInTimeAABB = (aX, aY, bX, bY) => {
		const ax = Math.min(aX, bX);
		const ay = Math.min(aY, bY);
		const bx = Math.max(aX, bX);
		const by = Math.max(aY, bY);

		return noteManager.getSelectedTrack().notes.filter((n) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			return d > ax && t < bx && nt >= ay && nt <= by;
		});
	};

	this.getNotesInAABB = (aX, aY, bX, bY) => {
		const ax = this.xToTime(Math.min(aX, bX));
		const ay = this.yToTone(Math.min(aY, bY));
		const bx = this.xToTime(Math.max(aX, bX));
		const by = this.yToTone(Math.max(aY, bY));

		return noteManager.getSelectedTrack().notes.filter((n) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			return d > ax && t < bx && nt >= ay && nt <= by;
		});
	};

	this.getAllNotesInAABB = (aX, aY, bX, bY) => {
		const ax = this.xToTime(Math.min(aX, bX));
		const ay = this.yToTone(Math.min(aY, bY));
		const bx = this.xToTime(Math.max(aX, bX));
		const by = this.yToTone(Math.max(aY, bY));
		const arr = [];

		noteManager.tracks.forEach((t) => arr.push(...t.notes.filter((n) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			return d > ax && t < bx && nt >= ay && nt <= by;
		})));
		return arr;
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

	this.getAllNotes = () => {
		return [].concat(...noteManager.tracks.map((t) => t.notes));
	};

	this.selectAllNotes = () => {
		this.selectedNotes = this.getAllNotes();
		this.render();
	};

	this.selectAllNotesInTrack = (track = noteManager.getSelectedTrack()) => {
		this.selectedNotes = track.notes;
		this.render();
	};

	this.addNote = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		const duration = this.newNoteDuration;
		this.clickedNote = noteManager.addNote(time, tone, duration);
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

	this.moveSelectedNotesBy = (dTime, dTone) => {
		const notes = this.selectedNotes;
		notes.forEach((n) => this.moveNoteBy(n, dTime, dTone));

		const earlyNotes = notes.filter((n) => n.startTime < 0);
		if (earlyNotes.length) {
			let earliestTime = 0;
			earlyNotes.forEach((n) => earliestTime = Math.min(n.startTime, earliestTime));
			notes.forEach((n) => this.moveNoteBy(n, -earliestTime, 0));
		}
		this.render();
	};

	this.resizeNoteBy = (note, t) => {
		note.duration += t;
		if (note.duration < this.noteMinDuration) note.duration = this.noteMinDuration;
	};

	this.resizeNotesBy = (t) => {
		const initDur = this.clickedNote.duration;
		const delta = t - initDur;

		if (initDur <= this.noteMinDuration && delta < 0) return;

		this.selectedNotes.forEach((n) => this.resizeNoteBy(n, delta));
		this.render();
	};

	this.finalizeResizing = () => {
		this.selectedNotes.forEach((n) => {
			for (let i = 2; i < AutomationProperties.length; i++) {
				for (let o = 0; o < noteManager.getSelectedTrack().synth.oscillators.length; o++) {
					const arr = this.getAutomationArray(n, AutomationProperties[i], o);
					if (!arr?.length) continue;
					const prev = arr.at(-1).time;
					const diff = n.duration - prev;
					arr.at(-1).time = n.duration;
					if (arr.length < 2) continue;
					if (arr.length === 2) {
						arr[0].time = Math.min(arr[0].time, n.duration);
						continue;
					}
					const t2 = Math.max(0, Math.min(n.duration, arr.at(-2).time + diff));
					arr.at(-2).time = t2;
					for (let h = 0; h < arr.length - 2; h++) {
						if (arr[h].time > t2) arr[h].time = t2;
					}
				}
			}
		});
	};

	this.deleteNote = (index) => {
		noteManager.getSelectedTrack().notes.splice(index, 1);
		this.selectedNotes = [];
		this.render();
	};

	this.deleteSelectedNotes = () => {
		noteManager.tracks.forEach((t) => t.notes = t.notes.filter((n) => !this.selectedNotes.find((s) => s === n)));
		this.selectedNotes = [];
		this.render();
	};

	this.copyNotes = (notes = this.selectedNotes) => {
		const tracks = noteManager.tracks.map((t) => t.notes.filter((tn) => notes?.find((sn) => tn === sn)));
		const selectedTrack = noteManager.getSelectedTrack();
		const selectedTrackIndex = noteManager.tracks.findIndex((t) => t === selectedTrack);
		const copyData = { tracks, selectedTrackIndex };
		saveNotesToClipboard(copyData);
	};

	this.pasteNotes = () => {
		const data = getNotesFromClipboard();
		const tracks = data?.tracks;
		if (!tracks?.length) return;
		if (tracks.length !== noteManager.tracks.length) console.warn('Mismatch between tracks and pasted data');

		this.selectedNotes = [];

		const track = noteManager.getSelectedTrack();
		const mainNotes = tracks[data.selectedTrackIndex];
		if (!mainNotes?.length) throw new Error('Bro y\'all deadass be tryna paste nada');
		const sorted = mainNotes.sort((a, b) => a.startTime - b.startTime);

		let timeDiff = this.cursorTime - sorted[0].startTime;
		if (this.snapX) timeDiff = this.snapToGridTime(timeDiff);

		sorted.forEach((n) => n.startTime += timeDiff);
		track.notes = track.notes.concat(sorted);
		this.selectedNotes.push(...sorted);

		noteManager.tracks.forEach((t, i) => {
			const isMain = i === data.selectedTrackIndex;
			if (!tracks[i]?.length || isMain) return;
			const sorted = tracks[i].sort((a, b) => a.startTime - b.startTime);
			sorted.forEach((n) => n.startTime += timeDiff);
			t.notes = t.notes.concat(sorted);
			this.selectedNotes.push(...sorted);
		});

		this.updateEndTime();
		this.render();
	};

	this.previewNote = (bool) => {
		const noteTone = this.clickedNote?.tone ?? 12;
		const nodeTone = this.clickedNode?.value ?? 0;
		const tone = noteTone + nodeTone;
		if (bool) this.previewNoteId = noteManager.getSelectedTrack().synth.start(toneToFreq(tone));
		else if (this.previewNoteId) noteManager.getSelectedTrack().synth.stop(this.previewNoteId);
	};

	this.getAutomationValueAtTime = (nodeArray = [], time = 0) => {
		if (!nodeArray.length) return 0;
		const nextIndex = nodeArray.findIndex((n) => n.time >= time);
		if (nextIndex < 0) return nodeArray.at(-1).value;
		const nextNode = nodeArray[nextIndex];
		const prevNode = nodeArray[nextIndex - 1];
		const prevValue = prevNode?.value ?? 0;
		const prevTime = prevNode?.time ?? 0;
		const timeSpan = nextNode.time - prevTime;
		if (!timeSpan) return nextNode.value;
		const delta = time - prevTime;
		const normalized = delta / timeSpan;
		return lerp(prevValue, nextNode.value, normalized);
	};

	this.previewAutomation = () => {
		const track = noteManager.getSelectedTrack();
		const note = this.clickedNote;
		const time = this.clickedNode.time;
		const pitchMode = this.mode === EModes.pitchAutomation;
		const monoPitch = track.monoPitch ? note.automations[0]?.pitch : undefined;

		const valuesAtTime = note.automations.map((a, i) => {
			const isCarrier = pitchMode && track.synth.oscillators[i]?.mod === null;
			const gain = isCarrier ? 1.0 : this.getAutomationValueAtTime(a.gain, time);
			const pan = this.getAutomationValueAtTime(a.pan, time);
			const detune = this.getAutomationValueAtTime(monoPitch ?? a.pitch, time) * 100;
			return { gain, pan, detune };
		});

		const frequency = toneToFreq(note.tone);
		this.previewNoteId = track.synth.startWithFixedProperties(frequency, valuesAtTime);
	};

	this.stopAutomationPreview = () => {
		if (!this.previewNoteId?.length) return;
		noteManager.getSelectedTrack().synth.stopWithFixedProperties(this.previewNoteId);
		this.previewNoteId = null;
	};

	this.updateAutomationPreview = () => {
		if (!this.clickedNote || !this.clickedNode || !this.previewNoteId?.length) return;
		const track = noteManager.getSelectedTrack();
		const note = this.clickedNote;
		const time = this.clickedNode.time;
		const pitchMode = this.mode === EModes.pitchAutomation;
		const monoPitch = track.monoPitch ? note.automations[0]?.pitch : undefined;

		const valuesAtTime = note.automations.map((a, i) => {
			const isCarrier = pitchMode && track.synth.oscillators[i]?.mod === null;
			const gain = isCarrier ? 1.0 : this.getAutomationValueAtTime(a.gain, time);
			const pan = this.getAutomationValueAtTime(a.pan, time);
			const detune = this.getAutomationValueAtTime(monoPitch ?? a.pitch, time) * 100;
			return { gain, pan, detune };
		});

		track.synth.updateFixedProperties(this.previewNoteId, valuesAtTime);
	};

	this.toggleMode = (mode) => {
		if (this.mode > 0) this.stopAutomationPreview();
		else this.previewNote(false);
		this.mode = mode ?? +!this.mode;
		this.automationProperty = AutomationProperties[this.mode];
		this.editingModeUi.modeChange(this.mode);
		this.render();
	};

	this.selectOsc = (oscIdx) => {
		const oscArr = noteManager.getSelectedTrack().synth.oscillators;
		const oscCount = oscArr.length - 1;
		oscIdx = Math.max(0, Math.min(oscIdx, oscCount));
		if (!oscArr[oscIdx]) return;
		this.selectedOsc = oscIdx;
		this.editingModeUi.oscChange(oscIdx);
		this.render();
	};

	this.toggleLooping = () => {
		noteManager.toggleLooping();
		this.toggleLoopingBtn.toggle(noteManager.loop.active);
		this.render();
	};

	this.setLoopPoint = (time, isStart = true) => {
		const { start, end } = noteManager.loop;
		if (isStart && time < end) noteManager.setLoopStart(time);
		else if (isStart) {
			noteManager.setLoopStart(end);
			noteManager.setLoopEnd(time);
		} else if (time > start) noteManager.setLoopEnd(time);
		else {
			noteManager.setLoopEnd(start);
			noteManager.setLoopStart(time);
		}
		if (!noteManager.loop.active) this.toggleLooping();
		else this.render();
	};

	this.renderAll = () => {
		this.updateEndTime();
		this.bpmUi.value = noteManager.bpm;
		this.render();
		this.renderTracks();
		this.toggleLoopingBtn.toggle(noteManager.loop.active);
	};

	this.renderTracks = (tracks = noteManager.tracks) => {
		const trackElements = tracks.map((t) => {
			const div = createTrackEntryUi(t, this);
			if (t === noteManager.getSelectedTrack()) {
				this.setSynthUi(t);
			}
			return div;
		});
		this.trackContainer.replaceChildren(...trackElements);
	};

	this.addTrack = () => {
		const track = noteManager.createTrack();
		const div = createTrackEntryUi(track, this);
		this.trackContainer.appendChild(div);
		this.selectTrack(div, track); 
	};
	
	this.addTrackBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		e.preventDefault();
		this.addTrack();
	});

	this.deleteTrack = (track) => {
		noteManager.deleteTrack(track);
		this.renderTracks();
		this.updateEndTime();

		setTimeout(() => {
			const idx = noteManager.selectedTrack;
			this.selectTrack(this.trackContainer.childNodes[idx], noteManager.tracks[idx]);
		}, 0);
	};

	this.setTrackGain = (track, gain) => {
		track.gain = gain;
		track.fx.gain.gain.value = gain;
		track.muted = false;
	};

	this.toggleSoloTrack = (track) => {
		noteManager.toggleSolo(track);
	};

	this.toggleMuteTrack = (track) => {
		track.muted = !track.muted;
	};

	this.toggleDisableNoteAutomationForTrack = (track) => {
		track.disableNoteAutomation = !track.disableNoteAutomation;
	};

	this.selectTrack = (element, track) => {
		this.trackContainer.childNodes.forEach((c) => c.classList.toggle('active', false));
		noteManager.selectTrack(track);
		this.render();
		this.setSynthUi(track);
		element.classList.toggle('active', true);
	};

	this.setTrackName = (track, name) => {
		track.name = name;
		this.renderTracks();
	};

	this.getTrackElement = (idx) => {
		return this.trackContainer.childNodes.item(idx);
	};

	this.setSynthUi = (track) => {
		if (this.currentSynthUi) {
			const container = document.querySelector('.oscillators-container');
			container.replaceChildren();
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


	this.drawNote = (note, color = jodColors.note, resizeColor = jodColors.resizeHandle, shouldAnimate = false) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		const r = this.resizeTriggerSize;

		const time = (this.caretPos - x) / w;
		const dur = 2.5;
		if (shouldAnimate && time >= 0 && time <= dur) {
			const invert = dur - time;
			const ease = invert * invert;
			const thicc = 2 * ease;
			this.ctx.fillStyle = `rgb(200, 230, 255, ${ease / (dur * 2)})`;
			this.ctx.fillRect(x - thicc, y - thicc, w + thicc * 2, h + thicc * 2);
		}

		this.ctx.fillStyle = color;
		this.ctx.fillRect(x, y, w, h);

		this.ctx.fillStyle = resizeColor;
		this.ctx.fillRect(x + w - r, y, r, h);
	};

	this.drawCircle = (x, y, r, color = jodColors.automationNode) => {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, Math.PI * 2);
		this.ctx.fill();
	}

	this.drawFadedPitchAutomation = (
		note,
		nodes,
		lineColor = jodColors.fadedAutomationLine,
	) => {
		if (!nodes?.length) return;

		const prevX = this.timeToX(note.startTime);
		const prevY = this.toneToY(note.tone) + this.noteHeight * 0.5;
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = lineColor;
		this.ctx.beginPath();
		this.ctx.moveTo(prevX, prevY);
		nodes.forEach((n) => {
			const nx = this.timeToX(note.startTime + n.time);
			const ny = this.toneToY(note.tone + n.value) + this.noteHeight * 0.5;
			this.ctx.lineTo(nx, ny);
		});
		this.ctx.stroke();
		this.ctx.lineWidth = 1;
	};

	this.drawPitchAutomation = (
		note,
		nodes,
		nodeColor = jodColors.automationNode,
		lineColor = jodColors.automationLine
	) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		this.ctx.fillStyle = jodColors.note;
		this.ctx.fillRect(x, y, w, h);

		if (!nodes?.length) return;

		this.ctx.lineWidth = 4;
		let prevX = this.timeToX(note.startTime);
		let prevY = this.toneToY(note.tone) + this.noteHeight * 0.5;
		nodes.forEach((n) => {
			const nx = this.timeToX(note.startTime + n.time);
			const ny = this.toneToY(note.tone + n.value) + this.noteHeight * 0.5;
			this.drawCircle(nx, ny, this.nodeRadius, nodeColor);
			this.ctx.beginPath();
			this.ctx.strokeStyle = lineColor;
			this.ctx.moveTo(prevX, prevY);
			this.ctx.lineTo(nx, ny);
			this.ctx.stroke();
			prevX = nx;
			prevY = ny;
		});
		this.ctx.lineWidth = 1;
	};

	this.drawNoteAutomation = (
		note,
		nodes,
		zeroCentered = false, // TODO
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
		const releaseW = (nodes.at(-1).time - note.duration) * this.pxPerBeat;
		this.ctx.fillStyle = jodColors.releaseBox;
		this.ctx.fillRect(x + w, y, releaseW, h);

		
		this.ctx.lineWidth = 4;
		let prevX = x;
		let prevY = y + h * (zeroCentered ? 0.5 : 0);
		nodes.forEach((n) => {
			const nx = this.timeToX(note.startTime + n.time);
			const ny = zeroCentered ? (y + h * 0.5) + n.value * h * 0.5 : y + n.value * h;
			this.drawCircle(nx, ny, this.nodeRadius, nodeColor);
			this.ctx.beginPath();
			this.ctx.strokeStyle = lineColor;
			this.ctx.moveTo(prevX, prevY);
			this.ctx.lineTo(nx, ny);
			this.ctx.stroke();
			prevX = nx;
			prevY = ny;
		});
		this.ctx.lineWidth = 1;
	};

	this.drawNotes = ({ notes, active, muted, solo }) => {
		const shouldAnimate = this.isPlaying() && jodConfiguration.animations && !muted && (!noteManager.soloTrack || solo);
		let color = jodColors.note;
		let resizeColor = jodColors.resizeHandle;
		let selectedColor = jodColors.selectedNote;

		if (!active) {
			color = jodColors.fadedNote;
			resizeColor = jodColors.fadedResizeHandle;
			selectedColor = jodColors.fadedSelectedNote;
		}

		notes.forEach((n) => {
			const startX = this.timeToX(n.startTime);
			const endX = this.timeToX(n.startTime + n.duration);
			if (endX < 0.0) return;
			if (startX > this.width) return;

			switch (this.mode) {
				case EModes.pitchAutomation:
					if (this.selectedNotes.some((s) => s === n)) this.drawNote(n, selectedColor, resizeColor, shouldAnimate);
					else this.drawNote(n, color, resizeColor, shouldAnimate);
					if (!active) this.drawFadedPitchAutomation(n, n.automations?.[this.selectedOsc]?.pitch);
					else this.drawPitchAutomation(n, n.automations?.[this.selectedOsc]?.pitch);
					break;
				case EModes.automation:
					if (this.selectedNotes.some((s) => s === n))
						this.drawNoteAutomation(n, n.automations?.[this.selectedOsc]?.[this.automationProperty]);
					else this.drawNote(n, color, resizeColor, shouldAnimate);
					break;
				case EModes.panAutomation:
					if (this.selectedNotes.some((s) => s === n))
						this.drawNoteAutomation(n, n.automations?.[this.selectedOsc]?.[this.automationProperty], true);
					else this.drawNote(n, color, resizeColor, shouldAnimate);
					break;
				default:
					if (this.selectedNotes.some((s) => s === n)) this.drawNote(n, selectedColor, resizeColor, shouldAnimate);
					else this.drawNote(n, color, resizeColor, shouldAnimate);
					this.drawFadedPitchAutomation(n, n.automations?.[this.selectedOsc]?.pitch);
					break;
			}
		});
	};

	this.drawAllTracks = () => {
		noteManager.tracks.forEach((t) => {
			this.drawNotes(t);
		});
	};

	this.drawAABB = (aabb, color = jodColors.selectArea) => {
		const y = this.height - aabb.ay;
		const w = aabb.bx - aabb.ax;
		const h = (this.height - aabb.by) - y;

		this.ctx.fillStyle = color;
		this.ctx.fillRect(aabb.ax, y, w, h);
	};



	this.renderFnBusy = false;

	this.renderFn = () => {
		this.drawClear();
		this.drawGrid();
		this.drawAllTracks();
		if (this.isSelectingArea || this.isSelectingAllTracks) this.drawAABB(this.areaSelectAABB);
		this.drawLoopLines();
		this.drawTimeLine();
		if (this.showCursorLine && this.isCursorInside) this.drawCursorLine();
		this.renderFnBusy = false;
	};

	this.render = () => {
		if (this.isPlaying() || this.renderFnBusy) return;
		this.renderFnBusy = true;
		requestAnimationFrame(this.renderFn);
	};



	this.drawTimeLine = () => {
		this.timeLine.draw(this.ctx, this.scrollX, this.pxPerBeat, this.endTime, noteManager.tracks, this.isPlaying(), this.caretTime);
		if (!noteManager.loop.active) return;
		const start = noteManager.loop.start / this.endTime;
		const end = noteManager.loop.end / this.endTime;
		this.timeLine.drawLoopLines(this.ctx, start, end);
	};

	this.drawGrid = (ctx = this.ctx) => {
		//const pxPerBeat = Math.max(8, Math.min(600, this.pxPerBeat));
		//const visibleBeats = this.width / this.pxPerBeat;
		//const colsPerBeat = this.pxPerBeat / this.gridSizeX;
		const visColsMult = 1 << Math.floor(this.pxPerBeat / 50);
		const gridX = /* this.gridSizeX;// */this.pxPerBeat / visColsMult;// Math.max(8, Math.min(100, this.pxPerBeat / visColsMult));
		const visibleRows = this.height / this.pxPerTone;
		const visibleCols = /* visibleBeats * colsPerBeat;// */this.width / gridX;
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
		ctx.lineTo(x, this.height - this.timeLine.rect.h);
		ctx.stroke();
	};

	this.drawLoopLines = (ctx = this.ctx) => {
		if (!noteManager.loop.active) return;
		const start = this.timeToX(noteManager.loop.start);
		const end = this.timeToX(noteManager.loop.end);

		ctx.beginPath();
		ctx.strokeStyle = jodColors.loopLine;
		ctx.moveTo(start, 0);
		ctx.lineTo(start, this.height - this.timeLine.rect.h);
		ctx.moveTo(end, 0);
		ctx.lineTo(end, this.height - this.timeLine.rect.h);
		ctx.stroke();
	};

	this.drawCursorLine = (ctx = this.ctx) => {
		const x = this.snapX ? this.snapToGridX(this.cursorX) : this.cursorX;
		ctx.beginPath();
		ctx.strokeStyle = jodColors.cursorLine;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, this.height - this.timeLine.rect.h);
		ctx.stroke();
	};

	this.setTimeDisplay = (time) => {
		if (this.displaySeconds) time = beatsToSeconds(time, noteManager.bpm);
		const beats = Math.floor(time);
		const decimals = (time - beats) * 100;
		this.timeDisplay.innerHTML = beats.toString().padStart(2, '0');
		this.timeDecimalsDisplay.innerHTML = decimals.toString().slice(0, 2).replace('.', '').padStart(2, '0');
		if (!jodConfiguration.animations) return;
		const invTime = 1 - decimals * 0.01;
		this.timeDisplay.style.scale = 1 + invTime * invTime * 0.2;
	};

	this.playbackAnimationFrame = () => {
		const time = noteManager.getCurrentTime();
		const caretPos = this.timeToX(time);
		this.caretPos = caretPos;
		this.caretTime = time;
		
		if (this.autoScrollOnPlayback) this.scrollX = -time * this.pxPerBeat + this.width * 0.25;
		this.renderFn();
		this.drawCaret(caretPos);
		this.timeLine.drawCaret(this.ctx, time / this.endTime);

		if (noteManager.isPlaying) {
			this.setTimeDisplay(time);
			requestAnimationFrame(this.playbackAnimationFrame);
		} else {
			this.setTimeDisplay(0);
			this.timeDisplay.style.removeProperty('scale');
			this.render();
		}
	};

	this.togglePlayback = (options) => {
		if (noteManager.isPlaying) {
			noteManager.stopPlaybackLoop();
		} else {
			this.updateEndTime();
			if (options?.fromTime) noteManager.playbackLoop(options.fromTime);
			else if (options?.fromCursor) noteManager.playbackLoop(this.cursorTime);
			else noteManager.playbackLoop();
			this.playbackAnimationFrame();
		}
		this.playBtn.toggle(this.isPlaying());
	};

	this.onNoteScheduled = (trackIndex, startsIn, duration, track) => {
		if (!jodConfiguration.animations) return;
		const element = this.getTrackElement(trackIndex);
		playTrackAnimation(element, startsIn, duration, track.active);
		if (track.screenFlash) this.screenFlasher.start();
		if (track.screenShake) this.screenShaker.start();
	};

	this.visible = false;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.setAttribute('style', `width: ${this.width}px`);
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
	this.addTrack();

	noteManager.onNoteScheduled = this.onNoteScheduled;
}