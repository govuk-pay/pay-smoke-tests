const { ENVIRONMENT, WEBHOOKS_ENABLED } = process.env

const synthetics = require('Synthetics')
const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smoke-test-helpers')

const adyen3dsCard = {
  cardholderName: 'Test',
  cardNumber: '371449635398431',
  expiryMonth: '03',
  expiryYear: '30',
  securityCode: '737'
}

const enterCardDetailsContinueAdyen3dsAndConfirm = async function (nextUrl, cardDetails, emailAddress) {
  log.info(`Going to get page ${nextUrl}`)
  const page = await synthetics.getPage()

  const navigationPromise = page.waitForNavigation()

  await synthetics.executeStep('Goto_0', async function () {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  await page.setViewport({ width: 1920, height: 953 })

  await smokeTestHelpers.enterCardDetailsAndSubmit(page, cardDetails, emailAddress)

  await synthetics.executeStep('Click submit button on 3DS page', async function () {
    const outerIframeElement = await page.waitForSelector('iframe.iframe-3ds')
    const outerFrame = await outerIframeElement.contentFrame()

    const innerIframeElement = await outerFrame.waitForSelector('iframe[name="threeDSIframe"]')
    const innerFrame = await innerIframeElement.contentFrame()

    await innerFrame.waitForSelector('#password-input')
    await innerFrame.type('#password-input', 'password')
    await innerFrame.click('#buttonSubmit')
  })

  await navigationPromise

  await synthetics.executeStep('Click confirm', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
    await page.click('.govuk-grid-row > #main-content #confirm')
  })

  await navigationPromise
}

exports.handler = async () => {
  const provider = 'adyen'
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.CARD_ADYEN_API_TOKEN
  const publicApiUrl = secret.PUBLIC_API_URL

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, '3ds2')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)

  await enterCardDetailsContinueAdyen3dsAndConfirm(createPaymentResponse._links.next_url.href, adyen3dsCard, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
  if (WEBHOOKS_ENABLED === 'true') {
    await smokeTestHelpers.validateWebhookReceived(ENVIRONMENT, payment.payment_id)
  }
}
