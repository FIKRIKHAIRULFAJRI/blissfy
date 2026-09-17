import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { ProductsRepository } from '../infrastructure/products.repository';

describe('AdminCategoriesService', () => {
  const productsRepository = {
    listAdminCategories: jest.fn(),
    findAdminCategory: jest.fn(),
    findAdminCategoryBySlug: jest.fn(),
    createAdminCategory: jest.fn(),
    updateAdminCategory: jest.fn(),
    deleteAdminCategory: jest.fn(),
  };
  const service = new AdminCategoriesService(
    productsRepository as unknown as ProductsRepository,
  );

  const input = {
    name: 'Atasan',
    slug: 'atasan',
    description: 'Koleksi atasan.',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productsRepository.findAdminCategoryBySlug.mockResolvedValue(null);
  });

  it('creates a category when its slug is available', async () => {
    productsRepository.createAdminCategory.mockResolvedValue({
      id: 'category-1',
      ...input,
      productCount: 0,
    });

    await expect(service.createCategory(input)).resolves.toMatchObject({
      id: 'category-1',
      slug: 'atasan',
    });
    expect(productsRepository.createAdminCategory).toHaveBeenCalledWith(input);
  });

  it('rejects a duplicate category slug', async () => {
    productsRepository.findAdminCategoryBySlug.mockResolvedValue({
      id: 'category-1',
    });

    await expect(service.createCategory(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('does not delete a category used by products', async () => {
    productsRepository.findAdminCategory.mockResolvedValue({
      id: 'category-1',
      ...input,
      productCount: 1,
    });

    await expect(service.deleteCategory('category-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productsRepository.deleteAdminCategory).not.toHaveBeenCalled();
  });

  it('reports an unknown category before deletion', async () => {
    productsRepository.findAdminCategory.mockResolvedValue(null);

    await expect(service.deleteCategory('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
