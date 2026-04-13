import { Command } from 'commander';
import axios from 'axios';
import { printSummary, printError } from '../utils/output';

export const idempotencyCommand = new Command('idempotency')
  .description('Test whether an endpoint is idempotent')
  .argument('<method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)')
  .argument('<url>', 'Endpoint URL to test')
  .option('-b, --body <json>', 'Request body as JSON string')
  .option('-t, --times <number>', 'Number of times to send the request', '20')
  .option('-H, --header <json>', 'Static headers as JSON e.g. \'{"Authorization":"Bearer token"}\'')
  .option('--tokens <tokens>', 'Comma-separated JWT tokens to simulate multiple users')
  .action(async (method: string, url: string, options) => {
    const times = parseInt(options.times, 10);
    const body = options.body ? JSON.parse(options.body) : undefined;
    const headers = options.header ? JSON.parse(options.header) : undefined;
    const userTokens = options.tokens ? options.tokens.split(',').map((t: string) => t.trim()) : undefined;

    console.log(`\nTesting idempotency: ${method.toUpperCase()} ${url} (${times}x)\n`);
    if (userTokens) console.log(`Simulating ${userTokens.length} users (round-robin tokens)\n`);

    try {
      const response = await axios.post('http://localhost:7842/api/tests/idempotency', {
        method: method.toUpperCase(),
        endpoint: url,
        body,
        totalRequests: times,
        headers,
        userTokens,
      });

      printSummary(response.data);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        printError('Engine is not running. Start it first with: raceguard start');
      } else {
        printError(err.message);
      }
    }
  });
