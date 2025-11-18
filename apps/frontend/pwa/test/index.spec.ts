import { describe, expect, it } from 'vitest';
import { describePwa } from '../src/index';

describe('pwa scaffolding', () => {
  it('describes the pwa placeholder', () => {
    expect(describePwa()).toEqual(
      expect.objectContaining({
        name: 'pwa',
        domain: 'frontend',
        ready: false
      })
    );
  });
});
