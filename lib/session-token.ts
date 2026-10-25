import {createHmac,timingSafeEqual} from 'node:crypto';
export function signature(value:string, secret:string){return createHmac('sha256',secret).update(value).digest('hex');}
export function equals(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function validToken(token:string,secret:string,now=Date.now()){
 const parts=token.split('.');if(parts.length!==2||!secret)return false;
 const [expiry,sig]=parts;return /^\d+$/.test(expiry)&&Number(expiry)>now&&equals(sig,signature(expiry,secret));
}
