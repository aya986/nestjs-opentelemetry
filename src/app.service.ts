import { Injectable } from '@nestjs/common';
import { logger } from './tracing';
import { SeverityNumber } from "@opentelemetry/api-logs";

@Injectable()
export class AppService {
  getHello(): string {
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "info",
      body: { type: 'log', name: 'startNestJs' , created_at: Math.floor(new Date().getTime() / 1000) },
      attributes: { type: 'log', name: 'startNestJs' , created_at: Math.floor(new Date().getTime() / 1000) },
    })
    return 'Hello World!';
  }
}
