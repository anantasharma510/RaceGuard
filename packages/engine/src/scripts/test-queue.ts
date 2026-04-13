import { QueueService } from '../modules/queue/queue.service';

const queue = new QueueService();

// Create 1000 tasks, each waits random 10-100ms
const tasks = Array.from({ length: 1000 }, (_, i) => ({
  execute: () =>
    new Promise<number>((resolve) =>
      setTimeout(() => resolve(i), Math.random() * 90 + 10),
    ),
}));

queue.run(tasks, 50, (progress) => {
  if (progress.completed % 100 === 0) {
    console.log(`Progress: ${progress.completed}/${progress.total}`);
  }
}).then(({ results, errors }) => {
  console.log(`Done. Completed: ${results.length}, Errors: ${errors.length}`);
});
