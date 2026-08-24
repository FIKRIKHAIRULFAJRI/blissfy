import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString =
      this.configService.getOrThrow<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString,
    });
  }

  async query<T extends QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async ping(): Promise<boolean> {
    const result = await this.query<{ ok: number }>('SELECT 1 AS ok');

    return result.rows[0]?.ok === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
