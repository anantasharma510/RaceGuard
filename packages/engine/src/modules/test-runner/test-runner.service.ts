import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { QueueService } from '../queue/queue.service';
import { EventStoreService } from '../event-store/event-store.service';
import { ResultsGateway } from '../gateway/results.gateway';
import { ReproducerService } from '../reproducer/reproducer.service';
import {
  RunIdempotencyConfig,
  RunInvariantConfig,
  RunFlakyConfig,
  TestRunResult,
} from './test-runner.types';

const IDEMPOTENCY_CONCURRENCY = 10;

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);

  constructor(
    private readonly queue: QueueService,
    private readonly eventStore: EventStoreService,
    private readonly gateway: ResultsGateway,
    private readonly reproducer: ReproducerService,
  ) {}

  async runIdempotency(config: RunIdempotencyConfig): Promise<TestRunResult> {
    const concurrency = Math.min(IDEMPOTENCY_CONCURRENCY, config.totalRequests);

    const testRun = await this.eventStore.createTestRun({
      type: 'idempotency',
      endpoint: config.endpoint,
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      concurrency,
      totalRequests: config.totalRequests,
    });

    this.gateway.emitTestStarted({
      testRunId: testRun.id,
      type: 'idempotency',
      endpoint: config.endpoint,
      totalRequests: config.totalRequests,
    });

    const tasks = Array.from({ length: config.totalRequests }, (_, i) => ({
      execute: async () => {
        const start = Date.now();
        try {
          const response = await axios({ method: config.method, url: config.endpoint, data: config.body });
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
          this.gateway.emitRequestCompleted({ testRunId: testRun.id, requestNumber: i + 1, statusCode: response.status, latencyMs, isViolation: false });
          return { status: response.status, body: JSON.stringify(response.data), latencyMs };
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          await this.eventStore.createRequestEvent({ testRunId: testRun.id, requestNumber: i + 1, statusCode: err.response?.status, responseBody: err.message as string, latencyMs, isViolation: false });
          this.gateway.emitRequestCompleted({ testRunId: testRun.id, requestNumber: i + 1, statusCode: err.response?.status, latencyMs, isViolation: false });
          throw err;
        }
      },
    }));

    const { results, errors } = await this.queue.run(tasks, concurrency);
    const validResults = results.filter(Boolean);

    const statusCodes = new Set(validResults.map((r) => r.status));
    const bodies = new Set(validResults.map((r) => r.body));
    const statusViolation = statusCodes.size > 1;
    const bodyViolation = bodies.size > 1;
    const violations = statusViolation || bodyViolation ? 1 : 0;
    const avgLatencyMs = Math.round(validResults.reduce((sum, r) => sum + r.latencyMs, 0) / (validResults.length || 1));

    if (violations > 0) {
      const context = statusViolation ? `Inconsistent status codes: ${[...statusCodes].join(', ')}` : `Inconsistent response bodies`;
      this.gateway.emitViolationDetected({ testRunId: testRun.id, requestNumber: 0 });
      await this.reproducer.generate({ testRunId: testRun.id, endpoint: config.endpoint, method: config.method, body: config.body, concurrency, violationContext: context, framework: 'jest' });
    }

    const summary = { totalRequests: config.totalRequests, passed: validResults.length, failed: errors.filter(Boolean).length, violations, avgLatencyMs, statusViolation, bodyViolation };
    await this.eventStore.updateTestRun(testRun.id, { status: 'completed', completedAt: new Date(), summary: JSON.stringify(summary) });
    this.gateway.emitTestCompleted({ testRunId: testRun.id, summary });

    return { testRunId: testRun.id, status: 'completed', summary };
  }

  async runInvariant(config: RunInvariantConfig): Promise<TestRunResult> {
    const testRun = await this.eventStore.createTestRun({
      type: 'invariant',
      endpoint: config.endpoint,
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      concurrency: config.concurrency,
      totalRequests: config.totalRequests,
      invariantRule: config.invariantRule,
    });

    this.gateway.emitTestStarted({ testRunId: testRun.id, type: 'invariant', endpoint: config.endpoint, totalRequests: config.totalRequests });

    let violationCount = 0;

    const tasks = Array.from({ length: config.totalRequests }, (_, i) => ({
      execute: async () => {
        const start = Date.now();
        try {
          const response = await axios({ method: config.method, url: config.endpoint, data: config.body });
          const latencyMs = Date.now() - start;

          let passed = true;
          try {
            const fn = new Function('response', config.invariantRule);
            passed = fn(response) !== false;
          } catch { passed = false; }

          const isViolation = !passed;
          if (isViolation) violationCount++;

          const event = await this.eventStore.createRequestEvent({ testRunId: testRun.id, requestNumber: i + 1, payload: JSON.stringify(config.body), statusCode: response.status, responseBody: JSON.stringify(response.data), latencyMs, isViolation });
          this.gateway.emitRequestCompleted({ testRunId: testRun.id, requestNumber: i + 1, statusCode: response.status, latencyMs, isViolation });

          if (isViolation) {
            await this.eventStore.createInvariantCheck({ testRunId: testRun.id, requestEventId: event.id, rule: config.invariantRule, actualValue: JSON.stringify(response.data), passed: false });
            this.gateway.emitInvariantChecked({ testRunId: testRun.id, requestEventId: event.id, passed: false, rule: config.invariantRule });
            this.gateway.emitViolationDetected({ testRunId: testRun.id, requestNumber: i + 1, rule: config.invariantRule, actualValue: JSON.stringify(response.data) });
          }

          return { status: response.status, latencyMs, isViolation };
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          await this.eventStore.createRequestEvent({ testRunId: testRun.id, requestNumber: i + 1, statusCode: err.response?.status, responseBody: err.message as string, latencyMs, isViolation: false });
          this.gateway.emitRequestCompleted({ testRunId: testRun.id, requestNumber: i + 1, statusCode: err.response?.status, latencyMs, isViolation: false });
          throw err;
        }
      },
    }));

    const { results, errors } = await this.queue.run(tasks, config.concurrency);
    const validResults = results.filter(Boolean);
    const avgLatencyMs = Math.round(validResults.reduce((sum, r) => sum + r.latencyMs, 0) / (validResults.length || 1));

    if (violationCount > 0) {
      await this.reproducer.generate({ testRunId: testRun.id, endpoint: config.endpoint, method: config.method, body: config.body, concurrency: config.concurrency, invariantRule: config.invariantRule, violationContext: `Invariant violated ${violationCount} times`, framework: 'jest' });
    }

    const summary = { totalRequests: config.totalRequests, passed: validResults.filter((r) => !r.isViolation).length, failed: errors.filter(Boolean).length, violations: violationCount, avgLatencyMs };
    await this.eventStore.updateTestRun(testRun.id, { status: 'completed', completedAt: new Date(), summary: JSON.stringify(summary) });
    this.gateway.emitTestCompleted({ testRunId: testRun.id, summary });

    return { testRunId: testRun.id, status: 'completed', summary };
  }

  async runFlaky(config: RunFlakyConfig): Promise<TestRunResult> {
    const testRun = await this.eventStore.createTestRun({
      type: 'flaky',
      endpoint: config.endpoint,
      method: config.method,
      concurrency: 1,
      totalRequests: config.totalRequests,
    });

    this.gateway.emitTestStarted({ testRunId: testRun.id, type: 'flaky', endpoint: config.endpoint, totalRequests: config.totalRequests });

    const tasks = Array.from({ length: config.totalRequests }, (_, i) => ({
      execute: async () => {
        await new Promise((r) => setTimeout(r, 50));
        const start = Date.now();
        const response = await axios({ method: config.method, url: config.endpoint });
        const latencyMs = Date.now() - start;
        await this.eventStore.createRequestEvent({ testRunId: testRun.id, requestNumber: i + 1, statusCode: response.status, responseBody: JSON.stringify(response.data), latencyMs, isViolation: false });
        this.gateway.emitRequestCompleted({ testRunId: testRun.id, requestNumber: i + 1, statusCode: response.status, latencyMs, isViolation: false });
        return { status: response.status, body: JSON.stringify(response.data), latencyMs };
      },
    }));

    const { results, errors } = await this.queue.run(tasks, 1);
    const validResults = results.filter(Boolean);

    const statusCodes = new Set(validResults.map((r) => r.status));
    const bodies = new Set(validResults.map((r) => r.body));
    const latencies = validResults.map((r) => r.latencyMs);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const maxLatency = Math.max(...latencies, 0);
    const latencyVariancePct = avgLatency > 0 ? Math.round(((maxLatency - avgLatency) / avgLatency) * 100) : 0;

    const statusVariance = statusCodes.size > 1;
    const bodyVariance = bodies.size > 1;
    const latencySpike = latencyVariancePct > 300;
    const violations = statusVariance || bodyVariance || latencySpike ? 1 : 0;

    const summary = { totalRequests: config.totalRequests, passed: validResults.length, failed: errors.filter(Boolean).length, violations, avgLatencyMs: Math.round(avgLatency), statusVariance, bodyVariance, latencyVariancePct };
    await this.eventStore.updateTestRun(testRun.id, { status: 'completed', completedAt: new Date(), summary: JSON.stringify(summary) });
    this.gateway.emitTestCompleted({ testRunId: testRun.id, summary });

    return { testRunId: testRun.id, status: 'completed', summary };
  }
}
