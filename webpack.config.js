const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  // Fix the entry path to point to the kidsinmotion directory
  entry: path.resolve(__dirname, 'src/main/webapp/js/index.js'),
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'src/main/webapp/static'),
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: path.resolve(__dirname, 'src/main/webapp/index.html'), 
          to: 'index.html',
          noErrorOnMissing: true 
        },
        { 
          from: path.resolve(__dirname, 'src/main/webapp/img'), 
          to: 'img',
          noErrorOnMissing: true 
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'src/main/webapp/static')
    },
    port: 3000,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
};