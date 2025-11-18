export interface AuthDescriptor {
  name: string;
  domain: 'auth';
  ready: boolean;
  notes: string;
}

export function describeAuthService(): AuthDescriptor {
  return {
    name: 'auth-service',
    domain: 'auth',
    ready: false,
    notes: 'JWT, RBAC and credential flows will be implemented in later tasks.'
  };
}
