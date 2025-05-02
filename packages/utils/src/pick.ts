import { ObjectKeys } from './object';

export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  return ObjectKeys(obj)
    .filter(key => keys.includes(key as K))
    .reduce((res, k) => ((res as any)[k] = obj[k], res), {} as Pick<T, K>);
}
