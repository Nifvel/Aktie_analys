# Aktie Analys - Tekniska Indikatorer

En ren webbapplikation (ingen server behövs!) för att analysera aktier med tekniska indikatorer och få tydliga köp-, sälj- och neutrala signaler.

## Funktioner

Applikationen visar 6 tekniska indikatorer med enkla och tydliga symboler:

1. **Glidande Medelvärde (MA)** - 200-dagars MA
2. **Exponentiellt Medelvärde (EMA)** - 50-dagars EMA
3. **Relative Strength Index (RSI)** - Identifierar överköpta/översålda nivåer
4. **MACD** - Momentum och trendförändringar
5. **Bollinger Bands** - Volatilitet och extremnivåer
6. **Stochastic Oscillator** - Överköpt/översåld analys

## Användning

1. Öppna `index.html` direkt i din webbläsare (dubbelklicka på filen)

2. Ange en aktiesymbol (t.ex. AAPL, TSLA, VOLV-B.ST) och klicka på "Sök"

3. Alla beräkningar görs direkt i webbläsaren - ingen server behövs!

## Signaltyper

- 🟢 **KÖP** - Positiv signal
- 🔴 **SÄLJ** - Negativ signal  
- 🟡 **NEUTRAL** - Ingen tydlig signal

## Tekniska Detaljer

### Indikatorer och Signalregler

- **MA/EMA**: Köp när priset är över medelvärdet, sälj när priset är under
- **RSI**: Köp när RSI < 30 (översåld), sälj när RSI > 70 (överköpt)
- **MACD**: Köp när MACD är positivt, sälj när MACD är negativt
- **Bollinger Bands**: Köp när priset är nära nedre bandet, sälj när priset är nära övre bandet
- **Stochastic**: Köp när värdet < 20, sälj när värdet > 80

## Data

Applikationen använder Yahoo Finance API för att hämta aktiedata direkt från webbläsaren. Alla tekniska indikatorer beräknas lokalt i JavaScript.

## Filstruktur

```
├── index.html      # Huvudsida
├── style.css       # Styling
├── app.js          # All logik och beräkningar
└── README.md       # Denna fil
```

Inga beroenden eller installationer krävs - bara öppna index.html i din webbläsare!
