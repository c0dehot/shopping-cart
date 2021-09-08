import React, { useState } from "react"
import { useStoreContext } from "../utils/GlobalStore"
//{ dayIdx, date, time }

function BusinessAddress( props ){
    const [{ org: { coords, address } }]= useStoreContext()
    const [ addressVisible, setAddressVisible ]= useState(false)

    return (
        <div onMouseOver={()=>setAddressVisible(true)} onMouseOut={()=>setAddressVisible(false)} className={ addressVisible ? "text-wrap mark" : "overlay d-block text-truncate"}>
            <i class="fas fa-map-marker-alt"></i>&nbsp;
            <a target="_blank" href={ coords ? `https://www.google.com/maps/search/?api=1&query=${coords}` 
                                                : `https://www.google.com/maps?q=${encodeURIComponent(address)}`} rel="noreferrer">{address}</a>
        </div>
    )
}

export default BusinessAddress