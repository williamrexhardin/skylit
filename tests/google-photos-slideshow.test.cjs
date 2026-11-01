const {test}=require('node:test'),assert=require('node:assert/strict');
const {step}=require('../web/google-photos-slideshow.js');
function fixture(){
 const nodes=[],doc={defaultView:{innerWidth:800,innerHeight:600,getComputedStyle:e=>({visibility:'visible',display:'block',opacity:e.opacity??'1'})},querySelectorAll:()=>nodes,elementFromPoint:()=>doc.hit};
 const add=(label)=>{const e={clicks:0,getAttribute:()=>label,getBoundingClientRect:()=>({left:10,top:10,width:40,height:40}),contains:()=>false,click(){this.clicks++;}};nodes.push(e);return e;};return {doc,add};
}
test('requests a visible menu and Slideshow without claiming success',()=>{const f=fixture(),menu=f.add('More options');f.doc.hit=menu;assert.equal(step(f.doc).action,'menu-requested');assert.equal(menu.clicks,1);const slide=f.add('Slideshow');f.doc.hit=slide;assert.equal(step(f.doc).action,'slideshow-requested');assert.equal(slide.clicks,1);assert.notEqual(step(f.doc).action,'active');});
test('hidden or occluded slideshow entries do not trigger false startup',()=>{const f=fixture(),slide=f.add('Slideshow');f.doc.hit={};assert.equal(step(f.doc).action,'waiting');f.doc.hit=slide;slide.opacity='0';assert.equal(step(f.doc).action,'waiting');});
test('requires the slideshow control triad, including when controls have faded',()=>{const f=fixture();for(const label of ['Previous','Next'])f.add(label);assert.equal(step(f.doc).action,'waiting');f.add('Pause').opacity='0';assert.equal(step(f.doc).action,'active');});
