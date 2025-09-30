const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Using this instead of style-loader for better production builds, but works for dev too

// Load environment variables
require('dotenv').config();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
  mode: argv.mode || 'development', // Use the mode from command line or default to development
  entry: './src/index.js', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory
    filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/[name].js', // Add hash for cache busting in production
    chunkFilename: isProduction ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js', // Chunk files for code splitting
    publicPath: '/', // Ensures assets are served correctly
    clean: true, // Clean the output directory before each build
  },
  devtool: 'inline-source-map', // Good for development debugging
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve files from the public directory
      serveIndex: false, // Disable directory listing
    },
    compress: true,
    port: 3000, // React port
    hot: true, // Enable Hot Module Replacement
    open: true, // Open the browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server address
        changeOrigin: true, // Recommended for avoiding CORS issues with backend
      },
    },
    historyApiFallback: true, // Important for single-page applications using React Router
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use((req, res, next) => {
        if (req.url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
        next();
      });
      devServer.app.use((err, req, res, next) => {
        if (err instanceof URIError) {
          console.warn('URI malformed error caught and ignored:', err.message);
          res.status(400).send('Bad Request');
          return;
        }
        next(err);
      });
      return middlewares;
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Target JavaScript and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Use Babel loader
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'] // Use specified presets
          }
        }
      },
      {
        test: /\.css$/, // Target CSS files
        use: [
          'style-loader', // Inject CSS into the DOM
          'css-loader', // Translates CSS into CommonJS
          'postcss-loader' // Process CSS with PostCSS (includes Tailwind)
        ],
      },
      // Add loaders for other file types if needed (e.g., images, fonts)
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
           filename: 'static/media/[name][ext]'
        }
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({
        NODE_ENV: argv.mode || 'development',
        REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
        REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
        REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
        REACT_APP_ENABLE_FIRESTORE_SYNC: process.env.REACT_APP_ENABLE_FIRESTORE_SYNC
      })
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html', // Use this file as a template
      inject: true, // Auto inject scripts and CSS
      filename: 'index.html',
      cache: false, // Disable caching to ensure fresh builds
      hash: false, // Let contenthash handle versioning
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false
    }),
    // Add other plugins if needed
  ],
  resolve: {
    extensions: ['.js', '.jsx'], // Allow importing without specifying .js or .jsx extension
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          chunks: 'all',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
  },
  };
};
