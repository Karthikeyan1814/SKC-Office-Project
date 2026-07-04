import "../styles/Overview.css"
import useCounter from "../hook/useCounter"
import FilesLayout from "../layouts/FilesLayout"
import { filedetails } from "../data/filedetails"
export default function Overview(){
    const data={
        client:120,
        access:20,
        members:30,
        request_member:3
    }


    return(
        <div className="overview-cont">
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
           <FilesLayout fileCategorie={"Important Files"} filedetails={filedetails}/>
            
        </div>
    )
}