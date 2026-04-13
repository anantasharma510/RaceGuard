/**
 * A deliberately broken API server for testing RaceGuard.
 * 
 * It has two intentional bugs:
 * 1. Stock decrement has NO transaction/locking → race condition
 * 2. Order creation has NO idempotency protection → duplicates
 * 
 * Run this in a separate terminal before running the e2e test.
 */
import * as http from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

// In-memory "database"
let stock = 10;
let orders: { id: number; productId: string }[] = [];
let orderIdCounter = 1;

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /stock — returns current stock
  if (req.method === 'GET' && req.url === '/stock') {
    res.writeHead(200);
    res.end(JSON.stringify({ stock }));
    return;
  }

  // POST /buy — decrements stock (BROKEN: no locking)
  if (req.method === 'POST' && req.url === '/buy') {
    // Simulate async DB read delay — this is what causes the race condition
    setTimeout(() => {
      if (stock <= 0) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Out of stock', stock }));
        return;
      }
      // BUG: between reading stock and writing it, another request may have also read it
      stock--;
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, remainingStock: stock }));
    }, Math.random() * 10); // random delay amplifies the race
    return;
  }

  // POST /orders — creates an order (BROKEN: no idempotency)
  if (req.method === 'POST' && req.url === '/orders') {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', () => {
      const data = body ? JSON.parse(body) : {};
      const order = { id: orderIdCounter++, productId: data.productId ?? 'unknown' };
      orders.push(order);
      res.writeHead(201);
      res.end(JSON.stringify({ order, totalOrders: orders.length }));
    });
    return;
  }

  // GET /orders — returns all orders
  if (req.method === 'GET' && req.url === '/orders') {
    res.writeHead(200);
    res.end(JSON.stringify({ orders, count: orders.length }));
    return;
  }

  // POST /reset — resets state for clean tests
  if (req.method === 'POST' && req.url === '/reset') {
    stock = 10;
    orders = [];
    orderIdCounter = 1;
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Reset complete', stock, orders: [] }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(4000, () => {
  console.log('Broken test API running on http://localhost:4000');
  console.log('Endpoints:');
  console.log('  GET  /stock   — current stock level');
  console.log('  POST /buy     — buy one item (BROKEN: race condition)');
  console.log('  POST /orders  — create order (BROKEN: not idempotent)');
  console.log('  GET  /orders  — list all orders');
  console.log('  POST /reset   — reset state');
});
