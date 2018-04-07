let _ = require("lodash");
let webpack = require("webpack");
let path = require("path");
var LiveReloadPlugin = require("webpack-livereload-plugin");

let babelOptions = {
  presets: "es2015",
};

function isVendor(module) {
  return module.context && module.context.indexOf("node_modules") !== -1;
}

let entries = {
  index: "./src/index.ts",
};

module.exports = {
  entry: entries,
  output: {
    filename: "quiz.js",
    path: path.resolve(__dirname, "dist"),
    library: "MathQuiz",
    libraryTarget: "var",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: babelOptions,
          },
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: babelOptions,
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader", // creates style nodes from JS strings
          },
          {
            loader: "css-loader", // translates CSS into CommonJS
          },
          {
            loader: "sass-loader", // compiles Sass to CSS
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new LiveReloadPlugin({
      hostname: "localhost",
      port: 8000,
    }),
  ],
};
