import Stripe from "stripe";

// Stripe runs in TEST mode. Provide STRIPE_SECRET_KEY (sk_test_...) in .env.
// When absent, the app still runs — checkout routes return a friendly error
// so the rest of the dynamic portal is fully usable without keys.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-09-30.acacia" })
  : null;

export const stripeEnabled = () => stripe !== null;
