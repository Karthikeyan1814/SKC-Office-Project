import { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import "../../styles/HomePageMasterSettings.css";
import {
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineBookmark,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineDocumentText,
} from "react-icons/hi2";

export default function HomePageMasterSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero-left"); // hero-left | hero-right | services | contact

  const [form, setForm] = useState({
    // Hero Left
    heroLeftTitle1: "உங்கள் வணிகம்...",
    heroLeftTitle2: "எங்கள் வரி நிபுணத்துவம்.",
    heroLeftSubtitle: "GST Advisory • Notice Reply • Appeal • Litigation Support",
    heroLeftDescription: "From GST registrations to complex litigation matters, we assist businesses with practical tax solutions, statutory compliance, and professional representation before tax authorities.",
    heroLeftTagline: "Reliable Advice. Timely Action. Lasting Trust.",
    heroLeftQuote: "\"சரியான ஆலோசனை இன்று... பாதுகாப்பான வணிகம் நாளை.\"",
    heroExpYears: "10",
    heroExpLabel: "Years of Professional Experience",
    heroClientsCount: "500",
    heroClientsLabel: "Businesses & Professionals Served",
    heroVerificationPct: "100",
    heroVerificationLabel: "Legally Verified Documentation",
    heroSupportHours: "24",
    heroSupportDays: "7",
    heroSupportLabel: "Professional Response",

    // Hero Right
    heroRightTitle: "Trusted GST, Income Tax & Business Advisory",
    heroRightSubtitle: "Delivering Confidence Through Compliance.",
    heroRightDescription: "We provide comprehensive GST, Income Tax, Audit, and Business Advisory services tailored to businesses, professionals, and growing enterprises. Every opinion, representation, and submission is backed by statutory provisions, judicial precedents, and practical industry expertise.",
    heroRightTagline: "Integrity • Accuracy • Professional Excellence",
    heroCircleBadgeText: "GST EXPERT",

    // Services
    runningServices: "GST Registration, APL-01 Appeal Filing, Section 73 / 74 Defence, ASMT-11 Drafting, E-Way Bill Disputes, Income Tax Filing, GST Notice Reply",
    coreNoticeHead: "MOST REQUIRED",
    coreNoticeTitle: "GST Notice Reply",
    coreNoticeTamil: "ஜிஎஸ்டி நோட்டீஸ் பதில்",
    coreNoticeDesc: "Professional reply drafting for every type of GST notice. Each reply built on bare act extracts, official circulars, and verified High Court or Supreme Court judgments. No copy-paste templates. No casual citations.",
    coreAppealHead: "CRITICAL SERVICE",
    coreAppealTitle: "GST Appeal Filing",
    coreAppealTamil: "ஜிஎஸ்டி மேல்முறையீடு",
    coreAppealDesc: "Complete APL-01 appeal drafting and filing before the Appellate Authority. Pre-deposit calculation under Section 107(6), grounds of appeal in paragraph form, supported by actual judgment citations",

    // Contact
    contactPhone: "+91 8807836326",
    contactEmail: "info@skctaxconsultants.com",
    contactWhatsApp: "+91 8807836326",
    officeAdvisorName: "Vel Murugan",
    officeAdvisorTitle: "Tax | Audit | Advisory",
    officeAddressLine1: "KKP Complex , Salem Main Road ,",
    officeAddressLine2: "Old Post Office , 2nd Floor ,",
    officeAddressCity: "Jalakandapuram - 636501 , Salem , TamilNadu .",
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Admin/HomePageContent");
      if (res.data) {
        setForm((prev) => ({ ...prev, ...res.data }));
      }
    } catch {
      toast.error("Failed to load home page content settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/Admin/HomePageContent", form);
      toast.success("✨ Home page content successfully updated!");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save content";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to restore the default Home Page content? Any custom text will be replaced.")) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/Admin/HomePageContent/Reset");
      if (res.data?.content) {
        setForm(res.data.content);
      }
      toast.success("🔄 Default home page content restored!");
    } catch {
      toast.error("Failed to reset content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cms-loading-wrapper">
        <div className="cms-spinner"></div>
        <p>Loading Home Page Master Form Settings...</p>
      </div>
    );
  }

  return (
    <div className="cms-page-container">
      {/* Header Banner */}
      <div className="cms-header-card">
        <div className="cms-header-left">
          <div className="cms-badge">
            <HiOutlineSparkles /> Dynamic Master Form Settings
          </div>
          <h1>Home Page Content Management</h1>
          <p>
            Dynamically customize quotes, business titles, Tamil slogans, metrics, and practice details without altering layout or code.
          </p>
        </div>

        <div className="cms-header-actions">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="cms-btn-secondary"
          >
            <HiOutlineEye size={17} /> View Live Home Page
          </a>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="cms-btn-reset"
            title="Restore original factory defaults"
          >
            <HiOutlineArrowPath size={17} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cms-btn-save"
          >
            <HiOutlineCheck size={18} /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="cms-tabs-bar">
        <button
          className={`cms-tab-btn ${activeTab === "hero-left" ? "active" : ""}`}
          onClick={() => setActiveTab("hero-left")}
        >
          <HiOutlineBookmark size={16} /> Box 1: Hero Left (Tamil Quotes & Metrics)
        </button>
        <button
          className={`cms-tab-btn ${activeTab === "hero-right" ? "active" : ""}`}
          onClick={() => setActiveTab("hero-right")}
        >
          <HiOutlineStar size={16} /> Box 2: Hero Right (Advisory & Authority)
        </button>
        <button
          className={`cms-tab-btn ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          <HiOutlineDocumentText size={16} /> Core Practices & Ticker
        </button>
        <button
          className={`cms-tab-btn ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          <HiOutlineBuildingOffice2 size={16} /> Office & Helplines
        </button>
      </div>

      <form onSubmit={handleSave} className="cms-form-body">
        {/* TAB 1: HERO LEFT */}
        {activeTab === "hero-left" && (
          <div className="cms-card-section animate-fade">
            <div className="cms-section-title">
              <span className="cms-sec-icon">1</span>
              <div>
                <h2>Hero Left Section — Headlines, Tamil Motto & Advisory Scope</h2>
                <p>Customize the primary headline hook, Tamil text, and dynamic metric counters.</p>
              </div>
            </div>

            <div className="cms-grid-2">
              <div className="cms-input-group">
                <label>Main Headline Line 1 (Tamil / English)</label>
                <input
                  type="text"
                  name="heroLeftTitle1"
                  value={form.heroLeftTitle1}
                  onChange={handleChange}
                  placeholder="e.g. உங்கள் வணிகம்..."
                  required
                />
              </div>

              <div className="cms-input-group">
                <label>Main Headline Line 2 (Tamil / English)</label>
                <input
                  type="text"
                  name="heroLeftTitle2"
                  value={form.heroLeftTitle2}
                  onChange={handleChange}
                  placeholder="e.g. எங்கள் வரி நிபுணத்துவம்."
                  required
                />
              </div>
            </div>

            <div className="cms-input-group">
              <label>Secondary Subheading (Advisory Categories)</label>
              <input
                type="text"
                name="heroLeftSubtitle"
                value={form.heroLeftSubtitle}
                onChange={handleChange}
                placeholder="e.g. GST Advisory • Notice Reply • Appeal • Litigation Support"
                required
              />
            </div>

            <div className="cms-input-group">
              <label>Hero Description Paragraph</label>
              <textarea
                rows={3}
                name="heroLeftDescription"
                value={form.heroLeftDescription}
                onChange={handleChange}
                placeholder="Detailed statement explaining practical tax solutions and compliance..."
                required
              />
            </div>

            <div className="cms-grid-2">
              <div className="cms-input-group">
                <label>Action Tagline</label>
                <input
                  type="text"
                  name="heroLeftTagline"
                  value={form.heroLeftTagline}
                  onChange={handleChange}
                  placeholder="e.g. Reliable Advice. Timely Action. Lasting Trust."
                />
              </div>

              <div className="cms-input-group">
                <label>Tamil Motto / Inspirational Quote</label>
                <input
                  type="text"
                  name="heroLeftQuote"
                  value={form.heroLeftQuote}
                  onChange={handleChange}
                  placeholder='e.g. "சரியான ஆலோசனை இன்று... பாதுகாப்பான வணிகம் நாளை."'
                />
              </div>
            </div>

            {/* Score Counters Section */}
            <div className="cms-sub-box">
              <h3>📊 Hero Metric Statistics & Trust Counters</h3>
              <p className="cms-sub-desc">These counters automatically animate up when the user visits the page.</p>

              <div className="cms-scores-grid">
                {/* Metric 1 */}
                <div className="cms-metric-field">
                  <span className="cms-m-tag">Metric 1: Experience</span>
                  <input
                    type="text"
                    name="heroExpYears"
                    value={form.heroExpYears}
                    onChange={handleChange}
                    placeholder="10"
                    title="Years of experience"
                  />
                  <input
                    type="text"
                    name="heroExpLabel"
                    value={form.heroExpLabel}
                    onChange={handleChange}
                    placeholder="Years of Professional Experience"
                  />
                </div>

                {/* Metric 2 */}
                <div className="cms-metric-field">
                  <span className="cms-m-tag">Metric 2: Clients Served</span>
                  <input
                    type="text"
                    name="heroClientsCount"
                    value={form.heroClientsCount}
                    onChange={handleChange}
                    placeholder="500"
                    title="Number of clients"
                  />
                  <input
                    type="text"
                    name="heroClientsLabel"
                    value={form.heroClientsLabel}
                    onChange={handleChange}
                    placeholder="Businesses & Professionals Served"
                  />
                </div>

                {/* Metric 3 */}
                <div className="cms-metric-field">
                  <span className="cms-m-tag">Metric 3: Legal Accuracy</span>
                  <input
                    type="text"
                    name="heroVerificationPct"
                    value={form.heroVerificationPct}
                    onChange={handleChange}
                    placeholder="100"
                    title="Percentage"
                  />
                  <input
                    type="text"
                    name="heroVerificationLabel"
                    value={form.heroVerificationLabel}
                    onChange={handleChange}
                    placeholder="Legally Verified Documentation"
                  />
                </div>

                {/* Metric 4 */}
                <div className="cms-metric-field">
                  <span className="cms-m-tag">Metric 4: Support Time</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      name="heroSupportHours"
                      value={form.heroSupportHours}
                      onChange={handleChange}
                      placeholder="24"
                      style={{ width: "50%" }}
                    />
                    <input
                      type="text"
                      name="heroSupportDays"
                      value={form.heroSupportDays}
                      onChange={handleChange}
                      placeholder="7"
                      style={{ width: "50%" }}
                    />
                  </div>
                  <input
                    type="text"
                    name="heroSupportLabel"
                    value={form.heroSupportLabel}
                    onChange={handleChange}
                    placeholder="Professional Response"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HERO RIGHT */}
        {activeTab === "hero-right" && (
          <div className="cms-card-section animate-fade">
            <div className="cms-section-title">
              <span className="cms-sec-icon">2</span>
              <div>
                <h2>Hero Right Section — Firm Reputation & Circular Badge</h2>
                <p>Customize the dark executive card highlighting judicial authority and compliance excellence.</p>
              </div>
            </div>

            <div className="cms-input-group">
              <label>Right Box Main Title</label>
              <input
                type="text"
                name="heroRightTitle"
                value={form.heroRightTitle}
                onChange={handleChange}
                placeholder="e.g. Trusted GST, Income Tax & Business Advisory"
                required
              />
            </div>

            <div className="cms-input-group">
              <label>Right Box Subtitle</label>
              <input
                type="text"
                name="heroRightSubtitle"
                value={form.heroRightSubtitle}
                onChange={handleChange}
                placeholder="e.g. Delivering Confidence Through Compliance."
                required
              />
            </div>

            <div className="cms-input-group">
              <label>Detailed Scope of Practice</label>
              <textarea
                rows={4}
                name="heroRightDescription"
                value={form.heroRightDescription}
                onChange={handleChange}
                placeholder="Every opinion, representation, and submission is backed by statutory provisions..."
                required
              />
            </div>

            <div className="cms-grid-2">
              <div className="cms-input-group">
                <label>Values & Standards Statement</label>
                <input
                  type="text"
                  name="heroRightTagline"
                  value={form.heroRightTagline}
                  onChange={handleChange}
                  placeholder="e.g. Integrity • Accuracy • Professional Excellence"
                />
              </div>

              <div className="cms-input-group">
                <label>Circular Gold Stamp Badge Text</label>
                <input
                  type="text"
                  name="heroCircleBadgeText"
                  value={form.heroCircleBadgeText}
                  onChange={handleChange}
                  placeholder="e.g. GST EXPERT"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES & TICKER */}
        {activeTab === "services" && (
          <div className="cms-card-section animate-fade">
            <div className="cms-section-title">
              <span className="cms-sec-icon">3</span>
              <div>
                <h2>Ticker Marquee & Core Practice Cards</h2>
                <p>Manage the rolling service banner and featured Notice Reply & Appeal filing sections.</p>
              </div>
            </div>

            <div className="cms-input-group">
              <label>Running Marquee Services (Comma separated list)</label>
              <textarea
                rows={2}
                name="runningServices"
                value={form.runningServices}
                onChange={handleChange}
                placeholder="GST Registration, APL-01 Appeal Filing, Section 73 / 74 Defence..."
              />
            </div>

            <div className="cms-grid-2">
              {/* Core Box 1 */}
              <div className="cms-sub-box">
                <h3>📌 Featured Service 1: Notice Reply</h3>
                <div className="cms-input-group">
                  <label>Highlight Tag</label>
                  <input
                    type="text"
                    name="coreNoticeHead"
                    value={form.coreNoticeHead}
                    onChange={handleChange}
                    placeholder="MOST REQUIRED"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="coreNoticeTitle"
                    value={form.coreNoticeTitle}
                    onChange={handleChange}
                    placeholder="GST Notice Reply"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Tamil Translation</label>
                  <input
                    type="text"
                    name="coreNoticeTamil"
                    value={form.coreNoticeTamil}
                    onChange={handleChange}
                    placeholder="ஜிஎஸ்டி நோட்டீஸ் பதில்"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Summary Description</label>
                  <textarea
                    rows={3}
                    name="coreNoticeDesc"
                    value={form.coreNoticeDesc}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Core Box 2 */}
              <div className="cms-sub-box">
                <h3>⚖️ Featured Service 2: Appeal Filing</h3>
                <div className="cms-input-group">
                  <label>Highlight Tag</label>
                  <input
                    type="text"
                    name="coreAppealHead"
                    value={form.coreAppealHead}
                    onChange={handleChange}
                    placeholder="CRITICAL SERVICE"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="coreAppealTitle"
                    value={form.coreAppealTitle}
                    onChange={handleChange}
                    placeholder="GST Appeal Filing"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Tamil Translation</label>
                  <input
                    type="text"
                    name="coreAppealTamil"
                    value={form.coreAppealTamil}
                    onChange={handleChange}
                    placeholder="ஜிஎஸ்டி மேல்முறையீடு"
                  />
                </div>
                <div className="cms-input-group">
                  <label>Summary Description</label>
                  <textarea
                    rows={3}
                    name="coreAppealDesc"
                    value={form.coreAppealDesc}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTACT & OFFICE */}
        {activeTab === "contact" && (
          <div className="cms-card-section animate-fade">
            <div className="cms-section-title">
              <span className="cms-sec-icon">4</span>
              <div>
                <h2>Office Coordinates & Helpline Numbers</h2>
                <p>Ensure client correspondence and map coordinates stay perfectly updated.</p>
              </div>
            </div>

            <div className="cms-grid-3">
              <div className="cms-input-group">
                <label>Direct Phone Number</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  placeholder="+91 8807836326"
                />
              </div>

              <div className="cms-input-group">
                <label>WhatsApp Number</label>
                <input
                  type="text"
                  name="contactWhatsApp"
                  value={form.contactWhatsApp}
                  onChange={handleChange}
                  placeholder="+91 8807836326"
                />
              </div>

              <div className="cms-input-group">
                <label>Official Email Address</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  placeholder="info@skctaxconsultants.com"
                />
              </div>
            </div>

            <div className="cms-grid-2">
              <div className="cms-input-group">
                <label>Lead Advisor Name</label>
                <input
                  type="text"
                  name="officeAdvisorName"
                  value={form.officeAdvisorName}
                  onChange={handleChange}
                  placeholder="Vel Murugan"
                />
              </div>

              <div className="cms-input-group">
                <label>Advisor Credentials & Specialization</label>
                <input
                  type="text"
                  name="officeAdvisorTitle"
                  value={form.officeAdvisorTitle}
                  onChange={handleChange}
                  placeholder="Tax | Audit | Advisory"
                />
              </div>
            </div>

            <div className="cms-sub-box">
              <h3>🏢 Office Physical Location Address</h3>
              <div className="cms-input-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="officeAddressLine1"
                  value={form.officeAddressLine1}
                  onChange={handleChange}
                  placeholder="KKP Complex , Salem Main Road ,"
                />
              </div>
              <div className="cms-input-group">
                <label>Address Line 2 / Floor</label>
                <input
                  type="text"
                  name="officeAddressLine2"
                  value={form.officeAddressLine2}
                  onChange={handleChange}
                  placeholder="Old Post Office , 2nd Floor ,"
                />
              </div>
              <div className="cms-input-group">
                <label>City, PIN & State</label>
                <input
                  type="text"
                  name="officeAddressCity"
                  value={form.officeAddressCity}
                  onChange={handleChange}
                  placeholder="Jalakandapuram - 636501 , Salem , TamilNadu ."
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Bar */}
        <div className="cms-bottom-bar">
          <div className="cms-save-hint">
            💡 Changes take effect immediately on the public website upon saving.
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="cms-btn-reset"
            >
              Reset Defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cms-btn-save"
            >
              <HiOutlineCheck size={18} /> {saving ? "Saving Changes..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
