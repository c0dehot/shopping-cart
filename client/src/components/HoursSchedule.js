import React, { useEffect, useState } from "react"
import { useStoreContext } from "../utils/GlobalStore"
import { scheduleToday, timeAMPM } from "../utils/Locale"
//{ dayIdx, date, time }

let refreshInterval

function HoursSchedule( props ){
    const [{ org: { businessHours, businessHolidays, timezone, isAlwaysOpen} }]= useStoreContext()
    const [ timeToClose, setTimeToClose ]= useState(false)
    const [ closeTime, setCloseTime ]= useState(false)
    const [ openTime, setOpenTime ]= useState(false)
    const [ openToday, setOpenToday ]= useState(false)
    const [ upcomingWeek, setUpcomingWeek ]= useState([])
    const [ scheduleVisible, setScheduleVisible ]= useState(false)
    
    function calculateSchedule(){
        const { dayOfWeek, date, time, openNow }= scheduleToday(timezone,0,businessHours,businessHolidays,isAlwaysOpen)
        const dayHours = businessHours[dayOfWeek]
        const open = dayHours.open || ''
        const openNum = Number(open.replace(':',''))
        const close = dayHours.close || ''
        const closeNum = Number(close.replace(':',''))
        const _openToday = time<openNum && businessHolidays.map(d=>d.toUpperCase()).indexOf(date.toUpperCase())===-1
        setOpenToday( _openToday )
        setCloseTime( openNow && close )
        setOpenTime( open )
        setTimeToClose( isAlwaysOpen ? 10001 : openNow && time>=openNum && time<=closeNum && Number(closeNum-time-40) )
    
        // figure out upcoming we sek
        let _upcomingWeek = []
        for( let addDay=1; addDay<=7; addDay++ ){
            const { dayOfWeek, date, dateShort }= scheduleToday(timezone,addDay,businessHours,businessHolidays,isAlwaysOpen)
            const dayHours = businessHours[dayOfWeek]
            const open = dayHours.open || ''
            const close = dayHours.close || ''
            const openToday = open && businessHolidays.map(d=>d.toUpperCase()).indexOf(date.toUpperCase())===-1
            _upcomingWeek.push( {date, dateShort, isAlwaysOpen, openToday, open, close } )
        }
        setUpcomingWeek( _upcomingWeek )
    }

    // start running when timezone set, refresh every 5 minutes, clear if unmounted
    useEffect( function(){
        if( !timezone ) return
        if( refreshInterval ) clearInterval(refreshInterval)
        setInterval( calculateSchedule, 30000000 )
        calculateSchedule()
    }, [ timezone ])

    useEffect( function(){
        return function(){
            console.log( ' ... CLEARING refreshInterval' )
            if( refreshInterval ) clearInterval(refreshInterval)
        }
    }, [] )
    return (
        <div onMouseOver={()=>setScheduleVisible(true)} onMouseOut={()=>setScheduleVisible(false)} class="overlay">
            <div className={ timeToClose ? timeToClose>=60 ? "text-success" : "text-danger" : "text-secondary"}>
                {timeToClose && timeToClose>10000 && <><i class="fas fa-clock"></i> Always Open</>}
                {timeToClose && timeToClose<10000 && timeToClose>=60 && <><i class="fas fa-clock"></i> Open till {timeAMPM(closeTime)}</>}
                {timeToClose && timeToClose<60 && <><i class="fas fa-clock"></i> Closing At {timeAMPM(closeTime)}!</>}
                {!timeToClose && openToday && <><i class="fas fa-clock"></i> Opening {timeAMPM(openTime)}</>}
                {!timeToClose && !openToday && <><i class="fas fa-clock"></i> Sorry Closed</>}
            </div>
            <div className={scheduleVisible ? "card overlay-box" : " d-none"} >
                <table class="card-body table table-sm table-hover">
                    <thead>
                        <tr><th scope="col">Day</th><th scope="col">Open Time</th></tr>
                    </thead>
                    <tbody>
                        {upcomingWeek.map( day=><tr><td>{day.dateShort}</td><td>{day.isAlwaysOpen ? 'Always Open' : day.openToday ? `${timeAMPM(day.open)} - ${timeAMPM(day.close)}` : `CLOSED`}</td></tr> )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default HoursSchedule