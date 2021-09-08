function stripeRoutes( app, API_URL, orm, security, sessionManager ){
   app.get('/api/stripe/config/', security.authRequired('CART'), async (req, res) => {
      console.log( '[/api/stripe/config] '+(!req.sessionData.org._financial ? ' ...loading orm.orgs for _financial' :'') )
      if( !req.sessionData.org._financial ){
         const { status, data, message }= await orm.orgs.load({ orgId: req.sessionData.orgId }, req.sessionData )
         if( !status || !data.orgId ){
            console.log( `x sorry problems: status(${status}) message(${message})` )
            res.status(403).send({ status, message: 'Sorry internal problems, try later.' }); return
         }
         // req.sessionData.org = data
         // add to the session, and let's update req.sessionData for now
         console.log( ' .. updating _financial in sessionManager' )
         req.sessionData = sessionManager.updateUser( req.sessionData.userId, { org: data } )
         console.log( ' .. updated sessionData: ', req.sessionData )
      } else
         console.log( ' .. org._financial already exists, not fetching it.')

      const { stripePubKey, currencyISO }= req.sessionData.org._financial

      console.log( ` > sending stripePubKey(${stripePubKey}) currency(${currencyISO})` )

      res.send({
         publicKey: stripePubKey,
         currency: currencyISO.toLowerCase(),
      })
   })

   app.post('/api/stripe/checkout', security.authRequired('CART'), async (req, res) => {
      const { stripePrivKey, stripeProductKey, stripeTaxKey, currencyISO }= req.sessionData.org._financial
      console.log( '[POST /api/stripe/checkout] req.body:', req.body )
      const subtotal = (Number(req.body.subtotal)*100).toFixed(0)
      const returnUrl = `${API_URL}/${req.sessionData.org.url}`

      // initialize this shop object
      const stripe = require('stripe')(stripePrivKey)

      const session = await stripe.checkout.sessions.create({
         payment_method_types: ['card'],
         mode: 'payment',
         // locale,
         line_items: [{
            price_data: {
               unit_amount: subtotal, currency: currencyISO.toLowerCase(), product: stripeProductKey },
            quantity: 1,
            tax_rates: [stripeTaxKey], // tax_rates | dynamic_tax_rates: ['txr_1Ie9VNFksB18WkRvOzBkQYNE']
         }],
         //   allow_promotion_codes: true,
         //   billing_address_collection: "required",
         success_url: `${returnUrl}/order/complete?transId={CHECKOUT_SESSION_ID}`,
         cancel_url: `${returnUrl}/order/cancelled`,
      })

      console.log( `stripe sesssion: ${session.id}`)
      res.send({ sessionId: session.id })
   })


   // Fetch the Checkout Session to display the JSON result on the success page
   app.get('/api/stripe/checkout-status', security.authRequired('CART'), async (req, res) => {
      const { sessionId } = req.query
      console.log( '[GET /api/stripe/checkout-status] req.sessionData.order', req.sessionData.order )
      if( !(req.sessionData.order && req.sessionData.order.orderId) ){
         res.send(security.stripPrivateKeys({ status:false, message: 'Sorry no active order, start again!' })); return
      }

      const { stripePrivKey }= req.sessionData.org._financial
      const stripe = require('stripe')(stripePrivKey)

      console.log( '[GET /api/stripe/checkout-status] sessionId(${sessionId}) ->' )
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      console.log( ' info:', session )
      if( session.payment_status !== 'paid'){
         res.send(security.stripPrivateKeys({ status:false, message: 'Sorry problems processing payment, try again!' })); return
      }

      // update order
      const { amount_subtotal, amount_total, total_details: { amount_discount, amount_shipping, amount_tax} }= session

      const orderData = {
         orderId: req.sessionData.order.orderId,
         status: 'PREPARING',
         discount: (amount_discount/100).toFixed(2),
         shipping: (amount_shipping/100).toFixed(2),
         subtotal: (amount_subtotal/100).toFixed(2),
         tax: (amount_tax/100).toFixed(2),
         total: (amount_total/100).toFixed(2),
         isPaid: true,
         _processorData: session
      }
      console.log( ' updating user order: ', orderData )
      const { status, data, message }= await orm.orders.save( orderData, req.sessionData )
      if( !status ){
         console.log( ` x orm.orders.save() failed: ${status}/${message}`)
         res.status(403).send({ status, message }); return
      }
      const order = data; delete order.userId; delete order.orgId;

      sessionData = sessionManager.update( req.headers.session, { order } )

      res.send(security.stripPrivateKeys({ status:true, data: order, message }))
   })
}

module.exports = stripeRoutes