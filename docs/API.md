# ENDPOINTS

Code is your best friend to understand:
https://github.com/c0dehot/shopping-cart/tree/main/app/router

## AUTHENTICATION
Most endpoint calls require a valid session key to be passed in the HEADER request. 
That session key is generated at the login stage (/api/users/login).

Each session has one of 2 authentication levels: 'CART' which is for a standard cart user, or 'ADMIN' which is for the administrator 
to the restaurant.

## USER MANAGEMENT
A signup creates an account (and session key); after that a login will generate a session key that is passed back.

### /api/users/signup (POST, auth: -)
<Inputs>
name        : string
email       : string
phone       : string
password    : string
address     : string
refCode:    : string - 9-digit reference code

<Returns>
status      : boolean
session     : string
userData    : array

### /api/users/login (POST, auth: -)
<Inputs>
email       : string
password    : string

<Returns>
status      : boolean
session     : string
userData    : array

### /api/users/session (GET, auth: CART)
<Inputs>
[header] session     : string

<Returns>
status      : boolean
userData    : array

### /api/users/logout (GET, auth: CART)
<Inputs>
[header] session     : string

<Returns>
status:     : boolean

### /api/users/affiliates (GET, auth: ADMIN)
<Returns>
status      : boolean
data        : array

## STRIPE
The Stripe API calls the /config to initialize data on the server-side, then the /checkout sets the total 
value and allows triggering the Stripe popup to pay.

### /api/stripe/config (GET, auth: CART)
<Returns>
publicKey   : string
currency    : 3-char currency ISO

### /api/stripe/checkout (POST, auth: CART)
<Inputs>
subtotal    : number (payment subtotal)

<Returns>
sessionId   : string (payment session-id)

### /api/stripe/checkout-status (GET, auth: CART)
<Inputs>
sessionId   : string

<Returns>
status      : boolean
data        : array (order data)

## ORDER
Orders for the customer

### /api/order/:url/:orderCode? (GET, auth: CART)
### /api/order/:orderCode? (GET, auth: CART)
<Inputs>
url         : string (resto name)
orderCode   : string

<Returns>
status      : boolean
session     : string
data        : array

### /api/order/[notes|rating|userdetails|restart]/:orderIdCode
Modify an order (examine the code endpoint for more details)

<Inputs>
orderCode   : string

<Returns>
status      : boolean
data        : array


## ADMIN
These endpoints are only for restaurant administration, not for the customers. See the code for more details.

### /api/users (GET, PUT)
User listing/editing.

### /api/orgs (GET, PUT)
Organization listing/editing.

### /api/items (GET, POST, PUT, DELETE)
Menu item management

### /api/media/:resizing/:_id?
Item media management.

### /api/orders
Order management from the admin panel

### /api/init
Initialize the mongo database
