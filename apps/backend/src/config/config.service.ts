import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from '@monorepo-starter/config';
import { boolean } from 'boolean';
import { LogLevel } from '@monorepo-starter/logger';

@Injectable()
export class ConfigService {

  constructor(
    protected readonly config: ConfigLoaderService,
  ) {}

  getPort(): number {
    // @ts-ignore
    return Number(this.config.get('port'));
  }

  getApp(): { id: string, name: string, shorthand: string } {
    return this.config.get('app');
  }

  getEnv(): string {
    return this.config.get('env');
  }

  isEnv(env: 'test' | 'development' | 'staging' | 'acceptation' | 'production'): boolean {
    return this.getEnv() === env;
  }

  isDebug(): boolean {
    return boolean(this.config.get('debug'));
  }

  getGraphql(): { playground: boolean } {
    const conf = this.config.get('graphql');
    return {
      playground: boolean(conf.playground),
    };
  }

  getCors() {
    let origin = (this.config.get('cors.origin') || '*');
    origin = origin !== '*' ? origin.split(',') : origin;
    origin = Array.isArray(origin) ?
      origin.map((string) => string !== '*' ? new RegExp(string) : string) :
      origin;

    const credentials = this.config.get('cors.credentials') || false;
    const exposedHeaders = this.config.get('cors.exposed_headers') || [];

    return {
      origin,
      credentials,
      exposedHeaders,
    };
  }

  getLogger(): { level: LogLevel, force: boolean } {
    const config = this.config.get('log');
    return {level: config.level, force: boolean(config.force) };
  }

  getRollbar(): { accessToken: string, environment: string, level?: LogLevel} {
    return this.config.get('rollbar');
  }

  getLoggerFactoryConfig() {
    return {
      rollbar: this.getRollbar(),
      appName: this.getApp().shorthand,
      env: this.getEnv(),
      ...this.getLogger(),
    }
  }

  getMongoDefaultUrl(): string {
    return this.config.get('mongodb.main.url');
  }

  getJwtSecret(): string {
    return this.config.get('jwt.secret');
  }

  getTwilio(): { accountSid: string, authToken: string, from: string } {
    return this.config.get('twilio');
  }
}
