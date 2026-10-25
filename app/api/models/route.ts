import {authorized} from '@/lib/auth';
import {modelCatalog} from '@/lib/models';
export async function GET(){
 if(!await authorized())return Response.json({error:'로그인이 필요합니다.'},{status:401});
 return Response.json(await modelCatalog(),{headers:{'Cache-Control':'private, no-store'}});
}
