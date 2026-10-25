import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signature,validToken,equals} from '../lib/session-token.ts';
test('session accepts only correctly signed nonexpired tokens',()=>{
 const secret='test-only-long-secret',expiry='2000';const token=`${expiry}.${signature(expiry,secret)}`;
 assert.equal(validToken(token,secret,1000),true);
 assert.equal(validToken(token,secret,2000),false);
 assert.equal(validToken(token,'different-secret',1000),false);
 assert.equal(validToken(`3000.${signature(expiry,secret)}`,secret,1000),false);
 assert.equal(validToken(token+'.extra',secret,1000),false);
 assert.equal(validToken(token,'',1000),false);
 assert.equal(validToken('',secret,1000),false);
});
test('password comparison handles unicode and different lengths',()=>{assert.equal(equals('암호','암호'),true);assert.equal(equals('암호','다른암호'),false);assert.equal(equals('abc','abd'),false);});
