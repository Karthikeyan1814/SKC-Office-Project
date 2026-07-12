import { FaSearch } from "react-icons/fa"
import File from "./File"
import "../styles/FileLayout.css"
export default function FilesLayout({fileCategorie,filedetails}){


    const handleSeatch=(e)=>{
        const value=e.target.value;

    }
    return(
        <div className="files-lay-container">
            <section className="files-lay-head">
                <h2>{fileCategorie}</h2>
            </section>
            <hr />
            <section className="files-lay-search-cont">
                   <input type="text"  name="search" onChange={handleSeatch} placeholder="Search by User"/>
                <input type="text"  name="search" onChange={handleSeatch} placeholder="Search by FileName"/>
                <button> <FaSearch size={22} color="white"></FaSearch> </button>
            </section>
            <section className="files-area">
               {filedetails.map((data,index)=>( <File key={index} filedate={data.filedate} filename={data.filename} link={data.link}></File>))}
            </section>
        </div>
    )
}