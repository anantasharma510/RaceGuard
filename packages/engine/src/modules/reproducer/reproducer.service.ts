import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EventStoreService } from '../event-store/event-store.service';

export interface GenerateReproducerInput {
  testRunId: string;
  endpoint: string;
  method: string;
  body?: any;
  concurrency: number;
  invariantRule?: string;
  violationContext: string;
  framework: 'jest' | 'vitest';
}

@Injectable()
export class ReproducerService {
  private readonly logger = new Logger(ReproducerService.name);

  constructor(private readonly eventStore: EventStoreService) {}

  async generate(input: GenerateReproducerInput): Promise<string> {
    const code = this.buildTestCode(input);

    // Save to DB
    await this.eventStore.createReproducer({
      testRunId: input.testRunId,
      code,
      framework: input.framework,
    });

    // Write to disk in project root
    const outputPath = path.resolve(process.cwd(), 'raceguard.reproduce.test.js');
    fs.writeFileSync(outputPath, code, 'utf-8');
    this.logger.log(`Reproducer written to ${outputPath}`);

    return code;
  }

  private buildTestCode(input: GenerateReproducerInput): string {
    const { endpoint, method, body, concurrency, invariantRule, violationContext, framework } = input;
    const bodyStr = body ? JSON.stringify(body, null, 2) : 'undefined';
    const importLine = framework === 'vitest'
      ? `import { describe, it, expect } from 'vitest';`
      : `const { describe, it, expect } = require('@jest/globals');`;
    const axiosImport = framework === 'vitest'
      ? `import axios from 'axios';`
      : `const axios = require('axios');`;

    return `// RaceGuard - Auto-generated reproducer
// Violation detected: ${violationContext}
// Generated: ${new Date().toISOString()}
// Endpoint: ${method.toUpperCase()} ${endpoint}
// Concurrency: ${concurrency}

${importLine}
${axiosImport}

describe('RaceGuard Race Condition Reproducer', () => {
  it('should reproduce the race condition at ${endpoint}', async () => {
    const CONCURRENCY = ${concurrency};
    const endpoint = '${endpoint}';
    const method = '${method.toLowerCase()}';
    const body = ${bodyStr};

    // Fire ${concurrency} concurrent requests
    const requests = Array.from({ length: CONCURRENCY }, () =>
      axios[method](endpoint, body).catch((err) => err.response || err)
    );

    const responses = await Promise.all(requests);

    // Check all responses succeeded
    const statusCodes = responses.map((r) => r.status || r.response?.status);
    const uniqueStatuses = new Set(statusCodes);
    expect(uniqueStatuses.size).toBe(1); // All should return same status

${invariantRule ? `    // Check invariant: ${invariantRule}
    for (const response of responses) {
      const result = (() => { ${invariantRule} })(response);
      expect(result).not.toBe(false);
    }` : '    // Add your invariant assertions here'}
  });
});
`;
  }
}
