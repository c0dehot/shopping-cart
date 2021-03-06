import React, { useEffect } from "react"
import { useStoreContext } from "../utils/GlobalStore"
import fetchJSON from "../utils/API"

function Logout(){
    const [, dispatch ]= useStoreContext()

    
    async function userLogout(){
        // call the api to logout (and clear session)
        const { message } = await fetchJSON( '/api/users/logout' )
        // logout
        dispatch({ type: 'USER_LOGOUT', message })
    }
    
    useEffect( function(){
        // attempt to request logout (ONCE on page load)
        userLogout()
    }, [] )

    return (
        <h1>Please wait, logging out...</h1>
    )
}

export default Logout