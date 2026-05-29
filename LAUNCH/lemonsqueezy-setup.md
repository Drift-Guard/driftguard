# Lemon Squeezy + DriftGuard

Store: _______________
Store slug: _______________

## Products

| Plan | Variant ID | Checkout URL |
|------|------------|--------------|
| Pro ($19/mo) | | |
| Team ($49/mo) | | |
| Founding Pro ($15/mo) | | |

## Environment variables (copy to Render/Fly)

```env
LEMONSQUEEZY_STORE_SLUG=
LEMONSQUEEZY_VARIANT_PRO=
LEMONSQUEEZY_VARIANT_TEAM=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

## Webhook URL

```
https://YOUR_DOMAIN/api/webhooks/lemonsqueezy
```

Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired, subscription_payment_success

## Test card (Lemon Squeezy test mode)

Use Lemon Squeezy's test mode — see their docs for test card numbers.

## After first sale

Customer email → webhook → API key issued. Verify:

```bash
curl -H "Authorization: Bearer dg_..." https://YOUR_DOMAIN/api/me
```
