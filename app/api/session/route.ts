import { cookies } from 'next/headers';
import { authorized, signature, equals } from '@/lib/auth';
export async function GET(){return Response.json({authenticated:await authorized(), configured:!!process.env.ASSISTANT_PASSWORD, apiConfigured:!!process.env.OPENAI_API_KEY, cloud:!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)});}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin) return new Response('Forbidden',{status:403});
 if(!process.env.ASSISTANT_PASSWORD) return Response.json({error:'서버에 ASSISTANT_PASSWORD를 설정해주세요.'},{status:503});
 const {password}=await req.json();
 // Fixed work per attempt to slow brute force; deploy behind Vercel Firewall rate limiting as documented.
 await new Promise(r=>setTimeout(r,700));
 if(typeof password!=='string'||!equals(password,process.env.ASSISTANT_PASSWORD))return Response.json({error:'비밀번호를 확인해주세요.'},{status:401});
 const expiry=String(Date.now()+7*86400000);
 (await cookies()).set('orbit_session',`${expiry}.${signature(expiry)}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:604800});return Response.json({ok:true});
}
export async function DELETE(){(await cookies()).delete('orbit_session');return Response.json({ok:true});}
