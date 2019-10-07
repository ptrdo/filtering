const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "development",
  entry: {
    main: ["./js/app.js"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ]
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    alias: {
      config: path.resolve(__dirname, "js/config.js"),
      postette: path.resolve(__dirname, "./node_modules/postette/postette.js"),
      filtering: path.resolve(__dirname, "../filtering.js")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new CopyWebpackPlugin(
      [
        {
          from: "data",
          to: "data/[path][name].[ext]"
        }
      ],
      {
        copyUnmodified: true,
      }
    )
  ],
  output: {
    path: __dirname + "/build",
    publicPath: "/",
    filename: "bundle.js"
  },
  devServer: {
    contentBase: "./build",
    port: 8080
  }
};