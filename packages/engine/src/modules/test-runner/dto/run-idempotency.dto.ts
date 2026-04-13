export class RunIdempotencyDto {
  method!: string;
  endpoint!: string;
  body?: any;
  totalRequests!: number;
  // Optional: static headers (e.g. Authorization: Bearer <token>)
  headers?: Record<string, string>;
  // Optional: array of tokens to simulate multiple users
  // Each request cycles through these tokens
  userTokens?: string[];
}
