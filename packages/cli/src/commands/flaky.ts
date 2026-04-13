import { Command } from 'commander';
import axios from 'axios';
import { printProgress, printSummary, printError } from '../utils/output';

export const flakyCommand = new Command('flaky')
  .description('Detect flakiness in an endpoint by running it repeatedly')
  .argument('<method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)')
  .argument('<url>', 'Endpoint URL to test')
  .option('-t, --times <number>', 'Number of times to run the request', '100')
  .action(async (method: string, url: string, options) => {
    const times = parseInt(options.times, 10);

    console.log(`\nDetecting flakiness: ${method.toUpperCase()} ${url} (${times}x)\n`);

    try {
      const response = await axios.post('http://localhost:7842/api/tests/flaky', {
        method: method.toUpperCase(),
        endpoint: url,
        totalRequests: times,
      });

      printProgress(response.data);
      printSummary(response.data);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        printError('Engine is not running. Start it first with: raceguard start');
      } else {
        printError(err.message);
      }
    }
  });
