import React from 'react'
import { useStoreContext } from "../../utils/GlobalStore"
import './style.css'

function DisplayTweaks( props ) {
  const [{ isAdmin, org }]= useStoreContext()

  return ( 
    <>
    { isAdmin ?
    // <div className={`container ${css` &:before { background-image: url('/assets/background-01.jpg'); }`}`}>
    <div class="container">
      { org && org.imageBg && 
        <div id="body-bg" style={{ backgroundImage: `url(${org.imageBg})` }}></div> }
      {props.children}
    </div>
    :
    // <div className={`container-md ${css`&:before { background-image: url('/assets/background-01.jpg'); }`}`}> {/* for menu */}
    <div class="container-md">
      { org && org.imageBg && 
        <div id="body-bg" style={{ backgroundImage: `url(${org.imageBg})` }}></div> }
        
      {props.children}
    </div>
    }
    </>
  )
}

export default DisplayTweaks