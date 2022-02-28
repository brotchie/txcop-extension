const path = require('path');
const process = require('process');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    inpage: path.join(__dirname, 'src', 'inpage', 'inpage.ts'),
    contentscript: path.join(
      __dirname,
      'src',
      'contentscript',
      'contentscript.ts'
    ),
    background: path.join(__dirname, 'src', 'background', 'background.ts'),
    popup: path.join(__dirname, 'src', 'popup', 'index.tsx'),
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'dist'),
          force: true,
          transform: function (content, path) {
            return content;
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup', 'index.html'),
      filename: 'popup.html',
      // This will include popup.js as a <script> in <head>.
      chunks: ['popup'],
      cache: false,
    }),
  ],
};

module.exports = options;
