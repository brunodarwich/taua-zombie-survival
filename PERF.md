# Performance measurements

Measured locally on 2026-10-27 with the same workloads before and after each change.
These are controlled costs, not a claim about FPS on physical phones or tablets.

| Workload | Before | After | Change |
| --- | --- | --- | --- |
| 240 A* requests in the real arena, median of 5 warmed runs | 321.7 ms | 18.3 ms | Cache immutable grid adjacency |
| Render 120 simultaneous sparks in Chromium/WebGL | 120 draw calls | 1 draw call | Instanced rendering, same 2,880 triangles |
| 1,000 HUD updates with unchanged state | 3,000 DOM writes | 0 DOM writes | Only write changed values |
| All 49 runtime images | 49,180,632 bytes | 1,504,616 bytes | WebP; sprites limited to 512px, opening art to 1600px |

Flash meshes and materials are also reused after expiration, capped at 20 active
effects. Particle transforms and colors remain independent; the pool still caps
sparks at 120. Walls, safe-zone rules, enemy counts, shot damage and fire rates
are preserved.

Navigation caches depend on the fixed arena obstacle layout. If an editor or
destructible walls are introduced, rebuild the navigation graph when it changes.

## Reproduce

```sh
node scripts/benchmark-navigation.js
node scripts/benchmark-hud.js
# With the development server running, and Playwright available:
node scripts/benchmark-render.cjs
npm test
npm run test:browser
npm run build
```

`PLAYWRIGHT_PACKAGE` can point to an existing Playwright package and `GAME_URL`
can select a different local server. Image generation is reproducible using
`node scripts/optimize-assets.cjs` with Sharp installed or `SHARP_PACKAGE` set.
Original PNGs remain available, including the downloadable promotional artwork.

Regression coverage checks shared particle rendering and colors, effect resource
reuse, cached routes against obstacle intersections, and HUD changes. Browser
checks cover desktop play, escort navigation, touch controls, multi-touch, tablet
viewports and rotation.
