import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): object {
    return {
      status: 'ok',
      service: 'RaceGuard Engine',
      version: '0.1.0',
      port: 7842,
    };
  }
}
