export interface Extractor<T> {
  extract(...args: any[]): T | Promise<T>;
}
