const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../web/google-photos-video.js');
function fixture(){
 const rect={left:0,top:0,width:800,height:600,right:800,bottom:600};
 const video={paused:true,ended:false,currentTime:0,readyState:4,currentSrc:'synthetic-video-one',calls:0,getBoundingClientRect:()=>rect,play(){this.calls++;return {catch(){}};}};
 const button={getBoundingClientRect:()=>({left:370,top:270,width:60,height:60}),getAttribute:()=> 'Play video',textContent:'',contains:()=>false};
 const doc={hidden:false,defaultView:{innerWidth:800,innerHeight:600,addEventListener(){},removeEventListener(){},getComputedStyle:()=>({visibility:'visible',display:'block',opacity:'1'})},querySelectorAll:s=>s==='video'?[video]:s==='iframe'?[]:doc.buttons,buttons:[],hit:video,elementFromPoint:()=>doc.hit};
 return {video,button,doc,rect,watch:create(doc)};
}
test('loaded initial video gets one play request then at most two spaced native touch attempts',()=>{
 const f=fixture();assert.equal(f.watch.check(0).action,'none');assert.equal(f.watch.check(1200).action,'requested');assert.equal(f.video.calls,1);
 assert.equal(f.watch.check(2000).action,'none');assert.deepEqual(f.watch.check(5200),{action:'tap',x:.5,y:.5});assert.equal(f.watch.check(6000).action,'none');assert.equal(f.watch.check(9200).action,'tap');assert.equal(f.watch.check(13200).action,'none');
});
test('playing, ended, mid-video-paused, and unloaded media are left alone',()=>{
 for(const patch of [{paused:false},{ended:true},{currentTime:5},{readyState:1},{currentSrc:''}]){const f=fixture();Object.assign(f.video,patch);f.watch.check(0);assert.equal(f.watch.check(5000).action,'none');assert.equal(f.video.calls,0);}
});
test('hidden or offscreen video is not started',()=>{
 for(const change of [f=>f.doc.hidden=true,f=>f.rect.left=-1600,f=>f.rect.top=700]){const f=fixture();change(f);f.watch.check(0);assert.equal(f.watch.check(5000).action,'none');assert.equal(f.video.calls,0);}
});
test('source replacement on the same video creates a fresh bounded initial attempt',()=>{
 const f=fixture();f.watch.check(0);f.watch.check(1200);f.watch.check(5200);f.watch.check(9200);f.video.currentSrc='synthetic-video-two';assert.equal(f.watch.check(10000).action,'none');assert.equal(f.watch.check(11200).action,'requested');assert.equal(f.video.calls,2);
});
test('an unrelated overlay or control is never touched',()=>{
 const f=fixture();f.doc.hit={};f.watch.check(0);f.watch.check(1200);assert.equal(f.watch.check(5200).action,'none');
 f.doc.buttons=[f.button];f.button.getAttribute=()=> 'Pause';assert.equal(f.watch.check(7000).action,'none');
});
test('an exact visible play button inside the video is eligible, not controls outside it',()=>{
 const f=fixture();f.doc.buttons=[f.button];f.doc.hit=f.button;f.watch.check(0);f.watch.check(1200);assert.equal(f.watch.check(5200).action,'tap');
 const g=fixture();g.doc.buttons=[g.button];g.doc.hit=g.button;g.button.getBoundingClientRect=()=>({left:850,top:270,width:60,height:60});g.watch.check(0);g.watch.check(1200);assert.equal(g.watch.check(5200).action,'none');
});
test('recovery stops after a short initial-start window',()=>{const f=fixture();f.watch.check(0);assert.equal(f.watch.check(16000).action,'none');assert.equal(f.video.calls,0);});

function embedded(){
 let now=0,listener;const sent=[],rect={left:0,top:0,width:400,height:600};
 const frame={src:'https://youtube.googleapis.com/embed/synthetic?enablejsapi=1',getBoundingClientRect:()=>rect,contentWindow:{postMessage:(data,origin)=>sent.push({data:JSON.parse(data),origin})}};
 const doc={hidden:false,querySelectorAll:s=>s==='iframe'?[frame]:[],defaultView:{innerWidth:800,innerHeight:600,getComputedStyle:()=>({visibility:'visible',display:'block',opacity:'1'}),addEventListener:(type,fn)=>listener=fn,removeEventListener:(type,fn)=>{assert.equal(fn,listener);listener=null;}}};
 const watch=create(doc,()=>now);
 return {frame,doc,sent,watch,tick:t=>{now=t;return watch.check(t).action;},send:(data,origin='https://youtube.googleapis.com',source=frame.contentWindow)=>listener({origin,source,data}),dispose:()=>watch.dispose()};
}
test('cued Google Photos iframe receives only a bounded idempotent play command',()=>{
 const f=embedded();f.send(JSON.stringify({event:'initialDelivery',info:{playerState:5,currentTime:0}}));
 assert.equal(f.tick(799),'none');assert.equal(f.tick(800),'embedded-play');assert.equal(f.tick(1000),'none');assert.equal(f.tick(4800),'embedded-play');assert.equal(f.tick(8800),'embedded-play');assert.equal(f.tick(12800),'none');
 assert.equal(f.sent.length,3);assert.deepEqual(f.sent[0],{data:{event:'command',func:'playVideo',args:[]},origin:'https://youtube.googleapis.com'});f.dispose();
});
test('messages require the exact player origin, source window and eligible URL',()=>{
 for(const mode of ['origin','source','url','api','path','malformed','large','array']){
  const f=embedded();let data=JSON.stringify({event:'onStateChange',info:5});
  if(mode==='url')f.frame.src='https://youtube.googleapis.com.evil.test/embed/synthetic?enablejsapi=1';
  if(mode==='api')f.frame.src='https://youtube.googleapis.com/embed/synthetic';
  if(mode==='path')f.frame.src='https://youtube.googleapis.com/other?enablejsapi=1';
  if(mode==='malformed')data='{';if(mode==='large')data=' '.repeat(65537);if(mode==='array')data='[]';
  f.send(data,mode==='origin'?'https://photos.google.com':'https://youtube.googleapis.com',mode==='source'?{}:f.frame.contentWindow);
  assert.equal(f.tick(5000),'none',mode);assert.equal(f.sent.length,0);
 }
});
test('playing, ended, buffering and intentionally paused clips are not restarted',()=>{
 for(const states of [[1,2],[0],[3]]){const f=embedded();for(const info of states)f.send({event:'onStateChange',info});assert.equal(f.tick(5000),'none');}
 const f=embedded();f.send({event:'infoDelivery',info:{playerState:2,currentTime:3}});assert.equal(f.tick(5000),'none');
});
test('unknown, hidden and expired players are left alone; a new source gets a fresh start',()=>{
 const f=embedded();assert.equal(f.tick(1000),'none');f.send({event:'onStateChange',info:5});f.doc.hidden=true;assert.equal(f.tick(5000),'none');f.doc.hidden=false;assert.equal(f.tick(21001),'none');
 f.frame.src='https://youtube.googleapis.com/embed/another-synthetic?enablejsapi=1';f.send({event:'onStateChange',info:5});assert.equal(f.tick(21801),'embedded-play');
});
