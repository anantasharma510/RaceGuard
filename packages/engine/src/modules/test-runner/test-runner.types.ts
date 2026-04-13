export interface RunIdempotencyConfig {
  endpoint: string;
  method: string;
  body?: any;
  totalRequests: number;
  // Static headers applied to every request (e.g. Authorization: Bearer <token>)
  headers?: Record<string, string>;
  // Multiple user tokens — each request gets a token from this list (round-robin)
  // Simulates concurrent requests from different users
  userTokens?: string[];
}

export interface RunInvariantConfig {
  endpoint: string;
  method: string;
  body?: any;
  concurrency: number;
  totalRequests: number;
  invariantRule: string;
  headers?: Record<string, string>;
  userTokens?: string[];
}

export interface RunFlakyConfig {
  endpoint: string;
  method: string;
  totalRequests: number;
  headers?: Record<string, string>;
  userTokens?: string[];
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
    [key: string]: any;
  };
}
