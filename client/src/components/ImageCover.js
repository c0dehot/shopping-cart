import React from "react"
import "./ImageCover.css"

function ImageCover( props ){
   return (
      <div class="image-center">
         <img src={props.image||'/assets/camera.1024x1024.jpg'} class="card-img-top" alt='Background' title={props.info||''} />
      </div>
   )
}

export default ImageCover