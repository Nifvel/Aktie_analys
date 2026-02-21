// Technical indicator calculation functions

// Calculate Simple Moving Average
function calculateSMA(data, period) {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

// Calculate Exponential Moving Average
function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }
  
  return ema;
}

// Calculate RSI
function calculateRSI(prices, period = 14) {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Add initial RSI
  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate RSI for remaining periods
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

// Calculate MACD
function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Align EMAs - slow EMA starts later, so we need to match indices
  const macdLine = [];
  const offset = slowPeriod - fastPeriod;
  
  // Start from where both EMAs have values
  for (let i = 0; i < slowEMA.length; i++) {
    if (i + offset < fastEMA.length) {
      macdLine.push(fastEMA[i + offset] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram (MACD line - Signal line)
  const histogram = [];
  const signalOffset = signalPeriod - 1;
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }
  
  return {
    macdLine: macdLine.slice(signalOffset),
    signalLine: signalLine,
    histogram: histogram
  };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  const bands = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDeviation = Math.sqrt(variance);
    
    bands.push({
      upper: mean + (stdDev * stdDeviation),
      middle: mean,
      lower: mean - (stdDev * stdDeviation)
    });
  }
  
  return bands;
}

// Calculate Stochastic Oscillator
function calculateStochastic(highs, lows, closes, period = 14) {
  const stoch = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    
    if (highestHigh === lowestLow) {
      stoch.push(50); // Neutral if no range
    } else {
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      stoch.push(k);
    }
  }
  
  return stoch;
}

// Get signal for indicator
function getSignal(value, indicator, currentPrice, ma50, ma200, bollingerBands) {
  switch(indicator) {
    case 'MA':
      if (currentPrice > ma200) return 'buy';
      if (currentPrice < ma200) return 'sell';
      return 'neutral';
      
    case 'EMA':
      if (currentPrice > ma50) return 'buy';
      if (currentPrice < ma50) return 'sell';
      return 'neutral';
      
    case 'RSI':
      if (value > 70) return 'sell';
      if (value < 30) return 'buy';
      return 'neutral';
      
    case 'MACD':
      // value is the histogram (positive = buy, negative = sell)
      if (value > 0) return 'buy';
      if (value < 0) return 'sell';
      return 'neutral';
      
    case 'Bollinger':
      if (!bollingerBands) return 'neutral';
      const { upper, lower } = bollingerBands;
      const position = (currentPrice - lower) / (upper - lower);
      if (position < 0.2) return 'buy'; // Near lower band
      if (position > 0.8) return 'sell'; // Near upper band
      return 'neutral';
      
    case 'Stochastic':
      if (value > 80) return 'sell';
      if (value < 20) return 'buy';
      return 'neutral';
      
    default:
      return 'neutral';
  }
}

// Fetch stock data from Yahoo Finance
async function fetchYahooFinanceData(symbol) {
  // Use CORS proxy to bypass CORS restrictions
  const corsProxy = 'https://api.allorigins.win/raw?url=';
  const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/';
  
  // Get quote data
  const quoteUrl = `${corsProxy}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`)}`;
  
  // Get historical data (200 days)
  const period1 = Math.floor(Date.now() / 1000) - (200 * 24 * 60 * 60);
  const period2 = Math.floor(Date.now() / 1000);
  const historicalUrl = `${corsProxy}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}`)}`;
  
  try {
    // Fetch both quote and historical data
    const [quoteResponse, historicalResponse] = await Promise.all([
      fetch(quoteUrl),
      fetch(historicalUrl)
    ]);
    
    if (!quoteResponse.ok || !historicalResponse.ok) {
      throw new Error('Kunde inte hämta data från Yahoo Finance');
    }
    
    const quoteData = await quoteResponse.json();
    const historicalData = await historicalResponse.json();
    
    // Extract data from Yahoo Finance response
    const quoteResult = quoteData.chart?.result?.[0];
    const historicalResult = historicalData.chart?.result?.[0];
    
    if (!quoteResult || !historicalResult) {
      throw new Error('Ingen data hittades för denna symbol');
    }
    
    const meta = quoteResult.meta || historicalResult.meta;
    const timestamps = historicalResult.timestamp || [];
    const closes = historicalResult.indicators?.quote?.[0]?.close || [];
    const highs = historicalResult.indicators?.quote?.[0]?.high || [];
    const lows = historicalResult.indicators?.quote?.[0]?.low || [];
    
    // Filter out null values and align arrays
    const validData = [];
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] !== null && highs[i] !== null && lows[i] !== null) {
        validData.push({
          close: closes[i],
          high: highs[i],
          low: lows[i],
          timestamp: timestamps[i]
        });
      }
    }
    
    if (validData.length < 200) {
      throw new Error('Otillräckligt med historisk data. Behöver minst 200 dagar.');
    }
    
    // Extract price arrays (oldest to newest)
    const priceCloses = validData.map(d => d.close);
    const priceHighs = validData.map(d => d.high);
    const priceLows = validData.map(d => d.low);
    const currentPrice = priceCloses[priceCloses.length - 1];
    
    // Calculate indicators
    const ma50 = calculateSMA(priceCloses, 50);
    const ma200 = calculateSMA(priceCloses, 200);
    const ema50 = calculateEMA(priceCloses, 50);
    const rsi = calculateRSI(priceCloses, 14);
    const macd = calculateMACD(priceCloses);
    const bollinger = calculateBollingerBands(priceCloses, 20, 2);
    const stochastic = calculateStochastic(priceHighs, priceLows, priceCloses, 14);
    
    // Get current values
    const currentMA50 = ma50.length > 0 ? ma50[ma50.length - 1] : null;
    const currentMA200 = ma200.length > 0 ? ma200[ma200.length - 1] : null;
    const currentEMA50 = ema50.length > 0 ? ema50[ema50.length - 1] : null;
    const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1] : null;
    const currentMACDHist = macd.histogram.length > 0 ? macd.histogram[macd.histogram.length - 1] : null;
    const currentBollinger = bollinger.length > 0 ? bollinger[bollinger.length - 1] : null;
    const currentStochastic = stochastic.length > 0 ? stochastic[stochastic.length - 1] : null;
    
    // Get signals
    const signals = {
      MA: getSignal(null, 'MA', currentPrice, currentMA50, currentMA200, null),
      EMA: getSignal(null, 'EMA', currentPrice, currentMA50, currentMA200, null),
      RSI: getSignal(currentRSI, 'RSI', currentPrice, null, null, null),
      MACD: getSignal(currentMACDHist, 'MACD', currentPrice, null, null, null),
      Bollinger: getSignal(null, 'Bollinger', currentPrice, null, null, currentBollinger),
      Stochastic: getSignal(currentStochastic, 'Stochastic', currentPrice, null, null, null)
    };
    
    return {
      symbol: symbol,
      name: meta.longName || meta.shortName || symbol,
      currentPrice: currentPrice,
      currency: meta.currency || 'USD',
      indicators: {
        MA: {
          value: currentMA200,
          signal: signals.MA,
          label: '200-dagars MA'
        },
        EMA: {
          value: currentEMA50,
          signal: signals.EMA,
          label: '50-dagars EMA'
        },
        RSI: {
          value: Math.round(currentRSI * 10) / 10,
          signal: signals.RSI,
          label: 'RSI (14)'
        },
        MACD: {
          value: Math.round(currentMACDHist * 100) / 100,
          signal: signals.MACD,
          label: 'MACD'
        },
        Bollinger: {
          value: {
            upper: Math.round(currentBollinger.upper * 100) / 100,
            middle: Math.round(currentBollinger.middle * 100) / 100,
            lower: Math.round(currentBollinger.lower * 100) / 100
          },
          signal: signals.Bollinger,
          label: 'Bollinger Bands'
        },
        Stochastic: {
          value: Math.round(currentStochastic * 10) / 10,
          signal: signals.Stochastic,
          label: 'Stochastic (14)'
        }
      }
    };
    
  } catch (error) {
    throw new Error('Fel vid hämtning av data: ' + error.message);
  }
}

// DOM elements
const stockSymbolInput = document.getElementById('stockSymbol');
const searchBtn = document.getElementById('searchBtn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const stockNameEl = document.getElementById('stockName');
const currentPriceEl = document.getElementById('currentPrice');

// Signal icons mapping
const signalIcons = {
    buy: '🟢',
    sell: '🔴',
    neutral: '🟡'
};

// Fetch stock data
async function fetchStockData(symbol) {
    try {
        showLoading();
        hideError();
        hideResults();
        
        const data = await fetchYahooFinanceData(symbol);
        displayResults(data);
        
    } catch (error) {
        showError(error.message);
        hideResults();
    } finally {
        hideLoading();
    }
}

// Display results
function displayResults(data) {
    // Update header
    stockNameEl.textContent = `${data.name} (${data.symbol})`;
    const currency = data.currency || 'SEK';
    currentPriceEl.textContent = `${data.currentPrice.toFixed(2)} ${currency}`;
    
    // Update each indicator
    Object.keys(data.indicators).forEach(key => {
        const indicator = data.indicators[key];
        const signalEl = document.getElementById(`signal-${key}`);
        const valueEl = document.getElementById(`value-${key}`);
        
        // Set signal icon
        signalEl.textContent = signalIcons[indicator.signal];
        signalEl.className = `signal-icon ${indicator.signal}`;
        
        // Set value
        if (key === 'Bollinger') {
            valueEl.innerHTML = `
                <div>Övre: ${indicator.value.upper.toFixed(2)}</div>
                <div>Mellan: ${indicator.value.middle.toFixed(2)}</div>
                <div>Nedre: ${indicator.value.lower.toFixed(2)}</div>
            `;
        } else {
            valueEl.textContent = indicator.value;
        }
    });
    
    // Calculate summary
    const signals = Object.values(data.indicators).map(i => i.signal);
    const buyCount = signals.filter(s => s === 'buy').length;
    const sellCount = signals.filter(s => s === 'sell').length;
    const neutralCount = signals.filter(s => s === 'neutral').length;
    
    document.getElementById('buyCount').textContent = buyCount;
    document.getElementById('sellCount').textContent = sellCount;
    document.getElementById('neutralCount').textContent = neutralCount;
    
    showResults();
}

// UI helpers
function showLoading() {
    loadingDiv.classList.remove('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
}

function showError(message) {
    errorDiv.textContent = `Fel: ${message}`;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function showResults() {
    resultsDiv.classList.remove('hidden');
}

function hideResults() {
    resultsDiv.classList.add('hidden');
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const symbol = stockSymbolInput.value.trim().toUpperCase();
    if (symbol) {
        fetchStockData(symbol);
    } else {
        showError('Vänligen ange en aktiesymbol');
    }
});

stockSymbolInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Popular stock buttons
document.querySelectorAll('.stock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const symbol = btn.getAttribute('data-symbol');
        stockSymbolInput.value = symbol;
        fetchStockData(symbol);
    });
});
