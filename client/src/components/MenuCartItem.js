import React from "react"
import { formatMoney } from "../utils/Locale"

function MenuCartItem( props ){

   const { cartItem, items, editCartFunction, adminView }= props
   // console.log( `[MenuCartItem] items:`, items )
   // console.log( `cartItem`, cartItem )

   const item = items.filter(row=>row.itemId===cartItem.itemId)[0]
   if( !item ) return <>Error</>
   // console.log( `item: `, item )
   // gather all the addOns into a single list
   let addOnOptions = []
   if( item.listAddOns ) item.listAddOns.forEach( set=>addOnOptions = [...addOnOptions, ...set.list] )
   // console.log( `[MenuCartItem] addOnOptions`, addOnOptions )

   
   return (
      <>
      <div class="row">
      <div key={cartItem.key} class="col item-layout mb-1">
         <div><span class="badge rounded-pill bg-secondary">{cartItem.quantity}</span> <strong>{item.title}</strong></div>
         { typeof(editCartFunction)==='function' ?
            <div onClick={(e)=>editCartFunction(e,cartItem.itemId,cartItem.key)} class="item-total"><span class="badge rounded-pill bg-warning text-dark">{formatMoney(cartItem.total)}</span><button class='btn btn-sm btn-light'><i class="fas fa-edit text-primary"></i></button></div> 
            :
            <div class="item-total"><span className={`badge rounded-pill text-dark mx-3 ${adminView?'bg-light':'bg-warning'}`}>{formatMoney(cartItem.total)}</span></div>
         }
         { cartItem.requests.length>1 && <i class="fas fa-flag text-warning" title={cartItem.requests}></i> }
         { cartItem.requests.length>1 && adminView && <small class="mx-2 text-muted"><i>{cartItem.requests}</i></small> }
         { cartItem.base && <small class='mx-2 text-muted'><i>({item.listOptions.filter( option=>option.key===cartItem.base )[0].text})</i></small> }
         <div class='mx-2 text-muted'>
         { cartItem.addOns.length>0 && adminView && <><i class="fas fa-angle-right text-warning"></i> </> }
         { cartItem.addOns.length>0 && 
           cartItem.addOns.map( key=><small class="mx-1">{addOnOptions.filter( i=>i.key===key )[0].text}; </small> ) }
         </div>
      </div>
      </div>
      </>
   )
}

export default MenuCartItem