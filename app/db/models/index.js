// load models from model directory
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const files = fs.readdirSync(__dirname)
// we need the 'ObjectId' to cast _id's to this silly type
const db = { ObjectId: mongoose.Types.ObjectId }
files.forEach( function( filename ){
   const filebase = filename.split('.')[0]
   if( filename !== 'index.js' ) {
      console.log(`   > loading mongoose model: ${filename}`)
      db[filebase] = require(path.join(__dirname, filename))
   }
})

module.exports = db