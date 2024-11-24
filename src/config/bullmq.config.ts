import { registerAs } from '@nestjs/config';
import { QueueName } from '@/common';

export default registerAs('queue', () => {
  return {
    [QueueName.QUEUE_CRAWL_NAME]: {},
    [QueueName.QUEUE_UPLOAD_NAME]: {},
  };
});
