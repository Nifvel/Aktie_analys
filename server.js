const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enkel cache: minskar antal anrop till Yahoo (undviker "Too Many Requests")
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minuter
const chartCache = new Map(); // symbol -> { data, expires }

// Helper to fetch JSON from an HTTPS URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AktieAnalys/1.0',
        Accept: 'application/json,text/plain,*/*'
      }
    };

    https
      .get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // Yahoo kan svara med "Too Many Requests" som vanlig text (inte JSON)
          const bodyTrimmed = (data || '').trim();
          const isRateLimited =
            res.statusCode === 429 ||
            bodyTrimmed.startsWith('Too Many') ||
            bodyTrimmed.includes('Too Many Requests');

          if (isRateLimited) {
            console.error('Yahoo rate limit (429 / Too Many Requests)');
            return reject(new Error('TOO_MANY_REQUESTS'));
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(
              `Yahoo svarade med status ${res.statusCode}:`,
              bodyTrimmed.substring(0, 200)
            );
            return reject(
              new Error(`Yahoo Finance svarade med status ${res.statusCode}.`)
            );
          }

          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            console.error('Kunde inte parsa Yahoo-svar som JSON:', err);
            console.error('Rådata (första 300 tecken):', data.substring(0, 300));
            reject(new Error('Ogiltigt JSON-svar från Yahoo Finance.'));
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Serve static files (frontend) from project root
app.use(express.static(__dirname));

// Proxy endpoint to fetch Yahoo Finance chart data server-side
app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  // Returnera cachad data om giltig
  const cached = chartCache.get(symbol);
  if (cached && cached.expires > Date.now()) {
    return res.json(cached.data);
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=1y`;

  try {
    const data = await fetchJson(yahooUrl);

    if (!data || !data.chart) {
      return res
        .status(502)
        .json({ error: 'Ogiltigt svar från Yahoo Finance.' });
    }

    // Spara i cache
    chartCache.set(symbol, {
      data,
      expires: Date.now() + CACHE_TTL_MS
    });

    res.json(data);
  } catch (error) {
    console.error('Fel vid hämtning från Yahoo Finance:', error.message);

    if (error.message === 'TOO_MANY_REQUESTS') {
      return res.status(429).json({
        error:
          'För många anrop till Yahoo Finance. Vänta 1–2 minuter och försök igen.'
      });
    }

    res
      .status(500)
      .json({ error: 'Kunde inte hämta data från Yahoo Finance.' });
  }
});

// Fallback: skicka index.html för root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server kör på http://localhost:${PORT}`);
});

