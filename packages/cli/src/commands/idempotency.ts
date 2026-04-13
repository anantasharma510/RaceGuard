import { Command } from 'commander';
import axios from 'axios';
import { printProgress, printSummary, printError } from '../utils/output';

export const idempotencyCommand = new Command('idempotency')
  .description('Test whether an endpoint is idempotent')
  .argument('<method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)')
  .argument('<url>', 'Endpoint URL to test')
  .option('-b, --body <json>', 'Request body as JSON string')
  .option('-t, --times <number>', 'Number of times to send the request', '20')
  .action(async (method: string, url: string, options) => {
    const times = parseInt(options.times, 10);
    const body = options.body ? JSON.parse(options.body) : undefined;

    console.log(`\nTesting idempotency: ${method.toUpperCase()} ${url} (${times}x)\n`);

    try {
      const response = await axios.post('http://localhost:7842/api/tests/idempotency', {
        method: method.toUpperCase(),
        endpoint: url,
        body,
        totalRequests: times,
      });

      const { data } = response;
      printProgress(data);
      printSummary(data);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        printError('Engine is not running. Start it first with: raceguard start');
      } else {
        printError(err.message);
      }
    }
  });
