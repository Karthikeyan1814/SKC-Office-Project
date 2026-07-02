import useCounter from "../hook/useCounter"
import "../styles/Home.css"
import { useState } from "react"
import { FaStar } from "react-icons/fa";
import ThemeCustomizer from "../hook/ThemeCustomizer";
export default function Home() {

    const exp = useCounter(10);
    const customer = useCounter(500);
    const percentage = useCounter(100);
    const hours = useCounter(24);
    const days = useCounter(7);

    const services = [
        "GST Registration",
        "APL-01 Appeal Filing",
        "Section 73 / 74 Defence",
        "ASMT-11 Drafting",
        "E-Way Bill Disputes",
        "Income Tax Filing",
        "GST Notice Reply",
    ];

    function handleWhatsApp() {

        const message = encodeURIComponent(
            "Hello, I need assistance   "
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
        <div className="home-container">
            <section id="hero">
                <section className="hero-container">
                    <div className="hero-left">
                        <h1>உங்கள் வணிகம்...</h1>
                        <h1>எங்கள் வரி நிபுணத்துவம்.</h1>
                        <h2>GST Advisory • Notice Reply • Appeal • Litigation Support</h2>
                        <p>From GST registrations to complex litigation matters, we assist businesses with practical tax solutions, statutory compliance, and professional representation before tax authorities.</p>
                        <h3>Reliable Advice. Timely Action. Lasting Trust.</h3>
                        <h4>"சரியான ஆலோசனை இன்று... பாதுகாப்பான வணிகம் நாளை."</h4>
                        <section className="hero-score">
                            <div className="score-box"><h1>{exp}+</h1> <p>Years of Professional Experience</p></div>
                            <div className="score-box"><h1>{customer}+</h1> <p>Businesses & Professionals Served</p></div>
                            <div className="score-box"><h1>{percentage}%</h1> <p>Legally Verified Documentation</p></div>
                            <div className="score-box"><h1>{hours}/ {days}</h1> <p>Professional Response</p></div>
                        </section>
                    </div>
                    <div className="hero-right">
                        <h1>Trusted GST, Income Tax & Business Advisory</h1>
                        <h2>Delivering Confidence Through Compliance.</h2>
                        <p>We provide comprehensive GST, Income Tax, Audit, and Business Advisory services tailored to businesses, professionals, and growing enterprises. Every opinion, representation, and submission is backed by statutory provisions, judicial precedents, and practical industry expertise.</p>
                        <h2>Integrity • Accuracy • Professional Excellence</h2>
                        <div className="circle"><h3>GST <br />EXPERT </h3></div>
                    </div>
                </section>
            </section>
            <section className="running-container">
                <div className="running-track">

                    {[...services, ...services].map((item, index) => (
                        <span key={index} className="running-item">
                            <FaStar color="goldenrod" size={24} />
                            {item}
                        </span>
                    ))}

                </div>
            </section>

            <section id="service">
                <div className="core-service-cont">
                    <h3 style={{ color: "var(--primary)" }}>-- Our Core Practice</h3>
                    <h1>GST Notice Reply & <span style={{ color: "goldenrod" }}>Appeal Filing</span></h1>
                    <p>Two areas where most consultants struggle. Two areas where this practice is built. <br />Every draft references the exact section, rule, circular, and judgment that supports the client position.</p>

                    <section className="core-cont">
                        <div className="core-box">
                            <h5 id="clear-head">MOST REQUIRED</h5>
                            <h1>GST Notice Reply</h1>
                            <h2>ஜிஎஸ்டி நோட்டீஸ் பதில்</h2>
                            <p>Professional reply drafting for every type of GST notice. Each reply built on bare act extracts, official circulars, and verified High Court or Supreme Court judgments. No copy-paste templates. No casual citations.</p>
                            <ul>
                                <li>Section 73 and Section 74 SCN reply</li>
                                <li>ASMT-10 / ASMT-11 drafting</li>
                                <li>DRC-01 / DRC-01A / DRC-06 response</li>
                                <li>GSTR-3B vs GSTR-2A or 2B mismatch reply</li>
                                <li>ITC denial and Rule 86A notice reply</li>
                                <li>Personal hearing representation</li>
                            </ul>
                            <button className="blue-btn" onClick={() => { handleWhatsApp() }}> Send Notice Copy </button>
                        </div>
                        <div className="core-box">
                            <h5 id="clear-head">CRITICAL SERVICE</h5>
                            <h1>GST Appeal Filing</h1>
                            <h2>ஜிஎஸ்டி மேல்முறையீடு</h2>
                            <p>Complete APL-01 appeal drafting and filing before the Appellate Authority. Pre-deposit calculation under Section 107(6), grounds of appeal in paragraph form, supported by actual judgment citations</p>

                            <ul>
                                <li>APL-01 appeal preparation and online filing</li>
                                <li>Facts of the Case and Grounds of Appeal drafting    </li>
                                <li>Pre-deposit verification under Section 107(6)</li>
                                <li>Time limit compliance under Rule 108</li>
                                <li>Stay application and rectification petition</li>
                                <li>Appellate Tribunal preparation support</li>
                            </ul>
                            <button className="blue-btn" onClick={() => { handleWhatsApp() }}> Discuss Appeal </button>
                        </div>
                    </section>

                </div>
            </section>
            <section id="full-service">
                <div className="full-service-cont">
                    <h3>-- Full Service List</h3>
                    <h1 style={{ marginBottom: "10px" }}>Everything a growing business needs <span style={{ color: "white", marginBottom: "10px" }}>under one roof.</span></h1>
                    <p>GST. Income Tax. Banking. Compliance. End to end professional services for traders, manufacturers, and exporters across  Tamil Nadu.</p>
                    <div className="all-box-container">
                        <div className="all-box"> <h4> - 01 -</h4>
                            <h1>GST Registration</h1>
                            <p>All categories. Regular, Composition, Casual Taxable Person, Non-Resident, ISD, TDS, TCS and Export registrations handled completely online.</p>
                        </div>
                        <div className="all-box"> <h4> - 02 -</h4>
                            <h1>GST Return Filing</h1>
                            <p>GSTR-1, GSTR-3B, GSTR-9 annual return, GSTR-9C reconciliation, CMP-08, ITC-04 and all periodic returns filed accurately and on time.</p>
                        </div>
                        <div className="all-box"> <h4> - 03 -</h4>
                            <h1>GST Notice Reply</h1>
                            <p>Professional drafting of replies to all SCNs, ASMT-10, DRC-01, DRC-01A, audit observations and assessment proceedings.</p>
                        </div>
                        <div className="all-box"> <h4> - 04 -</h4>
                            <h1>GST Appeal (APL-01)</h1>
                            <p>Complete first appellate authority filing. Grounds of appeal supported by verified case law from High Court and Supreme Court judgments.</p>
                        </div>
                        <div className="all-box"> <h4> - 05 -</h4>
                            <h1>E-Way Bill Issues</h1>
                            <p>Detention cases under Section 129 and 130, MOV-07 reply, penalty reduction representation, and movement compliance advisory for transporters.</p>
                        </div>
                        <div className="all-box"> <h4> - 06 -</h4>
                            <h1>Income Tax Filing</h1>
                            <p>ITR-1 to ITR-7 filing for salaried, business, and professional clients. Capital gains, presumptive scheme, and tax planning included.</p>
                        </div>
                        <div className="all-box"> <h4> - 07 -</h4>
                            <h1>Income Tax Refund</h1>
                            <p>Pending refund tracking, rectification under Section 154, response to intimation under Section 143(1) and assessment proceedings.</p>
                        </div>
                        <div className="all-box"> <h4> - 08 -</h4>
                            <h1>Banking & Loan Consultancy</h1>
                            <p>Project report preparation, CMA data, working capital and term loan documentation for textile traders and MSMEs.</p>
                        </div>
                        <div className="all-box"> <h4> - 09 -</h4>
                            <h1>GST Audit & Reconciliation</h1>
                            <p>Books to returns reconciliation, GSTR-9C audit, ITC reconciliation with GSTR-2B, e-invoice and e-way bill matching.</p>
                        </div>
                        <div className="all-box"> <h4> - 10 -</h4>
                            <h1>GST Training & Bookkeeping</h1>
                            <p>Practical GST training for staff and accountants. Monthly bookkeeping in Tally with GST compliance for ongoing businesses.</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="running-container">
                <div className="running-track">

                    {[...services, ...services].map((item, index) => (
                        <span key={index} className="running-item">
                            <FaStar color="goldenrod" size={24} />
                            {item}
                        </span>
                    ))}

                </div>
            </section>
            <section id="process">
                <div className="process-container">
                    <h3>-- How It Works</h3>
                    <h1>From notice to resolution,<span style={{ color: "goldenrod" }}>step by step..</span></h1>
                    <p>A clear path from the moment you receive a notice to a properly drafted reply or appeal filed within statutory time limits.</p>
                    <div className="process-cont">
                        <div className="process-box">
                            <h1>01</h1>
                            <h3>Send Notice</h3>
                            <p>
                                WhatsApp or email a scanned copy of the GST notice or order along with your GSTIN.
                            </p>
                        </div>
                        <div className="process-box">
                            <h1>02</h1>
                            <h3>Free Review</h3>
                            <p>
                                Initial assessment of the notice. Demand-wise analysis and identification of legal defence.
                            </p>
                        </div>
                        <div className="process-box">
                            <h1>03</h1>
                            <h3>Draft Reply</h3>
                            <p>
                                Professional draft with bare act extracts, verified case laws, and complete legal submissions.
                            </p>
                        </div>
                        <div className="process-box">
                            <h1>04</h1>
                            <h3>File & Follow Up</h3>
                            <p>
                                Online filing on GST portal. Personal hearing representation. Status tracking until closure.
                            </p>
                        </div>
                    </div>

                </div>
            </section>
            <hr />
            <section id="contact">
                <div className="contact-container">
                    <h3>Get In Touch</h3>
                    <h1>Have a notice? <span style={{ color: "goldenrod" }}> Let us look at it first.</span></h1>
                    <h2 style={{ color: "red", margin: "10px 0" }}>இலவச ஆரம்ப ஆலோசனை · WhatsApp அல்லது Email</h2>
                    <p>Send the notice or order copy on WhatsApp. You will receive a first response with a clear roadmap for your case. <br /> No commitment until you decide to proceed.</p>
                    <div className="contact-cont">
                        <div className="contact-left">
                            <h2>Contacts</h2>

                            <div className="contact-box"   onClick={() => { handleWhatsApp() }}>
                                <section>
                                    <img src="/whatsapp.svg" alt="" />
                                </section>
                                <section>
                                    <p>WhatsApp , Faster Response</p>
                                    <h1> +91 8807836326</h1>
                                </section>

                            </div>
                            <div className="contact-box" onClick={() => { sendEmail()}}>
                                <section>
                                    <img src="/gmail.svg" alt="" />
                                </section>
                                <section>
                                    <p>Email , Documents and Notices</p>
                                    <h1>xxx@gmail.com</h1>
                                </section>
                            </div>
                            <div className="contact-box"  onClick={() => window.location.href = "tel:+919876543210"}>
                                <section>
                                    <img src="/cell.svg" alt="" />
                                </section>
                                <section>
                                    <p>Phone , Direct Call for Meeting</p>
                                    <h1> +91 8807836326</h1>
                                </section>
                            </div>
                        </div>
                        <div className="contact-rigth">
                            <h3>Office</h3>

                            <h1>Vel Murugan</h1>
                            <p> Tax  | Audit | Advisory</p>

                            <br />
                            <section className="contact-office-box">
                                <img src="/main_logo.png" alt="" />
                                <h1>Sri Kathiravan & Co .,</h1>
                            </section>
                            <p>KKP Complex , Salem Main Road ,</p>
                            <p>Old Post Office ,</p>
                            <p>2nd Floor ,</p>
                            <p>Jalakandapuram - 636501 ,</p>
                            <p>Salem , TamilNadu .</p><br />
                            <h4><span style={{ color: "var(--primary)" }}>Phone : </span> +91 8807836326</h4>
                        </div>
                        <div className="map-container" >
                            <secton>
                                <h3>Map</h3>
                                <h1 style={{
                                    color: "var(--primary)", marginBottom: "10px"
                                }}>📍 Visit Our Office</h1>
                                <p>Meet us in person for expert GST and Income Tax consultation. <br /> We welcome individuals, startups, and businesses across Tamil Nadu.</p>
                            </secton>
                            <secton className="map">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d897.2611130232494!2d77.87911039863292!3d11.69690973910273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba95700560b08ed%3A0x65e7a9f920995e13!2sSri%20Kathiravan%20%26%20Co.%2C%20Auditor%20Office!5e0!3m2!1sen!2sin!4v1782907616882!5m2!1sen!2sin" width="600" height="450" style={{ border: "0" }} allowFullScreen="" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"></iframe>
                            </secton>
                        </div>
                    </div>
                </div>
            </section>
            <section id="bookcall"></section>
        </div>
    )
}