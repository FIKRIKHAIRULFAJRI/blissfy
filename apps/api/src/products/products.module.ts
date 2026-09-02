import { Module } from '@nestjs/common';
import { AdminSessionGuard } from '../auth/admin-session.guard';
import { AdminSessionService } from '../auth/admin-session.service';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductImagesService } from './application/product-images.service';
import { ProductsService } from './application/products.service';
import { CloudinaryService } from './infrastructure/cloudinary.service';
import { ProductsRepository } from './infrastructure/products.repository';
import { AdminProductImagesController } from './presentation/admin-product-images.controller';
import { ProductsController } from './presentation/products.controller';

@Module({
  imports: [DatabaseModule, InventoryModule],
  controllers: [ProductsController, AdminProductImagesController],
  providers: [
    ProductsService,
    ProductImagesService,
    ProductsRepository,
    CloudinaryService,
    AdminSessionService,
    AdminSessionGuard,
  ],
})
export class ProductsModule {}
