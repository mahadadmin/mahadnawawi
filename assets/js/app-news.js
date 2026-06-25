/**
 * Specialized Sub-runtime Context for News & Events Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.GlobalAppCore.orchestrate("assets/data/news.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderNewsComponents(e.detail.lang, e.detail.localData);
        generateNewsSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderNewsComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateNewsSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

let cachedNewsItems = [];
let currentLang = "sw";
let currentLabel = "Ilichapishwa";

function renderNewsComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data || !data.news) return;

    currentLang = lang;
    currentLabel = data.news_section?.published_label || "Ilichapishwa";
    cachedNewsItems = data.news;
    
    MwagaHabari(cachedNewsItems);
    anzishaUtafutaji();
}

function MwagaHabari(habariList) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";

    if (habariList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-newspaper text-muted fs-1"></i>
                <p class="text-muted mt-2">Hakuna habari au matukio yaliyopatikana.</p>
            </div>
        `;
        return;
    }

    const readMoreLabels = {
        "sw": "Soma Zaidi",
        "en": "Read More",
        "ar": "اقرأ المزيد"
    };
    const readMoreText = readMoreLabels[currentLang] || "Read More";

    habariList.forEach(h => {
        let tareheSanifu = h.date;
        try {
            const mabadilikoyaTarehe = new Date(h.date);
            if (!isNaN(mabadilikoyaTarehe.getTime())) {
                tareheSanifu = new Intl.DateTimeFormat(currentLang, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(mabadilikoyaTarehe);
            }
        } catch (e) {
            console.error("Mfumo wa tarehe una hitilafu:", e);
        }

        const paragraphs = h.paragraphs || [];
        const fullText = paragraphs.join("\n\n");
        const charLimit = 250;
        
        let descriptionHtml = "";
        
        if (fullText.length > charLimit) {
            // Kuchukua aya ya kwanza tu kama dondoo fupi (excerpt)
            const firstParagraph = paragraphs[0] || "";
            
            // Kuzalisha HTML ya aya zote kamili zilizofungwa kwenye <p> tags
            const fullParagraphsHtml = paragraphs.map(p => `<p class="mb-3" style="text-align: justify;">${escapeHtml(p)}</p>`).join('');
            
            descriptionHtml = `
                <div class="news-description text-secondary">
                    <div class="news-excerpt">
                        <p style="text-align: justify; margin-bottom: 0.5rem;">${escapeHtml(firstParagraph.substring(0, charLimit))}...</p>
                        <a href="#" class="btn btn-link p-0 text-gold fw-bold text-decoration-none read-more-toggle" onclick="const container = this.closest('.news-description'); container.querySelector('.news-excerpt').classList.add('d-none'); container.querySelector('.news-full').classList.remove('d-none'); return false;">${escapeHtml(readMoreText)}</a>
                    </div>
                    <div class="news-full d-none">
                        ${fullParagraphsHtml}
                    </div>
                </div>
            `;
        } else {
            const fullParagraphsHtml = paragraphs.map(p => `<p class="mb-3" style="text-align: justify;">${escapeHtml(p)}</p>`).join('');
            descriptionHtml = `
                <div class="news-description text-secondary">
                    ${fullParagraphsHtml}
                </div>
            `;
        }

        const col = document.createElement("div");
        col.className = "col-12 mb-4";
        col.innerHTML = `
            <div class="card shadow-sm border-gold-top p-3 bg-light">
                <div class="card-body">
                    <small class="text-success fw-bold">
                        <i class="bi bi-clock me-1"></i> ${escapeHtml(currentLabel)}: ${escapeHtml(tareheSanifu)}
                    </small>
                    <h4 class="card-title fw-bold text-dark mt-2 mb-1">${escapeHtml(h.title)}</h4>
                    <div class="card-text text-secondary mt-1">
                        ${descriptionHtml}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function anzishaUtafutaji() {
    const searchInput = document.getElementById("newsSearch");
    if (!searchInput) return;

    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = cachedNewsItems.filter(h => {
            const paragraphsText = (h.paragraphs || []).join(" ").toLowerCase();
            return h.title.toLowerCase().includes(term) || paragraphsText.includes(term);
        });
        MwagaHabari(filtered);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateNewsSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    const newsGraph = (data.news || []).map(h => ({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": h.title,
        "description": (h.paragraphs || [])[0] || h.title,
        "articleBody": (h.paragraphs || []).join("\n\n"),
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