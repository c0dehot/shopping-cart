// const orm = require( './db/orm.mongoose' )
const orm = require('../db/orm')
const path = require('path')
const sessionManager = require('../session-manager')
const security = require('../security.js')(sessionManager)

function router( app, API_URL, STATIC_PATH ){
   const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
   const upload = require('multer')({ dest: path.join(STATIC_PATH,UPLOAD_PATH) })
   // first entry (../) is relative location of the image to current path
   const imageTool = require( '../imageTool' )('../',UPLOAD_PATH)

   // OAUTH Authentication --------------------------------------------
   async function createOAuthSession({ type, authId, name, thumbnail } ){
      console.log( `[createOAuthSession] called for ${name}` );

      // register user in system (if they aren't there, and get the associated session)
      const { status, message, userData } = await orm.userOAuthRegister({ type, authId, name, thumbnail })

      const session = sessionManager.create( userData.id )
      // returns the logged-in user info to javascript
      return { status, session, userData, message };
   }
   // oAuth - list providers we'll accept .env info for
   // generates the ENDpoints
   require('../oAuth')(app, API_URL, ['twitter','google','facebook','github','linkedin'], createOAuthSession)
   // ---------------------------------------------------------------------

   // user auth functionality
   require( './users' )(app, orm, upload, imageTool, security, sessionManager)

   require( './admin' )(app, orm, upload, imageTool, security, sessionManager)

   require( './order' )(app, orm, security, sessionManager)

   require('./stripe')(app, API_URL, orm, security, sessionManager)

   app.get('/api/version', function(req, res ){
      res.send({ version: '1.0' })
   })
}

module.exports = router
