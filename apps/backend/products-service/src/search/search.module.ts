import { Module, Logger } from '@nestjs/common';
import { SearchService, SearchResult, ProductDocument } from './search.service';
import { SearchController } from './search.controller';

/**
 * Mock Search Service for graceful degradation.
 * Used when Meilisearch is not available (ENABLE_SEARCH=false).
 */
class MockSearchService {
  private readonly logger = new Logger('MockSearchService');

  constructor() {
    this.logger.warn('🔇 MockSearchService initialized - Meilisearch is disabled');
  }

  async onModuleInit() {
    // No-op: No Meilisearch to configure
  }

  async configureIndex() {
    // No-op
  }

  async search(): Promise<SearchResult> {
    return {
      hits: [],
      totalHits: 0,
      query: '',
      processingTimeMs: 0,
      facets: {},
    };
  }

  async autocomplete(): Promise<string[]> {
    return [];
  }

  async indexProduct(_product: ProductDocument) {
    // No-op
  }

  async indexProducts(_products: ProductDocument[]) {
    // No-op
  }

  async updateProduct(_product: Partial<ProductDocument> & { id: string }) {
    // No-op
  }

  async removeProduct(_productId: string) {
    // No-op
  }

  async rebuildIndex(_products: ProductDocument[]) {
    // No-op
  }

  async getStats() {
    return {
      numberOfDocuments: 0,
      isIndexing: false,
    };
  }
}

// Determine which service to use based on environment variable
const searchEnabled = process.env.ENABLE_SEARCH !== 'false';

@Module({
  controllers: [SearchController],
  providers: [
    {
      provide: SearchService,
      useClass: searchEnabled ? SearchService : MockSearchService,
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
