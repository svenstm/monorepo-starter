import { promiseMap } from './promise-map';

export async function promiseFilter<T>(arr: T[], cb: (value: T, index: number, array: T[]) => Promise<boolean>) {
  const removes = [] as number[];
  const ret = await promiseMap(arr, async (element, index, self) => {
    if (!await cb(element, index, self)) {
      removes.push(index);
    }
    return element;
  });
  return ret.filter((_, i) => !removes.includes(i));
}
