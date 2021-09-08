import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'
import { formatMoney } from "../../utils/Locale"

import ImageCover from '../../components/ImageCover'

function Items() {
  const [{ isAdmin, items, org }, dispatch ]= useStoreContext()

   async function loadPage(){
      window.scrollTo({ top: 0, behavior: "smooth" })

      const { status, data, message }= await fetchJSON( '/api/items' )
      console.log( `[loadPage] status(${status}) message(${message}) userItems:`, data )
      if( !status ){
         dispatch({ type: 'USER_LOGOUT', message })
         return
      }

      // update tasks list
      dispatch({ type: 'UPDATE_ITEMS', items: data })
   }

   // on initial page load, we transition false->true for isAdmin: user-store is populated at that point.
   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin] )


   return (
      <form>
         <div class="card">
            <div class="card-header">
               <Link to="/admin/items/new" class="btn btn-primary float-end">+ Add</Link>
               <h4>
                  {org.name}'s List 
                  { items && items.length>0 && <a class="btn btn-outline-secondary btn-sm mx-4" target="_blank" href={`/${org.url}/`} rel="noreferrer">Show Menu</a> }
               </h4> 
            </div>
            <div class="card-body row">
               {!items ?
               <div class="alert alert-warning ml-5 mr-5">
                  <h2>Nothing in our menu yet!</h2>
                  Looks like we need to add a few things to our menu. Click on the [+Add] button at the top to start!
               </div>
               :   
               items && items.map( item=>
                  <>
                  { item.catHeading && <><hr /><h3>{item.category}</h3></> }
                  <div key={item.itemId} class="col-12 col-md-6 col-lg-3 mb-3">
                     {/* <button onClick={(e)=>item.cartAdd(e,item.itemId,1)} class="btn btn-sm btn-outline-secondary"><i class="fas fa-cart-plus"></i></button> */}
                     <div class="card h-100">
                        <div class="card-body">
                           <ImageCover image={item.image||'/assets/camera.1024x1024.jpg'} info={item.info} />
                           <h3>{item.title}</h3>
                           <div><small class='text-muted'>{item.info}</small></div>
                           <button class='btn btn-outline-secondary'>{formatMoney(item.price)}</button>
                        </div>
                        <div class="card-footer">
                           <Link to={`/admin/items/${item.itemId}`} class='btn btn-primary float-end'><i class="fas fa-edit"></i></Link>
                        </div>
                     </div>
                  </div>
                  </>)}
            </div>
         </div>
      </form>
   )
}

export default Items