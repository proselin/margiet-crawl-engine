import { Controller, Get } from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  readonly registry: Registry;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });
  }

  @Get()
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
}
