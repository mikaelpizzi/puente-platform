import { describe, expect, it } from 'vitest';
import { describeFinanceService } from '../src/index';

describe('finance-service scaffolding', () => {
  it('describes the finance service placeholder', () => {
    expect(describeFinanceService()).toEqual(
      expect.objectContaining({
        name: 'finance-service',
        domain: 'finance',
        ready: false
      })
    );
  });
});
