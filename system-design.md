# RaceGuard — Complete Master Document

---

## What We Are Building

RaceGuard is a CLI tool with an optional Next.js dashboard that proves your API handles concurrent requests correctly. Not just that it responds — but that your data stays valid when multiple users hit the same endpoint at the same time.

The problem it solves: your API passes all your tests because you test it one request at a time. In production, 50 users hit the same endpoint simultaneously. Two users buy the last item in stock at the same moment. Both requests read "quantity = 1", both decrement it, both write "quantity = 0", final result is "quantity = -1". Your data is now corrupted. RaceGuard catches this before it reaches production.

No existing tool does this simply. k6 tests performance. Postman tests single requests. HTTP Toolkit intercepts traffic. RaceGuard tests correctness under concurrency. That gap is the entire reason this tool exists.

---

## Core Concepts You Must Understand Before Writing Code

### Race Condition

A race condition happens when two operations read the same value, independently compute a new value based on what they read, and both write back — so one write overwrites the other. The classic example is stock decrement. Request A reads stock = 1. Request B reads stock = 1. Request A writes stock = 0. Request B writes stock = 0. Neither saw the other's write. If they had run sequentially, stock would correctly be -1 caught by a check. When they race, both succeed and you oversell.

### Idempotency

An operation is idempotent if running it once produces the same result as running it 100 times. POST /orders should create one order even if the client accidentally sends the request three times due to a network retry. If your endpoint is not idempotent and a client retries on timeout, you get duplicate orders, duplicate charges, duplicate records. RaceGuard's idempotency verifier runs the exact same request N times and checks whether the outcome is stable.

### Invariant

An invariant is a rule about your data that must always be true. "Stock quantity must never be negative." "A wallet balance must never go below zero." "A user cannot be in two conflicting states simultaneously." RaceGuard lets you define these rules in code and then hammers your API concurrently while checking after every request whether any invariant was violated.

### Backpressure

When you send requests faster than the server can handle them, you need a mechanism that slows down the sender. This is backpressure. Without it, you spawn 10,000 connections, crash your OS network stack, and get meaningless results. RaceGuard uses an async queue with a fixed concurrency limit. Only N requests are in-flight at any moment. When one finishes, the next starts. This is not brute force — it is controlled concurrency.

### Event Sourcing

Instead of storing only the final result of a test, you store every meaningful thing that happened as an immutable row with a timestamp. A test run starts — that is an event. A request goes out — that is an event. A response comes back — that is an event. An invariant check runs — that is an event. This gives you the full history to build timeline views, reproduce bugs, and understand exactly what happened in what order.

---

## Repository Structure

```
raceguard/
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── idempotency.ts
│   │   │   │   ├── invariant.ts
│   │   │   │   ├── flaky.ts
│   │   │   │   └── start.ts
│   │   │   └── utils/
│   │   │       └── output.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── engine/
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── modules/
│   │   │   │   ├── queue/
│   │   │   │   │   ├── queue.module.ts
│   │   │   │   │   ├── queue.service.ts
│   │   │   │   │   └── queue.types.ts
│   │   │   │   ├── test-runner/
│   │   │   │   │   ├── test-runner.module.ts
│   │   │   │   │   ├── test-runner.service.ts
│   │   │   │   │   └── test-runner.types.ts
│   │   │   │   ├── event-store/
│   │   │   │   │   ├── event-store.module.ts
│   │   │   │   │   ├── event-store.service.ts
│   │   │   │   │   └── event-store.types.ts
│   │   │   │   ├── invariant/
│   │   │   │   │   ├── invariant.module.ts
│   │   │   │   │   ├── invariant.service.ts
│   │   │   │   │   └── invariant.types.ts
│   │   │   │   ├── reproducer/
│   │   │   │   │   ├── reproducer.module.ts
│   │   │   │   │   └── reproducer.service.ts
│   │   │   │   └── gateway/
│   │   │   │       └── results.gateway.ts
│   │   │   └── prisma/
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/
│       ├── app/
│       │   ├── page.tsx
│       │   ├── layout.tsx
│       │   ├── new-test/
│       │   │   └── page.tsx
│       │   ├── history/
│       │   │   └── page.tsx
│       │   └── reproducers/
│       │       └── page.tsx
│       ├── components/
│       │   ├── TestBuilder.tsx
│       │   ├── ResultsTimeline.tsx
│       │   ├── ViolationCard.tsx
│       │   └── StatsRow.tsx
│       ├── lib/
│       │   └── socket.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json          (monorepo root)
├── turbo.json
└── README.md
```

---

## Monorepo Setup

Use Turborepo. It handles running builds across packages in the right order and caches results so you are not rebuilding things that have not changed.

Root package.json should look like this in concept. Name the workspace "raceguard". Set the workspaces field to include all three packages under the packages directory. Scripts at the root level run turbo run build, turbo run dev, turbo run lint. DevDependencies at root include turbo, typescript, and ts-node.

The turbo.json pipeline defines that build depends on the build of its dependencies finishing first. Dev runs in parallel with no cache. Lint has no dependencies.

---

## Technology Decisions and Why

NestJS for the engine because it forces good structure. Modules, dependency injection, decorators — these patterns prevent the spaghetti that happens when you build a tool quickly without structure. The engine is the most complex piece and NestJS keeps it organized.

Prisma for the ORM because its schema file is a single source of truth. You define your tables once in schema.prisma and Prisma generates the TypeScript client, the SQL migrations, and the type definitions. With SQLite as the provider, zero external database setup is required.

SQLite because it is a single file. When a developer runs npx raceguard, there is no "install postgres" step. The database is just a file sitting in the project directory. Simple to reset, simple to inspect, simple to ship.

Commander.js for the CLI because it is the industry standard for Node.js CLIs, it is tiny, and its API is straightforward. You define commands, options, and handlers. No magic.

WebSocket via NestJS Gateway because test runs can take 30 seconds or more. You do not want the UI to poll every second — you want the engine to push events to the UI as they happen. Each request result, each invariant check, each violation gets pushed to the browser in real time.

Next.js for the UI with the App Router because it is what you already know. Three pages, minimal server-side rendering needed, mostly client-side data display.

---

## Database Schema

This is the most important design decision. Think carefully before changing it.

You need four tables.

The first table is TestRun. It represents one full execution of a test. It has an id (cuid), a type field that stores which kind of test was run (idempotency, invariant, flaky, reproducer), the endpoint that was tested as a string, the HTTP method, the request body stored as JSON text, the concurrency number, the total requests number, the invariant rule stored as text if one was provided, a status field (running, completed, failed), timestamps for created and completed, and a summary field stored as JSON text that holds the final aggregated result.

The second table is RequestEvent. It represents one individual HTTP request that was made during a test run. It has an id, the testRunId as a foreign key, the request number (which request out of the total), the request payload as JSON text, the response status code, the response body as JSON text, the latency in milliseconds, a boolean for whether this specific request resulted in a violation, and a timestamp.

The third table is InvariantCheck. It represents one execution of the invariant function after a request completed. It has an id, the testRunId, the requestEventId it belongs to, the rule that was checked as text, the actual value found in the database, a boolean for whether the check passed, and a timestamp.

The fourth table is Reproducer. It represents a saved reproduction test file. It has an id, the testRunId it came from, the generated test code as text, the framework it targets (jest or vitest), and a timestamp.

The relationship chain is: one TestRun has many RequestEvents. Each RequestEvent may have one InvariantCheck. Each TestRun may have one Reproducer.

---

## Module by Module — Logic and Concepts

### QueueModule — The Engine Room

This is the most technically important module. Get this right and everything else is simple.

The QueueService accepts an array of async tasks and a concurrency limit. It never runs more than the limit number of tasks simultaneously. The pattern is called a semaphore or a worker pool.

The concept in plain English: imagine a pool of workers. You have 50 workers and 1000 jobs. You hand a job to each free worker. When a worker finishes, it picks up the next job from the queue. You never have more than 50 jobs running at once. When all 1000 jobs finish, you are done.

In TypeScript terms, the queue holds the pending task functions. The active count tracks how many are currently running. When active is below the limit and the queue is not empty, you dequeue the next task and run it. When it resolves or rejects, you decrement active and check again whether to start another.

The QueueService should also emit progress events. After each task completes, emit an event with the current count of completed, failed, and total requests. The NestJS EventEmitter or a simple callback works here. The ResultsGateway listens to these events and forwards them to the WebSocket connection.

The QueueService must handle errors gracefully. If one request throws an exception — network error, timeout, ECONNREFUSED — that should be caught, recorded as a failed request event, and the queue should continue. One failed request must never crash the entire test run.

There is also a safety layer. If the user requests more than 500 concurrent requests, cap it at 500 and log a warning. If the user requests more than 10,000 total requests, warn them that this is a large run and may take time. Never crash, never refuse, just inform and proceed safely.

### TestRunnerModule — The Brain

The TestRunnerService is the orchestrator. It receives a test configuration, creates a TestRun record in the database, tells the QueueService to execute the requests, checks invariants after each request, detects violations, updates the TestRun status when complete, and hands off to the ReproducerService if a violation was found.

For idempotency tests: create the same request object N times. Run all of them through the queue. After all complete, compare the results. Check whether the status codes are consistent. Check whether the response shapes are consistent. Check whether the number of records created in the database matches what was expected. This last check requires the user to optionally provide a check query — a SQL query that counts records. If they provide one, run it after the batch and compare the count to 1.

For invariant tests: run requests concurrently with the configured concurrency limit. After each request completes, immediately run the invariant function. The invariant function receives a database query helper and returns a boolean. If it returns false, record a violation with the full context. Continue running the rest of the requests — do not stop at the first violation, because you want the full picture.

For flaky tests: run the same request 100 times sequentially with a small delay between each. Record the status code, response body shape, and latency for every run. After all complete, calculate the variance. If status codes are not all the same, that is a flakiness signal. If latency variance is more than 300%, that is a signal. If the response body shape changes between runs, that is a signal. Report all signals in the summary.

### EventStoreModule — The Memory

The EventStoreService wraps Prisma and provides clean methods for saving and reading test data. It should not contain business logic — only database operations.

Methods it needs: createTestRun, updateTestRun, createRequestEvent, createInvariantCheck, createReproducer, getTestRunById, getTestRunHistory, getRequestEventsForRun, getViolationsForRun.

Every method should be async and every database error should be caught and wrapped in a meaningful error message. Never let a database error bubble up as an unhandled Prisma exception.

### InvariantModule — The Judge

The InvariantService receives the invariant rule as a string of JavaScript code and evaluates it. This is the technically interesting part.

The invariant rule is user-provided code like: return product.quantity >= 0. You need to execute this code with a database query helper injected. The approach is to wrap the user's code in an async function, pass in a db object that exposes a query method connected to the target database (not your internal SQLite), and execute it.

There are two modes. In simple mode, you connect to the user's database directly — they provide a connection string and you query it after each request. In declarative mode (V2), you inspect the HTTP response and check conditions against the response body rather than the database directly. For V1, focus on response-based invariants first since they require no database access from RaceGuard's side. Database-level invariants are a V2 feature that require the user to provide a connection string.

### ReproducerModule — The Witness

When a violation is found, the ReproducerService generates a test file. The generated test uses the exact request that caused the violation. It fires the same requests with the same concurrency and asserts the invariant.

The output should be a valid Jest or Vitest test file. The test imports axios, makes the concurrent requests using Promise.all, waits for all to complete, and then runs the assertion. The file should have comments explaining what race condition was found, when it was found, and under what conditions.

The generated file is saved to the Reproducer table in SQLite and also written to disk as raceguard.reproduce.test.js in the project root.

### ResultsGateway — The Broadcaster

This is a NestJS WebSocket gateway. It listens to internal events from the TestRunnerService and forwards them to all connected WebSocket clients.

Events it broadcasts: test-started with the run configuration, request-completed with the result of each individual request, invariant-checked with the result of each invariant evaluation, violation-detected with full violation details, test-completed with the final summary.

The UI subscribes to these events and updates the timeline in real time as the test runs.

---

## CLI Commands — Logic

The CLI is a thin layer. It parses arguments, validates them, constructs a request object, sends it to the NestJS engine via HTTP (the engine exposes a REST API for the CLI to call), and streams the response back to the terminal.

The start command launches the NestJS engine as a child process on port 7842 (your internal port) and optionally launches the Next.js UI on port 7843. It also opens the browser automatically if the --ui flag is passed.

The idempotency command accepts a method, a URL, an optional body via --body, and a --times count defaulting to 20. It calls POST /api/tests/idempotency on the engine and streams results.

The invariant command accepts a --config path pointing to a raceguard.config.js file. It reads the file, extracts the endpoint, method, body, concurrency, and invariant function as a string, and calls POST /api/tests/invariant on the engine.

The flaky command accepts a method and URL and optionally --times defaulting to 100. It calls POST /api/tests/flaky.

The terminal output should be formatted cleanly. Use a running progress indicator showing how many requests have completed. When violations are found, display them in red with full context. At the end, show a summary box with total requests, passed, failed, violations found, and avg latency.

---

## Next.js UI — Three Pages Only

### Page 1: New Test

Left sidebar with a form. URL input, method selector (GET POST PUT PATCH DELETE), test type selector as four clickable cards (Invariant, Idempotency, Flaky, Reproducer), concurrency slider from 2 to 200 defaulting to 50, total requests input, invariant rule textarea, request body textarea, and a Run button.

Right main area shows results in real time via WebSocket. Stats row at the top showing total, passed, violations, avg latency. Timeline showing each request as a bar colored green for pass, red for violation, amber for server error. When a violation is detected, a violation card appears below the timeline showing the exact context. Buttons on the violation card: Save Reproducer, View DB Diff, Copy as k6 script.

### Page 2: History

A list of past test runs with the endpoint, test type, date, total requests, and number of violations. Clicking any run opens the full result detail with the same timeline and violation cards from when the test ran.

### Page 3: Reproducers

A list of saved reproducer files. Each shows the endpoint it was generated from, the violation that triggered it, and the date. A download button for each. A copy-to-clipboard button for each. A button to re-run the reproducer against the current local server.

### WebSocket Connection

Create a socket.ts file in the lib directory that establishes a WebSocket connection to the engine on port 7842. Export a hook called useTestResults that subscribes to events and returns the current test state as React state. The TestBuilder component uses this hook and updates in real time as events arrive.

---

## npm Package Setup

To make the tool installable via npx, the CLI package needs a bin field in its package.json pointing to the compiled entry point. The name should be raceguard (check npm to confirm it is not taken — if it is, use raceguard-cli or @yourusername/raceguard). Set the version to 0.1.0, set main to dist/index.js, set the bin to an object where the raceguard key points to dist/index.js.

The entry point file must have #!/usr/bin/env node as the very first line. This tells the operating system to run it with Node.js.

Before publishing, run npm publish from the CLI package directory after building. When someone runs npx raceguard, npm downloads the latest version and runs it without a global install.

---

## V1 Feature List (Build These, Nothing Else)

Idempotency verifier with terminal output and UI display. Invariant tester with response-based rules (no external DB connection required yet). Flaky endpoint detector with consistency report. Reproducer generator that writes a Jest/Vitest file. WebSocket real-time results in the UI. SQLite event store with full history. Three-page Next.js dashboard. Clean CLI with progress output.

---

## V2 Feature List (After Real Users)

Timing attack scanner — detects response time differences that leak information. Chaos schedule — define a sequence of failures that trigger at specific times during a test run. Database-level invariants — connect RaceGuard to the user's own database via a connection string and query it directly after each request. Race condition timeline visualization — a visual graph showing which requests overlapped in time and which caused the violation. Export results as k6 scripts for sharing with the team. VS Code extension that shows RaceGuard results inline.

---

## Build Order — Week by Week

Week 1: Monorepo setup. Initialize Turborepo. Create the three package directories. Set up TypeScript in each. Install NestJS in the engine package, commander in the CLI package, Next.js in the UI package. Initialize Prisma with SQLite. Write the schema. Run the first migration. Confirm the database file is created. This week is purely infrastructure — no features.

Week 2: Queue engine. Build the QueueService with the concurrency-limited async pool. Write a simple test script that creates 1000 tasks, each waiting a random time between 10 and 100 milliseconds, runs them through the queue with concurrency 50, and verifies all 1000 completed correctly. This is the most important week. Do not rush it.

Week 3: Idempotency verifier end to end. TestRunnerService creates a TestRun, calls QueueService with N identical requests, records each RequestEvent, calculates consistency, updates the TestRun with the summary. Wire up the CLI command to call the engine. Test it against a real NestJS endpoint you write specifically for testing — a simple order creation endpoint with no idempotency protection, and watch RaceGuard correctly flag it as not idempotent.

Week 4: Invariant tester. This is the hardest week. The invariant function needs to run after each request. The violation detection and context capture needs to be precise. The TestRunnerService needs to correctly record which two requests caused the violation. Test it against an endpoint with a deliberately broken stock decrement — one that has no transaction or locking — and confirm RaceGuard catches the race condition.

Week 5: Flaky detector and Reproducer generator. The flaky detector is straightforward data collection and variance analysis. The reproducer generator is template generation — take the violation context and produce a string of valid TypeScript test code. Write the generated file to disk. Save it in the Reproducer table.

Week 6: Next.js UI. Three pages as described. WebSocket hook. Real-time timeline. Violation card with the save reproducer button. Connect it to the engine WebSocket gateway. Run a real test from the UI and watch the bars appear in real time.

Week 7: Polish. Clean up terminal output formatting. Write the README with installation instructions and a GIF. Publish to npm. Create a GitHub repository with a good description, topics (testing, concurrency, race-conditions, api-testing, developer-tools, nestjs), and a license (MIT).

---

## GitHub README Structure

The README is half the product for open source. Structure it exactly like this.

Start with the name and a one-line description. Then a GIF showing RaceGuard catching a race condition. Then a problem statement in three sentences maximum — your API passes all tests, but fails under concurrency, and RaceGuard finds those failures before your users do. Then the quick install block showing npx raceguard. Then three real examples with real output — idempotency, invariant, flaky. Then a How It Works section with a simple diagram described in text. Then a Features section listing V1 features. Then a Roadmap section listing V2 features. Then a Contributing section. Then a License.

The GIF is mandatory. Record your screen while running RaceGuard against a deliberately broken stock endpoint. Show the violation being detected and the reproducer being saved. The GIF should be under 5MB and loop. Upload it to the GitHub repository assets and embed it in the README. This GIF will determine whether a developer stars the repo or closes the tab.

---

## What Makes This CV Gold

When an interviewer asks about this project, you explain it in this order. First, the problem — data corruption under concurrent load that standard testing tools cannot detect. Second, the technical approach — an async queue with backpressure, event sourcing for full history, invariant checking against live state after each concurrent request. Third, the result — catches race conditions, generates reproducible test files, works with any HTTP API with zero code changes. Fourth, what you learned — the difference between concurrency and parallelism, how the Node.js event loop handles I/O-bound work, why event sourcing is more valuable than state for debugging tools, how to design a CLI that is also a UI-driven tool without coupling the two.

Any senior engineer listening to that answer knows you have thought deeply about backend systems, not just learned framework syntax. That is the gap this project fills on your CV. Most junior developers can use NestJS. Very few understand race conditions well enough to build a tool that detects them.

---

## One Final Rule

Build the queue engine in week 2 and do not move to week 3 until it is genuinely solid. Every feature after that builds on it. If the queue drops requests under high concurrency, your idempotency results are wrong. If the queue does not handle errors properly, your flaky detector misattributes failures. If the queue does not emit accurate progress events, your real-time UI shows wrong data. The queue is the foundation. Everything else is a house built on top of it. Build the foundation correctly.