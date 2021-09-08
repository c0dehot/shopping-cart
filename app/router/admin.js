
function admin( app, orm, upload, imageTool, security, sessionManager ){
   app.get('/api/users', security.authRequired('ADMIN'), async function(req, res) {
      const { status, data, message }= await orm.users.load({ _id: req.sessionData.userId }, req.sessionData )
      if( !status ){
         res.status(403).send({ status, message }); return
      }

      console.log( 'users.load: userData: ', data )
      // console.log( `.. login complete! session: ${session}` )
      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.put('/api/users', security.authRequired('ADMIN'), async function(req, res){
      // console.log( `[PUT /api/users] (session ogId: ${req.sessionData.org._id}) req.body:`, req.body )
      const { status, message }= await orm.users.save( req.body, req.sessionData )
      if( !status ){
         console.log( ` x saving user rejected: ${message}`)
         res.status(403).send({ status: false, message }); return
      }
      const sessionDataUpdate = req.body
      // updating changes to user session
      sessionManager.update( req.headers.session, sessionDataUpdate )

      // if !req.query.url & message='' -> 'Updated'
      res.send(security.stripPrivateKeys({ status, message: message||'Saved' }))
   })

   app.get('/api/orgs', security.authRequired('ADMIN'), async function(req, res ){
      if( req.sessionData.orgId.length<20 ){
         console.log( `.. ! INVALID SESSION sessionData.orgId:(${req.sessionData.orgId}) `)
         res.status(403).send({ status: false, message: 'Invalid session, login again' }); return
      }
      const { status, data, message }= await orm.orgs.load({ _id: req.sessionData.orgId }, req.sessionData)
      if( !status ){
         console.log( `.. ! DISALLOWED loading /api/orgs: forbidden for user(${req.sessionId._id}) to load org(${req.sessionData.orgId})` )
         res.status(403).send({ status, message }); return
      }
      // expose secret fields that admins can edit
      data.financial = data._financial; data.orderEmail = data._orderEmail
      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.put('/api/orgs', security.authRequired('ADMIN'), async function(req, res){
      // console.log( `[PUT /api/orgs] (session ogId: ${req.sessionData.org._id}) req.body:`, req.body )
      // shift private fields back to private keys
      if( req.body.financial ){
         req.body._financial = req.body.financial; delete req.body.financial
      }
      if( req.body.orderEmail ){
         req.body._orderEmail = req.body.orderEmail; delete req.body.orderEmail
      }
      const orgData = { ...req.body }
      const { status, data, message }= await orm.orgs.save( orgData, req.sessionData )
      if( !status ){
         console.log( `x ${message}`)
         res.status(403).send({ status: false, message }); return
      }
      let sessionDataUpdate = { org: orgData }
      // console.log( ' ---- PUT /api/orgs updating sessionDataUpdate: ', sessionDataUpdate )
      // update URL if passed in (ex. from /signup-details)
      if( req.query.url ){
         const { status, redirectUrl, message }= await orm.users.redirectUrl( req.query.url, req.sessionData )
         if( !status ){
            res.status(403).send({ status: false, message }); return
         }
         sessionDataUpdate = { ...sessionDataUpdate, ...{ redirectUrl } }
      }
      // updating changes to user session
      sessionManager.update( req.headers.session, sessionDataUpdate )
      // update the updateTracker
      // console.log( '     .... refreshUpdateTracker -> org update: ', data.updatedAt )
      sessionManager.refreshUpdateTracker( orgData.orgId, { org: data.updatedAt })

      // if !req.query.url & message='' -> 'Updated'
      res.send(security.stripPrivateKeys({ status, message: message||'Saved' }))
   })

   app.get('/api/items/:id?', security.authRequired('ADMIN'), async function(req, res ){
      const where = req.params.id ? { _id: req.params.id } : {}
      const { status, data, message }= await orm.items.load( where, req.sessionData )
      if( !status ){
         console.log( `.. no items status(${status}) user(${req.sessionData._id}) to load org(${req.sessionData.orgId})`, data )
         res.status(403).send({ status, message }); return
      }
      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.post('/api/items/:id', security.authRequired('ADMIN'), async function(req, res){
      console.log( `[POST /api/items/${req.params.id}] (session ogId: ${req.sessionData.org._id}) req.body:`, req.body )
      const { status, message }= await orm.items.save( req.body, req.sessionData )
      if( !status ){
         res.status(403).send({ status: false, message }); return
      }

      { // update session for items
         const { status, data, lastUpdatedAt, message }= await orm.items.load({}, req.sessionData )
         if( !status ){
            res.status(403).send({ status: false, message }); return
         }
         sessionManager.update( req.headers.session, { itemsLastUpdate: lastUpdatedAt, items: data } )
         // update the updateTracker (get orgId from first entry)
         console.log( '     .... refreshUpdateTracker -> items update: ', lastUpdatedAt )
         if( data[0].orgId ) sessionManager.refreshUpdateTracker( data[0].orgId, { items: lastUpdatedAt })

      }
      res.send(security.stripPrivateKeys({ status, message }))
   })

   app.put('/api/items/:id', security.authRequired('ADMIN'), async function(req, res){
      if( req.params.id!==req.body.itemId ){
         res.status(403).send({ status: false, message: 'Malformed data, rejecting' }); return
      }
      console.log( `[PUT /api/items/${req.params.id}] itemData:`, req.body )
      const { status, message }= await orm.items.save( req.body, req.sessionData )
      if( !status ){
         res.status(403).send({ status: false, message }); return
      }

      { // update session for items
         const { status, data, lastUpdatedAt, message }= await orm.items.load({}, req.sessionData )
         if( !status ){
            res.status(403).send({ status: false, message }); return
         }
         sessionManager.update( req.headers.session, { items: data } )
         // update the updateTracker
         console.log( '     .... refreshUpdateTracker -> items update: ', lastUpdatedAt )
         if( data[0].orgId ) sessionManager.refreshUpdateTracker( data[0].orgId, { items: lastUpdatedAt })
      }

      res.send(security.stripPrivateKeys({ status, message }))
   })

   app.delete('/api/items/:id', security.authRequired('ADMIN'), async function(req, res){
      // console.log( `[DELETE /api/items/${req.params.id}] (session ogId: ${req.sessionData.org._id}) req.body:` )
      const { status, message }= await orm.items.remove( { _id: req.params.id }, req.sessionData )
      if( !status ){
         res.status(403).send({ status: false, message }); return
      }

      res.send(security.stripPrivateKeys({ status, message }))
   })

   app.post('/api/media/:resizing/:_id?', security.authRequired('ADMIN'), upload.single('mediaFile'), async function( req,res ){
      if( !req.file )
         return res.send( { status:true, message: 'No media attached' } )

      let _id = req.params._id
      if( _id ){
         // verify this media-key is existing & owned by this organization
         // else we disallow it
         const { status, data, message }= await orm.media.load( { _id }, req.sessionData )
         console.log( ` .. request to overwrite media _id(${_id}); verified ownership/existance of media:`, data )
         if( !status || !data || data.length !== 1 )
            _id = ''

      }
      if( !_id ){
         const { status, data, message }= await orm.media.save( {}, req.sessionData )
         if( !status ) {
            console.log( ` .. media crate error: ${status} : ${message}`)
            return res.send({ status, message })
         }
         _id = data._id
      }

      // resize the picture upload & save to the media ORM
      const [ mediaDimensions, mediaRotate ] = req.params.resizing.split(',')
      const [ resizeWidth, resizeHeight ] = mediaDimensions.split('x')
      const [ mediaSize, mediaUrl ]= await imageTool.resize( req.file, _id, resizeWidth, resizeHeight)

      const mediaData = { _id, mediaUrl, mediaDimensions, mediaSize, mediaMeta: { rotate: mediaRotate } }
      console.log( ` .. picture attached, resizing (${resizeWidth} x ${resizeHeight}) - pic-path: ${req.file.path} --> ${mediaUrl} mediaData:`, mediaData )
      const { status, data, message }= await orm.media.save( mediaData, req.sessionData )
      if( !status )
         return res.send({ status, message })


      res.send({ status, mediaUrl, message })
   })

   app.delete('/api/media/:_id?', security.authRequired('ADMIN'), async function( req,res ){
      let _id = req.params._id
      if( !_id ){
         res.status(403).send({ status: false, message: 'Missing image-id' }); return
      }
      // verify this media-key is existing & owned by this organization
      // else we disallow it
      const { status, data, message }= await orm.media.remove( { _id }, req.sessionData )
      if( !status ){
         res.status(403).send({ status: false, message: 'Unable to delete media' }); return
      }
      console.log( ` .. deleting image _id(${_id}); verified ownership/existance of media:`, data )
      let delCount = 0
      if( data.length>0 )
         delCount = await imageTool.remove( path.join(STATIC_PATH,UPLOAD_PATH), data )

      res.send({ status: true, message })
   })

   app.get('/api/orders/:status?/:timestamp?', security.authRequired('ADMIN'), async function(req, res ){
      const where = {}
      if( req.params.status )
         where.status = req.params.status
      if( req.params.since )
         where.updatedAt = req.params.since

      const { status, data, message }= await orm.orders.load( where, req.sessionData )
      if( !status ){
         console.log( `.. no items status(${status}) user(${req.sessionData._id}) to load org(${req.sessionData.orgId})`, data )
         res.status(403).send({ status, message }); return
      }
      // if active orders that we are polling for, only send back data that has updates
      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.put('/api/orders/:orderId', security.authRequired('ADMIN'), async function(req, res ){
      const orderData = { ...req.body, _id: req.params.orderId }

      const { status, data, message }= await orm.orders.save( orderData, req.sessionData )
      if( !status ){
         res.status(403).send({ status, message }); return
      }

      // update session for the _order_ user, using ordersData + the new info we merging in.
      const order = { ...data, ...req.body }
      sessionData = sessionManager.updateUser( data.userId, { order } )

      // if active orders that we are polling for, only send back data that has updates
      res.send(security.stripPrivateKeys({ status, data: order, message }))
   })

   app.put('/api/orders/add-note/:orderId', security.authRequired('ADMIN'), async function( req, res ){
      const orderId = req.params.orderId
      const note = req.body.note.trim()
      const { status, data, message }= await orm.orders.addNote( { orderId, note }, req.sessionData )

      // update the order info (for the _user_ of the order, which is not the admin if admin replying)
      sessionData = sessionManager.updateUser( data.userId, { order: data } )

      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.post('/api/mail/contactform', async function( req, res ){
      console.log( '[POST] received email:', req.body ) // name','email','type','inquiry
      const mailer = require( '../mailer' )
      const title = `[RestoInquiry:${req.body.type}] ${req.body.title}`
      const ip = ((req.headers['x-real-ip'] || req.headers['x-forwarded-for']) || req.socket.remoteAddress) || req.ip
      const text = req.body.message + `\n - IP: ${ip}`
      const { status, message: errorResponse } = await mailer(req.sessionData).queueMail( req.body.email, '', title, text )

      console.log( `.. contact form: ${text} -> ${status}/${errorResponse} ip(${ip})` )
      const message = status ? `Sent to ${req.body.email}` : `Failed sending to ${req.body.email}: ${errorResponse}`
      res.send( { status, message } )
   })

   app.post('/api/mail/unsubscribe', async function( req, res ){
      console.log( '[POST] /mail/unsubscribe:', req.body ) // name','email','type','inquiry
      const mailer = require( '../mailer' )
      const ip = ((req.headers['x-real-ip'] || req.headers['x-forwarded-for']) || req.socket.remoteAddress) || req.ip
      const { status, message } = await mailer(req.sessionData).unsubscribe( req.body.email, req.body.code, req.body.reason, ip )

      console.log( `.. unsubscribed ${req.body.email} -> (${status}) message(${message}) ip(${ip})` )
      res.send( { status, message } )
   })

   app.post('/api/mail/subscribe', async function( req, res ){
      console.log( '[POST] /mail/subscribe:', req.body ) // name','email','type','inquiry
      const mailer = require( '../mailer' )
      const ip = ((req.headers['x-real-ip'] || req.headers['x-forwarded-for']) || req.socket.remoteAddress) || req.ip
      const { status, message } = await mailer(req.sessionData).subscribe( req.body.email, req.body.name, ip )

      console.log( `.. subscribed ${req.body.name}:${req.body.email} -> (${status}) message(${message}) ip(${ip})` )
      res.send( { status, message } )
   })

   app.get('/api/stats/:pwd?', async function( req, res ){
      const mailer = require( '../mailer' )
      console.log( '[GET] /stats:' )
      if( !process.env.ADMIN_PASS.length>4 || req.params.pwd !== process.env.ADMIN_PASS )
         return res.send( { status: false, message: 'Not authorized' } )

      let html = '<html><head><title>Stats</title></head><body>'
      {
         const { status, data } = await mailer(req.sessionData).adminList('unsubscribe')
         html += `<h1>Unsubscribe List (${data.split('\n').length})</h1><xmp>${data}</xmp>`
      }
      {
         const { status, data } = await mailer(req.sessionData).adminList('subscribe')
         html += `<h1>Subscribe List (${data.split('\n').length})</h1><xmp>${data}</xmp>`
      }
      html += '</body></html>'
      res.send( html )
   })

   app.get('/api/init', async function(req, res ){
      // initialize parts of system needed.
      console.log( '/api/init starting....' )
      let html = '<h1>Preparing to initialize...</h1>'
      {
         const { status, message }= await orm.items.init({ orgId: '000000000000000000000000' }) //, info: ' ', itemCategory: ' ', image: ' ', price: '0.00',  }
         console.log( `saved item: ${status} / ${message}`)
         html +='<h2>'+( status ? 'Successfull initialized items; ' : 'Failed to initialize items; ' )+ message + '</h2>'
         console.log( status ? '* Successfull initialized items; ' : 'x Failed to initialize items; ' )
      }
      {
         // placeholder organization
         const { status, message }= await orm.orgs.init({
            _id: '000000000000000000000000',
            name: 'My Org',
            timezone: 'America/Toronto',
            businessHolidays: [ '31-Dec-2021', '1-Jan-2022' ],
            itemCategories: [ 'Specials', 'Main Courses', 'Desserts', 'Beverages' ],
            deliveryOptions: [
               { value: 'pickup', label: 'Pick-Up' },
               { value: 'delivery', label: 'Delivery' },
               { value: 'dinein', label: 'Dine-In' },
               { value: 'curbside', label: 'Curbside Pickup' } ],
            businessHours: [
               { open: '', close: '' },
               { open: '09:00', close: '17:00' },
               { open: '09:00', close: '17:00' },
               { open: '09:00', close: '17:00' },
               { open: '09:00', close: '17:00' },
               { open: '09:00', close: '17:00' },
               { open: '', close: '' } ],
            _financial: {
               'stripePubKey' : '',
               'stripePrivKey' : '',
               'stripeProductKey' : '',
               'stripeTaxKey' : '',
               'currencyISO' : 'CAD',
               'currencyDesc' : 'Canadian Dollar (CAD)'
            }
         })
         html +='<h2>'+( status ? 'Successfull initialized default org; ' : 'Failed to initialize default org; ' )+ message + '</h2>'
         console.log( status ? '* Successfull initialized default org; ' : 'x Failed to initialize default org; ' )
      }

      console.log( ' .. complete! ' )
      res.send( html )
   })

   app.get('/api/financial/currencies', security.authRequired('ADMIN'), async function( req, res ){
      const fs = require('fs')
      const currencies = JSON.parse( fs.readFileSync( __dirname + '/../data/currencies.json', 'utf8') || '{}' )
      res.send({ status: true, currencies })
   })
}

module.exports = admin