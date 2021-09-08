import React, {useState, useRef, useEffect} from "react"
import fetchJSON from "../utils/API"
import imageTools from "../utils/ImageTools"
import "./MediaUpload.css"

const invPixel = imageTools.invPixel

export default function MediaUpload( props ){
    const [ orientation, setOrientation ]= useState(0)
    const [ uploadPrepare, setUploadPrepare ]= useState(false)
    const [ mediaUrl, setMediaUrl ]= useState('')
    const mediaFile = useRef()

    // only when the user image has settled do we set it
    useEffect( function(){
        setMediaUrl(props.mediaUrl)
    }, [props.mediaUrl] )

    async function showImagePreview( e ){
        e.preventDefault()
        const [ data, angle, mirror ] = await imageTools.loadImagePreview( e )

        setMediaUrl( data )
        setUploadPrepare(true)
        // setOrientation( angle )
        // indicate an attachment is pending upload
        props.mediaAttach(true,'',props.mediaTarget)
    }

    async function mediaDelete( e ){
        e.preventDefault()

        // clear the input-file if attached - and clear prepare flag
        mediaFile.current.value = null
        setUploadPrepare(false)

        // if it's just a preview of upload, we just revert back
        if( mediaUrl.substr(0,5)==='data:' ){
            setMediaUrl( props.mediaUrl )
            return
        }

        console.log( `[mediaDelete] proper URL mediaUrl(${mediaUrl})`)
        const _mediaUrl = mediaUrl.substr(mediaUrl.lastIndexOf('/')+1,24) 
        const { status, message }= await fetchJSON( `/api/media/${_mediaUrl}`,'delete' )
        console.log( `[MediaUpload] delete comlete status(${status}) message(${message})`)
        if( status ){
            console.log( ` .. media deleted!: ${message}, clearing mediaUrl!`)
            // clear the data
            setMediaUrl(null )
            console.log( `[MediaUpload.js] calling props.mediaAttach(false,'','${props.mediaTarget}','${message}') - expecting user to update with media removed!`)    
            props.mediaAttach(false,'CLEAR',props.mediaTarget,'Important: Please SAVE the organization to update deleted media!')
        }
    }

    async function uploadMedia( e ){
        e.preventDefault()

        const prevId = props.mediaUrl ? props.mediaUrl.substr(props.mediaUrl.lastIndexOf('/')+1,24) : ''

        // console.log( `mediaUrl(${props.mediaUrl}) -> prevId(${prevId})`)
        // note mediaUrl is overwriting the global scope mediaUrl
        const { status, mediaUrl: _mediaUrl, message }= await fetchJSON( `/api/media/${props.mediaDimensions},${orientation}/${prevId}`,'post','#mainForm' )
        if( status ){
            console.log( ` .. upload valid message: ${message}`)
            // clear the data
            mediaFile.current.value = null
            setMediaUrl( _mediaUrl )
            setUploadPrepare(false)
            console.log( `[MediaUpload.js] calling props.mediaAttach(false,'${_mediaUrl}','${props.mediaTarget}','${message}')`)    
            props.mediaAttach(false,_mediaUrl,props.mediaTarget,message)
        }
    }    
    return (
        <>
        <div class="media-attachment" style={{height: props.sampleUrl || mediaUrl ? props.displayHeight : '33px'}}>
            <span class="media-upload btn btn-outline-primary"><i class="fas fa-cloud-upload-alt"></i>&nbsp; Attach Media</span>
            { mediaUrl && 
                <><span onClick={mediaDelete} class="media-delete btn btn-outline-danger">x</span> 
                <div style={{backgroundImage: `url(${mediaUrl})`,transform: `rotate(${orientation}deg)`}}></div></>
            }
            { props.sampleUrl && !mediaUrl && <img src={props.sampleUrl} width="100%" class="img-thumbnail" alt="" /> }
            <input onChange={showImagePreview} type="file" ref={mediaFile} id="mediaFile" name='mediaFile' accept="image/*" class='form-control' />
            <img onClick={()=>setOrientation(orientation-90)} className={"image-rotate-left "+(uploadPrepare?'':'d-none')} src="assets/rotate90.svg" alt="" />
            <img onClick={()=>setOrientation(orientation+90)} className={"image-rotate-right "+(uploadPrepare?'':'d-none')} src="assets/rotate90.svg" alt="" />
            { uploadPrepare && <button onClick={uploadMedia} class="btn btn-primary">Upload</button> }
        </div>
        </>
    )
} //disabled={disableBtn}