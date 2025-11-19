const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Using this instead of style-loader for better production builds, but works for dev too

// Load environment variables based on NODE_ENV
const dotenv = require('dotenv');
const fs = require('fs');

// Determine which .env file to load
// Check if webpack is running in production mode - improved detection
const isProduction = process.argv.includes('--mode=production') ||
  (process.argv.includes('--mode') && process.argv[process.argv.indexOf('--mode') + 1] === 'production') ||
  process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.development';

// Load the appropriate env file
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`Loaded environment from: ${envFile}`);
} else {
  dotenv.config(); // Fallback to default .env
  console.log('Loaded default .env file');
}

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory
    filename: 'static/js/[name].js', // Output bundle file name without hash
    chunkFilename: 'static/js/[name].chunk.js', // Chunk files for code splitting
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
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
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
      'process.env': JSON.stringify(process.env)
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html', // Use this file as a template
      inject: true, // Auto inject scripts and CSS
      filename: 'index.html',
      cache: false, // Disable caching to ensure fresh builds
      hash: false, // Let contenthash handle versioning
      minify: false // Disable minification in dev mode
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
