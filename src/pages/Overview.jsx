import "../styles/Overview.css"
import useCounter from "../hook/useCounter"
import FilesLayout from "../layouts/FilesLayout"
import { filedetails } from "../data/filedetails"
import Greetings from "../components/Greetings"
export default function Overview(){
    const data={
        client:120,
        access:20,
        members:30,
        request_member:3
    }


    return(
        <div className="overview-cont">
            <Greetings />
            <h3 className="current-report">Current Status</h3>
            <div className="admin-count">

                <div className="overbox">
               <h2> Active Clients </h2>
                <h1>{useCounter(data.client)}</h1>
            </div>
            <div className="overbox">
                <h2>Active Members</h2> 
                <h1>{useCounter(data.members)}</h1>
            </div>
            <div className="overbox">
                <h2>Requested Access</h2>
                <h1> {useCounter(data.access)}</h1>
            </div>
            <div className="overbox">
                <h2>Requested Members</h2>
                <h1> {useCounter(data.request_member)}</h1>
            </div>
            </div>
            <div className="over-cat-container">
                
                <h3 >Categories</h3>
               <section>
                <div className="over-cat-box">
                    <img src="/gst.svg" alt="" />
                    <h3>Gst Documents </h3>
                </div>
                <div className="over-cat-box">
                    <img src="/roc.svg" alt="" />
                    <h3>Roc Documents</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/tax.svg" alt="" />
                    <h3>Tax Documents</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/finance.svg" alt="" />
                    <h3>Financial Statements</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/payroll.svg" alt="" />
                    <h3>Pay Rolls</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/certificate.svg" alt="" />
                    <h3>Certificates</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/complaint.svg" alt="" />
                    <h3>Compliance Notice</h3>
                </div>
                <div className="over-cat-box">
                    <img src="/important.svg" alt="" />
                    <h3>Important File</h3>
                </div>
               </section>
            </div>
           <FilesLayout fileCategorie={"Important Files"} filedetails={filedetails}/>
            
        </div>
    )
}