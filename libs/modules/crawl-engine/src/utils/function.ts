import { createHash } from 'node:crypto';

export function createShake256Hash(data: any, len: number) {
  return createHash('shake256', { outputLength: len })
    .update(data)
    .digest('hex');
}

export function emptyReturn(returns: any): Promise<void> {
  if (typeof returns === 'function' && returns?.hasOwnProperty('then')) {
    return returns
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  }
  return Promise.resolve();
}
