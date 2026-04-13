export class RunIdempotencyDto {
  method!: string;
  endpoint!: string;
  body?: any;
  totalRequests!: number;
}
