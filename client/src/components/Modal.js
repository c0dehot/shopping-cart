import React from "react";

function Modal( props ){
    function backgroundHide(event){
        // ignore bubble-down clicks, only background clicks act on
        if( event.target.classList.value!=='modal fade show' ) return
        props.cancel()
    }
    function hideModal(event){
        if( event ) event.preventDefault()
        props.cancel()
    }
    function completeModal(event){
        if( event ) event.preventDefault()
        props.confirm()
    }

    return (
        <form id="mainForm" method="POST">
        <div onClick={backgroundHide} className={`modal fade ${props.show?'show':''}`} role="dialog" style={{display: props.show?"block":"none"}}>
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">{props.title}</h5>
                        <button onClick={hideModal} type="button" class="close"><span>&times;</span></button>
                    </div>
                    <div class="modal-body">
                        {props.children}
                    </div>
                    <div class="modal-footer">
                        <button onClick={hideModal} type="button" class="btn btn-secondary">Cancel</button>
                        <button onClick={completeModal} type="button" class="btn btn-primary">{props.accept}</button>
                    </div>
                </div>
            </div>
        </div>
        <div className={`modal-backdrop fade ${props.show?'show':''}`} style={{display: props.show?"block":"none"}}></div>
        </form>
    )
}

export default Modal