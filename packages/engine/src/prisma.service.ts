import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
    const sqlite = new Database(dbPath);
    const adapter = new PrismaBetterSQLite3(sqlite);
    this.client = new PrismaClient({ adapter } as any);
  }

  get db(): PrismaClient {
    return this.client;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
