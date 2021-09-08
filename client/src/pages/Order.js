import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { DateTime } from 'luxon'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'
import MenuCartItem from '../components/MenuCartItem'
import RatingBar from '../components/RatingBar'
import HoursSchedule from "../components/HoursSchedule"
import BusinessAddress from "../components/BusinessAddress"
import { formatMoney } from "../utils/Locale"

import "./Menu.css"

let stripe = null
let refreshInterval

function Menu() {
    const [{ order, items, cart, org, userId }, dispatch ]= useStoreContext()
    const [ invalidSite, setInvalidSite ]= useState(false)
    const [ paymentPageLoading, setPaymentPageLoading ]= useState(false)
    const [ qrCode, setQRCode ]= useState("")
    const { restoUrl,orderResult }= useParams()
    // const refCart = useRef()
    const inputInquiry = useRef()
    let coordBox = ''
    
    const refForm = useRef()
    const formEls = useRef({})

    // geo coordinates size box
    if( org.coords ){
        let [ lat, long ]= org.coords.replace(' ','').split(',')
        lat = Number(lat); long = Number(long)
        coordBox = `${long-0.01},${lat-0.01},${long+0.01},${lat+0.01}`
    }

    async function checkOrderStatus(){
        const { status, data, message }= await fetchJSON( `/api/order/${restoUrl}/${localStorage.orderCode}` )
        console.log( `[checkOrderStatus] url(${restoUrl}) status(${status}) message(${message}) userItems:`, data )
        // update any user-data
        dispatch({ type: 'USER_SESSION_ORDER', data, message })

        // stop polling if not in the preparing/ready phases
        if( data && data.order && data.order.status && ['CANCELLED','ABANDONED','COMPLETED'].indexOf(data.order.status)>-1 && refreshInterval ){
            console.log( "~ clearing interval checker" )
            clearInterval(refreshInterval)
        }
    }

    async function loadPage(){
        console.log( `[loadPage] org`, org )
        let userData = {}
        const { status, data, message }= await fetchJSON( `/api/order/${localStorage.orderCode||''}`, 'post', cart )
        console.log( `[loadPage] url(${restoUrl}) status(${status}) message(${message}) localStorage.orderCode(${localStorage.orderCode}) userItems:`, data )
        console.log( ` ORER DATA: /api/order/${localStorage.orderCode||''}`, data )
        if( !status || !data.order.status ){ 
            // an error means this is an invalid url site, clear any order and leave
            setInvalidSite(true)
            delete localStorage.orderCode
            dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl:`/${restoUrl}`, message: 'Something didn\'t work, let\'s try again!' })
            return 
        }

        userData = data

        if( orderResult==='complete'){
            // if a refresh back to this page from stripe, let's grab[+update] order details
            const transId = (new URLSearchParams(window.location.search)).get('transId')
            const { status, data, message }= await fetchJSON( `/api/stripe/checkout-status?sessionId=${transId}` )
            // console.log( ` order data status(${status}) message(${message}) : `, data )
            if( status && data ) userData.order = data
            // 'PAID' part means it will accept redirect
            dispatch({ type: 'USER_SESSION_ORDER_PAID', redirectUrl: `/${restoUrl}/order`, data: userData, message })

        } else {
            const _order = data.order
            // if payment processor, then first 'AWAIT_PAYMENT' else first is 'AWAIT_INFO'
            if( _order.status==='AWAIT_PAYMENT' || _order.status==='AWAIT_INFO' ){
                if( _order.orderCode ){
                    console.log( ` .. saving orderCode to localStorage! ${_order.orderCode}`)
                    localStorage.orderCode = _order.orderCode
                    // update the cart to reflect the user cart
                    localStorage.cart = JSON.stringify( _order.cart )

                    const qrCode = `https://chart.googleapis.com/chart?chs=500x500&cht=qr&choe=UTF-8&chl=${_order.orderCode}`
                    console.log( `qrCode='${qrCode}'`)
                    setQRCode( qrCode )
                } 

                if( _order.status==='AWAIT_PAYMENT' && !orderResult )
                    // now open payment page
                    initPayment( null, _order.subtotal )
            
            } else if( _order.status==='PREPARING' || _order.status==='READY' ){
                console.log( `~ starting check timer`)
                if( refreshInterval ) clearInterval(refreshInterval)
                refreshInterval = setInterval( checkOrderStatus, 15000 )
            }

            // update the cart to match this order
            dispatch({ type: 'USER_SESSION_ORDER', data: userData, message })
        }
    }

    // when no pre-payment, we capture the user info
    async function paymentInfoCapture( e ){
        e.preventDefault()
    
        // leverage browser built in + bootstrap features for form validation
        if( !refForm.current.checkValidity() ){
            refForm.current.classList.add('was-validated')
            return
        }
    
        const orderData = {}
        // refresh the user INPUTs
        const orderFields = ['name','email','phone','note']
        orderFields.forEach( item=>{ orderData[item] = formEls.current[item].value })

        console.log( `appending user details - '/api/order/userdetails' with:`, orderData )
        const { status, data: order, message }= await fetchJSON( `/api/order/userdetails/${localStorage.orderCode}`, 'put', orderData )
        console.log( `[paymentInfoCapture] - order:`, order )
        if( !status ){
            dispatch({ type: 'ALERT_MESSAGE', message })
            return
        }        
        // update the client-side order info (and likewise that refreshes the changes)
        dispatch({ type: 'USER_SESSION_ORDER', data: { ...order }, message })
    }

    // pre-payment initiate payment via stripe
    async function initPayment( e, subtotal=0 ){
        if( e ) e.preventDefault()
        console.log( `[initPayment]` )
        setPaymentPageLoading(true)
        const { publicKey, currency }= await fetchJSON( '/api/stripe/config/' )

        const { sessionId }= await fetchJSON( '/api/stripe/checkout', 'post', { subtotal: subtotal ? subtotal : order.subtotal } )
        // init session + redirect to checkout
        stripe = await loadStripe(publicKey)
        const result = await stripe.redirectToCheckout({sessionId})
        setPaymentPageLoading(false)
        // console.log( `.. chekcout result: `, result )
    }

    async function restartOrder( e ){
        e.preventDefault()
        console.log( `restarting to orders.... `)
        if( localStorage.orderCode ){
            const { status, message }= await fetchJSON( `/api/order/restart/${localStorage.orderCode}`, 'put', {})
        }
        delete localStorage.orderCode
        delete localStorage.cart
        dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: `/${restoUrl}` })
        // window.location = `/${restoUrl}`
    }

    async function updateRating( rating ){
        const { status, data: order, message }= await fetchJSON( `/api/order/rating/${localStorage.orderCode}`, 'put', { rating } )
        console.log( `[updateRating] - order:`, order )
        // update the order info (and likewise that refreshes the changes to notes)
        dispatch({ type: 'USER_SESSION_ORDER', data: { ...order, rating }, message })
    }

    async function orderInquiry( e ){
        e.preventDefault()

        const note = inputInquiry.current.value.trim()
        if( note.length<3 ) return
        inputInquiry.current.value = ''

        const { status, data: order, message }= await fetchJSON( `/api/order/notes/${localStorage.orderCode}`, 'put', { note } )
        console.log( `incoming orde info: `, order )
        // update the order info (and likewise that refreshes the changes to notes)
        dispatch({ type: 'USER_SESSION_ORDER', data: { order }, message })
    }

    // function scrollCart( e ){
    //     e.preventDefault()
    //     window.scrollTo({ top: refCart.current.offsetTop, behavior: "smooth" })
    // }

   // on initial page load, we transition false->true for isAdmin: user-store is populated at that point.
   useEffect( ()=>{
      loadPage()
   }, [] )


    return (
    <>
    { invalidSite ?
        <div class="alert alert-danger mt-5">
            <i class="fas fa-shopping-cart fa-6x float-end"></i> 
            <h1 class="mt-2">We had a problem with that link. Please check you typed it correctly!</h1>
        </div>
    :
    <>
    <div id="menu-banner" className={`p-4 p-md-5 text-white rounded ${org.imageMenuBanner ? '' : 'bg-dark'}`}>
        <div id="menu-banner-bg" 
            style={ org.imageMenuBanner && { backgroundImage: `url(${org.imageMenuBanner})` }}></div>
        <div class="col-md-6 px-0">
            <h1 class="display-4">{org.name}</h1>
            <p class="text-muted">{org.info}</p>
            {/* <p class="lead mb-0"><Link href="#" class="text-white fw-bold">Continue reading...</Link></p> */}
        </div>
    </div>

    <div class="mx-3 text-dark border-bottom row">
        <div class="col-12 col-md-4 col-lg-3">
            <i class="fas fa-phone-alt ml-3"></i> <a href={`tel:${org.phone}`}>{org.phone}</a>
        </div>
        <div class="col-12 col-md-4 col-lg-3">
            <HoursSchedule />
        </div>
        <div class="col-12 col-md-4 col-lg-6">
            <BusinessAddress />
        </div>
    </div>    
    <div class="row">
        <div class="col-12 col-md-6 mb-3">
            <div class="card">
                <div class="card-header">
                    <h3>Order #: {order.orderCode}</h3>
                </div>
                <div class="card-body">
                    <h4>
                    { (order.status==='CANCELLED' || order.status==='ABANDONED') && <><i class="fa fa-pause-circle text-danger"></i> Order Cancelled</> }
                    { order.status==='COMPLETED' && <><i class="fa fa-check-circle text-success"></i> Order Completed!</> }
                    { order.status==='AWAIT_PAYMENT' && <><i class="fa fa-pause-circle text-danger"></i> Payment Needed First</> }
                    { order.status==='AWAIT_INFO' && <><i class="fa fa-pause-circle text-danger"></i> Order Details Needed</> }
                    { order.status==='SCHEDULED' && <><i class="fa fa-check-circle text-success"></i> Order Scheduled for {order.deliverAt} </> }
                    { order.status==='PREPARING' && <><i class="fas fa-circle-notch text-secondary"></i> Preparing Order </> }
                    { order.status==='READY' && <><i class="fa fa-check-circle text-success"></i> Order Ready for Pickup </> }
                    { order.status==='DELIVERING' && <><i class="fa fa-circle text-success"></i> Order Out for Delivery </> }
                    </h4>
                    { ['SCHEDULED','PREPARING','READY','DELIVERING'].indexOf(order.status)>-1 && order.statusInfo && <h5 class="text-warning"><i>{order.statusInfo}</i></h5> }
                    { order.status==='COMPLETED' && 
                    <div class="mt-3">
                        <p>We hope you enjoyed your order!</p>
                        <p>Please rate your order & service:</p>
                        <RatingBar rating={order.rating} magnify={3} updateRating={updateRating} />
                    </div> }
                    <div class="mt-3">
                        { ['ABANDONED','CANCELLED','COMPLETED'].indexOf(order.status)>-1 &&
                            <><button onClick={restartOrder} class="btn btn-success"><i class="fas fa-sync-alt"></i> New Order</button></> }
                        { order.status==='AWAIT_PAYMENT' && !paymentPageLoading &&
                            <><button onClick={initPayment} class="btn btn-warning"><i class="fas fa-credit-card"></i> Complete Payment</button>
                            <div class="mt-3"><small>Or cancel order:</small></div>
                            <button onClick={restartOrder} class="btn btn-outline-secondary"><i class="fas fa-sync-alt"></i> Cancel Order</button></> }
                        { order.status==='AWAIT_PAYMENT' && paymentPageLoading &&
                            <><h2 class="spinner-border text-warning">&nbsp;</h2><h4>Please Wait Loading...</h4></>}
                        { order.status==='AWAIT_INFO' &&
                            <form ref={refForm} class="form-signin">
                                <p>Please verify your order before finalizing this, it will be to the right or below this form.</p>
                                <p>Please enter your contact details to proceed:</p>
                            
                                <div class="mb-3">
                                    <label for="name">Your Name</label>
                                    <input ref={el=>formEls.current.name=el} type="text" id="name" class="form-control" required />
                                    <div class="invalid-feedback">
                                            Please enter your name
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="name">Email</label>
                                    <input ref={el=>formEls.current.email=el} type="text" id="email" class="form-control" required />
                                    <div class="invalid-feedback">
                                            Please enter your email to receive updates
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="name">Phone</label>
                                    <input ref={el=>formEls.current.phone=el} type="text" id="phone" class="form-control" required />
                                    <div class="invalid-feedback">
                                            Please enter your mobile phone so we can reach you before preparing.
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="note" class="form-label">Anything Else? Attach Message</label>
                                    <textarea ref={el=>formEls.current.note=el} id="note" class="form-control" rows="2"></textarea>
                                </div>
                                <div class="card-footer">
                                    <button onClick={paymentInfoCapture} class="btn btn-primary mx-1" >Start Order</button>
                                    <button onClick={restartOrder} class="float-end btn btn-outline-secondary">Cancel</button>
                                </div>
                            
                            </form> }                            
                        { ['PREPARING','READY'].indexOf(order.status)>-1 &&
                            <><a target="_blank" href={ org.coords ? `https://www.google.com/maps/search/?api=1&query=${org.coords}` 
                                                                : `https://www.google.com/maps?q=${encodeURIComponent(org.address)}`} rel="noreferrer">
                                <small class='text-muted'>Pickup at {org.address}</small>
                            </a>
                            { org.coords && <iframe class="w-100 h-50" title="Map" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" 
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordBox}&layer=mapnik&marker=${org.coords}`} /> }
                            </>}
                    </div>
                    {/* <p>When Picking Up Show QR-Code:</p>
                    { qrCode && 
                    <div class="mb-3 d-block">
                            <a href={qrCode} target="blank"><img src={qrCode} class="w-100" alt="qr code" /></a>
                    </div> } */}

                    { ['SCHEDULED','PREPARING','READY','DELIVERING'].indexOf(order.status)>-1 &&
                        <><h5 class="text-primary mt-3"><i class="fas fa-comments"></i> Order Updates</h5>
                        { order.notes && order.notes.map( note=>
                        <>{ note.userId===userId ? 
                                <div class="text-secondary"><i class="fas fa-comments" title={DateTime.fromSeconds(note.timestamp-1).toRelative()}></i> {note.note}</div> :
                                <div class="text-primary"><i class="fas fa-reply" title={DateTime.fromSeconds(note.timestamp-1).toRelative()}></i> {note.note}</div> 
                            }</> )}
                        <div class="input-group">
                            <input ref={inputInquiry} type="text" class="form-control" placeholder="Ask Question" />
                            <button onClick={orderInquiry} class="btn btn-primary"><i class="fas fa-comments"></i></button>
                        </div>
                        </>
                    }
                </div>
            </div>
        </div>
        <div class="col-12 col-md-6">
            <div class="shopping-cart card">
                <div class="card-header">
                    <h3>Order Items</h3>
                </div>
                { cart.length>0 ?
                    <>
                    <div class="card-body">
                        { cart.map( cartItem=><MenuCartItem items={items} cartItem={cartItem} /> )}
                        <div class="row">
                            <div class="col item-layout mt-3 mb-1">Subtotal
                                <div class="item-total"><span class="badge rounded-pill bg-light text-dark mx-3">{order.subtotal ? formatMoney(order.subtotal):'-'}</span></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col item-layout mb-1">{ order.taxName || 'Tax' }
                                <div class="item-total"><span class="badge rounded-pill bg-light text-dark mx-3">{order.tax ? formatMoney(order.tax):'-'}</span></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col item-layout mb-1"><strong>Total</strong>
                                <div class="item-total"><span class="badge rounded-pill bg-light text-dark mx-3">{order.total ? formatMoney(order.total):'-'}</span></div>
                            </div>
                        </div>
                    </div>
                    </>
                :
                    <div class="card-body text-secondary">
                        <i class="fas fa-book-reader fa-4x text-warning float-start mx-3"></i> 
                        Yumm... Nothing in order!
                    </div>
                }
            </div>
        </div>
    </div>        
    </>
    }
    </>
    )
}

export default Menu