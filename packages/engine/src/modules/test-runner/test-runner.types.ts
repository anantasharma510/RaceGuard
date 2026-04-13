export interface RunIdempotencyConfig {
  endpoint: string;
  method: string;
  body?: any;
  totalRequests: number;
}

export interface RunInvariantConfig {
  endpoint: string;
  method: string;
  body?: any;
  concurrency: number;
  totalRequests: number;
  invariantRule: string;
}

export interface RunFlakyConfig {
  endpoint: string;
  method: string;
  totalRequests: number;
}

export interface TestRunResult {
  testRunId: string;
  status: string;
  summary: {
    totalRequests: number;
    passed: number;
    failed: number;
    violations: number;
    avgLatencyMs: number;
  };
}
