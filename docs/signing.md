# Signing requests

## Abstract

Building a trust relation between two parties over the Internet is not a simple task. Luckily, we have cryptographic and hashing methods that allows us to achieve this goal.

In order for the Etvas ReST Backend to allow a request, it must verify two things:

- The identity of the party sending the request, in order to decide if the operation requested is allowed for that known party
- The integrity of the request, because anything sent over a public network (such as Internet) can be modified in transit.

## How to sign a request

> Note: the code examples in this document refers to NodeJS, but the concepts and the libraries are available in any major programming language.

The request attributes needed for correctly identify a request are:

- the HTTP method (GET, POST, PUT, PATCH,...)
- the query parameters
- a sub-list of headers
- the body (the payload)

### Step 1 - prepare a canonical form for the payload and compute SHA-256 hash on it

Preparing a canonical form of the payload involves two concerns: calculating a `SHA256` hash on the stringified version _and_ sending the exact same stringified version with the request.

```
const payload = {
  id: "1234",
  name: "Jon Appleseed"
}

// Here we simply use the JSON representation as the canonical string
const canonical = JSON.stringify(payload)
const hash = crypto
  .createHash('sha256')
  .update(canonical)
  .digest('hex')
```

### Step 2 - create a canonical form for the request attributes and create HMAC/SHA256 signature

```
const timestamp = Math.floor(Date.now() / 1000)
const canonicalRequest =
  'GET' + '\n' +
  '/users/test' + '\n' +
  'foo=bar&baz=foo' + '\n' +
  'content-type:application/json; charset=utf-8' + '\n' +
  'x-api-key:02389u0fwjf08j340' + '\n' +
  'x-etvas-context:12345678-1234-4123-1234-0123456789ab' + '\n' +
  'x-timestamp:' + timestamp + '\n' +
  hash

const signature = crypto
  .createHmac('sha256', 'my-etvas-secret-key')
  .update(canonicalRequest)
  .digest('hex')
```

### Step 3 - send the request with additional signature header

```
const response = await axios({
  method: 'get',
  url: '/users/test',
  baseURL: 'https://api.etvas.com',
  data: canonical,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'x-api-key': '02389u0fwjf08j340',
    'x-etvas-context': '12345678-1234-4123-1234-0123456789ab',
    'x-timestamp': timestamp,
    'x-signature': signature
  }
})
```

The full example (with some minor modifications) is available in [the examples directory](../examples/signing.js)
