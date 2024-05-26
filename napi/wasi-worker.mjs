import fs from "node:fs";
import { createRequire } from "node:module";
import { Worker, parentPort } from "node:worker_threads";

import {
	MessageHandler,
	WASI,
	instantiateNapiModuleSync,
} from "@napi-rs/wasm-runtime";

const require = createRequire(import.meta.url);

if (parentPort) {
	parentPort.on("message", (data) => {
		globalThis.onmessage({ data });
	});
}

Object.assign(globalThis, {
	self: globalThis,
	require,
	Worker,
	importScripts: (f) => {
		(0, eval)(fs.readFileSync(f, "utf8") + "//# sourceURL=" + f);
	},
	postMessage: (msg) => {
		if (parentPort) {
			parentPort.postMessage(msg);
		}
	},
});

const handler = new MessageHandler({
	onLoad({ wasmModule, wasmMemory }) {
		const wasi = new WASI({ fs });

		return instantiateNapiModuleSync(wasmModule, {
			childThread: true,
			wasi,
			overwriteImports(importObject) {
				importObject.env = {
					...importObject.env,
					...importObject.napi,
					...importObject.emnapi,
					memory: wasmMemory,
				};
			},
		});
	},
});

globalThis.onmessage = (e) => {
	handler.handle(e);
};
