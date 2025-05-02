import type { Constructor } from '@nestjs/common/utils/merge-with-values.util';
import { promiseMap } from '../promise-map';

type callback = () => any | Promise<any>;
type ObjectStorage<T> = { cbs: (callback | keyof T)[], override?: callback };
const onInits = new WeakMap<object, ObjectStorage<any>>();

export const upsertOnModuleInit = <T>(service: Constructor<T>) => {
  let obj: ObjectStorage<T> = onInits.get(service);
  if (!obj) onInits.set(service, obj = {cbs: []})
  return obj;
}

export const fixOriginalOnModuleInit = <T>(obj: ObjectStorage<T>, target: any) => {
  // if this is the first onInit decorator of the class
  if (!obj.override) {
    const original = target.onModuleInit;
    target.onModuleInit = obj.override = async function () {
      // call all these cb's
      await promiseMap(obj.cbs, cb => {
        // If its a callback directly
        if (typeof cb === 'function') return cb.call(this);

        // cb here is a keyof T, so call it
        return this[cb]()
      });

      return original && await original.apply(this);
    }
  }
}

export function OnInit() {
  return <T>(
    target: T,
    propertyKey: keyof T,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {

    const obj = upsertOnModuleInit(target as any);
    obj.cbs.push(propertyKey as any);

    fixOriginalOnModuleInit(obj, target);

    return descriptor;
  }
}
