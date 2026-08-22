
## Demo estimate smoke test

The local `/estimate/demo` route rendered successfully with default `40 × 30 ft`, one floor, `840 sqft`, an estimated total of `৳22,67,537`, and an estimated six-month duration. The page exposed district-rate refresh/auto-detect, seven estimate tabs, CSV/PDF actions, and the engineering disclaimer. The structural tab rendered load inputs, load details, combinations, a 100% “Fully Compliant” result, beam/column design tables, and AI engineering recommendations.

The smoke test also surfaced two product-quality concerns from rendered behavior: the UI presents strong “BNBC 2022” compliance and “Safe” structural statuses despite the source formulas being simplified heuristics, and the page’s visible footer still links to `/faq`, `/privacy`, and `/terms` while those routes are not declared in `src/App.tsx`.

## Upload route smoke test

The local `/upload` route rendered successfully with a drag-and-drop/file picker, a 20 MB upload message, district market-rate controls, and manual project fields for plot dimensions, unit system, floors, height, wall thickness, project type, quality, foundation, roof, and sector. The page was stable without a visible runtime error. The upload route is public and the file picker accepts a broad set of extensions; the actual AI payload and persistence behavior remain client/edge-function dependent rather than using a project storage record at this stage.
