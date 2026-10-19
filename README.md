<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a4698005-cc8e-435f-9464-587892db27a5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Support and Payments

- To use Crisp instead of the built-in support chat, set `VITE_CRISP_WEBSITE_ID` to the website ID from Crisp. Leave it unset to keep the built-in chat.
- Card balance top-ups currently create a pending demo request. Production PayTR or iyzico payments require a server-side checkout endpoint and a verified provider webhook; never put merchant secrets or card processing logic in this frontend.
- SMS OTP is not enabled yet. Production registration and withdrawals must be gated by a server-verified phone challenge (for example, Firebase Phone Auth or an SMS provider endpoint); a phone number entered in the profile is not proof of ownership.
- The localStorage-backed demo store is for preview only and is not an authoritative ledger for production balances, orders, or withdrawals.
- Admin request alerts, stock checks, and the configurable buy-budget pool run in the demo store. Production deployments must enforce stock and budget reservations atomically in a trusted backend/Firestore transaction to prevent concurrent requests from overspending.
