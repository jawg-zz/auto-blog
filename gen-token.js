const jwt = require('jsonwebtoken');
const fs = require('fs');
const [id, secret] = '69da01b49faec00001ccd39e:a20882fcdfa0f50e9556dc35220dc2d167ce0c2d022f2696960e5591a059d638'.split(':');
const decodedSecret = Buffer.from(secret, 'hex');
const token = jwt.sign(
  { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, aud: '/admin/' },
  decodedSecret,
  { algorithm: 'HS256', header: { kid: id, alg: 'HS256' } }
);
fs.writeFileSync('/tmp/ghost-token.txt', token);
console.log('Token saved:', token.substring(0, 30) + '...');
