# Sending Emails

## Abstract

Due to the flexibility of ETVAS Ecosystem, a product purchase can happen in various portals. The specific branding must be used for all outgoing emails, so the customer can have an unified experience.

This goal is achieved by a concept named `context`. The wording was chosen based on the **context of the purchase**, an abstract environment uniquely identified by an UUID. The UUID corresponds to a rather large list of information, including:

- the purchased product
- the _location_ from where the product was purchased
- the _owner_ (provider) of the product
- the customer profile

## Concerns

Etvas will not accept advertising emails to be sent to the customers. The communication should be resumed to events strictly related to the purchased product.

Etvas recommends:

- sending reminder messages - for example, a Call To Action for updating the information related to actually using the product, or signalling missing data
- sending alerts - for example, an alert regarding a data fragment with an expiration date
- sending announcements - for example, a message informing the customer about a new feature hers/his purchased product supports

Etvas forbids:

- sending marketing campaigns regarding new products, even ones related to the purchased product
- sending messages inviting customers to try other products, or even beta releases for the same product they already purchased

Etvas does not recommend:

- sending emails containing links outside the [defined variables](#variables)
- sending emails containing hello messages - they are already covered by Etvas messaging system
- sending emails regarding purchase status (payments, subscriptions) - they are already covered by Etvas messaging system

## Variables

**The context is the only thing you need to send an email to a customer**. When sending an email, you have at your disposal a set of variables that will get processed and replaced with the appropriate values.

> **Note**: The variables will be replaced in both subject and message body.

The variables are:

- `#user_first_name` - the customer's first name
- `#user_last_name` - the customer's last name
- `#product_name` - the product name
- `#portal_url` - the URL for the portal from which the product was purchased
- `#product_use_url` - the direct link URL for launching the product

## Branding and Styling

Your message body can (and is recommended to) include HTML markup. Your message will be inline-styled (for maximum compatibility with the email clients out there), based on the following classes:

- `title` - a center-aligned title
- `text` - normal paragraph text
- `card_grey` - a greyish card with rounded corners and padding
- `card-text_grey` - a text easily visible inside the card_grey
- `card-text_black` - a bolded text visible inside the card_grey
- `button_accent` - an accent button (used for Call To Action)
- `link` - a link styled with the accent color and underline
- `separator` - a 40px height div used to separate sections

## API

Let's dive right in:

```
POST HTTP/1.1 {baseURL}/user/notify
Accept: application/json
Content-Type: application/json
x-etvas-context: _uuid_of_the_etvas_context_
x-signature: _signature_of_the_request
x-api-key: _etvas_supplied_API_key_

--
{
  "locale": "en",
  "subject": "Hello #user_first_name",
  "message": "<h1 class="title">Dear #user_first_name #user_last_name,</h1><p>Your last visit was more than one month ago. Please update your documents on <a href="#product_use_url">#product_name</a> in order to maintain an up-to-date status on your assets.</p>"
}
```

An OK response will be in the form:

```
HTTP/1.1 204 No-Content
```

Where:

- `x-etvas-context` - is the UUID of the purchase context - must be in header
- `x-signature` - is an [HMAC signature](#signature) you must compute
- `x-api-key` - a string representation of an API key supplied by Etvas; each product has it's own API key.
- `locale` can be on of supported Etvas I18N languages, in two letter code format. Currently, Etvas supports `en` and `de`. If the `locale` parameter is invalid, it will fallback to `en`.
- `subject` - the subject of the email message
- `message` - the body fragment of the message which will be included in the branded template corresponding to the purchase context.

### Signature

In order to secure the ReST endpoint, a signature is required. The signature is a `HMAC` / `SHA256` with a `hex` (lowercase) encoding. The payload that must be signed is the JSON canonical representation of the body. The secret is provided by Etvas.

For detailed documentation please see [Signing](./signing.md)

## TODO:

- example with images reflecting branding and various classes / variables
- examples for other languages (PHP, Java, C#)
