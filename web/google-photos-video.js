'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SkylitPhotoVideo=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 function create(doc,clock=()=>Date.now()){
  const seen=new WeakMap(),embedded=new WeakMap(),view=doc.defaultView,origin='https://youtube.googleapis.com';
  function player(frame){
   try{const url=new URL(frame.src);return url.origin===origin&&url.pathname.startsWith('/embed/')&&url.searchParams.get('enablejsapi')==='1'&&!url.username&&!url.password;}catch(_){return false;}
  }
  function embeddedState(frame,now){const source=frame.src;let value=embedded.get(frame);if(!value||value.source!==source){value={source,first:now,next:now+800,attempts:0,playerState:null,time:0,played:false};embedded.set(frame,value);}return value;}
  function receive(event){
   if(event.origin!==origin)return;
   const frames=Array.from(doc.querySelectorAll('iframe')).slice(0,32);
   const frame=frames.find(f=>player(f)&&f.contentWindow===event.source);if(!frame)return;
   let data=event.data;try{if(typeof data==='string'){if(data.length>65536)return;data=JSON.parse(data);}}catch(_){return;}
   if(!data||typeof data!=='object'||Array.isArray(data))return;
   const value=embeddedState(frame,clock());let code;
   if((data.event==='infoDelivery'||data.event==='initialDelivery')&&data.info&&typeof data.info==='object'){
    code=data.info.playerState;if(Number.isFinite(data.info.currentTime)&&data.info.currentTime>=0&&data.info.currentTime<=86400)value.time=data.info.currentTime;
   }else if(data.event==='onStateChange')code=data.info;
   if([-1,0,1,2,3,5].includes(code)){value.playerState=code;if(code===1||code===0)value.played=true;}
  }
  view.addEventListener('message',receive);
  function visible(el){const r=el.getBoundingClientRect(),s=view.getComputedStyle(el);return r.width>0&&r.height>0&&r.left+r.width/2>=0&&r.top+r.height/2>=0&&r.left+r.width/2<view.innerWidth&&r.top+r.height/2<view.innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)!==0;}
  function check(now){
   if(doc.hidden)return {action:'none'};
   // Google Photos uses a cross-origin YouTube API player, not a video in this document.
   const frames=Array.from(doc.querySelectorAll('iframe')).filter(f=>player(f)&&visible(f));
   for(const frame of frames){
    const value=embeddedState(frame,now);
    if(value.played||value.time>.25||![5,-1,2].includes(value.playerState)||now<value.next||now-value.first>20000||value.attempts>=3)continue;
    value.attempts++;value.next=now+4000;
    // Preserve Google's own handshake/correlation; play is idempotent and never toggles pause.
    frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}),origin);
    return {action:'embedded-play'};
   }
   const videos=Array.from(doc.querySelectorAll('video')).filter(visible);
   const video=videos.find(v=>v.paused&&!v.ended&&v.currentTime<.25&&v.readyState>=2&&(v.currentSrc||v.src));
   if(!video)return {action:'none'};
   const source=video.currentSrc||video.src;let state=seen.get(video);
   if(!state||state.source!==source){state={source,first:now,next:now+1200,attempts:0};seen.set(video,state);}
   if(now<state.next||state.attempts>=3||now-state.first>15000)return {action:'none'};
   if(state.attempts===0){state.attempts++;state.next=now+4000;try{const play=video.play();if(play&&play.catch)play.catch(()=>{});}catch(_){}return {action:'requested'};}
   const r=video.getBoundingClientRect();
   const play=Array.from(doc.querySelectorAll('button,[role=button]')).find(e=>{if(!visible(e)||!/^(Play|Play video)$/i.test(e.getAttribute('aria-label')||e.textContent.trim()))return false;const b=e.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2,top=doc.elementFromPoint(x,y);return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom&&(top===e||e.contains(top));});
   const target=play||video,b=target.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2,top=doc.elementFromPoint(x,y);
   if(!play&&top!==video)return {action:'none'};
   if(x<0||y<0||x>=view.innerWidth||y>=view.innerHeight)return {action:'none'};
   state.attempts++;state.next=now+4000;
   return {action:'tap',x:x/view.innerWidth,y:y/view.innerHeight};
  }
  return {check,dispose(){view.removeEventListener('message',receive);}};
 }
 return {create};
});
