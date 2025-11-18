import { describe, expect, it } from 'vitest';
import { describeApiGateway } from '../src/index';

describe('api-gateway scaffolding', () => {
  it('exposes metadata for the API gateway service', () => {
    expect(describeApiGateway()).toEqual(
      expect.objectContaining({
        name: 'api-gateway',
        domain: 'api',
        ready: false
      })
    );
  });
});
