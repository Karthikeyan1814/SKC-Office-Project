import "../styles/FileLayout.css"
import { FaFileAlt } from "react-icons/fa";
export default function File({ filename, filedate, link }) {
    const openFile = (url) => {
        window.open(url, "_blank");
    };

    const downloadFile = (url, name) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <div className="files">
            <section className="files-box">
                <FaFileAlt color="black" size={22}></FaFileAlt>
            </section>
            <section className="files-box" >
                <h2 className="files-name"> {filename}</h2>
            </section>
            <section className="files-box">
                <p>{filedate}</p>
            </section>
            <section className="files-buttons">
                <button className="open-btn" onClick={() => openFile(link)}>
                    Open
                </button>

                <button className="download-btn" onClick={() => downloadFile(link, filename)}>
                    Download
                </button>
            </section>
        </div>
    )
}