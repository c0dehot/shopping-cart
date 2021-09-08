import React, { useRef, useEffect, useState } from "react";
import { useStoreContext } from '../utils/GlobalStore'
import { formatMoney } from "../utils/Locale"

function genKey( inc=0 ){
   return (Date.now()+inc).toString(36)
}

let cartItem = {}

function MenuModalCartItem( props ){
   const [{ cart }, dispatch ]= useStoreContext()

   const formEls = useRef({})
   const [ itemTotal, setItemTotal ]= useState(0)
   const [ showRequests, setShowRequests ]= useState(false)
   const { item }= props
   
   function cancel(e){
      // only allow cancel triggered on certain areas
      if( ['modalTop','modalClose'].indexOf(e.target.id)>-1 ) props.hide()
   }

   function refreshCartItem(){
      cartItem.requests = formEls.current.requests && formEls.current.showRequests.checked ? formEls.current.requests.value : ''
      cartItem.quantity = Number(formEls.current.quantity.value)
      cartItem.addOns = []

      let baseTotal = 0
      let addOnsTotal = 0
      // gather the radio/checkboxes & tally price
      Object.keys(formEls.current).forEach( item=>{ 
         if( formEls.current[item] && formEls.current[item].checked ){
            if( formEls.current[item].dataset.base ){
               cartItem.base = item
               baseTotal = Number(formEls.current[item].dataset.price)
            } else if( item!=='showRequests' ){
               cartItem.addOns.push(item)
               addOnsTotal += Number(formEls.current[item].dataset.price); 
            }
         }
      })
      // the cost is quantity * (default-price | base-option selected price)  + add-ons selected
      cartItem.total = ( cartItem.quantity * (cartItem.base?baseTotal:item.price) + addOnsTotal ).toFixed(2)
      setItemTotal( cartItem.total )
   }

   function saveCartItem(e){
      e.preventDefault()
      // gather all the passive inputs into the cartItem object
      refreshCartItem()

      // now save it
      dispatch({ type: 'UPDATE_CART', cartItem, message: `..${item.title}` })
      props.hide()
   }

   function delCartItem(e){
      e.preventDefault()

      dispatch({ type: 'DELETE_CART', cartItem })
      props.hide()
   }

   useEffect( function(){
      if( !item ) return;

      // item changes/loaded, reset modal form.
      console.log( `[MenuModal] item(${item.itemId}) cartItemKey(${item.cartItemKey})`)
      formEls.current.requests.value = ''; formEls.current.quantity.value = 1

      // if this is a cart item being edited, let's retrieve it's settings
      if( item.cartItemKey ){
         cartItem = cart.filter( i=>i.key===item.cartItemKey )[0]
         
         if( cartItem.requests.trim().length>0 )
            formEls.current.requests.value = cartItem.requests         
         if( cartItem.base ) 
            formEls.current[cartItem.base].checked = true
         formEls.current.quantity.value = cartItem.quantity
         cartItem.addOns.forEach( addOnKey=>formEls.current[addOnKey].checked = true )
      } else {
         // we can have the same item mulitple times in a cart, so we gen a unique key for them
         cartItem = { key: genKey(), itemId: item.itemId, base: '', addOns: [] }
      }

      formEls.current.showRequests.checked = formEls.current.requests.value.length>0
      setShowRequests( formEls.current.requests.value.length>0 )
      
      refreshCartItem()
   }, [item])

   return (
   <>
   <div onClick={cancel} id='modalTop' class={`modal ${item.itemId ? 'show modal-fade-in': 'modal-fade-out'}`} tabindex="-1">
      <div class="modal-dialog modal-fullscreen-sm-down">
         <div class="modal-content">
         <div class="modal-header">
            <h5>{item.title}</h5>
            <button onClick={cancel} id='modalClose' class="btn-close"></button>
         </div>
         <div class="modal-body" onClick={refreshCartItem}>
         {/* { item.image && <div class="modal-background" style={{backgroundImage: `url(${item.image})`}}></div> } */}
         { item.image && <img src={item.image} alt={item.info} class="item-thumbnail" /> }
            <p class='item-info pb-2'>{item.info}</p>
            { item.listOptions && item.listOptions.length>0 &&
               <>
               <h6 class='clearfix'>{item.headingOptions}</h6>
               <ul class="list-group pb-4">
                  { item.listOptions.map( (option,idx)=>
                     <li key={option.key} class="list-group-item d-flex justify-content-between align-items-center product">
                        <div class="form-check">
                           <input ref={el=>formEls.current[option.key]=el} defaultChecked={idx===0} data-base="1" data-price={option.price||0} class="form-check-input" name='baseOptions' type="radio" id={`baseOption${idx}`} />
                           <label class="form-check-label" for={`baseOption${idx}`}>
                           {option.text}
                           </label>
                        </div>
                        <span>{formatMoney(option.price)}</span>
                     </li>

                  )}
               </ul>
               </>
            }
            { item.listAddOns && item.listAddOns.length>0 && item.listAddOns.map( addOnBlock=>
               <>               
               <h6>{addOnBlock.heading}</h6>
               <ul class="list-group">
                  { addOnBlock.list.length && addOnBlock.list.map( addOn=>
                     <li key={addOn.key} class="list-group-item d-flex justify-content-between align-items-center product">
                        <div class="form-check">
                              <input ref={el=>formEls.current[addOn.key]=el} data-price={addOn.price||0} type={addOnBlock.type} id={addOn.key} class="form-check-input" />
                              <label class="form-check-label" for={addOn.key}>
                              {addOn.text}
                              </label>
                        </div>
                        <span>{formatMoney(addOn.price)}</span>
                     </li>
                  )}                  
               </ul>
               </>
            ) }
            <div class="mt-3 mb-3">
               <div class="form-check text-muted">
                  <input ref={el=>formEls.current.showRequests=el} onChange={()=>setShowRequests( formEls.current.showRequests.checked )} data-price="0" class="form-check-input" type="checkbox" id="showRequests" />
                  <label class="form-check-label" for="showRequests">Special Requests <i class="fas fa-flag text-warning"></i></label>
               </div>
               <textarea ref={el=>formEls.current.requests=el} className={showRequests ? 'form-control' : 'd-none'} />
            </div>      
         </div>
         <div class="modal-footer">
            { item.cartItemKey && <div class="flex-grow-1"><button onClick={delCartItem} class="btn btn-sm btn-danger"><i class="fas fa-trash-alt"></i> Delete</button></div>}
            <select ref={el=>formEls.current.quantity=el} onChange={refreshCartItem} data-price="0" class="form-select w-25">
               { [1,2,3,4,5,6,7,8,9].map( n=><option value={n}>{n}</option>)}
            </select>
            <button onClick={saveCartItem} class="btn btn-primary">{item.cartItemKey ? 'Update' : 'Add'} ({formatMoney(itemTotal)})</button>
         </div>
         </div>
      </div>
   </div>
   { item.itemId && <div class="modal-backdrop fade show"></div> }
   </>
   )
}

export default MenuModalCartItem