# Calling Etvas API

Etvas API is available at `https://api.helloetvas.com` and exposes both ReST and GraphQL endpoints. You should never directly access the endpoints from your FrontEnd application.

Calling the Etvas API endpoints involves supplying an API Key and signing the requests with a Secret key.

### Getting your API and Secret Key

> PRO

Your keys are available by logging in into the [Partners Portal](https://partners.helloetvas.com) with your account and selecting the Developer section.

The use of the API key is quite simple: it is to be sent with each request as a header (`x-api-key`):

```
HTTP/1.1 GET https://api.helloetvas.com/ping
Accept: application/json
x-api-key: demo-1234
```

### Signing requests

In order for the Etvas API to allow a request, it must verify two things:

- The identity of the party sending the request, in order to decide if the operation requested is allowed for that known party
- The integrity of the request, because anything sent over a public network (such as Internet) can be modified in transit.

The request attributes needed for correctly identify a request are:

- the HTTP method (GET, POST, PUT, PATCH,...)
- the query parameters
- a sub-list of headers
- the body (the payload)

##### Step 1 - prepare a canonical form for the payload and compute SHA-256 hash on it

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

##### Step 2 - create a canonical form for the request attributes and create HMAC/SHA256 signature

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

##### Step 3 - send the request with additional signature header

```
const headers = {
  'content-type': 'application/json',
  'x-api-key': '1234-demo',
  'x-timestamp': Date.now()
}

const canonicalRequest = createCanonicalRequest(
  'GET',
  '/users/test',
  '',
  headers,
  canonicalPayload
)

headers['x-signature'] = sign(canonicalRequest)

const response = await axios({
  method: 'get',
  url: '/users/test',
  baseURL: 'https://api.etvas.com',
  data: canonicalPayload,
  headers: headers
})
```

> **Note**: A 403 response would mean the signature is not correct.
