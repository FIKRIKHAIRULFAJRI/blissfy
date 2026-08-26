import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

type ReleaseExpiredReservationsRow = {
  releasedCount: number | string;
};

@Injectable()
export class OrderMaintenanceRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async releaseExpiredReservations(): Promise<number> {
    const result =
      await this.databaseService.query<ReleaseExpiredReservationsRow>(
        `
          SELECT
            public.release_expired_stock_reservations()
              AS "releasedCount"
        `,
      );

    return Number(result.rows[0]?.releasedCount ?? 0);
  }
}
