import React, { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

import LargePageInfoBar from "../components/LargePageInfoBar"

function Contact(){
   const [ , dispatch ] = useStoreContext()
   const type = useParams().type || ''

   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})

   async function signupOrg( e ){
      e.preventDefault()

      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         return
      }

      const contactData = {}
      // refresh the user INPUTs
      const contactFields = ['name','email','type','message']
      contactFields.forEach( item=>{ contactData[item] = formEls.current[item].value })
      contactData.title = formEls.current.type.selectedOptions[0].innerText
      console.log( `attempting to signup: '/api/users/signup' with:`, contactData )
      const { status, message }= await fetchJSON( `/api/mail/contactform`, 'post', contactData )
      console.log( ` .. status(${status}) message(${message}) userData: ` )
      if( message ) dispatch({ type: 'ALERT_MESSAGE', message })
      if( !status ) return

      // clear fields
      contactFields.forEach( item=>{ formEls.current[item].value = '' })
      refForm.current.classList.remove('was-validated')
   }

   return (
      <LargePageInfoBar>
      <form ref={refForm} class="form-signin">
         <div class="card mt-5">
            <div class="card-body">
               <div class="mb-3">
                  <label for="name">Your Name</label>
                  <input ref={el=>formEls.current.name=el} type="text" id="name" class="form-control" required />
                  <div class="invalid-feedback">
                           Please enter your name
                  </div>
               </div>
               <div class="mb-3">
                  <label for="name">Email</label>
                  <input ref={el=>formEls.current.email=el} type="text" id="email" class="form-control" required />
                  <div class="invalid-feedback">
                           Please enter your email
                  </div>
               </div>
               <div class="mb-3">
                  <label for="type" class="form-label">Message Type</label>
                  <select ref={el=>formEls.current.type=el} defaultValue={type} id="type" class="form-control bg-warning">
                     <option value="">.. Reason ..</option>
                     <option value="bug">Bug Report</option>
                     <option value="feature">Feature Request</option>
                     <option value="billing">Billing Inquiry</option>
                     <option value="order">Order Inquiry</option>
                     <option value="other">Other Reason</option>
                  </select>
                  <div class="invalid-feedback">
                     Please tell the reason for contacting us
                  </div>
               </div>
               <div class="mb-3">
                  <label for="message" class="form-label">Message</label>
                  <textarea ref={el=>formEls.current.message=el} id="message" class="form-control" rows="2" required></textarea>
                  <div class="invalid-feedback">
                     Please type something, else why contact us? ;=)
                  </div>
               </div>
            </div>
            <div class="card-footer">
               <button onClick={signupOrg} class="btn btn-primary mx-1" >Send</button>
               <Link to="/" class="float-end font-weight-light text-muted">Cancel</Link>
            </div>
            <div class="card-footer">
               <small class="text-muted">
                  We read all messages and attempt to respond when appropriate. Please give us 48 hours to respond. 
               </small>
            </div>
         </div>
      </form>
      </LargePageInfoBar>
   )
}

export default Contact