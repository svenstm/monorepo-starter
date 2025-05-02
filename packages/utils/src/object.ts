export function ObjectKeys<T>(obj: T){
  return Object.keys(obj) as Array<keyof T>
}


export function ObjectEntries<T>(obj: T) {
  type Helper<U, K extends keyof U> = [K, U[K]]
  return Object.entries(obj) as Helper<T, keyof T>[]
}

export function ObjectForEachRecursive<T extends Record<string, any>>(
  obj: T,
  callback: (key: keyof T, value: T[keyof T], self: typeof obj, path: string) => void,
  path: string = ''
) {
  for (const [key, value] of ObjectEntries(obj)) {
    if (typeof value === 'object' && value !== null) {
      const newPath = path.split('.').concat([String(key)]).join('.');
      ObjectForEachRecursive(value, callback, newPath);
    } else {
      callback(key as keyof T, value, obj, path);
    }
  }
}
