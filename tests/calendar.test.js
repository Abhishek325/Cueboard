import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as cal from '../src/lib/calendar.js';
const now=Date.parse('2025-01-10T12:00:00Z');
test('scheduled dates use publishAt; drafts and future public uploads are excluded',()=>{
 const v={id:'demoVideo01',privacyStatus:'private',publishedAt:'2025-01-01T10:00:00Z',publishAt:'2025-01-12T10:00:00Z'};assert.equal(cal.calendarEntry(v,now).calendarAt,v.publishAt);assert.equal(cal.calendarEntry({...v,publishAt:''},now),null);assert.equal(cal.calendarEntry({...v,privacyStatus:'public',publishedAt:v.publishAt},now),null);assert.equal(cal.calendarEntry(v,now+10*86400000).calendarStatus,'scheduled');
});
test('same-day posted and scheduled videos are retained without duplicates',()=>{
 const p={id:'demoVideo01',privacyStatus:'public',publishedAt:'2025-01-09T10:00:00Z'},s={id:'demoVideo02',privacyStatus:'private',publishAt:'2025-01-09T11:00:00Z'};assert.deepEqual(cal.groupVideos([p,p,s],'UTC',now)['2025-01-09'].map(v=>v.calendarStatus),['posted','scheduled']);
});
test('viewer timezone and leap-year Monday-aligned month grid',()=>{
 assert.equal(cal.dayKey('2024-03-01T01:00:00Z','America/Los_Angeles'),'2024-02-29');const cells=cal.monthCells(2024,1);assert.equal(cells.length%7,0);assert.equal(cells[3],'2024-02-01');assert.equal(cells.filter(Boolean).length,29);
});
