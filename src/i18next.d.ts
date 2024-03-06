import resources from '@/@types/resources';
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources;
  }
}
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'web-comp': { [key: string]: string };
    }
  }
}
