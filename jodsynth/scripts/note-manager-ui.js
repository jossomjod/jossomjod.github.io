/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {NoteUi} note 
 */
function drawNote(ctx, noteUi) {
	ctx.fillStyle = noteUi.color;
	ctx.fillRect()
}

function Rect(x, y, w, h) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 0;
	this.h = h || 0;
}

function NoteManagerUI(noteManager) {
	this.trackerContainer = document.querySelector('.tracker-container');
	this.jodrollTemplate = document.querySelector('#jodroll-template');
	this.jodroll = this.jodrollTemplate.content.cloneNode(true);
	this.canvas = this.jodroll.querySelector('#jodroll-main-canvas');
	this.overlay1 = this.jodroll.querySelector('#jodroll-overlay1');
	this.ctx = this.canvas.getContext('2d');
	this.octx1 = this.overlay1.getContext('2d');

	this.pxPerBeat = 50;
	this.pxPerTone = 8;
	this.width = this.trackerContainer.width = window.innerWidth;
	this.height = this.canvas.height = this.trackerContainer.height = 400;
	this.canvas.width = this.width - 100;
	this.scrollX = 0;
	this.scrollY = 0;
	this.noteHeight = this.pxPerTone;
	this.newNoteDuration = 1;
	this.caretTime = 0;
	this.playbackStartedTimeOffset = 0;
	this.isPlaying = () => noteManager.isPlaying;

	this.primaryAction = 1;
	this.secondaryAction = 2;
	this.scrollAction = 4;

	this.gridSizeX = this.pxPerBeat;
	this.offsetY = this.pxPerTone / 2;
	this.snapX = true;
	this.snapY = true;

	this.clickedNoteIndex = -1;
	this.clickedNote = null;

	this.trackerContainer.addEventListener('mousedown', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);

		switch (e.buttons) {
			case this.primaryAction:
				this.clickedNoteIndex = this.getNoteIndexAtPos(realX, realY);
				if (this.clickedNoteIndex > -1) {
					this.clickedNote = noteManager.notes[this.clickedNoteIndex];
				} else {
					if (this.snapY) realY = this.snapToGridY(realY);
					if (this.snapX) realX = this.snapToGridX(realX);
					this.addNote(realX, realY);
				}
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
			case 0:
				this.clickedNote = null;
				this.clickedNoteIndex = -1;
				break;
			default:
				console.log('MOUSE EVENT', e);
		}
	});

	this.trackerContainer.addEventListener('mousemove', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = this.canvas.getBoundingClientRect();
		let realX = e.x - rect.left;
		let realY = this.height - (e.y - rect.top);
		switch (e.buttons) {
			case this.primaryAction: // TODO: use relative & fix snap to grid
				if (this.snapY) realY = this.snapToGridY(realY);
				if (this.snapX) realX = this.snapToGridX(realX);
				if (this.clickedNote) this.moveNote(this.clickedNote, realX, realY);
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
		return Math.round(x / this.gridSizeX) * this.gridSizeX + this.scrollX % this.gridSizeX - this.gridSizeX;
	};
	this.snapToGridY = (y) => {
		return Math.round(y / this.pxPerTone) * this.pxPerTone + this.scrollY % this.pxPerTone;
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
			const d = t + n.duration;
			const nt = n.tone;
			return time > t && time < d && tone < nt && tone > (nt - 1);
		});
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
		const tone = this.yToTone(y);
		note.startTime = time;
		note.setTone(tone);
		this.drawNotes();
	};

	this.deleteNote = (index) => {
		noteManager.notes.splice(index, 1);
		this.drawNotes();
	}

	this.drawClear = (ctx = this.ctx) => {
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, this.width, this.height);
	};


	this.drawNote = (note) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerBeat;
		const h = this.noteHeight;
		this.ctx.fillStyle = '#6699ff';
		this.ctx.fillRect(x, y, w, h);
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
		const visibleRows = this.height / this.pxPerTone;
		const visibleCols = this.width / this.pxPerBeat;
		
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
			const x = i * this.pxPerBeat + this.scrollX % this.pxPerBeat;
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.height);
		}
		ctx.stroke();

		// start line
		ctx.beginPath();
		ctx.strokeStyle = '#579cef';
		ctx.moveTo(this.scrollX, 0);
		ctx.lineTo(this.scrollX, this.height);
		ctx.stroke();
	};



	this.drawCaret = (x, ctx = this.octx1) => {
		ctx.beginPath();
		ctx.strokeStyle = '#c7bc8f';
		ctx.moveTo(x, 0);
		ctx.lineTo(x, this.height);
		ctx.stroke();
	};

	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.setAttribute('style', `width: ${this.width}px`);
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
}