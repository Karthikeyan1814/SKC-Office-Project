import api from "./axiosInstance";

export const postNewClientField =async(e)=>{
    try{
        const response = await api.post("/skc/Admin/ClientForm/Field",e);
        console.log(response.data);
        return response.data
    }catch(error){
        console.log(error)
    }
}