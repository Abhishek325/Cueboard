  function dayKey(value,zone){
    var date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    var p=Object.fromEntries(parts.map(function(x){return [x.type,x.value];}));return p.year+'-'+p.month+'-'+p.day;
  }
  function calendarEntry(v,now){
    var scheduled=v.privacyStatus==='private'&&typeof v.publishAt==='string'&&Number.isFinite(Date.parse(v.publishAt));
    if(scheduled)return Object.assign({},v,{calendarStatus:'scheduled',calendarAt:v.publishAt});
    if(v.upcoming||!Number.isFinite(Date.parse(v.publishedAt))||Date.parse(v.publishedAt)>(now==null?Date.now():now))return null;
    // Old cached upload metadata remains explicitly unverified until refreshed.
    if(v.privacyStatus!==undefined&&v.privacyStatus!=='public')return null;
    return Object.assign({},v,{calendarStatus:'posted',calendarAt:v.publishedAt});
  }
  function groupVideos(videos,zone,now){
    var grouped={},seen=new Set();
    (videos||[]).forEach(function(v){
      if(!/^[\w-]{11}$/.test(v.id||'')||seen.has(v.id))return;
      var entry=calendarEntry(v,now);if(!entry)return;
      var key=dayKey(entry.calendarAt,zone);if(!key)return;seen.add(v.id);
      (grouped[key]||(grouped[key]=[])).push(entry);
    });return grouped;
  }
  function monthCells(year,month){
    var first=new Date(Date.UTC(year,month,1)),size=new Date(Date.UTC(year,month+1,0)).getUTCDate(),offset=(first.getUTCDay()+6)%7;
    var prefix=first.toISOString().slice(0,7)+'-';
    return Array.from({length:Math.ceil((offset+size)/7)*7},function(_,n){var day=n-offset+1;return day<1||day>size?null:prefix+String(day).padStart(2,'0');});
  }

export { dayKey, calendarEntry, groupVideos, monthCells };
