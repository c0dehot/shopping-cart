import React, { useRef, useEffect, useState } from 'react'
import { NavLink } from "react-router-dom"

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'
import { timezoneList, scheduleToday } from "../../utils/Locale"
import ItemCategories from '../../components/ItemCategories'
import MediaUpload from '../../components/MediaUpload'

function SettingsOrg(){
   const [ { isAdmin }, dispatch ]= useStoreContext()
   const [ orgData, setOrgData ]= useState({})
   const [ showItemCategories, setShowItemCategories ]= useState( false )
   const [ timezones ]= useState(timezoneList())
   const [ activeTimezone, setActiveTimezone ]= useState("")
   const [ currentTime, setCurrentTime ]= useState("")
   const [ qrCode, setQRCode ]= useState("")

   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})

   async function loadPage(){
      const { status, data, message }= await fetchJSON( '/api/orgs' )
      console.log( `[orgs] status(${status}) message(${message}) loadPage():`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }

      setOrgData( data )
      // triggers update in the time
      setActiveTimezone( data.timezone )
      // set the INPUT boxes
      if( data.businessHolidays )
         data.businessHolidays = data.businessHolidays.join(', ')
      Object.keys(data).forEach( item=>{ if( formEls.current[item] ) formEls.current[item].value = data[item] })
   }
  
   async function orgUpdate( e ){
      e.preventDefault()
      // hide categories if showing
      setShowItemCategories(false)

      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         // orgUrl.current.value = orgUrl.current.value.toLowerCase()
         refForm.current.classList.add('was-validated')
         console.log( `.. !x failed validation, returning.` )
         return
      }

      // add a placeholder for password so we can get that field if it's set
      const saveData = { ...orgData }
      // refresh with user INPUT fields
      Object.keys(formEls.current).forEach( item=>{ if( formEls.current[item] ) saveData[item] = formEls.current[item].value })
      if( formEls.current.businessHolidays ){
         saveData.businessHolidays = formEls.current.businessHolidays.value.replace(/[,\s]+/g,',').split(',')
         formEls.current.businessHolidays.value = saveData.businessHolidays.join(', ')
      }
      if( saveData.coords ) saveData.coords = saveData.coords.replace(/ /g,'')
      // don't modify these on this page
      delete saveData.financial

      console.log( ' .. org saveData: ', saveData )
      const { status, message }= await fetchJSON( `/api/orgs`, 'put', saveData )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }

      // update session data
      dispatch({ type: 'USER_SESSION_ADMIN', data: { org: saveData }, message });

      // reset validation/open items
      refForm.current.classList.remove('was-validated')
   }

   function generateQRCode( e ){
      e.preventDefault()
      // toggle showing (clear if visible)
      if( qrCode ){ setQRCode( "" ); return }

      const domain = encodeURIComponent(`https://restocart.ca/${formEls.current.url.value.trim()}`)
      const qrUrl = `https://chart.googleapis.com/chart?chs=500x500&cht=qr&choe=UTF-8&chl=${domain}`
      console.log( `qrUrl='${qrUrl}'`)
      setQRCode( qrUrl )
   }

   function updateCategories( itemCategories ){
      if( itemCategories ) setOrgData({ ...orgData, itemCategories })

      setShowItemCategories(false)
   }

   function handleDayChange( e ){
      const { name, value, dataset }= e.target
      const businessHours =[ ...orgData.businessHours ]
      businessHours[dataset.idx][name] = value
      setOrgData({ ...orgData, businessHours })
   }
   
   function mediaAttach( mediaPending, image, target, message='' ){
      console.log(  `mediaAttach] [${target}]:(${image}):` )
      // only adjust the image if it's a NEW url
      if( image && image!=='' ){ 
         setOrgData({ ...orgData, mediaPending, [target]: image.length>10?image:'' })
      }else
         setOrgData({ ...orgData, mediaPending })

      if( message )
         dispatch({ type: 'ALERT_MESSAGE', message })
   }

   useEffect( function(){
      if( timezoneList().indexOf(activeTimezone)===-1 ) return

      const { date, time }= scheduleToday( activeTimezone )
      setCurrentTime( `${date} ${time}` )
   }, [activeTimezone])
   
   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin ] )

   return (
      <form ref={refForm} id="mainForm" encType="multipart/form-data" method="post">
         <div class="card">
            <div class="card-header">
               <h4>Account Settings</h4>
            </div>
            <div class="card-body">
               <div class="card-subtitle pb-4">
                  <ul class="nav nav-pills card-header-tabs">
                     <li class="nav-item">
                        <NavLink to="/admin/settings/user" className="nav-link" activeClassName="active">Profile</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/org" className="nav-link" activeClassName="active">Organization</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/affiliate" className="nav-link" activeClassName="active">Affiliate Invites</NavLink>
                     </li>
                     <li class="nav-item">
                        <NavLink to="/admin/settings/financial" className="nav-link" activeClassName="active">Financial</NavLink>
                     </li>
                  </ul>
               </div>

               <div class="row">
                  <div class="col-12 col-lg-6">

                     <div class="mb-3">
                        <label for="name">Restaurant Name</label>
                        <input ref={el=>formEls.current.name=el} type="text" id="name" class="form-control" required />
                        <div class="invalid-feedback">
                              Please enter your restaurant name
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="info" class="form-label">Restaurant Blurb</label>
                        <textarea ref={el=>formEls.current.info=el} id="info" class="form-control" rows="2" placeholder="The best meals in town!" />
                        <div class="invalid-feedback">
                           Please give a longer blurb about the restaurant.
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="address" class="form-label">Restaurant Address</label>
                        <textarea ref={el=>formEls.current.address=el} id="address" class="form-control" rows="2" placeholder="22 Some Address, City, Region" required />
                        <div class="invalid-feedback">
                           Please give the address (it will appear at the top of the menu)
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="address" class="form-label">Address Geo-Coords</label>
                        <input ref={el=>formEls.current.coords=el} id="coords" type="text" class="form-control" pattern="[\d\.\,\-\+]{8,}"  placeholder="43.7300,-79.4022" />
                        <div class="invalid-feedback">
                           Please search on Google for the exact location, then right click and copy the latitude/longitude coordinate pair and paste here.
                        </div>
                     </div>                     
                     <div class="mb-3">
                        <label for="phone" class="form-label">Restaurant Phone Number</label>
                        <input ref={el=>formEls.current.phone=el} id="phone" type="tel" class="form-control" placeholder="(999)999-9999" required />
                        <div class="invalid-feedback">
                           Please give the phone number customers would call.
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="email">Public/Inquiries Email Address</label>
                        <input ref={el=>formEls.current.email=el} id="email" type="email" class="form-control" required />
                        <div class="invalid-feedback">
                              Please the company inquiry/support email address - orders will be sent here!
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="orderEmail"><b>ORDERS</b>/Private Email Address</label>
                        <input ref={el=>formEls.current.orderEmail=el} id="orderEmail" type="email" class="form-control" required />
                        <div class="invalid-feedback">
                              This email is IMPORTANT - orders will be sent here and displayed on https://restocart.ca/admin/orders.
                        </div>
                     </div>
                  </div>
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="info" class="form-label">Menu Background Banner</label>
                        <MediaUpload mediaDimensions='1920x540' displayHeight='30vh'
                        sampleUrl="" mediaUrl={orgData.imageMenuBanner} mediaTarget="imageMenuBanner"
                        mediaAttach={mediaAttach} />
                        <div class="invalid-feedback">
                           Please provide a darkish image about 1920x540 pixels in side.
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="info" class="form-label">Background Image</label>
                        <MediaUpload mediaDimensions='1920x1920' displayHeight='30vh'
                        sampleUrl="" mediaUrl={orgData.imageBg} mediaTarget="imageBg"
                        mediaAttach={mediaAttach} />
                        <div class="invalid-feedback">
                           Please provide a white background with a faint image - will be resized to 1920x1920.

                        </div>
                     </div>
                     
                     <div class="mb-3">
                        <label for="categories">Menu Categories</label>
                        { showItemCategories ?
                        <ItemCategories itemCategories={orgData.itemCategories} updateCategories={updateCategories} /> :
                        <>
                           <button onClick={()=>setShowItemCategories(true)} class='mx-3 btn btn-sm btn-outline-primary'>+Add/Adjust Categories</button> 
                           <h5>{orgData.itemCategories && orgData.itemCategories.join(', ')}</h5>
                           
                        </> }
                     </div>                     
                  </div>
               </div>

               <div class="mb-3 border-top mt-2">
                  <label for="url">Shopping Cart Link <button onClick={generateQRCode} class="m-2 btn btn-sm btn-light"><i class="fas fa-qrcode"></i> Get QR-Code</button></label>
                  <div class="input-group mb-3">
                     <span class="input-group-text">https://restocart.ca/</span>
                     <input ref={el=>formEls.current.url=el} id="url" type="text" class="form-control" pattern="[\w\-n]{6,}" placeholder="grillhouse" required />
                     <div class="invalid-feedback">
                        A unique restaurant name needed: min 6 alpha-numeric characters
                     </div>  
                  </div>
               </div>
               { qrCode && 
               <div class="mb-3 d-block">
                     <a href={qrCode} target="blank"><img src={qrCode} class="w-100" alt="qr code" /></a>
               </div> }
               <div class="row mb-3">
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="timezone">Business TimeZone</label>
                        <div class="input-group mb-3">
                           <input ref={el=>formEls.current.timezone=el} onChange={()=>setActiveTimezone(formEls.current.timezone.value)} id="timezone" list="timezones" type="text" class="form-control" pattern="[a-zA-Z/-]{10,}" placeholder="America/Toronto" required />
                           <span class="input-group-text"><i class="fas fa-clock mx-1"></i>{currentTime}</span>
                           <div class="invalid-feedback">
                              Please set your timezone.
                           </div>  
                        </div>
                        
                        <datalist id="timezones">
                           { timezones.map( timezone=><option value={timezone} /> )}
                        </datalist>
                     </div>                     
                     <div class="mb-3">
                        <label for="hoursofservice">Hours of Service</label>
                        <div class='alert alert-warning'>
                           <small class="form-check text-muted">
                              <input onClick={()=>setOrgData({...orgData,isAlwaysOpen:!orgData.isAlwaysOpen})} defaultChecked={orgData.isAlwaysOpen} id="isAlwaysOpen" class="form-check-input" type="checkbox" />
                              <label class="form-check-label" for="isAlwaysOpen">
                                 <b>Online 24/7 Business</b> - always open.
                              </label> 
                           </small>
                        </div>
                        { !orgData.isAlwaysOpen &&
                        <table class="mb-1 table table-sm table-hover">
                           <thead>
                              <tr>
                                 <th scope="col">Day</th>
                                 <th scope="col">Open Time</th>
                                 <th scope="col">Close Time</th>
                              </tr>
                           </thead>
                           <tbody>
                           { orgData.businessHours && orgData.businessHours.map( (day,idx)=>
                                 <tr key={`day${idx}`}>
                                    <th scope="row">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][idx]}</th>
                                    <td><input value={day.open} onChange={handleDayChange} name="open" data-idx={idx} type="time" class="form-control" /></td>
                                    <td><input value={day.close} onChange={handleDayChange} name="close" data-idx={idx} type="time" class="form-control" /></td>
                                 </tr> )}
                           </tbody>
                        </table>
                        }
                     </div>
                  </div>
                  { !orgData.isAlwaysOpen &&
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="businessHolidays">Days Closed</label>
                        <div class='alert alert-warning'>List the days below, separated by a comma, in this format: <b>31-Dec-2021, 1-Jan-2022</b>...</div>
                        <textarea ref={el=>formEls.current.businessHolidays=el} id="businessHolidays" class="form-control" rows="8" placeholder="31-Dec-2021, 1-Jan-2022" pattern="[\w-, ]{6,}" />
                        <div class="invalid-feedback">
                           Please give the address (it will appear at the top of the menu)
                        </div>
                     </div>
                  </div> }
               </div>
            </div>
            <div class="card-footer">
               <button onClick={orgUpdate} class="btn btn-primary mx-1" >Update Organization</button>
            </div>
         </div>
      </form>         
   )
}

export default SettingsOrg