function exifOrientation( arrayBuffer ) {
    return new Promise( function( resolve, reject ){
        const view = new DataView(arrayBuffer)

        if (view.getUint16(0, false) != 0xFFD8) resolve(-2)
        const length = view.byteLength
        let offset = 2
    
        while (offset < length) {
            const marker = view.getUint16(offset, false)
            offset += 2
        
            if (marker == 0xFFE1) {
                if (view.getUint32(offset += 2, false) != 0x45786966) 
                    resolve(-1)
                
                const little = view.getUint16(offset += 6, false) == 0x4949
                offset += view.getUint32(offset + 4, little)
                const tags = view.getUint16(offset, little)
                offset += 2
        
                for (let i = 0; i < tags; i++)
                    if (view.getUint16(offset + (i * 12), little) == 0x0112)
                        resolve(view.getUint16(offset + (i * 12) + 8, little))

            } else if ( (marker & 0xFF00) != 0xFF00){
                break

            } else {
                offset += view.getUint16(offset, false)
            }
        }
        resolve(-1)
    })
}

function loadImagePreview( event ){
    return new Promise( function( resolve,reject ){
        const file = event.target.files[0]
        if( !event.target || !event.target.files[0] )
            return 
            
        let exifResult = [0, false]
        let exif = 0
        const readerX = new FileReader()
        readerX.onload = async function(){
            exif = await exifOrientation( readerX.result )

            switch ( exif ){
                // return (angle rotate, mirror )
                case 2: exifResult = [0, true]; break
                case 3: exifResult = [180, false]; break
                case 4: exifResult = [180, true]; break
                case 5: exifResult = [90, true]; break
                case 6: exifResult = [-90, false]; break
                case 7: exifResult = [-90, true]; break
                case 8: exifResult = [90, false]; break                
                case 1: 
                default: exifResult = [0, false]; break
            }
        }
        readerX.readAsArrayBuffer(file)

        const reader = new FileReader()
        reader.onloadend = function(){ 
            resolve( [ reader.result, ...exifResult, exif ]  )
        }
        reader.readAsDataURL(file)
    })
}

function invPixel(){
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
} 
export default {
    exifOrientation, loadImagePreview, invPixel
}