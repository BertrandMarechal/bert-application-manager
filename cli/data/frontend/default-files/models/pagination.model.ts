export const defaultDatabaseSize = 10;
export interface DatabasePaginationInput<T = {}> {
  filters?: T;
  from: number;
  size: number;
  direction?: string;
  sorting?: string;
}
export interface DatabasePaginationOutput<T = {}> {
  count: number;
  data?: T;
  totals: {[name: string]: number};
}
export type DatabasePaginationState = DatabasePaginationOutput | DatabasePaginationInput;