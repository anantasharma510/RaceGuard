import { Injectable, Logger } from '@nestjs/common';
import { QueueTask, QueueProgress, ProgressCallback } from './queue.type';

const MAX_CONCURRENCY = 500;
const WARN_TOTAL = 10000;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  async run<T>(
    tasks: QueueTask<T>[],
    concurrency: number,
    onProgress?: ProgressCallback,
  ): Promise<{ results: T[]; errors: Error[] }> {
    // Safety cap
    if (concurrency > MAX_CONCURRENCY) {
      this.logger.warn(`Concurrency capped at ${MAX_CONCURRENCY}`);
      concurrency = MAX_CONCURRENCY;
    }
    if (tasks.length > WARN_TOTAL) {
      this.logger.warn(`Large run: ${tasks.length} tasks. This may take a while.`);
    }

    const results: T[] = [];
    const errors: Error[] = [];
    let completed = 0;
    let failed = 0;
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= tasks.length) return;

      const currentIndex = index++;
      const task = tasks[currentIndex];

      try {
        const result = await task.execute();
        results[currentIndex] = result;
        completed++;
      } catch (err) {
        errors[currentIndex] = err as Error;
        failed++;
      }

      onProgress?.({ completed, failed, total: tasks.length });
      await runNext();
    };

    // Start N workers in parallel
    const workers = Array.from(
      { length: Math.min(concurrency, tasks.length) },
      () => runNext(),
    );

    await Promise.all(workers);

    return { results, errors };
  }
}
