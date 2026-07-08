const PALETTE = ['#5b5bf6', '#8c5bf6', '#f65ba3', '#f6a05b', '#3ab795', '#3a8ef6'];

export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialOf(name: string): string {
  return name?.trim()?.[0]?.toUpperCase() || '?';
}
