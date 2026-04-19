class JodOsc extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputList, outputList, parameters) {
    // TODO
		console.log('process');
    return true;
  }
}

registerProcessor("jod-osc", JodOsc);
