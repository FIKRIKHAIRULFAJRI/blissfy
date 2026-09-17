import { Module } from '@nestjs/common';
import { AdminSessionGuard } from '../auth/admin-session.guard';
import { AdminSessionService } from '../auth/admin-session.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductImagesService } from './application/product-images.service';
import { AdminCategoriesService } from './application/admin-categories.service';
import { AdminProductsService } from './application/admin-products.service';
import { ProductsService } from './application/products.service';
import { CloudinaryService } from './infrastructure/cloudinary.service';
import { ProductsRepository } from './infrastructure/products.repository';
import { AdminProductImagesController } from './presentation/admin-product-images.controller';
import { AdminCategoriesController } from './presentation/admin-categories.controller';
import { AdminProductsController } from './presentation/admin-products.controller';
import { ProductsController } from './presentation/products.controller';

@Module({
  imports: [DatabaseModule, InventoryModule, AuthModule],
  controllers: [
    ProductsController,
    AdminProductImagesController,
    AdminCategoriesController,
    AdminProductsController,
  ],
  providers: [
    ProductsService,
    AdminCategoriesService,
    AdminProductsService,
    ProductImagesService,
    ProductsRepository,
    CloudinaryService,
    AdminSessionService,
    AdminSessionGuard,
  ],
})
export class ProductsModule {}
