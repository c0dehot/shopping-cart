const uuid = require( 'uuid' )
const fs = require('fs')

// track valid sessions in memory for speed & ease of implementation
const sessionFile = fs.existsSync( '.session.dat' ) ? fs.readFileSync( '.session.dat', 'utf8' ) : ''
const userSessions = sessionFile.length>5 ? JSON.parse(sessionFile) : {}
if( Object.keys(userSessions).length>0 )
   console.log( `[sessionManager] reloaded * ${Object.keys(userSessions).length} * sessions; 30s auto-save` )
else
   console.log( '[sessionManager] 30s auto-save' )

// track updates to items/organizations to trigger session field reloads
const updatesFile = fs.existsSync( '.updates.dat' ) ? fs.readFileSync( '.updates.dat', 'utf8' ) : ''
const updatesList = updatesFile.length>5 ? JSON.parse(updatesFile) : {}
if( Object.keys(updatesList).length>0 )
   console.log( `[sessionManager:updatesList] reloaded * ${Object.keys(updatesList).length} * organizations; 30s auto-save` )
else
   console.log( '[sessionManager:updatesList] 30s auto-save' )


// set a periodic save
setInterval( function(){
   fs.writeFileSync( '.session.dat', JSON.stringify(userSessions) )
}, 30000 )

setInterval( function(){
   fs.writeFileSync( '.updates.dat', JSON.stringify(updatesList) )
}, 30000 )



function verifyAndLoad( session ){
   if( !userSessions.hasOwnProperty(session) )
      return false
   let userData = JSON.parse(userSessions[session])
   userData._timestamp = Math.floor(Date.now()/1000)
   // console.log( `[sessionManager::verifyAndLoad] session(${session}):`, userSessions[session] )
   userSessions[session] = JSON.stringify(userData)
   // console.log( ' ~ updated session (${session}) - new sessionData:' )
   return userData
}

function create( data ){
   session = uuid.v4()
   userSessions[session] = JSON.stringify({ ...data, _timestamp: Math.floor(Date.now()/1000) })
   return session
}

function update( session, data ){
   // need the '!=' because casting needed object<>string
   // if( data.userId && userSessions[session].userId && data.userId != userSessions[session].userId ){
   //    console.log(`.. !! sessionManager::update request data.userId(${data.userId}) BUT session.userId(${userSessions[session].userId}): REFUSING! userSessions[${session}]:`, userSessions[session] )
   //    return false
   // }
   let userData = JSON.parse(userSessions[session])
   userData ={ _timestamp: Math.floor(Date.now()/1000), ...userData, ...data, org: { ...userData.org, ...data.org }, order: { ...userData.order, ...data.order } }
   userSessions[session] = JSON.stringify(userData)
   // console.log( ' ~ updated session (${session}) - new sessionData:', JSON.stringify(userData) )
   return userData
}

function updateUser( userId, data ){
   const sessions = Object.keys(userSessions)
   // using double == in case object-types different
   // const session = sessions.filter( s=>userSessions[s].userId==userId )[0]
   const session = sessions.filter( s=>userSessions[s].indexOf(`,"userId":"${userId}",`)>-1 )[0]
   if( !session || !userSessions.hasOwnProperty(session) ){
      console.log( `x [sessionManager::updateUser FAILED!] sessions(${sessions}) looking for ',"userId":"${userId}",' ?`)
      return false
   }

   let userData = JSON.parse(userSessions[session])
   userData ={ _timestamp: Math.floor(Date.now()/1000), ...userData, ...data, org: { ...userData.org, ...data.org }, order: { ...userData.order, ...data.order } }
   userSessions[session] = JSON.stringify(userData)
   return userData
}

function remove( session ){
   // remove the current one
   if( !session || session.length!==36 || !userSessions.hasOwnProperty(session) )
      return false

   delete userSessions[session]
   return true
}

function clearStale( cutoffTimestamp ){
   cutoffTimestamp = cutoffTimestamp || (Math.floor(Date.now()/1000)-86400)
   const stale = Object.keys(userSessions).filter( s=>userSessions[s]._timestamp<cutoffTimestamp )
   console.log( '[clearStale] purging: ', stale.join('; ') )
   stale.forEach( s=>delete userSessions[s] )
}

// organization updates tracking
function loadUpdateTracker( org ){
   if( !org || org.length<21 || !updatesList.hasOwnProperty(org) )
      return false
   return JSON.parse(updatesList[org])
}

function refreshUpdateTracker( org, data ){
   const prevData = JSON.parse(updatesList[org] || '{}')
   updatesList[org] = JSON.stringify({ ...prevData, ...data})
   return updatesList
}

function removeUpdateTracker( org ){
   // remove the current one
   if( !org || org.length<21 || !updatesList.hasOwnProperty(org) )
      return false

   delete updatesList[org]
   return true
}

// clear stale each half day
setInterval( clearStale, 43200*1000 )

module.exports = { verifyAndLoad, create, update, updateUser, remove, clearStale,
   loadUpdateTracker, refreshUpdateTracker, removeUpdateTracker }