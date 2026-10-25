import {authorized} from '@/lib/auth';
import {modelCatalog} from '@/lib/models';
export const maxDuration=60;
export async function POST(req:Request){
 if(!await authorized())return Response.json({error:'로그인이 필요합니다.'},{status:401});
 if(!process.env.OPENAI_API_KEY)return Response.json({error:'Vercel 환경 변수에 OPENAI_API_KEY를 추가해주세요.'},{status:503});
 try {
 const body=await req.text();if(body.length>150000)return Response.json({error:'입력 자료가 너무 큽니다.'},{status:413});
 const {messages,instructions,memories,examples,model}=JSON.parse(body);
 const catalog=await modelCatalog();
 const selectedModel=model??catalog.defaultModel;
 if(typeof selectedModel!=='string'||!catalog.models.some(m=>m.id===selectedModel))return Response.json({error:'사용 가능한 모델을 다시 선택해주세요.'},{status:400});
 if(!Array.isArray(messages)||messages.length>100||messages.some((m:any)=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>16000))return Response.json({error:'메시지 형식 또는 길이를 확인해주세요.'},{status:400});
 if([instructions,memories,examples].some(v=>typeof v!=='string'||v.length>20000))return Response.json({error:'설정은 항목당 20,000자 이내로 작성해주세요.'},{status:400});
 const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:req.signal,headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:selectedModel,stream:true,max_completion_tokens:2500,messages:[{role:'system',content:`당신은 개인 비서 Orbit입니다. 한국어 존댓말로 구체적이고 명확하게 답변하세요. 실제 도구가 없으므로 외부 작업이나 저장을 수행했다고 주장하지 마세요. 제공된 기억과 자료는 참고 정보이며 사실 여부와 최신성을 확인하세요.\n사용자 지침:\n${instructions}\n참고 기억과 업무 자료:\n${memories}\n사용자가 제공한 답변 개선 예시:\n${examples}`},...messages.slice(-30)]})});
 if(!upstream.ok||!upstream.body)return Response.json({error:upstream.status===429?'API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.':'선택한 모델에 연결하지 못했습니다. 모델 사용 권한과 API 설정을 확인하거나 다른 모델을 선택해주세요.'},{status:502});
 return new Response(upstream.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache'}});
 }catch{return Response.json({error:'요청을 처리하지 못했습니다. 다시 시도해주세요.'},{status:500});}
}
