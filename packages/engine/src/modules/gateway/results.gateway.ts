import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  port: 7842,
})
export class ResultsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ResultsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitTestStarted(payload: { testRunId: string; type: string; endpoint: string; totalRequests: number }) {
    this.server?.emit('test-started', payload);
  }

  emitRequestCompleted(payload: {
    testRunId: string;
    requestNumber: number;
    statusCode?: number;
    latencyMs: number;
    isViolation: boolean;
  }) {
    this.server?.emit('request-completed', payload);
  }

  emitInvariantChecked(payload: {
    testRunId: string;
    requestEventId: string;
    passed: boolean;
    rule: string;
  }) {
    this.server?.emit('invariant-checked', payload);
  }

  emitViolationDetected(payload: {
    testRunId: string;
    requestNumber: number;
    rule?: string;
    actualValue?: string;
  }) {
    this.server?.emit('violation-detected', payload);
  }

  emitTestCompleted(payload: {
    testRunId: string;
    summary: object;
  }) {
    this.server?.emit('test-completed', payload);
  }
}
