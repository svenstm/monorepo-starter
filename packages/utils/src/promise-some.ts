export async function promiseSome<T>(arr: T[], cb: (value: T) => Promise<boolean>) {
  for (let e of arr) {
    if (await cb(e)) return true;
  }

  return false;
}
