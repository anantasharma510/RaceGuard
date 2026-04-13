# RaceGuard

**A CLI tool for testing API concurrency correctness.**

[![npm](https://img.shields.io/npm/v/raceguard-cli)](https://www.npmjs.com/package/raceguard-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/source-GitHub-181717?logo=github)](https://github.com/anantasharma510/RaceGuard)

---

## DISCLAIMER — READ BEFORE USING

> **THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.**
>
> By downloading, installing, or using this software, you agree to the following:
>
> 1. **Use at your own risk.** The author makes no guarantees about the correctness, reliability, security, or fitness of this software for any purpose.
>
> 2. **No liability.** The author shall not be held liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use this software, including but not limited to data loss, data corruption, system downtime, financial loss, or any other harm.
>
> 3. **Authorized use only.** You must only use this tool against systems, APIs, and services that you own or have explicit written permission to test. Using this tool against systems without authorization may violate computer fraud laws, terms of service agreements, and other applicable laws in your jurisdiction. The author accepts no responsibility for unauthorized use.
>
> 4. **No professional warranty.** This software was built as a personal learning project by an individual developer. It has not been professionally audited, security-reviewed, or tested for production use. It may contain bugs, vulnerabilities, or incorrect behavior.
>
> 5. **Development environments only.** This tool is intended for use in local development and testing environments only. Do not use it against production systems containing real user data.
>
> See the full [MIT License](./LICENSE) for complete terms.

---

## What Is RaceGuard?

RaceGuard detects race conditions and concurrency bugs in HTTP APIs by firing multiple simultaneous requests and checking whether your data invariants hold.

Your API passes all your tests because tests run one request at a time. In production, 50 users hit the same endpoint simultaneously. Two users buy the last item in stock at the same moment. Both read `quantity = 1`, both write `quantity = 0`. Final result: `quantity = -1`. Data corrupted.

**Standard tools like Postman cannot catch this. RaceGuard can.**

---

## How Is This Different From Postman?

| | Postman | RaceGuard |
|---|---|---|
| Sends requests | One at a time | Up to 50 simultaneously |
| Tests | Response format, status codes | Data correctness under concurrent load |
| Catches | Wrong responses | Race conditions, data corruption |
| Requires code changes | No | No |
| Use case | API documentation & manual testing | Concurrency correctness verification |

---

## When To Use

Use when your API:
- Decrements a counter (stock, seats, credits, quota)
- Creates records that should be unique (orders, bookings)
- Transfers money or updates balances
- Uses a read-modify-write pattern

**Do not use** against APIs you do not own, production systems, or as a load testing tool.

---

## Install

```bash
npx raceguard-cli start
```

No installation required. No Docker. No database setup.

---

## Usage

**Start the engine:**
```bash
npx raceguard-cli start
```

**Stop the engine:**
```bash
npx raceguard-cli stop
```

Kills the engine process running on port 7842. Run this when you're done testing.

**Idempotency test:**
```bash
npx raceguard-cli idempotency POST http://localhost:3000/api/orders \
  --body '{"productId":"123"}' \
  --times 20
```

**Invariant test** — create `raceguard.config.js`:
```js
module.exports = {
  endpoint: 'http://localhost:3000/api/products/123/buy',
  method: 'POST',
  body: { quantity: 1 },
  concurrency: 20,
  totalRequests: 50,
  headers: { Authorization: 'Bearer YOUR_TOKEN' },
  invariant: (response) => response.data.quantity >= 0,
};
```
```bash
npx raceguard-cli invariant --config raceguard.config.js
```

**Flaky test:**
```bash
npx raceguard-cli flaky GET http://localhost:3000/api/products --times 100
```

**Multiple users (JWT rotation):**
```js
module.exports = {
  endpoint: 'http://localhost:3000/api/orders',
  method: 'POST',
  concurrency: 10,
  totalRequests: 30,
  userTokens: ['token_user1', 'token_user2', 'token_user3'],
  invariant: (response) => response.status < 500,
};
```

---

## Dashboard

```bash
npx raceguard-cli start --ui
```

Opens `http://localhost:3000` with real-time request timeline, history, and reproducer files.

---

## Known Limitations

- Concurrency capped at **50** by default
- Race conditions are non-deterministic — a passing test does not guarantee absence of race conditions
- Invariant rules execute user-provided JavaScript — do not use with untrusted config files
- SQLite storage is local only
- JWT tokens expire — refresh before running tests
- This software may contain bugs

---

## Roadmap

- Database-level invariants
- Timing attack scanner
- Race condition timeline visualization
- Export as k6 scripts

---

## Contributing

Issues and pull requests welcome. Please open an issue before submitting large changes.

Source: [github.com/anantasharma510/RaceGuard](https://github.com/anantasharma510/RaceGuard)

---

## License

MIT License — see [LICENSE](./LICENSE)

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
