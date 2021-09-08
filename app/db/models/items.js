const { model, Schema } = require('mongoose')

const items = new Schema({
   ownerId: Schema.Types.ObjectId,
   orgId: Schema.Types.ObjectId,
   title: { type: String, trim: true, default: '' },
   info: { type: String, trim: true, default: '' },
   image: { type: String, trim: true, default: '' },
   price: { type: Number, default: '' },
   category: { type: String, trim: true, default: '' },
   headingOptions: { type: String, trim: true, default: '' },
   listOptions: [],
   listAddOns: [],
   availability: [],
   listDelivery: [],
   isSpecial: { enabled: Boolean, untilDate: Date },
   isSeasonal: { enabled: Boolean, startDate: Date, endDate: Date },
   isTimeOfDay: { enabled: Boolean, startTime: Number, endTime: Number },
   isLimited: { enabled: Boolean, quantity: Number },
   isOutOfStock: { enabled: Boolean, untilDate: Date }
   // rating: Number,
   // reviews: [] // { "name": "Fil", "rating": 4, "review": "Was awesome" },
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('items', items)