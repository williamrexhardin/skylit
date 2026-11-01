'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKYLIT_PLAYWRIGHT||'playwright');
const origin=process.env.SKYLIT_PREVIEW||'http://127.0.0.1:8767';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.SKYLIT_CHROME?{executablePath:process.env.SKYLIT_CHROME}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.addInitScript(()=>{localStorage.setItem('skylit.dashboard',JSON.stringify({version:1,modules:[{type:'spotify',x:0,y:0,w:6,h:6},{type:'clock',x:6,y:0,w:6,h:6}]}));localStorage.setItem('skylit.setup','done');});
  await page.goto(origin);await page.waitForFunction(()=>window.SkylitApp?.openSettings);
  await page.locator('nav [data-tab=spotify]').click();
  await page.locator('#spotify.active').waitFor();
  await page.locator('#spotify-add-widget').click();
  await page.locator('#settings-dashboard-panel [data-type=spotify]').waitFor();
  await page.evaluate(()=>SkylitApp.openSettings('services'));
  const player=page.locator('#spotify-settings');
  await player.getByText('Spotify controls are available in the Android app.').waitFor();
  await page.evaluate(()=>{
   window.spotifyState={supported:true,installed:false,permission:false,active:false};window.spotifyCommands=[];
   window.Skylit={spotifyStatus:()=>JSON.stringify(window.spotifyState),spotifyCommand(action){window.spotifyCommands.push(action);window.spotifyState.playing=action==='play';return true;},spotifyOpen(){window.spotifyOpened=true;},spotifyPermission(){window.spotifyPermissionOpened=true;}};
  });
  await player.getByText('Install the Spotify Android app on this frame first.').waitFor();
  assert.equal(await player.getByRole('button',{name:'Open Spotify',exact:true}).isDisabled(),true);
  await page.evaluate(()=>window.spotifyState.installed=true);
  await player.getByRole('button',{name:'Enable Spotify controls',exact:true}).click();assert.equal(await page.evaluate(()=>window.spotifyPermissionOpened),true);
  await player.getByText(/broad permission/).waitFor();
  await page.evaluate(()=>Object.assign(window.spotifyState,{permission:true,active:true,playing:true,canPlay:true,canNext:false,canPrevious:true,title:'<img src=x onerror=alert(1)>',artist:'Synthetic artist',art:'https://example.com/private-art.jpg'}));
  await player.getByRole('button',{name:'Pause Spotify',exact:true}).waitFor();assert.equal(await player.locator('img').count(),0);
  assert.equal(await player.locator('strong').textContent(),'<img src=x onerror=alert(1)>');
  assert.equal(await player.getByRole('button',{name:'Next Spotify track',exact:true}).isDisabled(),true);
  await player.getByRole('button',{name:'Pause Spotify',exact:true}).click();
  await player.getByRole('button',{name:'Play Spotify',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>window.spotifyCommands),['pause']);
  await player.getByRole('button',{name:'Open Spotify',exact:true}).click();assert.equal(await page.evaluate(()=>window.spotifyOpened),true);
  await page.evaluate(()=>Object.assign(window.spotifyState,{permission:false}));
  await player.getByRole('button',{name:'Enable Spotify controls',exact:true}).waitFor();assert.equal(await player.locator('.spotify-track').count(),0);assert.equal(await player.getByRole('button',{name:'Play Spotify',exact:true}).isDisabled(),true);
  await page.evaluate(()=>{window.Skylit.spotifyStatus=()=>'{invalid';});
  await player.getByText('Install the Spotify Android app on this frame first.').waitFor();assert.equal(await player.locator('.spotify-track').count(),0);
  await page.evaluate(()=>{window.Skylit.spotifyStatus=()=>JSON.stringify({supported:true,installed:true,permission:true,active:true,playing:false,title:'Synthetic song',artist:'Synthetic artist',canPlay:true,canPrevious:true,canNext:true});SkylitApp.openSettings('device');document.getElementById('settings-close').click();});
  const widget=page.locator('section[data-module=spotify]');await widget.getByText('Synthetic song',{exact:true}).waitFor();
  for(const [width,height]of [[1280,720],[1920,1080],[390,844]]){
   await page.setViewportSize({width,height});await widget.scrollIntoViewIfNeeded();
   const box=await widget.boundingBox();for(const b of await widget.locator('.spotify-controls button').all())assert.ok((await b.boundingBox()).width>=48);
   assert.ok(box.width<=width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(process.env.SKYLIT_SPOTIFY_SCREENSHOTS)await page.screenshot({path:process.env.SKYLIT_SPOTIFY_SCREENSHOTS+'/spotify-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);console.log('PASS Spotify setup, permission denial/revocation, exact commands, disabled actions, escaped metadata, local-only artwork, recovery and three viewport layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
