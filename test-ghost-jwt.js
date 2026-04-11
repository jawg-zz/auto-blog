const jwt = require('jsonwebtoken');
const https = require('https');

const [id, secret] = '69da01b49faec00001ccd39e:a20882fcdfa0f50e9556dc35220dc2d167ce0c2d022f2696960e5591a059d638'.split(':');
const decodedSecret = Buffer.from(secret, 'hex');
const token = jwt.sign(
  { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, aud: '/admin/' },
  decodedSecret,
  { algorithm: 'HS256', header: { kid: id, alg: 'HS256' } }
);

console.log('Generated token:', token.substring(0, 50) + '...');

const postData = JSON.stringify({
  posts: [{
    title: 'Test JWT Auth',
    html: '<p>It works!</p>',
    status: 'draft'
  }]
});

const options = {
  hostname: 'watchman.spidmax.win',
  path: '/ghost/api/admin/posts/',
  method: 'POST',
  headers: {
    'Authorization': `Ghost ${token}`,
    'Content-Type': 'application/json',
    'Accept-Version': 'v6.0',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(postData);
req.end();
