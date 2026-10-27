const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/');
    const result = await page.evaluate(async () => {
      const main = document.querySelector('script[type=module][src*="src/main.js"]').src;
      const game = (await import(main)).inspectGame();
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { ParticleSystem } = await import('/src/systems/ParticleSystem.js');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 8, 12);
      camera.lookAt(0, 0, 0);
      const particles = new ParticleSystem(scene);
      particles.spawnBurst(new THREE.Vector3(), 0xffaa00, 120);
      particles.update(0.01);
      particles.syncInstances();
      game.renderer.render(scene, camera);
      return { particles: particles.activeParticles.length,
        calls: game.renderer.info.render.calls, triangles: game.renderer.info.render.triangles };
    });
    assert.equal(result.particles, 120);
    assert.equal(result.calls, 1);
    assert.equal(result.triangles, 2880);
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
