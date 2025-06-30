export type ActionHandlerMap = {
  [key: string]: () => void;
};

export function getClickHandler(key: string, map: ActionHandlerMap): () => void {
  return map[key] || (() => {});
}
