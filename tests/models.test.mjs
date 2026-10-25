import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chatModelIds,configuredModels,modelCatalog} from '../lib/models.ts';
test('discovery excludes specialized models, snapshots and duplicates',()=>{
 assert.deepEqual(chatModelIds([{id:'gpt-5-mini'},{id:'gpt-4.1'},{id:'gpt-4o'},{id:'gpt-5-mini'},{id:'gpt-5-pro'},{id:'gpt-5-codex'},{id:'gpt-audio'},{id:'gpt-4.1-2025-04-14'},null]),['gpt-5-mini','gpt-4o','gpt-4.1']);
 assert.deepEqual(chatModelIds(null),[]);
});
test('configured allowlist always includes default and removes duplicates',()=>{
 assert.deepEqual(configuredModels(' gpt-5-mini,custom-chat, ,gpt-5-mini','gpt-5-mini'),['gpt-5-mini','custom-chat']);
});
test('explicit model list avoids remote discovery',async()=>{
 const original={...process.env};process.env.OPENAI_MODEL='test-default';process.env.OPENAI_MODELS='test-other';
 try{const result=await modelCatalog();assert.equal(result.defaultModel,'test-default');assert.deepEqual(result.models.map(m=>m.id),['test-default','test-other']);}finally{for(const key of ['OPENAI_MODEL','OPENAI_MODELS']){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}}
});
test('discovery uses server credentials and caches model results',async()=>{
 const original={...process.env},realFetch=globalThis.fetch;let calls=0;
 delete process.env.OPENAI_MODELS;process.env.OPENAI_API_KEY='test-key-discovery';process.env.OPENAI_MODEL='gpt-5-mini';
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/models');assert.equal(options.headers.Authorization,'Bearer test-key-discovery');return Response.json({data:[{id:'gpt-5-mini'},{id:'gpt-4.1'},{id:'gpt-audio'}]});};
 try{const first=await modelCatalog(),second=await modelCatalog();assert.equal(calls,1);assert.deepEqual(first,second);assert.deepEqual(first.models.map(m=>m.id),['gpt-5-mini','gpt-4.1']);assert.equal(JSON.stringify(first).includes('test-key-discovery'),false);}finally{globalThis.fetch=realFetch;for(const key of ['OPENAI_MODEL','OPENAI_MODELS','OPENAI_API_KEY']){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}}
});
test('failed discovery returns an explicit warning and only the default model',async()=>{
 const original={...process.env},realFetch=globalThis.fetch;
 delete process.env.OPENAI_MODELS;process.env.OPENAI_API_KEY='test-key-failed';process.env.OPENAI_MODEL='gpt-5-mini';globalThis.fetch=async()=>new Response(null,{status:401});
 try{const result=await modelCatalog();assert.deepEqual(result.models,[{id:'gpt-5-mini',name:'gpt-5-mini'}]);assert.ok(result.warning);}finally{globalThis.fetch=realFetch;for(const key of ['OPENAI_MODEL','OPENAI_MODELS','OPENAI_API_KEY']){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}}
});
test('Astra, Sol, Luna and Terra aliases are discoverable',()=>{
 const ids=chatModelIds(['gpt-6-astra','gpt-6.1-sol','gpt-6-sol','gpt-6-luna','gpt-5.6-sol','gpt-5.6-terra'].map(id=>({id})));
 assert.equal(ids.length,6);assert.ok(ids.includes('gpt-6-astra'));assert.ok(ids.includes('gpt-6.1-sol'));
});
