# Product flow

This document describes the lifecycle of an Etvas product from the (external) provider perspective. It links the customer and automatic actions with various events and recommends the logical actions that must be taken in order to have a correct customer and product management, keeping in sync the Etvas and external information.

For a clear image, the document describes the discrete events emitted by Etvas and how they should be managed by an external provider. Each event is associated with the customer or the automatic action.

### A word about Pricing model

The pricing model for a product can have three configurations.

**Subscription based**
This configuration is the most common one and it means the customer buys the product and it will be billed recurrently at a specific period of time. As long as the initial and the recurring payment are successful, the customer is able to use the product. While the subscription is active, the product cannot be bought by the same customer again.

**One Time Payment - Limited period**
This option refers to products that can be bought once and, after a certain period, it will automatically expire and the product can be bought again. In the limited period, the product cannot be bought by the same customer again.

**One Time Payment - Lifetime**
This option refers to products that can be bought only once. The product never expires and cannot be bought again by the same customer.

## Introduction

The product flow starts when the purchase succeeds. This is the moment when the product is alive and the customer must be able to use it.

If the product has One time payment - Lifetime pricing model, the customer must be able to use it as long as the customer account is active with Etvas.

If the product has One time payment - Limited period pricing model, the customer must be able to use it as long as the period is active and the customer account with Etvas is active. The limited period is computed from the moment the user initially bought the product like so: if the period is specified in days, the limited period is computed by adding the number of days to the initial purchase moment; if the period is specified in months, the limited period ill end in the same day of the month as the purchase moment. For example, if the customer buys a product on March 23rd, and the limited period is three months, the customer can use the product until May 23rd. Special cases are handled for dates like February 29th and 30 / 31 days months.

If the product is subscription based, the customer must be able to use the product immediately after the first payment (the purchase). When the subscription interval is due (for example after one month), the system will automatically try to debit the customer's card. If this isn't possible (expired card, insufficient funds), the system will continue to automatically try for **five** days. In these five days, the customer is able to continue to use the product. If the conditions haven't changed after five days and the system could not debit the customer's card, the product enters a **suspended** status, in which the customer is not able to use the product.

The **suspended** status can be resumed if the customer takes action to re-activate the product by visiting the Etvas Customer Portal and fixes the problem with the card by entering another payment method. In this case, the product will immediately be **resumed** and the customer is able to use it again.

The customer can also cancel a subscription based product at any time, by visiting the Account section and specifically clicking the Cancel button for a purchased, subscription based product. In this case, the customer is able to continue to use the product until the next payment would have been due. At that specific moment, the system will automatically cancel the product.

For example, a product with monthly recurring subscription is bought by a customer on March 23rd at 10:00 AM. On March 28th, the customer cancels the subscription for that product. The customer will be able to use the product until April 23rd, 9:59AM. Please note this example is an approximation, the actual process involves network times, processing times and timeouts, which will render impossible to know exactly the time at which the customer is not able to use the product anymore.

There are two situations though, when a subscription based product is cancelled immediately: when the customer takes action to delete the Etvas account **or** when a Partner decides to remove the product from the marketplace.

## Event system

For each change in the subscription status of a product, an event is emitted by Etvas Platform. The event is in the form of a webhook call, containing the event name and additional metadata.

In order to _listen_ for these events, the Etvas App must _subscribe_ to whatever events it needs in order to function properly. This action is performed in [Partners Portal](https://partners.helloetvas.com), Developers section, where you can specify an URL and include one or more events. All events will be _announced_ to the URL you specify.

#### Receiving an event

Receiving an event means having a handler for a `POST` request on the URL you specified. The `POST` request is JSON encoded and it has a body which contains the event name and additional information (metadata).

#### Responding to an event

The Etvas Event system has an automatic **retry** system which kicks in as long as the response to the POST request is considered an error.

If the Etvas App had completed the necessary operations to handle the event, it **should respond with a 2xx status code** to indicate a success.

Otherwise, it **should respond with a 4xx or 5xx status code** to indicate failure. The Etvas Event System will retry `POST`-ing the same event every 4 hours, for 5 more times (a total of 24 hours before aborting the retry mechanism).

### Product Purchase Succeeded

> event name: `purchase.succeeded`

This is the first emitted event. The customer must be able to use the product right away. It means that:

- the customer must be able to use the product;
- the invoice was emitted;
- the payment (the first payment in case of subscription) was finalized successfully and the customer's credit card was successfully debited;
- the email with attached invoice and product Terms And Conditions was sent to the customer;

### Product Purchase Renewed

> event name: `purchase.renewed`

This event is emitted when a subscription to a purchased product has been successfully renewed, the customer card has been debited and a new billing cycle started. The customer is to be able to continue use the product (normal flow).

### Product Purchase Suspended

> event name: `purchase.suspended`

When a recurring billing cycle could not be successfully finished (the customer card could not be debited), the payment gateway will retry debiting the customer card for another five days. The event is received right after the last failed retry attempt.

The product use is suspended. However, no customer information is to be deleted at this point, because the customer can take action and resume the subscription at a later time.

### Product Purchase Resumed

> event name: `purchase.resumed`

The event is received for a purchase that was previously suspended and the customer sorted out the payment problems, so a successful payment has gone through and the customer card was debited.

The customer should be able to immediately use the product and all the information previously stored to be available.

### Product Purchase Will Cancel At

> event name: `purchase.cancel_scheduled`

When a customer cancels a recurring subscription, the purchased product will still be available until the end of the current billing cycle. This event is sent at the moment the customer has chosen to cancel the subscription.The metadata information contains the date when the purchase will be canceled. Until that date, normal product use must be available for the customer.

### Product Purchase Cancelled

> event name: `purchase.canceled`

This event can occur in multiple scenarios.

**Scenario 1** - after a scheduled cancellation. The event is received when the purchase was scheduled for cancellation and the due date is now (`purchase.cancel_scheduled` was emitted in the past).

**Scenario 2** - when a purchase is in suspended status (the event `purchase.suspended` was emitted in the past) and the customer choses to cancel rather than resuming the subscription.

**Scenario 3** - right before a `user.deleted` event when all the active subscriptions are immediately canceled.

**Scenario 4** - when the product is unpublished from a partner's marketplace, all existing purchases for that product are immediately canceled.

In all scenarios, the customer information is to be deleted. A new purchase, by the same customer, for the same product, can occur at a later time.

### Product Purchase Trial Ended

> event name: `purchase.trial_ended`

This event occurs when a product with a trial period was purchased and that trial period has just ended. The customer card is expected to be debited. The automatic payment system will issue an invoice (draft) and will try to debit the customer card within the next **hour**. If not successful, it will fallback to the **five days** period when it repeatedly tries to debit the customer card.

**Warning**: Receiving this event **does not mean** the payment has been successfully charged yet.

### Product Purchase Expired

> event name: `purchase.expired`

This event occurs when a fixed-time purchase was configured for the product and the expiration date is due. The customer is not able to use the product anymore and the information stored should be deleted.

A new purchase, by the same customer and for the same product, can be performed at a later time.

### User Updated

This event occurs when one or more pieces of information within Etvas Customer Profile has changed.

### User Deleted

This event occurs when the customer requested an Account Deletion procedure, meaning all the customer information is to be deleted (GDPR compliance).

## Important notes

All the `POST` requests are signed by Etvas Platform. The signatures verification can be performed either via `etvas-sdk` (if you are using NodeJS) or implementing the signature verification algorithm described in a separate document. You can find the key for events signature verification in your account on [Partners Portal](https://partners.helloetvas.com), Developers, Signing Secret.
