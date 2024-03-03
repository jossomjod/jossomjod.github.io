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

function noteToRect(note) {

}

function NoteUi(note) {
	this.note = note;
	this.color = color || '#c0ffee';
	this.x = 0;
	this.y = 0;
	this.w = 0;
	this.h = 0;

	this.update = () => {

	}

	this.draw = () => {
		
	}
}

function NoteManagerUI(noteManager) {
	this.trackerContainer = document.querySelector('.tracker-container');
	this.jodrollTemplate = document.querySelector('#jodroll-template');
	this.jodroll = this.jodrollTemplate.content.cloneNode(true);
	this.canvas = this.jodroll.querySelector('.jodroll-canvas');
	this.ctx = this.canvas.getContext('2d');
	this.pxPerSec = 300;
	this.pxPerTone = 8;
	this.width = this.trackerContainer.width = window.innerWidth;
	this.height = this.canvas.height = this.trackerContainer.height = 400;
	this.canvas.width = this.width - 100;
	this.scrollX = 0;
	this.scrollY = 0;
	this.noteHeight = this.pxPerTone;
	this.newNoteDuration = 0.25;
	this.caretTime = 0;
	this.playbackStartedTimeOffset = 0;
	this.isPlaying = () => noteManager.isPlaying;

	this.primaryAction = 1;
	this.secondaryAction = 4;
	this.scrollAction = 2;

	this.gridSizeX = this.pxPerSec * 0.1; // TODO: use beats instead of seconds
	this.offsetY = this.pxPerTone / 2;
	this.snapX = false;
	this.snapY = true;

	this.clickedNoteIndex = -1;
	this.clickedNote = null;

	this.trackerContainer.addEventListener('mousedown', (e) => {
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
				const index = this.getNoteIndexAtPos(realX, realY);
				if (index > -1) this.deleteNote(index);
				break;
			case 0:
				this.clickedNote = null;
				this.clickedNoteIndex = -1;
				break;
		}
	});

	this.trackerContainer.addEventListener('mousemove', (e) => {
		switch (e.buttons) {
			case this.primaryAction:
				const rect = this.canvas.getBoundingClientRect();
				let realX = e.x - rect.left;
				let realY = this.height - (e.y - rect.top);
				if (this.snapY) realY = this.snapToGridY(realY);
				if (this.snapX) realX = this.snapToGridX(realX);
				if (this.clickedNote) this.moveNote(this.clickedNote, realX, realY);
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
		return this.scrollX + time * this.pxPerSec;
	};
	this.xToTime = (x) => {
		return (x - this.scrollX) / this.pxPerSec;
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
		const w = note.duration * this.pxPerSec;
		const h = this.noteHeight;
		return { x, y, w, h };
	};
	this.getNotePos = (note) => {
		return { x: this.timeToX(note.startTime), y: this.toneToY(note.tone) };
	};

	this.snapToGridX = (x) => {
		return Math.round(x / this.gridSizeX) * this.gridSizeX + this.scrollX % this.gridSizeX;
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
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		note.startTime = time;
		note.setTone(tone);
		this.drawNotes();
	};

	this.deleteNote = (index) => {
		noteManager.notes.splice(index, 1);
		this.drawNotes();
	}

	this.drawClear = () => {
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.width, this.height);
	};


	this.drawNote = (note) => {
		const x = this.timeToX(note.startTime);
		const y = this.toneToY(note.tone);
		const w = note.duration * this.pxPerSec;
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

	this.drawGrid = () => {
		const visibleRows = this.height / this.pxPerTone;
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#a7cab362';
		for (let i = 0; i < visibleRows; i++) {
			const y = i * this.pxPerTone - this.scrollY % this.pxPerTone;
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.width, y);
		}
		this.ctx.stroke();
	}



	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.setAttribute('style', `width: ${this.width}px`);
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
}