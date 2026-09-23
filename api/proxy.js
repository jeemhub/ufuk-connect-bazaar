export default async function handler(req, res) {
  // Set CORS headers for seamless web access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, token, auth, sign, version, project, i18n'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const targetUrl = decodeURIComponent(String(url));
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'i18n': String(req.headers['i18n'] || 'en_US'),
      'version': String(req.headers['version'] || 'android;2.28.1.1'),
      'project': String(req.headers['project'] || 'IOT'),
      'token': String(req.headers['token'] || ''),
      'Auth': String(req.headers['auth'] || req.headers['Auth'] || ''),
      'sign': String(req.headers['sign'] || ''),
    };

    let body;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      return res.status(response.status).json(json);
    }

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
