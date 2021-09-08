const { model, Schema } = require('mongoose')

const users = new Schema ({
   orgId: Schema.Types.ObjectId,
   name:  { type: String, required: true, trim: true },
   thumbnail: { type: String, trim: true, default: '' },
   type: { type: String, default: 'local' }, // used by OAuth
   authId: { type: String, default: '' }, // used by OAuth
   _password:  { type: String, trim: true },
   role: { type: String, default: '' }, // SUPER, ADMIN, ASSIST, CART
   phone: { type: String, trim: true, default: '' },
   email:  { type: String, trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid e-mail address'] },
   redirectUrl: { type: String, trim: true, default: '' },
   cart: [],
   refCode: { type: String, trim: true, default: '' },
   affilCode: { type: String, trim: true, default: '' },
   isVerified: { type: Boolean, default: false },
   _info: {}
}, {
   timestamps: true /* creates corresponding timestamp fields: createdAt, updatedAt */
})

module.exports = model('users', users)