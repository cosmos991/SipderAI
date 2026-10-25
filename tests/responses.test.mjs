import {test} from 'node:test';
import assert from 'node:assert/strict';
import {responseEvent,responsesStream} from '../lib/responses-stream.ts';
import {modelName,usesResponses} from '../lib/models.ts';
test('named model families use Responses and readable names',()=>{assert.equal(modelName('gpt-6.1-sol'),'GPT-6.1 Sol');assert.equal(usesResponses('gpt-6-astra'),true);assert.equal(usesResponses('gpt-6-luna'),true);assert.equal(usesResponses('gpt-4.1-mini'),false);});
test('Responses usage is normalized including cache and reasoning subsets',()=>{const events=responseEvent({type:'response.completed',response:{usage:{input_tokens:100,output_tokens:30,total_tokens:130,input_tokens_details:{cached_tokens:50},output_tokens_details:{reasoning_tokens:20}}}});assert.equal(events[0].usage.total_tokens,130);assert.equal(events[0].usage.completion_tokens_details.reasoning_tokens,20);});
test('split UTF8 stream preserves content and final usage without final newline',async()=>{
 const data='event: response.output_text.delta\ndata: '+JSON.stringify({type:'response.output_text.delta',delta:'안녕하세요'})+'\n\ndata: '+JSON.stringify({type:'response.completed',response:{usage:{input_tokens:1,output_tokens:2,total_tokens:3}}});const bytes=new TextEncoder().encode(data);
 const source=new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}});
 const text=await new Response(responsesStream(source)).text();assert.ok(text.includes('안녕하세요'));assert.ok(text.includes('"total_tokens":3'));assert.ok(text.endsWith('data: [DONE]\n\n'));assert.ok(!text.includes('Stream interrupted'));
});
test('truncated streams and incomplete responses are visible failures',async()=>{
 const source=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: {"type":"response.created"}\n\n'));c.close();}});assert.ok((await new Response(responsesStream(source)).text()).includes('Stream interrupted'));
 const events=responseEvent({type:'response.incomplete',response:{usage:{input_tokens:1,output_tokens:2,total_tokens:3}}});assert.ok(events[0].usage);assert.ok(events[1].error);
});
