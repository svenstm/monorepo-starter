export function promiseMap<T, U>(arr: T[], cb: (value: T, index: number, array: T[]) => Promise<U>) {
  return Promise.all(arr.map(cb));
}
