# Design Notes

Architecturally we want to keep the client-side as simple as possible:
- Minimal external libraries unless library is significantly useful
- Simple session caching client-side
- All data fetching with RESTful interface (utils/API.js)
- We do NOT do unnecessary wrapping of functionality - ex. (utils/API.js) does not provide a bunch of custom methods for the API-endpoints, rather they are self-evident and we call them directly in the pages.
- Simple dispatcher system to handle core session updates (utils/GlobalStore.js) that may be available across multiple pages; when a variable is only used on a single page we use the simple useState() function.

On the server our goals are:
- Abstract elements to the layer they are used in (ex. db model, orm layer, and router layer); 
- Avoid unnecessary abstraction or wrapping of code

Order Process:
We don't bother tracking anything server-side while a user is browsing, only when they initiate an action with a shopping cart do we create a user session and start tracking the order activity:
- Initial state of the order is 'AWAIT_PAYMENT' (if payment processor setup) else 'AWAIT_INFO' (to capture users name + phone + email)
- Only then are queued in the order system for 'PREPARING', and the restos indicate when 'READY' for pickup, and upon pickup it's marked 'COMPLETED'... alternatively if the order is cancelled (CANCELLED) or if the purchaser never shows up (ABANDONED)

- In the future DELIVERING will be added to the workflow and SCHEDULED for a future pickup
