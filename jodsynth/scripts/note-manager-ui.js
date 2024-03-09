function Rect(x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
}

function NoteManagerUI(noteManager, previewSynth) {
	this.trackerContainer = document.querySelector('.tracker-container');
	this.jodrollTemplate = document.querySelector('#jodroll-template');
	this.jodroll = this.jodrollTemplate.content.cloneNode(true);
	this.canvas = this.jodroll.querySelector('#jodroll-main-canvas');
	this.overlay1 = this.jodroll.querySelector('#jodroll-overlay1');
	this.ctx = this.canvas.getContext('2d');
	this.octx1 = this.overlay1.getContext('2d');

	this.pxPerBeat = 50;
	this.pxPerTone = 10;
	this.width = this.trackerContainer.width = window.innerWidth;
	this.height = this.canvas.height = this.trackerContainer.height = 600;
	this.canvas.width = this.width - 100;
	this.scrollX = 0;
	this.scrollY = 0;
	this.noteHeight = this.pxPerTone;
	this.newNoteDuration = 1;
	this.isPlaying = () => noteManager.isPlaying;

	this.primaryAction = 1;
	this.secondaryAction = 2;
	this.scrollAction = 4;

	this.gridSizeTime = 0.25; // 4 vertical lines per beat   TODO
	this.gridSizeX = this.pxPerBeat;
	this.offsetY = this.pxPerTone / 2;
	this.snapX = true;
	this.snapY = true;

	this.clickedNoteIndex = -1;
	this.clickedNote = null;
	this.previewNoteId = null;
	this.isResizing = false;
	this.resizeTriggerSize = 10;

	this.cursorX = 0;

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
				if (this.clickedNoteIndex > -1) {
					this.clickedNote = noteManager.notes[this.clickedNoteIndex];
					this.isResizing = this.checkResizeTrigger(this.clickedNote, realX);
				} else {
					if (this.snapY) realY = this.snapToGridY(realY);
					if (this.snapX) realX = this.snapToGridX(realX);
					this.addNote(realX, realY);
				}
				this.previewNote(true);
				break;
			case this.scrollAction:
				e.preventDefault();
				e.stopPropagation();
				break;
			case this.secondaryAction:
				e.preventDefault();
				e.stopPropagation();
				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
		}
	});
	this.trackerContainer.addEventListener('mouseup', (e) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (~e.buttons & this.primaryAction) {
			if (this.clickedNote) this.newNoteDuration = this.clickedNote.duration;

			this.previewNote(false);
			this.clickedNote = null;
			this.clickedNoteIndex = -1;
			this.isResizing = false;
		}
	});

	this.trackerContainer.oncontextmenu = (e) => e.preventDefault();;

	this.trackerContainer.addEventListener('mousemove', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);
		this.cursorX = realX;

		switch (e.buttons) {
			case this.primaryAction:
				if (this.snapX) realX = this.snapToGridX(realX);
				if (this.snapY) realY = this.snapToGridY(realY);
				if (this.clickedNote) {
					const dTime = this.xToTime(realX) - this.clickedNote.startTime;
					if (this.isResizing) {
						this.resizeNoteBy(this.clickedNote, dTime);
						break;
					}
					const dTone = this.yToTone(realY) - this.clickedNote.tone;
					this.moveNoteBy(this.clickedNote, dTime, dTone);
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
				this.drawNotes(noteManager.notes);
				break;
		}
	});


	this.trackerContainer.addEventListener('wheel', (e) => { // TODO: zoom on cursor
		e.preventDefault();
		e.stopPropagation();
		this.pxPerBeat -= Math.sign(e.deltaY) * this.pxPerBeat * 0.25;
		this.gridSizeX = this.pxPerBeat;
		this.drawNotes();
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
		return noteManager.notes.find((n) => {
			const t = n.startTime;
			const d = t + n.duration;
			const nt = n.tone;
			return time > t && time < d && tone < nt && tone > (nt - 1);
		});
	};

	this.getNoteIndexAtPos = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		return noteManager.notes.findIndex((n) => {
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

	this.addNote = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		const duration = this.newNoteDuration;
		this.clickedNote = noteManager.addNote(time, tone, duration);
		this.clickedNoteIndex = noteManager.notes.length - 1;
		this.drawNote(this.clickedNote);
	};

	this.moveNote = (note, x, y) => {
		let time = this.xToTime(x);
		if (time < 0) time = 0;
		note.startTime = time;
		note.tone = this.yToTone(y);
		this.drawNotes();
	};

	this.moveNoteBy = (note, dTime, dTone) => {
		note.startTime += dTime;
		if (note.startTime < 0) note.startTime = 0;
		note.tone += dTone;
		this.drawNotes();
	};

	this.resizeNoteBy = (note, t) => {
		note.duration = t;
		if (note.duration < 0) note.duration = 0;
		this.drawNotes();
	};

	this.deleteNote = (index) => {
		noteManager.notes.splice(index, 1);
		this.drawNotes();
	}

	this.previewNote = (bool) => {
		const tone = this.clickedNote?.tone ?? 12;
		if (bool) this.previewNoteId = previewSynth.start(toneToFreq(tone));
		else if (this.previewNoteId) previewSynth.stop(this.previewNoteId);
	};

	this.drawClear = (ctx = this.ctx) => {
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, this.width, this.height);
	};


	this.drawNote = (note) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		const r = this.resizeTriggerSize;
		this.ctx.fillStyle = '#6699ff';
		this.ctx.fillRect(x, y, w, h);

		this.ctx.fillStyle = '#99c9ff';
		this.ctx.fillRect(x + w - r * 0.5, y, r, h);
	};

	this.drawNotes = (notes = noteManager.notes) => {
		this.drawClear();
		this.drawGrid();
		notes.forEach((n) => {
			if (this.timeToX(n.startTime + n.duration) < 0.0) return;
			if (this.timeToX(n.startTime) > this.width) return;
			this.drawNote(n);
		});
	};

	this.drawGrid = (ctx = this.ctx) => {
		const gridX = this.pxPerBeat / Math.round(this.pxPerBeat / 30);
		const visibleRows = this.height / this.pxPerTone;
		const visibleCols = this.width / gridX;
		
		// horizontal lines
		ctx.beginPath();
		ctx.strokeStyle = '#a7cab352';
		for (let i = 0; i < visibleRows; i++) {
			const y = i * this.pxPerTone - this.scrollY % this.pxPerTone;
			ctx.moveTo(0, y);
			ctx.lineTo(this.width, y);
		}
		ctx.stroke();

		// vertical lines
		ctx.beginPath();
		ctx.strokeStyle = '#a7cab322';
		for (let i = 0; i < visibleCols; i++) {
			const x = i * gridX + this.scrollX % gridX;
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.height);
		}
		ctx.stroke();

		// center tone line
		ctx.beginPath();
		ctx.strokeStyle = '#579cef';
		ctx.moveTo(0, -this.scrollY);
		ctx.lineTo(this.width, -this.scrollY);
		ctx.stroke();

		// start line
		ctx.beginPath();
		ctx.strokeStyle = '#579cef';
		ctx.moveTo(this.scrollX, 0);
		ctx.lineTo(this.scrollX, this.height);
		ctx.stroke();
	};

	this.drawCaret = (x, ctx = this.ctx) => {
		ctx.beginPath();
		ctx.strokeStyle = '#c7bc8f';
		ctx.moveTo(x, 0);
		ctx.lineTo(x, this.height);
		ctx.stroke();
	};

	this.playbackAnimationFrame = () => {
		const time = noteManager.getCurrentTime();
		const caretPos = this.timeToX(time);
		
		this.drawNotes();
		this.drawCaret(caretPos);

		if (noteManager.isPlaying) {
			requestAnimationFrame(this.playbackAnimationFrame);
		} else {
			this.drawNotes();
		}
	};

	this.togglePlayback = (options) => {
		if (noteManager.isPlaying) {
			noteManager.stop();
		} else {
			if (options.fromCursor) noteManager.play(this.xToTime(this.cursorX));
			else noteManager.play();
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
}