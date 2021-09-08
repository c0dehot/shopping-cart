function items( db ){
   return {
      save: async function( itemData, sessionData ){
         const _id = itemData.itemId || itemData._id || ''
         let message = ''
         if( !(sessionData.userId && sessionData.role==='ADMIN') || (_id && itemData.orgId && itemData.orgId!==sessionData.orgId) ){
            // console.log( sessionData )
            console.log( `Unable to edit item: sessionData.userId(${sessionData.userId}) sessionData.role(${sessionData.role}) sessionData.orgId(${sessionData.orgId}) itemData.orgId(${itemData.orgId}) _id(${_id})`)
            return { status: false, message: 'Unable to edit item.' }
         }

         const orgId = db.ObjectId(`${sessionData.orgId}`)
         if( _id ){
            const result = await db.items.updateOne({ _id: db.ObjectId(`${_id}`), orgId }, { $set: itemData })
            if( !result.ok )
               return { status: false, message: 'Problems updating item' }

            return { status: true, message: message || 'Updated' }
         } else {
            // get _id from _id or org
            itemData.orgId = orgId
            itemData.ownerId = db.ObjectId(`${sessionData.userId}`)
            const result = await db.items.create( itemData )
            console.log( 'creaing new item: itemData:', itemData, result )
            if( !result._id )
               return { status: false, message: 'Problems creating item' }

            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            const data = JSON.parse(JSON.stringify(result))
            delete data.__v; delete data.createdAt; delete data.updatedAt;
            return { status: true, data, message: message || 'Saved' }
         }
      },

      load: async function ( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         const isNew = where._id && where._id==='new'

         where.orgId = db.ObjectId(`${sessionData.orgId}`)

         if( where._id )
            if( isNew ){
               delete where._id // default new entry has org=0
               where.orgId = db.ObjectId('000000000000000000000000')
            } else {
               where._id =db.ObjectId(`${where._id}`)
            }


         const result = await db.items.find( where, '-__v -createdAt').sort({category: 1, title: 1}).lean() //.sort({ [key]: 1 })
         if( !result || result.length<1 || !result[0]._id ){
            console.log( '.. !! Unable to find item:', result )
            return { status: true, message: 'No item results' }
         }
         if( isNew ){
            delete result[0]._id; delete result[0].orgId; delete result[0].ownerId
         }
         const data = JSON.parse(JSON.stringify(result))
         // now let's mark each new category and clone entries for special
         let specials = data.filter( item=>item.isSpecial)
         if( specials.length>0 ) specials[0].catHeading = true
         console.log( ' specials from it are: ', specials )

         let prevCategory = '', lastUpdatedAt = ''
         for( let i=0; i<data.length; i++ ){
            if( data[i].category!==prevCategory ){
               data[i].catHeading = true
               prevCategory = data[i].category
            }
            data[i].itemId=data[i]._id
            if( lastUpdatedAt<data[i].updatedAt ) lastUpdatedAt = data[i].updatedAt
         }
         return { status: true, data, specials, lastUpdatedAt }
      },

      remove: async function( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id || where.itemId )
            where._id = db.ObjectId(`${where._id||where.itemId}`)
         where.orgId = db.ObjectId(`${sessionData.orgId}`)

         const result = await db.items.deleteMany( where )
         console.log( ' delete item: ', result )
         if( !result.ok )
            return { status: false, message: 'Failed to delete' }


         return { status: true, message: result.deletedCount>1 ? `Deleted ${result.deletedCount} items` : 'Deleted' }
      },

      init: async function( itemData ){
         console.log( '[init] starting' )
         const result = await db.items.create( itemData )
         console.log( '.. db.items.create complete. result: ', result )

         if( !result._id )
            return { status: false, message: 'Problems initializing new item' }

         return { status: true, message: 'Complete' }
      }
   }
}

module.exports = items