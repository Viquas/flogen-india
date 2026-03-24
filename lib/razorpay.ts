import Razorpay from 'razorpay'

const mode = process.env.RAZORPAY_MODE || 'test'
const isTestMode = mode === 'test'

const keyId = isTestMode
    ? process.env.RAZORPAY_TEST_KEY_ID
    : process.env.RAZORPAY_LIVE_KEY_ID

const keySecret = isTestMode
    ? process.env.RAZORPAY_TEST_KEY_SECRET
    : process.env.RAZORPAY_LIVE_KEY_SECRET

const webhookSecret = isTestMode
    ? process.env.RAZORPAY_TEST_WEBHOOK_SECRET
    : process.env.RAZORPAY_LIVE_WEBHOOK_SECRET

if (!keyId) {
    throw new Error(
        `Missing Razorpay key_id for ${mode} mode. ` +
        `Set ${isTestMode ? 'RAZORPAY_TEST_KEY_ID' : 'RAZORPAY_LIVE_KEY_ID'} in your environment.`
    )
}

if (!keySecret) {
    throw new Error(
        `Missing Razorpay key_secret for ${mode} mode. ` +
        `Set ${isTestMode ? 'RAZORPAY_TEST_KEY_SECRET' : 'RAZORPAY_LIVE_KEY_SECRET'} in your environment.`
    )
}

export const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
})

export const isRazorpayTestMode = isTestMode

export const razorpayWebhookSecret = webhookSecret || ''

/** Returns the public key for the current mode (server-side use, pass to client via props). */
export function getRazorpayPublicKey(): string {
    const publicKey = isTestMode
        ? process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID
        : process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID
    return publicKey || ''
}
