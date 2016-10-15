const cleanPlugin = require('clean-webpack-plugin');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    context: path.join(__dirname, 'app'),
    entry: './index.js',
    output: {
        filename: 'main.js',
        path: __dirname + '/dist'
    },
    watch: true,
    // Add this property to run watcher with vagrant
    watchOptions: {
        poll: true
    },
    resolve: {
        alias: {
            'npm': __dirname + '/node_modules',
            'bower': __dirname + '/bower_components',
        }
    },
    resolveLoader: {
        root: __dirname + '/node_modules'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['babel-preset-es2015'].map(require.resolve)
                }
            },
            { test: /\.css$/, loader: 'style-loader!css-loader'}/*,
            {
                test: /\.html$/,
                loader: 'ngtemplate?relativeTo=' + path.resolve(__dirname, '../app') + '/!html'
            }*/
            /*{ test: /vendors\/.+\.js$/,
                loader: 'imports?jQuery=jquery,$=jquery,this=>window'
            }*/
        ]
    },
    plugins: [
        new cleanPlugin(['dist']),
        new ngAnnotatePlugin({
            add: true
        }),/*,
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            mangle: false,
            compress: {
                warnings: true
            }
        })*/
        new webpack.ProvidePlugin({
            d3: 'd3'
        })
    ]
};