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
	this.width = this.canvas.width = this.trackerContainer.width = window.innerWidth;
	this.height = this.canvas.height = this.trackerContainer.height = 400;
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

	this.trackerContainer.addEventListener('mousedown', (e) => {
		const rect = this.canvas.getBoundingClientRect();
		realX = e.x - rect.left; // TODO: fix offset trouble
		realY = e.y - rect.top;

		if (e.buttons === this.primaryAction) {
			// TODO:
			// check note clicked
			if (false) {
				
			} else {
				this.addNote(realX, realY);
			}
		}
	});
	this.trackerContainer.addEventListener('mousemove', (e) => {
		if (e.buttons === this.scrollAction) {
			this.scrollX += e.movementX;
			this.scrollY += e.movementY;
			this.drawNotes(noteManager.notes);
		}
	});
	
	this.trackerContainer.appendChild(this.jodroll);

	this.timeToX = (time) => {
		return this.scrollX + time * this.pxPerSec;
	}
	this.xToTime = (x) => {
		return (x - this.scrollX) / this.pxPerSec;
	}
	this.toneToY = (tone) => {
		return this.scrollY + tone * this.pxPerTone;
	}
	this.yToTone = (y) => {
		return (y - this.scrollY) / this.pxPerTone;
	}

	this.addNote = (x, y) => {
		const time = this.xToTime(x);
		const tone = this.yToTone(y);
		const duration = this.newNoteDuration;
		const newNote = noteManager.addNote(time, tone, duration);
		this.drawNote(newNote);
	}

	this.drawClear = () => {
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.width, this.height);
	};


	this.drawNote = (note) => {
		const x = this.scrollX + note.startTime * this.pxPerSec;
		const y = this.scrollY + note.tone * this.pxPerTone;
		const w = note.duration * this.pxPerSec;
		const h = this.noteHeight;
		this.ctx.fillStyle = '#6699ff';
		this.ctx.fillRect(x, y, w, h);
	};

	this.drawNotes = (notes = noteManager.notes) => {
		this.drawClear();
		notes.forEach((n) => this.drawNote(n));
	};

	this.drawGrid = () => {
		const visibleRows = this.height / this.pxPerTone;
		// TODO
	}



	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.classList.toggle('invisible', !visible);
	};
	this.toggleVisible();
}