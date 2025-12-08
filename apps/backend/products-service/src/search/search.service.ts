import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MeiliSearch, Index, SearchParams, SearchResponse } from 'meilisearch';

interface ProductDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  sellerId: string;
  sellerName?: string;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  hits: ProductDocument[];
  totalHits: number;
  query: string;
  processingTimeMs: number;
  facets?: Record<string, Record<string, number>>;
}

/**
 * Meilisearch Service
 *
 * Semantic product search with:
 * - Typo tolerance (2 typos default)
 * - Spanish synonyms
 * - Faceted filtering
 * - Autocomplete suggestions
 */
@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private productsIndex: Index<ProductDocument>;

  private readonly INDEX_NAME = 'products';

  constructor() {
    const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey';

    this.client = new MeiliSearch({ host, apiKey });
    this.productsIndex = this.client.index(this.INDEX_NAME);
  }

  async onModuleInit() {
    await this.configureIndex();
  }

  /**
   * Configure Meilisearch index settings.
   */
  async configureIndex() {
    try {
      // Create index if not exists
      await this.client.createIndex(this.INDEX_NAME, { primaryKey: 'id' });

      // Configure searchable attributes
      await this.productsIndex.updateSearchableAttributes([
        'title',
        'description',
        'category',
        'sellerName',
      ]);

      // Configure filterable attributes
      await this.productsIndex.updateFilterableAttributes([
        'category',
        'price',
        'sellerId',
        'stock',
      ]);

      // Configure sortable attributes
      await this.productsIndex.updateSortableAttributes(['price', 'createdAt']);

      // Configure typo tolerance
      await this.productsIndex.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8,
        },
      });

      // Configure Spanish synonyms
      await this.productsIndex.updateSynonyms({
        // Common Spanish synonyms
        celular: ['telefono', 'movil', 'smartphone'],
        laptop: ['portatil', 'notebook', 'computadora'],
        carro: ['auto', 'vehiculo', 'coche'],
        casa: ['hogar', 'vivienda', 'apartamento'],
        ropa: ['vestimenta', 'prenda', 'indumentaria'],
        zapatos: ['calzado', 'zapatillas', 'tenis'],
        barato: ['economico', 'accesible', 'oferta'],
        nuevo: ['reciente', 'fresco', 'ultimo'],
        // Size synonyms
        grande: ['xl', 'extra large', 'g'],
        pequeño: ['chico', 's', 'small'],
        mediano: ['m', 'medium', 'regular'],
      });

      // Configure ranking rules
      await this.productsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);

      this.logger.log('Meilisearch index configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Meilisearch index', error);
    }
  }

  /**
   * Search products with typo tolerance and filtering.
   */
  async search(
    query: string,
    options: {
      filter?: string;
      sort?: string[];
      limit?: number;
      offset?: number;
      facets?: string[];
    } = {},
  ): Promise<SearchResult> {
    const searchParams: SearchParams = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      filter: options.filter,
      sort: options.sort,
      facets: options.facets || ['category'],
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    const response = await this.productsIndex.search(query, searchParams);

    return {
      hits: response.hits as ProductDocument[],
      totalHits: response.estimatedTotalHits || 0,
      query: response.query,
      processingTimeMs: response.processingTimeMs,
      facets: response.facetDistribution,
    };
  }

  /**
   * Autocomplete suggestions.
   */
  async autocomplete(query: string, limit = 5): Promise<string[]> {
    const response = await this.productsIndex.search(query, {
      limit,
      attributesToRetrieve: ['title'],
    });

    return response.hits.map((hit: any) => hit.title);
  }

  /**
   * Index a single product.
   */
  async indexProduct(product: ProductDocument) {
    await this.productsIndex.addDocuments([product]);
    this.logger.debug(`Indexed product: ${product.id}`);
  }

  /**
   * Index multiple products.
   */
  async indexProducts(products: ProductDocument[]) {
    await this.productsIndex.addDocuments(products);
    this.logger.log(`Indexed ${products.length} products`);
  }

  /**
   * Update a product in the index.
   */
  async updateProduct(product: Partial<ProductDocument> & { id: string }) {
    await this.productsIndex.updateDocuments([product]);
    this.logger.debug(`Updated product: ${product.id}`);
  }

  /**
   * Remove a product from the index.
   */
  async removeProduct(productId: string) {
    await this.productsIndex.deleteDocument(productId);
    this.logger.debug(`Removed product: ${productId}`);
  }

  /**
   * Clear and rebuild the entire index.
   */
  async rebuildIndex(products: ProductDocument[]) {
    await this.productsIndex.deleteAllDocuments();
    await this.productsIndex.addDocuments(products);
    this.logger.log(`Rebuilt index with ${products.length} products`);
  }

  /**
   * Get index stats.
   */
  async getStats() {
    const stats = await this.productsIndex.getStats();
    return {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
    };
  }
}
