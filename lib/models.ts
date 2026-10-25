export type ModelOption={id:string;name:string};
// Keep general text/chat model aliases; exclude audio, images, search, Codex,
// Responses-only pro models and dated snapshots from automatic discovery.
export function chatModelIds(data:unknown):string[]{
 if(!Array.isArray(data))return [];
 return [...new Set(data.map(m=>typeof m==='object'&&m!==null&&'id' in m?String(m.id):'').filter(id=>/^gpt-(?:\d+(?:\.\d+)?|4o)(?:-mini|-nano)?$/.test(id)))].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
}
export function configuredModels(value:string|undefined,defaultModel:string){return [...new Set([defaultModel,...(value||'').split(',').map(s=>s.trim()).filter(Boolean)])];}
let cached:{key:string;until:number;value:{models:ModelOption[];warning?:string}}|undefined;
export async function modelCatalog(){
 const fallback=process.env.OPENAI_MODEL||'gpt-4.1-mini';
 const explicit=process.env.OPENAI_MODELS;
 const ids=configuredModels(explicit,fallback);
 if(explicit)return {models:ids.map(id=>({id,name:id})),defaultModel:fallback};
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey)return {models:ids.map(id=>({id,name:id})),defaultModel:fallback,warning:'API 키를 설정하면 모델 목록을 불러옵니다.'};
 // The secret participates in the in-memory cache key but is never returned.
 const cacheKey=apiKey+'|'+fallback;
 if(cached?.key===cacheKey&&cached.until>Date.now())return {...cached.value,defaultModel:fallback};
 try{
 const r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(8000),cache:'no-store'});
 if(!r.ok)throw Error('Model discovery failed');
 const data=await r.json();const discovered=chatModelIds(data.data);
 if(!discovered.length)throw Error('No chat models');
 const models=[...new Set([...discovered,fallback])].map(id=>({id,name:id}));
 cached={key:cacheKey,until:Date.now()+300000,value:{models}};
 return {models,defaultModel:fallback};
 }catch{return {models:ids.map(id=>({id,name:id})),defaultModel:fallback,warning:'모델 목록을 불러오지 못해 서버 기본 모델만 표시합니다.'};}
}
