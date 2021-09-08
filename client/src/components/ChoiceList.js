import React from "react"

function genKey( inc=0 ){
   return (Date.now()+inc).toString(36)
}

//<ChoiceList choiceList={itemData.baseChoices} />
function ChoiceList( props ){
   let { setIdx, heading, type, list, update }= props
   function choiceAdd( e ){
      e.preventDefault()
      list.push({ key: genKey(), text: "", price: "" })
      update( heading, list, type, setIdx )
   }
   function choiceDelete( e ){
      e.preventDefault()
      if( !window.confirm( 'Are you sure?') ) return
      const idx = Number(e.target.dataset.idx)
      list.splice(idx,1) //filter( (_,idx)=>idx!=delIdx )
      update( heading, list, type, setIdx )
   }
   function choiceChange( e ){
      e.preventDefault()
      const { name, value, dataset }= e.target
      const idx = dataset.idx
      list[idx][name] = value
      update( heading, list, type, setIdx )
   }
   function headingChange( e ){
      e.preventDefault()
      heading = e.target.value
      update( heading, list, type, setIdx )
   }
   function toggleOptionType( e ){
      e.preventDefault()
      if( !type ) return
      type = type==='checkbox' ? 'radio' : 'checkbox'
      update( heading, list, type, setIdx )
   }
   return (
   <>
   <div class="input-group border-top mb-1">
      <input value={heading} onChange={headingChange} type="text" class="form-control bg-light" placeholder="Heading for these choices" required />
      <span onClick={toggleOptionType} class="input-group-text">{list.length} {type==='checkbox' ? 'Checkboxes':'Options'}:</span>
      <button onClick={choiceAdd} class='btn btn-sm btn-primary'>Add</button>
   </div>
   <div class="invalid-feedback">
      You need to describe the name for all the options
   </div>  
   <div class="mb-2">
      <ol class="list-group">
         { list.map( (choice,idx)=> 
         <li key={choice.key} class="list-group-item">
            <div class="row">
               <div class="col-8">
                  <span class="input-group">
                     <span class="input-group-text"><b>{type==='checkbox' ? <i class="far fa-square"></i> : <i class="far fa-circle"></i>}</b></span>
                     <input value={choice.text} onChange={choiceChange} data-idx={idx} name="text" type="text" class="form-control" placeholder="Option description" required />
                  </span>
               </div>
               <div class="col-3">
                  <span class="input-group">
                     <span class="input-group-text">$</span>
                     <input value={choice.price} onChange={choiceChange} data-idx={idx} name="price" type="number" min="0" step="any" class="form-control" placeholder="Free" />
                  </span>
               </div>
               <div class="col-1"><button onClick={choiceDelete} data-idx={idx} class="btn btn-outline-secondary float-end" tabIndex="-1" title='Delete'>x</button></div>
            </div>
            <div class="invalid-feedback">
               You need to write a description and price for this (price=0 for free)
            </div>  
         </li> ) }
      </ol>
   </div>
   </>)
}

export default ChoiceList