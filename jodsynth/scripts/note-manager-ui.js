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
};

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
	fadedSelectedNote: '#7c42e176',
	playingNote: '#aceaff',
	playingNoteBorder: '#aceaff',
	mutedNote: '#55426253',
	automationBox: '#387f6caa',
	automationNode: '#fca372',
	automationLine: '#3afa8c99',
	releaseBox: '#386e62aa',
	loopLine: '#58c34ab2',
};


class TimelineUI {
	rect;
	color = '#212436';
	backgroundColor = '#111111';

	selectionRange = { start: 0, end: 0 };
	isSelecting = 0; // 1: ctrl, 2: ctrl + shift
	selectionColor = '#31426f53';

	/** @param {Rect} rect  */
	constructor(rect) {
		this.rect = rect;
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
	draw(ctx, scrollX, pxPerBeat, endTime, tracks) {
		const { x, y, w, h } = this.rect;
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(x, y, w, h);

		const left = (-scrollX / (endTime * pxPerBeat)) * w;
		const width = w * w / (pxPerBeat * endTime);

		ctx.fillStyle = this.color;
		ctx.fillRect(left, y, width, h);

		tracks.forEach((t) => t.notes.forEach((n) => {
			const nx = w * n.startTime / endTime;
			const ny = y + (h - n.tone);
			const nw = w * n.duration / endTime;
			ctx.fillStyle = jodColors.note;
			ctx.fillRect(nx, ny, nw, 1);
		}));

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
	
	this.toggleLoopingBtn = document.querySelector('#toggleLoopingBtn');
	this.toggleLoopingBtn.classList.toggle('active', noteManager.loop.active);
	this.toggleLoopingBtn.onclick = () => this.toggleLooping();

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
	this.gridSizeTime = 0.25; // 4 vertical lines per beat   TODO
	this.gridSizeX = this.pxPerBeat;
	this.offsetY = this.pxPerTone / 2;
	this.snapX = true;
	this.snapY = true;

	this.clickedNote = null;
	this.noteMinDuration = 0.01;
	this.previewNoteId = null;
	this.isResizing = false;
	this.resizeTriggerSize = 10;
	this.automationBoxHeight = 70;
	this.mode = EModes.notes;

	this.selectedNotes = [];
	this.isSelectingArea = false;
	this.isSelectingAllTracks = false;
	this.areaSelectAABB = { ax: 0, ay: 0, bx: 0, by: 0 };

	this.cursorX = 0;
	this.cursorTime = 0;
	this.endTime = this.beatsPerBar;

	this.caretPos = -9999; // used ONLY for animating notes during playback. Must be reset to -9999 when not playing

	this.timeLine = new TimelineUI({ x: 0, y: this.height - 100, w: this.width, h: 100 });
	this.timeLineClicked = false;


	this.trackerContainer.addEventListener('mousedown', (e) => {
		e.preventDefault();
		e.stopPropagation();
		document.activeElement.blur();

		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);

		this.timeLineClicked = this.timeLine.isPointInside(realX, e.y - rect.top);

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
		}
	});

	this.onMouseUpOrEnter = (e) => {
		e.preventDefault();
		e.stopPropagation();
		
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
				this.updateEndTime();
				this.render();
			}

			this.previewNote(false);
			this.clickedNote = null;
			this.isResizing = false;
			this.timeLineClicked = false;
		}
	};

	this.trackerContainer.addEventListener('mouseup', this.onMouseUpOrEnter);
	this.trackerContainer.addEventListener('mouseenter', this.onMouseUpOrEnter);

	this.trackerContainer.oncontextmenu = (e) => e.preventDefault();

	this.trackerContainer.addEventListener('mousemove', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);
		this.cursorX = realX;
		this.cursorTime = this.xToTime(this.cursorX);

		const timeLineClicked = +this.timeLine.isPointInside(realX, e.y - rect.top) * this.timeLineAction;
		const scrollHack = +e.altKey * this.scrollAction; // alternative to middle mouse button
		const fakeButtons = e.buttons | scrollHack | timeLineClicked;

		switch (fakeButtons) {
			case this.primaryAction:
				if (this.timeLineClicked) {
					if (this.timeLine.isSelecting) {
						this.timeLine.updateSelection(realX);
						this.drawTimeLine();
					}
					else this.scrollToAbsolute(realX);
					break;
				}
				if (this.snapX) realX = this.snapToGridX(realX);
				if (this.snapY) realY = this.snapToGridY(realY);

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

	this.scrollToAbsolute = (x) => {
		const w = this.timeLine.rect.w;
		this.scrollX = -(x / w) * this.endTime * this.pxPerBeat + w * 0.5;
		this.render();
	};

	this.updateEndTime = () => {
		this.endTime = Math.ceil(noteManager.getEndTime() / this.beatsPerBar) * this.beatsPerBar;
		noteManager.setEndTime(this.endTime);
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
		if (note.duration < 0) note.duration = this.noteMinDuration;
	};

	this.resizeNotesBy = (t) => {
		const initDur = this.clickedNote.duration;
		const delta = t - initDur;

		if (initDur <= this.noteMinDuration && delta < 0) return;

		this.selectedNotes?.forEach((n) => this.resizeNoteBy(n, delta));
		this.render();
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
			if (!tracks[i].length || isMain) return;
			const sorted = tracks[i].sort((a, b) => a.startTime - b.startTime);
			sorted.forEach((n) => n.startTime += timeDiff);
			t.notes = t.notes.concat(sorted);
			this.selectedNotes.push(...sorted);
		});

		this.updateEndTime();
		this.render();
	};

	this.previewNote = (bool) => {
		const tone = this.clickedNote?.tone ?? 12;
		if (bool) this.previewNoteId = noteManager.getSelectedTrack().synth.start(toneToFreq(tone));
		else if (this.previewNoteId) noteManager.getSelectedTrack().synth.stop(this.previewNoteId);
	};

	this.toggleLooping = () => {
		noteManager.toggleLooping();
		this.toggleLoopingBtn.classList.toggle('active', noteManager.loop.active);
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
	}

	this.toggleMuteTrack = (track) => {
		track.muted = !track.muted;
	}

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


	this.drawNote = (note, color = jodColors.note, resizeColor = jodColors.resizeHandle, muted = false) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		const r = this.resizeTriggerSize;

		const time = (this.caretPos - x) / w;
		const dur = 2.5;
		if (this.isPlaying() && jodConfiguration.animations && !muted && time >= 0 && time <= dur) {
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

	// TODO
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

		nodes.forEach((n) => {
			//if (n.time > note.duration) // TODO
			const nx = this.timeToX(note.startTime + n.time);
			const ny = y + n.value * -this.automationBoxHeight;
			this.drawCircle(nx, ny, 7, nodeColor);
		});
	};

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

	this.drawNotes = ({ notes, active, muted }) => {
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
			if (this.mode === 2) {
				this.drawNoteAutomation(n, n.gainNodes);
			} else {
				if (this.selectedNotes.some((s) => s === n)) this.drawNote(n, selectedColor, resizeColor, muted);
				else this.drawNote(n, color, resizeColor, muted);
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

	this.render = () => {
		this.drawClear();
		this.drawGrid();
		this.drawAllTracks();
		if (this.isSelectingArea || this.isSelectingAllTracks) this.drawAABB(this.areaSelectAABB);
		this.drawLoopLines();
		this.drawTimeLine();
	};

	this.drawTimeLine = () => {
		this.timeLine.draw(this.ctx, this.scrollX, this.pxPerBeat, this.endTime, noteManager.tracks);
		if (!noteManager.loop.active) return;
		const start = noteManager.loop.start / this.endTime;
		const end = noteManager.loop.end / this.endTime;
		this.timeLine.drawLoopLines(this.ctx, start, end);
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

	this.playbackAnimationFrame = () => {
		const time = noteManager.getCurrentTime();
		const caretPos = this.timeToX(time);
		this.caretPos = caretPos;
		
		if (this.autoScrollOnPlayback) this.scrollX = -time * this.pxPerBeat + this.width * 0.2;
		this.render();
		this.drawCaret(caretPos);
		this.timeLine.drawCaret(this.ctx, time / this.endTime);

		if (noteManager.isPlaying) {
			requestAnimationFrame(this.playbackAnimationFrame);
		} else {
			this.caretPos = -9999;
			this.render();
		}
	};

	this.togglePlayback = (options) => {
		if (noteManager.isPlaying) {
			noteManager.stopPlaybackLoop();
		} else {
			this.updateEndTime();
			if (options.fromTime) noteManager.playbackLoop(options.fromTime);
			else if (options.fromCursor) noteManager.playbackLoop(this.cursorTime);
			else noteManager.playbackLoop();
			this.playbackAnimationFrame();
		}
	};

	this.onNoteScheduled = (trackIndex, startsIn, duration, isTrackActive) => {
		if (!jodConfiguration.animations) return;
		const element = this.getTrackElement(trackIndex);
		const strength = 8;
		playTrackAnimation(element, startsIn, duration, isTrackActive);
		element.shaker?.shake(duration, strength);
	};

	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.setAttribute('style', `width: ${this.width}px`);
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
	this.addTrack();

	noteManager.onNoteScheduled = this.onNoteScheduled;
}