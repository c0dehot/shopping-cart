import React from 'react'
import { Link } from 'react-router-dom'
// import { useStoreContext } from "../../utils/GlobalStore"
import SampleSiteImage from "./assets/sample-site.jpg"

import './style.css'


function Index(){
   return (
      <>
         <section class="feature-section pb-5">
            <div class="container">
               <div class="row">
                  <div class="col-md-6 mt-5">
                     <h3>Welcome to RestoCart!</h3>

                     <p class="mt-2">Our purpose is to empower restaurants to adapt their business activity to the ever changing global 
                        climate impacting the industry.</p>

                     <p>We know times are tough so we want to do our part to help small businesses like yours. Whether you have an online 
                        ordering solution you're not happy with or you have been hesitant about getting your business online, we 
                        encourage you to use RestoCart, it's absolutely FREE. You and your customers can order with peace of mind 
                        without all the fees involved with third-party apps.</p>

                     <p>Qualified business include but are not limited to: Restaurants, Bars, Cafes, Bakeries, Catering Companies, 
                        Hotels, Ice Cream Shops, Small Grocers and Convenience Stores. (Must have a registered business and a 
                        physical location)</p> 

                     <p><strong>Mobile App Coming Soon!</strong></p>

                     <Link to="/signup" className="btn btn-lg btn-primary mt-5">Claim Your FREE Online Ordering Platform</Link>
                     <br /><hr /><br />
                     <object width="425" height="344"><param name="movie" value="https://www.youtube.com/v/giUM8EznDPY&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><embed src="https://www.youtube.com/v/giUM8EznDPY&hl=en&fs=1" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="344"></embed></object>
                  </div>
                  <div class="col-md-6 mt-5">
                     <h3>Responsive Cart</h3>
                     <div class="shadow-lg p-3 mb-5 bg-white rounded">
                        <img src={SampleSiteImage} class="img-fluid" alt="Sample site" />
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </>
      
   )
}

export default Index