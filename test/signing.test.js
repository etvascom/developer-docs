const { describe, it } = require("mocha")
const axios = require("axios")
const assert = require("assert").strict

const signing = require("../examples/signing")

describe("Signing requests", () => {
  it("should compute the hash for a body correctly", () => {
    const canonical = "asfsafsdf asdfasdf sdfsafdsg"
    const expected =
      "5bea3dde630cd7d8c23c03309aca75ee70c017d1a8635359902dbf9c6820f242"
    assert.strictEqual(signing.computeHash(canonical), expected)
  })
  it("should compute the signature correctly for a GET", () => {
    process.env.ETVAS_API_KEY = "gESWLML3LD3WRcz821a7H1FU8aqVWmwj4oS8gLD3"
    process.env.ETVAS_SIGN_SECRET = "FTi75OKANdqXltBIbllry9fDKkdmL8fy"

    const signature = signing.computeSignature(
      "GET",
      "/greet",
      undefined,
      "06c1e9ee-ee91-493a-866e-d210b22d96c8",
      undefined,
      undefined,
      1598014728
    )
    const expected =
      "d8c657ce2464faa4bcc6494a4323850b0f0af86f33244e91f1978e3f71a93b02"
    assert.strictEqual(signature, expected)
  })
  it("should successfully make a request", (done) => {
    process.env.ETVAS_API_KEY = "gESWLML3LD3WRcz821a7H1FU8aqVWmwj4oS8gLD3"
    process.env.ETVAS_SIGN_SECRET = "FTi75OKANdqXltBIbllry9fDKkdmL8fy"
    process.env.ETVAS_API_BASE_URL =
      "https://tsqeltxwjf.execute-api.eu-central-1.amazonaws.com/development-bogdan"
    signing
      .sendRequest(
        axios,
        "GET",
        "/greet",
        "foo=bar",
        "06c1e9ee-ee91-493a-866e-d210b22d96c8"
      )
      .then((response) => {
        assert.strictEqual(
          response.status >= 200 && response.status < 300,
          true
        )
      })
      .catch((err) => {
        assert.strictEqual(err, null)
      })
      .finally(done)
  })
})
