import { Module } from '@nestjs/common';
import { ResultsGateway } from './results.gateway';

@Module({
  providers: [ResultsGateway],
  exports: [ResultsGateway],
})
export class GatewayModule {}
