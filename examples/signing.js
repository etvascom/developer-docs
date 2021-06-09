const crypto = require("crypto")

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function computeHash(canonical) {
  return crypto
    .createHash("sha256")
    .update(canonical || "")
    .digest("hex")
}

function computeSignature(
  method,
  path,
  query,
  context,
  canonical,
  contentType,
  timestamp
) {
  const hash = computeHash(canonical)
  const apiKey = process.env.ETVAS_API_KEY

  const reqAttributes = [
    method.toUpperCase(),
    path,
    ...(query ? [query] : []),
    ...(contentType ? ["content-type:" + contentType] : []),
    "x-api-key:" + apiKey,
    ...(context ? ["x-etvas-context:" + context] : []),
    "x-timestamp:" + timestamp,
    hash,
  ]

  const eol = "\n"
  const needsSign = reqAttributes.join(eol)
  const secretKey = process.env.ETVAS_SIGN_SECRET
  return crypto.createHmac("sha256", secretKey).update(needsSign).digest("hex")
}

function sendRequest(
  axios,
  method,
  path,
  query,
  context,
  canonical,
  contentType
) {
  const timestamp = getCurrentTimestamp()
  const apiKey = process.env.ETVAS_API_KEY
  const signature = computeSignature(
    method,
    path,
    query,
    context,
    canonical,
    contentType,
    timestamp
  )

  const headers = {
    "x-api-key": apiKey,
    "x-timestamp": timestamp,
    "x-signature": signature,
  }

  if (contentType) {
    headers["content-type"] = contentType
  }
  if (context) {
    headers["x-etvas-context"] = context
  }

  return axios.request({
    baseURL: process.env.ETVAS_API_BASE_URL,
    method: method.toLowerCase(),
    url: `${path}${query ? `?${query}` : ""}`,
    data: canonical,
    headers,
  })
}

// const payload = {
//   firstName: "Jon",
//   lastName: "Appleseed",
// }

// const context = "12345678-1234-4123-1234-0123456789ab"

// sendRequest("post", "/users/test", null, context, JSON.stringify(payload))
//   .then((response) => {
//     console.log("Response", response.data)
//   })
//   .catch((err) => {
//     console.error("Error:", err)
//   })

module.exports = {
  getCurrentTimestamp,
  computeHash,
  computeSignature,
  sendRequest,
}
