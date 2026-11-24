# BorrowLoop

BorrowLoop is a neighborhood item-lending app built with Polymer 3, Express, and SQLite.
It is a local learning project and does not include user authentication.
The UI uses Polymer's legacy `Polymer({...})` element definition and `attached()` lifecycle callback.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). The development server proxies API requests to Express. SQLite data is stored in `data/borrowloop.sqlite`.

## Production build

```bash
npm run build
npm start
```

Open http://127.0.0.1:3001 after building.

## Features

- Browse items shared by neighbors.
- Add an item listing.
- Submit borrowing requests with a return date.
- Approve requests and mark borrowed items as returned.
