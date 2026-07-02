import { TiTick } from "react-icons/ti";
import "../styles/MemberShip.css"
export default function Membership() {
    return (
        <div className="member-container">
            <section className="member-hero">
                <section className="flex-left">
                    <img src="/main_logo.png" alt="" />
                    <h1>Sri Kathiravan & Co Annual Membership</h1>
                </section><br />
                <h2>Expert Tax Guidance – Anytime You Need It</h2><br />
                <h3>Get 365 days of priority support for just ₹500/year.</h3><br />
                <p>Whether you receive a GST notice, have an Income Tax query, need help with return filing, or simply <br /> want expert clarification before making an important decision, our membership gives you direct access to professional guidance throughout the year.</p><br />
                <h2>One Membership. Unlimited Confidence.</h2> <br />
            </section>
        <br />
        <hr />
        <br />
            <section className="membership-container">

                <h2 >What's Included?</h2>

                <div className="membership-list">

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> 24/7 Consultation Support</h3>
                        <p>
                            Get expert guidance whenever you need assistance with GST
                            or Income Tax matters.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Unlimited Doubt Clarification</h3>
                        <p>
                            No matter how small or complex your question is, our
                            experts are here to help throughout your membership period.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> GST Notice Guidance</h3>
                        <p>
                            Receive professional advice on GST notices, replies,
                            appeals, and compliance requirements before taking any
                            action.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Income Tax Assistance</h3>
                        <p>
                            Get support for income tax filing, notices, deductions,
                            refunds, and tax planning.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Priority Member Response</h3>
                        <p>
                            Members receive priority support with faster response
                            times for consultations and queries.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Compliance Reminders</h3>
                        <p>
                            Stay updated with important GST and Income Tax filing
                            deadlines to avoid unnecessary penalties.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> One-to-One Professional Guidance</h3>
                        <p>
                            Discuss your business or personal tax concerns directly
                            with experienced consultants.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Trusted Legal-Based Advice</h3>
                        <p>
                            Every consultation is backed by the GST Act, Income Tax
                            Act, notifications, circulars, and relevant judicial
                            decisions.
                        </p>
                    </div>

                    <div className="membership-item">
                        <h3><TiTick className="tick" /> Affordable Annual Plan</h3>
                        <p>
                            Enjoy an entire year of professional tax consultation for
                            just <strong>₹500</strong>.
                        </p>
                    </div>

                </div>

                <div className="membership-details">

                    <h2>Membership Details</h2>

                    <p><strong>Membership Fee:</strong> ₹500</p> <br />
                    <p><strong>Validity:</strong> 1 Year (365 Days)</p> <br />
                    <p><strong>Support Availability:</strong> 24 × 7</p> <br />

                    <h3 style={{color:"goldenrod"}}>Mode of Consultation</h3>

                    <ul>
                        <li>WhatsApp</li>
                        <li>Phone Call</li>
                        <li>Email</li>
                        <li>Online Assistance</li>
                    </ul>

                </div>

                <div className="who-join">

                    <h2>Who Should Join?</h2>

                    <ul>
                        <li><TiTick className="tick" /> Business Owners</li>
                        <li><TiTick className="tick" /> GST Registered Dealers</li>
                        <li><TiTick className="tick" /> Freelancers</li>
                        <li><TiTick className="tick" /> Startups</li>
                        <li><TiTick className="tick" /> Shop Owners</li>
                        <li><TiTick className="tick" /> Professionals</li>
                        <li><TiTick className="tick" /> Salaried Individuals</li>
                        <li><TiTick className="tick" /> Anyone seeking reliable GST & Income Tax guidance throughout the year.</li>
                    </ul>

                </div>

                <div className="membership-footer">

                    <h2>Invest ₹500 Today. Save Thousands Tomorrow.</h2>

                    <p>
                        Tax mistakes can lead to unnecessary notices, penalties,
                        and financial loss. With the <strong>SKC Annual Membership</strong>,
                        professional guidance is always just a phone call or message
                        away. Stay compliant, make informed decisions, and enjoy
                        peace of mind throughout the year with unlimited expert support.
                    </p>

                </div>

            </section><br /><br /><hr /><br /><br />
           <section className="filldetails">
            <h1>Activate Membership</h1>
             <h2 style={{color:"var(--primary)", margin:"10px 0"}}>One Membership. Unlimited Confidence.</h2>
           <section className="place-center">
             <form action="" className="member-form">
                <h1 style={{gridColumn:"span 2",color:"white"}}>Activation Form</h1>
                <label htmlFor="name">Enter Your Full Name </label>
                <input id="name" type="text" />
                <label htmlFor="email"> Email Address</label>
                <input type="email" id="email" />
                <label htmlFor="number">Phone Number</label>
                <input type="number" id="number"/><span></span>
                <button className="blue-btn"> Request Activation  </button>
            </form>
           </section>
            </section> 
        </div>
    )
}