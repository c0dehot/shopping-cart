const path = require('path')

function media( db ){
   return {
      save: async function( mediaData, sessionData ){
         const _id = mediaData._id || mediaData.mediaId || ''
         let message = ''
         if( !(sessionData.userId && sessionData.role==='ADMIN') || (_id && mediaData.orgId && mediaData.orgId!==sessionData.orgId) ){
            console.log( `FAILED: sessionData.userId(${sessionData.userId}) sessionData.role(${sessionData.role}) _id(${_id}) `)
            return { status: false, message: 'Unable to change media.' }
         }

         const orgId = db.ObjectId(`${sessionData.orgId}`)
         if( _id ){
            const result = await db.media.updateOne({ _id: db.ObjectId(`${_id}`), orgId }, { $set: mediaData })
            if( !result.ok )
               return { status: false, message: 'Problems updating item' }

            return { status: true, message: message || 'Updated' }
         } else {
            // get _id from _id or org
            mediaData.orgId = orgId
            mediaData.ownerId = db.ObjectId(`${sessionData.userId}`)

            const result = await db.media.create( mediaData )
            if( !result._id )
               return { status: false, message: 'Problems creating item' }

            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            const data = JSON.parse(JSON.stringify(result))
            delete data.__v; delete data.createdAt; delete data.updatedAt;
            return { status: true, data, message }
         }
      },

      load: async function ( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id || where.mediaId )
            where._id = db.ObjectId(`${where._id||where.mediaId}`)

         where.orgId = db.ObjectId(`${sessionData.orgId}`)
         const result = await db.media.find( where, '-__v -createdAt -updatedAt').lean() //.sort({ [key]: 1 })
         if( !result || result.length<1 || !result[0]._id ){
            console.log( '.. !! Unable to find item:', result )
            return { status: false, message: 'No item results' }
         }
         const data = JSON.parse(JSON.stringify(result))
         for( let i=0; i<data.length; i++ ) data[i].mediaId=data[i]._id;
         return { status: true, data }
      },

      remove: async function( where, sessionData, json={} ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id )
            where._id = db.ObjectId(`${where._id}`)

         where.orgId = db.ObjectId(`${sessionData.orgId}`)
         // get the list of items - we will delete outside ORM
         const data = await db.media.find( where )
         // but nuke within the DB
         const result = await db.media.deleteMany( where )
         console.log( ' delete result: ', result )
         if( !result.ok )
            return { status: false, message: 'Failed to delete' }

         console.log( 'media::remove done - data: ', data )
         return { status: true, data, message: `Deleted ${result.deletedCount} media` }
      }
   }
}

module.exports = media