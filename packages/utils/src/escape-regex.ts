// https://stackoverflow.com/a/6969486/14190818
export function escapeRegExp(str: string) {
  // $& means the whole matched string
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
