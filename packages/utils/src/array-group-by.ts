// Polyfill for Array.prototype.groupBy and Array.prototype.groupByToMap
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/group
//
// code copied from a private project of mine
// In the future these calls e.g. arrayGroupBy(arr, ({type}) => type}) with arr.groupBy(({type}) => type)

export function arrayGroupBy<T, K extends (string | symbol)>(
  arr: T[],
  callback: (value: T, index: number, array: Array<T>) => K,
  thisArg?: any,
): { [P in K]: T[] } {
  const obj: { [P in K]: T[] } = {} as any;
  arr.forEach((value, idx, self) => {
    // Always using apply will break #private values
    const ret = thisArg ? callback.call(thisArg, value, idx, self) : callback(value, idx, self);

    ((obj as any)[ret] ??= []).push(value);
  });

  return obj;
}

export function arrayGroupByToMap<T, K>(
  arr: T[],
  callback: (value: T, index: number, array: Array<T>) => K,
  thisArg?: any
): Map<K, Array<T>> {
  const map = new Map<K, Array<T>>();
  arr.forEach((value, idx, self) => {
    // Always using apply will break #private values
    const ret = thisArg ? callback.call(thisArg, value, idx, self) : callback(value, idx, self);

    // Upsert
    const group = map.get(ret) || [];
    if (group.push(value) === 1) map.set(ret, group);

  });
  return map;
}
