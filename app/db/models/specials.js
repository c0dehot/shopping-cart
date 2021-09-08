const { model, Schema } = require('mongoose')

const specials = new Schema ({
   orgId: Schema.Types.ObjectId,
   code: { type: String, trim: true },
   name: { type: String, trim: true },
   info: { type: String, trim: true },
   imageMenuHeader: { type: String, trim: true },
   discount: Number,
   products: [],
   availability: [{ type: String, value: Number }],
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('specials', specials)