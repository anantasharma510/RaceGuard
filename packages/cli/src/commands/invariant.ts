import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { printProgress, printSummary, printError } from '../utils/output';

export const invariantCommand = new Command('invariant')
  .description('Test an endpoint with a concurrency invariant rule')
  .option('-c, --config <path>', 'Path to raceguard.config.js', 'raceguard.config.js')
  .action(async (options) => {
    const configPath = path.resolve(process.cwd(), options.config);

    if (!fs.existsSync(configPath)) {
      printError(`Config file not found: ${configPath}`);
      printError('Create a raceguard.config.js file with your test configuration.');
      process.exit(1);
    }

    const config = require(configPath);

    console.log(`\nTesting invariant: ${config.method?.toUpperCase()} ${config.endpoint}\n`);

    try {
      const response = await axios.post('http://localhost:7842/api/tests/invariant', {
        method: config.method?.toUpperCase(),
        endpoint: config.endpoint,
        body: config.body,
        concurrency: config.concurrency ?? 10,
        totalRequests: config.totalRequests ?? 50,
        invariantRule: config.invariant?.toString(),
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
