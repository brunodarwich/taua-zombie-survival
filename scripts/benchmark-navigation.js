import { performance } from 'node:perf_hooks';
import { createNavigation } from '../src/world.js';
const nav = createNavigation();
const cells = [...nav.reachable[1].keys()].filter(i => nav.reachable[1][i]);
const samples=[];let total=0;
for(let run=0;run<6;run++){
 const begin=performance.now();
 for(let i=0;i<240;i++) { const path=nav.findPath(nav.point(cells[(i*37)%cells.length]),{x:0,z:-27},true); total+=path.length; }
 const elapsed=performance.now()-begin;if(run) samples.push(elapsed);
}
console.log(JSON.stringify({pathfindingMs:samples,totalWaypoints:total}));
