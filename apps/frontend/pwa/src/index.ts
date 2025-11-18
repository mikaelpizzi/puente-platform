export interface PwaDescriptor {
  name: string;
  domain: 'frontend';
  ready: boolean;
  notes: string;
}

export function describePwa(): PwaDescriptor {
  return {
    name: 'pwa',
    domain: 'frontend',
    ready: false,
    notes: 'React/Vite PWA scaffold placeholder before UI implementation.'
  };
}
