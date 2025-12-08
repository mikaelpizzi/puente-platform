import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SearchService } from './search.service';

/**
 * Search Controller
 *
 * Public search endpoints for products.
 */
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Full-text product search.
   *
   * @example GET /search?q=laptop&category=electronics&minPrice=100&maxPrice=500
   */
  @Get()
  async search(
    @Query('q') query: string = '',
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // Build filter string
    const filters: string[] = [];
    if (category) filters.push(`category = "${category}"`);
    if (minPrice) filters.push(`price >= ${parseFloat(minPrice)}`);
    if (maxPrice) filters.push(`price <= ${parseFloat(maxPrice)}`);
    filters.push('stock > 0'); // Only show in-stock products

    // Build sort array
    const sortOptions: string[] = [];
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions.push(`${field}:${order || 'asc'}`);
    }

    return this.searchService.search(query, {
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: sortOptions.length > 0 ? sortOptions : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      facets: ['category'],
    });
  }

  /**
   * Autocomplete suggestions.
   */
  @Get('autocomplete')
  async autocomplete(@Query('q') query: string = '', @Query('limit') limit?: string) {
    const suggestions = await this.searchService.autocomplete(query, limit ? parseInt(limit) : 5);
    return { suggestions };
  }

  /**
   * Get search index stats (admin).
   */
  @Get('stats')
  async getStats() {
    return this.searchService.getStats();
  }

  /**
   * Force reindex all products (admin).
   */
  @Post('sync')
  async syncIndex(@Body() body: { products: any[] }) {
    await this.searchService.rebuildIndex(body.products);
    return { success: true, indexed: body.products.length };
  }

  /**
   * Index a single product (webhook).
   */
  @Post('index')
  async indexProduct(@Body() product: any) {
    await this.searchService.indexProduct(product);
    return { success: true, productId: product.id };
  }

  /**
   * Remove a product from index (webhook).
   */
  @Post('remove')
  async removeProduct(@Body() body: { productId: string }) {
    await this.searchService.removeProduct(body.productId);
    return { success: true, productId: body.productId };
  }
}
