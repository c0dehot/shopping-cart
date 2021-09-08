import React, { useState, useEffect } from 'react'
import { Redirect, NavLink, useLocation } from 'react-router-dom'
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

let dropMenuTimeout

function NavBar() {
   const [{ isSuper, isAdmin, redirectUrl, doingRedirect, name, thumbnail }, dispatch ]= useStoreContext()
   const [ showMenu, setShowMenu ]= useState( false )
   const { pathname } = useLocation()

   async function loadAdminSession(){
      console.log( `[loadUserSession] localStorage.session(${localStorage.session})` )
      // admin pages require a session
      if( !localStorage.session ){
         dispatch({ type: 'USER_LOGOUT', message: 'Valid login required' })
         // no session so let's stop here.
         return
      } else if( isAdmin ){
         // auth *already* ok, don't bother reloading session
         return
      }

      const { status, userData, message }= await fetchJSON( `/api/users/session` )
      console.log( `[NavBar] attempted to reload session, result(${status}) message(${message})` )
      // admin path requires isAdmin status
      if( !status ){
         // clear any session
         dispatch({ type: 'USER_LOGOUT', message })
         return
      }
      // console.log( `[NavBar] userData: `, userData )
      dispatch({ type: 'USER_SESSION_ADMIN', data: userData })
   }

   useEffect( function(){
      if( showMenu ){
         if( dropMenuTimeout )
            clearTimeout( dropMenuTimeout )
         
         dropMenuTimeout = setTimeout( function(){ setShowMenu( false ); }, 4000 )
      }
   }, [ showMenu ])

   // location changed so hide menu
   useEffect( function(){
      if( dropMenuTimeout )
         clearTimeout( dropMenuTimeout )
      setShowMenu( false )
      // page change, scroll to top.
      window.scrollTo({ top: 0, behavior: "smooth" })
   }, [ pathname ])

   useEffect( function(){
      // as soon as it's 'doingRedirect', we now <Redirect> running, so toggle this off
      if( doingRedirect ){
         dispatch({ type: 'UPDATE_REDIRECT_DONE' })
      }
   }, [ doingRedirect ])
   
   useEffect( function(){
      // only bother if admin path
      if( pathname.indexOf('/admin')>-1 ) loadAdminSession()
   }, [] )

   return (
   <> 
      { doingRedirect && <Redirect to={redirectUrl} /> }
      { pathname.indexOf('/admin')>-1 && 
         <nav id="nav-header" class="navbar navbar-expand-lg navbar-light bg-light mb-2">
            <NavLink to="/admin/orders/LIVE" className="navbar-brand">
            <i class="fas fa-shopping-cart fa-2x mx-3"></i>
            </NavLink>
            <button onClick={() => setShowMenu(!showMenu)} class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar">
               <span class="navbar-toggler-icon"></span>
            </button>

            <div className={'collapse navbar-collapse '+(showMenu ? 'show' : '')} id="navbar">
               <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                  { isSuper ?
                  <>
                  <li className="nav-item">
                     <NavLink to="/admin/superoverview" className="nav-link" activeClassName="active"><i class="fas fa-tachometer-alt"></i> Overview</NavLink>
                  </li>
                  </>
                  :
                  <>
                  <li className="nav-item">
                     <NavLink to="/admin/orders/LIVE" className="nav-link" activeClassName="active">
                        Orders
                     </NavLink>
                  </li>
                  <li className="nav-item">
                     <NavLink to="/admin/categories" className="nav-link" activeClassName="active">Categories</NavLink>
                  </li>
                  </>
                  }
                  <li className="nav-item">
                     <NavLink to="/admin/items" className="nav-link" activeClassName="active">Items</NavLink>
                  </li>
                  <li className="nav-item">
                     <NavLink to="/admin/settings/user" className="nav-link" activeClassName="active">Account Settings</NavLink>
                  </li>
                  {/* <li className="nav-item">
                     <NavLink to="/admin/specials" className="nav-link" activeClassName="active">
                        <i class="fas fa-business-time"></i> Specials
                     </NavLink>
                  </li> */}
                  <li className="nav-item">
                     <NavLink to="/logout" className="nav-link">Logout</NavLink>
                     </li> 
               </ul>
               { name && <div class="d-flex"><div class="mx-3">Welcome back <u>{name}</u> { thumbnail && <img src={thumbnail} id='nav-thumbnail' alt="user thumbnail" width="32" height="32" /> }</div></div> }
            </div>
         </nav>
      }
      { (['/','/terms','/privacy','/contact','/about','/login','/signup'].indexOf(pathname)>-1 || pathname.indexOf('/contact/')>-1) &&
         <section class="page-banner-section pt-15 pb-15 img-bg">
            <div class="container">
               <nav class="navbar navbar-expand-lg navbar-dark">
                  <div class="container-fluid">
                     <button class="navbar-toggler float-start" type="button" data-bs-toggle="collapse" data-bs-target="#navbarToggler" aria-controls="navbarTogglerDemo02" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                     </button>

                     <NavLink to="/" className="navbar-brand"><h1 class="text-light">Restocart</h1></NavLink>
                     <div class="collapse navbar-collapse" id="navbarToggler">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        </ul>
                        <ul class="d-flex navbar-nav">                           
                           <li class="nav-item">
                              <NavLink to="/contact" className="nav-link" activeClassName="active">Contact</NavLink>
                           </li>
                           <li class="nav-item">
                              <NavLink to="/login" className="nav-link" activeClassName="active">Login</NavLink>
                           </li>
                           <li class="nav-item">
                              <NavLink to="/signup" className="nav-link" activeClassName="active">Signup</NavLink>
                           </li>
                        </ul>
                     </div>
                  </div>
               </nav>
            </div>
         </section>
      }
   </>
   )
}

export default NavBar