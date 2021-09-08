function queue( db ){
   return {
      save: async function( payloadData, sessionData ){
         // console.log( '[queue::save] payloadData:', payloadData )
         if( payloadData._id ){
            let where = { _id: db.ObjectId(`${payloadData._id}`) }
            delete payloadData._id
            if( !sessionData.role || !sessionData.role==='ADMIN' )
               where.orgId = db.ObjectId(`${sessionData.orgId}`)

            const result = await db.queue.updateOne( where, { $set: payloadData })
            if( !result.ok )
               return { status: false, message: 'Problems updating queue' }

            return { status: true, message: 'Updated' }

         } else {
            const queueData = {
               ownerId: db.ObjectId(`${sessionData.userId||'000000000000000000000000'}`),
               orgId: db.ObjectId(`${sessionData.orgId||'000000000000000000000000'}`),
               status: 'PENDING',
               data: payloadData
            }
            // console.log( '[queue::save] ....')
            const result = await db.queue.create( queueData )
            // console.log( ' db.queue.create..', result )
            if( !result._id )
               return { status: false, message: 'Problems creating queue entry' }

            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            const data = JSON.parse(JSON.stringify(result))
            delete data.__v; delete data.updatedAt;
            return { status: true, data }
         }
      },

      load: async function ( where, sessionData ){
         // if( !sessionData || !sessionData.orgId )
         //    return { status: false, message: 'Invalid session' }
         if( !sessionData.role || !sessionData.role==='ADMIN' )
            where.orgId = db.ObjectId(`${sessionData.orgId}`)
         if( !where._id && !where.status )
            where.$or = [
               {status: 'PENDING'},
               // only try entries with
               { $and: [{ status: 'RETRY' }, {retryAt: { $gte: Date.now() }} ] }
            ]

         const limit = where.limit || 1
         delete where.limit
         // console.log( ' [load] where: ', where )
         const result = await db.queue.find(where, '-__v').sort( { createdAt: 1 } ).limit( limit ).lean()

         if( !result || result.length<1 || !result[0]._id )
            // console.log( '.. !! Unable to find item:', result )
            return { status: false, message: 'No item results' }

         const data = JSON.parse(JSON.stringify(result))
         return { status: true, data }
      },

      remove: async function( where, sessionData, json={} ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id )
            where._id = db.ObjectId(`${where._id}`)

         where.orgId = db.ObjectId(`${sessionData.orgId}`)
         // get the list of items - we will delete outside ORM
         const data = await db.queue.find( where )
         // but nuke within the DB
         const result = await db.queue.deleteMany( where )
         console.log( ' delete result: ', result )
         if( !result.ok )
            return { status: false, message: 'Failed to delete' }

         console.log( 'queue::remove done - data: ', data )
         return { status: true, data, message: `Deleted ${result.deletedCount} media` }
      }
   }
}

module.exports = queue