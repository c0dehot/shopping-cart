const { model, Schema } = require('mongoose')

const orders = new Schema ({
   orgId: Schema.Types.ObjectId,
   specialId: Schema.Types.ObjectId,
   userId: Schema.Types.ObjectId,
   orderCode: { type: String, trim: true },
   discount: Number,
   shipping: Number,
   subtotal: Number,
   tax: Number,
   taxName: String, /* if we have a name for tax, ex. HST */
   total: Number,
   cart: [],
   orderAt: Date, /* time valid order through */
   contactInfo: {}, /* the user document updated with this, but this specific to THIS order */
   deliverAt: Date, /* for scheduled delivery */
   status: { type: String, trim: true, default: 'AWAIT_PAYMENT' }, /* 'CANCELLED','ABANDONED','AWAIT_PAYMENT','AWAIT_INFO','SCHEDULED','PREPARING','READY','DELIVERING','COMPLETED' */
   statusInfo: { type: String, trim: true, default: '' },
   isActive: { type: Boolean, default: false },/* a shortcut to say if status are one of in progress, show it */
   isPaid: { type: Boolean, default: false },
   _processorData: {}, /* capture all the stripe/etc payment response info */
   notes: [],
   rating: { type: Number, default: 0 } /* user feedback */
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('orders', orders)