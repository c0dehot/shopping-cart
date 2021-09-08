import React, { useRef, useEffect, useState } from 'react'
import { NavLink } from "react-router-dom"
import { DateTime } from 'luxon'

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'

function SignupFinancial(){
   const [ { isAdmin, refCode, affilCode }, dispatch ]= useStoreContext()
   const [ affiliateList, setAffiliateList ]= useState([])
   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})

   async function loadPage(){
      const { status, data, message }= await fetchJSON( '/api/users/affiliates' )
      console.log( `[orgs] status(${status}) message(${message}) Affiliates loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }

      console.log( `affiliate data: `, data )
      setAffiliateList( data )
      // refresh INPUTS
      // Object.keys(formEls.current).forEach( item=>{ formEls.current[item].value = data.financial[item] || '' })
   }
  
   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin ] )

   return (
      <form ref={refForm} id="mainForm" encType="multipart/form-data" method="post">
         <div class="card">
            <div class="card-header">
               <h4>Account Settings</h4>
            </div>
            <div class="card-body">
               <div class="card-subtitle pb-4">
                  <ul class="nav nav-pills card-header-tabs">
                     <li class="nav-item">
                        <NavLink to="/admin/settings/user" className="nav-link" activeClassName="active">Profile</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/org" className="nav-link" activeClassName="active">Organization</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/affiliate" className="nav-link" activeClassName="active">Affiliate Invites</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/financial" className="nav-link" activeClassName="active">Financial</NavLink>
                     </li>
                  </ul>
               </div>
               { refCode && <div class="mb-3">
                  <label>Your Referrer</label>
                  You were invited to our system by the affiliate code <b>{refCode}</b>
               </div> }
               <div class="mb-3">
                  <label>Your Affiliate Code</label>
                  <div class="input-group mb-3">
                     <h1>{affilCode}</h1>
                     <div class='alert alert-warning'>
                        You can share this code with people signing up by giving this link to them, and they will then become part of your 
                        affiliate network:
                        <div>
                           <a href={`/signup/${affilCode}`} target='_blank' rel="noreferrer">https://restocart.ca/signup/{affilCode}</a>
                        </div>
                     </div>
                  </div>
               </div>  
               <div class="mb-3">
                  <label class="form-label">Your Affiliate Signups</label>
               </div>
               <div class="mb-3">
               <ol class="list-group list-group-numbered">
                  { affiliateList && affiliateList.map( row=>
                  <li class="list-group-item d-flex justify-content-between align-items-start">
                     <div class="ms-2 me-auto">
                        <div class="fw-bold">
                        <a href={`https://restocart.ca/${row.url}/`} target="_blank" rel="noreferrer">{row.name}</a></div>
                        <small>Registered {DateTime.fromISO(row.createdAt).toRelative()}</small>
                     </div>
                     <span class="badge bg-warning text-dark rounded-pill">$ 0</span>
                  </li> )}
               </ol>
               </div>
            </div>
            {/* <div class="card-footer">
               <button onClick={financialUpdate} class="btn btn-primary mx-1" >Update Financial</button>
            </div> */}
         </div>
      </form>
   )
}

export default SignupFinancial