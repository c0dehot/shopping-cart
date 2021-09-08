import React, { useRef, useEffect, useState } from 'react'
import { NavLink } from "react-router-dom"

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'
import MediaUpload from '../../components/MediaUpload'

function SettingsUser(){
   const [ { isAdmin,  }, dispatch ]= useStoreContext()
   const [ userData, setUserData ]= useState({})
   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})
   
   async function loadPage(){
      const { status, data, message }= await fetchJSON( '/api/users' )
      // console.log( `[orgs] status(${status}) message(${message}) SignupDetails loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }
      
      const userData = data[0]
      setUserData( userData )
      Object.keys(userData).forEach( item=>{ if( formEls.current[item] ) formEls.current[item].value = userData[item] })
   }
  
   async function userUpdate( e ){
      e.preventDefault()
      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         console.log( ` .. page validation failed, see red boxes.` )
         return
      }

      if( userData.mediaPending ){
         dispatch({ type: 'ALERT_MESSAGE', message: 'Please [Upload] picture before saving.' })
         return
      }

      // if password typed, check they retyped it the same
      if( formEls.current.password.value.length > 0 && formEls.current.password.value !== formEls.current.password2.value ){
         formEls.current.password.focus()
         dispatch({ type: 'ALERT_MESSAGE', message: 'Invalid or non-matching passwords, pls chk!' })
         return
      }
      

      // add a placeholder for password so we can get that field if it's set
      const saveData = { ...userData, password: '' }
      // refresh with user INPUT fields
      Object.keys(formEls.current).forEach( item=>{ saveData[item] = formEls.current[item].value })


      console.log( ' .. item saveData: ', saveData )
      const { status, message }= await fetchJSON( `/api/users`, 'put', saveData )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }
         
      // update session data
      dispatch({ type: 'USER_SESSION_ADMIN', data: saveData, message });
      // clear passwords / validation
      formEls.current.password.value = ''
      formEls.current.password2.value = ''
      refForm.current.classList.remove('was-validated')
   }

   function mediaAttach( mediaPending, thumbnail, idx, message='' ){
      console.log(  `mediaAttach] idx(${idx}) image(${thumbnail}):` )
      // only adjust the image if it's a NEW url
      if( thumbnail!=='' ) 
         setUserData({ ...userData, mediaPending, thumbnail })
      else
         setUserData({ ...userData, mediaPending })

      if( message )
         dispatch({ type: 'ALERT_MESSAGE', message })
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
               <div class="row">
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="name">Your Name</label>
                        <input ref={el=>formEls.current.name=el} type="text" id="name" class="form-control" required />
                        <div class="invalid-feedback">
                              Please enter your name
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="name">Security</label>
                        &nbsp; Role: <b>{userData.role}</b>
                     </div>
                     <div class="mb-3">
                        <label for="phone" class="form-label">Your Phone</label>
                        <input ref={el=>formEls.current.phone=el} id="phone" type="tel" class="form-control" placeholder="(999)999-9999" required />
                        <div class="invalid-feedback">
                           Please give your phone number to receive update texts.
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="org_phone" class="form-label">Your <b>Login</b> Email</label>
                        {!userData.isVerified && <div class='text-danger'><i class="fas fa-info-circle"></i> Please check your email for verification link!</div> }
                        <input ref={el=>formEls.current.email=el} id="email" class="form-control" required />
                        <div class="invalid-feedback">
                           Please give your email for notifications.
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="password" class="form-label"><i class="fas fa-unlock-alt"></i> Change <b>Login</b> Password</label>
                        <div class="row">
                           <div class="col">
                              <input ref={el=>formEls.current.password=el} id="password" type="password" class="form-control" pattern=".{8,}" placeholder="Password" />
                              <div class="invalid-feedback">
                                 Please enter a password <b>(8 chars min)</b>, then re-type.
                              </div>
                           </div>
                           <div class="col">
                              <input ref={el=>formEls.current.password2=el} type="password" class="form-control" pattern=".{8,}" placeholder="Re-Type Password" />
                           </div>
                        </div>
                     </div>                        
                  </div>
                  <div class="col-12 col-lg-6">
                     <div class="mb-3 h-100">
                        <label for="info" class="form-label">Profile Picture</label>
                        <MediaUpload mediaDimensions='1024x1024' displayHeight='30vh'
                        sampleUrl="" mediaUrl={userData.thumbnail} mediaIdx={0}
                        mediaAttach={mediaAttach} />
                        <div class="invalid-feedback">
                           Please provide a selfie pic.
                        </div>
                     </div>
                  </div>                  
               </div>
            </div>
            <div class="card-footer">
               <button onClick={userUpdate} class="btn btn-primary mx-1" >Update Profile</button>
            </div>
         </div>
      </form>
   )
}

export default SettingsUser