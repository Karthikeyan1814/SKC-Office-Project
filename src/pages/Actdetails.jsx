import { useMemo, useState } from "react";
import acts from "../data/acts";
import "../styles/ActDetails.css";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function ActDetails() {

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Get unique categories
    const categories = useMemo(() => {
        return ["All", ...new Set(acts.map((item) => item.category))];
    }, []);

    // Filter acts
    const filteredActs = useMemo(() => {

        return acts.filter((item) => {

            const matchSearch =
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.short.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase());

            const matchCategory =
                selectedCategory === "All"
                    ? true
                    : item.category === selectedCategory;

            return matchSearch && matchCategory;

        });

    }, [search, selectedCategory]);

    return (

        <div className="act-page">

            {/* ---------------- Hero ---------------- */}

            <section className="act-hero">

                <h1>

                    Indian Tax &
                    <span> Legal Resource Library</span>

                </h1>

                <p>

                    Access official Government Acts,
                    GST Rules,
                    Income Tax,
                    Audit Standards,
                    MCA,
                    RBI,
                    DGFT,
                    Customs,
                    ICAI,
                    Labour Laws,
                    and many more professional resources.

                </p>

            </section>

            {/* ---------------- Statistics ---------------- */}

            <section className="act-stat">

                <div className="stat-card">

                    <h2>{acts.length}+</h2>

                    <p>Official Resources</p>

                </div>

                <div className="stat-card">

                    <h2>{categories.length - 1}</h2>

                    <p>Categories</p>

                </div>

                <div className="stat-card">

                    <h2>100%</h2>

                    <p>Government Sources</p>

                </div>

                <div className="stat-card">

                    <h2>24×7</h2>

                    <p>Free Access</p>

                </div>

            </section>

            {/* ---------------- Search ---------------- */}

            <section className="act-search">

                <input

                    type="text"

                    placeholder="Search GST, Income Tax, Companies Act, Notices..."

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                />

            </section>

            {/* ---------------- Category Buttons ---------------- */}

            <section className="category-container">

                {

                    categories.map((cat) => (

                        <button

                            key={cat}

                            className={
                                selectedCategory === cat
                                    ? "category-btn active"
                                    : "category-btn"
                            }

                            onClick={() => setSelectedCategory(cat)}

                        >

                            {cat}

                        </button>

                    ))

                }

            </section>

            {/* ---------------- Cards ---------------- */}

            <section className="act-grid">
                                {

                    filteredActs.length === 0 ?

                        (

                            <div className="no-result">

                                <h2>No Resources Found</h2>

                                <p>

                                    Try searching another keyword or choose a different category.

                                </p>

                            </div>

                        )

                        :

                        (

                            filteredActs.map((act) => (

                                <div
                                    className="act-card"
                                    key={act.id}
                                >

                                    <div className="card-top">

                                        <span className="act-category">

                                            {act.category}

                                        </span>

                                        <span className="portal">

                                            {act.portal}

                                        </span>

                                    </div>

                                    <h2>

                                        {act.title}

                                    </h2>

                                    <p>

                                        {act.short}

                                    </p>

                                    <button

                                        className="official-btn"

                                        onClick={() =>
                                            window.open(
                                                act.official,
                                                "_blank",
                                                "noopener,noreferrer"
                                            )
                                        }

                                    >

                                        Official Government Resource

                                        <FaExternalLinkAlt />

                                    </button>

                                </div>

                            ))

                        )

                }

            </section>

            {/* ---------------- Disclaimer ---------------- */}

            <section className="act-disclaimer">

                <h2>

                    Disclaimer

                </h2>

                <p>

                    This Legal Resource Library provides quick access to

                    official Government Acts,

                    Rules,

                    Notifications,

                    Circulars,

                    and statutory portals.

                </p>

                <p>

                    These resources are intended for educational and

                    reference purposes only.

                </p>

                <p>

                    Always refer to the latest version published by the

                    respective Government authority before relying on any

                    legal provision.

                </p>

            </section>
            </div>
    )}