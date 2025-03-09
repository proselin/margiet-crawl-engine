export interface Extractor<T> {
  extract(url: string): T  | Promise<T>;
}