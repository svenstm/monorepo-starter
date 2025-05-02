export function removeEmpty<T>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v)) as T;
}
