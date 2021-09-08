function security( sessionManager={} ){
   const uuid = require( 'uuid' )
   const base58 = require( 'base-58' )

   const roles = [
      { key: 'SUPER', level: 255, label: 'Super ' },
      { key: 'REGIONAL', level: 110, label: 'Regional ' },
      { key: 'ADMIN', level: 99, label: 'Admin '},
      { key: 'ASSIST', level: 50, label: 'Assistant ' },
      { key: 'CART', level: 1, label: 'Cart User' }
   ]

   return {
      hex2alpha: function( hex ){
         // only read the last 12 which are teh 'node-id', should be unique enough (CONFIRM)
         return parseInt(hex.substr(-12),16).toString(36).toUpperCase()
      },
      alpha2hex: function( base36 ){
         return parseInt(base36, 36).toString(16).toLowerCase()
      },
      /* the 'id's we use are base 58 as they are more readable than UUIDs and we use
         them for teh end-user

         let id = uuid.v4()
         const b58 = security.uniqueId(id)
         const hex = security.idToHex(b58)
         console.log( `${id} -> ${b58} - > ${hex}\n` )
      */
      idToHex: function( base58Id ) {
         if( !base58Id || base58Id.length<1 )
            return false

         const byteArray = base58.decode( base58Id )
         return Array.prototype.map.call(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
         }).join('');
      },

      // returns a UUID but compressed to a base58 number for easier consumption
      uniqueId: function( hexId='' ){
         if( hexId==='' )
            hexId = uuid.v4()

         hexId = hexId.replace(/-/g,'')

         let intArray = []
         for (let i = 0; i < hexId.length; i += 2)
            intArray.push(parseInt(hexId.substr(i, 2), 16));

         return base58.encode( new Uint8Array( intArray ) ).padStart(22,'0')
      },

      codeGenerate: function( type ){
         // use base58 charset, no lowercase for affils
         const charSet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'+(type!=='AFFILT' ? 'abcdefghijkmnopqrstuvwxyz' : '' )
         let length = 0, code = '', chk = 5
         switch( type ){
         case 'AFFILT':
            length=7; break
         case 'MEMBER':
            length=8; break
         case 'COUPON':
            length=11; break
         default:
            length=20; break
         }
         for( let i=0; i<length; i++ ){
            const charIdx = (Math.floor(Math.random()*charSet.length) + (i===0?1:0))%charSet.length
            chk ^= charIdx
            code += charSet[charIdx]
         }
         // append checksum
         code += charSet[chk%charSet.length]
         return code
      },
      codeCheck: function( code ){
         // determine type
         let type = ''
         if( code.length===8 )
            type = 'AFFILT' // when sending out a referral link
         else if( code.length===9 )
            type = 'MEMBER' // when inviting people to join an organization
         else if( code.length===11 )
            type = 'COUPON'


         const charSet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'+(type!=='AFFILT' ? 'abcdefghijkmnopqrstuvwxyz' : '' )

         // validate checksum (last char)
         let chk = code.substr(0,code.length-1).split('').reduce( (acc,char)=>acc^charSet.indexOf(char), 5 )
         if( code.substr(-1) === charSet[chk%charSet.length] )
            return type

         return false
      },

      getRoleList: function(){
         return roles
      },

      getRoleLevel: function( role ){
         const roleMatch = roles.filter( row=>row.key===role )
         if( !(roleMatch && roleMatch.length===1) ) console.log( `[getRoleLevel] Unknown role (${role}), auto-assigning level 100` )
         return roleMatch && roleMatch.length===1 ? roles.filter( row=>row.key===role )[0].level : 100
      },

      stripPrivateKeys: function( obj ){
         function removeProps(obj){
            if(obj instanceof Array)
               obj.forEach( item=>{
                  removeProps(item)
               })
            else if(typeof obj === 'object' && obj !== null )
               Object.keys(obj).forEach( key=>{
                  if(key[0]==='_') delete obj[key]
                  else removeProps(obj[key])
               })

         }
         removeProps(obj)
         return obj
      },

      // session checking middleware
      authRequired: function (minRole){
         // do this to keep scope of object
         return async ( req, res, next )=>{
            // check session set, and it's valid
            const sessionData = sessionManager.verifyAndLoad( req.headers.session )
            if( !sessionData ){
               console.log( `[${req.method} ${req.url}] .. [authRequired] invalid session, refusing (403)` )
               res.status(403).send({ status: false, message: 'Requires valid session. Please login again.' })
               return
            }
            console.log( `[${req.method} ${req.url}] .. [authRequired] ${sessionData.role} > ${minRole}` )
            if( this.getRoleLevel(sessionData.role) < this.getRoleLevel(minRole) ){
               console.log( ' x permissions REJECTED' )
               res.status(403).send({ status: false, message: 'Requires different permissions, try logging in with another account.' })
               return
            }
            // session was good, pass info on, let's continue endpoint processing...
            req.sessionData = sessionData
            next()
         }
      },

      emailCode: function( email ){
         let code = 0
         for( let idx=0; idx<email.length; idx++ )
            code += email.charCodeAt(idx)*idx
         return (code%65535).toString()
      }
   }
}
module.exports = security