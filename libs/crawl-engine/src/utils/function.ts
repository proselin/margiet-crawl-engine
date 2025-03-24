import { createHash } from 'node:crypto';
import { hasPropertyKey } from '@nestjs/swagger/dist/plugin/utils/plugin-utils';

export function createShake256Hash(data: any, len: number) {
  return createHash('shake256', { outputLength: len })
    .update(data)
    .digest('hex');
}

export function emptyReturn(returns: any): Promise<void>  {
  if(typeof returns === 'function' && hasPropertyKey('then', returns)) {
    return returns.then(() => {}).catch(error => {
      throw error
    });
  }
  return Promise.resolve();
}
