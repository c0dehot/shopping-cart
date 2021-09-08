import React, { useRef, useEffect, useState } from 'react'
import { NavLink } from "react-router-dom"

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'
import { timezoneList, scheduleToday } from "../../utils/Locale"

import ItemCategories from '../../components/ItemCategories.js'

function SettingsCategories(){
   const [ { isAdmin }, dispatch ]= useStoreContext()
   const [ orgData, setOrgData ]= useState({})

   async function loadPage(){
      const { status, data, message }= await fetchJSON( '/api/orgs' )
      console.log( `[orgs] status(${status}) message(${message}) loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }

      setOrgData( data )
   }
  
   function updateCategories( itemCategories ){
      if( itemCategories ) setOrgData({ ...orgData, itemCategories })
   }

   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin ] )

   return (
      <form id="mainForm" encType="multipart/form-data" method="post">
         <div class="card">
            <ItemCategories itemCategories={orgData.itemCategories} updateCategories={updateCategories} />
         </div>
      </form>         
   )
}

export default SettingsCategories