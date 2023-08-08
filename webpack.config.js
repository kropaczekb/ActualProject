const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const SveltePreprocess = require('svelte-preprocess')
const Autoprefixer = require('autoprefixer')

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: '/app/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
    // publicPath: '/public/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.svelte$/,
        use: {
            loader: 'svelte-loader',
            options: {
              preprocess: SveltePreprocess({
							scss: true,
							sass: true,
							postcss: {
								plugins: [
									Autoprefixer
								]
							}
						})}
        },
      },
      			// Rule: SASS
			{
				test: /\.(scss|sass)$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader
					},
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									Autoprefixer
								]
							}
						}
					},
					'sass-loader'
				]
			},
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
        ],
      },
      {
        test: /\.(jpg|jpeg|png|svg)$/,
        use: 'file-loader',
      },
    ]
  },
  resolve: {
    fallback: {
      "fs": false
    },
    extensions: ['*', '.js', '.jsx', '.mjs', '.svelte'],
  },
  plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.resolve(__dirname, 'src/template.html'),
            // inject: false,
            title: 'Actual Project',
        }),
        new MiniCssExtractPlugin(),
        new NodePolyfillPlugin(),
        new Dotenv(),
    ],
}
