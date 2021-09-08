import React, { useEffect, useState } from "react"
import { useStoreContext } from '../utils/GlobalStore'
import fetchJSON from '../utils/API'

function ItemCategories( props ){
   const [ itemCategories, setItemCategories ]= useState([])
   // const { itemCategories, setItemCategories, setShowItemCategories }= props

   const [ { org }, dispatch ] = useStoreContext()

   function handleCatChange( e ){
      const idx = e.target.dataset.idx
      let _categories = [...itemCategories]
      _categories[idx] = e.target.value
      setItemCategories(_categories)
   }

   function handleCatDelete( e ){
      e.preventDefault()
      if( !window.confirm( 'Delete category?') ) return
      const idx = e.target.dataset.idx
      let _categories = [...itemCategories]
      _categories.splice(idx,1)
      setItemCategories(_categories)
   }

   function handleCatAdd( e ){
      e.preventDefault()
      let _categories = [...itemCategories]
      _categories.push([])
      setItemCategories(_categories)
   }

   function catCancel( e ){
      setItemCategories(org.itemCategories)
      if( props.updateCategories ) props.updateCategories()
   }
   
   async function catUpdate( e ){
      e.preventDefault()

      const { status, message }= await fetchJSON( '/api/orgs', 'put', { itemCategories } )
      // console.log( `[orgs] status(${status}) message(${message}) SignupDetails loadPage():`, data )
      dispatch({ type: 'USER_SESSION_ADMIN', data: { org:{ itemCategories }}, message })
      // update the parent
      if( props.updateCategories ) props.updateCategories( itemCategories )
   }

   useEffect( function(){
      // update categories whenever they change - ex. esp when delay in data being set, this will sync when it changes
      setItemCategories(props.itemCategories)
   }, [props.itemCategories] )

   return (
      <>
      <div class="card-header">
         <h4>Edit Categories</h4>
      </div>
      <div class="mb-1">
         <ul class="list-group list-group-flush">
            { itemCategories && itemCategories.map( (cat,idx)=>(
               <li key={`cat${idx}`} class="list-group-item">
                  <div class="input-group">
                     <input value={cat} onChange={handleCatChange} name={idx} data-idx={idx} type="text" class="form-control" />
                     <button onClick={handleCatDelete} class="btn btn-outline-danger" data-idx={idx} disabled={idx===0} tabIndex="-1" title='Delete'>x</button>
                  </div>
               </li>)
            )}
            <li class="list-group-item"><button onClick={handleCatAdd} class="btn btn-sm btn-outline-primary pl-3" title='Add Another'>+ Another</button></li>
         </ul>
      </div>
      <div class="card-footer mb-3">
         <button onClick={catCancel} class='btn btn-sm btn-light float-end'>Cancel</button>
         <button onClick={catUpdate} class='btn btn-sm btn-primary'>Update</button>
      </div>
      </>
   )
}

export default ItemCategories