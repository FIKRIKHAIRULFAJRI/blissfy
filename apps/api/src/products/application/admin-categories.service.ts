import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductsRepository, type AdminCategoryRow } from '../infrastructure/products.repository';
import type { CreateAdminCategoryDto } from '../presentation/dto/create-admin-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  listCategories(): Promise<AdminCategoryRow[]> {
    return this.productsRepository.listAdminCategories();
  }

  async createCategory(input: CreateAdminCategoryDto): Promise<AdminCategoryRow> {
    await this.ensureSlugAvailable(input.slug);
    return this.productsRepository.createAdminCategory(input);
  }

  async updateCategory(
    categoryId: string,
    input: CreateAdminCategoryDto,
  ): Promise<AdminCategoryRow> {
    await this.ensureSlugAvailable(input.slug, categoryId);
    const category = await this.productsRepository.updateAdminCategory(
      categoryId,
      input,
    );

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return category;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const category = await this.productsRepository.findAdminCategory(categoryId);

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    if (category.productCount > 0) {
      throw new ConflictException(
        'Kategori tidak bisa dihapus karena masih dipakai produk. Nonaktifkan kategori jika perlu disembunyikan.',
      );
    }

    await this.productsRepository.deleteAdminCategory(categoryId);
  }

  private async ensureSlugAvailable(slug: string, currentId?: string) {
    const category = await this.productsRepository.findAdminCategoryBySlug(slug);

    if (category && category.id !== currentId) {
      throw new ConflictException('Slug kategori sudah dipakai.');
    }
  }
}
