export type TokenUsage={input:number;output:number;total:number;cached:number;reasoning:number};
export type UsageRecord={id:string;at:string;model:string;status:'pending'|'complete'|'failed'|'interrupted';tokens?:TokenUsage};
export function parseUsage(value:unknown):TokenUsage|undefined{
 if(!value||typeof value!=='object')return;
 const u=value as Record<string,any>;
 const valid=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
 if(!valid(u.prompt_tokens)||!valid(u.completion_tokens)||!valid(u.total_tokens))return;
 return {input:u.prompt_tokens,output:u.completion_tokens,total:u.total_tokens,cached:valid(u.prompt_tokens_details?.cached_tokens)?u.prompt_tokens_details.cached_tokens:0,reasoning:valid(u.completion_tokens_details?.reasoning_tokens)?u.completion_tokens_details.reasoning_tokens:0};
}
export function koreaDate(value:string|Date){const d=new Date(value);return Number.isFinite(d.getTime())?new Date(d.getTime()+9*3600000).toISOString().slice(0,10):'';}
export function usageSummary(records:UsageRecord[],period:'today'|'month'|'all',now=new Date()){
 const today=koreaDate(now),month=today.slice(0,7);
 const selected=records.filter(r=>{const day=koreaDate(r.at);return !!day&&(period==='all'||period==='today'&&day===today||period==='month'&&day.slice(0,7)===month);});
 const total={requests:selected.length,measured:0,input:0,output:0,total:0,cached:0,reasoning:0};
 const byModel:Record<string,{requests:number;measured:number;input:number;output:number;total:number}>=Object.create(null);
 for(const r of selected){const m=byModel[r.model]??={requests:0,measured:0,input:0,output:0,total:0};m.requests++;if(r.tokens){total.measured++;m.measured++;for(const key of ['input','output','total','cached','reasoning'] as const)total[key]+=r.tokens[key];m.input+=r.tokens.input;m.output+=r.tokens.output;m.total+=r.tokens.total;}}
 return {...total,unmeasured:total.requests-total.measured,byModel};
}
