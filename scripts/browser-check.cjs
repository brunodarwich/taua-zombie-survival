const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const assert = require('node:assert/strict');
require('node:fs').mkdirSync('.cache', { recursive: true });
(async () => {
  const browser = await chromium.launch({headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const errors = [], failures = [];
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if(r.status() >= 400) failures.push(r.status()+' '+r.url()); });
    await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 })); await page.goto('http://127.0.0.1:5173/');
    await page.locator('.start-art').evaluate(img => img.decode());
    await page.screenshot({path:'.cache/start-desktop.png'});
    const opening = await page.evaluate(async()=>{const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame(); return {running:g.gameRunning,zombies:g.spawner.zombies.length,timer:g.spawner.zombieSpawnTimer};});
    assert.deepEqual(opening,{running:false,zombies:0,timer:0});
    await page.click('#play-btn'); await page.click('#back-btn'); await page.click('#play-btn');
    await page.locator('.char-card').first().click();
    // Keep the test character alive while software-rendered screenshots and UI checks run.
    await page.evaluate(async()=>{const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();g.player.hp=g.player.maxHp=1e6;g.spawner.zombieInterval=1e6;g.renderer.setPixelRatio(0.65);});
    assert.equal(await page.locator('#mobile-controls').isVisible(), false);
    assert.equal(await page.locator('canvas').count(), 1);
    for(let i=0;i<4;i++) await page.click('#zoom-in');
    const near=await page.evaluate(async()=>{const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();return {zoom:g.zoomTarget,shooting:g.inputState.isMouseDown,bullets:g.bullets.length};});
    assert.deepEqual(near,{zoom:.7,shooting:false,bullets:0});
    for(let i=0;i<9;i++) await page.click('#zoom-out');
    assert.equal(await page.evaluate(async()=>(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().zoomTarget),1.5);
    await page.click('#zoom-reset');
    await page.evaluate(()=>{window.addEventListener('wheel',e=>window.wheelProbe={tag:e.target.tagName,id:e.target.id,delta:e.deltaY});}); await page.mouse.move(600,400); await page.mouse.wheel(0,100); await page.waitForFunction(async()=>(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().zoomTarget>1);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(async()=>(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().zoomTarget), 1.1);
    await page.click('#zoom-reset');
    await page.keyboard.down('KeyW'); await page.waitForTimeout(350); await page.keyboard.up('KeyW');
    assert.ok((await page.evaluate(async()=>(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().player.position.z))<0);
    await page.screenshot({path:'.cache/game-desktop.png'});
    const delivery = await page.evaluate(async()=>{
      const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();
      const s=g.spawner.survivors[0];
      g.player.position.set(0,0,-9);g.mission.update(g.player,g.spawner.survivors);
      const recruit={state:s.state,score:g.player.score,saved:g.player.rescuedCount};
      // Test the escort from behind a wall to the coordinator using real entity updates.
      s.position.set(-24,0,-28);s.path=null;g.player.position.set(0,0,-38);
      for(let i=0;i<1600 && g.spawner.survivors.includes(s);i++){
        s.update(1/60,g.player.position,{x:0,z:-39});g.mission.update(g.player,g.spawner.survivors);
      }
      return {recruit,delivered:s.state,score:g.player.score,saved:g.player.rescuedCount,removed:!g.spawner.survivors.includes(s),position:s.position.toArray()};
    });
    console.log('escort',delivery);
    assert.deepEqual(delivery.recruit,{state:'following',score:0,saved:0});
    assert.equal(delivery.delivered,'delivered');assert.equal(delivery.score,350);assert.equal(delivery.saved,1);assert.equal(delivery.removed,true);
    await page.waitForTimeout(800); await page.screenshot({path:'.cache/refuge-desktop.png'});
    const stress = await page.evaluate(async()=>{
      const g = (await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();
      while (g.spawner.zombies.length < 45) g.spawner.spawnZombie(g.player.position);
      const start = performance.now();
      for (let frame = 0; frame < 120; frame++) {
        for (const z of g.spawner.zombies) z.update(1/60, g.player, [], frame / 60);
      }
      return { count: g.spawner.zombies.length, ms: performance.now() - start, valid: g.spawner.zombies.every(z=>g.navigation.isFree(z.position,true)), calls: g.renderer.info.render.calls };
    });
    assert.equal(stress.count,45); assert.equal(stress.valid,true); assert.ok(stress.calls>0);
    console.log('45 zombies, 120 simulation frames:', stress);
    // Trigger defeat through the actual game loop, then verify restart returns to opening.
    await page.evaluate(async()=>{(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().player.hp=0;});
    await page.locator('#game-over-screen').waitFor({state:'visible'});
    await page.click('#restart-btn');await page.locator('#start-screen').waitFor({state:'visible'});
    await page.close();
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
    mobile.on('response', r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url());});
    await mobile.goto('http://127.0.0.1:5173/');await mobile.locator('.start-art').evaluate(img=>img.decode());
    for (const viewport of [{width:320,height:640},{width:768,height:1024},{width:1024,height:768},{width:390,height:844}]) {
      await mobile.setViewportSize(viewport);
      const play = await mobile.locator('#play-btn').boundingBox();
      assert.ok(play.x>=0 && play.x+play.width<=viewport.width);
    }
    await mobile.screenshot({path:'.cache/start-mobile.png'});
    await mobile.tap('#play-btn'); await mobile.waitForTimeout(400); await mobile.locator('.char-card').first().tap(); await mobile.waitForTimeout(500); await mobile.screenshot({path:'.cache/mobile-after-select.png'});
    await mobile.evaluate(async()=>{const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();g.player.hp=g.player.maxHp=1e6;g.spawner.zombieInterval=1e6;g.renderer.setPixelRatio(0.65);});
    assert.equal(await mobile.locator('#mobile-controls').isVisible(),true);
    await mobile.tap('#zoom-in');
    assert.equal(await mobile.evaluate(async()=>(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame().inputState.isMouseDown),false);
    await mobile.screenshot({path:'.cache/game-mobile.png'});
    await mobile.setViewportSize({width:844,height:390});
    await mobile.tap('#zoom-reset');await mobile.screenshot({path:'.cache/game-landscape.png'});
    const zoomBox = await mobile.locator('#zoom-controls').boundingBox();
    const statsBox = await mobile.locator('.hud-right').boundingBox();
    assert.ok(zoomBox.x + zoomBox.width <= statsBox.x);
    const ratio=await mobile.evaluate(async()=>{const g=(await import(document.querySelector('script[type=module][src*="src/main.js"]').src)).inspectGame();return g.camera.aspect;});
    assert.ok(Math.abs(ratio-844/390)<.01);
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
    console.log('PASS: opening, selection/back, desktop/mobile zoom without firing, mouse wheel, WASD, escort around wall, safe-zone delivery, defeat/restart, rotation. No JS errors or failed requests.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
