import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(secretKey: string): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function resetStripeClientForTests() {
  stripeClient = null;
}
