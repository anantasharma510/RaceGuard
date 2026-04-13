import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './modules/queue/queue.module';
import { EventStoreModule } from './modules/event-store/event-store.module';
import { TestRunnerModule } from './modules/test-runner/test-runner.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ReproducerModule } from './modules/reproducer/reproducer.module';

@Module({
  imports: [QueueModule, EventStoreModule, GatewayModule, ReproducerModule, TestRunnerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
