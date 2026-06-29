const https = require('https');

const opts = {
  hostname: 'eldenring.wiki.fextralife.com',
  path: '/Dagger',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  }
};

const req = https.get(opts, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let data = '';
  res.on('data', chunk => data += chunk.toString('utf-8'));
  res.on('end', () => {
    const match = data.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    if (match) {
      console.log('og:image:', match[1]);
    } else {
      console.log('Response length:', data.length);
      console.log('First 1000 chars:', data.substring(0, 1000));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
