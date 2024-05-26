import {
	MessageHandler,
	WASI,
	instantiateNapiModuleSync,
} from "@napi-rs/wasm-runtime";
import { Volume, createFsFromVolume } from "@napi-rs/wasm-runtime/fs";

const fs = createFsFromVolume(
	Volume.fromJSON({
		"/": null,
	}),
);

const handler = new MessageHandler({
	onLoad({ wasmModule, wasmMemory }) {
		const wasi = new WASI({
			fs,
			print: () => {
				// eslint-disable-next-line no-console
				console.log.apply(console, arguments);
			},
			printErr: () => {
				// eslint-disable-next-line no-console
				console.error.apply(console, arguments);
			},
		});
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
