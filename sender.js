require( 'dotenv' ).config()
const orm = require('./app/db/orm')
const fs = require('fs')

async function testQueue(){
   console.log( '[testQueue]')
   const sessionData = { userId: '6103a8f3d0c72478e039cec3', orgId: '6103a8f3d0c72478e039cec5' }
   const result = await orm.queue.save( { data1: 'test', data2: 'test2' }, sessionData )
   console.log( ' orm.queue.save (push) >> result: ', result )
   let moreData

   {
      const { status, data } = await orm.queue.load({}, sessionData )
      console.log( ' .. orm.queue.load (pop) >> result: ', data[0] )

      // update it
      moreData = data
   }
   {
      const _id = moreData[0]._id
      const { status, message } = await orm.queue.save( { _id, status: 'COMPLETED' }, sessionData )
      console.log( `  queue-update (id: ${_id}): status(${status}) message: ${message} ` )
      const { status: status2, data } = await orm.queue.load({ _id }, sessionData )
      console.log( ' load result2: ', data[0] )
   }
}

async function sendMail( email ){


   const sessionData = {
      userId: '6103a8f3d0c72478e039cec3',
      orgId: '6103a8f3d0c72478e039cec5',
      role: 'ADMIN'
   }
   const mailer = require( './app/mailer' )

   const title = 'ALWAYS FREE Restaurant Ordering Platform No Credit Card Required'
   const replaceData = { email }
   let { status, text, html } = mailer(sessionData).prepareMail( '_intro', replaceData )

   const result = await mailer(sessionData).queueMail( process.env.EMAIL_ADDRESS, email, title, text, html )
   if( result.status )
      console.log( '.. mail queued' )
   else
      console.log( ` x unable to queue: ${email}` )
   return result
}

function wait(time){
   return new Promise( function( resolve, reject ){
      setTimeout( resolve, time )
   })
}

async function massSend(){
   // send your mailing list
   const list = (fs.readFileSync( 'app/data/emails/_list_test.txt', 'utf-8' )).trim().split('\n')
   console.log( `\n\n\n\n== Sending List (${list.length}) == ` )
   for( let i=0; i<list.length; i++ ){
      const email = list[i].trim()
      if( email.length<5 ) continue;
      console.log( `${i}: ${email} ` )
      const { status, result, message } = await sendMail( email )
      if( !status )
         console.log( ` x rejected: ${message}` )

      // pause every 50
      if( i%50===0 ){
         console.log( '[pause]' ); await wait( 1000 )
      }
   }
}

massSend()

