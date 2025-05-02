import { Inject, Injectable, Optional } from '@nestjs/common';
import * as winston from 'winston';
// @ts-ignore
import RollbarTransport from 'winston-transport-rollbar-3';
import { LoggerColorUtils } from './utils/colors.utils';
import { LOGGER_OPTIONS } from './contants';
import { pascalCase } from 'change-case';
import { LoggerModuleOptions } from './interfaces/options.interface';

@Injectable()
export class LoggerBuilderService {
  constructor(
    @Inject(LOGGER_OPTIONS) private readonly options: LoggerModuleOptions,
    @Optional() private logger?: winston.Logger,
  ) {
    this.logger = this.createLogger();
  }

  getOptions() {
    return this.options;
  }

  getLogger() {
    return this.logger;
  }

  createLogger(): winston.Logger {
    const formats = [
      winston.format.label({ label: pascalCase(this.options.appName ?? 'logger') }),
      winston.format.timestamp({ format: 'DD/MM/YY hh:mm:ss' }),
      winston.format.printf((info) => {
        const msg = [
          [
            LoggerColorUtils.clc.cyanBright(`[${info.label}] `),
            `<${info.timestamp}>\t`,
            `${info.level}\t`,
            info.context ? LoggerColorUtils.clc.yellow(`[${info.context}] `) : '',
            `${info.message}`,
          ].join('')
        ];

        for (const key in info) {
          if (['timestamp', 'message', 'level', 'label', 'context'].indexOf(key) > -1) {
            continue;
          }

          const value = typeof info[key] === 'string' ? info[key] : JSON.stringify(info[key], null, 2);
          msg.push(`\n${key}:\n${value}\n`);
        }

        return msg.join('\n');
      }),
    ];

    const transports = [
      new winston.transports.Console({
        level: this.options.level || 'warn',
        format: winston.format.combine(
          winston.format(info => {
            info.level = `<${info.level}>`;
            return info;
          })(),
          ...[winston.format.colorize()],
          ...formats,
        ),
        handleExceptions: true,
      })
    ];

    const { rollbar } = this.options;
    if (rollbar?.accessToken) {
      transports.push(new RollbarTransport({
        rollbarConfig: {
          accessToken: rollbar.accessToken,
          environment: rollbar.environment || this.options.env || 'development',
          reportLevel: rollbar.level || 'warn',
          captureUncaught: true,
          captureUnhandledRejections: true,
          uncaughtErrorLevel: 'critical',
        },
        level: rollbar.level || 'warn',
      }));
    }

    return winston.createLogger({
      transports,
    });
  }
}
