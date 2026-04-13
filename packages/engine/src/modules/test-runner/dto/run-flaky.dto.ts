export class RunFlakyDto {
  method!: string;
  endpoint!: string;
  totalRequests!: number;
  headers?: Record<string, string>;
  userTokens?: string[];
}
