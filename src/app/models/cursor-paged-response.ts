export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor?: string | null;
  totalCount?: number | null;
  withEmailCount?: number | null;
  withPhoneCount?: number | null;
}
