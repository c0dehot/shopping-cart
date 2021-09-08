import React, { useEffect, useState } from 'react'

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'

function Info() {
   const [{ isAdmin, org, affilCode }, dispatch ]= useStoreContext()
   const [ show, setShow ]= useState({ tour: true })

   async function loadPage(){
      window.scrollTo({ top: 0, behavior: "smooth" })
   }

   async function changeLink( e ){
      e.preventDefault()

      const url = '/admin/items' // sets this as new user redirectUrl
      const { status, message }= await fetchJSON( `/api/users/redirecturl`, 'put', { url } )
      if( !status ) return

      // save and redirect to items list
      dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: url, message })
   }

   function toggleBlock( e ){
      e.preventDefault()
      const block = e.currentTarget.id
      setShow({ ...show, [block]: !show[block] })
   }

   // on initial page load, we transition false->true for isAdmin: user-store is populated at that point.
   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin] )


   return (
      <form>
         <div class="card">
            <div class="card-header">
               <h4>
                  {org.name}: Quick Tour 
               </h4> 
            </div>
            <div class="card-body row">
               <p>
                  You are nearly ready to list your shopping cart! <i class="text-success far fa-smile-wink fa-3x"></i>
               </p>
               <p>
                  The final step is to list your items that will be available for purchase in the shopping cart. But before we get to that step, we want to quickly give you a tour of the features of the admin page that you can 
                  use to manage the site.
               </p>
               <h5 onClick={toggleBlock} id="opensource" class="mt-3 text-muted"><button class='btn btn-sm btn-primary'  title="Click to expand"><i class="fas fa-angle-double-down"></i></button> Open Source - Modify Our Code</h5>
               { show.opensource && <p class="mb-4">
                  Our community version of our software is <a href='https://github.com/c0dehot/shopping-cart/' target='_blank' rel="noreferrer"><b>open source</b></a> so
                  any developers or hackers out there - we encourage you to extend it and help build out the features you need for your 
                  shopping cart. In the future, we plan to have premium features that will enhance your ability to sell even further, but all the free options 
                  will remain free!
               </p> }
               <h5 onClick={toggleBlock} id="affiliate" class="mt-3 text-muted"><button class='btn btn-sm btn-primary' title="Click to expand"><i class="fas fa-angle-double-down"></i></button> Affiliate Sharing - Earn Commission!</h5>
               { show.affiliate && <p>
                  
                  Your affiliate code is <b>{affilCode}</b>. If you share this link with others to use Restocart, you will be able to 
                  commission on others who sign-up under your link. Feel free to contact us to find out more, 
                  and let's grow our network together.<br />
                  <div class="alert alert-warning ml-5 mr-5">
                  Each person that signs up with your link will earn you more premium time:
                  <div>
                     <a href={`/signup/${affilCode}`} target='_blank' rel="noreferrer">https://restocart.ca/signup/{affilCode}</a>
                  </div>
               </div>
               </p> }
               <h5 onClick={toggleBlock} id="tour" class="mt-3"><button class='btn btn-sm btn-primary' title="Click to expand"><i class="fas fa-angle-double-down"></i></button> Admin Tour</h5>
               { show.tour && <p>
                  At the top there are 4 menus:
                  <ul class="list-group mx-1">
                     <li class="list-group-item">
                        <div class="fw-bold">Orders</div>Any order that come in will appear here for you to manager</li>
                     <li class="list-group-item">
                        <div class="fw-bold">Categories</div>Adjust the category list for the items you are selling</li>
                     <li class="list-group-item">
                        <div class="fw-bold">Items</div>Manage the items you are selling</li>
                     <li class="list-group-item">
                        <div class="fw-bold">Account Settings</div>
                        <ul>
                           <li><i>Profile</i> - Manage your emails, password and profile settings</li>
                           <li><i>Organization</i> - Manage the organization info (like name, location, email, cart-link, open-hours, etc)</li>
                           <li><i>Affiliate Invites</i> - See the list of people that have signed up under you</li>
                           <li><i>Financial</i> - Manage your Stripe payment information</li>
                        </ul>
                     </li>
                  </ul>
               </p> }
               <h5 class="mt-3">Ok Let's Go!</h5>
               <p>
                  Remember to customize the look of your shopping cart from the <b>Account Settings &gt; Organization</b> link! But 
                  first, let's get some of those items listed in your shopping cart so you can preview it. <b>Click on [Next]...</b>
               </p>
            </div>
            <div class="card-footer">
               <button onClick={changeLink} class="btn btn-primary mx-1" >Next</button>
            </div>            
         </div>
      </form>
   )
}

export default Info