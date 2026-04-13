import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { EventStoreService } from '../event-store/event-store.service';
import { RunIdempotencyDto } from './dto/run-idempotency.dto';
import { RunInvariantDto } from './dto/run-invariant.dto';
import { RunFlakyDto } from './dto/run-flaky.dto';

@Controller('api/tests')
export class TestRunnerController {
  constructor(
    private readonly testRunner: TestRunnerService,
    private readonly eventStore: EventStoreService,
  ) {}

  @Post('idempotency')
  runIdempotency(@Body() dto: RunIdempotencyDto) {
    return this.testRunner.runIdempotency({
      method: dto.method,
      endpoint: dto.endpoint,
      body: dto.body,
      totalRequests: dto.totalRequests ?? 20,
      headers: dto.headers,
      userTokens: dto.userTokens,
    });
  }

  @Post('invariant')
  runInvariant(@Body() dto: RunInvariantDto) {
    return this.testRunner.runInvariant({
      method: dto.method,
      endpoint: dto.endpoint,
      body: dto.body,
      concurrency: dto.concurrency ?? 10,
      totalRequests: dto.totalRequests ?? 50,
      invariantRule: dto.invariantRule,
      headers: dto.headers,
      userTokens: dto.userTokens,
    });
  }

  @Post('flaky')
  runFlaky(@Body() dto: RunFlakyDto) {
    return this.testRunner.runFlaky({
      method: dto.method,
      endpoint: dto.endpoint,
      totalRequests: dto.totalRequests ?? 100,
      headers: dto.headers,
      userTokens: dto.userTokens,
    });
  }

  @Get('history')
  getHistory() {
    return this.eventStore.getTestRunHistory();
  }

  @Get(':id')
  getTestRun(@Param('id') id: string) {
    return this.eventStore.getTestRunById(id);
  }

  @Get(':id/violations')
  getViolations(@Param('id') id: string) {
    return this.eventStore.getViolationsForRun(id);
  }
}
