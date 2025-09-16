const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Using this instead of style-loader for better production builds, but works for dev too

// Load environment variables
require('dotenv').config();

module.exports = {
  mode: 'development', // Set mode to development
  entry: './src/index.js', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory
    filename: 'static/js/[name].js', // Output bundle file name
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
    port: 3001, // Use port 3001 (matches backend CORS config)
    hot: true, // Enable Hot Module Replacement
    open: true, // Open the browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server address
        changeOrigin: true, // Recommended for avoiding CORS issues with backend
      },
    },
    historyApiFallback: true, // Important for single-page applications using React Router
    devMiddleware: {
      index: false, // Disable serve-index middleware to prevent URI malformed errors
    },
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
           filename: 'static/media/[name][hash][ext]'
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
};
