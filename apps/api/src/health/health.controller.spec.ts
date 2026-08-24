import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  const databaseServiceMock = {
    ping: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: databaseServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return API health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'blissfy-api',
    });
  });

  it('should return database health status', async () => {
    await expect(controller.getDatabaseHealth()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });

    expect(databaseServiceMock.ping).toHaveBeenCalledTimes(1);
  });
});
