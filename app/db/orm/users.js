function users( db ){
   const orm = {}
   const bcrypt = require( 'bcrypt' )
   const security = require( '../../security' )()
   orm.orgs = require( './orgs' )(db)
   orm.items = require( './items' )(db)

   return {
      save: async function( userData, sessionData={} ){
         let _id = userData.userId || userData._id || ''
         let _password = userData._password || userData.password || ''
         // ACL: admins can edit all, a user can only edit themselves
         if( _id && !(sessionData && (sessionData.role==='ADMIN' || sessionData.userId===_id)) )
            return { status: false, message: 'Unable to update this user.' }
         // no id? use session-userId if we have
         _id = _id || sessionData.userId

         // refuse duplicate user emails
         if( !_id ){
            const duplicateUser = await db.users.findOne({ email: userData.email }).lean()
            if( duplicateUser && duplicateUser._id && !(userData.isDummyUser && userData.email==='') )
               return { status: false, message: 'Duplicate email, try another or login' }
            if( !_password )
               return { status: false, message: 'You need a password!' }
         }

         // hash the password (salt=10)
         if( _password )
            userData._password = bcrypt.hashSync( _password, 10 )


         if( _id ){
            // console.log( ' .. updating userData', userData )
            if( sessionData.role!=='ADMIN' ) delete userData.role /* non-admins cannot UPDATE role */
            const result = await db.users.findOneAndUpdate({ _id:db.ObjectId(`${_id}`) }, { $set: userData })
            if( !result._id )
               return { status: false, message: 'Problems updating user' }

            const data = { ...JSON.parse(JSON.stringify(result)), ...userData }
            data.userId = data._id
            delete data.__v; delete data.createdAt; delete data.updatedAt;
            console.log( ' .... sending back result: ', data )

            return { status: true, userData: data, message: 'Updated' }
         } else {
            // give the user a unique affiliate code (not for cart-users)
            if( userData.role !== 'CART' ){
               let tryCnt=20, affilCode, duplicateCode=false
               do {
                  affilCode = security.codeGenerate('AFFILT')
                  duplicateCode = await db.users.findOne({ affilCode }).lean()
                  console.log( ` .. [${tryCnt}] generated affilCode(${affilCode}), taken? (${duplicateCode && duplicateCode._id})` )
               } while( tryCnt-->0 && duplicateCode && duplicateCode._id )
               userData.affilCode = affilCode
            }

            // console.log( ' .. attemping to create a user : userData', userData )
            const result = await db.users.create( userData )
            if( !result._id )
               return { status: false, message: 'Problems creating user' }

            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            const data = JSON.parse(JSON.stringify(result))
            data.userId = data._id
            delete data.__v; delete data.createdAt; delete data.updatedAt;
            return { status: true, userData: data, message: `Success! ${userData.name} was successfully registered` }
         }
      },

      login: async function( email, password ) {
         const userData = await db.users.findOne({ email: email },'-__v -createdAt -updatedAt' ).lean()
         if( !userData || !userData._id )
            return { status: false, message: 'Invalid login' }


         // compare the passwords to see if valid login
         const isValidPassword = bcrypt.compareSync( password, userData._password )
         if( !isValidPassword )
            return { status: false, message: 'Invalid password' }

         delete userData._password

         // add the org info to this object - (we fake a session with orgId)
         {
            const { status, data, message } = await orm.orgs.load({ orgId: userData.orgId }, { orgId: userData.orgId })
            if( !status )
               return { status, message }
            userData.org = data
            userData.userId = userData._id
         }
         {
            const { status, data, message }= await orm.items.load( {}, { orgId: userData.orgId } )
            if( !status )
               return { status, message }
            userData.items = data
         }

         return { status: true, message: `Logging in ${userData.name}...`, userData }
      },

      load: async function( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id || where.userId )
            where._id = db.ObjectId(`${where._id||where.userId}`)

         where.orgId = db.ObjectId(`${sessionData.orgId}`)
         const result = await db.users.find( where,'-__v -_password -createdAt -updatedAt').lean()
         if( !result || result.length<1 || !result[0]._id )
            return { status: false, message: 'Invalid userId' }

         result[0].userId = result[0]._id
         return { status: true, data: result }
      },

      affiliates: async function ( where, sessionData ){
         if( !where || !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         // slow for now, but this is temporary before offloaded to another service
         // where.refCode = sessionData.affilCode
         const result = await db.users.find( where, '-__v -createdAt -updatedAt').lean() //.sort({ [key]: 1 })
         console.log( `[affiliates] looked for where(${JSON.stringify(where)})` )
         if( !result || result.length<1 || !result[0]._id ){
            console.log( '.. !! Unable to find item:', result )
            return { status: true, message: 'No affiliate results' }
         }
         // BUGBUG switch to a populate() method
         const orgId = result.map( org=>org.orgId )
         const { status, data, message } = await orm.orgs.load( { orgId } )
         return { status, data, message }
      },

      redirectUrl: async function ( url, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         const redirectUrl = url.replace(/[^a-z0-9/]+/gi,'')
         const updateData = { redirectUrl }
         // console.log( ' .. updating userData', userData )
         const result = await db.users.updateOne({ _id:db.ObjectId(`${sessionData._id}`) }, { $set: updateData })
         if( !result.ok )
            return { status: false, message: 'Problems updating user' }

         return { status: true, redirectUrl, message: 'Updated' }
      }

   }
}
module.exports = users

/*

   async function userOAuthRegister({ type, authId, name, thumbnail } ){
      if( !authId ){
         console.log( '[registerUser] invalid OAuth data! ', authId )
         return { status: false, message: 'Invalid user data' }
      }

      let oAuthUser = await db.users.findOne({ type, authId })
      console.log( `.. looking in userlist for type(${type}) and authId(${authId})` )
      if( !oAuthUser || !oAuthUser._id ){
         // new user so create!
         console.log( '... SAVING oAuth user to database ')
         oAuthUser = await db.users.create({ type, authId, name, thumbnail })
         if( !oAuthUser._id ){
            return { status: false, message: `Sorry failed creating entry for ${name}: ` }
         }
      }
      // console.log( ' .. user: ' + JSON.stringify( oAuthUser ) )

      return {
         status: true,
         message: `Success! ${name} was successfully logged-in`,
         userData: {
            id: oAuthUser._id,
            name: oAuthUser.name,
            email: '',
            thumbnail: oAuthUser.thumbnail,
            type: oAuthUser.type
         }
      }
   }

   async function userLogin( email, password ) {
      const userData = await db.users.findOne({ email: email }, '-createdAt -updatedAt')
      if( !userData || !userData._id ) {
         return { status: false, message: 'Invalid login' }
      }

      // compare the passwords to see if valid login
      const isValidPassword = await bcrypt.compare( password, userData.password )
      // console.log( ` [loginUser] checking password (password: ${password} ) hash(${userData.password})`, isValidPassword )
      if( !isValidPassword ) {
         return { status: false, message: 'Invalid password' }
      }

      return {
         status: true,
         message: `Logging in ${userData.name}...`,
         userData: {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            thumbnail: userData.thumbnail,
            type: 'local'
         }
      }
   }



   async function productList( productId='', ownerId='', message='' ){
      const findSet = {}
      if( productId && productId.length>10 ) {
         findSet._id = productId
      }
      if( ownerId ) {
         findSet.ownerId = ownerId
      }
      let products = await db.products.find(findSet, '-__v')
      // map a 'id' field to be consistent with mysql
      console.log( `[orm:productList] products(${products.length}) findSet:`, findSet )
      return {
         status: true,
         message,
         products
      }
   }

   async function productSaveAndList( newProduct, ownerId ){
      // refuse duplicate user emails
      const result = await db.products.create({ ...newProduct, ownerId })
      if( !result._id ){
         return {
            status: false,
            message: 'Sorry could not save task!'
         }
      }

      return productList( '', ownerId, 'Product saved' )
   }

   async function seedDatabase(){
      const productsExist = await db.products.findOne({})
      if( productsExist && productsExist._id ){
         console.log( ' .. not seeding, found a product already.' )
         return
      }

      const fs = require('fs')
      const products = JSON.parse( fs.readFileSync( './app/db/seed.json' ) )
      products.forEach( async productData=>{
         const result = await db.products.create( productData )
         if( !result._id ){
            console.log( ' .. problems seeding entry: ', productData )
         } else {
            console.log( `.. seeded: ${productData.heading}` )
         }
      })
   }
}

module.exports = users
*/