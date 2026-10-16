import useCounter from "../hook/useCounter"
import "../styles/Home.css"
import { useState, useEffect } from "react"
import { FaStar } from "react-icons/fa";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  HiOutlineCalendarDays,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineVideoCamera,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineEnvelope,
} from "react-icons/hi2";

export default function Home() {
    // Dynamic Content State with default fallbacks matching original layout
    const [content, setContent] = useState({
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

        heroRightTitle: "Trusted GST, Income Tax & Business Advisory",
        heroRightSubtitle: "Delivering Confidence Through Compliance.",
        heroRightDescription: "We provide comprehensive GST, Income Tax, Audit, and Business Advisory services tailored to businesses, professionals, and growing enterprises. Every opinion, representation, and submission is backed by statutory provisions, judicial precedents, and practical industry expertise.",
        heroRightTagline: "Integrity • Accuracy • Professional Excellence",
        heroCircleBadgeText: "GST EXPERT",

        runningServices: "GST Registration, APL-01 Appeal Filing, Section 73 / 74 Defence, ASMT-11 Drafting, E-Way Bill Disputes, Income Tax Filing, GST Notice Reply",
        coreNoticeHead: "MOST REQUIRED",
        coreNoticeTitle: "GST Notice Reply",
        coreNoticeTamil: "ஜிஎஸ்டி நோட்டீஸ் பதில்",
        coreNoticeDesc: "Professional reply drafting for every type of GST notice. Each reply built on bare act extracts, official circulars, and verified High Court or Supreme Court judgments. No copy-paste templates. No casual citations.",
        coreAppealHead: "CRITICAL SERVICE",
        coreAppealTitle: "GST Appeal Filing",
        coreAppealTamil: "ஜிஎஸ்டி மேல்முறையீடு",
        coreAppealDesc: "Complete APL-01 appeal drafting and filing before the Appellate Authority. Pre-deposit calculation under Section 107(6), grounds of appeal in paragraph form, supported by actual judgment citations",

        contactPhone: "+91 8807836326",
        contactEmail: "info@skctaxconsultants.com",
        contactWhatsApp: "+91 8807836326",
        officeAdvisorName: "Vel Murugan",
        officeAdvisorTitle: "Tax | Audit | Advisory",
        officeAddressLine1: "KKP Complex , Salem Main Road ,",
        officeAddressLine2: "Old Post Office , 2nd Floor ,",
        officeAddressCity: "Jalakandapuram - 636501 , Salem , TamilNadu .",
    });

    // Score counters
    const exp = useCounter(parseInt(content.heroExpYears) || 10);
    const customer = useCounter(parseInt(content.heroClientsCount) || 500);
    const percentage = useCounter(parseInt(content.heroVerificationPct) || 100);
    const hours = useCounter(parseInt(content.heroSupportHours) || 24);
    const days = useCounter(parseInt(content.heroSupportDays) || 7);

    // Unregistered Visitor Booking Modal State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [guestForm, setGuestForm] = useState({
        clientName: "",
        clientEmail: "",
        clientMobile: "",
        appointmentType: "ONLINE",
        requestedDateTime: "",
        clientNote: "",
    });

    // Fetch dynamic content on mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await api.get("/Public/HomePageContent");
                if (res.data) {
                    setContent((prev) => ({ ...prev, ...res.data }));
                }
            } catch {
                // Keep default content silently
            }
        };
        fetchContent();
    }, []);

    // Listen for custom trigger from Nav or external buttons
    useEffect(() => {
        const handleOpenBooking = () => setShowBookingModal(true);
        window.addEventListener("open-public-booking", handleOpenBooking);
        if (window.location.hash === "#bookcall") {
            setShowBookingModal(true);
        }
        return () => window.removeEventListener("open-public-booking", handleOpenBooking);
    }, []);

    // Translator state: toggles Home page content into pure authentic Tamil
    const [isTamil, setIsTamil] = useState(false);

    const TAMIL_FALLBACKS = {
        heroLeftTitle1: "உங்கள் வணிகம்...",
        heroLeftTitle2: "எங்கள் வரி நிபுணத்துவம்.",
        heroLeftSubtitle: "ஜிஎஸ்டி ஆலோசனை • நோட்டீஸ் பதில் • மேல்முறையீடு • சட்ட ஆதரவு",
        heroLeftDescription: "ஜிஎஸ்டி பதிவுகள் முதல் சிக்கலான வரி வழக்குகள் வரை, உங்கள் வணிகத்திற்கு நடைமுறை வரி தீர்வுகள், சட்டப்பூர்வ இணக்கம் மற்றும் வரி அதிகாரிகளிடம் தொழில்முறை பிரதிநிதித்துவம் வழங்குகிறோம்.",
        heroLeftTagline: "நம்பகமான ஆலோசனை. உரிய நேரத்தில் செயல். நீடித்த நம்பிக்கை.",
        heroLeftQuote: "\"சரியான ஆலோசனை இன்று... பாதுகாப்பான வணிகம் நாளை.\"",
        heroExpLabel: "ஆண்டுகள் தொழில்முறை அனுபவம்",
        heroClientsLabel: "சேவை பெற்ற வணிகங்கள் & நிறுவனங்கள்",
        heroVerificationLabel: "சட்டப்பூர்வமாக சரிபார்க்கப்பட்ட ஆவணங்கள்",
        heroSupportLabel: "துரித தொழில்முறை பதில்",

        heroRightTitle: "நம்பகமான ஜிஎஸ்டி, வருமான வரி & வணிக ஆலோசனை",
        heroRightSubtitle: "முறையான சட்ட இணக்கம் வழி வணிக பாதுகாப்பு.",
        heroRightDescription: "வணிக நிறுவனங்கள், வர்த்தகர்கள் மற்றும் வளரும் நிறுவனங்களுக்கு விரிவான ஜிஎஸ்டி, வருமான வரி, தணிக்கை மற்றும் வணிக ஆலோசனை சேவைகளை வழங்குகிறோம். ஒவ்வொரு ஆலோசனையும் நேரடி சட்ட விதிகள் மற்றும் நீதிமன்ற தீர்ப்புகளின் துணையுடன் வழங்கப்படுகிறது.",
        heroRightTagline: "நேர்மை • துல்லியம் • தொழில்முறை மேன்மை",
        heroCircleBadgeText: "ஜிஎஸ்டி நிபுணர்",

        runningServices: "ஜிஎஸ்டி புதிய பதிவு, APL-01 மேல்முறையீடு தாக்கல், பிரிவு 73 / 74 தற்காப்பு, ASMT-11 பதில் வரைவு, இ-வே பில் தகராறுகள், வருமான வரி தாக்கல், ஜிஎஸ்டி நோட்டீஸ் பதில்",

        coreNoticeHead: "அதிகம் தேவைப்படும் சேவை",
        coreNoticeTitle: "ஜிஎஸ்டி நோட்டீஸ் பதில்",
        coreNoticeTamil: "ஜிஎஸ்டி நோட்டீஸ் பதில் வரைவு",
        coreNoticeDesc: "அனைத்து வகையான ஜிஎஸ்டி நோட்டீஸ்களுக்கும் தொழில்முறை பதில் வரைவு. ஒவ்வொரு பதிலும் நேரடி சட்டப் பிரிவுகள், சுற்றறிக்கைகள் மற்றும் உயர் நீதிமன்ற / உச்ச நீதிமன்ற தீர்ப்புகளுடன் கூடியது. நகல் வடிவங்கள் இல்லை.",

        coreAppealHead: "முக்கியமான சேவை",
        coreAppealTitle: "ஜிஎஸ்டி மேல்முறையீடு தாக்கல்",
        coreAppealTamil: "ஜிஎஸ்டி மேல்முறையீடு (APL-01)",
        coreAppealDesc: "மேல்முறையீட்டு அதிகாரியிடம் முழுமையான APL-01 மேல்முறையீட்டு வரைவு மற்றும் இணையவழி தாக்கல். பிரிவு 107(6)-ன் கீழ் முன்கூட்டிய வைப்புத்தொகை கணக்கீடு, தீர்ப்பு ஆதாரங்களுடன் கூடிய மேல்முறையீட்டு காரணங்கள்.",
    };

    // Active content based on translator toggle
    const activeContent = isTamil ? { ...content, ...TAMIL_FALLBACKS } : content;

    const rawServices = isTamil ? TAMIL_FALLBACKS.runningServices : content.runningServices;
    const serviceList = rawServices
        ? rawServices.split(",").map((s) => s.trim()).filter(Boolean)
        : [
            "GST Registration",
            "APL-01 Appeal Filing",
            "Section 73 / 74 Defence",
            "ASMT-11 Drafting",
            "E-Way Bill Disputes",
            "Income Tax Filing",
            "GST Notice Reply",
        ];

    function handleWhatsApp() {
        const phone = (content.contactWhatsApp || "918807836326").replace(/[^0-9]/g, "");
        const message = encodeURIComponent("Hello Sri Kathiravan & Co., I need consultation regarding GST / Income Tax.");
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    }

    const sendEmail = () => {
        const email = content.contactEmail || "info@skctaxconsultants.com";
        const subject = encodeURIComponent("Consultation / Notice Advisory Request");
        const body = encodeURIComponent(`Hello Sri Kathiravan & Co.,\n\nI need expert advice regarding GST / Tax advisory.\n\nPlease contact me.\n\nThank you.`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    };

    const handleGuestBooking = async (e) => {
        e.preventDefault();
        if (!guestForm.clientName || !guestForm.clientEmail || !guestForm.clientMobile || !guestForm.requestedDateTime) {
            toast.error("Please complete all required fields");
            return;
        }

        setBookingSubmitting(true);
        try {
            let dt = guestForm.requestedDateTime;
            if (dt && dt.length === 16) {
                dt = `${dt}:00`;
            }
            const payload = {
                clientName: guestForm.clientName.trim(),
                clientEmail: guestForm.clientEmail.trim(),
                clientMobile: guestForm.clientMobile.trim(),
                appointmentType: guestForm.appointmentType,
                requestedDateTime: dt,
                clientNote: guestForm.clientNote,
            };

            await api.post("/Public/Appointment/Book", payload);
            toast.success("🎯 Consultation request submitted! Our office will confirm your slot shortly.");
            setShowBookingModal(false);
            setGuestForm({
                clientName: "",
                clientEmail: "",
                clientMobile: "",
                appointmentType: "ONLINE",
                requestedDateTime: "",
                clientNote: "",
            });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to submit booking request";
            toast.error(msg);
        } finally {
            setBookingSubmitting(false);
        }
    };

    const FULL_SERVICES_DATA = [
        {
            num: " - 01 -",
            enTitle: "GST Registration",
            taTitle: "ஜிஎஸ்டி புதிய பதிவு",
            enDesc: "All categories. Regular, Composition, Casual Taxable Person, Non-Resident, ISD, TDS, TCS and Export registrations handled completely online.",
            taDesc: "அனைத்து பிரிவுகள். ரெகுலர், காம்போசிஷன், கேசுவல் வரி செலுத்துவோர், வெளிநாடு வாழ் நபர்கள், ISD, TDS, TCS மற்றும் ஏற்றுமதி பதிவுகள் முழுமையாக ஆன்லைனில் செயல்படுத்தப்படும்."
        },
        {
            num: " - 02 -",
            enTitle: "GST Return Filing",
            taTitle: "ஜிஎஸ்டி மாதாந்திர & வருடாந்திர தாக்கல்",
            enDesc: "GSTR-1, GSTR-3B, GSTR-9 annual return, GSTR-9C reconciliation, CMP-08, ITC-04 and all periodic returns filed accurately and on time.",
            taDesc: "GSTR-1, GSTR-3B, GSTR-9 வருடாந்திர ரிட்டர்ன், GSTR-9C சரிபார்ப்பு, CMP-08, ITC-04 உள்ளிட்ட அனைத்து குறிப்பிட்ட கால அறிக்கைகளும் துல்லியமாக மற்றும் உரிய நேரத்தில் தாக்கல் செய்யப்படும்."
        },
        {
            num: " - 03 -",
            enTitle: "GST Notice Reply",
            taTitle: "ஜிஎஸ்டி நோட்டீஸ் பதில் வரைவு",
            enDesc: "Professional drafting of replies to all SCNs, ASMT-10, DRC-01, DRC-01A, audit observations and assessment proceedings.",
            taDesc: "அனைத்து SCN, ASMT-10, DRC-01, DRC-01A, தணிக்கை அவதானிப்புகள் மற்றும் மதிப்பீட்டு நடவடிக்கைகளுக்கான தொழில்முறை சட்டப்பூர்வ பதில் வரைவு."
        },
        {
            num: " - 04 -",
            enTitle: "GST Appeal (APL-01)",
            taTitle: "ஜிஎஸ்டி மேல்முறையீடு (APL-01)",
            enDesc: "Complete first appellate authority filing. Grounds of appeal supported by verified case law from High Court and Supreme Court judgments.",
            taDesc: "முழுமையான முதல் மேல்முறையீட்டு ஆணைய தாக்கல். உயர் நீதிமன்ற மற்றும் உச்ச நீதிமன்ற தீர்ப்புகளின் சட்ட ஆதாரங்களுடன் கூடிய மேல்முறையீட்டு வரைவு."
        },
        {
            num: " - 05 -",
            enTitle: "E-Way Bill Issues",
            taTitle: "இ-வே பில் தகராறுகள் & தீர்வுகள்",
            enDesc: "Detention cases under Section 129 and 130, MOV-07 reply, penalty reduction representation, and movement compliance advisory for transporters.",
            taDesc: "பிரிவு 129 மற்றும் 130-ன் கீழ் சரக்கு தடுப்பு வழக்குகள், MOV-07 பதில், அபராதக் குறைப்பு பிரதிநிதித்துவம் மற்றும் போக்குவரத்து சட்ட இணக்க ஆலோசனை."
        },
        {
            num: " - 06 -",
            enTitle: "Income Tax Filing",
            taTitle: "வருமான வரி தாக்கல் (ITR)",
            enDesc: "ITR-1 to ITR-7 filing for salaried, business, and professional clients. Capital gains, presumptive scheme, and tax planning included.",
            taDesc: "ஊழியர்கள், வணிகர்கள் மற்றும் தொழில்முனைவோருக்கான ITR-1 முதல் ITR-7 வரை தாக்கல். மூலதன ஆதாயம், உத்தேச வரி திட்டம் மற்றும் வரி திட்டமிடல் உள்ளடக்கியது."
        },
        {
            num: " - 07 -",
            enTitle: "Income Tax Refund",
            taTitle: "வருமான வரி திரும்பப் பெறுதல் (Refund)",
            enDesc: "Pending refund tracking, rectification under Section 154, response to intimation under Section 143(1) and assessment proceedings.",
            taDesc: "நிலுவையில் உள்ள ரீஃபண்ட் கண்காணிப்பு, பிரிவு 154 திருத்த விண்ணப்பம், பிரிவு 143(1) அறிவிப்பு பதில் மற்றும் மதிப்பீட்டு வழக்குகள்."
        },
        {
            num: " - 08 -",
            enTitle: "Banking & Loan Consultancy",
            taTitle: "வங்கி கடன் திட்ட அறிக்கை & ஆலோசனை",
            enDesc: "Project report preparation, CMA data, working capital and term loan documentation for textile traders and MSMEs.",
            taDesc: "திட்ட அறிக்கை தயாரித்தல், CMA தரவு, நடைமுறை மூலதன கடன் மற்றும் ஜவுளி வர்த்தகர்கள் மற்றும் MSME-களுக்கான கடன் ஆவண தயாரிப்பு."
        },
        {
            num: " - 09 -",
            enTitle: "GST Audit & Reconciliation",
            taTitle: "ஜிஎஸ்டி தணிக்கை & கணக்கு சரிபார்ப்பு",
            enDesc: "Books to returns reconciliation, GSTR-9C audit, ITC reconciliation with GSTR-2B, e-invoice and e-way bill matching.",
            taDesc: "கணக்கு புத்தகங்கள் மற்றும் ரிட்டர்ன்கள் சரிபார்ப்பு, GSTR-9C தணிக்கை, GSTR-2B உடன் உள்ளீட்டு வரிக் கடன் (ITC) சரிபார்ப்பு மற்றும் இ-இன்வாய்ஸ் ஒப்பீடு."
        },
        {
            num: " - 10 -",
            enTitle: "GST Training & Bookkeeping",
            taTitle: "ஜிஎஸ்டி பயிற்சி & கணக்கியல் பராமரிப்பு",
            enDesc: "Practical GST training for staff and accountants. Monthly bookkeeping in Tally with GST compliance for ongoing businesses.",
            taDesc: "பணியாளர்கள் மற்றும் கணக்காளர்களுக்கு நடைமுறை ஜிஎஸ்டி பயிற்சி. டேலியில் மாதாந்திர கணக்கு பராமரிப்பு மற்றும் வணிக சட்ட இணக்கம்."
        }
    ];

    const PROCESS_STEPS_DATA = [
        {
            step: "01",
            enTitle: "Send Notice",
            taTitle: "நோட்டீஸ் அனுப்புதல்",
            enDesc: "WhatsApp or email a scanned copy of the GST notice or order along with your GSTIN.",
            taDesc: "உங்கள் ஜிஎஸ்டி எண் மற்றும் நோட்டீஸ் அல்லது உத்தரவின் நகலை WhatsApp அல்லது Email மூலம் அனுப்பவும்."
        },
        {
            step: "02",
            enTitle: "Free Review",
            taTitle: "இலவச ஆரம்ப ஆய்வு",
            enDesc: "Initial assessment of the notice. Demand-wise analysis and identification of legal defence.",
            taDesc: "நோட்டீஸின் ஆரம்ப மதிப்பீடு. வரி கோரிக்கையின் சட்டப்பிரிவு பகுப்பாய்வு மற்றும் தற்காப்பு வாதங்களை கண்டறிதல்."
        },
        {
            step: "03",
            enTitle: "Draft Reply",
            taTitle: "வலுவான பதில் வரைவு",
            enDesc: "Professional draft with bare act extracts, verified case laws, and complete legal submissions.",
            taDesc: "அதிகாரப்பூர்வ சட்ட விதிகள், நீதிமன்ற தீர்ப்புகள் மற்றும் சட்ட வாதங்களுடன் கூடிய தொழில்முறை பதில் தயாரிப்பு."
        },
        {
            step: "04",
            enTitle: "File & Follow Up",
            taTitle: "தாக்கல் & ஆஜராதல்",
            enDesc: "Online filing on GST portal. Personal hearing representation. Status tracking until closure.",
            taDesc: "ஜிஎஸ்டி போர்ட்டலில் இணையவழி தாக்கல், நேரடி விசாரணை பிரதிநிதித்துவம் மற்றும் முடிவு வரும் வரை தொடர் கண்காணிப்பு."
        }
    ];

    return (
        <div className="home-container">
            {/* 🌐 PROMINENT TRANSLATOR BUTTON */}
            <div className="home-translator-wrap">
                <button
                    className={`home-translator-btn ${isTamil ? "active-tamil" : ""}`}
                    onClick={() => setIsTamil((prev) => !prev)}
                    title={isTamil ? "Click to switch to Default" : "Click to translate Home content into தமிழ்"}
                    id="home-tamil-translator-btn"
                >
                    <span style={{ fontSize: "16px" }}>🌐</span>
                    <span>
                        {isTamil ? "தமிழ் (இயங்குகிறது) • Switch to Default" : "Translate Home to தமிழ் (Tamil)"}
                    </span>
                </button>
            </div>

            {/* HERO SECTION */}
            <section id="hero">
                <section className="hero-container">
                    <div className="hero-left">
                        <h1>{activeContent.heroLeftTitle1}</h1>
                        <h1>{activeContent.heroLeftTitle2}</h1>
                        <h2>{activeContent.heroLeftSubtitle}</h2>
                        <p>{activeContent.heroLeftDescription}</p>
                        <h3>{activeContent.heroLeftTagline}</h3>
                        <h4>{activeContent.heroLeftQuote}</h4>

                        {/* Interactive CTAs */}
                        <div style={{ display: "flex", gap: "14px", margin: "22px 0 28px 0", flexWrap: "wrap", alignItems: "center" }}>
                            <button
                                className="blue-btn"
                                onClick={() => setShowBookingModal(true)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    fontWeight: "800",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
                                    color: "#ffffff",
                                    border: "none",
                                    boxShadow: "0 6px 20px rgba(67, 56, 202, 0.35)",
                                }}
                            >
                                <HiOutlineCalendarDays size={18} /> {isTamil ? "ஆலோசனை முன்பதிவு" : "Book Consultation Slot"}
                            </button>

                            <button
                                onClick={handleWhatsApp}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 22px",
                                    borderRadius: "10px",
                                    fontWeight: "800",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    background: "#22c55e",
                                    color: "#ffffff",
                                    border: "none",
                                    boxShadow: "0 6px 18px rgba(34, 197, 94, 0.3)",
                                }}
                            >
                                WhatsApp Advisory
                            </button>
                        </div>

                        <section className="hero-score">
                            <div className="score-box"><h1>{exp}+</h1> <p>{activeContent.heroExpLabel}</p></div>
                            <div className="score-box"><h1>{customer}+</h1> <p>{activeContent.heroClientsLabel}</p></div>
                            <div className="score-box"><h1>{percentage}%</h1> <p>{activeContent.heroVerificationLabel}</p></div>
                            <div className="score-box"><h1>{hours}/ {days}</h1> <p>{activeContent.heroSupportLabel}</p></div>
                        </section>
                    </div>

                    <div className="hero-right">
                        <h1>{activeContent.heroRightTitle}</h1>
                        <h2>{activeContent.heroRightSubtitle}</h2>
                        <p>{activeContent.heroRightDescription}</p>
                        <h2>{activeContent.heroRightTagline}</h2>
                        <div className="circle">
                            <h3 style={{ margin: 0, lineHeight: 1.2 }}>
                                {activeContent.heroCircleBadgeText.includes(" ") ? (
                                    <>
                                        {activeContent.heroCircleBadgeText.split(" ")[0]} <br />
                                        {activeContent.heroCircleBadgeText.split(" ").slice(1).join(" ")}
                                    </>
                                ) : (
                                    activeContent.heroCircleBadgeText
                                )}
                            </h3>
                        </div>
                    </div>
                </section>
            </section>

            {/* RUNNING MARQUEE (Seamless, Buttery-Smooth 4x Loop) */}
            <section className="running-container">
                <div className="running-track">
                    {[...serviceList, ...serviceList, ...serviceList, ...serviceList].map((item, index) => (
                        <span key={index} className="running-item">
                            <FaStar color="goldenrod" size={18} />
                            <span>{item}</span>
                        </span>
                    ))}
                </div>
            </section>

            {/* CORE SERVICES */}
            <section id="service">
                <div className="core-service-cont">
                    <h3 style={{ color: "var(--primary)" }}>{isTamil ? "-- எங்கள் முதன்மை நடைமுறை" : "-- Our Core Practice"}</h3>
                    <h1>
                        {isTamil ? "ஜிஎஸ்டி நோட்டீஸ் பதில் & " : "GST Notice Reply & "}
                        <span style={{ color: "goldenrod" }}>{isTamil ? "மேல்முறையீடு தாக்கல்" : "Appeal Filing"}</span>
                    </h1>
                    <p>
                        {isTamil
                            ? "பெரும்பாலான ஆலோசகர்கள் தடுமாறும் இரண்டு முக்கிய துறைகள். இந்த நிறுவனம் சிறப்பாக கட்டியெழுப்பப்பட்ட இரண்டு துறைகள். ஒவ்வொரு வரைவும் வாடிக்கையாளரின் நிலைப்பாட்டை உறுதி செய்யும் சட்டப்பிரிவு, விதி மற்றும் தீர்ப்புகளை மேற்கோள் காட்டுகிறது."
                            : "Two areas where most consultants struggle. Two areas where this practice is built. Every draft references the exact section, rule, circular, and judgment that supports the client position."}
                    </p>

                    <section className="core-cont">
                        <div className="core-box">
                            <h5 id="clear-head">{activeContent.coreNoticeHead}</h5>
                            <h1>{activeContent.coreNoticeTitle}</h1>
                            <h2>{activeContent.coreNoticeTamil}</h2>
                            <p>{activeContent.coreNoticeDesc}</p>
                            <ul>
                                {isTamil ? (
                                    <>
                                        <li>பிரிவு 73 மற்றும் பிரிவு 74 SCN நோட்டீஸ் பதில்</li>
                                        <li>ASMT-10 / ASMT-11 வரைவு தயாரிப்பு</li>
                                        <li>DRC-01 / DRC-01A / DRC-06 பதில் விளக்கம்</li>
                                        <li>GSTR-3B மற்றும் GSTR-2A / 2B முரண்பாடு பதில்</li>
                                        <li>ITC மறுப்பு மற்றும் Rule 86A நோட்டீஸ் தற்காப்பு</li>
                                        <li>நேரடி விசாரணை ஆஜராதல் (Personal Hearing)</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Section 73 and Section 74 SCN reply</li>
                                        <li>ASMT-10 / ASMT-11 drafting</li>
                                        <li>DRC-01 / DRC-01A / DRC-06 response</li>
                                        <li>GSTR-3B vs GSTR-2A or 2B mismatch reply</li>
                                        <li>ITC denial and Rule 86A notice reply</li>
                                        <li>Personal hearing representation</li>
                                    </>
                                )}
                            </ul>
                            <button className="blue-btn" onClick={() => handleWhatsApp()}>
                                {isTamil ? "நோட்டீஸ் நகலை அனுப்புக" : "Send Notice Copy"}
                            </button>
                        </div>

                        <div className="core-box">
                            <h5 id="clear-head">{activeContent.coreAppealHead}</h5>
                            <h1>{activeContent.coreAppealTitle}</h1>
                            <h2>{activeContent.coreAppealTamil}</h2>
                            <p>{activeContent.coreAppealDesc}</p>
                            <ul>
                                {isTamil ? (
                                    <>
                                        <li>APL-01 மேல்முறையீட்டு தயாரிப்பு மற்றும் ஆன்லைன் தாக்கல்</li>
                                        <li>வழக்கின் உண்மை நிலை மற்றும் மேல்முறையீட்டு காரணங்கள் வரைவு</li>
                                        <li>பிரிவு 107(6)-ன் கீழ் முன்கூட்டிய வைப்புத்தொகை சரிபார்ப்பு</li>
                                        <li>விதி 108-ன் கீழ் காலக்கெடு இணக்கம்</li>
                                        <li>தடை ஆணை மனு மற்றும் திருத்த மனு (Stay / Rectification)</li>
                                        <li>மேல்முறையீட்டு தீர்ப்பாயம் (Appellate Tribunal) தயாரிப்பு உதவி</li>
                                    </>
                                ) : (
                                    <>
                                        <li>APL-01 appeal preparation and online filing</li>
                                        <li>Facts of the Case and Grounds of Appeal drafting</li>
                                        <li>Pre-deposit verification under Section 107(6)</li>
                                        <li>Time limit compliance under Rule 108</li>
                                        <li>Stay application and rectification petition</li>
                                        <li>Appellate Tribunal preparation support</li>
                                    </>
                                )}
                            </ul>
                            <button className="blue-btn" onClick={() => handleWhatsApp()}>
                                {isTamil ? "மேல்முறையீடு குறித்து பேசுக" : "Discuss Appeal"}
                            </button>
                        </div>
                    </section>
                </div>
            </section>

            {/* FULL SERVICES GRID */}
            <section id="full-service">
                <div className="full-service-cont">
                    <h3>{isTamil ? "-- முழுமையான சேவை பட்டியல்" : "-- Full Service List"}</h3>
                    <h1 style={{ marginBottom: "10px" }}>
                        {isTamil
                            ? "வளரும் வணிகத்திற்கு தேவையான அனைத்தும் ஒரே இடத்தில்."
                            : "Everything a growing business needs under one roof."}
                    </h1>
                    <p>
                        {isTamil
                            ? "ஜிஎஸ்டி, வருமான வரி, வங்கி நிதி மற்றும் சட்டப்பூர்வ இணக்கம். தமிழ்நாடு முழுவதும் உள்ள வர்த்தகர்கள், உற்பத்தியாளர்கள் மற்றும் ஏற்றுமதியாளர்களுக்கான முழுமையான தொழில்முறை சேவைகள்."
                            : "GST. Income Tax. Banking. Compliance. End to end professional services for traders, manufacturers, and exporters across Tamil Nadu."}
                    </p>
                    <div className="all-box-container">
                        {FULL_SERVICES_DATA.map((srv, idx) => (
                            <div key={idx} className="all-box">
                                <h4>{srv.num}</h4>
                                <h1>{isTamil ? srv.taTitle : srv.enTitle}</h1>
                                <p>{isTamil ? srv.taDesc : srv.enDesc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RUNNING MARQUEE 2 (Smooth) */}
            <section className="running-container">
                <div className="running-track">
                    {[...serviceList, ...serviceList, ...serviceList, ...serviceList].map((item, index) => (
                        <span key={index} className="running-item">
                            <FaStar color="goldenrod" size={18} />
                            <span>{item}</span>
                        </span>
                    ))}
                </div>
            </section>

            {/* PROCESS SECTION */}
            <section id="process">
                <div className="process-container">
                    <h3>{isTamil ? "-- இது எவ்வாறு செயல்படுகிறது" : "-- How It Works"}</h3>
                    <h1>
                        {isTamil ? "நோட்டீஸ் முதல் தீர்வு வரை, " : "From notice to resolution, "}
                        <span style={{ color: "goldenrod" }}>{isTamil ? "படிப்படியாக.." : "step by step.."}</span>
                    </h1>
                    <p>
                        {isTamil
                            ? "நோட்டீஸ் பெறும் நொடி முதல் சட்டப்பூர்வ காலக்கெடுவிற்குள் முறையாக தயாரிக்கப்பட்ட பதில் அல்லது மேல்முறையீடு தாக்கல் செய்யும் வரை தெளிவான நடைமுறை."
                            : "A clear path from the moment you receive a notice to a properly drafted reply or appeal filed within statutory time limits."}
                    </p>
                    <div className="process-cont">
                        {PROCESS_STEPS_DATA.map((stepItem, idx) => (
                            <div key={idx} className="process-box">
                                <h1>{stepItem.step}</h1>
                                <h3>{isTamil ? stepItem.taTitle : stepItem.enTitle}</h3>
                                <p>{isTamil ? stepItem.taDesc : stepItem.enDesc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr />

            {/* CONTACT SECTION */}
            <section id="contact">
                <div className="contact-container">
                    <h3>Get In Touch</h3>
                    <h1>Have a notice? <span style={{ color: "goldenrod" }}> Let us look at it first.</span></h1>
                    <h2 style={{ color: "red", margin: "10px 0" }}>இலவச ஆரம்ப ஆலோசனை · WhatsApp அல்லது Email</h2>
                    <p>Send the notice or order copy on WhatsApp. You will receive a first response with a clear roadmap for your case. <br /> No commitment until you decide to proceed.</p>
                    <div className="contact-cont">
                        <div className="contact-left">
                            <h2>Contacts</h2>

                            <div className="contact-box" onClick={() => handleWhatsApp()}>
                                <section>
                                    <img src="/whatsapp.svg" alt="WhatsApp" />
                                </section>
                                <section>
                                    <p>WhatsApp , Faster Response</p>
                                    <h1>{content.contactWhatsApp}</h1>
                                </section>
                            </div>

                            <div className="contact-box" onClick={() => sendEmail()}>
                                <section>
                                    <img src="/gmail.svg" alt="Email" />
                                </section>
                                <section>
                                    <p>Email , Documents and Notices</p>
                                    <h1>{content.contactEmail}</h1>
                                </section>
                            </div>

                            <div className="contact-box" onClick={() => window.location.href = `tel:${content.contactPhone.replace(/[^0-9+]/g, "")}`}>
                                <section>
                                    <img src="/cell.svg" alt="Phone" />
                                </section>
                                <section>
                                    <p>Phone , Direct Call for Meeting</p>
                                    <h1>{content.contactPhone}</h1>
                                </section>
                            </div>
                        </div>

                        <div className="contact-rigth">
                            <h3>Office</h3>
                            <h1>{content.officeAdvisorName}</h1>
                            <p>{content.officeAdvisorTitle}</p>
                            <br />
                            <section className="contact-office-box">
                                <img src="/main_logo.png" alt="Sri Kathiravan & Co" />
                                <h1>Sri Kathiravan & Co .,</h1>
                            </section>
                            <p>{content.officeAddressLine1}</p>
                            <p>{content.officeAddressLine2}</p>
                            <p>{content.officeAddressCity}</p><br />
                            <h4><span style={{ color: "var(--primary)" }}>Phone : </span> {content.contactPhone}</h4>
                        </div>

                        <div className="map-container">
                            <section>
                                <h3>Map</h3>
                                <h1 style={{ color: "var(--primary)", marginBottom: "10px" }}>📍 Visit Our Office</h1>
                                <p>Meet us in person for expert GST and Income Tax consultation. <br /> We welcome individuals, startups, and businesses across Tamil Nadu.</p>
                            </section>
                            <section className="map">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d897.2611130232494!2d77.87911039863292!3d11.69690973910273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba95700560b08ed%3A0x65e7a9f920995e13!2sSri%20Kathiravan%20%26%20Co.%2C%20Auditor%20Office!5e0!3m2!1sen!2sin!4v1782907616882!5m2!1sen!2sin"
                                    width="600"
                                    height="450"
                                    style={{ border: "0" }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    title="Office Location Map"
                                ></iframe>
                            </section>
                        </div>
                    </div>
                </div>
            </section>

            <section id="bookcall"></section>

            {/* UNREGISTERED VISITOR CONSULTATION BOOKING MODAL */}
            {showBookingModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 999999,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "24px",
                            padding: "36px",
                            width: "100%",
                            maxWidth: "520px",
                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
                            position: "relative",
                            fontFamily: "var(--font2, 'Nunito', sans-serif)",
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eef2ff", color: "#4338ca", padding: "4px 12px", borderRadius: "16px", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                                    ✨ Public Appointment Desk
                                </div>
                                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                                    Book Consultation Slot
                                </h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                                    Direct consultation with Sri Kathiravan & Co. specialists. No account required.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "8px",
                                    cursor: "pointer",
                                    color: "#64748b",
                                }}
                            >
                                <HiOutlineXMark size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleGuestBooking} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                    Your Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={guestForm.clientName}
                                    onChange={(e) => setGuestForm({ ...guestForm, clientName: e.target.value })}
                                    placeholder="e.g. Keerthana Kumar / Velan Textiles"
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px",
                                        borderRadius: "10px",
                                        border: "1.5px solid #cbd5e1",
                                        fontSize: "14px",
                                        background: "#f8fafc",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={guestForm.clientMobile}
                                        onChange={(e) => setGuestForm({ ...guestForm, clientMobile: e.target.value })}
                                        placeholder="e.g. 9876543210"
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: "10px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "14px",
                                            background: "#f8fafc",
                                            boxSizing: "border-box",
                                            outline: "none",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={guestForm.clientEmail}
                                        onChange={(e) => setGuestForm({ ...guestForm, clientEmail: e.target.value })}
                                        placeholder="yourname@gmail.com"
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: "10px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "14px",
                                            background: "#f8fafc",
                                            boxSizing: "border-box",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                    Session Format *
                                </label>
                                <select
                                    value={guestForm.appointmentType}
                                    onChange={(e) => setGuestForm({ ...guestForm, appointmentType: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px",
                                        borderRadius: "10px",
                                        border: "1.5px solid #cbd5e1",
                                        fontSize: "14px",
                                        background: "#f8fafc",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                >
                                    <option value="ONLINE">Online Meeting (Google Meet / Screen Share)</option>
                                    <option value="IN_PERSON">In-Person at SKC Corporate Office</option>
                                    <option value="PHONE">Direct Tele-Consultation</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                    Preferred Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={guestForm.requestedDateTime}
                                    onChange={(e) => setGuestForm({ ...guestForm, requestedDateTime: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px",
                                        borderRadius: "10px",
                                        border: "1.5px solid #cbd5e1",
                                        fontSize: "14px",
                                        background: "#f8fafc",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                                    Consultation Topic / Notice Query
                                </label>
                                <textarea
                                    rows={3}
                                    value={guestForm.clientNote}
                                    onChange={(e) => setGuestForm({ ...guestForm, clientNote: e.target.value })}
                                    placeholder="Briefly describe your requirement: SCN reply, appeal, registration, returns..."
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px",
                                        borderRadius: "10px",
                                        border: "1.5px solid #cbd5e1",
                                        fontSize: "14px",
                                        background: "#f8fafc",
                                        boxSizing: "border-box",
                                        outline: "none",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    style={{
                                        padding: "10px 18px",
                                        background: "#f1f5f9",
                                        color: "#475569",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontWeight: "700",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={bookingSubmitting}
                                    style={{
                                        padding: "11px 26px",
                                        background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontWeight: "800",
                                        fontSize: "13.5px",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(67, 56, 202, 0.3)",
                                    }}
                                >
                                    {bookingSubmitting ? "Submitting..." : "Submit Consultation Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}