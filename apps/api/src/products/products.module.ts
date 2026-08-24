import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductsService } from './application/products.service';
import { ProductsRepository } from './infrastructure/products.repository';
import { ProductsController } from './presentation/products.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
