'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RequestEvent {
  testRunId: string;
  requestNumber: number;
  statusCode?: number;
  latencyMs: number;
  isViolation: boolean;
}

export interface ViolationEvent {
  testRunId: string;
  requestNumber: number;
  rule?: string;
  actualValue?: string;
}

export interface TestState {
  testRunId: string | null;
  type: string | null;
  endpoint: string | null;
  totalRequests: number;
  requests: RequestEvent[];
  violations: ViolationEvent[];
  completed: boolean;
  summary: Record<string, any> | null;
}

const initialState: TestState = {
  testRunId: null,
  type: null,
  endpoint: null,
  totalRequests: 0,
  requests: [],
  violations: [],
  completed: false,
  summary: null,
};

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:7842', { transports: ['websocket'] });
  }
  return socket;
}

export function useTestResults() {
  const [state, setState] = useState<TestState>(initialState);

  useEffect(() => {
    const s = getSocket();

    s.on('test-started', (data: any) => {
      setState({
        ...initialState,
        testRunId: data.testRunId,
        type: data.type,
        endpoint: data.endpoint,
        totalRequests: data.totalRequests,
      });
    });

    s.on('request-completed', (data: RequestEvent) => {
      setState((prev) => ({ ...prev, requests: [...prev.requests, data] }));
    });

    s.on('violation-detected', (data: ViolationEvent) => {
      setState((prev) => ({ ...prev, violations: [...prev.violations, data] }));
    });

    s.on('test-completed', (data: any) => {
      setState((prev) => ({ ...prev, completed: true, summary: data.summary }));
    });

    return () => {
      s.off('test-started');
      s.off('request-completed');
      s.off('violation-detected');
      s.off('test-completed');
    };
  }, []);

  const reset = () => setState(initialState);

  return { state, reset };
}
