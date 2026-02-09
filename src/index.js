import { createServer } from "node:http";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { createRequire } from "node:module";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const require = createRequire(import.meta.url);
const { createBareServer } = require("@nebula-services/bare-server-node");
const { bareModulePath } = require("@mercuryworkshop/bare-as-module3");

const siteRoot = fileURLToPath(new URL("../", import.meta.url));

const bare = createBareServer("/proxy/bare/", {
	logErrors: true,
	blockLocal: false,
});

// Wisp Configuration: https://www.npmjs.com/package/@mercuryworkshop/wisp-js
// Keep logs quiet by default, but don't fully silence warnings/errors in prod.
logging.set_level(process.env.WISP_LOG === "1" ? logging.INFO : logging.WARN);
Object.assign(wisp.options, {
	allow_udp_streams: false,
	// Render (and many Node hosts) often lack reliable IPv6 egress.
	// Prefer IPv4 to avoid connection failures (curl error 7).
	dns_result_order: "ipv4first",
});

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				// Only isolate the proxy area. The main site loads CDN assets that
				// often lack CORP headers and would break under COEP.
				if (req.url?.startsWith("/proxy/")) {
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
					res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				}

				if (bare.shouldRoute(req)) {
					bare.routeRequest(req, res);
					return;
				}

				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (bare.shouldRoute(req)) {
					bare.routeUpgrade(req, socket, head);
					return;
				}

				const rawUrl = req.url || "";
				const pathname = rawUrl.split("?")[0];

				// Be lenient here: some reverse proxies strip trailing slashes or add
				// query params. Wisp *requires* a trailing slash to be treated as a Wisp
				// endpoint (otherwise it becomes wsproxy).
				if (pathname === "/proxy/wisp" || pathname.startsWith("/proxy/wisp/")) {
					if (!pathname.endsWith("/")) req.url = pathname + "/";
					wisp.routeRequest(req, socket, head);
					return;
				}

				socket.end();
			});
	},
});

// Serve the existing static site at /
fastify.register(fastifyStatic, {
	root: siteRoot,
	decorateReply: true,
});

// Serve Scramjet bundle files used by the proxy page
fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/proxy/scram/",
	decorateReply: false,
});

// Transports used by BareMux in the proxy page
fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: "/proxy/libcurl/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/proxy/baremux/",
	decorateReply: false,
});

// Bare transport module for bare-mux (client-side)
fastify.register(fastifyStatic, {
	root: bareModulePath,
	prefix: "/proxy/baremod/",
	decorateReply: false,
});

let port = parseInt(process.env.PORT || "", 10);
if (Number.isNaN(port)) port = 8080;

await fastify.listen({
	port,
	host: "0.0.0.0",
});

