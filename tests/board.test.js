import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as store from '../src/lib/board.js';
import demo from '../src/data/demo.js';
test('samples remove to a valid empty board without mutating input',()=>{
 const before=JSON.stringify(demo),empty=store.removeDemo(demo);
 assert.deepEqual(empty,{schemaVersion:1,themes:[],ideas:[]});assert.equal(store.validate(empty),true);assert.deepEqual(store.normalize(JSON.parse(JSON.stringify(empty))),empty);assert.equal(JSON.stringify(demo),before);
});
test('sample removal preserves user-created content and edited samples',()=>{
 const b=store.normalize(demo);b.ideas[0].isDemo=false;b.ideas[0].title='My real tutorial';b.themes.push({id:'mine',name:'My theme',description:'',color:'#345678',isDemo:false});b.ideas.push({...b.ideas[0],id:'my-idea',theme:'mine',title:'My next video'});
 const n=store.removeDemo(b);assert.deepEqual(n.ideas.map(i=>i.title),['My real tutorial','My next video']);assert.equal(n.themes.length,2);assert.equal(n.themes.some(t=>t.isDemo),false);assert.deepEqual(store.removeDemo(n),n);
});
test('theme deletion removes its ideas atomically and preserves original snapshot',()=>{
 const b=store.normalize(demo),snapshot=structuredClone(b),n=store.deleteTheme(b,b.themes[0].id);assert.equal(n.themes.length,1);assert.equal(n.ideas.length,1);assert.equal(store.validate(n),true);assert.deepEqual(b,snapshot);
});
test('malformed IDs, duplicates, orphan ideas and invalid statuses are rejected',()=>{
 for(const mutate of [b=>delete b.themes[0].id,b=>b.themes.push(b.themes[0]),b=>b.ideas.push(b.ideas[0]),b=>b.ideas[0].theme='absent',b=>b.ideas[0].status='unknown',b=>b.ideas[0].youtubeVideoId='https://example.com',b=>b.ideas[0].title='']){const b=structuredClone(demo);mutate(b);assert.equal(store.validate(b),false);}
});
test('normalization excludes unexpected credentials and invalid CSS color values',()=>{
 const b=structuredClone(demo);b.apiKey='not-a-real-key';b.themes[0].color='red;display:none';b.ideas[0].token='not-a-real-token';const n=store.normalize(b);assert.equal(JSON.stringify(n).includes('not-a-real'),false);assert.equal(n.themes[0].color,'#799588');
});
