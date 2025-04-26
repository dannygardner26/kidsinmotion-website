const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Using this instead of style-loader for better production builds, but works for dev too

module.exports = {
  mode: 'development', // Set mode to development
  entry: './src/index.js', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory
    filename: 'static/js/bundle.js', // Output bundle file name
    publicPath: '/', // Ensures assets are served correctly
    clean: true, // Clean the output directory before each build
  },
  devtool: 'inline-source-map', // Good for development debugging
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve files from the public directory
    },
    compress: true,
    port: 3000, // Use port 3000 (matches backend CORS config)
    hot: true, // Enable Hot Module Replacement
    open: true, // Open the browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server address
        changeOrigin: true, // Recommended for avoiding CORS issues with backend
      },
    },
    historyApiFallback: true, // Important for single-page applications using React Router
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
          MiniCssExtractPlugin.loader, // Extracts CSS into separate files
          'css-loader' // Translates CSS into CommonJS
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
    new HtmlWebpackPlugin({
      template: './public/index.html', // Use this file as a template
      filename: 'index.html' // Output filename
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash].css', // Output CSS filename pattern
    }),
    // Add other plugins if needed
  ],
  resolve: {
    extensions: ['.js', '.jsx'], // Allow importing without specifying .js or .jsx extension
  },
};