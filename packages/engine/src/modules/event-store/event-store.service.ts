import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  CreateTestRunInput,
  CreateRequestEventInput,
  CreateInvariantCheckInput,
  CreateReproducerInput,
} from './event-store.types';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTestRun(input: CreateTestRunInput) {
    try {
      return await this.prisma.db.testRun.create({ data: input });
    } catch (err) {
      throw new Error(`Failed to create test run: ${(err as Error).message}`);
    }
  }

  async updateTestRun(id: string, data: Partial<{ status: string; summary: string; completedAt: Date }>) {
    try {
      return await this.prisma.db.testRun.update({ where: { id }, data });
    } catch (err) {
      throw new Error(`Failed to update test run: ${(err as Error).message}`);
    }
  }

  async createRequestEvent(input: CreateRequestEventInput) {
    try {
      return await this.prisma.db.requestEvent.create({ data: input });
    } catch (err) {
      throw new Error(`Failed to create request event: ${(err as Error).message}`);
    }
  }

  async createInvariantCheck(input: CreateInvariantCheckInput) {
    try {
      return await this.prisma.db.invariantCheck.create({ data: input });
    } catch (err) {
      throw new Error(`Failed to create invariant check: ${(err as Error).message}`);
    }
  }

  async createReproducer(input: CreateReproducerInput) {
    try {
      return await this.prisma.db.reproducer.create({ data: input });
    } catch (err) {
      throw new Error(`Failed to create reproducer: ${(err as Error).message}`);
    }
  }

  async getTestRunById(id: string) {
    try {
      return await this.prisma.db.testRun.findUnique({
        where: { id },
        include: { requestEvents: true, reproducer: true },
      });
    } catch (err) {
      throw new Error(`Failed to get test run: ${(err as Error).message}`);
    }
  }

  async getTestRunHistory() {
    try {
      return await this.prisma.db.testRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (err) {
      throw new Error(`Failed to get history: ${(err as Error).message}`);
    }
  }

  async getViolationsForRun(testRunId: string) {
    try {
      return await this.prisma.db.requestEvent.findMany({
        where: { testRunId, isViolation: true },
        include: { invariantCheck: true },
      });
    } catch (err) {
      throw new Error(`Failed to get violations: ${(err as Error).message}`);
    }
  }
}
