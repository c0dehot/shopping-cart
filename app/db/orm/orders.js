function orders( db ){
   function checkIfActiveOrder(status){
      return ['ABANDONED','CANCELLED','COMPLETED','AWAIT_PAYMENT','AWAIT_INFO','SCHEDULED'].indexOf(status)===-1
   }

   return {
      save: async function( orderData, sessionData ){
         const _id = orderData.orderId || orderData._id || ''
         let message = ''
         if( !sessionData.userId || (_id && orderData.orgId && orderData.orgId!==sessionData.orgId) ){
            // console.log( sessionData )
            console.log( `Unable to edit order: sessionData.userId(${sessionData.userId}) sessionData.orgId(${sessionData.orgId}) orderData.orgId(${orderData.orgId}) _id(${_id})`)
            return { status: false, message: 'Unable to modify order.' }
         }

         const orgId = db.ObjectId(`${sessionData.orgId}`)
         if( orderData.specialId && orderData.specialId.length>=12 )
            orderData.specialId = db.ObjectId(`${orderData.specialId}`)
         else
            delete orderData.specialId
         // only flag as active if not these
         if( orderData.status ) orderData.isActive = checkIfActiveOrder(orderData.status)

         if( _id ){
            // looks like setting status to preparing
            if( orderData.status && orderData.status==='PREPARING' )
               orderData.orderAt = new Date()
            if( orderData.status && orderData.status==='COMPLETED' )
               orderData.deliverAt = new Date()
            // if we transitioning into PREPARING, then we reset createdAt for time
            const result = await db.orders.findOneAndUpdate({ _id: db.ObjectId(`${_id}`), orgId }, { $set: orderData }).lean()
            if( !result._id )
               return { status: false, message: 'Problems updating order' }

            // return to user the updated data
            const data = { ...JSON.parse(JSON.stringify(result)), ...orderData }
            data.orderId = data._id; delete data.__v; delete data.createdAt; delete data.updatedAt;
            return { status: true, data, message: message || 'Updated' }
         } else {
            // get _id from _id or org
            orderData.orgId = orgId
            orderData.userId = db.ObjectId(`${sessionData.userId}`)

            const result = await db.orders.create( orderData )
            console.log( `.. [orm::orders.save] creating new orderData order _id(${result._id})` )
            if( !result._id )
               return { status: false, message: 'Problems creating order' }

            const _id = result._id
            // generate an order-code from the "node-id" of UUID (last 12 bytes)
            const orderCode = parseInt(`${_id}`.substr(-12),16).toString(36).toUpperCase()
            {
               console.log( ` ... updating orderCode: _id(${_id}) orderCode(${orderCode})`)
               const result = await db.orders.updateOne({ _id }, { $set: { orderCode } })
               if( !result.ok )
                  return { status: false, message: 'Problems updating order with order code' }
               console.log( ` ... ... updated! ${orderCode}` )
            }
            //! make sure it's not a mongoose model object (which creates problems for spread operations)
            //! and mongoose model object does not allow fields not part of it (ex. orderId)
            const data = JSON.parse(JSON.stringify(result))
            delete data.__v; delete data.createdAt; delete data.updatedAt;
            data.orderCode = orderCode; data.orderId = _id
            // console.log( `2. orm:orders::save --> returning orderCode(${orderCode}), data: `, data )
            return { status: true, orderCode, data, message: message || 'Saved' }
         }
      },

      addNote: async function ( orderData, sessionData ){
         const _id = orderData._id || orderData.orderId || ''
         let message = ''
         if( !_id ){
            // console.log( sessionData )
            console.log( `Unable to addNote: _id(${_id})`)
            return { status: false, message: 'Unable to add note to order.' }
         }
         const orgId = db.ObjectId(`${sessionData.orgId}`)
         const note = { userId: sessionData.userId, note: orderData.note, timestamp: Math.floor(Date.now()/1000) }
         const result = await db.orders.findOneAndUpdate({ _id: db.ObjectId(`${_id}`), orgId }, { $push: { notes: note } }).lean()
         if( !result._id )
            return { status: false, message: 'Problems updating order' }

         // convert 'result' object to string object, and append the note (because 'result' was BEFORE note added)
         const data = JSON.parse(JSON.stringify(result))
         data.notes.push( note )
         // console.log( `[orders: findOneAndUpdate] updatedAt(${data.updatedAt}) notes:`,JSON.stringify(data.notes) )
         return { status: true, data, message: message || 'Updated' }
      },

      load: async function ( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         console.log( '[org.orders LOAD] where:', where )
         const isNew = where._id && where._id==='new'

         where.orgId = db.ObjectId(`${sessionData.orgId}`)
         where.isActive = checkIfActiveOrder(where.status)
         if( where.isActive ) delete where.status
         if( where.since ){
            where.updatedAt = { updatedAt: { $gte: where.since } }
            delete where.since
         }

         if( where._id )
            if( isNew ){
               delete where._id // default new entry has org=0
               where.orgId = db.ObjectId('000000000000000000000000')
            } else {
               where._id =db.ObjectId(`${where._id}`)
            }


         const result = await db.orders.find( where, '-__v').lean()
         if( !result || result.length<1 || !result[0]._id ){
            console.log( '.. !! Unable to find orders:', result )
            return { status: true, data: [] }
         }
         if( isNew ){
            delete result[0]._id; delete result[0].orgId; delete result[0].userId
         }
         const data = JSON.parse(JSON.stringify(result))
         for( let i=0; i<data.length; i++ ) data[i].orderId=data[i]._id

         return { status: true, data }
      },

      remove: async function( where, sessionData ){
         if( !sessionData || !sessionData.orgId )
            return { status: false, message: 'Invalid session' }

         if( where._id || where.orderId )
            where._id = db.ObjectId(`${where._id||where.orderId}`)
         where.orgId = db.ObjectId(`${sessionData.orgId}`)

         const result = await db.orders.deleteMany( where )
         console.log( ' delete order: ', result )
         if( !result.ok )
            return { status: false, message: 'Failed to delete' }

         return { status: true, message: result.deletedCount>1 ? `Deleted ${result.deletedCount} orders` : 'Deleted' }
      },

      init: async function( orderData ){
         const result = await db.orders.create( orderData )
         if( !result._id )
            return { status: false, message: 'Problems initializing new order' }

         return { status: true, message: 'Complete' }
      }
   }
}

module.exports = orders