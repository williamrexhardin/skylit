'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SkylitPhotoSlideshow=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 function step(doc){
  const view=doc.defaultView;
  const nodes=Array.from(doc.querySelectorAll('button,[role=button],[role=menuitem]'));
  const label=e=>(e.getAttribute('aria-label')||e.innerText||'').trim().toLowerCase();
  const laidOut=e=>{const r=e.getBoundingClientRect(),s=view.getComputedStyle(e);return r.width>0&&r.height>0&&r.left+r.width/2>=0&&r.top+r.height/2>=0&&r.left+r.width/2<view.innerWidth&&r.top+r.height/2<view.innerHeight&&s.display!=='none'&&s.visibility!=='hidden';};
  const has=name=>nodes.some(e=>laidOut(e)&&label(e)===name);
  if(has('previous')&&has('next')&&(has('pause')||has('play')))return {action:'active'};
  function actionable(e){if(!laidOut(e)||Number(view.getComputedStyle(e).opacity)===0)return false;const r=e.getBoundingClientRect(),top=doc.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return top===e||e.contains(top);}
  const slide=nodes.find(e=>label(e)==='slideshow'&&actionable(e));
  const menu=nodes.find(e=>/^(more options|more)$/.test(label(e))&&actionable(e));
  const target=slide||menu;if(!target)return {action:'waiting'};
  target.click();return {action:slide?'slideshow-requested':'menu-requested'};
 }
 return {step};
});
