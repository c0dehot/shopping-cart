import React from 'react'

function RatingBar( props ){
   function clickStar( e ){
      /* we can only do the rating once: once it's set, it is not changable */
      if( Number(props.rating)<1 && typeof(props.updateRating)==='function' )
         props.updateRating( e.target.dataset.stars )
   }
   const fa_magnify = props.magnify ? `fa-${props.magnify}x` : ''
   const html = ['*','*','*','*','*'].map( (_,idx)=>`<i data-stars=${idx+1} class="${props.rating>idx ? `fas ${fa_magnify} fa-star text-warning` : `far ${fa_magnify} fa-star text-secondary`}"></i>` )
   return (
      <div onClick={clickStar} dangerouslySetInnerHTML={{ __html: html.join('') }}></div>
   )
}

export default RatingBar