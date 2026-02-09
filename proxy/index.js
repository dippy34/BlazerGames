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

async function ensureRemoteLibcurlTransport(wispUrl) {
	// Use a remote transport so libcurl initializes in the window context.
	// This avoids the "wasm not loaded yet" race inside the SharedWorker.
	const { default: LibcurlClient } = await import("/proxy/libcurl/index.mjs");

	async function initClient() {
		const client = new LibcurlClient({ websocket: wispUrl });
		await client.init();
		return client;
	}

	try {
		const client = await initClient();
		await connection.setRemoteTransport(client, "libcurl-remote");
		return;
	} catch (err) {
		// If wasm is still spinning up, wait for the module's readiness event and retry once.
		if (!String(err).includes("wasm not loaded yet")) throw err;

		await new Promise((resolve, reject) => {
			const t = setTimeout(
				() => reject(new Error("Timed out waiting for libcurl wasm to load")),
				20000
			);
			document.addEventListener(
				"libcurl_load",
				() => {
					clearTimeout(t);
					resolve();
				},
				{ once: true }
			);
		});

		const client = await initClient();
		await connection.setRemoteTransport(client, "libcurl-remote");
	}
}

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

	await ensureRemoteLibcurlTransport(wispUrl);

	const frameRoot = document.getElementById("frame-root");
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	frameRoot.replaceChildren(frame.frame);
	frame.go(url);
});

