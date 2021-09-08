import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'
import MenuModalCartItem from "../components/MenuModalCartItem"
import MenuCartItem from "../components/MenuCartItem"
import HoursSchedule from "../components/HoursSchedule"
import BusinessAddress from "../components/BusinessAddress"
import { scheduleToday, formatMoney } from "../utils/Locale"
import "./Menu.css"

function Menu() {
    const [{ items, cart, org, alert, org: { businessHours, businessHolidays, isAlwaysOpen, timezone} }, dispatch ]= useStoreContext()
    const [ invalidSite, setInvalidSite ]= useState(false)
    const [ current, setCurrent ]= useState({date:'-',time:'-',openNow:false})
    const [ modalItem, setModalItem ]= useState({})
    const { restoUrl }= useParams()
    const formEls = useRef({})

    async function loadPage(){
        const { status, session, data, message }= await fetchJSON( `/api/order/${restoUrl}` )
        console.log( `[loadPage] url(${restoUrl}) status(${status}) message(${message}) userItems:`, data )
        if( !status ){ 
            // an error means this is an invalid url site
            setInvalidSite(true)
            dispatch({ type: 'ALERT_MESSAGE', message })
            return 
        }

        // sets a session the first time
        if( session ){
            localStorage.session = session
            // delete any residual cart/orderCode from other sites
            delete localStorage.cart
            delete localStorage.orderCode
        }

        // if there's a completed order, we jump to it on completed page
        if( data.order && data.order.orderCode && data.order.orderCode===localStorage.orderCode ){
            dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: `/${restoUrl}/order`, data })
        } else {
            dispatch({ type: 'USER_SESSION_ORDER', data })
        }
    }

    function showModalItem( e, itemId, cartItemKey='' ){
        e.preventDefault()
        console.log( `[showItem] itemId(${itemId}) cartItemKey(${cartItemKey})` )
        const item = { ...items.filter( i=>i.itemId===itemId )[0], cartItemKey }
        setModalItem(item)
    }

    function clearCart( e ){
        e.preventDefault()
        if( !window.confirm( 'Are you sure you want to clear the whole cart?') ) return

        dispatch({ type: 'CLEAR_CART', message: "Okay clearing, let's try again!" })
    }

    function scrollToRef( e,el ){
        e.preventDefault()
        if( !formEls.current[el] ) return
        window.scrollTo({ top: formEls.current[el].offsetTop, behavior: "smooth" })
    }

    function startOrder( e ){
        e.preventDefault()
        if( !current.openNow ){
            window.alert( 'Sorry our store is currently closed, our hours of operation shown at the top; see you when we open!')
            return
        }

        dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: `/${restoUrl}/order` })
    }

    useEffect( ()=>{
        // when timezone set, we know the info to calculate if open accessible
        setCurrent( scheduleToday(timezone,0,businessHours,businessHolidays,isAlwaysOpen) )
    }, [timezone])

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
        {/* main menu, cart on right */}
        <div class="col-md-8 col-lg-9">
            <div class="row border-bottom border-top sticky-top">
                <nav id='nav-menu' class="nav bg-white">
                    {org.itemCategories && org.itemCategories.map( (item,idx)=><div onClick={(e)=>scrollToRef(e,'_'+item.replace(/[^\w]/g,''))} class="nav-link">{item}</div> )}
                </nav>
            </div>
            <div class="pb-5 row">
                {items.map( (item,idx)=><>
                    { item.catHeading ? 
                        idx===0 && item.isSpecial ? 
                            <><hr class='text-light' ref={el=>formEls.current['_'+org.itemCategories[0].replace(/[^\w]/g,'')]=el} />
                            <span class="mt-4 badge bg-secondary"><h3>{org.itemCategories[0]}</h3></span></> 
                        :
                            <><hr class='text-light' ref={el=>formEls.current['_'+item.category.replace(/[^\w]/g,'')]=el} />
                            <span class="mt-4 badge bg-secondary"><h3>{item.category}</h3></span></> 
                    : '' }
                    <div onClick={(e)=>showModalItem(e,item.itemId)} class="col-lg-6 p-3 item">
                        <button class='btn btn-outline-primary float-end'><i class="fas fa-shopping-cart"></i> ${item.price}</button>
                        <h5>{item.title}</h5>
                        { item.image && <img src={item.image} alt={item.info} class="item-thumbnail" /> }
                        <p>{item.info}</p>
                    </div>
                </> )}             
            </div>

            <MenuModalCartItem item={modalItem} hide={()=>setModalItem({})} />
        </div>
        <div class="col-md-4 col-lg-3 shopping-cart-height">
            {/* end of coumns, shopping cart now */}
            <div ref={el=>formEls.current.cart=el} class="shopping-cart card">
                <div class="card-header">
                    <h3>Your Order 
                        { cart.length>0  && <button onClick={clearCart} class="btn btn-sm btn-outline-light float-end shopping-cart-trash"><i class="fas fa-trash-alt text-danger"></i></button> }
                    </h3>
                    <a target="_blank" href={`https://www.google.com/maps?q=${encodeURIComponent(org.address)}`} rel="noreferrer">
                        <small class='text-muted'>Pickup at {org.address}</small>
                    </a>
                </div>
                { cart.length>0 ?
                    <>
                    <div class="card-body">
                        { cart.map( cartItem=><MenuCartItem items={items} cartItem={cartItem} editCartFunction={showModalItem} /> )}
                    </div>
                    <div class="card-footer text-muted px-3 text-center shopping-cart-main-footer">
                        <div class="mx-2"><i class="fas fa-shopping-cart fa-2x text-secondary"></i></div>
                    { alert && <i class="shake fas fa-shopping-cart fa-2x text-warning"></i> }
                        <button onClick={startOrder} class="btn btn-primary ">Checkout 
                            {formatMoney(cart.reduce( (total,cur)=>total+Number(cur.total),0 ))}</button>
                    </div>
                    </>
                :
                    <div class="card-body text-secondary">
                        <i class="fas fa-book-reader fa-4x text-warning float-start mx-3"></i> 
                        Yumm... Let's add a few things to the order!
                    </div>
                }
            </div>
        </div>
    </div>  

    { cart.length>0 &&
    <nav onClick={(e)=>scrollToRef(e,'cart')} class="navbar fixed-bottom navbar-dark bg-dark shopping-cart-footer">
        <div class="container-fluid">
            <small class="text-muted">{alert}</small>
            { alert ? <i class="shake fas fa-shopping-cart fa-2x text-warning"></i> : <i class="fas fa-shopping-cart fa-2x text-secondary"></i> }
            <button onClick={startOrder} class="btn btn-primary ">Checkout 
                ${cart.reduce( (total,cur)=>total+Number(cur.total),0 ).toFixed(2)}</button>
        </div>
    </nav> }
    <div>
        <small class="text-muted">Business time: {current.time} on {current.date}</small>
    </div>
    </>
    }
    </>
    )
}

export default Menu