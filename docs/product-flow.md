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

### At a glance

The product flow starts when the purchase succeeds. This is the moment when the product is alive and the customer must be able to use it. If the product has recurring payments **and** the subscription interval is due **and** the payment **does not** goes through, the product subscription will be suspended and the user cannot use the product. If the payment succeeds at a later time, the subscription will be resumed and the customer is able to use the product again. The product subscription can be canceled at any time by the customer by cancelling the specific subscription or when the user deletes the account. Please refer to the specific section for details.

## Purchase succeeded

This is the first emitted event and it means:

- the invoice was emitted;
- the payment (the first payment in case of subscription) was finalized successfully, the customer's credit card was successfully debited;
- the email with attached invoice and product Terms And Conditions was sent to customer;

This is usually the moment when the customer is also created in the
