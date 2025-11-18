import { describe, expect, it } from 'vitest';
import { describeAuthService } from '../src/index';

describe('auth-service scaffolding', () => {
  it('describes the auth service placeholder', () => {
    expect(describeAuthService()).toEqual(
      expect.objectContaining({
        name: 'auth-service',
        domain: 'auth',
        ready: false
      })
    );
  });
});
