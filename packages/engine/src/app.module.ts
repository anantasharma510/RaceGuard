import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './modules/queue/queue.module';
import { EventStoreModule } from './modules/event-store/event-store.module';

@Module({
   imports: [QueueModule,EventStoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
