import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository, type AdminProductRow } from '../infrastructure/products.repository';
import type { CreateAdminProductDto } from '../presentation/dto/create-admin-product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  listProducts(input: { page: number; q?: string; status?: boolean }) {
    return this.repository.listAdminProducts(input);
  }

  async getProduct(id: string): Promise<AdminProductRow> {
    const product = await this.repository.findAdminProduct(id);
    if (!product) throw new NotFoundException('Produk tidak ditemukan.');
    return product;
  }

  async createProduct(input: CreateAdminProductDto) {
    await this.assertCategoryAndSlug(input);
    if (input.initialDiscount && new Date(input.initialDiscount.endsAt) <= new Date(input.initialDiscount.startsAt)) throw new ConflictException('Waktu akhir diskon harus setelah waktu mulai.');
    if (input.initialDiscount?.type === 'PERCENTAGE' && input.initialDiscount.value > 90) throw new ConflictException('Diskon persentase maksimal 90%.');
    if (input.initialDiscount?.type === 'FIXED_AMOUNT' && input.initialDiscount.value >= input.normalPrice) throw new ConflictException('Diskon nominal harus lebih kecil dari harga normal.');
    if (input.initialVariant) {
      const sku = await this.repository.findAdminVariantBySku(input.initialVariant.sku);
      if (sku) throw new ConflictException('SKU varian sudah dipakai.');
    }
    return this.repository.createAdminProduct(input);
  }

  async updateProduct(id: string, input: CreateAdminProductDto) {
    await this.assertCategoryAndSlug(input, id);
    const product = await this.repository.updateAdminProduct(id, input);
    if (!product) throw new NotFoundException('Produk tidak ditemukan.');
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.getProduct(id);
    if (product.variantCount || product.activeDiscountCount || product.imageCount) {
      throw new ConflictException('Produk tidak bisa dihapus karena masih memiliki varian, diskon, atau gambar.');
    }
    await this.repository.deleteAdminProduct(id);
  }

  async updateProductStatus(id: string, isActive: boolean) {
    const product = await this.repository.updateAdminProductStatus(id, isActive);
    if (!product) throw new NotFoundException('Produk tidak ditemukan.');
    return product;
  }

  private async assertCategoryAndSlug(input: CreateAdminProductDto, id?: string) {
    const [category, existing] = await Promise.all([
      this.repository.findAdminCategory(input.categoryId),
      this.repository.findAdminProductBySlug(input.slug),
    ]);
    if (!category) throw new NotFoundException('Kategori tidak ditemukan.');
    if (existing && existing.id !== id) throw new ConflictException('Slug produk sudah dipakai.');
  }
}
