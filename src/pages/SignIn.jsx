import "../styles/SignIn.css"
export default function SignIn(){
    return(
        <div className="signin-container">
            
            <section className="signIn-layout">
                <div className="signin-left">
                     <img src="/main_logo.png" alt="" />
                <h1>Welcome To Sri Kathiravan & Co </h1>
                <h2 style={{color:"red"}}>Service Portal</h2>
                <p>Note : If You New to this Platform , Pls Go to Book Call in Nav Bar at Top </p>
                <p>The Dashboard is Only Open , When you have Authorize from Auditor </p>
                </div>
                <form className="signin-right">
                    <h1 className="grid1" style={{color:"goldenrod"}}>Sign In</h1>
                    <label htmlFor="username">Email or Mobile</label>
                    <input type="text" name="username" id="username" placeholder="Enter Email or Mobile "  />
                    <label htmlFor="password">Password</label>
                    <input type="text" name="password" id="password" placeholder="Password" />
                    <p className="grid1">Note : If This is your first time signin , Please Enter the Email or Phone , And the Password as Last Four Digit with BirthYear</p>
                    <p className="grid1">Eg : Phone :  +91 88565225454 , Birth Year :2000 and In Become 54542000 it is ur first  time password</p>
                  <span></span>  <button className="blue-btn">Sign In</button>
                </form>
            </section>

        </div>
    )
}