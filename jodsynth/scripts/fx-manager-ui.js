

function FxManagerUi(fxManager) {
	this.fxManager = fxManager;
	this.container = document.querySelector('.fx-container');
	this.fxTemplate = document.querySelector('#fx-template');
	this.fxUi = this.fxTemplate.content.cloneNode(true);

	this.container.appendChild(this.fxUi);


	this.setFxManager = (fxMan) => {
		this.fxManager = fxMan;
	};
}