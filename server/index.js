import express from 'express';
import initSqlJs from 'sql.js';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(serverDirectory, '..');
const dataDirectory = path.join(projectDirectory, 'data');
const databasePath = path.join(dataDirectory, 'borrowloop.sqlite');
const distDirectory = path.join(projectDirectory, 'dist');
const port = Number(process.env.PORT) || 3001;
const app = express();

app.use(express.json({ limit: '16kb' }));

const SQL = await initSqlJs({
  locateFile: (file) =>
    path.join(projectDirectory, 'node_modules', 'sql.js', 'dist', file),
});

await mkdir(dataDirectory, { recursive: true });
let database;
try {
  database = new SQL.Database(await readFile(databasePath));
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
  database = new SQL.Database();
}

database.run(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS borrow_requests (
    id INTEGER PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id),
    borrower_name TEXT NOT NULL,
    return_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'returned')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function queryRows(sql, parameters = []) {
  const statement = database.prepare(sql);
  statement.bind(parameters);
  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }
  statement.free();
  return rows;
}

function queryOne(sql, parameters = []) {
  return queryRows(sql, parameters)[0] ?? null;
}

const requestColumns = queryRows('PRAGMA table_info(borrow_requests)');
if (!requestColumns.some((column) => column.name === 'return_by')) {
  database.run(
    "ALTER TABLE borrow_requests ADD COLUMN return_by TEXT NOT NULL DEFAULT ''",
  );
}

const itemCount = queryOne('SELECT COUNT(*) AS count FROM items').count;
if (itemCount === 0) {
  const sampleItems = [
    [
      'Cordless drill',
      'Tools',
      'A compact drill with charger and a small set of bits.',
      'Maya',
    ],
    [
      'Two-person tent',
      'Outdoors',
      'Lightweight tent for a weekend camping trip.',
      'Jordan',
    ],
    [
      'Pasta maker',
      'Kitchen',
      'Manual pasta roller with cutter attachments.',
      'Sam',
    ],
    [
      'Folding projector screen',
      'Electronics',
      'Portable 80-inch screen for a movie night or presentation.',
      'Avery',
    ],
    [
      'Beginner telescope',
      'Outdoors',
      'Easy-to-use telescope with a tripod and moon guide.',
      'Riley',
    ],
  ];
  for (const item of sampleItems) {
    database.run(
      'INSERT INTO items (name, category, description, owner_name) VALUES (?, ?, ?, ?)',
      item,
    );
  }
}

let saveQueue = Promise.resolve();
function persistDatabase() {
  const snapshot = Buffer.from(database.export());
  saveQueue = saveQueue.then(async () => {
    const temporaryPath = `${databasePath}.tmp`;
    await writeFile(temporaryPath, snapshot);
    await rename(temporaryPath, databasePath);
  });
  return saveQueue;
}

await persistDatabase();

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/items', (_request, response) => {
  const items = queryRows(`
    SELECT
      id,
      name,
      category,
      description,
      owner_name AS ownerName,
      available
    FROM items
    WHERE available = 1
    ORDER BY name
  `);
  response.json(items);
});

app.post('/api/items', async (request, response, next) => {
  const name =
    typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  const category =
    typeof request.body?.category === 'string'
      ? request.body.category.trim()
      : '';
  const description =
    typeof request.body?.description === 'string'
      ? request.body.description.trim()
      : '';
  const ownerName =
    typeof request.body?.ownerName === 'string'
      ? request.body.ownerName.trim()
      : '';
  const categories = [
    'Tools',
    'Outdoors',
    'Kitchen',
    'Electronics',
    'Games',
    'Other',
  ];

  if (name.length < 2 || name.length > 80) {
    return response
      .status(400)
      .json({ error: 'Item name must be between 2 and 80 characters.' });
  }
  if (!categories.includes(category)) {
    return response.status(400).json({ error: 'Choose a valid category.' });
  }
  if (description.length < 2 || description.length > 300) {
    return response
      .status(400)
      .json({ error: 'Description must be between 2 and 300 characters.' });
  }
  if (ownerName.length < 2 || ownerName.length > 60) {
    return response
      .status(400)
      .json({ error: 'Your name must be between 2 and 60 characters.' });
  }

  try {
    database.run(
      'INSERT INTO items (name, category, description, owner_name) VALUES (?, ?, ?, ?)',
      [name, category, description, ownerName],
    );
    const itemId = queryOne('SELECT last_insert_rowid() AS id').id;
    await persistDatabase();
    return response.status(201).json(
      queryOne(
        `SELECT
          id,
          name,
          category,
          description,
          owner_name AS ownerName,
          available
        FROM items
        WHERE id = ?`,
        [itemId],
      ),
    );
  } catch (error) {
    return next(error);
  }
});

app.post('/api/requests', async (request, response, next) => {
  const itemId = Number(request.body?.itemId);
  const borrowerName =
    typeof request.body?.borrowerName === 'string'
      ? request.body.borrowerName.trim()
      : '';
  const returnBy =
    typeof request.body?.returnBy === 'string' ? request.body.returnBy : '';
  const returnDate = new Date(`${returnBy}T00:00:00.000Z`);
  const today = new Date().toISOString().slice(0, 10);

  if (!Number.isSafeInteger(itemId) || itemId < 1) {
    return response.status(400).json({ error: 'Choose a valid item.' });
  }
  if (borrowerName.length < 2 || borrowerName.length > 60) {
    return response
      .status(400)
      .json({ error: 'Your name must be between 2 and 60 characters.' });
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(returnBy) ||
    Number.isNaN(returnDate.getTime()) ||
    returnDate.toISOString().slice(0, 10) !== returnBy ||
    returnBy < today
  ) {
    return response
      .status(400)
      .json({ error: 'Choose a valid return date that is today or later.' });
  }

  const item = queryOne(
    'SELECT id, name FROM items WHERE id = ? AND available = 1',
    [itemId],
  );
  if (!item) {
    return response
      .status(404)
      .json({ error: 'That item is not currently available.' });
  }

  try {
    database.run(
      'INSERT INTO borrow_requests (item_id, borrower_name, return_by) VALUES (?, ?, ?)',
      [itemId, borrowerName, returnBy],
    );
    const requestId = queryOne('SELECT last_insert_rowid() AS id').id;
    await persistDatabase();
    return response.status(201).json({
      id: requestId,
      itemId,
      itemName: item.name,
      borrowerName,
      returnBy,
      status: 'pending',
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/requests', (_request, response) => {
  const requests = queryRows(`
    SELECT
      borrow_requests.id,
      borrow_requests.item_id AS itemId,
      items.name AS itemName,
      borrow_requests.borrower_name AS borrowerName,
      borrow_requests.return_by AS returnBy,
      borrow_requests.status,
      borrow_requests.created_at AS createdAt
    FROM borrow_requests
    JOIN items ON items.id = borrow_requests.item_id
    ORDER BY borrow_requests.id DESC
  `);
  response.json(requests);
});

app.patch('/api/requests/:id', async (request, response, next) => {
  const requestId = Number(request.params.id);
  const nextStatus = request.body?.status;
  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    return response.status(400).json({ error: 'Choose a valid request.' });
  }

  const borrowRequest = queryOne(
    'SELECT id, item_id, status FROM borrow_requests WHERE id = ?',
    [requestId],
  );
  if (!borrowRequest) {
    return response.status(404).json({ error: 'Request not found.' });
  }

  if (
    (borrowRequest.status === 'pending' && nextStatus !== 'approved') ||
    (borrowRequest.status === 'approved' && nextStatus !== 'returned') ||
    borrowRequest.status === 'returned'
  ) {
    return response
      .status(409)
      .json({ error: 'This request cannot move to that status.' });
  }

  if (nextStatus === 'approved') {
    const item = queryOne(
      'SELECT available FROM items WHERE id = ?',
      [borrowRequest.item_id],
    );
    if (!item?.available) {
      return response
        .status(409)
        .json({ error: 'This item is already being borrowed.' });
    }
  }

  try {
    database.run(
      'UPDATE borrow_requests SET status = ? WHERE id = ?',
      [nextStatus, requestId],
    );
    if (nextStatus === 'approved') {
      database.run('UPDATE items SET available = 0 WHERE id = ?', [
        borrowRequest.item_id,
      ]);
    } else {
      database.run('UPDATE items SET available = 1 WHERE id = ?', [
        borrowRequest.item_id,
      ]);
    }
    await persistDatabase();
    return response.json({ id: requestId, status: nextStatus });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.use(express.static(distDirectory));
app.use((request, response, next) => {
  if (request.method === 'GET' && !path.extname(request.path)) {
    return response.sendFile(path.join(distDirectory, 'index.html'), (error) => {
      if (error) {
        next(error);
      }
    });
  }
  return next();
});

app.use((error, _request, response, _next) => {
  console.error('Request failed:', error);
  response.status(500).json({ error: 'The server could not complete the request.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`BorrowLoop API listening at http://127.0.0.1:${port}`);
});
