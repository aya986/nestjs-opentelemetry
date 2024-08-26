import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { BatchLogRecordProcessor, LogRecord, LoggerProvider } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import api from '@opentelemetry/api';
import type * as logsAPI from '@opentelemetry/api-logs';
import { SeverityNumber } from "@opentelemetry/api-logs";

const serviceName = 'NestJs-service';
const serviceVersion = '0.1.1';


export function setupTracing() {
  const consoleExporter: boolean = false;
  let traceExporter;

  if (consoleExporter) {
    traceExporter = new ConsoleSpanExporter();
  } else {
    traceExporter = new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces',
    });
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: 'http://localhost:4318/v1/metrics',
        headers: {},
      }),
    }),

    instrumentations: [
      new NestInstrumentation(),
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  sdk.start();
}


//  const logger = loggerProvider.getLogger('default', '1.0.0');

export const getSpanInfo = () => {
  return api.trace.getSpan(api.context.active());
}

class LoggerWrapper {
  private logger: logsAPI.Logger;

  constructor() {
    const logResource = Resource.default().merge(
      new Resource({
        [SEMRESATTRS_SERVICE_NAME]: serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
      }),
    );

    const loggerProvider = new LoggerProvider({
      resource: logResource,
    });

    const logExporter = new OTLPLogExporter({
      url: 'http://127.0.0.1:4318/v1/logs',
    });

    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
    this.logger = loggerProvider.getLogger('default', '1.0.0');
  }

  emit(logRecord: {
    severityNumber: SeverityNumber,
    severityText: string,
    attributes: Record<string, any>,
    body: Record<string, any>
  }) {
    const current_span = getSpanInfo()

    let trace_id = current_span.spanContext().traceId;
    let span_id = current_span.spanContext().spanId;

    logRecord.attributes = {
      ...logRecord.attributes,
      trace_id,
      span_id,
    }

    logRecord.body = {
      ...logRecord.body,
      trace_id,
      span_id,
    }

    this.logger.emit(logRecord as unknown as LogRecord);
  }
}

export const LoggerWrapperObj = new LoggerWrapper();
