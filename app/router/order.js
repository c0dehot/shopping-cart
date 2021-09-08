function order( app, orm, security, sessionManager ){
   app.get('/api/order/:url/:orderCode?', async function( req, res ){
      const { url, orderCode }= req.params

      let sessionData = sessionManager.verifyAndLoad( req.headers.session )
      console.log( `[GET /api/orders/${url}/${orderCode}]`)
      // if valid session exists....
      if( sessionData && sessionData.org && sessionData.org.url === url ){
         // checking we are refreshing on the correct order
         if( orderCode && sessionData.order && sessionData.order.orderCode && orderCode!==sessionData.order.orderCode ){
            console.log( 'x wrong orderCode for refresh, aborting this one.')
            res.send(security.stripPrivateKeys({ status: false, data: {}, message: 'Expired orderCode!' }))
            return
         }
         // checking if anything in the org/items has refreshed since this user session, and if so, we reload them...
         // order status changes are automatically written to session, but changes to org/items are NOT, so we use a timestamp checker
         const updateTracker = sessionManager.loadUpdateTracker( sessionData.org.orgId )
         console.log( `~ found valid sessionData, checking updatedAt org(${updateTracker.org}: ${sessionData.org.updatedAt<updateTracker.org}) item: (${updateTracker.items}: ${sessionData.itemsLastUpdate<updateTracker.items}) passing it back.` )
         // if the session has out-dated org/items, we force a reload
         if( updateTracker.org && sessionData.org.updatedAt<updateTracker.org ){
            console.log( ' .. ! outdated org info; refreshing it' )
            const { status, data, message }= await orm.orgs.load({ url })
            if( status ){
               sessionData.org = data
               sessionData = sessionManager.update( req.headers.session, sessionData )
            }
         }
         if( updateTracker.items && sessionData.itemsLastUpdate<updateTracker.items ){
            console.log( ' .. ! outdated items info; refreshing it' )
            const { status, data, specials, lastUpdatedAt, message }= await orm.items.load({}, { orgId: sessionData.orgId })
            if( status && data && data.length>0 ){
               sessionData.items = [ ...specials, ...data ]
               sessionData.itemsLastUpdate = lastUpdatedAt
               sessionData = sessionManager.update( req.headers.session, sessionData )
            }
         }

         console.log( ` .. order.status(${sessionData.order && sessionData.order.status || 'n/a'}) sessionData.order.notes`, sessionData.order && sessionData.order.notes || 'n/a' )
         // menu page, so it may be a new order, we do not want any pre-existing order
         res.send(security.stripPrivateKeys({ status: true, data: sessionData }))
         return
      }

      // no valid session -> so start one
      console.log( ' .. no session! generating one:')
      let org
      {
         const { status, data, message }= await orm.orgs.load({ url })
         console.log( ` .. orm.org.load({ ${url} }) status(${status}) message(${message})` )
         if( !status || !data.orgId ){
            console.log( ' x unknown shopping cart, aborting (403)' )
            res.status(403).send({ status, message: 'Sorry unknown shopping cart!' }); return
         }
         org = data
      }

      let items, itemsLastUpdate
      {
         const { status, data, specials, lastUpdatedAt, message }= await orm.items.load({}, { orgId: org.orgId })
         if( status && data && data.length>0 )
            items = [ ...specials, ...data ]
         itemsLastUpdate = lastUpdatedAt
      }
      // create them a guest session (no corresponding user-entry here, just session + org)
      const guestData = {
         cart: [],
         role: 'CART',
         _info: { ip: req.ip, useragent: req.headers['user-agent'] },
         orgId: org.orgId,
         itemsLastUpdate,
         items,
         org
      } // could be from specials menu, etc
      session = sessionManager.create( guestData )
      console.log( '.. guest session created, sending guestData.' )
      res.send(security.stripPrivateKeys({ status: true, session, data: guestData } ))
   })

   // Coming from /{url}/order link. Can be reached 2 ways:
   // - from the previous page clicking on [Order] button, so user session is live
   // - BUT also possible they bookmarked this page (or refreshed), so no user-session info >> we need to return user session.
   app.post('/api/order/:orderCode?', security.authRequired('CART'), async function( req, res ){
      let orderCode = req.params.orderCode
      const cartData = req.body
      let sessionData = req.sessionData

      console.log( `[POST /api/order/${orderCode}] cartData: `, JSON.stringify(cartData) )
      if( !cartData || cartData.length<1 ){
         console.log( ` x invalid order details, kick back to cart page: (sessionData: ${!sessionData}) (orderCode: ${orderCode}) (sessionData.cart.length: ${sessionData.cart.length})` )
         res.send(security.stripPrivateKeys({ status: false, message: 'Invalid order, restart please.' }))
         return
      }

      // if no user exists, now we create a guest user + save the shopping cart
      if( !sessionData.userId ){
         const { status, userData, message }= await orm.users.save({
            orgId: sessionData.orgId,
            name: 'Cart',
            password: security.uniqueId(),
            email: cartData.email || '',
            phone: cartData.phone || '',
            redirectUrl: `/${sessionData.org.url}/`,
            cart: cartData,
            role: 'CART',
            isDummyUser: true
         })
         if( !status ){
            console.log( ` x orm.user.save() failed: ${status}/${message}`)
            res.status(403).send({ status, message }); return
         }
         // updating changes to user session - pass in this modfiied sessionData where-ever needed
         console.log( ` .. created a USER >> userId(${userData.userId}); updting session` )
         sessionData = sessionManager.update( req.headers.session, userData )
         if( !sessionData ){
            console.log( 'x crap failed to update the session (after USER creation), internal error!')
            res.status(403).send({ status: false, message: 'Something went wrong, let\'s try again!' }); return
         }
      }

      let message = ''
      if( !orderCode ){
         // got order details & got a session, let's book this order!
         // check stripe details filled in, else we can only do pickup
         const fin = sessionData.org._financial
         console.log( ' ******* sessionData.org._finaicial: ', fin )
         const activateProcessor = sessionData.org.isRequireOnline && fin.stripePubKey.length>24 && fin.stripePrivKey.length>24 && fin.stripeProductKey.length>13 && fin.stripeTaxKey.length>24

         const subtotal = cartData.reduce( (total,item)=>total+=Number(item.total),0 )
         let orderData = {
         // orgId: sessionData.orgId,
         // userId: sessionData.userId,
            specialId: cartData.specialId || '',
            deliverAt: cartData.deliverAt || '',
            cart: cartData,
            subtotal: subtotal.toFixed(2),
            //! these two are **overwritten** by Stripe calculations if online payment enabled
            // however otherwise they are used for preview pricing + none-stripe payments
            tax: fin.taxRate>0 ? (subtotal*(fin.taxRate/100)).toFixed(2) : '',
            total: fin.taxRate>0 ? (subtotal*(1+fin.taxRate/100)).toFixed(2) : '',
            taxName: fin.taxName || '',
            isPaid: false,
            status: activateProcessor ? 'AWAIT_PAYMENT' : 'AWAIT_INFO' // if no processor, we ask for user details then start preparing
         }
         console.log( ' ... orderdata: ', orderData )
         const { status, orderCode: newOrderCode, data, message: _message }= await orm.orders.save( orderData, sessionData )
         if( !status ){
            console.log( ` x orm.orders.save() failed: ${status}/${_message}`)
            res.status(403).send({ status, message }); return
         }
         let order = data; delete order.userId; delete order.orgId;
         console.log( `~ finished creating new order! orderCode(${newOrderCode}) data:`, order )
         orderCode = newOrderCode

         sessionData = sessionManager.update( req.headers.session, { order } )
         if( !sessionData ){
            console.log( 'x crap failed to update the session (after ORDER creation), internal error!')
            res.status(403).send({ status: false, message: 'Something went wrong, let\'s try again!' }); return
         }

         message = `Order #${orderCode} created!`
      } else
         console.log( ' .. order exists in system, just passing back status info (session cached)' )


      res.send(security.stripPrivateKeys({ status:true, orderCode, data: sessionData, message }))
   })

   app.put('/api/order/:action/:orderIdCode', security.authRequired('CART'), async function( req, res ){
      const orderIdCode = req.params.orderIdCode
      const action = req.params.action

      if( !(req.sessionData.role==='ADMIN' || (req.sessionData.order && orderIdCode === req.sessionData.order.orderCode)) ){
         console.log( `x FAILED orderIdCode(${orderIdCode}) !== req.sessionData.order.orderCode(${req.sessionData.order.orderCode})`)
         res.status(403).send({ status: false, message: 'Invalid order, can\'t inquire.' }); return
      }

      let sessionUpdate={}, _message=''
      if( action==='notes' ){
         const note = req.body.note.trim()
         const { status, data, message }= await orm.orders.addNote( { orderId: req.sessionData.order ? req.sessionData.order.orderId : orderIdCode, note }, req.sessionData )
         sessionUpdate = { order: data }
         _message = 'Inquiry sent!'
      } else if( action==='rating' ){
         const { status, data, message }= await orm.orders.save( { orderId: req.sessionData.order.orderId, rating: req.body.rating }, req.sessionData )
         sessionUpdate = { order: data }
         _message = 'Thank you! See you soon!'
      } else if( action==='userdetails' ){
         if( !(req.sessionData && req.sessionData.userId) ){
            console.log( ' x userdetails failed - needs sessionData.userId')
            res.status(403).send({ status: false, message: 'Invalid session, please try again.' }); return
         }
         // update the user contact details
         const contactInfo = {
            name: req.body.name.trim(),
            email: req.body.email.trim(),
            phone: req.body.phone.trim()
         }

         // BUGBUG do we update the user info each time? should ask the user if remembering this
         const { status, userData, message }= await orm.users.save({
            orgId: req.sessionData.orgId,
            userId: req.sessionData.userId,
            ...contactInfo },
         req.sessionData )
         // console.log( '[userdetails] orm.users.save:', userData )

         if( !status ){
            console.log( ` x orm.user.save() failed: ${status}/${message}`)
            res.status(403).send({ status, message }); return
         }
         sessionUpdate = userData
         {
            const notes = [ req.body.note.trim() ]
            // now update the orders with status change and the note (user info in the users)
            const { status, data, message }= await orm.orders.save( { orderId: req.sessionData.order.orderId, contactInfo, status: 'PREPARING', notes }, req.sessionData )
            sessionUpdate.order = data
         }
         _message = 'Thank you! We will contact you with progress.'
         //const { status, data: order, message }= await fetchJSON( `/api/order/userdetails/${localStorage.orderCode}`, 'put', orderData )
      } else if( action==='restart' ){
         if( req.sessionData.order.status==='AWAITING_PAYMENT' ){
            const { status, data, message }= await orm.orders.save( { orderId: req.sessionData.order.orderId, status: 'CANCELLED' }, req.sessionData )
         }
         sessionUpdate = { order: {cart:[],status:'',subtotal:0,tax:0,total:0,orderCode:'',_id:'',orderId:'',rating:0}, cart: [] }
         _message = 'Let\'s start!'
      }

      sessionData = sessionManager.updateUser( req.sessionData.userId, sessionUpdate )
      if( !sessionData ){
         console.log( 'x FAILED sessionManager.updateUser, aborting')
         res.status(403).send({ status: false, message: 'Internal error, failing update. Try again.' }); return

      }
      console.log( '[router:order] updated usr session sessionData: ', JSON.stringify(sessionData) )

      res.send(security.stripPrivateKeys({ status:true, data: sessionData, message: _message }))
   })

}

module.exports = order