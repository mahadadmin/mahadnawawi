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
    const data = fullLocalData[lang] || fullLocalData;
    if (!data || !data.news) return;

    currentLang = lang;
    currentLabel = data.news_section?.published_label || "Ilichapishwa";
    currentNewLabel = data.news_section?.new_label || "Mpya";
    cachedNewsItems = data.news;

    const searchInput = document.getElementById("newsSearch");
    if (searchInput && data.news_section?.search_placeholder) {
        searchInput.placeholder = data.news_section.search_placeholder;
    }

    // Tafsiri herobanner kiotomatiki hapa hapa kwenye app-news.js
    const heroTitleEl = document.querySelector('[data-i18n="hero.title"]');
    if (heroTitleEl && data.hero && data.hero.title) {
        heroTitleEl.textContent = data.hero.title;
    }

    filterAndRenderNews(searchInput ? searchInput.value : "");
}

function filterAndRenderNews(searchTerm) {
    const container = document.getElementById("newsContainer");
    if (!container) return;

    container.innerHTML = "";
    const term = searchTerm.trim().toLowerCase();

    const filtered = cachedNewsItems.filter(item => {
        if (!term) return true;
        const matchesTitle = item.title?.toLowerCase().includes(term);
        const matchesContent = item.paragraphs?.some(p => p.toLowerCase().includes(term));
        return matchesTitle || matchesContent;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search display-4 text-muted mb-3 d-block"></i>
                <p class="text-muted fs-5 fw-medium">Hakuna habari au tukio lililopatikana.</p>
            </div>
        `;
        return;
    }

    const isRtl = currentLang === "ar";

    filtered.forEach((item, index) => {
        const isFirstItem = index === 0 && !term;
        const colClass = isFirstItem ? "col-12 mb-4" : "col-md-6 mb-4";
        const cardClass = isFirstItem ? "card h-100 shadow-sm featured-news-card border-0 overflow-hidden" : "card h-100 shadow-sm border-0 news-grid-card";
        const rowClass = isFirstItem ? "row g-0 h-100" : "";
        
        let cardBodyContent = `
            <div class="card-body d-flex flex-column p-4">
                <div class="d-flex align-items-center justify-content-between mb-3 text-muted small">
                    <span class="d-flex align-items-center gap-1">
                        <i class="bi bi-calendar3"></i>
                        <span>${item.date}</span>
                    </span>
                    ${isFirstItem ? `<span class="badge bg-danger px-2 py-1 align-middle rounded-1 fw-semibold text-uppercase d-flex align-items-center gap-1" style="font-size: 0.75rem;"><i class="bi bi-fire"></i> ${currentNewLabel}</span>` : ""}
                </div>
                <h3 class="${isFirstItem ? "h2" : "h5"} card-title fw-bold mb-3 line-clamp-2">
                    <a href="habari-id.html?id=${item.id}" class="text-decoration-none text-dark dynamic-news-link">${item.title}</a>
                </h3>
                <p class="card-text text-secondary mb-4 flex-grow-1 ${isFirstItem ? "line-clamp-3" : "line-clamp-2"}">
                    ${item.paragraphs && item.paragraphs[0] ? item.paragraphs[0] : ""}
                </p>
                <div class="mt-auto pt-2">
                    <a href="habari-id.html?id=${item.id}" class="btn ${isFirstItem ? "btn-primary btn-lg px-4" : "btn-outline-primary w-100"} fw-semibold d-inline-flex align-items-center justify-content-center gap-2 dynamic-news-link">
                        <span>Soma Zaidi</span>
                        <i class="bi ${isRtl ? "bi-arrow-left" : "bi-arrow-right"}"></i>
                    </a>
                </div>
            </div>
        `;

        let finalHtml = "";
        if (isFirstItem) {
            finalHtml = `
                <div class="${colClass}">
                    <article class="${cardClass}">
                        <div class="${rowClass}">
                            <div class="col-lg-6 position-relative min-vh-25 min-vh-lg-100">
                                <img src="assets/img/news-placeholder.jpg" alt="${item.title}" class="img-fluid w-100 h-100 object-fit-cover position-absolute top-0 start-0">
                            </div>
                            <div class="col-lg-6 d-flex flex-column justify-content-center">
                                ${cardBodyContent}
                            </div>
                        </div>
                    </article>
                </div>
            `;
        } else {
            finalHtml = `
                <div class="${colClass}">
                    <article class="${cardClass}">
                        <div class="position-relative" style="height: 220px;">
                            <img src="assets/img/news-placeholder.jpg" alt="${item.title}" class="card-img-top h-100 w-100 object-fit-cover">
                        </div>
                        ${cardBodyContent}
                    </article>
                </div>
            `;
        }

        container.insertAdjacentHTML("beforeend", finalHtml);
    });

    setupSearchInputListener();
}

function setupSearchInputListener() {
    const searchInput = document.getElementById("newsSearch");
    if (!searchInput || searchInput.dataset.listenerAttached) return;

    searchInput.addEventListener("input", (e) => {
        filterAndRenderNews(e.target.value);
    });
    searchInput.dataset.listenerAttached = "true";
}

function generateNewsSchema(lang, fullLocalData) {
    const data = fullLocalData[lang] || fullLocalData;
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
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
    scriptOrg.setAttribute(\"data-schema-dynamic\", \"news\");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (newsGraph.length > 0) {
        const scriptNews = document.createElement("script");
        scriptNews.type = "application/ld+json";
        scriptNews.setAttribute(\"data-schema-dynamic\", \"news\");
        scriptNews.innerHTML = JSON.stringify(newsGraph);
        document.head.appendChild(scriptNews);
    }
}