export function isDefined<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}
