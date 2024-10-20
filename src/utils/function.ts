import { createHash } from 'node:crypto';

export function createShake256Hash(data: any, len: number) {
  return createHash('shake256', { outputLength: len })
    .update(data)
    .digest('hex');
}
