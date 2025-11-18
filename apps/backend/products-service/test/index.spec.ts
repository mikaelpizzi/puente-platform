import { describe, expect, it } from 'vitest';
import { describeProductsService } from '../src/index';

describe('products-service scaffolding', () => {
  it('describes the products service placeholder', () => {
    expect(describeProductsService()).toEqual(
      expect.objectContaining({
        name: 'products-service',
        domain: 'products',
        ready: false
      })
    );
  });
});
