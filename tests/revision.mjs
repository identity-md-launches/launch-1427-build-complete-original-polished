import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Game, dist } from '../src/game.ts';

const { chromium, webkit } = process.env.PEPE_TOOL_ROOT
  ? await import(pathToFileURL(resolve(process.env.PEPE_TOOL_ROOT, 'node_modules/playwright/index.mjs')))
  : await import('playwright');
const baseline = process.argv.includes('--baseline');
const label = baseline ? 'before' : 'after';
const report = { phase: label, started: new Date().toISOString(), browsers: {}, checks: [], observations: {}, errors: [], networkFailures: [], screenshots: [], exportHashes: {} };
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0];
    if (path === '/harness') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!doctype html><title>Revision sandbox test</title><style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0;display:block}</style><iframe sandbox="allow-scripts allow-pointer-lock" src="/preview/"></iframe><script>window.messages=[];addEventListener('message',e=>{if(e.source===document.querySelector('iframe').contentWindow)messages.push(e.data)});window.send=m=>document.querySelector('iframe').contentWindow.postMessage(m,'*');</script>`);
      return;
    }
    if (!path.startsWith('/preview/')) throw Error('path');
    const file = resolve(root, path.slice(9) || 'index.html');
    if (!file.startsWith(root + '/')) throw Error('path');
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}`;
await mkdir('evidence', { recursive: true });
for (const file of ['index.html', ...(await readdir('dist/assets')).filter(f=>/\.(js|css)$/.test(f)).map(f=>'assets/'+f)])
  report.exportHashes[file] = createHash('sha256').update(await readFile(resolve(root, file))).digest('hex');
const check = async (name, run) => {
  try { const detail = await run(); report.checks.push({ name, status: 'pass', detail }); console.log(`PASS ${name}`); }
  catch (e) { report.checks.push({ name, status: 'fail', error: String(e) }); console.log(`FAIL ${name}: ${e.message}`); }
};
const state = p => p.evaluate(() => window.__PEPEFRONT__.snapshot());
const action = (p, name) => p.locator(`[data-action="${name}"]`);
const start = async (p, touch = false) => {
  await p.goto(`${url}/preview/`);
  await p.locator('#difficulty').selectOption('recruit');
  await action(p, 'briefing')[touch ? 'tap' : 'click']();
  await action(p, 'start')[touch ? 'tap' : 'click']();
};
const monitor = p => {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('requestfailed', r => report.networkFailures.push({ url: r.url(), error: r.failure()?.errorText }));
  p.on('response', r => { if (r.status() >= 400) report.networkFailures.push({ url: r.url(), status: r.status() }); });
};
const shot = async (p, name) => {
  if (baseline) return;
  const path = `evidence/revision-${name}.jpg`;
  await p.screenshot({ path, type: 'jpeg', quality: 80 });
  report.screenshots.push(path);
};
const world = (p, x, y) => p.evaluate(({x,y})=>{
  const s=window.__PEPEFRONT__.worldToScreen({x,y}), r=document.querySelector('#battlefield').getBoundingClientRect();
  return {x:r.x+s.x,y:r.y+s.y};
}, {x,y});
const fittedMap = p => p.locator('#minimap').evaluate(c => {
  const r=c.getBoundingClientRect(), s=getComputedStyle(c);
  const width=r.width-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth);
  const height=r.height-parseFloat(s.borderTopWidth)-parseFloat(s.borderBottomWidth);
  const scale=Math.min(width/c.width,height/c.height);
  const w=s.objectFit==='contain'?c.width*scale:width, h=s.objectFit==='contain'?c.height*scale:height;
  return {x:r.x+parseFloat(s.borderLeftWidth)+(width-w)/2,y:r.y+parseFloat(s.borderTopWidth)+(height-h)/2,width:w,height:h, box:{x:r.x,y:r.y,width:r.width,height:r.height}};
});
let browser;
try {
  await check('Engine: queued field preserves the active harvesting cycle', () => {
    const g=new Game({faction:'initiative',mode:'duel',difficulty:'recruit',seed:8127});
    const h=g.entities.find(e=>e.owner===0&&e.kind==='harvester');
    g.issue([h.id], {type:'harvest',target:0,x:210,y:640});
    g.issue([h.id], {type:'harvest',target:1,x:520,y:210}, true);
    for(let i=0;i<600;i++)g.tick(.05);
    const observation={time:g.time,x:h.x,y:h.y,cargo:h.cargo,orders:h.orders,harvestNode:h.harvestNode};
    report.observations.harvesting=observation;
    assert.notEqual(h.orders[0]?.target,0,'The first cycle should be delivered by 30 seconds');
    assert.equal(h.harvestNode,1);
    return observation;
  });
  for (const [name, engine] of Object.entries({chromium,webkit})) {
    browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.PEPE_CHROME?{executablePath:process.env.PEPE_CHROME}:{}),...(name==='webkit'&&process.env.PEPE_WEBKIT?{executablePath:process.env.PEPE_WEBKIT}:{})});
    report.browsers[name]=await browser.version();
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const p=await ctx.newPage(); p.setDefaultTimeout(6000); monitor(p);
    await start(p,true);
    await p.evaluate(()=>{
      window.revisionClicks=[];
      document.addEventListener('click',e=>{
        const b=e.target.closest?.('[data-action]');
        if(b)window.revisionClicks.push({action:b.dataset.action,trusted:e.isTrusted,detail:e.detail,pointerType:e.pointerType,at:performance.now()});
      },true);
    });
    for(const area of ['base','army','radar']) await check(`${name}: one tap opens and a second closes ${area}`,async()=>{
      await action(p,`mobile-${area}`).tap();
      const opened=await p.locator('.command-panel').evaluate(e=>e.classList.contains('mobile-open'));
      if(opened) await action(p,`mobile-${area}`).tap();
      assert.equal(opened,true);
      assert.equal(await p.locator('.command-panel').evaluate(e=>e.classList.contains('mobile-open')),false);
    });
    await check(`${name}: one Order tap issues movement for selected army`,async()=>{
      await action(p,'select-army').tap();
      await action(p,'order').tap();
      const before=await state(p);
      assert.equal(before.commandMode,'order');
      assert.equal(before.selection.length,5);
      const pos=await world(p,580,490); await p.touchscreen.tap(pos.x,pos.y);
      const after=await state(p);
      assert.ok(after.units.filter(e=>after.selection.includes(e.id)).every(e=>e.orders.length>0));
      await action(p,'order').tap();
      assert.equal((await state(p)).commandMode,'select');
    });
    await check(`${name}: touch mute toggles exactly once`,async()=>{
      await action(p,'sound').tap();
      const muted=(await state(p)).audio.muted;
      if(muted) await action(p,'sound').tap();
      assert.equal(muted,true); assert.equal((await state(p)).audio.muted,false);
    });
    report.observations[`${name}Clicks`]=await p.evaluate(()=>window.revisionClicks);
    if(name==='chromium') await check('Chromium: first panel tap after a native canvas drag works',async()=>{
      const cdp=await ctx.newCDPSession(p), before=(await state(p)).camera;
      for(const [type,points] of [['touchStart',[{x:160,y:350}]],['touchMove',[{x:240,y:380}]],['touchEnd',[]]])
        await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
      assert.ok((await state(p)).camera.x<before.x);
      await action(p,'mobile-radar').tap();
      assert.ok(await p.locator('.command-panel').evaluate(e=>e.classList.contains('mobile-open')));
      await action(p,'mobile-radar').tap();
    });
    for(const width of [390,700,320]) await check(`${name}: minimap marker maps to HQ at ${width}px`,async()=>{
      await p.setViewportSize({width,height:844});
      // Reload isolates this test from a preceding toggle failure without changing game state.
      await start(p,true);
      await action(p,'mobile-radar').tap();
      if(!await p.locator('.command-panel').evaluate(e=>e.classList.contains('mobile-open')))throw Error('Minimap blocked by duplicate tap');
      const map=await fittedMap(p);
      const tap={x:map.x+map.width*360/2400,y:map.y+map.height*390/1800};
      await p.touchscreen.tap(tap.x,tap.y);
      const cam=(await state(p)).camera;
      report.observations[`${name}Minimap${width}`]={map,tap,camera:cam};
      await shot(p,`${name}-minimap-${width}`);
      assert.ok(Math.abs(cam.x-360)<10&&Math.abs(cam.y-390)<10,`Expected HQ (360,390), got (${cam.x},${cam.y})`);
      // Both axes: the other side of the map, dragging and the fitted content edges.
      await p.touchscreen.tap(map.x+map.width*.85,map.y+map.height*.8);
      const far=(await state(p)).camera;
      assert.ok(Math.abs(far.x-2040)<10&&Math.abs(far.y-1440)<10);
    });
    for(const width of [390,320]) await check(`${name}: construction clears visible Order state at ${width}px`,async()=>{
      await p.setViewportSize({width,height:844}); await start(p,true);
      await action(p,'select-army').tap(); await action(p,'order').tap();
      assert.equal((await state(p)).commandMode,'order');
      await action(p,'mobile-base').tap(); await p.locator('[data-kind=power]').tap();
      await action(p,'cancel-place').tap();
      const mode=(await state(p)).commandMode,pressed=await action(p,'order').getAttribute('aria-pressed');
      report.observations[`${name}Order${width}`]={mode,pressed};
      await shot(p,`${name}-order-${width}`);
      assert.equal(pressed,String(mode==='order'));
      assert.equal(mode,'select');
      assert.match(await p.locator('#battle-log').textContent(), /Selection mode/);
      await action(p,'order').tap();
      await p.touchscreen.tap(width/2,420);
      const s=await state(p);
      assert.equal(s.selection.length,5);
      assert.ok(s.units.filter(e=>s.selection.includes(e.id)).every(e=>e.orders.length>0));
    });
    await check(`${name}: native mouse and keyboard activation survive touch`,async()=>{
      await start(p,true);
      const order=action(p,'order');
      await order.tap(); assert.equal((await state(p)).commandMode,'order');
      await order.click(); assert.equal((await state(p)).commandMode,'select');
      await order.click(); assert.equal((await state(p)).commandMode,'order');
      await order.focus(); await p.keyboard.press('Space'); assert.equal((await state(p)).commandMode,'select');
      await p.keyboard.press('Enter'); assert.equal((await state(p)).commandMode,'order');
      await action(p,'sound').click(); assert.equal((await state(p)).audio.muted,true);
      await action(p,'sound').focus(); await p.keyboard.press('Enter'); assert.equal((await state(p)).audio.muted,false);
    });
    await ctx.close();
    const desktop=await browser.newPage({viewport:{width:1440,height:900}}); monitor(desktop);
    await check(`${name}: Shift-right-click harvests then advances the queued field`,async()=>{
      // Install before navigation so requestAnimationFrame and performance.now
      // share one clock from startup, including in WebKit's slower cold starts.
      await desktop.clock.install(); await start(desktop);
      const s=await state(desktop),h=s.units.find(e=>e.owner===0&&e.kind==='harvester');
      let pos=await world(desktop,h.x,h.y); await desktop.mouse.click(pos.x,pos.y);
      pos=await world(desktop,210,640); await desktop.mouse.click(pos.x,pos.y,{button:'right'});
      await desktop.keyboard.down('Shift'); pos=await world(desktop,520,210); await desktop.mouse.click(pos.x,pos.y,{button:'right'}); await desktop.keyboard.up('Shift');
      const initial=(await state(desktop)).units.find(e=>e.id===h.id);
      assert.deepEqual(initial.orders.map(o=>o.target),[0,1]);
      await desktop.clock.runFor(8000);
      const active=(await state(desktop)).units.find(e=>e.id===h.id);
      report.observations[`${name}Harvest8s`]={...active,time:(await state(desktop)).time};
      assert.equal(active.orders[0].target,0);
      assert.ok(dist(active,{x:210,y:640})<85,`First field not active: ${active.x},${active.y}`);
      await desktop.clock.runFor(10000);
      const next=(await state(desktop)).units.find(e=>e.id===h.id);
      assert.equal(next.orders[0]?.target,1);
    });
    await desktop.close();
    const host=await browser.newPage({viewport:{width:1440,height:900}}); host.setDefaultTimeout(6000); monitor(host);
    await host.goto(`${url}/harness`);
    const frame=await (await host.locator('iframe').elementHandle()).contentFrame();
    await frame.waitForFunction(()=>window.__PEPEFRONT__);
    const send=type=>host.evaluate(type=>window.send({protocol:'pepe-game/1',channel:'revision-test',type}),type);
    await send('init'); await host.waitForFunction(()=>window.messages.some(m=>m.type==='ready'));
    const deploy=async()=>{await action(frame,'briefing').click();await action(frame,'start').click();};
    await deploy();
    await check(`${name}: arcade pause survives confirmed restart`,async()=>{
      await send('pause'); await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().paused);
      assert.ok(await action(frame,'resume').isDisabled());
      await action(frame,'restart-confirm').click(); await action(frame,'replay').click();
      await host.waitForTimeout(2200);
      const s=await state(frame); report.observations[`${name}RestartPaused`]={paused:s.paused,time:s.time};
      await shot(host,`${name}-host-paused`);
      assert.equal(s.paused,true); assert.equal(s.time,0);
      assert.ok(await action(frame,'resume').isDisabled());
      await host.evaluate(()=>window.send({protocol:'pepe-game/1',channel:'wrong',type:'resume'}));
      await host.waitForTimeout(100); assert.equal((await state(frame)).paused,true);
      await send('resume'); await frame.waitForFunction(()=>!window.__PEPEFRONT__.snapshot().paused);
    });
    await check(`${name}: arcade pause survives lobby and fresh deployment`,async()=>{
      await send('pause'); await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().paused);
      await action(frame,'quit-confirm').click(); await action(frame,'return-lobby').click();
      await deploy(); await host.waitForTimeout(300);
      assert.equal((await state(frame)).paused,true); assert.equal((await state(frame)).time,0);
      await send('resume'); await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().time>0);
    });
    await check(`${name}: a pause received in the lobby applies to the next match`,async()=>{
      await send('resume'); await action(frame,'pause').click(); await action(frame,'quit-confirm').click(); await action(frame,'return-lobby').click();
      await send('pause'); await host.waitForTimeout(100); await deploy();
      assert.equal((await state(frame)).paused,true); assert.equal((await state(frame)).time,0);
      await send('resume'); await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().time>0);
    });
    await check(`${name}: a resume received in the lobby releases the next match`,async()=>{
      await send('pause'); await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().paused);
      await action(frame,'quit-confirm').click(); await action(frame,'return-lobby').click();
      await send('resume'); await host.waitForTimeout(100); await deploy();
      await frame.waitForFunction(()=>window.__PEPEFRONT__.snapshot().time>0);
      assert.equal((await state(frame)).paused,false);
    });
    await host.close(); await browser.close(); browser=null;
  }
  await check('No page errors or failed runtime resources',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.networkFailures,[]);});
} finally {
  await browser?.close(); await new Promise(r=>server.close(r));
  report.finished=new Date().toISOString();
  report.passed=report.checks.filter(c=>c.status==='pass').length;
  report.failed=report.checks.filter(c=>c.status==='fail').length;
  await writeFile(`evidence/revision-${label}.json`,JSON.stringify(report,null,2)+'\n');
}
console.log(`${report.passed} passed, ${report.failed} failed`);
if(report.failed) process.exitCode=1;
