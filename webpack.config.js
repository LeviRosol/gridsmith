import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import WorkboxPlugin from 'workbox-webpack-plugin';
import Dotenv from 'dotenv-webpack';

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';


/** @type {import('webpack').Configuration[]} */
const config = [
  {
    entry: './src/index.tsx',
    devtool: isDev ? 'source-map' : 'nosources-source-map',
    mode: isDev ? 'development' : 'production',
    target: 'web',
    // devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.mdx$/,
          use: [
            {
              loader: '@mdx-js/loader',
              options: {
                providerImportSource: '@mdx-js/react',
              },
            },
          ],
        },
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                moduleResolution: 'node',
                target: 'ES2022',
                lib: ['WebWorker', 'ES2022'],
                sourceMap: isDev,
                inlineSources: isDev
              }
            }
          },
          exclude: /node_modules/,
        },
        {
          // PrimeIcons @font-face uses relative ./fonts/... URLs; with style-loader those
          // resolve against the document path, so nested routes (e.g. /tile-details/slug)
          // break. Resolving URLs here emits /fonts/... via publicPath below.
          test: /\.(woff2?|eot|ttf|svg)$/i,
          issuer: /node_modules[\\/]primeicons[\\/]/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
        {
          test: /\.css$/i,
          oneOf: [
            {
              include: /node_modules[\\/]primeicons/,
              use: [
                'style-loader',
                {
                  loader: 'css-loader',
                  options: { url: true },
                },
              ],
            },
            {
              use: [
                'style-loader',
                {
                  loader: 'css-loader',
                  options: { url: false },
                },
              ],
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.mdx', '.js'],
    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
    },
    devServer: {
      setupMiddlewares: (middlewares) => {
        // After `npm run build`, prerendered dist/blog/*.html would shadow the SPA on /blog in dev.
        if (isDev) {
          middlewares.unshift({
            name: 'gridsmith-dev-blog-spa-fallback',
            middleware: (req, _res, next) => {
              const urlPath = (req.path ?? req.url ?? '').split('?')[0].replace(/\/+$/, '') || '/';
              if (urlPath === '/blog' || /^\/blog\/[^/]+$/.test(urlPath)) {
                const prerendered = path.join(__dirname, 'dist', urlPath.slice(1), 'index.html');
                if (fs.existsSync(prerendered)) {
                  req.url = '/index.html';
                }
              }
              next();
            },
          });
        }
        return middlewares;
      },
      // Serve gallery and tile-pack JSON from source `public/` during dev (no rebuild wait).
      static: [
        {
          directory: path.join(__dirname, 'public', 'tile-pack-gallery'),
          publicPath: '/tile-pack-gallery',
          watch: true,
        },
        {
          directory: path.join(__dirname, 'public', 'tile-packs'),
          publicPath: '/tile-packs',
          watch: true,
        },
        path.join(__dirname, 'dist'),
      ],
      compress: true,
      port: 4000,
      historyApiFallback: true,
    },
    plugins: [
      // Load .env and inject process.env.COGNITO_* (and any other process.env.X used in code) into the bundle
      new Dotenv({
        path: path.resolve(__dirname, '.env'),
        systemvars: true,
        // CI/checkout often has no local `.env`; don't fail or spam warnings for a file we gitignore.
        silent: true,
      }),
      new webpack.EnvironmentPlugin({
        'process.env.NODE_ENV': process.env.NODE_ENV ?? 'development',
        'process.env.CI': process.env.CI ?? 'false',
        'process.env.GRIDSMITH_TEST_HOOK': process.env.GRIDSMITH_TEST_HOOK ?? 'false',
        'process.env.GRIDSMITH_API_BASE_URL': process.env.GRIDSMITH_API_BASE_URL ?? '',
      }),
      ...(process.env.NODE_ENV === 'production' ? [
        new WorkboxPlugin.GenerateSW({
          exclude: [
            /(^|\/)\./,
            /\.map$/,
            /^manifest.*\.js$/,
          ],
          // these options encourage the ServiceWorkers to get in there fast
          // and not allow any straggling 'old' SWs to hang around
          swDest: path.join(__dirname, 'dist', 'sw.js'),
          maximumFileSizeToCacheInBytes: 200 * 1024 * 1024,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [{
            urlPattern: ({ request, url }) => true,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'all',
              expiration: {
                maxEntries: 1000,
                purgeOnQuotaError: true,
              },
            },
          }],
        }),
      ] : []),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public'),
            toType: 'dir',
          },
          {
            from: path.resolve(__dirname, 'src/wasm/openscad.js'),
            to: path.resolve(__dirname, 'dist'),
          },
          {
            from: path.resolve(__dirname, 'src/wasm/openscad.wasm'),
            to: path.resolve(__dirname, 'dist'),
          },
        ],
      }),
    ],
  },
  {
    entry: './src/runner/openscad-worker.ts',
    output: {
      filename: 'openscad-worker.js',
      path: path.resolve(__dirname, 'dist'),
      globalObject: 'self',
      // library: {
      //   type: 'module'
      // }
    },
    devtool: isDev ? 'source-map' : 'nosources-source-map',
    mode: 'production',
    // mode: isDev ? 'development' : 'production',
    target: 'webworker',
    // experiments: {
    //   outputModule: true,
    // },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                moduleResolution: 'node',
                target: 'ES2022',
                lib: ['WebWorker', 'ES2022'],
                sourceMap: isDev,
                inlineSources: isDev
              }
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.wasm$/,
          type: 'asset/resource'
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.mjs', '.wasm'],
      modules: [
        path.resolve(__dirname, 'src'),
        'node_modules'
      ],
      fallback: {
        fs: false,
        path: false,
        module: false
      }
    },
    externals: {
      'browserfs': 'BrowserFS'
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        'process.env.NODE_ENV': process.env.NODE_ENV ?? 'development',
        'process.env.CI': process.env.CI ?? 'false',
        'process.env.COGNITO_DOMAIN': process.env.COGNITO_DOMAIN ?? '',
        'process.env.COGNITO_REGION': process.env.COGNITO_REGION ?? '',
        'process.env.COGNITO_CLIENT_ID': process.env.COGNITO_CLIENT_ID ?? '',
        'process.env.COGNITO_REDIRECT_URI': process.env.COGNITO_REDIRECT_URI ?? '',
        'process.env.COGNITO_LOGOUT_URI': process.env.COGNITO_LOGOUT_URI ?? '',
      }),
    ],
  },
];

export default config;
