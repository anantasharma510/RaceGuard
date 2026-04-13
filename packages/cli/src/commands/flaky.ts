import { Command } from 'commander';
import axios from 'axios';
import { printSummary, printError } from '../utils/output';

export const flakyCommand = new Command('flaky')
  .description('Detect flakiness in an endpoint by running it repeatedly')
  .argument('<method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)')
  .argument('<url>', 'Endpoint URL to test')
  .option('-t, --times <number>', 'Number of times to run the request', '100')
  .option('-H, --header <json>', 'Static headers as JSON e.g. \'{"Authorization":"Bearer token"}\'')
  .option('--tokens <tokens>', 'Comma-separated JWT tokens to simulate multiple users')
  .action(async (method: string, url: string, options) => {
    const times = parseInt(options.times, 10);
    const headers = options.header ? JSON.parse(options.header) : undefined;
    const userTokens = options.tokens ? options.tokens.split(',').map((t: string) => t.trim()) : undefined;

    console.log(`\nDetecting flakiness: ${method.toUpperCase()} ${url} (${times}x)\n`);

    try {
      const response = await axios.post('http://localhost:7842/api/tests/flaky', {
        method: method.toUpperCase(),
        endpoint: url,
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
