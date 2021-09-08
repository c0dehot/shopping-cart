const { model, Schema } = require('mongoose')

const media = new Schema ({
   orgId: Schema.Types.ObjectId,
   mediaUrl: { type: String, trim: true },
   mediaDimensions: { type: String, trim: true },
   mediaSize: Number,
   mediaMeta: {},
   attachId: Schema.Types.ObjectId,
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('media', media)
