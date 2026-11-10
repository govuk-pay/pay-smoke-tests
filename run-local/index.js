const argv = require('yargs/yargs')(process.argv.slice(2)).argv
const proxyquire = require('proxyquire').noCallThru()
const syntheticsLoggerStub = require('../stubs/syntheticsLoggerStub')
const syntheticsStub = require('../stubs/syntheticsStub')(argv.headless)

const smokeTestHelpersWithStubs = proxyquire(
  '../helpers/smoke-test-helpers.js',
  { Synthetics: syntheticsStub, SyntheticsLogger: syntheticsLoggerStub }
)

const recurringCardPaymentTestHelpersWithStubs = proxyquire(
  '../helpers/recurring-card-payment-test-helpers.js',
  {
    Synthetics: syntheticsStub,
    SyntheticsLogger: syntheticsLoggerStub,
    './helpers/agreement-test-helpers': require('../helpers/agreement-test-helpers.js'),
    '../helpers/smoke-test-helpers': smokeTestHelpersWithStubs
  }
)

const stubs = {
  SyntheticsLogger: syntheticsLoggerStub,
  Synthetics: syntheticsStub,
  '../helpers/smoke-test-helpers': smokeTestHelpersWithStubs
}

const recurringCardPaymentStubs = {
  SyntheticsLogger: syntheticsLoggerStub,
  Synthetics: syntheticsStub,
  '../helpers/smoke-test-helpers': smokeTestHelpersWithStubs,
  '../helpers/recurring-card-payment-test-helpers': recurringCardPaymentTestHelpersWithStubs
}

const ENVIRONMENTS = ['test', 'staging', 'production']
process.env.ENVIRONMENT = argv.env
process.env.WEBHOOKS_ENABLED = argv.webhooks === undefined ? false : argv.webhooks

const TESTS = {
  'make-card-payment-sandbox-without-3ds': proxyquire('../make-card-payment-sandbox-without-3ds', stubs),
  'make-recurring-card-payment-sandbox': proxyquire('../make-recurring-card-payment-sandbox', recurringCardPaymentStubs),
  'make-card-payment-stripe-with-3ds2': proxyquire('../make-card-payment-stripe-with-3ds2', stubs),
  'make-card-payment-stripe-without-3ds': proxyquire('../make-card-payment-stripe-without-3ds', stubs),
  'make-recurring-card-payment-stripe': proxyquire('../make-recurring-card-payment-stripe', recurringCardPaymentStubs),
  'make-card-payment-worldpay-with-3ds2': proxyquire('../make-card-payment-worldpay-with-3ds2', stubs),
  'make-card-payment-worldpay-with-3ds2-exemption-engine': proxyquire('../make-card-payment-worldpay-with-3ds2-exemption-engine', stubs),
  'make-recurring-card-payment-worldpay': proxyquire('../make-recurring-card-payment-worldpay', recurringCardPaymentStubs),
  'make-card-payment-worldpay-without-3ds': proxyquire('../make-card-payment-worldpay-without-3ds', stubs),
  'make-recurring-card-payment-adyen': proxyquire('../make-recurring-card-payment-adyen', recurringCardPaymentStubs),
  'cancel-card-payment-sandbox-without-3ds': proxyquire('../cancel-card-payment-sandbox-without-3ds', stubs),
  'use-payment-link-for-sandbox': proxyquire('../use-payment-link-for-sandbox', stubs),
  'notifications-sandbox': proxyquire('../notifications-sandbox', stubs)
}

if (argv.h || !argv.env || !argv.test) {
  console.log(`Options: 
  --env must be one of: ${ENVIRONMENTS}
  --test must be one of:
   ${Object.keys(TESTS)}
  [--webhooks] enable webhooks steps, default to false
  [--headless] run browser in headless mode, default to false
  `)
  process.exit(1)
}

async function runTest (testName) {
  console.log(`Running ${testName}`)
  console.log(`Webhooks steps are ${process.env.WEBHOOKS_ENABLED === 'true' ? 'enabled' : 'disabled, pass --webhooks to enable them'}`)
  try {
    await TESTS[testName].handler()
    process.exit(0)
  } catch (err) {
    console.log(`Test failed: ${err.message}`)
    process.exit(1)
  }
}

runTest(argv.test)
