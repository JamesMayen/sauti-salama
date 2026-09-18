# SMS Communication Layer

Sauti Salama SMS uses a provider abstraction behind `backend/src/services/smsService.js`.

## Providers

- `SMS_PROVIDER=mock`: persists messages as `simulated`; no physical SMS is delivered.
- `SMS_PROVIDER=africastalking`: uses the Africa's Talking Sandbox or configured environment when backend credentials are present.

Africa's Talking Sandbox is a testing environment. Production delivery in South Sudan requires a provider with an available South Sudan route and approved credentials.

## Environment

Backend-only variables:

```text
SMS_PROVIDER=mock
AT_USERNAME=
AT_API_KEY=
AT_SENDER_ID=
AT_ENVIRONMENT=sandbox
SMS_WEBHOOK_SECRET=
```

Never expose these through Vite or frontend environment variables.

## Statuses

- `queued`: stored before provider processing
- `simulated`: mock provider result
- `sent`: provider accepted the message
- `delivered`: delivery confirmed by a provider callback, when implemented
- `failed`: provider or configuration failure

`sent` does not mean `delivered`.

The optional `POST /api/sms/webhooks/delivery` endpoint is prepared for a
provider callback. It requires the backend-only `SMS_WEBHOOK_SECRET` header
and is not active for any provider until configured.

## Safety boundaries

Report acknowledgement and authorized report-status SMS contain no report body or sensitive identity details. Alert SMS requires an authenticated admin/moderator action and a published alert. Alert creation does not automatically send SMS. Verification notification support is opt-in and is not automatically triggered because verification requests do not store a phone number.
