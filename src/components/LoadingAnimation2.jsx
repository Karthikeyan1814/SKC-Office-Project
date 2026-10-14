import "../styles/Animations/Loading.css"
export default function LoadingAnimation2(){
    return(
      <div className="page-cont">
          <div className="spinner-cont">
            <div className="dot"></div>
            <div className="dot"></div>
            {/* <div className="dot"></div>
            <div className="dot"></div> */}
            {/* <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div> */}
        </div>
        <p className="blink">Fetching Data , Please Wait!</p>
      </div>
   
    )
}