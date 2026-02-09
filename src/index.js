import { createServer } from "node:http";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const siteRoot = fileURLToPath(new URL("../", import.meta.url));

// Wisp Configuration: https://www.npmjs.com/package/@mercuryworkshop/wisp-js
logging.set_level(logging.NONE);
Object.assign(wisp.options, {
	allow_udp_streams: false,
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
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
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

let port = parseInt(process.env.PORT || "", 10);
if (Number.isNaN(port)) port = 8080;

await fastify.listen({
	port,
	host: "0.0.0.0",
});

