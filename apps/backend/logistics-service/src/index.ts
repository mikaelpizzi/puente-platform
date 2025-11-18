export interface LogisticsDescriptor {
  name: string;
  domain: 'logistics';
  ready: boolean;
  notes: string;
}

export function describeLogisticsService(): LogisticsDescriptor {
  return {
    name: 'logistics-service',
    domain: 'logistics',
    ready: false,
    notes: 'Streaming geo-tracking and routing logic will be layered on here later.'
  };
}
