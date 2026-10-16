export const SYNC_FREQUENCIES = [5, 10, 15, 30, 60, 120, 360, 720, 1440] as const;
export const DEFAULT_SYNC_FREQUENCY = 5;

export function syncFrequency(value: unknown): number {
  const minutes = Number(value);
  return SYNC_FREQUENCIES.some((frequency) => frequency === minutes) ? minutes : DEFAULT_SYNC_FREQUENCY;
}
