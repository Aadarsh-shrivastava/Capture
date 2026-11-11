// On-demand AI model: downloaded into the vault instead of bundled in the app.
export {MODEL_SIZE_MB} from './config';
export {isModelDownloaded, modelPath} from './modelFile';
export {ModelGate} from './ModelGate';
export {ModelRow} from './ModelRow';
export {useModelStore} from './store';
