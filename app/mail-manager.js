/**********************************************
 * Mail Manager
 * Loop through mail queue and try to send messages
 */
require( 'dotenv' ).config()
const orm = require('./db/orm')
const mailer = require('./mailer')
const path = require('path')
const fs = require('fs')

async function popAndSendMail(){
   const sessionData = { role: 'ADMIN' }
   const { status, data } = await orm.queue.load({}, sessionData )
   if( status ){
      const mailOptions = data[0].data
      const _id = data[0]._id
      // console.log( ' .. anything queued? ', mailOptions )
      const { status: mailStatus, result, message: mailMessage } = await mailer(sessionData).sendMail( mailOptions )
      // const responseData = JSON.stringify(result)
      if( mailStatus ){
         console.log( ` .. mail (${mailOptions.to}) response - ${result.response}` )
         // updated the responseData
         const { status, message } = await orm.queue.save( { _id, status: 'COMPLETED', responseData: result.response }, sessionData )

         const sentMailFile = path.join( process.env.DATA,'sentmail.dat' )
         fs.appendFileSync( sentMailFile, `${new Date().toISOString().substring(0,19)}, ${mailOptions.to}, ${result.response}\n` )

         // console.log( ' ... attempting to send another mail' )
         popAndSendMail()

      } else {
         console.log( `x problem sending mail: mailStatus(${mailStatus}) ${mailMessage}`)
         // updated the responseData
         const { status, message } = await orm.queue.save( { _id, status: 'FAILED', responseData: result.response }, sessionData )

         const sentMailFile = path.join( process.env.DATA,'sentmail.dat' )
         fs.appendFileSync( sentMailFile, `${new Date().toISOString().substring(0,19)}, ${mailOptions.to}, FAILED: ${result.response}\n` )

         setTimeout( popAndSendMail, 1000 )
      }

   } else {
      console.log( '.' )
      setTimeout( popAndSendMail, 5000 )
   }

}

popAndSendMail()
