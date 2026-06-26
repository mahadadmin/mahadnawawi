/**
 * Specialized Sub-runtime Context for News & Events Page Optimization
 * Consumes state streams provided by window.GlobalAppCore dynamically per locale.
 */

document.addEventListener("DOMContentLoaded", () => {
    const initialLang = window.GlobalAppCore?.state?.lang || "sw";
    window.GlobalAppCore.orchestrate(`assets/data/${initialLang}-news.json`);

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderNewsComponents(e.detail.lang, e.detail.localData);
        generateNewsSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        const mpyaLang = e.detail.lang;
        
        fetch(`assets/data/${mpyaLang}-news.json`)
            .then(res => res.json())
            .then(data => {
                renderNewsComponents(mpyaLang, data);
                generateNewsSchema(mpyaLang, data);
            })
            .catch(err => console.error("Imeshindwa kupakia faili la lugha mpya:", err));
    });
});

let cachedNewsItems = [];
let currentLang = "sw";
let currentLabel = "Ilichapishwa";
let currentNewLabel = "Mpya";

function renderNewsComponents(lang, fullLocalData) {
    // Hakikisha tunapata object ya lugha husika (kama "en", "sw", au "ar") kutoka kwenye JSON struct
    const data = fullLocalData[lang] || fullLocalData;
    if (!data) return;

    currentLang = lang;
    currentLabel = data.news_section?.published_label || "Ilichapishwa";
    currentNewLabel = data.news_section?.new_label || "Mpya";

    // =========================================================================
    // DYNAMIC DOM UPDATE FOR HERO, SEARCH PLACEHOLDER & METADATA (I18N FIX)
    // =========================================================================
    
    // 1. Sasisha Hero Title dynamically
    const heroTitleEl = document.querySelector("[data-i18n='hero.title']");
    if (heroTitleEl && data.hero?.title) {
        heroTitleEl.textContent = data.hero.title;
    }

    // 2. Sasisha Search Input Placeholder dynamically
    const searchInputEl = document.querySelector("input[data-i18n-attr*='search_placeholder']") || 
                          document.querySelector(".search-section input") || 
                          document.querySelector("input[type='search']");
    if (searchInputEl && data.news_section?.search_placeholder) {
        searchInputEl.setAttribute("placeholder", data.news_section.search_placeholder);
    }

    // 3. Sasisha SEO Meta Tags (Title na Description) ili ziendane na lugha iliyochaguliwa
    if (data.meta) {
        if (data.meta.title) {
            document.title = data.meta.title;
        }
        const metaDescEl = document.querySelector("meta[name='description']");
        if (metaDescEl && data.meta.description) {
            metaDescEl.setAttribute("content", data.meta.description);
        }
        const metaKeywordsEl = document.querySelector("meta[name='keywords']");
        if (metaKeywordsEl && data.meta.keywords) {
            metaKeywordsEl.setAttribute("content", data.meta.keywords);
        }
    }
    // =========================================================================

    if (!data.news) return;
    cachedNewsItems = data.news;

    const container = document.getElementById("news-cards-container");
    if (!container) return;

    container.innerHTML = "";

    cachedNewsItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "col-md-6 col-lg-4";
        
        // Kutofautisha mwelekeo wa maandishi kulingana na lugha (kama Kiarabu kinaanza kulia "rtl")
        const textAlignmentClass = lang === "ar" ? "text-end" : "text-start";
        const badgeClass = lang === "ar" ? "ms-2" : "me-2";

        card.innerHTML = `
            <div class="card h-100 shadow-sm border-0 news-card">
                <div class="card-body d-flex flex-column ${textAlignmentClass}">
                    <div class="mb-2 d-flex align-items-center flex-wrap gap-1">
                        ${item.isNew ? `<span class="badge bg-danger ${badgeClass}">${currentNewLabel}</span>` : ""}
                        <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${item.date}</small>
                    </div>
                    <h3 class="h5 card-title fw-bold mb-3">${item.title}</h3>
                    <p class="card-text text-muted flex-grow-1">
                        ${item.paragraphs && item.paragraphs[0] ? item.paragraphs[0].substring(0, 140) + "..." : ""}
                    </p>
                    <a href="soma-habari.html?id=${item.id}" class="btn btn-outline-primary btn-sm mt-3 align-self-start custom-read-more-btn">
                        <span data-i18n="news_section.read_more">${lang === "en" ? "Read More" : lang === "ar" ? "اقرأ المزيد" : "Soma Zaidi"}</span> 
                        <i class="bi ${lang === "ar" ? "bi-arrow-left" : "bi-arrow-right"} ms-1"></i>
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Re-bind search input listener kila baada ya ujenzi mpya wa vifaa ili kuepuka kupoteza kumbukumbu
    setupSearchFeature();
}

function setupSearchFeature() {
    const searchInput = document.getElementById("news-search-input");
    if (!searchInput) return;

    // Ondoa listeners za zamani ili kuzuia matukio kujirudia (Event Doubling)
    searchInput.replaceWith(searchInput.cloneNode(true));
    
    const activeSearchInput = document.getElementById("news-search-input");
    activeSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterAndRenderCards(query);
    });
}

function filterAndRenderCards(query) {
    const container = document.getElementById("news-cards-container");
    if (!container) return;

    const cards = container.getElementsByClassName("col-md-6");
    
    if (cachedNewsItems.length === 0) return;

    cachedNewsItems.forEach((item, index) => {
        if (!cards[index]) return;

        const titleMatch = item.title.toLowerCase().includes(query);
        let paragraphMatch = false;

        if (item.paragraphs) {
            paragraphMatch = item.paragraphs.some(p => p.toLowerCase().includes(query));
        }

        if (titleMatch || paragraphMatch) {
            cards[index].style.setProperty("display", "block", "important");
        } else {
            cards[index].style.setProperty("display", "none", "important");
        }
    });
}

function generateNewsSchema(lang, fullLocalData) {
    const data = fullLocalData[lang] || fullLocalData;
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": window.location.origin + "/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "url": window.location.origin,
        "logo": window.location.origin + "/assets/img/logo.png",
        "sameAs": [
            "https://www.facebook.com/almamnawawi",
            "https://www.youtube.com/@almamnawawi",
            "https://twitter.com/almamnawawi"
        ],
        "knowsAbout": ["Islamic Education", "Arabic Language", "Qur'an Studies"],
        "legalName": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    const newsGraph = (data.news || []).map(h => ({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": h.title,
        "description": h.description || (h.paragraphs ? h.paragraphs.join(" ") : ""),
        "datePublished": h.date,
        "author": {
            "@type": "Organization",
            "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi"
        },
        "publisher": {
            "@type": "EducationalOrganization",
            "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
            "logo": {
                "@type": "ImageObject",
                "url": window.location.origin + "/assets/img/logo.png"
            }
        }
    }));

    document.querySelectorAll("script[data-schema-dynamic='news']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.setAttribute("data-schema-dynamic", "news");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (newsGraph.length > 0) {
        const scriptNews = document.createElement("script");
        scriptNews.type = "application/ld+json";
        scriptNews.setAttribute("data-schema-dynamic", "news");
        scriptNews.innerHTML = JSON.stringify(newsGraph);
        document.head.appendChild(scriptNews);
    }
}