import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { QueueService } from '../queue/queue.service';
import { EventStoreService } from '../event-store/event-store.service';
import {
  RunIdempotencyConfig,
  RunInvariantConfig,
  RunFlakyConfig,
  TestRunResult,
} from './test-runner.types';

// Safe default concurrency for idempotency tests
const IDEMPOTENCY_CONCURRENCY = 10;

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);

  constructor(
    private readonly queue: QueueService,
    private readonly eventStore: EventStoreService,
  ) {}

  async runIdempotency(config: RunIdempotencyConfig): Promise<TestRunResult> {
    // Cap concurrency — never blast all requests at once
    const concurrency = Math.min(IDEMPOTENCY_CONCURRENCY, config.totalRequests);

    const testRun = await this.eventStore.createTestRun({
      type: 'idempotency',
      endpoint: config.endpoint,
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      concurrency,
      totalRequests: config.totalRequests,
    });

    const tasks = Array.from({ length: config.totalRequests }, (_, i) => ({
      execute: async () => {
        const start = Date.now();
        try {
          const response = await axios({
            method: config.method,
            url: config.endpoint,
            data: config.body,
          });
          const latencyMs = Date.now() - start;
          await this.eventStore.createRequestEvent({
            testRunId: testRun.id,
            requestNumber: i + 1,
            payload: JSON.stringify(config.body),
            statusCode: response.status,
            responseBody: JSON.stringify(response.data),
            latencyMs,
            isViolation: false,
          });
          return {
            status: response.status,
            body: JSON.stringify(response.data),
            latencyMs,
          };
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          const errorMessage = err.message as string;
          await this.eventStore.createRequestEvent({
            testRunId: testRun.id,
            requestNumber: i + 1,
            statusCode: err.response?.status,
            responseBody: errorMessage,
            latencyMs,
            isViolation: false,
          });
          throw err;
        }
      },
    }));

    const { results, errors } = await this.queue.run(tasks, concurrency);

    const validResults = results.filter(Boolean);

    // Check status code consistency
    const statusCodes = new Set(validResults.map((r) => r.status));
    const statusViolation = statusCodes.size > 1;

    // Check response body consistency — real idempotency means same response every time
    const bodies = new Set(validResults.map((r) => r.body));
    const bodyViolation = bodies.size > 1;

    const violations = statusViolation || bodyViolation ? 1 : 0;

    if (statusViolation) {
      this.logger.warn(`Idempotency violation: inconsistent status codes ${[...statusCodes].join(', ')}`);
    }
    if (bodyViolation) {
      this.logger.warn(`Idempotency violation: inconsistent response bodies across ${bodies.size} variants`);
    }

    const avgLatencyMs = Math.round(
      validResults.reduce((sum, r) => sum + r.latencyMs, 0) / (validResults.length || 1),
    );

    const summary = {
      totalRequests: config.totalRequests,
      passed: validResults.length,
      failed: errors.filter(Boolean).length,
      violations,
      avgLatencyMs,
      statusViolation,
      bodyViolation,
    };

    await this.eventStore.updateTestRun(testRun.id, {
      status: 'completed',
      completedAt: new Date(),
      summary: JSON.stringify(summary),
    });

    return { testRunId: testRun.id, status: 'completed', summary };
  }
}
