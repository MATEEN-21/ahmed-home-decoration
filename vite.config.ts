import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Ensures Vite HMR in development does not leak unhandled promise rejections
 * when running behind reverse proxies, container preview frames, or when WebSockets close.
 */
function safeHmrPlugin(): Plugin {
  return {
    name: 'safe-hmr',
    apply: 'serve',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return code.replace(
          /throw e;/g,
          '/* prevented unhandled rejection for development websocket */'
        );
      }
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `
            (function() {
              if (typeof window === 'undefined') return;
              window.addEventListener('unhandledrejection', function(event) {
                var reason = event && event.reason;
                var msg = reason && (reason.message || (typeof reason === 'string' ? reason : ''));
                if (typeof msg === 'string' && msg.indexOf('WebSocket closed without opened') !== -1) {
                  event.preventDefault();
                }
              });
            })();
          `,
        },
      ];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), safeHmrPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

