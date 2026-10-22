  var SCOPES=['https://www.googleapis.com/auth/yt-analytics.readonly','https://www.googleapis.com/auth/youtube.readonly'];
  var METRICS=['views','engagedViews','likes','comments','shares','estimatedMinutesWatched','averageViewDuration','averageViewPercentage','subscribersGained'];
  function videoId(value){
    value=String(value||'').trim();if(/^[\w-]{11}$/.test(value))return value;
    try{var u=new URL(value);if(u.protocol!=='https:'&&u.protocol!=='http:')return null;var h=u.hostname.replace(/^www\./,'');
      if(h==='youtu.be')value=u.pathname.split('/')[1];
      else if(['youtube.com','m.youtube.com','studio.youtube.com'].includes(h))value=u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed|video)\/([\w-]{11})(?:\/|$)/)?.[1];
      else return null;
    }catch(e){return null;}return /^[\w-]{11}$/.test(value||'')?value:null;
  }
  function range(days,now){
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now||new Date());
    var p=Object.fromEntries(parts.map(function(x){return [x.type,x.value];}));
    var end=new Date(p.year+'-'+p.month+'-'+p.day+'T00:00:00Z');end.setUTCDate(end.getUTCDate()-1);
    var start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);
    return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
  }
  function report(data){
    if(!data||!Array.isArray(data.columnHeaders)||!Array.isArray(data.rows)||!data.rows.length)return null;
    var out={};data.columnHeaders.forEach(function(h,n){if(METRICS.includes(h.name)){var v=data.rows[0][n];out[h.name]=typeof v==='number'&&Number.isFinite(v)?v:null;}});return out;
  }
  function channelLookup(value){
    value=String(value||'').trim();
    if(/^https?:\/\//i.test(value)){try{var url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname))return null;value=decodeURIComponent(url.pathname.replace(/\/$/,''));if(value.startsWith('/channel/'))value=value.slice(9);else if(value.startsWith('/@'))value=value.slice(1);else return null;}catch(error){return null;}}
    if(/^UC[\w-]{22}$/.test(value))return {id:value};
    if(/^@[^\s/?#]{1,100}$/u.test(value))return {forHandle:value};return null;
  }
  function mapping(idea){return videoId(idea.youtubeVideoId)||'';}
  function fresh(data,now){var age=(now==null?Date.now():now)-Date.parse(data&&data.fetchedAt);return Number.isFinite(age)&&age>=0&&age<30*86400000;}
  function metadata(video,channelId,mode){
    if(!videoId(video.id)||video.snippet?.channelId!==channelId)return null;
    if(mode==='public'&&video.status?.privacyStatus!=='public')return null;
    return {id:video.id,title:String(video.snippet.title||'Untitled video'),publishedAt:video.snippet.publishedAt||'',publishAt:mode==='owner'?video.status?.publishAt||'':'',privacyStatus:video.status?.privacyStatus||'unknown',upcoming:video.snippet.liveBroadcastContent==='upcoming',thumbnail:video.snippet.thumbnails?.medium?.url||video.snippet.thumbnails?.default?.url||''};
  }

export { SCOPES, METRICS, videoId, channelLookup, mapping, range, report, fresh, metadata };
