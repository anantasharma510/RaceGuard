import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    // Use DATABASE_URL env var if set (Docker), otherwise fall back to local dev path
    const dbUrl = process.env.DATABASE_URL;
    let dbPath: string;

    if (dbUrl && dbUrl.startsWith('file:')) {
      dbPath = dbUrl.replace(/^file:/, '');
      // Resolve relative paths from cwd, absolute paths as-is
      if (!path.isAbsolute(dbPath)) {
        dbPath = path.resolve(process.cwd(), dbPath);
      }
    } else {
      dbPath = path.resolve(__dirname, '../prisma/dev.db');
    }

    const adapter = new PrismaBetterSqlite3({ url: dbPath });
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
