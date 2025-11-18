export interface ServiceDescriptor {
  name: string;
  domain: 'api';
  ready: boolean;
  notes: string;
}

export function describeApiGateway(): ServiceDescriptor {
  return {
    name: 'api-gateway',
    domain: 'api',
    ready: false,
    notes: 'HTTP gateway placeholder generated during monorepo bootstrap.'
  };
}
