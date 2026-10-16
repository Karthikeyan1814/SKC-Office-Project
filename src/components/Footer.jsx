import "../styles/Footer.css";
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineArrowUp,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

export default function Footer() {
  function handleWhatsApp() {
    const message = encodeURIComponent("Hello Sri Kathiravan & Co., I need assistance with my GST Notice / Tax filing.");
    window.open(`https://wa.me/918807836326?text=${message}`, "_blank");
  }

  const sendEmail = () => {
    const subject = encodeURIComponent("GST Notice & Legal Advisory Assistance");
    const body = encodeURIComponent(
      `Hello Sri Kathiravan & Co.,\n\nI would like to inquire about tax advisory services.\n\nPlease contact me.\n\nThank you.`
    );
    window.location.href = `mailto:info@skctaxconsultants.com?subject=${subject}&body=${body}`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenBooking = () => {
    window.dispatchEvent(new CustomEvent("open-public-booking"));
  };

  return (
    <footer className="footer-lux-container">
      {/* Top Advisory Banner */}
      <div className="footer-top-strip">
        <div className="footer-top-content">
          <div className="footer-badge-item">
            <HiOutlineShieldCheck size={20} className="gold-icon" />
            <span>Statutory Compliance &amp; Litigation Support Across Tamil Nadu</span>
          </div>
          <button onClick={handleOpenBooking} className="footer-cta-pill">
            <HiOutlineCalendarDays size={16} /> Book Consultation Slot
          </button>
        </div>
      </div>

      <div className="footer-main-grid">
        {/* Column 1: Firm Overview */}
        <div className="footer-col-firm">
          <div className="footer-brand-header">
            <img src="/main_logo.png" alt="Sri Kathiravan & Co" className="footer-logo-img" />
            <div>
              <h2>Sri Kathiravan &amp; Co.</h2>
              <span className="footer-brand-sub">Chartered Tax Advisory &amp; Litigation Desk</span>
            </div>
          </div>
          <p className="footer-firm-desc">
            Premier GST &amp; Income Tax litigation advisory practice. Delivering bare-act rooted notice replies, APL-01 appeal drafting, audit defense, and comprehensive business compliance for growing enterprises, traders, and exporters.
          </p>
          <div className="footer-tag-pills">
            <span>Section 73/74 Defense</span>
            <span>APL-01 Appeals</span>
            <span>ASMT-11 Drafting</span>
          </div>
        </div>

        {/* Column 2: Key Practice Areas */}
        <div className="footer-col-nav">
          <h3>Practice Services</h3>
          <ul className="footer-nav-list">
            <li><a href="/#service">GST Notice Reply (SCN / ASMT)</a></li>
            <li><a href="/#service">GST Appeal Filing (APL-01)</a></li>
            <li><a href="/#full-service">GST Registration &amp; Amendments</a></li>
            <li><a href="/#full-service">Periodic &amp; Annual Return Filing</a></li>
            <li><a href="/#full-service">E-Way Bill Detention (Sec 129/130)</a></li>
            <li><a href="/#full-service">Income Tax Return &amp; Assessment</a></li>
          </ul>
        </div>

        {/* Column 3: Direct Helplines */}
        <div className="footer-col-contact">
          <h3>Direct Contacts</h3>
          <ul className="footer-contact-list">
            <li>
              <a href="tel:+918807836326" className="footer-contact-link">
                <HiOutlinePhone className="footer-c-icon" />
                <div>
                  <span className="footer-c-label">Helpline Desk</span>
                  <strong>+91 8807836326</strong>
                </div>
              </a>
            </li>
            <li>
              <div onClick={handleWhatsApp} className="footer-contact-link clickable">
                <span className="footer-wa-dot"></span>
                <div>
                  <span className="footer-c-label">WhatsApp Fast Response</span>
                  <strong>+91 8807836326</strong>
                </div>
              </div>
            </li>
            <li>
              <div onClick={sendEmail} className="footer-contact-link clickable">
                <HiOutlineEnvelope className="footer-c-icon" />
                <div>
                  <span className="footer-c-label">Official Correspondence</span>
                  <strong>info@skctaxconsultants.com</strong>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Column 4: Physical Office & Consultation */}
        <div className="footer-col-office">
          <h3>Office Location</h3>
          <div className="footer-office-card">
            <HiOutlineMapPin className="footer-c-icon map-icon" />
            <div>
              <strong>Vel Murugan</strong>
              <p>Tax | Audit | Advisory</p>
              <address>
                KKP Complex, Salem Main Road,<br />
                Old Post Office, 2nd Floor,<br />
                Jalakandapuram - 636501,<br />
                Salem, Tamil Nadu.
              </address>
            </div>
          </div>
          <button onClick={handleOpenBooking} className="footer-book-btn">
            <HiOutlineCalendarDays size={16} /> Schedule Office Visit / Call
          </button>
        </div>
      </div>

      <hr className="footer-divider" />

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Sri Kathiravan &amp; Co. All Rights Reserved. Legally compliant tax consultation.
        </p>

        <div className="footer-bottom-right">
          <span className="footer-designer-credit">
            Web Architecture &amp; Development by <strong>Karthikeyan1472005@gmail.com</strong>
          </span>
          <button onClick={scrollToTop} className="footer-scroll-top" title="Scroll to top">
            <HiOutlineArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}