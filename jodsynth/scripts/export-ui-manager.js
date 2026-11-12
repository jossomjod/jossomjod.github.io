class ExportUiManager {
	exportBtn = document.querySelector('.export-btn');
	exportBtnOriginalText = this.exportBtn.innerHTML;
	state = 0; // 0: inactive, 1: rendering, 2: encoding
	timeLeft = 0;
	prevTime = 0;

	onUpdate = (timeStamp) => {
		const delta = (timeStamp - this.prevTime) / 1000;
		this.timeLeft -= delta;

		switch (this.state) {
			case 0:
				this.exportBtn.innerHTML = this.exportBtnOriginalText;
				this.exportBtn.classList.remove('active');
				this.exportBtn.disabled = false;
				return;
			case 1:
				this.exportBtn.innerHTML = 'Rendering' + this.getDots(this.timeLeft * 3);
				break;
			case 2:
				if (this.timeLeft > 0) {
					this.exportBtn.innerHTML = 'Encoding: ' + this.formatTime(this.timeLeft);
				} else {
					this.exportBtn.innerHTML = 'Finalizing' + this.getDots(this.timeLeft * 3);
				}
				break;
		}

		this.prevTime = timeStamp;
		requestAnimationFrame(this.onUpdate);
	}

	startRendering() {
		this.exportBtn.classList.add('active');
		this.exportBtn.disabled = true;
		this.state = 1;
		this.timeLeft = 0;
		this.prevTime = performance.now();
		requestAnimationFrame(this.onUpdate);
	}

	startEncoding(eta) {
		if (this.state === 0) {
			this.state = 2;
			this.exportBtn.classList.add('active');
			this.timeLeft = eta;
			this.prevTime = performance.now();
			requestAnimationFrame(this.onUpdate);
		} else {
			this.state = 2;
			this.timeLeft = eta;
		}
	}

	stop() {
		this.state = 0;
	}

	formatTime(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		const min = minutes ? minutes.toString() + ':' : '';
		return min + seconds.toString().padStart(2, '0');
	}

	#dots = ['', '.', '..', '...'];
	getDots(time) {
		return this.#dots[Math.floor(Math.abs(time) % 4)];
	}
}
