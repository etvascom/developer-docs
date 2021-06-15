# Single Sign On - Server to Server

In order to achieve the best User Experience, Etvas implements a SSO mechanism to be used exclusively in a Server-to-Server dialogue.

> Please note this mechanism is available ONLY for users created with the methods described in "Calling API" documentation. A user self-registered in Etvas Platform or a user registered by other partner in the same manner will not be available for SSO in your context.

Logging in a customer behind the scenes requires a dialogue between your BackEnd and Etvas Backend and between your BackEnd and your FrontEnd. The usual flow is described below:

1. The customer logs in in your FrontEnd Application and requests access to Etvas.
2. Your FrontEnd Application calls your BackEnd to get the Etvas login token
   2.1. Backend checks if the current customer has an account with Etvas
   2.2. If not, calls POST to Etvas Backend to register the user and receive the Etvas User ID
   2.3. POST to the `/sso` endpoint with the Etvas Customer ID (or email) to obtain a token
   2.4. Pass the token back to the FrontEnd application
3. The FrontEnd application uses Etvas Automat to obtain a login for the current user using the token received.

## Installing and initializing Etvas Automat

Etvas Automat is a Javascript library you can use in your FrontEnd application to manage various aspects of User Interface regarding Etvas Platform.

### Installing Etvas automat without a package manager

Use a `<script>` tag to reference the package. Using this method will register an object called `etvasAutomat` in the global `window` object. You can use it like this:

```
<!doctype html>
<html>
  <head>
    ...
    <script src="https://unpkg.com/@etvas/etvas-automat@latest"></script>
    ...
  </head>
  <body>
    ...
    <script>
      // in most cases you can omit window reference,
      // but we always recommend using like:
      window.etvasAutomat.initialize({ ... })
    </script>
  </body>
</html>
```

If you need a specific version of Etvas Automat, you can use the version number (for example `1.3.0`) instead of `latest`:

```
  <script src="https://unpkg.com/@etvas/etvas-automat@1.3.0"></script>
```

You can read more about resolving a version (major, minor and so on) by consulting the documentation at [unpkg.com](https://unpkg.com).

### Installing Etvas automat with a package manager

In most cases, your FrontEnd application uses a package manager like `npm` or `yarn` to solve the dependencies. Etvas automat is ready to be used with both, wether you use Vanilla Javascript, you have a React, Vue, Angular or any other FrontEnd framework to develop your application.

```
$ npm install @etvas/etvas-automat --save`
```

or, if you prefer yarn:

```
$ yarn add @etvas/etvas-automat
```

You can use the package as you normally use any other package. If you are using the CommonJS syntax, you can require the package like this:

```
const automat = require("@etvas/etvas-automat");
automat.initialize({ ... });
```

But, as this is a Front-End SDK, you might want to use the `import` syntax:

```
import automat from "@etvas/etvas-automat";
automat.initialize({ ... });
```

### Initializing the library

The library needs some configuration in order to work and communicate properly with our backend services. We do that by calling a function named `initialize`. You will want to call this function as early as possible in your code, making sure it is the first one called:

```
automat.initialize({
  etvasURL: "https://unique-organization-slug.helloetvas.com",
  organizationId: "12345678-1234-1234-4123-123456789012"
})
```

Both `EtvasURL` and `organizationId` values are available in your account on [Partners Portal](https://partners.helloetvas.com).

## Using Etvas Automat for SSO

With the token you obtained from your BackEnd, you can sign in the customer with Etvas. Any further call you run on Etvas Automat will use the login information to automatically authenticate the customer.

The function signature is:

```
automat.connect(ssoToken, callback = null)
```

where ssoToken is the token you obtained from your BackEnd services.

You can call this function at any time. The function is an async function and you can wait for it to finish (maybe displaying a loading indicator in your front-end) in two ways: providing a callback or using `async/await`:

```
// using callback:
function onConnect(err, success) {
  if (err) {
    alert('Could not successfully connect')
  } else {
    alert('Connection succeeded!')
  }
}
etvasAutomat.connect(ssoToken, onConnect)


// using async/await:
const etvasConnect = async (ssoToken) => {
  try {
    await etvasAutomat.connect(ssoToken)
    alert('Connection succeeded!')
  } catch (err) {
    console.error('Error caught while connecting to Etvas', err)
    alert('Could not successfully connect!')
  }
}

etvasConnect(ssoToken)
```

Logging out and exiting the SSO context is an easy task:

```
etvasAutomat.logout()
```

This will erase the SSO information and clear the Etvas Automat SSO cache.
