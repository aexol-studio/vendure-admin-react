import { ITheme } from '@aexol-studio/styling-system';
import '@emotion/react';

declare module '@emotion/react' {
  export interface Theme extends ITheme {}
}
