import { prisma } from "@/lib/db";
import { getDeliveryCharge, DeliveryMethod } from "@/lib/constants";

/**
 * Razorpay SDK integration helpers.
 *
 * All Razorpay calls must happen server-side.
 * Keys are read from env — never sent to the client.
 */

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn("Razorpay credentials not set in environment variables.");
}

/**
 * Create a Razorpay order.
 *
 * @param amountInPaise - Amount in paise (INR subunits). E.g. ₹100 = 10000 paise.
 * @param receipt      - Your internal order reference (e.g. "knoos_order_abc123")
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  receipt: string
): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.status} ${body}`);
  }

  const order = await response.json();
  return {
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
  };
}

/**
 * Verify a Razorpay payment signature.
 *
 * Expected signature format: HMAC-SHA256 of `orderId|paymentId` using webhook secret.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require("node:crypto");
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}

/**
 * Verify Razorpay webhook payload signature.
 * Header: `X-Razorpay-Signature`
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const crypto = require("node:crypto");
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

/**
 * Calculate the total amount for an order.
 * All pricing is authoritative server-side.
 */
export async function calculateOrderTotal(cartId: string, deliveryMethod: DeliveryMethod) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { variant: true, product: true },
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryCharge = getDeliveryCharge(deliveryMethod);
  const total = subtotal + deliveryCharge;

  return { items, subtotal, deliveryCharge, total };
}
