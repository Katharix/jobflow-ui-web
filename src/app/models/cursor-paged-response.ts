export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor?: string | null;
  totalCount?: number | null;
}
