# Using Etvas Automat

> **Note**: All the code examples assume you are using Etvas Automat as a package with a package manager and you use the ES6 syntax. Also, we will not include the initial code (like `import` and the call to `initialize`). If you need code examples for Vanilla Javascript, please contact us.

Etvas Automat offers various methods to interact with product listings, purchases and account settings. It is built to offer building blocks for you to use and inject in containers (`div`s) in your application.

With Etvas Automat, you can:

- query for products listing
- query for a product details

- display the Purchase modal
- display Use Product (allow customer to use a purchased product)
- display a product card
- display a product details page
- display the list of products and services you published
- display Etvas Platform Terms Of Service
- display Product specific Terms Of Service
- display Etvas account settings page

> Please note, some of the functionalities are available only after a successful `connect` operation and others will have different results if the `connect` call took place or not. For each of these operations, the documentation will indicate this aspect.

All the query calls respect the syntax where the the first argument is a string describing the endpoint (or query) you want to obtain a response from; the second argument can be a `params` object, if the query requires it; the next argument is an `options` object, and the last one is a callback for use without async/await syntax. Only the first argument is always required. Depending on the query, the `params` argument might be required as well. As for the `options`, it will always have a default value (so it can be omitted) and the `callback` always optional.

## Using SSO with all Etvas Automat function calls

A special attribute in the `options` object is worth a note, the `sso`: if the `sso` attribute is present, it can be:

- a `true` boolean value, meaning use the login if already injected by calling `connect` in a prior code fragment;
- a `false` boolean value, meaning the library should not use login information even if already present;
- a string value containing a token, meaning the call to `connect` will be automatically performed.

Here are the three examples, explained:

**Example 1 - instruct not to use SSO**

```
await etvasAutomat.connect(ssoToken)
const response = await etvasAutomat.query('products', {
  sso: false
})
```

which is identical to:

```
await etvasAutomat.connect(ssoToken)

// ...

await etvasAutomat.logout()
const response = await etvasAutomat.query('products')
```

Even if the SSO login for the customer was successfully injected into Etvas Automat, the call to the **products** query will not use SSO and the call is unauthenticated. The call will invoke the `logout` method on Etvas Automat.

> **Warning**: Calling any method with `sso: false` in options will trigger a system wide logout, meaning any calls after this one will not be in SSO context.

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
// A third call will not have the SSO context setup:
const otherProductDetails = await etvasAutomat.query(
  'productDetails',
  { id: products[1].id }
)
```

## Using queries to get information

You can use queries directly from Etvas Automat to get product information, such as the list of available (published) products, or product details for a specific one.

### Querying products listing

The query name is `products` and the general signature is:

```
const etvasProducts = await etvasAutomat.query('products', options)
```

It will return an array of products, in authenticated context or not. The main difference lies in the product purchase status, which is known when authenticated.

### Querying for product details

The query name is `productDetails` and the general signature is:

```
const params = { id: 'the-product-id' }
const etvasProductDetails = await etvasAutomat.query(
  'productDetails',
  params,
  options
)
```

## Using `iframe`s to display information

All the methods described below use `iframe`s to display information embedded in your application. Each iframe has a mechanism to automatically resize itself vertically (using `window.postMessage`) based on the content, so you don't have to worry about the double-scroll. For the horizontal part, all the markup displayed in the iframe is built mobile-first, so it should automatically render itself according with the maximum width of the container you specify in the function calls. However, your application must not impose a height on the container, so the height will automatically accommodate the iframe dynamic height.

All the `iframe`s displayed will have a default inline style like:

```
<iframe style="{ width:100%; border:none; display:block; }" ...></iframe>
```

> **A word on branding**: All the iframes displayed by Etvas Automat will be rendered with respect to the branding values you specify in your [Partners Portal account](https://partners.helloetvas.com). This happens automatically.

### Displaying the purchase modal

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
  productId: 'the_product_id',
  onSuccess: onSuccess,
  onFailure: onFailure
}
```

### Allow customers to use a purchased product

When the customer purchases a product, the general behavior is to be able to use it right away. In order to do this, you must obtain a _use product_ token. This token can be obtained for any purchased product, meaning you can generate such token in your application BackEnd.

```
// The getSSOLogin and getUseToken are two functions
// calling your backend implementation.

const handleAction = async ({productId, action }) => {
  closeModal()
  if (action === 'openProductUse') {
    etvasAutomat.showProductUse('full-page-container')
  } else {
    alert('Purchase was canceled by user')
  }
}

const params = {
  productId: 'the_product_id',
  onAction: handleAction
}

const ssoToken = await getSSOLogin()
await etvasAutomat.connect(ssoToken)
etvasAutomat.showPurchase(container, params)
```

### Displaying a product card

The call for this function will inject an iframe in your web application. The product card contains the product title, a short description, an optional rating (1 to 5 stars) and a link. The title, description and link text are language-aware. Remember `locale` attribute when you initialized the Etvas Automat library? That is the value we will use to render these texts.

A product card will not take much space in the page. By default, the displayed iframe has the following inline style:

```
<iframe
  style="border:none; width:480px; height:240px; display:block;"
  src="...">
</iframe>
```

The general syntax is:

```
etvasAutomat.showProductCard(container, params, options)
```

where:

- `container` is a HTML node element or a string referring to an ID of a HTML element;
- `params` is an object describing how the product card is to be displayed
- `options` is an object following the general format (sso option)

The `params` object has the following structure:

```
const params = {
  productId: 'uuid',    // the product ID of the rendered product
  append: false,        // false to clear the container before inserting iframe
  hideRating: false,    // true to hide the product rating
  showSeeMore: 'link',  // 'link', 'button' or false to hide
  seeMoreText: 'See details', // the text to be displayed in link,
  onAction: handleAction // a callback called when the customer clicks the link
}
```

The values (except the `productId` attribute) represents the defaults (if not specified). Using `hideRating`, `showSeeMode` and `seeMoreText` attributes allows you to configure the appearance of the product card.

> _Note_: If you specify the `seeMoreText` you will lose the Internationalization on this label, so make sure you insert a string in the same locale you initialized the Etvas Automat.

You can control how the _See more_ link is displayed. If you specify `link` (default) it will render a... well... a link. If you specify `button` it will render a button or, if you pass a boolean `false` it will hide the CTA.

> **Pro Tip**: you can hide the Call to Action all together and make the entire card clickable by attaching a click event on the container you specify. In this case, make sure you implement your own click handler and do not expect the `onAction` handler to be called.

Although the `seeMore` is rendered as a link in the product card, it will not trigger an action when clicked by the customer. It's up to you to define this action in `onAction` handler.

If you are in SSO context, the product card might render a `Use` text instead of a `See More` text, if the product is already bought. In this case, the same `onAction` handler is called.

The click handler receives the product object. If SSO login is active, you will have the purchase status:

```
const handleAction = ({productId, action, ...props}) => {
  console.info(`Product `${name}` - ${productId} card clicked`, action, props)
  if (action === 'showProductUse') {
    console.info('The product is already bought by the customer')
  } else if (action === 'showProductDetails') {
    console.info('The customer wants to know more details about the product')
  }
}
```

### Displaying a product details page

Displaying a product details page is similar with displaying a product card. Of course, the name of the function is different:

```
etvasAutomat.showProductDetails(container, params, options)
```

where:

- `container` is a HTML node element or a string referring to an ID of a HTML element;
- `params` is an object describing how the product details is to be displayed
- `options` is an object following the general format (sso option)

The `params` object has the following structure:

```
const params = {
  productId: 'uuid',    // the product ID of the rendered product
  append: false,        // false to clear the container before inserting iframe
  hideRating: false,    // true to hide the product rating
  onAction: handleAction // a callback called when the customer clicks the link
}
```

With this iframe, the Call To Action button is always there, and it differs depending on wether the call is made in SSO context and if the product is already bought by the current customer, like this: if the call is outside SSO (unauthenticated), the button will always show a _Purchase_ action, together with the price. If the call is within SSO context **AND** the product is purchased, the button will show _Use product_ label.

In either case, the same `handleAction` handler will be called, but the behavior should be implemented differently (login / register customer or present the product use iframe).

The payload for the callback will include the `productId` and the type of button displayed (and pressed).

### Displaying the list of products

In Etvas, displaying all the products in a page is called **Discover**, thus allowing the customer to discover the products and services available for purchase. If the customer is logged in (in SSO context), the product listing will contain indication on which product is already purchased (an active subscription) or available to be purchased.

As always, you must specify a HTML node to act as container, pass some parameters and, optionally, specify the SSO options:

```
etvasAutomat.showDiscover(container, params, options)
```

where:

- `container` is a HTML node element or an ID of a HTML node element;
- `params` an object that controls the behavior of the product listing;
- `options` an object containing the SSO options for this call;

The `params` object has the following structure:

```
const params = {
  append: false, // set this to true to append the iframe to the container
  onAction: actionHandler
}

function actionHandler ({ productId, action }) {
  switch(action) {
    case 'openProductDetails':
      alert('opening product details for ' + productId)
      // call the showProductDetails function:
      // etvasAutomat.showProductDetails(container, { productId, onAction: actionHandler })
      break
    case 'openProductPurchase':
      alert('opening purchase flow for product ' + productId)
      // call showProductPurchase function:
      // etvasAutomat.showProductPurchase(modalContainer, { productId, onAction: actionHandler })
    case 'openProductUse':
      alert('should open product use for ' + productId)
      // retrieve a Use URL from BackEnd and call:
      // etvasAutomat.showProductUse(container, { productId })
      break
    default:
      throw new Error('Unknown action ' + action)
  }
}
```

### Displaying the list of purchased products

This function will render a list with all purchased products for a logged customer. Of course, it makes sense to call it only in SSO authenticated context. The function signature is:

```
etvasAutomat.showMyProducts(container, params, options)
```

As always, the `container` must be a HTML node element or a string containing the unique ID of a HTML node element, and the `options` refers to SSO options.

The `params` object has the following structure:

```
const params = {
  append: false,  // true to append the iframe in the container
  onAction: handleAction
}

function handleAction({ productId, action }) {
  switch(action) {
    case 'openProductDetails':
      alert('opening product details for ' + productId)
      // call the showProductDetails function:
      // etvasAutomat.showProductDetails(container, { id: productId })
      break
    case 'openProductPurchase':
      alert('opening purchase flow for product ' + productId)
      // call showProductPurchase function:
      // etvasAutomat.showProductPurchase(modalContainer, { id: productId })
    case 'openProductUse':
      alert('should open product use for ' + productId)
      // retrieve a use URL from BackEnd and call:
      // etvasAutomat.showProductUse(container, { url })
      break
    case 'openDiscover':
      alert('The current user has no purchased products')
      // the user clicked on the Show Discover button
      // on the Empty Product Listing view
      // should naturally show the discover page and use the same handler
      // etvasAutomat.showDiscover(container, { onAction: actionHandler })
    default:
      throw new Error('Unknown action ' + action)
  }
}
```

As you can see, you could use the same handler for all the calls.
