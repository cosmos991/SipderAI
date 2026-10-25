import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseUsage,koreaDate,usageSummary} from '../lib/usage.ts';
test('usage preserves provider totals without double counting cached or reasoning',()=>{
 assert.deepEqual(parseUsage({prompt_tokens:100,completion_tokens:30,total_tokens:130,prompt_tokens_details:{cached_tokens:50},completion_tokens_details:{reasoning_tokens:20}}),{input:100,output:30,total:130,cached:50,reasoning:20});
 assert.equal(parseUsage(null),undefined);assert.equal(parseUsage({prompt_tokens:-1,completion_tokens:2,total_tokens:1}),undefined);
});
test('period boundaries use Korea time rather than UTC',()=>{
 assert.equal(koreaDate('2026-10-31T15:00:00Z'),'2026-11-01');
 const records=[{id:'1',at:'2026-10-31T14:59:00Z',model:'a',status:'complete',tokens:{input:10,output:5,total:15,cached:0,reasoning:0}},{id:'2',at:'2026-10-31T15:01:00Z',model:'b',status:'interrupted'}];
 const month=usageSummary(records,'month',new Date('2026-11-01T00:00:00Z'));assert.equal(month.requests,1);assert.equal(month.total,0);assert.equal(month.unmeasured,1);
 const all=usageSummary(records,'all');assert.equal(all.total,15);assert.equal(all.requests,2);assert.equal(all.measured,1);assert.equal(all.byModel.a.total,15);
});
test('model names cannot pollute the aggregation object',()=>{
 const s=usageSummary([{id:'1',at:new Date().toISOString(),model:'__proto__',status:'failed'}],'all');assert.equal(s.byModel['__proto__'].requests,1);
});
