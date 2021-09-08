const { model, Schema } = require('mongoose')

const orgs = new Schema ({
   name: { type: String, required: true, trim: true },
   info: { type: String, trim: true, default: '' },
   phone: { type: String, trim: true },
   url: { type: String, trim: true },
   email:  { type: String, trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid e-mail address'] },
   _orderEmail:  { type: String, trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid e-mail address'] },
   address: { type: String, trim: true },
   coords: { type: String, trim: true, default: '' }, // 43.47689277912785, -80.53933792205406
   imageBg: { type: String, trim: true },
   imageMenuBanner: { type: String, trim: true },
   timezone: { type: String, default: 'America/Toronto' },
   businessHours: [{ open: String, close: String }],
   businessHolidays: [],
   itemCategories: [],
   deliveryOptions: [],
   _financial: { type: Object },
   expiresAt: Date,
   isAlwaysOpen: { type: Boolean, default: false }, /* 24/7 store */
   isRequireOnline: { type: Boolean, default: true } /* require online payment */
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})


module.exports = model('orgs', orgs)