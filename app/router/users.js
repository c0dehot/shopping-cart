const { DateTime } = require('luxon')
const mailer = require( '../mailer' )

function users( app, orm, upload, imageTool, security, sessionManager ){
   app.post( '/api/users/signup', upload.single('imageFile'), async function( req, res ){
      console.log( `[POST /api/users/signup] session(${req.headers.session})` )

      if( req.sessionData )
         return res.status(403).send( { status: false, message: 'Please log-out of current account first' } )


      // IMAGE UPLOAD - we have a picture upload so let's process it!
      if( req.file ){
         const [ resizeWidth, resizeHeight ] = req.body.imageSize.split('x')
         console.log( ` .. picture attached, resizing (${resizeWidth} x ${resizeHeight}) - ${req.file.path}`)
         userForm.thumbnail = await imageTool.resize( req.file, resizeWidth, resizeHeight);
      }

      // INVITE CODE - gather account info if present (to add this user to existing account)
      let orgData = {}
      let suggestionUrl = ''
      if( req.body.refCode && req.body.refCode.length===9 ){
         // look up a 'MEMBER' join code, so we can attach the person to an pre-existing organization with certain permissions
      } else {
         // no associated org, so we need to create one, trial for 180 days
         const expiresAt = DateTime.local().setZone('America/Toronto').plus( { days: 180 }).toISODate()

         {
            const { status, data, message }= await orm.orgs.load({ _id: '000000000000000000000000' })
            if( !status ){
               console.log( ` x unable to load the default org! ${status}/${message}`)
               res.status(403).send({ status, message }); return
            }
            orgData = data
         }
         suggestionUrl = req.body.name.toLowerCase().replace(' ','-').replace(/[^a-z0-9/-]/g,'') // suggestion url
         const { status, data, message }= await orm.orgs.save({ ...orgData, ...req.body, _orderEmail: req.body.email, expiresAt, url: suggestionUrl })
         if( !status ){
            console.log( ` x orm.user.save() for creating user org: ${status}/${message}`)
            res.status(403).send({ status, message }); return
         }
         orgData = data
      }

      const { status, userData, message }= await orm.users.save({
         orgId: orgData._id,
         name: 'Owner',
         email: req.body.email,
         phone: req.body.phone,
         password: req.body.password,
         refCode: req.body.refCode,
         redirectUrl: '/signup-details',
         role: 'ADMIN'
      })
      if( !status ){
         console.log( ` x orm.user.save() failed: ${status}/${message}`)
         res.status(403).send({ status, message }); return
      }
      userData.org = orgData
      // generate a session-key
      const session = sessionManager.create(userData)
      console.log( `.. signup org+user complete! session: ${session}`, userData )

      // email admin
      {
         const title = '*Resto Signup* ' + (req.body.refCode.length>4 ? `Ref#${req.body.refCode}` : '')
         const text = `
   A new restaurant signed up:
   Signup Email: ${req.body.email}
   Signup Phone: ${req.body.phone}

   Restaurant Name: ${orgData.name}
   Restaurant Phone: ${orgData.phone}
   Restaurant Address: ${orgData.address}
   Url: restocart.ca/${suggestionUrl}/

   Referral code: ${req.body.refCode || '-'}
         `
         const { status, message: errorResponse } = await mailer(req.sessionData).queueMail( req.body.email, '', title, text )
      }
      {
         const title = 'Welcome to Restocart!'
         const replaceData = { email: req.body.email, suggestionUrl, restoName: orgData.name }
         const { status, text, html } = mailer(req.sessionData).prepareMail( 'signup', replaceData )
         const result = await mailer(req.sessionData).queueMail( process.env.EMAIL_ADDRESS, req.body.email, title, text, html )
         console.log( ` .. status(${status}) queued email:`, result )
      }

      res.send(security.stripPrivateKeys({ status, session, userData, message }))
   })

   app.post('/api/users/login', async function(req, res) {
      console.log( `[POST /api/users/login] email(${req.body.email}` )
      const { status, userData, message }= await orm.users.login( req.body.email, req.body.password )
      if( !status ){
         res.status(403).send({ status, message }); return
      }

      console.log( 'user login: userData: ', userData )
      // generate a session-key
      const session = sessionManager.create( userData )
      // console.log( `.. login complete! session: ${session}` )
      res.send(security.stripPrivateKeys({ status, session, userData, message }))
   })

   app.get('/api/users/session', security.authRequired('ADMIN'), async function(req, res) {
      res.send(security.stripPrivateKeys({ status: true, userData: req.sessionData }))
   })

   // all these endpoints require VALID session info
   app.get('/api/users/logout', security.authRequired('CART'), async function(req, res) {
      sessionManager.remove( req.headers.session )
      console.log( ` .. removed session ${req.headers.session}`)
      res.send({ status: true, message: 'Logout complete' })
   })

   app.get('/api/users/affiliates', security.authRequired('ADMIN'), async function(req, res ){
      const { status, data, message }= await orm.users.affiliates(
         req.sessionData.role==='SUPER' ? {} : { refCode: req.sessionData.affilCode }, req.sessionData )
      if( !status ){
         console.log( `.. no affiliates status(${status}) user(${req.sessionData._id}) to load org(${req.sessionData.orgId})`, data )
         res.status(403).send({ status, message }); return
      }
      // if active orders that we are polling for, only send back data that has updates
      res.send(security.stripPrivateKeys({ status, data, message }))
   })

   app.put('/api/users/redirecturl', security.authRequired('ADMIN'), async function(req, res){
      const { status, redirectUrl, message }= await orm.users.redirectUrl( req.body.url, req.sessionData )
      if( !status ){
         res.status(403).send({ status: false, message }); return
      }
      // updating changes to user session
      sessionManager.update( req.headers.session, { redirectUrl } )

      res.send({ status: true, message: '' })
   })
}

module.exports = users