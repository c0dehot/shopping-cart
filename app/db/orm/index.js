const path = require('path')
const fs = require('fs')
const files = fs.readdirSync(__dirname)

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI,
   {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})

// include mongoose models (it will include each file in the models directory)
const db = require( '../models' )

const orm = {}
files.forEach( function( filename ){
   const filebase = filename.split('.')[0]
   if( filename !== 'index.js' ) {
      console.log(`   > loading orm: ${filename}`)
      orm[filebase] = require(path.join(__dirname, filename))(db)
   }
})

module.exports = orm