import React from 'react'
import { useLocation } from 'react-router-dom'
import SampleSiteImage from "./assets/sample-site.jpg"
import './style.css'

function LargePageInfoBar( props ) {
  const { pathname } = useLocation()

  return ( 
    <>
      { ['/contact','/about','/login','/signup'].indexOf(pathname)>-1 ?
        <div class="row">
          <div class="col-xl-6">
            {props.children}
          </div>
          <div class="col-xl-6 d-none-xl">
            <div class="shadow-lg p-3 mb-5 bg-white rounded mt-5">
              <p>Restocart brings you an incredible, easy way to launch your menu, allowing customers to order across a range 
                  of devices.</p>
              <img src={SampleSiteImage} class="img-fluid" alt="Sample site" />
            </div>
          </div>
        </div>
        : 
        props.children }
    </>
  )
}

export default LargePageInfoBar