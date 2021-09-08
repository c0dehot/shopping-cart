import React, { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

const unsubOptions = [
   { value: 'No_Longer_Interested', text: "I no longer want to receive these emails" },
   { value: 'Not_Relevant', text: "The emails are not relevant to me" },
   { value: 'Too_Many', text: "The emails are too frequent" },
   { value: 'Never_Signed_Up', text: "I never signed up for this mailing list" },
   { value: 'Spam', text: "The emails are spam and should be reported" }
]

function Unsubscribe(){
   const [ , dispatch ] = useStoreContext()
   const [ choice, setChoice ]= useState()
   const [ feedbackSent, setFeedbackSent ]= useState(false)
   const [ invalidLink, setInvalidLink ]= useState(false)
   const email = useParams().email || ''
   const code = useParams().code || ''

   const refForm = useRef()

   async function requestUnsubscribe( e ){
      if( e ) e.preventDefault()

      const feedbackData = { email, code, reason: choice || '' }
      console.log( 'choice', choice )
      // only if it's called with the event object (ie when user selected, do we hide the form\
      if( e ) setFeedbackSent( true )

      console.log( `attempting to signup: '/api/mail/unsubscribe' with:`, feedbackData )
      const { status, message }= await fetchJSON( `/api/mail/unsubscribe`, 'post', feedbackData )
      console.log( ` .. status(${status}) message(${message})` )
      
      if( !status ){
         setInvalidLink(true)
         dispatch({ type: 'ALERT_MESSAGE', message })
      }
   }

   useEffect( ()=>{
      requestUnsubscribe() 
   }, [] )

   return (
      <form ref={refForm} class="form-signin">
         <div class="card mt-5">
            { invalidLink ? 
               <div class="card-body">
                  <h1 class="text-warning">Invalid Link!</h1>
               </div>
            :
              (feedbackSent ? 
               <div class="card-body">
                  <h1 class="text-success">Feedback Sent, thank you!</h1>
               </div>
            :
            <>
            <div class="card-body">
               <h1>You have successfully unsubscribed!</h1>
               <hr />
               <h5>If you have a moment, please let us know why you unsubscribed:</h5>

               <ul class="list-group pb-4">
                  { unsubOptions.map( (option,idx)=>
                     <li key={option.value} class="list-group-item d-flex justify-content-between align-items-center product">
                        <div class="form-check">
                           <input onClick={()=>setChoice(option.value)} defaultChecked={idx===0} class="form-check-input" name='unsubFeedback' type="radio" id={`unsubFeedback${idx}`} />
                           <label class="form-check-label" for={`unsubFeedback${idx}`}>
                           {option.text}
                           </label>
                        </div>
                     </li>
                  )}
               </ul>
            </div>
            <div class="card-footer">
               <button onClick={requestUnsubscribe} class="btn btn-primary mx-1" >Submit</button>
            </div>
            <div class="card-footer">
               <small class="text-muted">
                  Please give us up to 48 hours to process your request. 
               </small>
            </div>
            </>
              )}
         </div>
      </form>
   )
}

export default Unsubscribe