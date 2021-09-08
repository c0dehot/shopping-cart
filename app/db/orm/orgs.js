function orgs( db ){
   const { DateTime } = require('luxon')

   return {
      save: async function( orgData, sessionData ){
         let _id = orgData._id || orgData.orgId || ''
         let message = ''
         if( _id && !(sessionData && sessionData.role==='ADMIN') )
            return { status: false, message: 'Unable to update this organization.' }

         // get _id from _id or org
         _id = _id || (sessionData && sessionData.orgId || '')

         // if url given, check it is unique (if a user exists, then we look at org url that are NOT the users' org)
         if( orgData.url ){
            let url = orgData.url
            const result = await ( _id ?
               db.orgs.findOne({ url, _id: { $ne: db.ObjectId(`${_id}`) } }).lean() :
               db.orgs.findOne({ url }).lean() )
            console.log( `orgData.url set (${orgData.url}, orgId(${_id})) looking to see if other org using same subdomian - result:`, result )
            if( result && result._id ){
               // already used so give another
               orgData.url = url + Math.floor(Math.random()*10000)
               message = `Your subdomain conflicts, we adjusted: ${orgData.url}`
               console.log( `.. ! subdomain CONFLICTS, auto-adjusting...: ${orgData.url}` )
            }
         }

         if( _id ){
            console.log( '..... ORGS::sae $set: orgData: ', orgData )
            const result = await db.orgs.updateOne({ _id: db.ObjectId(`${_id}`)}, { $set: orgData })
            if( !result.ok )
               return { status: false, message: 'Problems updating organization' }

            // we set an updatedAt that is just a little less than the expected mongo created one, such that it will trigger an update
            // and flush session cache when available
            const updatedAt = DateTime.now().minus(2000).toUTC().toISO()
            return { status: true, data: { updatedAt }, message: message || 'Updated' }
         } else {
            const result = await db.orgs.create( orgData )
            if( !result._id )
               return { status: false, message: 'Problems creating organization' }

            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            const data = JSON.parse(JSON.stringify(result))
            delete data.__v; delete data.createdAt;
            return { status: true, data, message }
         }
      },

      load: async function ( where, sessionData={} ){
         // if not a url search, we need the org
         let multiOrg = false
         console.log( '[org::load] where', where, typeof(where.orgId) )
         if( where._id || where.orgId && !where.orgId[0] ){
            where._id = db.ObjectId(`${where._id||where.orgId}`)
            delete where.orgId
            // can only read own org (note cast all to strings
            if( !(`${where._id}` === '000000000000000000000000' || (sessionData.hasOwnProperty('orgId') && `${where._id}` === `${sessionData.orgId}`)) )
               return { status: false, message: 'Invalid read request' }

         } else if( typeof(where.orgId)==='object' && where.orgId[0] && where.orgId.length>0 ){
            // array of orgs
            multiOrg = true
            where._id = where.orgId
            delete where.orgId

         } else if( !where.url )
            return { status: false, message: 'Invalid where query' }

         const result = multiOrg ? await db.orgs.find( where, 'name phone email url createdAt').lean()
            : await db.orgs.findOne( where, '-__v -createdAt').lean()
         if( !result || result.length<1 ){
            console.log( '.. !! Unable to find organization (odd!):', result )
            return { status: false, message: 'Unable to find organization' }
         }
         // clean output in some situations
         let data = JSON.parse(JSON.stringify(result))
         if( `${where._id}`==='000000000000000000000000' ){
            delete data._id
            delete data.updatedAt
         } else if( !multiOrg )
            data.orgId = data._id

         return { status: true, data }
      },

      init: async function( orgData ){
         await db.orgs.deleteOne( { _id: orgData._id } )
         const result = await db.orgs.create( orgData )
         if( !result._id )
            return { status: false, message: 'Problems initializing new org' }

         return { status: true, message: 'Complete' }
      }
   }
}

module.exports = orgs