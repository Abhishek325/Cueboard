  var statuses=['planned','progress','done'],formats=['Reel + Short','YouTube tutorial','Reel + tutorial','Carousel'];
  function validText(v,max){return typeof v==='string'&&v.length<=max;}
  function validate(data){
    if(!data||data.schemaVersion!==1||!Array.isArray(data.themes)||!Array.isArray(data.ideas)||data.themes.length>50||data.ideas.length>2000)return false;
    var themes=new Set(),ideas=new Set(),id=/^[\w-]{1,100}$/;
    for(var t of data.themes){if(!t||typeof t.id!=='string'||!id.test(t.id)||themes.has(t.id)||!validText(t.name,120)||!t.name.trim()||!validText(t.description||'',500))return false;themes.add(t.id);}
    for(var i of data.ideas){
      if(!i||typeof i.id!=='string'||!id.test(i.id)||ideas.has(i.id)||!themes.has(i.theme)||!validText(i.title,240)||!i.title.trim()||!statuses.includes(i.status)||!formats.includes(i.format))return false;
      if(!['demo','value','notes'].every(function(k){return validText(i[k]||'',10000);}))return false;
      if(i.youtubeVideoId!=null&&(typeof i.youtubeVideoId!=='string'||(i.youtubeVideoId!==''&&!/^[\w-]{11}$/.test(i.youtubeVideoId))))return false;
      ideas.add(i.id);
    }return true;
  }
  function colors(hex){
    if(!/^#[a-f0-9]{6}$/i.test(hex))hex='#799588';
    function mix(light,amount){return '#'+[1,3,5].map(function(n){var c=parseInt(hex.slice(n,n+2),16);return Math.round(c*(1-amount)+light*amount).toString(16).padStart(2,'0');}).join('');}
    return {color:hex,tint:mix(255,.9),tone:mix(0,.28)};
  }
  function normalize(data){
    if(!validate(data))throw Error('Invalid board backup.');
    return {schemaVersion:1,themes:data.themes.map(function(t){return Object.assign({id:t.id,name:t.name.trim(),shortName:t.name.trim(),description:t.description||'',isDemo:t.isDemo===true},colors(t.color));}),ideas:data.ideas.map(function(i){return {id:i.id,theme:i.theme,title:i.title.trim(),demo:i.demo||'',value:i.value||'',notes:i.notes||'',status:i.status,previousStatus:i.previousStatus==='progress'?'progress':'planned',format:i.format,selected:i.selected===true,youtubeVideoId:i.youtubeVideoId||'',isDemo:i.isDemo===true};})};
  }
  function removeDemo(data){
    var next=normalize(data);next.ideas=next.ideas.filter(function(i){return !i.isDemo;});
    var used=new Set(next.ideas.map(function(i){return i.theme;}));next.themes=next.themes.filter(function(t){return !t.isDemo||used.has(t.id);}).map(function(t){if(used.has(t.id))t.isDemo=false;return t;});return next;
  }
  function deleteTheme(data,id){var next=normalize(data);next.themes=next.themes.filter(function(t){return t.id!==id;});next.ideas=next.ideas.filter(function(i){return i.theme!==id;});return next;}

export { validate, normalize, colors, removeDemo, deleteTheme, statuses, formats };
