function mailer( sessionData={} ){
   const security = require( './security' )
   const path = require('path')
   const fs = require( 'fs' )

   return {
      unsubscribe: function( email, code, reason, ip ){
         const unsubCode = security().emailCode( email )
         console.log( `[unsubscribe] reasons(${reason}) ip(${ip}) `)
         if( !(code.length>0 && code===unsubCode) )
            return { status: false, message: 'Invalid email unsubscribe link.' }

         const unsubscribeFile = path.join( process.env.DATA,'unsubscribe.dat' )
         fs.appendFileSync( unsubscribeFile, `${new Date().toISOString().substring(0,19)}, ${email}, ${ip}, ${reason}\n` )
         return { status: true, message: '' }
      },
      subscribe: function( email, name, ip ){
         console.log( '[subscribe]')
         if( email.length===0 )
            return { status: false, message: 'Invalid email.' }

         const subscribeFile = path.join( process.env.DATA,'subscribe.dat' )
         fs.appendFileSync( subscribeFile, `${new Date().toISOString().substring(0,19)}, ${email}, ${ip}, ${name}\n` )
         return { status: true, message: 'Successfully subscribed' }
      },
      adminList: function( list ){
         if( ['unsubscribe','subscribe'].indexOf(list) === -1 )
            return { status: false, message: 'Invalid list.' }

         const listFile = path.join( process.env.DATA,`${list}.dat` )
         const data = fs.readFileSync(listFile, 'utf8').trim()
         return { status: true, data }
      },

      prepareMail: function( file, keys, htmlData='', textData='' ){
         const security = require('./security')
         // for any unsubscribe link we require a code for that email as verification its a real link
         keys.unsubCode = security().emailCode( keys.email || '' )

         function replaceKeys( keys, data ){
            const keysFound = data.match(/\%([a-zA-Z0-9]+)\%/g)
            keysFound.forEach(function( key ){
               const _key = key.substring(1,key.length-1)
               data = data.replace(key,keys[_key] || '')
            })
            return data
         }

         const textTemplateFile = path.join( process.env.DATA,'/emails/template.txt' )
         const textTemplateData = fs.readFileSync(textTemplateFile, 'utf8').trim()
         const textFile = path.join( process.env.DATA,`/emails/${file}.txt` )
         if( !textData ) textData = fs.readFileSync(textFile, 'utf8').trim()
         textData = textTemplateData.replace( '%CONTENT%', textData )
         textData = replaceKeys( keys, textData )

         const htmlTemplateFile = path.join( process.env.DATA,'/emails/template.html' )
         const htmlTemplateData = fs.readFileSync(htmlTemplateFile, 'utf8').trim()
         const htmlFile = path.join( process.env.DATA,`/emails/${file}.html` )
         if( !htmlData ) htmlData = fs.readFileSync(htmlFile, 'utf8').trim()
         htmlData = htmlTemplateData.replace( '%CONTENT%', htmlData )
         htmlData = replaceKeys( keys, htmlData )

         return { status: true, text: textData, html: htmlData }
      },

      queueMail: async function( from, email=undefined, subject, text, html='' ){
         const orm = require('./db/orm')
         // remove ending '.' if put on accidentally
         if( email && email.substr(-1)==='.' ) email = email.substr(0,email.length-1)

         let mailOptions={
            from: process.env.EMAIL_ADDRESS,
            to : email || process.env.EMAIL_ADDRESS,
            replyTo: from,
            subject,
            text
         }
         if( html ) mailOptions.html = html.trim()
         // only do the BCC if the message is being sent to our address, not outbound to user
         if( mailOptions.to === process.env.EMAIL_ADDRESS && process.env.EMAIL_BCC ) mailOptions.bcc = process.env.EMAIL_BCC;

         const result = await orm.queue.save( mailOptions, sessionData )
         return result
      },

      sendMail: async function( mailOptions ){
         const nodemailer = require( 'nodemailer' )
         // console.log( '[sendMail] preparing to send: ', mailOptions )
         if( !(process.env.EMAIL_HOST && process.env.EMAIL_HOST_PORT && process.env.EMAIL_ADDRESS && process.env.EMAIL_HOST_LOGIN && process.env.EMAIL_HOST_PASSWORD ) )
            console.log( '!ERROR .env lacks EMAIL_HOST/EMAIL_HOST_PORT/EMAIL_ADDRESS/EMAIL_PASSWORD ...?!' )

         let result = {}
         try {
            const transporter = nodemailer.createTransport({
               host: process.env.EMAIL_HOST,
               port: process.env.EMAIL_HOST_PORT,
               secure: false,
               auth: {
                  user: process.env.EMAIL_HOST_LOGIN,
                  pass: process.env.EMAIL_HOST_PASSWORD
               }
            })

            result = await transporter.sendMail(mailOptions)
         } catch( e ){
            console.log( `catch error: ${e.response} email ${JSON.stringify(e.rejected||'[]')}` )
            result = e
         }
         // console.log( `[mailer:sendMail] (from: ${mailOptions.from}, bcc(${mailOptions.bcc})  to: ${mailOptions.to}!` )
         const status = ( result.accepted && result.accepted.length>0 && result.messageId )
         return { status, result, message: result.response+':'+JSON.stringify(result.rejected||'[]') }
      }
   }
}
module.exports = mailer