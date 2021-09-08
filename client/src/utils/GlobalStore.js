import React, { createContext, useReducer, useContext } from 'react'

// any variables we depend on for UI/flow we must pre-set
const initialData = {
   role: 'CART', redirectUrl: '', doingRedirect: false, 
   name: '', thumbnail: '', 
   items: [], alert: '', cart: JSON.parse(localStorage.cart || "[]"), orderCode: '', org: {}, order: { status: '' }
}

// getList( 'order', 'PREPARING', item )
function getList( field, minItem='', item='' ){
   const list = {
      status: [ 'ABANDONED', 'CANCELLED', 'COMPLETED', 'AWAIT_PAYMENT', 'SCHEDULED', 'PREPARING', 'READY', 'DELIVERING' ]
   }

   const minIdx = minItem==='' ? -1 : list[field].indexOf(minItem)
   const itemIdx = list[field].indexOf(item)
   return [ minIdx>-1 && itemIdx>=minIdx, list[field].filter( (_,idx)=>idx>=minIdx ) ]
}

/*! IMPORTANT all your reducer functionality goes here */
const dataReducer = (state, action) => {
   // push the alert on if message exists (and state is ...spread later)
   if( action.message ) state.alert = action.message

   switch (action.type) {
      case 'USER_LOGIN':
      case 'USER_SESSION_ADMIN': {
         // trigger redirect if redirectUrl *and* it's the initial login-only
         const doingRedirect = action.type==='USER_LOGIN' && action.data.redirectUrl && action.data.redirectUrl.length>1
         // grab the cart if stored
         const role = (action.data && action.data.role) || state.role || ''
         console.log( ` ...... USER_LOGIN: role(${role}) state`, state )
         const acl = role==='SUPER' ? { isSuper: true, isAdmin: true, isGuest: false } : 
                     role==='ADMIN' ? { isSuper: false, isAdmin: true, isGuest: false } : 
                                      { isSuper: false, isAdmin: false, isGuest: true }
         // const acl = ((state.role && state.role==='ADMIN') || (action.data.role && action.data.role==='ADMIN')) ? { isAdmin: true } : { isGuest: true }
         console.log ( `>>> outoing state: `, { ...state, ...action.data, ...acl, doingRedirect, org: {...state.org, ...action.data.org} } )
         return { ...state, ...action.data, ...acl, doingRedirect, org: {...state.org, ...action.data.org} }
      }
      case 'USER_SESSION_ORDER_PAID':
      case 'USER_SESSION_ORDER': {
         // trigger redirect if redirectUrl specified
         const doingRedirect = action.type==='USER_SESSION_ORDER_PAID' && action.data.redirectUrl && action.data.redirectUrl.length>1

         // if localStorage.cart exists, use it, ELSE if incoming cart-data use that
         const cart = localStorage.cart ? JSON.parse( localStorage.cart ) : (action.data.cart || [])

         let orderCart = {}
         if( action.data && action.data.order ){
            const [ isActiveOrder ]= getList( 'status', 'AWAIT_PAYMENT', action.data.order.status )
            if( isActiveOrder && action.data.order.cart.length>0 ){
               orderCart = { cart: action.data.order.cart }
               // console.log( `>> active order, and have an order cart, so revert to that cart: `, orderCart )
            }
         } else if( !action.data ){
            action.data = {}
         }
         const acl = ((state.role && state.role==='ADMIN') || (action.data.role && action.data.role==='ADMIN')) ? { isAdmin: true } : { isGuest: true }
         return { ...state, ...action.data, ...acl, doingRedirect, cart, ...orderCart, org: {...state.org, ...action.data.org}, order: {...state.order, ...action.data.order} }
      }
      case 'USER_LOGOUT': {
            // needed to force this reload (else it just refreshed with invalid content)
            delete localStorage.session
            delete localStorage.cart
            return { ...initialData, redirectUrl: '/login', doingRedirect: true }
         }
   
      case 'ALERT_MESSAGE':
         return { ...state }
      case 'ALERT_CLEAR':
         return { ...state, alert: '' }
      case 'UPDATE_REDIRECT_GO':
         return { ...state, redirectUrl: action.redirectUrl, doingRedirect: true }
      case 'UPDATE_REDIRECT_DONE':
         return { ...state, doingRedirect: false }
      case 'UPDATE_ITEMS':
         return { ...state, items: action.items }
      case 'SETUP_CART':
         return { ...state, cart: { ...action.data } }
      case 'UPDATE_CART': {
         let cart = [...state.cart ]
         // if this key already exists, we update it, else create it
         const idx = action.cartItem ? cart.findIndex( row=>row.key===action.cartItem.key ) : -1
         if( idx>-1 )
            cart[idx] = action.cartItem
         else
            cart.push( action.cartItem )
         localStorage.cart = JSON.stringify( cart )
         return { ...state, cart }
      }
      case 'DELETE_CART': {
         let cart = [...state.cart ]
         const idx = action.cartItem ? cart.findIndex( row=>row.key===action.cartItem.key ) : -1
         if( idx>-1 ) cart.splice(idx,1)
         localStorage.cart = JSON.stringify( cart )
         return { ...state, cart }
      }  
      case 'CLEAR_CART': {
         delete localStorage.cart
         return { ...state, cart: [] }
      }
      default: {
         console.log(`x !Invalid action type: ${action.type}`)
         return state
      }
   }
}



const StoreContext = createContext()

const useStoreContext = function(){
   return useContext(StoreContext)
}

const StoreProvider = function(props){
   const [state, dispatch] = useReducer( dataReducer, initialData )
   return <StoreContext.Provider value={[state, dispatch]} {...props} />
}

export { StoreProvider, useStoreContext, getList }