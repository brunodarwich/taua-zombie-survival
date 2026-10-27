import { HUD } from '../src/ui/HUD.js';
let writes=0;
const elements=new Map();
globalThis.document={getElementById(id){if(!elements.has(id)) elements.set(id,{getAttribute(){return 'skin';},set textContent(value){writes++;},style:{set transform(value){writes++;},set width(value){writes++;}}});return elements.get(id);}};
const hud=new HUD();const player={hp:100,maxHp:100,tier:1,currentSkinUrl:'skin',score:0,rescuedCount:0,position:{x:0,z:0}};
hud.update(player,1,[],{x:0,z:-39},{inSafeZone:()=>false});writes=0;
for(let i=0;i<1000;i++) hud.update(player,1,[],{x:0,z:-39},{inSafeZone:()=>false});
console.log(JSON.stringify({unchangedHudFrames:1000,domWrites:writes}));
