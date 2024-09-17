interface Map {
  [key: string]: object | string | undefined;
}
export function isNorOrEmpty(obj: object) {
  return (
    !obj || !Object.keys(obj).some((x: string) => (obj as Map)[x] !== void 0)
  );
}
