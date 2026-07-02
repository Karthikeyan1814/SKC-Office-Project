import "../styles/Footer.css"
export default function Footer() {
      function handleWhatsApp() {

        const message = encodeURIComponent(
            "Hello, I need assistance with my GST Notice."
        );

        window.open(
            `https://wa.me/918807836326?text=${message}`,
            "_blank"
        );

    }
      const sendEmail = () => {

        const subject = encodeURIComponent("GST Notice Assistance");

        const body = encodeURIComponent(`Hello,

I need help .

Please contact me.

Thank you.`);

        window.location.href =
            `mailto:info@skctaxconsultants.com?subject=${subject}&body=${body}`;

    };
    return (
        <div className="footer-container">
          <section className="footer-row-container">
              <div className="footer1">

                <section className="footer-row2">
                    <img src="/main_logo.png" alt="" />
                    <h1>Sri Kathiravan & Co .,</h1>
                </section>
                <p>GST Litigation Adviser practising from Tirupur, Tamil Nadu. Professional GST notice reply, appeal filing, registrations, returns and income tax services for traders, manufacturers and exporters.</p>
            </div>
            <div className="footer2">
                <h1>Services</h1>
                <ul>
                    <a href="#service"><li>GST Notice Reply</li></a>
                   <a href="#service"> <li>GST Appeal Filing</li></a>
                    <a href="#full-service"><li>GST Registration</li></a>
                    <a href="#full-service"><li>GST Returns</li></a>
                    <a href="#full-service"><li>E-Way Bill Issues</li></a>
                    <a href="#full-service"><li>Income Tax Filing</li></a>
                </ul>
            </div>
            <div className="footer3">
                <h1>Contacts</h1>
                <a href="tel:+918807836326"><p>Phone :  +91 8807836326 </p></a>
                <p style={{cursor:"pointer"}} onClick={()=>{sendEmail()}}>Gmail : xxx@gmail.com</p>
                <p style={{cursor:"pointer"}} onClick={()=>{handleWhatsApp()}}>WhatsApp</p>
                <br />
                <h2>Address</h2>
                 <p>KKP Complex , Salem Main Road ,</p>
                            <p>Old Post Office ,</p>
                            <p>2nd Floor ,</p>
                            <p>Jalakandapuram - 636501 ,</p>
                            <p>Salem , TamilNadu .</p><br />
            </div>
          </section>
            <br />
            <hr  style={{borderColor:"gray"}}/>
            <br /><br />

            <section className="footer-row">
                <p>&copy; All CopyRights Reserved at 2026</p>
                <p>Web Designed and Developed By : Karthikeyan1472005@gmail.com</p>
            </section>

        </div>
    )
}