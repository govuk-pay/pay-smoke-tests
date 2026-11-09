// Webpack Path
const path = require('path')

// Webpack Externals
const awsExternals = require('webpack-aws-externals')
const nodeExternals = require('webpack-node-externals')

// Webpack Plugins
const ZipPlugin = require('zip-webpack-plugin')

function singleModule (moduleName) {
  return {
    name: moduleName,
    context: path.resolve(__dirname, moduleName),
    entry: './index.js',
    externals: [awsExternals(), nodeExternals(), 'Synthetics', 'SyntheticsLogger'],
    mode: 'none',
    output: {
      filename: './' + moduleName + '/index.js',
      libraryTarget: 'commonjs'
    },
    plugins: [
      new ZipPlugin({
        path: './zip',
        filename: moduleName,
        pathMapper: function (assetPath) {
          return 'nodejs/node_modules/index.js'
        },
        include: [/\.js$/]
      })
    ],
    resolve: {
      modules: ['../node_modules'],
      symlinks: false
    },
    target: 'node'
  }
}

module.exports = [
  singleModule('cancel-card-payment-sandbox-without-3ds'),
  singleModule('make-card-payment-sandbox-without-3ds'),
  singleModule('make-recurring-card-payment-sandbox'),
  singleModule('make-card-payment-stripe-with-3ds2'),
  singleModule('make-card-payment-stripe-without-3ds'),
  singleModule('make-card-payment-worldpay-with-3ds2'),
  singleModule('make-card-payment-worldpay-with-3ds2-exemption-engine'),
  singleModule('make-card-payment-worldpay-without-3ds'),
  singleModule('make-recurring-card-payment-worldpay'),
  singleModule('make-recurring-card-payment-stripe'),
  singleModule('make-recurring-card-payment-adyen'),
  singleModule('notifications-sandbox'),
  singleModule('use-payment-link-for-sandbox')
]
