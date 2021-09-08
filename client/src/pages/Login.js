import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

import OAuth from "../components/OAuth"
import LargePageInfoBar from "../components/LargePageInfoBar"

function Login(){
   const [ , dispatch ]= useStoreContext()

   const inputEmail = useRef()
   const inputPassword = useRef()
   const inputRememberMe = useRef()
   const refForm = useRef()

   
   function userLoginSave({ status, session, userData, message }){ 
      // login ok, saving session & saving userData
      console.log( `[userLoginSave] status(${status}) session(${session}) data:`, userData )
      if( !status ){
         // clear any session
         localStorage.session = ''
         dispatch({ type: 'ALERT_MESSAGE', message })
         return
      }      
      localStorage.session = session
      dispatch({ type: 'USER_LOGIN', data: userData })
   }

   async function userLogin( e ){
      e.preventDefault()
      console.log( '[userLogin]' )

      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         return
      }

      const saveData = {
         email: inputEmail.current.value,
         password: inputPassword.current.value,
         rememberMe: inputRememberMe.current.checked
      }

      if( saveData.email.indexOf('@')<3 || saveData.password.length<8 ) {
         inputEmail.current.focus()
         dispatch({ type: 'ALERT_MESSAGE', message: 'Please complete your form!' })
         return
      }

      const { status, session, userData, message }= await fetchJSON( '/api/users/login', 'post', saveData )

      // remember email if user wanted
      if( inputRememberMe && inputRememberMe.current.checked ){
         localStorage.email = inputEmail.current.value
      } else {
         localStorage.email = ''
      }

      userLoginSave({ status, session, userData, message })
   }

   // at startup we initialize a few things
   useEffect( function(){
      inputEmail.current.value = localStorage.email || ''
      inputRememberMe.current.checked = true
   }, [] )

   return (
      <LargePageInfoBar>
      <form ref={refForm} class="form-signin">
         <div class="card mt-5">
            <div class="card-header">
               <h1>Login</h1>
            </div>
            <div class="card-body">
               <div class="mb-3">
                  <label for="email" class="form-label">Email address</label>
                  <input ref={inputEmail} id="email" type="email" class="form-control" required />
                  <div class="invalid-feedback">
                           Please enter your login email
                  </div>                     
               </div>
               <div class="mb-3">
                  <label for="userPassword">Password</label>
                  <input ref={inputPassword} id="userPassword" type="password" class="form-control" pattern=".{8,}" required />
                  <div class="invalid-feedback">
                           Please enter your password (8 chars min)
                  </div>                     
               </div>
            </div>
            <div class="card-footer">
               <button onClick={userLogin} type="button" class="btn btn-primary mx-1">Sign In</button>
                  &nbsp;
                  <span class="checkbox mb-3">
                     <label><input ref={inputRememberMe} id='rememberMe' type="checkbox" /> Remember Me</label>
                  </span>
               <Link to="/signup" class="font-weight-light text-muted mx-5">Need to Signup?</Link>
            </div>
            {/* <OAuth providers={['twitter','facebook','github','google','linkedin']} userLoginComplete={userLoginSave} /> */}
         </div>
      </form>     
      </LargePageInfoBar>    
   )
}

export default Login