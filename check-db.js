const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim().replace(/"/g, '');
const match = url.match(/^mysql:\/\/[^:]+:([^@]+)@([^:]+):(\d+)\/(.+)$/);
if (match) {
  const password = match[1];
  console.log('Password length:', password.length);
  console.log('Needs URL encoding?', encodeURIComponent(password) !== password);
  console.log('Host:', match[2]);
  console.log('Port:', match[3]);
  console.log('DB:', match[4]);
} else {
  console.log('No match for URL:', url);
}
