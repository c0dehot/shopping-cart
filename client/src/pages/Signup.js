import React, { useRef, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

import LargePageInfoBar from "../components/LargePageInfoBar"

function Signup(){
   const [ , dispatch ] = useStoreContext()
   const [ sessionExists, setSessionExists ]= useState(localStorage.session && true)
   const refCode = useParams().refCode || ''
   
   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})


   function clearSession( e ){
      if( e ) e.preventDefault()
      localStorage.session = ''
      localStorage.email = ''
      formEls.current.email.value = ''
      setSessionExists( false )
      console.log( `~ cleared session!`)
   }

   async function signupOrg( e ){
      e.preventDefault()

      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         return
      }

      const regData = {}
      // refresh the user INPUTs
      const regFields = ['name','address','phone','email','password','password2','refCode']
      regFields.forEach( item=>{ regData[item] = formEls.current[item].value })
      
      // double-check the browser form validation
      if( regData.password.length < 3 || regData.password !== regData.password2 ){
         formEls.current.password.current.focus()
         dispatch({ type: 'ALERT_MESSAGE', message: 'Invalid or non-matching passwords' })
         return
      }

      if( !formEls.current.terms.checked && formEls.current.beta.checked ){
         formEls.current.terms.current.focus()
         dispatch({ type: 'ALERT_MESSAGE', message: 'Please confirm the checkboxes: terms and our beta-mode disclaimer' })
         return
      }

      console.log( `attempting to signup: '/api/users/signup' with:`, regData )
      const { status, session, userData, message }= await fetchJSON( `/api/users/signup`, 'post', regData )
      console.log( ` .. status(${status}) session(${session}) message(${message}) userData: `, userData )
      if( !status ){
         // clear any session
         clearSession()
         console.log( `ALERT_)MESSAGE: message(${message})`)
         dispatch({ type: 'ALERT_MESSAGE', message })
         return
      }

      // notify user message; set user session/data -- NavBar redirects to 'redirectUrl' location
      localStorage.session = session
      dispatch({ type: 'USER_LOGIN', data: userData, message })
   }

   useEffect( function(){
      // if remembered email, insert
      formEls.current.email.value = localStorage.email || ''
      // if refCode in the URL, insert - store it in localStorage, and use the first stored one for signup
      if( !localStorage.refCode && refCode ) localStorage.refCode = refCode
      formEls.current.refCode.value = localStorage.refCode || refCode
      // // DEBUGGING
      // formEls.current.password.value = ''
      // formEls.current.password2.value = ''
   }, [] )

   return (
      <LargePageInfoBar>
      <form ref={refForm} class="form-signin">
         <div class="card mt-5">
            <div class="card-header">
               { sessionExists && <div class="alert alert-danger mb-3">
                  <b>WARNING</b>: You already have an active session, please log out first:
                  <hr />
                  <button onClick={clearSession} class="btn btn-warning btn-sm">Logout</button>

                  <Link to="/admin/orders/LIVE" className="btn btn-success btn-sm float-end">Go to Dashboard</Link>
               </div>
               }
               <h1>Welcome!</h1>
               <p>We are excited to invite you into our restaurant serving family.</p>
            </div>
            <div class="card-body">
               <div class="mb-3">
                  <label for="name">Restaurant Name</label>
                  <input ref={el=>formEls.current.name=el} type="text" id="name" class="form-control" required />
                  <div class="invalid-feedback">
                           Please enter your restaurant name
                  </div>
               </div>
               <div class="mb-3">
                  <label for="address" class="form-label">Restaurant Address</label>
                  <textarea ref={el=>formEls.current.address=el} id="address" class="form-control" rows="2" placeholder="22 Some Address, City, Region" required></textarea>
                  <div class="invalid-feedback">
                     Please give the address (it will appear at the top of the menu)
                  </div>
               </div>
               <div class="mb-3">
                  <label for="phone" class="form-label">Restaurant Phone Number</label>
                  <input ref={el=>formEls.current.phone=el} id="phone" type="tel" class="form-control" placeholder="(999)999-9999" required />
                  <div class="invalid-feedback">
                     Please give the phone number customers would call.
                  </div>
               </div>
               <div class="mb-3">
                  <label for="email">Orders Email Address</label>
                  <input ref={el=>formEls.current.email=el} id="email" type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$" class="form-control" required />
                  <div class="invalid-feedback">
                     Please the company/order email address - orders will be sent here!
                  </div>
               </div>
               <div class="mb-3">
                  <label for="refCode">Referral/Invite Code</label>
                  <input ref={el=>formEls.current.refCode=el} id="refCode" type="text" pattern="[a-zA-Z0-9]{8,9}" class="form-control" />
                  <div class="invalid-feedback">
                     Sorry invalid referral code (8-9 characters long), please try another or delete it.
                  </div>
               </div>
               <div class="mb-3">
                  <label for="password" class="form-label"><i class="fas fa-unlock-alt"></i> Admin Login Password</label>
                  <div class="row">
                     <div class="col">
                        <input ref={el=>formEls.current.password=el} id="password" name="password" type="password" class="form-control" pattern=".{8,}" required placeholder="Password" />
                        <div class="invalid-feedback">
                           Please enter a password <b>(8 chars min)</b>, then re-type.
                        </div>
                     </div>
                     <div class="col">
                        <input ref={el=>formEls.current.password2=el} type="password" class="form-control" pattern=".{8,}" required placeholder="Re-Type Password" />
                     </div>
                  </div>
               </div>
            </div>
            <div class="card-footer">
               <span class="checkbox mb-3">
                  <label><input ref={el=>formEls.current.terms=el} id='terms' type="checkbox" required /> 
                     &nbsp; <small class="text-muted">By clicking create account, you are acknowledging that you agree to our <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</small>
                     <div class="invalid-feedback mb-2">
                        <b>Please confirm you agree to our terms of service and privacy policy</b>
                     </div>
                  </label>
                  <label><input ref={el=>formEls.current.beta=el} id='beta' type="checkbox" required /> 
                     &nbsp; <small class="text-muted">You understand our service is still in beta-mode and there may be glitches (that we will strive to fix promptly however).</small>
                     <div class="invalid-feedback mb-2">
                        <b>Please agree to our beta user notice</b>
                     </div>
                  </label>

               </span>

               <button onClick={signupOrg} class="btn btn-primary mx-1" >Signup</button>
               <Link to="/login" class="font-weight-light text-muted mx-3">Already Registered?</Link>
            </div>
            <div class="card-footer">
               
            </div>
         </div>
      </form>
      </LargePageInfoBar>
   )
}

export default Signup