import { useEffect, useState } from "react";
import ClientForm from "./ClientForm";
import AddClientField from "./AddClientFiled";
import "../../styles/SettingsStyles/ClientSetting.css"
import DeactivateClientField from "./DeactivateClientField";

export default function CustomizableClientForm(){
  const[isAddField,setAddField]=useState(false);
  const[isDeactivate,setDeActivate]=useState(false);

  const handleOpenAddField=(e)=>{
   setAddField(pre=> !pre)
  }
  const handleOpenDeactiavte=(e)=>{
   setDeActivate(pre=> !pre)
  }
   return (
   <div className="Client-main-layoout">
      {isAddField && <div  className="parent-overlay">
         <AddClientField  handleOpenAddField={handleOpenAddField} />
         </div>}
         {isDeactivate && <div className="parent-overlay"><DeactivateClientField  handleOpenDeactiavte={handleOpenDeactiavte}/></div>}
    <ClientForm editClient={true} isDisabled={true} handleOpenAddField={handleOpenAddField} handleOpenDeactiavte={handleOpenDeactiavte}/>
   </div>
);
}