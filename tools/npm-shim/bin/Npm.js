#!/usr/bin/env node
/**
 * Render start-command safety shim.
 *
 * Some deploy configs accidentally use `Npm install` (capital N) as the start
 * command, which fails on Linux. Provide a `Npm` binary so the service can
 * still boot and run the server.
 */
import { spawn } from "node:child_process";
import path from "node:path";

const entry = path.join(process.cwd(), "src", "index.js");
const child = spawn(process.execPath, [entry], {
	stdio: "inherit",
	env: process.env,
});

child.on("exit", (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 0);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
	process.on(sig, () => child.kill(sig));
}

