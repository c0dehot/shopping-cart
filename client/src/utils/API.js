/*
    note how we wrap our api fetch in this function that allows us to do some
    additional error / message handling for all API calls...
*/
export default async function fetchJSON( url, method='get', data={} ){
    method = method.toLowerCase()
    const fetchOptions = {
        method,
        headers: {
            'Content-Type': 'application/json',
            // looks for a session entry in localStorage, and if so pass it
            'Session': localStorage.session || ''
        }
    }
    // only attach the body for put/post
    if( method === 'post' || method === 'put' ) {
        const isFormData = (typeof data)==='string'
        if( isFormData ){
            // for 'new FormData' generation we must NOT set content-type, let system do it
            delete fetchOptions.headers['Content-Type']
            //* gather form data (esp. if attached media)
            //! NOTE: each entry to be attached must have a valid **name** attribute
            fetchOptions.body = new FormData( document.querySelector(data) )
        } else {
            fetchOptions.body = JSON.stringify( data )
        }
    }

    return fetch( url,fetchOptions ).then( res=>res.json() )
}