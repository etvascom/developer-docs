const crypto = require("crypto")
const axios = require("axios")

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function sendRequest(method, path, query, context, canonical) {
  const hash = crypto.createHash("sha256").update(canonical).digest("hex")

  const contentType = "application/json; charset=utf-8"
  const timestamp = getCurrentTimestamp()
  const apiKey = process.env.ETVAS_API_KEY

  const reqAttributes = [
    method.toUpperCase(),
    path,
    ...(query ? [query] : []),
    "content-type:" + contentType,
    "x-api-key:" + apiKey,
    "x-etvas-context:" + context,
    "x-timestamp:" + timestamp,
    hash,
  ]

  const eol = "\n"
  const needsSign = reqAttributes.join(eol)
  const secretKey = process.env.ETVAS_SIGN_KEY
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(needsSign)
    .digest("hex")

  return axios.request({
    baseURL: process.env.ETVAS_API_BASE_URL,
    method: method.toLowerCase(),
    url: path,
    data: canonical,
    headers: {
      "content-type": contentType,
      "x-api-key": apiKey,
      "x-etvas-context": context,
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
  })
}

const payload = {
  firstName: "Jon",
  lastName: "Appleseed",
}

const context = "12345678-1234-4123-1234-0123456789ab"

sendRequest("post", "/users/test", null, context, JSON.stringify(payload))
  .then((response) => {
    console.log("Response", response.data)
  })
  .catch((err) => {
    console.error("Error:", err)
  })
