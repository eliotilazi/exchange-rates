# Kurs: live exchange rates in React

A small dashboard for live exchange rates, made for people who invoice or buy abroad from Switzerland: a converter, a chart for any currency pair and a watchlist with daily and monthly changes.

**Live demo:** https://eliotilazi.github.io/exchange-rates/

## Features

- **Live data** from the European Central Bank (reference rates published every working day) through the free [Frankfurter API](https://frankfurter.dev)
- **Converter** for 30 currencies, with a swap button and amounts typed the Swiss way (`1'250.50`) or the European way (`1250,50`)
- **Chart** for the selected pair over 1 month, 3 months, 1 year or 5 years, with the value at the pointer, the change, the lowest and highest rates and the average
- **Watchlist**: today's rate, change over 1 day and 30 days, a small trend line, and currencies you can add or remove
- **Base currency** of your choice (CHF by default); your choices are remembered in the browser
- Loading placeholders, error messages with a retry button, requests cancelled when you change your choice, and answers kept in a cache
- Works on mobile, light and dark mode

## How it is built

| File | Role |
| --- | --- |
| `src/api.js` | Calls to the API, with a cache |
| `src/useApi.js` | A React hook for loading, errors, retry and cancelling requests (`AbortController`) |
| `src/lib.js` | Pure functions: cross rates, conversion, statistics, number parsing and formatting |
| `src/Chart.jsx` | The line chart and the small trend lines, drawn in SVG without a chart library |
| `src/App.jsx` | The page |
| `test.mjs` | 24 tests for the calculations |

React 18 and Vite, no other library. Every push runs the tests, builds the site and publishes it with GitHub Actions.

## Run it locally

```bash
npm install
npm run dev     # development server
npm test        # run the tests
```

Reference rates are for information only: banks apply their own rates. Built by [Eliot Ilazi](https://eliotilazi.github.io).
