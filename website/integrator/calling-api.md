# Calling Etvas API

Etvas API is available at `https://api.helloetvas.com` and exposes both ReST and GraphQL endpoints. You should never directly access the endpoints from your FrontEnd application.

Calling the Etvas API endpoints involves supplying an API Key and signing the requests with a Secret key.

## How authentication works

Here at Etvas we approach the communication security with high diligence. We are using the AWS recommended practices on all our security related flows and we use industry standards encryption algorithms and methods to achieve the best solutions.

Due to the complexity of Etvas platform, we have many authentication mechanisms, each with it's own authorization and scopes.

This document describes two types of authentication, both taking place in the server-to-server dialogue. The first one comprises in an API key and a secret key. The API key is somewhat public, meaning it travels with each request in a special header (`x-api-key`) and serves, in a way, to identify the caller, like a username. The API key is unique to you and it must be accompanied by the organization ID.

A first step for Etvas API is to check if the API key is correctly paired with the organization Id. Other complex checks are performed by Etvas API and AWS infrastructure to determine if the call is not an attack.

Once the API key is verified, Etvas platform checks if the signature you computed for the request is valid. The signature is computed with a HMAC/RSA256 algorithm using the API Secret. **The API Secret NEVER travels through Internet. If this value is leaked, you must re-generate a new one at once, using your Partners Portal account, and update your environment file with the new value.**. Once you've done that, the old API secret will no longer be valid. If someone with malicious intent gets a hold of your API Secret, they can make calls in your name. Etvas API will try to identify these calls, but chances are they will succeed.

## Getting your API and Secret Key

> TBD

Your keys are available by logging in into the [Partners Portal](https://partners.helloetvas.com) with your account and selecting the Developer section.

The use of the API key is quite simple: it is to be sent with each request as a header (`x-api-key`):

```
HTTP/1.1 GET https://api.helloetvas.com/ping
Accept: application/json
x-api-key: demo-1234
```

## Signing requests

In order for the Etvas API to allow a request, it must verify two things:

- The identity of the party sending the request, in order to decide if the operation requested is allowed for that known party
- The integrity of the request, because anything sent over a public network (such as Internet) can be modified in transit.

The request attributes needed for correctly identify a request are:

- the HTTP method (GET, POST, PUT, PATCH,...)
- the query parameters
- a sub-list of headers
- the body (the payload)

### Step 1 - prepare a canonical form for the payload and compute SHA-256 hash on it

Preparing a canonical form of the payload involves two concerns: calculating a `SHA256` hash on the stringified version _and_ sending the exact same stringified version with the request.

For the canonical version of the payload we use the JSON minified representation, meaning the unformatted (no spaces, no new lines) JSON string. With that string, we simply calculate the **SHA256** hash and get the **hexadecimal** digest of it. For Node JS, the code should be similar (if not identical) with the following one:

```
const payload = {
  id: "1234",
  name: "Jon Appleseed"
}

function createCanonicalPayload(obj) {
  return JSON.stringify(obj);
}

function createHashPayload(canonical) {
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex')
}

const canonicalPayload = createCanonicalPayload(payload)
const hashPayload = createHashPayload(canonicalPayload)
```

> Please note, for `GET` requests or even for other verbs with no payload, you should always include the SHA256 hash of an empty string. The hex representation of SHA256 hash for an empty string is always `'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'`.

### Step 2 - create a canonical form for the request attributes and create HMAC/SHA256 signature

Next we will pack the relevant request data into a canonical form and use it. The canonical form is computed as lines separated by `\n`, comprising of:

- Line 1: The ReST verb (GET, POST, PUT, PATCH, DELETE); example: `GET`
- Line 2: The absolute path (without the base URL); example: `/users/profile`
- Line 3: Any query string; example: `foo=bar&baz=foo`
- Line 4: Content header; example: `content-type:application/json`
- Line 5: Api Key header; example: `x-api-key:1234-demo`
- Line 6: Current timestamp; example: `x-timestamp:123155100`
- Line 7: the body hash; example: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

At this step, you should eliminate the empty lines (often, the third line will be empty). Here is an implementation example that you can use out-of-the-box in Node JS:

```
function createCanonicalRequest(
  method = 'GET',
  path = '/',
  qs = '',
  headers,
  bodyHash)
  {
    const contentType = headers && (
      headers['Content-Type'] ||
      headers['content-type'] ||
      headers('Content-type')
    )
    const etvasContext = headers && headers['x-etvas-context']
    const timestamp = headers && headers['x-timestamp']
    const apiKey = headers && headers['x-api-key']
    const lines = [
      method.toUpperCase(),
      path,
      query && query,
      contentType && `content-type:${contentType}`,
      `x-api-key:${apiKey}`,
      etvasContext && `x-etvas-context:${etvasContext}`,
      `x-timestamp:${timestamp}`,
      bodyHash
    ]

    return lines
      .filter(line !!line)
      .join('\n')
  }
```

Now that we have a pretty complete canonical representation of the request,
we will sign it with our API Secret:

```
function sign(canonicalRequest, apiSecretKey) {
  return crypto
    .createHmac('sha256', apiSecretKey)
    .update(canonicalRequest)
    .digest('hex')
}
```

Now you can call the Etvas API endpoints, including the additional signature header:

### Step 3 - send the request with additional signature header

```
const headers = {
  'content-type': 'application/json',
  'x-api-key': '1234-demo',
  'x-timestamp': Date.now()
}

const canonicalRequest = createCanonicalRequest(
  'GET',
  '/users/user_id',
  '',
  headers,
  canonicalPayload
)

headers['x-signature'] = sign(canonicalRequest)

const response = await axios({
  method: 'get',
  url: '/users/user_id',
  baseURL: 'https://api.helloetvas.com',
  data: canonicalPayload,
  headers: headers
})
```

> **Note**: A 403 response would mean the signature is not correct.

## Customer management

Your customer needs to be registered in Etvas platform in order to use Etvas Value Added Services. Once logged in (or when the customer wants access to Etvas sections), the customer data needs to be transferred to Etvas API.

You can store the Etvas information alongside your customer data or verify each time if your customer is also an Etvas Customer.

### Creating an Etvas Customer

In order to create an Etvas Customer you need to `POST` the profile information to `https://api.helloetvas.com/users`. Here is the call:

```
HTTP/1.1 POST https://api.helloetvas.com/users
Content-Type: application/json
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
--
{
  "firstName": "Jon",
  "lastName": "Appleseed",
  "phoneNumber": "+4912312312345",
  "isPhoneVerified": true
  "locale": "de",
  "email": "email@example.com",
  "tosAgreedAt": 1623609831835,
  "tosAgreedIp": "8.8.4.4"
}
```

As you can see, the first and last name are two separate fields. The `phoneNumber` must be in international format, with the `+` prefix and the country code, no spaces, dashes or any other characters. Ideally the number is a mobile phone number. The `isPhoneVerified` attribute is a bool, indicating if you checked the ownership of the phone number or not. Verifying ownership usually involves sending a SMS with a PIN in the registration process. As the registration is on your side in this scenario, Etvas will not check this information. The `locale` attribute must be `en` or `de`. This value will be taken into account when sending various informative emails (such as purchase details, invoice, alerts, cancellation warnings and so on) and display various HTML rendered fragments.

The last two attributes refers to the Terms of Service, as the customers using Etvas platform need to agree with both the product or service and etvas Terms of Service. The `tosAgreedAt` contains the Javascript timestamp (number of milliseconds from Jan 1, 1970 00:00:00), and the `tosAgreedIp` is the IP address of the customers machine. Please note it must be a valid IP V4/V6 address.

> **A word about the IP address**: we store the customer IP address for audit purposes only. We do not use it in any way to identify the customer or track its activity across requests.

A success response will have a very important piece of information:

```
HTTP/1.1
Content-Type: application/json
--
{
  ...
  id: 'fdeb90cb-39fc-483d-b2f9-1e55f70f56ba'
  ...
}
```

A 2XX response indicates success and a 4XX or 5XX indicates failure. Inspecting the response body gives you a hint about what went wrong.

This is an ID (UUID v4) generated by Etvas platform to uniquely identify the newly created user. You can chose to save this ID alongside your customer data, in order to quickly identify this user is **connected** with Etvas.

### Getting an existing Etvas Customer

You might want to verify if the customer you have is connected to Etvas. You can do this by querying with a GET request the `/users/[identifier]` endpoint:

```
HTTP/1.1 GET https://api.helloetvas.com/users/fdeb90cb-39fc-483d-b2f9-1e55f70f56ba
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
```

The response resembles (if success), the one obtained when creating the customer.

Please note you can use not only the Etvas ID but also the customer's email:

```
HTTP/1.1 GET https://api.helloetvas.com/users/email%40example.com
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
```

In both cases, a 2XX response indicates success and a 4XX or 5XX indicates failure. Inspecting the response body gives you a hint about what went wrong.

> Please note the email is in this case URL encoded, so the `@` character becomes `%40`.

This way, you can check the customer is connected with Etvas so you don't have to store the Etvas ID in your database. However, storing it will avoid a network call AND querying by ID instead of email is usually faster because you don't need to encode the ID (UUID format is already URL Safe).

### Deleting a customer

In order to be GDPR compliant, you need to be able to delete the customer data when requested. If this is the case, you need to also delete this information in Etvas platform, prior to deleting it from your database.

> **Warning**: Deleting a customer from Etvas platform means the immediate termination of all relations between the customer and Etvas. We will not only delete the profile data and anonymize attached information, but also we'll immediately cancel all ongoing subscriptions for purchased products and services and deny access to using said products and services. This operation cannot be recovered.

To delete a customer from Etvas Platform you need to call the same endpoint but with a `DELETE` HTTP verb:

```
HTTP/1.1 DELETE https://api.helloetvas.com/users/fdeb90cb-39fc-483d-b2f9-1e55f70f56ba
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
```

Of course, you can use URL encoded email instead of ID:

```
HTTP/1.1 DELETE https://api.helloetvas.com/users/email%40example.com
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
```

In both cases, a 2XX response indicates success and a 4XX or 5XX indicates failure. Inspecting the response body gives you a hint about what went wrong.

## Obtaining a SSO token for an existing customer

You can obtain a SSO token for any existing customer you created by using a POST request with the following signature:

```
HTTP/1.1 POST https://api.helloetvas.com/users/email%40example.com/sso
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
--
```

The successful response will resemble:

```
HTTP/1.1
Content-Type: application/json
--
{
  token: 'sso_token'
}
```

This token is to be injected in Etvas Automat, and so make calls within a SSO customer authenticated context.

## Allow customers to use purchased products and services

Each purchased product has a separate application, fully interfaced with Etvas Platform, which will allow the customer to use the product. For this, you must obtain a _use purchased product_ token for a customer.

Here's how:

```
HTTP/1.1 POST https://api.helloetvas.com/users/email%40example.com/products/[product_id]/use
Accept: application/json
x-api-key: your_api_key
x-timestamp: 1623609821835
x-signature: computed_signature_hex
--
```

This will trigger a JSON response in the following form:

```
HTTP/1.1
Content-Type: application/json
--
{
  token: 'use_token'
}
```

The token is intended to be transmitted and used with Etvas Automat.
