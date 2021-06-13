### Using Etvas Automat

> **Note**: All the code examples assume you are using Etvas Automat as a package with a package manager and you use the ES6 syntax. Also, we will not include the initial code (like `import` and the call to `initialize`). If you need code examples for Vanilla Javascript, please contact us.

Etvas Automat offers various methods to interact with product listings, purchases and account settings.

With Etvas Automat, you can:

- query for products listing
- query for a product details
- display the Purchase modal
- allow customer to use a purchased product

- display a product card
- display the list of products and services you published
- display a product details page
- display Etvas Platform Terms Of Service
- display Product specific Terms Of Service
- display Etvas account settings page

> Please note, some of the functionalities are available only after a successful `connect` operation and others will have different results if the `connect` call took place or not. For each of these operations, the documentation will indicate this aspect.

All the query calls respect the syntax where the the first argument is a string describing the endpoint (or query) you want to obtain a response from; the second argument can be a `params` object, if the query requires it; the next argument is an `options` object, and the last one is a callback for use without async/await syntax. Only the first argument is always required. Depending on the query, the `params` argument might be required as well. As for the `options`, it will always have a default value (so it can be omitted) and the `callback` always optional.

#### Using SSO with all Etvas Automat function calls

A special attribute in the `options` object is worth a note, the `sso`: if the `sso` attribute is present, it can be:

- a `true` boolean value, meaning use the login if already injected by calling `connect` in a prior code fragment;
- a `false` boolean value, meaning the library should not use login information even if already present;
- a string value, meaning the call to `connect` will be automatically performed.

Here are the three examples, explained:

**Example 1 - instruct not to use SSO**

```
await etvasAutomat.connect(ssoToken)
const response = await etvasAutomat.query('products', {
  sso: false
})
```

Even if the SSO login for the customer was successfully injected into Etvas Automat, the call to the **products** query will not use SSO and the call is unauthenticated.

**Example 2 - use SSO if available - the default behavior**

If a prior call to `connect` was successfully performed, the following calls will use SSO when performing the query.

```
const response = await etvasAutomat.query('products')
// or use the following one, with the same results:
const response = await etvasAutomat.query('products', { sso: true })
```

**Example 3 - use SSO inline**

```
const ssoToken = await obtainSSOTokenFromBackend()
const response = await etvasAutomat.query('products', { sso: ssoToken })
```

will behave exactly as:

```
const ssoToken = await obtainSSOTokenFromBackend()
await etvasAutomat.connect(ssoToken)
const response = await etvasAutomat.query('products')
```

As expected, the call to a `query` method with a string `sso` in `options` will automatically trigger the `connect` method prior to performing the query. However, it is worth noting that Etvas automat will cache the SSO information so other calls after the first one will re-use the sso token if `options.sso` is `true`, `undefined` or a string with the same value.

So, the following example will both return authenticated results, even if the `connect` function was never called directly:

```
const ssoToken = await obtainSSOToken()
// the next function will call connect internally and store the login data
// and the products will have information in authenticated context
const products = await etvasAutomat.query('products', { sso: ssoToken })
// the next function call will be called in authenticated context, as well
const productDetails = await etvasAutomat.query(
  'productDetails',
  { id: products[0].id }
)
```

If this is not the desired behavior, pass `sso: false` in the options of the second query call:

```
const ssoToken = await obtainSSOToken()
// the next function will call connect internally and store the login data
// and the products will have information in authenticated context
const products = await etvasAutomat.query('products', { sso: ssoToken })
// the next function call will not be called in authenticated context
const productDetails = await etvasAutomat.query(
  'productDetails',
  { id: products[0].id },
  { sso: false }
)
// but a third call will re-use the SSO information:
const otherProductDetails = await etvasAutomat.query(
  'productDetails',
  { id: products[1].id }
)
```

If this is not the desired behavior, you can use the `logout` function call to permanently destroy the authentication context

#### Querying for product listing

The query name is `products` and the general signature is:

```
const etvasProducts = await etvasAutomat.query('products', options)
```

It will return an array of products, in authenticated context or not. The main difference lies in the product purchase status, which is known when authenticated.

#### Querying for product details

The query name is `productDetails` and the general signature is:

```
const params = { id: 'the-product-id' }
const etvasProductDetails = await etvasAutomat.query(
  'productDetails',
  params,
  options
)
```

#### Displaying a purchase modal

Please note, even we are using the _modal_ term, you must handle the container yourself. The _modal_ term only hints about how it should be displayed and not the actual mode. The function will inject the required HTML markup in a container of your choice, whether it is in a modal dialog or in a new page, for example. Please note the HTML markup injected is a `iframe` element.

> The call to this function must be in SSO authenticated context and the product or service specified must not be already purchased by the current customer.

The general syntax is:

```
etvasAutomat.showPurchase(container, params, options)
```

Where:

- `container` is required and it is either a HTML node element (obtained by calling `document.getElementById('etvas-container`) or similar) or directly specifying the ID of the HTML element as a string: `etvas-container`;
- `params` is required and it is an object containing as a minimum the `id` of the product to be purchased (explained below in detail);
- `options` is optional and follows the general syntax (with `sso`).

A complete example for the `params` object is explained below:

```
const onSuccess = (payload) => {
  console.info('Product purchased:', payload.id)
}

const onFailure = (error) => {
  console.error('Product was not purchased because', error.message)
}

const params = {
  id: 'the_product_id',
  onSuccess: onSuccess,
  onFailure: onFailure
}
```

#### Allow customers to use a purchased product

When the customer purchases a product, the general behavior is to be able to use it right away. In order to do this, you must obtain a _use product_ token. This token can be obtained for any purchased product, meaning you can generate such token in your application BackEnd.

A more complete flow is presented below:

```
// The getSSOLogin and getUseToken are two functions
// calling your backend implementation.
// The showModal and hideModal are two functions
// that shows and hides a modal dialog in your
// FrontEnd application

const onSuccess = async (payload) => {
  const useToken = await getUseToken(currentUser.id, payload.id)
  closeModal()
  etvasAutomat.showProductUse(
    'full-page-use-container',
    { token: useToken }
  )
}

const onFailure = (error) => {
  console.error('Product was not purchased because', error.message)
}

const params = {
  id: 'the_product_id',
  onSuccess: onSuccess,
  onFailure: onFailure
}

const onPurchaseButtonClick = async () => {
  showModal()
  etvasAutomat.showPurchase('modal-container-body', params)
}

const ssoToken = await getSSOLogin()
await etvasAutomat.connect(ssoToken)
etvasAutomat.showPurchase(container, params)
```
