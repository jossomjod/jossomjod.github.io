
function NoteManagerUI() {
	this.trackerContainer = document.querySelector('.tracker-container');
	this.jodrollTemplate = document.querySelector('#jodroll-template');
	this.jodroll = this.jodrollTemplate.content.cloneNode(true);

	this.trackerContainer.appendChild(this.jodroll);

	this.visible = true;
	this.toggleVisible = (visible = !this.visible) => {
		this.visible = visible;
		this.trackerContainer.classList.toggle('invisible', !visible);
	}
	this.toggleVisible();
}