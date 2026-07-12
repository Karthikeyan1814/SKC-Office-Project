import { useEffect, useState } from "react"
import "../styles/Greeting.css"
export default function Greetings(){

    const [currentTime,setCurrentTime]=useState("");
    const [currentDateDay,setCurrentDateDay]=useState("");

    useEffect(()=>{
    
        const updateTime=()=>{
                const now= new Date();

            setCurrentTime(now.toLocaleTimeString("en-IN",{
                timeZone:"Asia/Kolkata",
                hour:"2-digit",
                minute:"2-digit",
                second:"2-digit",
                hour12:true
            }))
            setCurrentDateDay(now.toLocaleDateString("en-IN",{
                timeZone:"Asia/Kolkata",
                weekday:"long",
                day:"2-digit",
                month:"2-digit",
                year:"numeric"
            }))
        }
        updateTime();


        const timeIntravel= setInterval(updateTime,1000);

        return ()=>clearInterval(timeIntravel)
    },[])
    return(
        <div className="greeting-cont">
            <section className="greeting-left">
                <h1>Good Moring , Sir !!</h1>
                <p>Welcome Back to SKC Admin Portanl</p>
            </section>
            <section className="greeting-right">
                <h1>{currentTime}</h1>
                <p>{currentDateDay}</p>
            </section>  
        </div>
    )
}