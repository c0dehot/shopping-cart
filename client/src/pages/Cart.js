import React, { useEffect, useState } from "react"
import { useStoreContext } from '../utils/GlobalStore'

function Cart( props ){
    const [{ products, cart }, dispatch ] = useStoreContext()
    const [ cartProducts, setCartProducts ]= useState([])

    function cartAdd( e, id, num ){
        e.preventDefault()
        // the component is re-rendered multiple times, so it triggers this dispatch twice
        dispatch({ type: 'CART_ADD', id, num })
      }
    
    // whenever page loads we generate the cart
    useEffect( function(){
        setCartProducts(
            cart.map( cartItem=>{ return { ...cartItem, ...products.filter(product=>product._id===cartItem.id )[0] } })
        )
    }, [])
   return (
      <ul key={props.heading} class="list-group">
         {/* {cartProducts.map( product=><ProductCartRow {...product} />)} */}
      </ul>
   )
}

export default Cart