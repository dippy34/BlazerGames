"use strict";

/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	prefix: "/proxy/scramjet/",
	files: {
		wasm: "/proxy/scram/scramjet.wasm.wasm",
		all: "/proxy/scram/scramjet.all.js",
		sync: "/proxy/scram/scramjet.sync.js",
	},
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/proxy/baremux/worker.js");

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	error.textContent = "";
	errorCode.textContent = "";

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err?.toString?.() || String(err);
		throw err;
	}

	const url = search(address.value, searchEngine.value);
	const wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/proxy/wisp/";

	if ((await connection.getTransport()) !== "/proxy/libcurl/index.mjs") {
		await connection.setTransport("/proxy/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}

	const frameRoot = document.getElementById("frame-root");
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	frameRoot.replaceChildren(frame.frame);
	frame.go(url);
});

