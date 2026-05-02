// Bundle entry point for the AsyncGlk-based flutterbug client.
//
// esbuild bundles this into src/flutterbug_server/static/asyncglk.bundle.js
// as an IIFE that exposes a single global `AsyncGlk` containing the pieces
// flutterbug's playws.js needs to render and accept input.
//
// For Phase 0 of the PoC, this is just enough to confirm the bundle builds
// and loads in a browser. Later phases add more exports and a real client
// that wraps these for flutterbug's multiplayer protocol.

// asyncglk's package.json has no `exports`/`main` field, so import from the
// explicit compiled path under `dist/`. The asyncglk install runs `tsc`
// during npm install (its `prepare` script) so dist/ is always populated.
// Phase 0 entry: just enough to confirm the bundle builds and loads.
// Skipping Dialog for now — asyncglk's Dialog drags in Svelte UI components
// that need esbuild-svelte; we'll add that in Phase 1 when we actually need
// save/restore dialog UI.
export {default as WebGlkOte} from 'asyncglk/dist/glkote/web/web.js'
export {Blorb} from 'asyncglk/dist/blorb/blorb.js'
export * as protocol from 'asyncglk/dist/common/protocol.js'
