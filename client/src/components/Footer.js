import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

function Footer(){
    const [ , dispatch ] = useStoreContext()
    const [ subscribed, setSubscribed ] = useState(false)
    const { pathname } = useLocation()

    const refForm = useRef()
    const formEls = useRef({})

    async function subscribe( e ){
      e.preventDefault()

      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         return
      }

      const contactData = {}
      // refresh the user INPUTs
      const contactFields = ['name','email']
      contactFields.forEach( item=>{ contactData[item] = formEls.current[item].value })
      console.log( `attempting to signup: '/api/mail/subscribe' with:`, contactData )
      const { status, message }= await fetchJSON( `/api/mail/subscribe`, 'post', contactData )
      console.log( ` .. status(${status}) message(${message}) userData: ` )
      if( message ) dispatch({ type: 'ALERT_MESSAGE', message })
      if( !status ) return

      // clear fields
      contactFields.forEach( item=>{ formEls.current[item].value = '' })
      refForm.current.classList.remove('was-validated')

      setSubscribed( true )

    }

    return (
        <>  {/* only show verbose footer for non-users */}
            { ['/','/terms','/privacy','/contact','/about','/login','/signup'].indexOf(pathname)>-1 ?
            <footer class="footer mt-50 mt-5">
            <div class="container">
                  <div class="row">
                     <div class="col-md-4">
                        <div class="footer-widget mt-4">
                           <h4>We Can Help.</h4>
                           <p class="mt-2 footer-desc">We know you need help. So we are offering our tools for free.</p>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <div class="footer-widget mt-4">
                              <h4>Our Skills</h4>
                              <ul class="footer-links">
                                 <li>Digital Menus</li>
                                 <li>Promotions</li>
                                 <li>Online Orders</li>
                                 <li>QR-Code Orders</li> 
                              </ul>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <div class="footer-widget mt-4">
                              <h4>Contact</h4>
                              <ul class="no-bullet">
                                 <li><i class="fas fa-phone"></i> <a href="tel://16479578585">(647)957-8585</a></li>
                                 <li><i class="fas fa-envelope"></i> <a href="mailto://info@restocart.ca">info@restocart.ca</a></li>
                                 <li><i class="fas fa-street-view"></i> Located in: <b>Toronto, Canada</b></li>
                              </ul>
                        </div>
                     </div>
                    </div>
                    <hr />
                    { subscribed ? 
                     <small class='text-success'>Subscribed, chat soon!</small>
                     :
                    <form ref={refForm} class="form-subscribe mx-5">
                    <label for="name">Subscribe to Our Newsletter</label>
                     <div class="text-center input-group mb-3">
                        <input ref={el=>formEls.current.name=el} type="text" class="form-control" placeholder="Your Name" required />
                        <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                        <input ref={el=>formEls.current.email=el} type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$" class="form-control" placeholder="Your Email" required />
                        <button onClick={subscribe} class="btn btn-outline-secondary" type="button">Subscribe</button>
                        <div class="invalid-feedback">
                                 Please enter your name and email
                        </div>
                     </div>
                     </form> }
                     <hr />
                    <div class="text-center pb-1">
                        <div><i>c) 2021 Restocart Inc</i></div>
                        <small class="text-muted no-underline">
                           <Link to="/contact/feature">Tell-Us Bug/Feature</Link> | <Link to="/terms">Terms and Conditions</Link> |  <Link to="/privacy">Privacy Policy</Link></small>
                     </div>
                </div>
            </footer>
            :
            <div class="clearfix text-center pt-5 pt-5 no-underline">
               <small><i>Powered by <a href="https://restocart.ca" target="_blank" rel="noreferrer">Restocart.ca</a>
               &nbsp; | <Link to="/contact/feature">Tell-Us Bug/Feature</Link></i>
               </small>
            </div> }
        </>
    )
}

export default Footer