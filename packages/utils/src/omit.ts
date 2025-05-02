/**
 * Omit the given keys from the object.
 * @param obj
 * @param keys
 */
export function omit<T extends object, K extends Extract<keyof T, string>>(obj: T, ...keys: K[]): Omit<T, K> {
  let ret: any = {};
  const excludeSet: Set<string> = new Set(keys);
  // TS-NOTE: Set<K> makes the obj[key] type check fail. So, loosing typing here.

  for (let key in obj) {
    if (!excludeSet.has(key)) {
      ret[key] = obj[key];
    }
  }
  return ret;
}
