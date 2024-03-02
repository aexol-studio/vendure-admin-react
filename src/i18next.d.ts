import resources from '@/@types/resources';
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources;
  }
}
