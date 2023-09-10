const path = window.Native.DANGEROUS__NODE__REQUIRE('path');
const fs = window.Native.DANGEROUS__NODE__REQUIRE('fs');

import { Git } from './core';
import { ERROR_IDENTIFIERS } from './constants';

export const Content = async (file: string, repoPath: string, source?: string) => {
	if (!file || !repoPath) {
		return '';
	}

	let result: string;

	if (!fs.existsSync(file)) {
		return await Git({
			directory: path.dirname(file),
			command: 'show',
			args: [`${source || 'HEAD'}:` + file.replace(repoPath, '').replace(/^[\/\\]/, '')]
		});
	}

	try {
		result = await Git({
			directory: path.dirname(file),
			command: 'show',
			args: [`${source || ':0'}:` + file]
		});
	} catch (error) {
		if (error.message.includes(ERROR_IDENTIFIERS.DISK_NO_INDEX)) {
			if (source) return '';

			return fs.readFileSync(file, 'utf8');
		}

		throw error;
	}

	return result;
};