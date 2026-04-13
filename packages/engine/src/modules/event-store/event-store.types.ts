export interface CreateTestRunInput {
  type: string;
  endpoint: string;
  method: string;
  body?: string;
  concurrency: number;
  totalRequests: number;
  invariantRule?: string;
}

export interface CreateRequestEventInput {
  testRunId: string;
  requestNumber: number;
  payload?: string;
  statusCode?: number;
  responseBody?: string;
  latencyMs?: number;
  isViolation?: boolean;
}

export interface CreateInvariantCheckInput {
  testRunId: string;
  requestEventId: string;
  rule: string;
  actualValue?: string;
  passed: boolean;
}

export interface CreateReproducerInput {
  testRunId: string;
  code: string;
  framework: string;
}
