// Normalize Responses events to the existing UI stream protocol, including usage.
export function responseEvent(event:Record<string,any>):Record<string,unknown>[] {
 if(event.type==='response.output_text.delta')return [{choices:[{delta:{content:event.delta||''}}]}];
 if(event.type==='response.refusal.delta')return [{choices:[{delta:{content:event.delta||''}}]}];
 if(['response.completed','response.incomplete','response.failed'].includes(event.type)){
 const result:Record<string,unknown>[]=[];const u=event.response?.usage;
 if(u)result.push({choices:[],usage:{prompt_tokens:u.input_tokens,completion_tokens:u.output_tokens,total_tokens:u.total_tokens,prompt_tokens_details:{cached_tokens:u.input_tokens_details?.cached_tokens||0},completion_tokens_details:{reasoning_tokens:u.output_tokens_details?.reasoning_tokens||0}}});
 if(event.type!=='response.completed')result.push({error:{message:'Response did not complete'}});
 return result;
 }
 if(event.type==='error')return [{error:{message:'Response stream error'}}];
 return [];
}
export function responsesStream(body:ReadableStream<Uint8Array>){
 const decoder=new TextDecoder(),encoder=new TextEncoder();let buffer='',terminal=false;
 return body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({
 transform(chunk,controller){buffer+=decoder.decode(chunk,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()||'';for(const line of lines)processLine(line,controller);},
 flush(controller){buffer+=decoder.decode();if(buffer)processLine(buffer,controller);if(!terminal)controller.enqueue(encoder.encode('data: {"error":{"message":"Stream interrupted"}}\n\n'));controller.enqueue(encoder.encode('data: [DONE]\n\n'));}
 }));
 function processLine(line:string,controller:TransformStreamDefaultController<Uint8Array>){
 if(!line.startsWith('data:'))return;const payload=line.slice(5).trim();if(!payload||payload==='[DONE]')return;
 let event;try{event=JSON.parse(payload);}catch{return;}
 if(['response.completed','response.incomplete','response.failed','error'].includes(event.type))terminal=true;
 for(const value of responseEvent(event))controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
 }
}
