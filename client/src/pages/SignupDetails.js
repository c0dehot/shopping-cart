import React, { useRef, useEffect, useState } from 'react'

import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

function SignupDetails(){
   const [ { isAdmin }, dispatch ] = useStoreContext()
   const [ orgData, setOrgData ]= useState({}) 
   const [ qrCode, setQRCode ] = useState( "" )
  
   const refForm = useRef()
   const formEls = useRef({})

   async function loadPage(){
      console.log( `[loadPage()] called`)
      const { status, data, message }= await fetchJSON( '/api/orgs' )
      // console.log( `[orgs] status(${status}) message(${message}) SignupDetails loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }
  
      // set the INPUT boxes, do the financial subset too
      Object.keys(data).forEach( item=>{ if( formEls.current[item] ) formEls.current[item].value = data[item] || '' })
      Object.keys(data.financial).forEach( item=>{ if( formEls.current[`f_${item}`] ) formEls.current[`f_${item}`].value = data.financial[item] })

      setOrgData({ ...data })
   }
  
   async function orgUpdate( e ){
      e.preventDefault()
      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         formEls.current.url.value = formEls.current.url.value.toLowerCase()
         refForm.current.classList.add('was-validated')
         console.log( `.. !x failed validation, returning.` )
         return
      }

      const saveData = { ...orgData }
      // console.log( `saveData: `, saveData )
      // refresh with user INPUT fields
      Object.keys(formEls.current).forEach( item=>{ 
         if( item.substr(0,2)==='f_' )
            saveData.financial[item.substr(2)] = formEls.current[item] ? formEls.current[item].value : ''
         else
            saveData[item] = formEls.current[item] ? formEls.current[item].value : ''
      })
      // console.log( `saveData: `, saveData )
      
      const redirectUrl = '/admin/info' // sets this as new user redirectUrl
      const { status, message }= await fetchJSON( `/api/orgs?url=${encodeURI(redirectUrl)}`, 'put', saveData )
      if( !status ) return

      // successfully wrote, redirect page
      dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl, message })
   }

   function generateQRCode( e ){
      e.preventDefault()
      // toggle showing (clear if visible)
      if( qrCode ){ setQRCode( "" ); return }

      const domain = encodeURIComponent(`https://restocart.ca/${formEls.current.url.value.toLowerCase().trim()}`)
      const qrUrl = `https://chart.googleapis.com/chart?chs=500x500&cht=qr&choe=UTF-8&chl=${domain}`
      setQRCode( qrUrl )
   }

   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin ] )

   return (
      <form ref={refForm}>
         <div class="card mt-5">
            <div class="card-header">
               <h1>Last Step!</h1>
               <p>You are now registered, just gathering last details before we take products.</p>
            </div>
            <div class="card-body">
               <div class="mb-3">
                  <h4>Set Unique Shopping Cart Link</h4>
                  This is the link that you will be using for allowing orders on your site, so a unique 
                  significant subdomain is a good idea.
                  <div class="input-group mb-3">
                     <span class="input-group-text pt-3"><h6>https://restocart.ca/</h6></span>
                     <input ref={el=>formEls.current.url=el} id="url" type="text" class="form-control" pattern="[a-zA-Z0-9\-n]{6,}" placeholder="grillhouse" required />
                     <div class="invalid-feedback">
                        A unique sub-domain needed: min 6 alpha-numeric characters
                     </div>  
                  </div>
               </div>
               <div class="mb-3">
                  <button onClick={generateQRCode} class="m-2 btn btn-light"><i class="fas fa-qrcode"></i> Your QR-Code</button>
                  <div className={ qrCode.length>1 ? "mb-3 d-block" : "d-none" }>
                        <a href={qrCode} target="blank"><img src={qrCode} class="w-100" alt="qr code" /></a>
                  </div>
               </div>

               <div class="mb-3">
                  <h4>Order Payments Online <i class="fab fa-cc-stripe text-warning"></i></h4>
                  <div class="form-check text-muted">
                     <input onClick={()=>setOrgData({...orgData,isRequireOnline:!orgData.isRequireOnline})} defaultChecked={orgData.isRequireOnline} id="isRequireOnline" class="form-check-input" type="checkbox" />
                     <label class="form-check-label text-primary" for="isRequireOnline">
                        <b>Setup Stripe For Online Orders</b>
                     </label> 
                  </div>
                  <div class='alert alert-warning'>
                  <i class="fas fa-info-circle text-warning fa-3x float-start mx-2"></i> To receive payments online, you'll need to register on Stripe:<br />
                     <a href="https://dashboard.stripe.com/register" rel="noreferrer" target="_blank">dashboard.stripe.com/register</a><br />
                     <i>(If you do not want online payments: you can skip this by unchecking the above box</i>
                  </div>
               </div>
               { orgData.isRequireOnline &&
               <>
               <div class="mb-3">
                  <label for="stripePubKey" class="form-label">Publishable Key</label>
                  <input ref={el=>formEls.current.f_stripePubKey=el} id="stripePubKey" type="text" class="form-control" pattern="[\w_]{80,}" placeholder="pk_live_52IIQ5TFksB71gtFmTQuyIG2knRZNqhFDwOL10JhcjUxYZ" required />
                  <div class="invalid-feedback">
                     From the Stripe <u>Developers &gt; API keys</u> menu, put the <b>Publishable key</b> in here.
                  </div>
               </div>
               <div class="mb-3">
                  <label for="stripePrivKey" class="form-label">Secret Key</label>
                  <input ref={el=>formEls.current.f_stripePrivKey=el} id="stripePrivKey" type="password" class="form-control" pattern="[\w_]{80,}" placeholder="sk_live_..." required />
                  <div class="invalid-feedback">
                     From your Stripe <u>Developers &gt; API keys</u> menu, put the <b>Secret key</b> in here.
                  </div>
               </div>
               <div class="mb-3">
                  <label for="stripeProductKey" class="form-label">Product Item Key</label>
                  <input ref={el=>formEls.current.f_stripeProductKey=el} id="stripeProductKey" type="text" class="form-control" pattern="[\w_]{14,}" placeholder="ex. prod_J1njkdj6m0m8Yg" required />
                  <div class="invalid-feedback">
                  In the Stripe <u>Products</u> menu create a product (and give it a name 'Order Total', no description)
                  </div>
               </div>
               <div class="mb-3">
                  <label for="stripeTaxKey" class="form-label">Stripe Tax-Rate Key(s)</label>
                  <input ref={el=>formEls.current.f_stripeTaxKey=el} id="stripeTaxKey" type="text" class="form-control" pattern="[\w_]{24,}" placeholder="ex. txr_23e8VNkqrFDwOL10JhcjUxYZ" required />
                  <div class="invalid-feedback">
                  In the Stripe <u>Products</u> menu, click on the <u>Tax rates</u> menu. If you have one location, only the tax-code for that location is needed. If you allow different tax rates 
                  depending on location or where the order will ship to, configure multiple tax rates: it will match the code to the buyers shipping location or credit-card location. 
                  See: <a href='https://stripe.com/docs/payments/checkout/taxes' target='_blank' rel="noreferrer">https://stripe.com/docs/payments/checkout/taxes</a>
                  </div>
               </div>

               </>
               }
            </div>
            <div class="card-footer">
               <button onClick={orgUpdate} class="btn btn-primary mx-1" >Complete Profile</button>
            </div>
         </div>
      </form>
   )
}

export default SignupDetails