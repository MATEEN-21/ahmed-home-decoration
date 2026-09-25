import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Lightweight console cleaner for preview environments.
 * Prevents noisy Vite WebSocket disconnection notices while leaving all native APIs untouched.
 */
function cleanConsolePlugin(): Plugin {
  return {
    name: 'clean-console',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `
            (function() {
              if (typeof window === 'undefined') return;
              var origError = console.error;
              var origWarn = console.warn;
              function shouldFilter(msg) {
                if (typeof msg === 'string') {
                  return (
                    msg.indexOf('failed to connect to websocket') !== -1 ||
                    msg.indexOf('[vite] server connection lost') !== -1
                  );
                }
                return false;
              }
              console.error = function() {
                if (arguments.length > 0 && shouldFilter(arguments[0])) return;
                return origError.apply(console, arguments);
              };
              console.warn = function() {
                if (arguments.length > 0 && shouldFilter(arguments[0])) return;
                return origWarn.apply(console, arguments);
              };
            })();
          `,
        },
      ];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cleanConsolePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in the preview environment to prevent WebSocket connection errors
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
