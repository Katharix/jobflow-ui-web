export type ActionHandlerMap = Record<string, () => void>;

export function getClickHandler(key: string, map: ActionHandlerMap): () => void {
  return map[key] || (() => undefined);
}
