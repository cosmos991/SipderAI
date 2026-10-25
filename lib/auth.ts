import {cookies} from 'next/headers';
import {signature as sign,validToken} from './session-token';
export {equals} from './session-token';
export function signature(value:string){return sign(value,process.env.ASSISTANT_PASSWORD||'unconfigured');}
export async function authorized(){const secret=process.env.ASSISTANT_PASSWORD;if(!secret)return false;return validToken((await cookies()).get('orbit_session')?.value||'',secret);}
