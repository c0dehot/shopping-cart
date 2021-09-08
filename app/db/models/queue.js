const { model, Schema } = require('mongoose')

const queue = new Schema ({
   ownerId: Schema.Types.ObjectId,
   orgId: Schema.Types.ObjectId,
   status: String, // PENDING, RETRY, COMPLETE, CANCELLED
   data: {},
   responseData: String,
   responseValid: Boolean,
   retryAt: Date,
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('queue', queue)
