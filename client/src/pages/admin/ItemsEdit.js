import React, { useRef, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Select from 'react-select'

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'

import MediaUpload from '../../components/MediaUpload'
import ItemCategories from '../../components/ItemCategories'
import ChoiceList from '../../components/ChoiceList'

function genKey( inc=0 ){
   return (Date.now()+inc).toString(36)
}

function ItemsEdit(){
   const [ { isAdmin, org }, dispatch ] = useStoreContext()
   const [ itemCategories, setItemCategories ]= useState([])
   const [ showItemCategories, setShowItemCategories ]= useState( false )
   const [ itemData, setItemData ]= useState( {} )
   const [ listDelivery, setListDelivery ]= useState( [] )
   let { id } = useParams()
   const refForm = useRef()
   // using object forms gathering the current elements, ex. ref={el=>formEls.current['name']=el}
   const formEls = useRef({})
   // const itemCategories = useRef([]) + ref={el=>itemCategories.current.push(el)}

   async function loadPage(){
      const { status, data, message }= await fetchJSON( `/api/items/${id}` )
      console.log( `[loadPage() /api/items/${id}] status(${status}) message(${message}) data:`, data )
      if( !status ){ dispatch({ type: 'USER_LOGOUT', message }); return }
      
      setItemData( data[0] )
      setListDelivery( org.deliveryOptions.filter( o=>data[0].listDelivery && data[0].listDelivery.indexOf(o.value)>-1 ) )
      // update the categories - except first one that is specials
      setItemCategories( org.itemCategories )

      // populate INPUT boxes for respective data inputs
      Object.keys(data[0]).forEach( item=>{ if( formEls.current[item] ) formEls.current[item].value = data[0][item] })
   }
  
   async function itemUpdate( e ){
      e.preventDefault()
      // leverage browser built in + bootstrap features for form validation
      if( !refForm.current.checkValidity() ){
         refForm.current.classList.add('was-validated')
         console.log( ` .. page validation failed, see red boxes.` )
         return
      }

      if( itemData.mediaPending ){
         dispatch({ type: 'ALERT_MESSAGE', message: 'Please [Upload] picture before saving.' })
         return
      }

      const saveData = { ...itemData }
      // refresh the user INPUTs
      Object.keys(formEls.current).forEach( item=>{ saveData[item] = formEls.current[item].value })

      const { status, message }= await fetchJSON( `/api/items/${id}`, itemData.itemId ? 'put' : 'post', saveData )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }

      // save and redirect to items list
      dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: '/admin/items', message })
   }

   async function itemDelete( e ){
      e.preventDefault()
      if( !itemData.itemId ) return
      if( !window.confirm('Are you sure you want to delete this?') ) return

      const { status, message }= await fetchJSON( `/api/items/${itemData.itemId}`, 'delete' )
      if( !status ){ dispatch({ type: 'ALERT_MESSAGE', message }); return }

      // save and redirect to items list
      dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: '/admin/items', message })
   }

   function newListOption( e ){
      e.preventDefault()
      setItemData({ ...itemData, listOptions: [ ...itemData.listOptions, { key: genKey(), text: '', price: '' }]})
   }
   function updateListOptions( headingOptions, listOptions ){
      setItemData({ ...itemData, headingOptions, listOptions: [ ...listOptions ] })
   } 
   
   function newListAddOns( e ){
      e.preventDefault()
      setItemData({ ...itemData, listAddOns: [ ...itemData.listAddOns, { key: genKey(), heading: '', type: 'radio', list: [{ key: genKey(2), text: '', price: '' }] }]})
   }

   function updateListAddOns( heading, list, type, setIdx  ){ // idx, heading, list
      let listAddOns = [ ...itemData.listAddOns ]

      if( !list.length && !listAddOns.length ){
         // list empty, only add-on so remove
         listAddOns = []
      } else if( list.length<1 ){
         // remove this addOn entry
         listAddOns.splice(setIdx,1)
      } else {
         listAddOns[setIdx].heading = heading
         listAddOns[setIdx].list = list
         listAddOns[setIdx].type = type
      }
      setItemData({ ...itemData, listAddOns })
   }
   
   function mediaAttach( mediaPending, image, idx, message='' ){
      console.log(  `mediaAttach] idx(${idx}) image(${image}):` )
      // only adjust the image if it's a NEW url
      if( image!=='' ) 
         setItemData({ ...itemData, mediaPending, image })
      else
         setItemData({ ...itemData, mediaPending })

      if( message )
         dispatch({ type: 'ALERT_MESSAGE', message })
   }
   
   function changeSelect( selectedOptions ){
      setListDelivery( selectedOptions )
      // only keep the item keys for actual itemData
      setItemData({ ...itemData, listDelivery: selectedOptions.map(o=>o.value) })
   }

   function checkboxToggle( e ){
      const { checked, id }= e.target
      setItemData({ ...itemData, [id]: checked })
   }

   function updateCategories( _itemCategories ){
      if( _itemCategories ) setItemCategories( _itemCategories )
      setShowItemCategories(false)
   }
  
   // on initial page load, we transition false->true for isAdmin: user-store is populated at that point.
   useEffect( ()=>{
      if( isAdmin ) loadPage()
   }, [ isAdmin] )

   return (
      <form ref={refForm} id="mainForm" encType="multipart/form-data" method="post">
         <div class="card">
            <div class="card-header">
               <h4><Link to="/admin/items">Item</Link>: {itemData.title || 'New'}</h4>
            </div>
            <div class="card-body">
               <div class="row">
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="heading" class="form-label">Item Name</label>
                        <input ref={el=>formEls.current.title=el} type="text" class="form-control" required />
                        <div class="invalid-feedback">
                           Please give a name to your item
                        </div>
                     </div>
                     <div class="mb-3">
                        <label for="info" class="form-label">Item Description</label>
                        <textarea ref={el=>formEls.current.info=el} class="form-control" required />
                        <div class="invalid-feedback">
                           Please give a brief complete description to it
                        </div>
                     </div>
                  </div>
                  <div class="col-12 col-lg-6">
                     <div class="mb-3">
                        <label for="info" class="form-label">Primary Image</label>
                        <MediaUpload mediaDimensions='1024x1024' displayHeight='30vh'
                        sampleUrl="" mediaUrl={itemData.image} mediaIdx={0}
                        mediaAttach={mediaAttach} />
                        <div class="invalid-feedback">
                           Please provide a clear image about 1024x1024 pixels in side.
                        </div>
                     </div>
                  </div>
               </div>                  
               <div class="mb-3">
                  <div class="row">
                     <div class="col-7">
                        <label for="info" class="form-label">Category</label>
                        <select ref={el=>formEls.current.category=el} defaultValue={itemData.category} class="form-control" required>
                           { itemCategories && itemCategories.map( (cat,idx)=><option key={cat} disabled={idx===0} value={cat}>{cat}</option> ) }
                        </select> 
                        { !showItemCategories && 
                           <div class='row'>
                              <div class="col-12 col-md-6">
                                 <div class="form-check">
                                    <input onClick={checkboxToggle} defaultChecked={itemData.isSpecial} id="isSpecial" class="form-check-input" type="checkbox" />
                                    <label class="form-check-label" for="isSpecial">Promote in {itemCategories[0]}</label>
                                 </div>
                              </div>
                              <div class='col-12 col-md-6'>
                                 <button onClick={()=>setShowItemCategories(true)} class='btn btn-sm btn-light float-end'>+Add/Adjust Categories</button> 
                              </div>
                           </div>}
                        <div class="invalid-feedback">
                           Please choose the category for the item
                        </div>
                     </div>
                     <div class="col-5">
                        <label for="cost" class="form-label">Price</label>
                        <div class="input-group">
                        <span class="input-group-text">$</span>
                           <input ref={el=>formEls.current.price=el} type="number" min="0" step="any" class="form-control" placeholder="Free" />
                        </div>
                        <div class="invalid-feedback">
                           Please give the base cost for this item
                        </div>
                     </div>
                  </div>
               </div>
               { showItemCategories && <ItemCategories itemCategories={itemCategories} updateCategories={updateCategories} /> }
               { !itemData.listOptions || itemData.listOptions.length===0 ?
               <>
               <div class="mb-4">
                  <button onClick={newListOption} class='btn btn-sm btn-primary float-end'>Multiple Base Option</button>
                  <h4>Base Options</h4>
                  <div class='alert alert-warning'>
                     The above image/cost are shown as the default configuration. However, if you want to allow
                     a user to choose between multiple base options (ie they are mutually exclusive), please add them below:
                  </div>
               </div>
               </>
               :
               <>
                  <div class="mb-3"><h4>Base Options</h4></div>
                  <ChoiceList heading={itemData.headingOptions} list={itemData.listOptions} update={updateListOptions} />
               </>}

               <div class="mb-4">
                  <button onClick={newListAddOns} class='btn btn-sm btn-primary float-end'>New Add-On Set</button>
                  <h4>Add-Ons</h4>
                  { !itemData.listAddOns || itemData.listAddOns.length===0 ?
                  <div class='alert alert-warning'>
                     <b>Add-Ons</b> are supplementary to the base product, a value-added that can be 
                        upsold or a configuration note.
                  </div>
                  :
                     itemData.listAddOns.map( (choiceSet,idx)=>
                     <ChoiceList setIdx={idx} heading={choiceSet.heading} list={choiceSet.list} type={choiceSet.type} update={updateListAddOns} />
                     )
                  }
               </div> 

               <div class="mb-3 d-none">
                  <h4>Availability/Delivery</h4>
                  <div class="form-check">
                     <input onClick={checkboxToggle} defaultChecked={itemData.isSeasonal} id="isSeasonal" class="form-check-input" type="checkbox" />
                     <label class="form-check-label" for="isSeasonal">
                        Seasonal Availability
                     </label>
                  </div>
                  <div class="form-check">
                     <input onClick={checkboxToggle} defaultChecked={itemData.isTimeOfDay} id="isTimeOfDay" class="form-check-input" type="checkbox" />
                     <label class="form-check-label" for="isTimeOfDay">
                        Time-of-Day Availability
                     </label>
                  </div>
                  <div class="form-check">
                     <input onClick={checkboxToggle} defaultChecked={itemData.isLimited} id="isLimited" class="form-check-input" type="checkbox" />
                     <label class="form-check-label" for="isLimited">
                        Limited Quantity
                     </label>
                  </div>
               </div>
               <div class="mb-3">
                  <label for="info" class="form-label">Pickup/Delivery Options</label>
                  <Select onChange={changeSelect} value={listDelivery} isMulti options={org.deliveryOptions} />
               </div>
            </div>

            <div class="card-footer">
               { itemData.itemId && <button onClick={itemDelete} class="btn btn-outline-danger float-end">Delete</button> }
               <button onClick={itemUpdate} class="btn btn-primary mx-1" >Save Item</button>
            </div>
         </div>
      </form>
   )
}

export default ItemsEdit