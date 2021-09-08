// Written by Filipe Laborde
// GPL - use as you choose

function imageTool( publicRelativePath, UPLOAD_PATH, defaultWidth=0, defaultHeight=0 ){
   const fs = require('fs')
   const sharp = require('sharp')
   const path = require('path')

   return {
      resize: async function( uploadData, destName, resizeWidth=defaultWidth, resizeHeight=defaultHeight ){
         const uploadPath = path.join( __dirname, publicRelativePath + uploadData.path )
         // const originalName = uploadData.originalname;
         // const fileExt = originalName.toLowerCase().substr((originalName.lastIndexOf('.'))).replace('jpeg','jpg');
         const fileExt = '.jpg'
         resizeWidth = Math.round(resizeWidth); resizeHeight = Math.round(resizeHeight)
         const destPath = path.join( path.dirname(uploadPath), destName+fileExt )
         if( resizeWidth>0 && resizeHeight>0 ){
            // resize if given parameters
            await sharp(uploadPath)
               .resize(resizeWidth, resizeHeight, {
                  fit: sharp.fit.inside,
                  withoutEnlargement: true
               })
               .toFile( destPath )
            console.log( ` > resized ${resizeWidth}x${resizeHeight} for ${destPath}` )
            // remove the original file
            fs.unlinkSync(uploadPath)
         } else
            fs.renameSync(uploadPath, destPath )


         // get the path FROM the 'uploadPath':
         const fileSize = fs.statSync(destPath).size
         return [ fileSize, '/'+destPath.substr( destPath.indexOf( UPLOAD_PATH ) ) ]
      },
      remove: function( FILE_PATH, fileList ){
         delCnt = 0
         fileList.forEach( row=>{
            const mediaPath = path.join( FILE_PATH, row.mediaUrl )
            console.log( ` .. deleting media: ${mediaPath} ` )
            if( fs.existsSync( mediaPath ) ){
               fs.unlinkSync( mediaPath )
               delCnt++
            }
         })
         return delCnt
      }
   }
}

module.exports = imageTool