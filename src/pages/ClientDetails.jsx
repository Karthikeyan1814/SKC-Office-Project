import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import "../styles/Detailspage.css"
import ClientForm from "./Settings/ClientForm";
export default function ClientDetails(){
    const[currentSec,setCurrentSec]=useState('form');
    const[EditClient,setEditClient]=useState(false)
    const navigate=useNavigate();

    useEffect(()=>{
        console.log(currentSec)
    },[currentSec])
  
    return(
        <div className="clientdetails-container">
           <section className="client-name-box">
             <h1 style={{color:"var(--primary)",fontFamily:"var(--font3)"}}>Client Details</h1>
             <section onClick={()=>navigate("/Admin/EditClientForm")} className="client-name-box  blue-btn">
                <img src="/settings.svg" alt="" />
                <h4>Info Settings</h4>
             </section>
           </section>
           
           {/* //*   ----------------------------     */}

            <div className="client-main-cont">
                <section className="selection-area">
                   
                    <button className={currentSec=== 'details'?"normal-sec active-sec":"normal-sec"} onClick={()=>{setCurrentSec("details")}}>
                        Existing Client
                    </button>
                     <button className={currentSec=== 'form'?"normal-sec active-sec":"normal-sec"} onClick={()=>{setCurrentSec("form")}}>
                        New Client
                    </button>
                </section>

                {/* //! section for form */}
                <div className="client-main-box">
               
                    <ClientForm editClient={EditClient}/>

                </div>
                
            </div>

            <div></div>
        </div>
    )
}