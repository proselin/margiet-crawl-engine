import { QueueOptions } from 'bullmq';

export interface IQueueConfig extends Record<string, QueueOptions> {}
