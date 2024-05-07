import { Plugin, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import i18nextLoader from 'vite-plugin-i18next-loader';

export const AdminUIConfig = {
  title: 'Aexol Shop',
  description: 'Aexol Shop',
  logoPath: '/logo.png',
  components: [
    {
      where: 'order-create',
      name: 'custom-boolean-form-input',
    },
    {
      where: 'order-create',
      name: 'attributes-input',
      componentPath: '../../src/pages/orders/_components/CustomComponent.tsx',
    },
  ],
};

const htmlPlugin = (): Plugin => {
  return {
    name: 'html-transform',
    async transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head><script type="module">window.__ADMIN_UI_CONFIG__ = ${JSON.stringify(AdminUIConfig)}</script>`,
      );
    },
  };
};
// https://vitejs.dev/config/
export default defineConfig({
  base: '/admin-ui/',
  plugins: [
    htmlPlugin(),
    tsconfigPaths(),
    react(),
    i18nextLoader({ paths: ['./src/locales'], logLevel: 'info', namespaceResolution: 'basename' }),
  ],
});
