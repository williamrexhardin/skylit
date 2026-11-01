'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SkylitPhotoVideo=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 function create(doc){
  const seen=new WeakMap(),view=doc.defaultView;
  function visible(el){const r=el.getBoundingClientRect(),s=view.getComputedStyle(el);return r.width>0&&r.height>0&&r.left+r.width/2>=0&&r.top+r.height/2>=0&&r.left+r.width/2<view.innerWidth&&r.top+r.height/2<view.innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)!==0;}
  function check(now){
   if(doc.hidden)return {action:'none'};
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
  return {check};
 }
 return {create};
});
