# RaceGuard — Usage Guide

## Quick Start

```bash
# Start the engine
npx raceguard start

# Start engine + open dashboard
npx raceguard start --ui
```

---

## CLI Commands

### Idempotency Test
Tests whether calling the same endpoint multiple times produces the same result.

```bash
# Basic
npx raceguard idempotency POST http://localhost:3000/api/orders --times 20

# With JWT auth
npx raceguard idempotency POST http://localhost:3000/api/orders \
  --header '{"Authorization":"Bearer <token>"}' \
  --times 20

# With request body
npx raceguard idempotency POST http://localhost:3000/api/orders \
  --header '{"Authorization":"Bearer <token>"}' \
  --body '{"productId":"123","quantity":1}' \
  --times 20
```

### Invariant Test
Tests whether a data rule holds true under concurrent load.

```bash
# Using a config file (recommended)
npx raceguard invariant --config raceguard.config.js
```

**raceguard.config.js:**
```js
module.exports = {
  endpoint: 'http://localhost:3000/api/products/123/buy',
  method: 'POST',
  body: { quantity: 1 },
  concurrency: 20,
  totalRequests: 50,
  headers: {
    Authorization: 'Bearer <token>',
  },
  // Optional: simulate multiple users (round-robin)
  userTokens: [
    'token_user1',
    'token_user2',
    'token_user3',
  ],
  invariant: (response) => response.data.quantity >= 0,
};
```

### Flaky Test
Detects inconsistent responses by running the same request repeatedly.

```bash
# Basic
npx raceguard flaky GET http://localhost:3000/api/products --times 100

# With auth
npx raceguard flaky GET http://localhost:3000/api/products \
  --header '{"Authorization":"Bearer <token>"}' \
  --times 100
```

---

## Multiple User Authentication

RaceGuard supports simulating multiple users by rotating JWT tokens round-robin.

**In config file:**
```js
module.exports = {
  endpoint: 'http://localhost:3000/api/orders',
  method: 'POST',
  concurrency: 10,
  totalRequests: 30,
  userTokens: [
    'eyJhbGci...user1token',
    'eyJhbGci...user2token',
    'eyJhbGci...user3token',
  ],
  invariant: (response) => response.status < 500,
};
```

With 3 tokens and 30 requests:
- Request 1 → User 1's token
- Request 2 → User 2's token
- Request 3 → User 3's token
- Request 4 → User 1's token (repeats)

**In CLI:**
```bash
npx raceguard idempotency POST http://localhost:3000/api/orders \
  --tokens "token1,token2,token3" \
  --times 30
```

**In UI:**
Paste one token per line in the "User Tokens" field.

---

## Dashboard UI

```bash
npx raceguard start --ui
```

Opens `http://localhost:3000` with:
- **New Test** — run tests with real-time timeline
- **History** — browse all past test runs
- **Reproducers** — download generated test files

---

## Invariant Rule Syntax

The invariant function receives the full axios response object:

```js
// Check response body field
invariant: (response) => response.data.quantity >= 0

// Check status code
invariant: (response) => response.status === 200 || response.status === 201

// Check multiple conditions
invariant: (response) => {
  return response.data.balance >= 0 && response.data.status !== 'error';
}

// Check array length
invariant: (response) => response.data.items.length <= 100
```

---

## What Gets Detected

| Test Type | Detects |
|-----------|---------|
| Idempotency | Duplicate records, inconsistent responses |
| Invariant | Race conditions, data corruption, negative balances |
| Flaky | Inconsistent status codes, response body changes, latency spikes |

---

## Reproducer Files

When a violation is detected, RaceGuard automatically generates a test file:

```
raceguard.reproduce.test.js  ← written to your project root
```

Run it with Jest or Vitest to reproduce the exact race condition:

```bash
npx jest raceguard.reproduce.test.js
# or
npx vitest run raceguard.reproduce.test.js
```

---

## Environment Variables

None required. RaceGuard uses SQLite (zero setup) and runs entirely locally.

---

## Ports

| Service | Port |
|---------|------|
| Engine API | 7842 |
| Dashboard UI | 3000 |
| Your API | whatever you configure |
