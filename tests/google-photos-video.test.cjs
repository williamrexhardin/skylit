const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../web/google-photos-video.js');
function fixture(){
 const rect={left:0,top:0,width:800,height:600,right:800,bottom:600};
 const video={paused:true,ended:false,currentTime:0,readyState:4,currentSrc:'synthetic-video-one',calls:0,getBoundingClientRect:()=>rect,play(){this.calls++;return {catch(){}};}};
 const button={getBoundingClientRect:()=>({left:370,top:270,width:60,height:60}),getAttribute:()=> 'Play video',textContent:'',contains:()=>false};
 const doc={hidden:false,defaultView:{innerWidth:800,innerHeight:600,getComputedStyle:()=>({visibility:'visible',display:'block',opacity:'1'})},querySelectorAll:s=>s==='video'?[video]:doc.buttons,buttons:[],hit:video,elementFromPoint:()=>doc.hit};
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
