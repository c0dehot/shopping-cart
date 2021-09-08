import React, { useRef, useEffect, useState } from 'react'
import { NavLink } from "react-router-dom"

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'

function SignupFinancial(){
   const [ { isAdmin }, dispatch ]= useStoreContext()
   // const [ financialData, setFinancialData ]= useState({})
   const [ currencyList, setCurrencyList ]= useState([])
   const [ currencyISO, setCurrencyISO ]= useState([])
   const [ orgData, setOrgData ]= useState({}) 

   const refForm = useRef()
   const formEls = useRef({})

   async function loadPage(){
      loadCurrencies()

      const { status, data, message }= await fetchJSON( '/api/orgs' )
      console.log( `[orgs] status(${status}) message(${message}) SignupDetails loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }

      // set the INPUT boxes, do the financial subset too
      Object.keys(data).forEach( item=>{ if( formEls.current[item] ) formEls.current[item].value = data[item] || '' })
      Object.keys(data.financial).forEach( item=>{ if( formEls.current[`f_${item}`] ) formEls.current[`f_${item}`].value = data.financial[item] })

      setOrgData({ ...data })
      setCurrencyISO( data.financial.currencyISO )
   }
  
   async function loadCurrencies(){
      const { status, currencies, message }= await fetchJSON( '/api/financial/currencies' )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }
      const _currencies = Object.keys(currencies).map( key=>`${currencies[key]} (${key})` )
      setCurrencyList( _currencies )
   }

   function currencySet( e ){
      const currency = e.target.value
      const currencyISO = currency.substr(currency.length-4,3)
      setCurrencyISO( currencyISO )
      setOrgData({ ...orgData, ...{ financial: { currencyISO } } })
   }

   async function financialUpdate( e ){
      e.preventDefault()
      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         // orgUrl.current.value = orgUrl.current.value.toLowerCase()
         refForm.current.classList.add('was-validated')
         console.log( `.. !x failed validation, returning.` )
         return
      }

      const saveData = { ...orgData }
      // console.log( `saveData: `, saveData )
      // refresh with user INPUT fields
      Object.keys(formEls.current).forEach( item=>{ 
         if( item.substr(0,2)==='f_' ){
            console.log( `saveData.financial:`, saveData.financial )
            console.log( `saveData.financial[${item.substr(2)}] = '${formEls.current[item].value}'`)
            saveData.financial[item.substr(2)] = formEls.current[item] ? formEls.current[item].value : ''
         } else
            saveData[item] = formEls.current[item] ? formEls.current[item].value : ''
      })
      // console.log( `saveData: `, saveData )
      
      const { status, message }= await fetchJSON( `/api/orgs`, 'put', saveData )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }

      // update client-side session data
      dispatch({ type: 'USER_SESSION_ADMIN', data: { org: saveData }, message });
      setOrgData({ ...saveData })

      // reset validation/open items
      refForm.current.classList.remove('was-validated')
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

               <div class="mb-3">
                  <label for="timezone">Base Currency</label>
                  <div class="input-group mb-3">
                     <input ref={el=>formEls.current.f_currencyDesc=el} onChange={currencySet} id="currency" list="currencyList" type="text" class="form-control" pattern="[\w() ]{10,}" placeholder="USD" required />
                     <span class="input-group-text"><i class="fas fa-money-bill-wave-alt"></i>&nbsp;{currencyISO}</span>
                  </div>
                  <div class="invalid-feedback">
                     Please choose the key currency you are using.
                  </div>
                  
                  <datalist id="currencyList">
                     { currencyList.map( row=><option value={row}/> )}
                  </datalist>
               </div>
               <div class="mb-5">
                  <label for="taxRate" class="form-label">Default Tax Name & Rate</label>
                  <div class="input-group mb-3">
                     <input ref={el=>formEls.current.f_taxName=el} id="taxName" type="text" class="form-control" placeholder="Sales Tax" />
                     <input ref={el=>formEls.current.f_taxRate=el} id="taxRate" type="text" class="form-control" pattern="[0-9\.]{0,4}" placeholder="13" />
                     <span class="input-group-text">%</span>
                  </div>
                  <div class="invalid-feedback">
                     If online payments enabled, payment processor tax rate is used. This tax rate is shown in the initial guidance pricing, most useful 
                     when no payment processor enabled, for onsite payment.
                  </div>
               </div>
               
               <div class="mb-3">
                  <h4>Online Payments <i class="fab fa-cc-stripe text-warning"></i></h4>
                  <div class="form-check text-muted">
                     <input onClick={()=>setOrgData({...orgData,isRequireOnline:!orgData.isRequireOnline})} defaultChecked={orgData.isRequireOnline} id="isRequireOnline" class="form-check-input" type="checkbox" />
                     <label class="form-check-label text-primary" for="isRequireOnline">
                        <b>Require Order Pre-Payments</b>
                     </label> 
                  </div>

                  <div class='alert alert-warning'>
                     To receive payments, you'll need to register on Stripe:<br />
                     <a href="https://dashboard.stripe.com/register" tabIndex="-1" rel="noreferrer" target="_blank">dashboard.stripe.com/register</a>
                  </div>
               </div>
               <div className={orgData.isRequireOnline ? "" : "d-none"}>{orgData.isRequireOnline}
                  <div class="mb-3">
                     <label for="stripePubKey" class="form-label">Stripe Publishable Key</label>
                     <input ref={el=>formEls.current.f_stripePubKey=el} id="stripePubKey" type="text" class="form-control" pattern="[\w_]{24,}" placeholder="ex. pk_52IIQ5TFksB71gtFmTQuyIG2knRZNqhFDwOL10JhcjUxYZ" required />
                     <div class="invalid-feedback">
                        Please register with Stripe and put the <b>public</b> key in here.
                     </div>
                  </div>
                  <div class="mb-3">
                     <label for="stripePrivKey" class="form-label">Stripe Private Key</label>
                     <input ref={el=>formEls.current.f_stripePrivKey=el} id="stripePrivKey" type="password" class="form-control" pattern="[\w_]{24,}" required />
                     <div class="invalid-feedback">
                        Please register with Stripe and put the <b>private</b> (secret) key in here.
                     </div>
                  </div>
                  <div class="mb-3">
                     <label for="stripeTaxKey" class="form-label">Stripe Tax-Rate Key(s)</label>
                     <input ref={el=>formEls.current.f_stripeTaxKey=el} id="stripeTaxKey" type="text" class="form-control" pattern="[\w_]{24,}" placeholder="ex. txr_23e8VNkqrFDwOL10JhcjUxYZ" required />
                     <div class="invalid-feedback">
                     Enter the Stripe key for the tax code(s). If one code given, it will be applied to all; if multiple given, it will match the code to the buyers shipping location or credit-card location. See: <a href='https://stripe.com/docs/payments/checkout/taxes' target='_blank' rel="noreferrer">https://stripe.com/docs/payments/checkout/taxes</a>
                     </div>
                  </div>               
                  <div class="mb-3">
                     <label for="stripeProductKey" class="form-label">Product Item Key</label>
                     <input ref={el=>formEls.current.f_stripeProductKey=el} id="stripeProductKey" type="text" class="form-control" pattern="[\w_]{14,}" placeholder="ex. prod_J1njkdj6m0m8Yg" required />
                     <div class="invalid-feedback">
                        In the Stripe <u>Products</u> menu create a product (and give it a name 'Order Total', price $1, no description)
                     </div>
                  </div>
               </div>
            </div>
            <div class="card-footer">
               <button onClick={financialUpdate} class="btn btn-primary mx-1" >Update Financial</button>
            </div>
         </div>
      </form>
   )
}

export default SignupFinancial