"use strict";
/**
 *
 * @param {string} input
 * @param {string} template Template for a search query.
 * @returns {string} Fully qualified URL
 */
function search(input, template) {
	try {
		return new URL(input).toString();
	} catch {
		// not a valid URL
	}

	try {
		const url = new URL(`http://${input}`);
		if (url.hostname.includes(".")) return url.toString();
	} catch {
		// not a valid URL
	}

	return template.replace("%s", encodeURIComponent(input));
}

self.search = search;

