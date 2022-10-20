const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    host: "0.0.0.0",
    port: 8000,
    static: {
      directory: path.join(__dirname, 'dist'),
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static' },
      ],
    }),
  ],
};
