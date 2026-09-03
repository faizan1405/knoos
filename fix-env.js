const fs = require('fs');
let env = fs.readFileSync('.env', 'utf-8');
const urlLine = env.split('\n').find(l => l.startsWith('DATABASE_URL='));
if (!urlLine) process.exit(1);
const rawUrl = urlLine.replace('DATABASE_URL=', '').trim().replace(/"/g, '');
const match = rawUrl.match(/^mysql:\/\/[^:]+:([^@]+)@([^:]+):(\d+)\/(.+)$/);
if (match) {
  const encoded = encodeURIComponent(match[1]);
  const newUrl = rawUrl.replace(':' + match[1] + '@', ':' + encoded + '@');
  env = env.replace(urlLine, 'DATABASE_URL="' + newUrl + '"');
  fs.writeFileSync('.env', env);
  console.log('Successfully encoded password in .env');
}
