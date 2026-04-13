export class RunInvariantDto {
  method!: string;
  endpoint!: string;
  body?: any;
  concurrency!: number;
  totalRequests!: number;
  invariantRule!: string;
  headers?: Record<string, string>;
  userTokens?: string[];
}
