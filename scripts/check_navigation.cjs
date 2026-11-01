'use strict';
const assert=require('node:assert/strict'),{chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const origin=process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767';
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.goto(origin);await page.waitForFunction(()=>window.SkylitApp&&window.Momo);await page.evaluate(()=>SkylitApp.go('overview'));
 for(const[width,height]of[[1280,720],[1920,1080],[390,844]]){
  await page.setViewportSize({width,height});
  if(await page.locator('#nav-toggle').getAttribute('aria-expanded')==='false')await page.locator('#nav-toggle').click();
  const before=await page.locator('main').boundingBox();await page.getByRole('button',{name:'Collapse navigation',exact:true}).click();await page.waitForTimeout(150);
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.momo-home').isVisible(),false);assert.equal(await page.evaluate(()=>Momo.status().paused),true);
  for(const label of ['Overview','Weather','Photos','Calendar','Settings'])assert.equal(await page.locator('#main-nav').getByRole('button',{name:label,exact:true}).isVisible(),true);
  if(width<=600)assert.ok((await page.locator('.rail').boundingBox()).height<=120);
  if(width>600){const rail=await page.locator('.rail').boundingBox();assert.equal(rail.width,72);assert.ok((await page.locator('main').boundingBox()).width>before.width);}
  for(const b of await page.locator('#main-nav button:visible').all()){const r=await b.boundingBox();assert.ok(r.width>=48&&r.height>=48);}
  if(process.env.SKYLIT_NAV_SCREENSHOTS)await page.screenshot({path:process.env.SKYLIT_NAV_SCREENSHOTS+'/navigation-'+width+'.png'});
 }
 await page.reload();await page.waitForFunction(()=>window.Momo);assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>Momo.status().paused),true);
 await page.setViewportSize({width:1280,height:720});
 await page.getByRole('button',{name:'Expand navigation',exact:true}).click();assert.equal(await page.locator('.momo-home').isVisible(),true);assert.equal(await page.evaluate(()=>Momo.status().paused),false);
 assert.deepEqual(errors,[]);console.log('PASS compact/expanded navigation, persistence, labelled touch targets, wider content, hidden/paused Momo and three viewport layouts');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
