import { UserLanguageNavigator } from './models';

interface Map {
  [key: string]: object | string | undefined;
}
export function isNorOrEmpty(obj: object) {
  return (
    !obj || !Object.keys(obj).some((x: string) => (obj as Map)[x] !== void 0)
  );
}

const language = window.navigator.languages?.length
  ? window.navigator.languages[0]
  : (window.navigator as UserLanguageNavigator).userLanguage ||
    window.navigator.language;

export const isRu = (lang?: string) => {
  if (!lang) {
    lang = language;
  }
  return lang == 'ru-Ru';
};
