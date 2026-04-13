import 'reflect-metadata';
import { PrismaService } from '../prisma.service';
import { EventStoreService } from '../modules/event-store/event-store.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const eventStore = new EventStoreService(prisma);

  // 1. Create a test run
  const testRun = await eventStore.createTestRun({
    type: 'idempotency',
    endpoint: 'http://localhost:3000/api/orders',
    method: 'POST',
    concurrency: 10,
    totalRequests: 20,
  });
  console.log('Created TestRun:', testRun.id);

  // 2. Create a request event
  const event = await eventStore.createRequestEvent({
    testRunId: testRun.id,
    requestNumber: 1,
    statusCode: 200,
    responseBody: '{"id":"abc"}',
    latencyMs: 45,
    isViolation: false,
  });
  console.log('Created RequestEvent:', event.id);

  // 3. Update test run to completed
  await eventStore.updateTestRun(testRun.id, {
    status: 'completed',
    completedAt: new Date(),
    summary: JSON.stringify({ total: 20, passed: 20, violations: 0 }),
  });
  console.log('Updated TestRun status to completed');

  // 4. Read it back
  const fetched = await eventStore.getTestRunById(testRun.id);
  console.log('Fetched TestRun:', fetched?.status, '| Events:', fetched?.requestEvents.length);

  // 5. Get history
  const history = await eventStore.getTestRunHistory();
  console.log('History count:', history.length);

  await prisma.onModuleDestroy();
  console.log('\nAll EventStore operations working correctly.');
}

main().catch(console.error);
