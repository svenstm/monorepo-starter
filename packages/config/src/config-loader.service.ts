import { Injectable } from '@nestjs/common';
import convict from 'convict';

@Injectable()
export class ConfigLoaderService<T = any> {
  private config: convict.Config<T>;

  constructor() {}

  public async load(schema: convict.Schema<T>, path: string): Promise<void> {
    if (this.config) {
      return;
    }
    this.config = convict(schema);

    try {
      // @ts-ignore
      const local = await import(`${path}${this.config.get('env')}.config`);
      this.config.load(local.default);
    } catch (e) {}

    try {
      // @ts-ignore
      const local = await import(`${path}${this.config.get('env')}.local.config`);
      this.config.load(local.default);
    } catch (e) {}

    this.validate();
  }

  set(key: string, value: any): void {
    this.config.set(key, value);
  }

  get(key?: convict.Path<T>) {
    return this.config.get(key);
  }

  has(key: convict.Path<T>): boolean {
    return this.config.has(key);
  }

  validate() {
    return this.config.validate({ allowed: 'warn' });
  }
}
