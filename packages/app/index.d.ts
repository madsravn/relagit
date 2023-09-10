import { Native as _Native } from '../native/src/preload';

declare global {
	interface Window {
		Stores: {
			[key: string]: unknown;
		};
		Managers: {
			[key: string]: unknown;
		};
		Native: typeof _Native;
	}

	export const __NODE_ENV__: 'development' | 'production' | 'test';
}