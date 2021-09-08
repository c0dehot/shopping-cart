import React, { useEffect,useState,useRef } from 'react'
import { useParams } from 'react-router-dom'
import { DateTime } from 'luxon'

import { useStoreContext } from '../../utils/GlobalStore'
import fetchJSON from '../../utils/API'
import { formatMoney } from "../../utils/Locale"

import MenuCartItem from '../../components/MenuCartItem'
import RatingBar from '../../components/RatingBar'
// const expiresAt = DateTime.local().setZone('America/Toronto').plus( { days: 180 }).toISODate()

let refreshInterval

function Orders() {
   const [{ isAdmin, items, org, userId }, dispatch ]= useStoreContext()
   const [ orders, setOrders ]= useState([])
   const [ showComments, setShowComments ]= useState('')
   const { orderStatus } = useParams()
   const formEls = useRef({})

   async function loadOrders( ){
      // we've left the page, clear interval
      // if( window.location.pathname.indexOf('/admin/orders')===-1 ){
      //    console.log( `~ left /admin/orders page (${window.location.pathname}), turning off refresh`)
      //    if( refreshInterval ) clearInterval(refreshInterval)
      //    return
      // }

      console.log( `[loadOrders] items: orderStatus(${orderStatus}) ` )
      const { status, data, message }= await fetchJSON( `/api/orders/${orderStatus.replace('LIVE','')}` )
      if( !status ){
         dispatch({ type: 'USER_LOGOUT', message })
         return
      }

      // update tasks list
      setOrders( data )
      if( message ) dispatch({ type: 'ALERT_MESSAGE', message })
   }

   async function orderReply( e,idx,orderId ){
      e.preventDefault()

      const note = formEls.current[`_${idx}`].value.trim()
      if( note.length<3 ) return
      formEls.current[`_${idx}`].value = ''
      const { status, data: order, message }= await fetchJSON( `/api/orders/add-note/${orderId}`, 'put', { note } )

      // update the order info (and likewise that refreshes the changes to notes)
      let _orders = [...orders ]
      _orders[idx].notes = order.notes
      setOrders( _orders )
      dispatch({ type: 'ALERT_MESSAGE', message: 'Response sent' })
  }

   async function updateStatusInfo( e,idx,orderId ){
      e.preventDefault()

      const statusInfo = formEls.current[`_${idx}`].value.trim()
      if( statusInfo.length<3 ) return
      formEls.current[`_${idx}`].value = ''

      const { status, message }= await fetchJSON( `/api/orders/${orderId}`, 'put', { statusInfo } )
      let _orders = [...orders ]
      _orders[idx].statusInfo = statusInfo
      setOrders( _orders )
      dispatch({ type: 'ALERT_MESSAGE', message: 'Updated status' })
   }

   async function updateStatus( e,idx,orderId,orderStatus ){
      e.preventDefault()
      if( !window.confirm(`Are you ready to change status to ${orderStatus}`) ) return

      if( orderStatus==='CANCELLED' ){
         if( window.confirm('Should we consider ABANDONED instead of cancelled?') )
         orderStatus = 'ABANDONED'
      }
      const { status, message }= await fetchJSON( `/api/orders/${orderId}`, 'put', { status: orderStatus } )
      let _orders = [...orders ]
      _orders[idx].status = orderStatus
      setOrders( _orders )
      dispatch({ type: 'ALERT_MESSAGE', message: 'Updated status' })
   }

   function toggleComments( orderCode ){
      if( showComments!==orderCode )
         setShowComments(orderCode)
      else
         setShowComments('')
   }

   function filterOrders( e ){
      e.preventDefault()
      dispatch({ type: 'UPDATE_REDIRECT_GO', redirectUrl: `/admin/orders/${e.target.value}` })
   }
   
   // on initial page load, we transition false->true for isAdmin: user-store is populated at that point.
   useEffect( ()=>{
      if( isAdmin ){
         loadOrders()
         // 15s refresher
         if( refreshInterval ) clearInterval(refreshInterval)
         refreshInterval = setInterval( loadOrders, 15000 )
      }
   }, [ isAdmin, orderStatus ] )

   // Component UNMOUNT
   useEffect( ()=>{
      return ()=>{ if( refreshInterval ) clearInterval(refreshInterval) }
   }, [])
   return (
      <form>
         <div class="card">
            <div class="card-header">
               <h4>{org.name}'s</h4>
               <select onChange={filterOrders} defaultValue={orderStatus} class="form-select">
                  <option value="LIVE">Active Orders</option>
                  <option value="CANCELLED">Cancelled Orders</option>
                  <option value="ABANDONED">Abandoned Orders</option>
                  <option value="COMPLETED">Complete Orders</option>
               </select>
            </div>
            <div class="card-body row">
               {orders.length<1 ?
               <div class="alert alert-warning ml-5 mr-5">
                  <h2>No orders currently!</h2>
                  <i>This page will update every minute with changes in orders.</i>
               </div>
               :   
               orders && orders.map( (order,idx)=>
                  <>
                  <div key={order.orderCode} class="col-12 col-md-6 col-lg-4 mb-3">
                     <div class="card h-100">
                        <div class="card-body">
                           <h5>{order.orderCode}<small class="text-muted float-end"> <i class="far fa-clock"></i>
                           {/* use 'orderAt' field for active orders, use the 'updatedAt' for everything else */}
                           { ['PREPARING','READY','DELIVERING'].indexOf(order.status)>-1 ? DateTime.fromISO(order.orderAt).toRelative()
                              : DateTime.fromISO(order.updatedAt).toRelative()}</small></h5> {/* DateTime.now().diff(DateTime.fromISO()).seconds */}
                           { ['PREPARING','READY','DELIVERING'].indexOf(order.status)>-1 && <div class='text-warning'>
                              { order.statusInfo && <small class='text-primary'><i class="fas fa-info"></i> {order.statusInfo} / </small> }
                              Pick Up Order</div> }
                           { order.cart.length>0 &&
                                 order.cart.map( cartItem=><MenuCartItem items={items} cartItem={cartItem} adminView={true} /> )
                              }
                           <div class="row">
                              <div class="col item-layout mb-1">&nbsp;
                              <small class='text-muted mx-5'>Total:</small><div class="item-total"><span class="badge rounded-pill bg-warning text-dark mx-3">{order.total ? formatMoney(order.total):'-'}</span></div>
                              </div>
                           </div>
                           { order.contactInfo &&
                              <div class="mt-3 mb-3 border bg-light">
                                 <span class="badge rounded-pill bg-warning text-dark"><i class="fas fa-receipt"></i> Payment Required: {order.contactInfo.name}</span>
                                 <small>
                                    <ul><li>Phone: <a href={`tel:${order.contactInfo.phone}`}>{order.contactInfo.phone}</a></li>
                                       <li>Email: <a href={`tel:${order.contactInfo.email}`}>{order.contactInfo.email}</a></li>
                                    </ul>
                                 </small>
                              </div> }
                           { order.rating>0 && <RatingBar rating={order.rating} /> }
                           { ['PREPARING','READY','DELIVERING'].indexOf(order.status)>-1 && <>
                              { order.notes && order.notes.map( (note,idx)=>
                              <div onClick={()=>toggleComments(order.orderCode)} className={ showComments===order.orderCode || idx>=order.notes.length-2 ? '' : 'd-none' }>
                                 { note.userId===userId ? 
                                 <div class="text-secondary"><i class="fas fa-reply" title={DateTime.fromSeconds(note.timestamp-1).toRelative()}></i> {note.note}</div> :
                                 <div class="text-success"><i class="fas fa-comments" title={DateTime.fromSeconds(note.timestamp-1).toRelative()}></i> {note.note}</div> 
                              }</div>
                              )}

                              <div class="input-group">
                                 <button onClick={(e)=>orderReply(e,idx,order.orderId)} class="btn btn-outline-success"><i class="fas fa-reply"></i></button>
                                 <input ref={el=>formEls.current[`_${idx}`]=el} type="text" class="form-control" placeholder="Reply / Status Update" />
                                 <button onClick={(e)=>updateStatusInfo(e,idx,order.orderId)} class="btn btn-primary"><i class="fas fa-exclamation"></i></button>
                              </div>
                           </>}
                        </div>
                        <div class="card-footer">                           
                           { ['PREPARING','READY'].indexOf(order.status)>-1 && <button onClick={(e)=>updateStatus(e,idx,order.orderId,'CANCELLED')} class='btn btn-sm btn-outline-secondary'><i class="far fa-trash-alt"></i></button> }
                           { order.status==='PREPARING' && <button onClick={(e)=>updateStatus(e,idx,order.orderId,'READY')} class='btn btn-primary float-end'><i class="fas fa-tasks"></i> Ready</button> }
                           { order.status==='READY' && <button onClick={(e)=>updateStatus(e,idx,order.orderId,'COMPLETED')} class='btn btn-success float-end'><i class="fas fa-check"></i> Picked-Up</button> }
                           { order.status==='COMPLETED' && <div class='btn btn-outline-secondary float-end'>Completed</div> }
                           { order.status==='CANCELLED' && <div class='btn btn-outline-danger float-end'><i class="fas fa-times"></i> Cancelled</div> }
                           { order.status==='ABANDONED' && <div class='btn btn-outline-danger float-end'><i class="far fa-trash-alt"></i> Abandoned</div> }
                           
                        </div>
                     </div>
                  </div>
                  </>)}
            </div>
         </div>
      </form>
   )
}

export default Orders