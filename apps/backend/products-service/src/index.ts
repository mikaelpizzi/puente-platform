export interface ProductsDescriptor {
  name: string;
  domain: 'products';
  ready: boolean;
  notes: string;
}

export function describeProductsService(): ProductsDescriptor {
  return {
    name: 'products-service',
    domain: 'products',
    ready: false,
    notes: 'Flexible catalog service scaffolded for future MongoDB integration.'
  };
}
