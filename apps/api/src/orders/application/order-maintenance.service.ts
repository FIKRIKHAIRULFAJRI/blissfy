import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { OrderMaintenanceRepository } from '../infrastructure/order-maintenance.repository';

@Injectable()
export class OrderMaintenanceService {
  constructor(
    private readonly orderMaintenanceRepository: OrderMaintenanceRepository,
  ) {}

  async releaseExpiredReservations() {
    try {
      const releasedCount =
        await this.orderMaintenanceRepository.releaseExpiredReservations();

      return {
        ok: true as const,
        releasedCount,
      };
    } catch (error) {
      console.error('Release expired stock reservations failed', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });

      throw new ServiceUnavailableException({
        ok: false,
        code: 'RESERVATION_RELEASE_UNAVAILABLE',
        message: 'Reservasi kedaluwarsa belum dapat direkonsiliasi.',
      });
    }
  }
}
