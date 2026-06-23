/**
 * Specialized Sub-runtime Context for Articles Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/articles.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderArticlesComponents(e.detail.lang, e.detail.localData);
        generateArticlesSchema(e.detail.lang, e.detail.localData);
        setupSearchPipeline(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        const freshLocalData = window.GlobalAppCore.state.localData;
        renderArticlesComponents(e.detail.lang, freshLocalData);
        generateArticlesSchema(e.detail.lang, freshLocalData);
        setupSearchPipeline(e.detail.lang, freshLocalData);
    });
});

function renderArticlesComponents(lang, fullLocalData, filteredItems = null) {
    const data = fullLocalData[lang];
    if (!data) return;

    const articlesGridContainer = document.getElementById("articlesGridContainer");
    if (!articlesGridContainer) return;
    
    articlesGridContainer.innerHTML = ""; // Clear active context map

    // Choose between unfiltered state array and search payload stream
    const itemsToRender = filteredItems || (data.articles_section ? data.articles_section.items : []);
    const section = data.articles_section;

    if (!itemsToRender || itemsToRender.length === 0) {
        articlesGridContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search text-muted fs-1"></i>
                <p class="text-muted mt-2 small">Hakuna matokeo yaliyopatikana / No articles found</p>
            </div>`;
        return;
    }

    itemsToRender.forEach(item => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";

        col.innerHTML = `
            <div class="custom-card h-100 d-flex flex-column border-gold-top">
                <div class="p-4 d-flex flex-column flex-grow-1">
                    <div class="d-flex align-items-center justify-content-between mb-3 text-muted small">
                        <span class="d-flex align-items-center gap-1">
                            <i class="bi bi-calendar3 text-success"></i> ${escapeHtml(item.date)}
                        </span>
                        <span class="d-flex align-items-center gap-1">
                            <i class="bi bi-clock text-success"></i> ${escapeHtml(item.duration)} ${escapeHtml(section.read_time)}
                        </span>
                    </div>
                    
                    <h3 class="h5 card-title fw-bold text-success mb-2">${escapeHtml(item.title)}</h3>
                    
                    <p class="text-muted small mb-4 flex-grow-1 lh-base">${escapeHtml(item.excerpt)}</p>
                    
                    <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
                        <span class="text-muted small">
                            <i class="bi bi-person-fill text-success me-1"></i>${escapeHtml(section.written_by)} <strong class="text-dark">${escapeHtml(item.author)}</strong>
                        </span>
                        <a href=#"makala-single.html?id=${item.id}" class="btn btn-link text-success fw-bold p-0 text-decoration-none small d-flex align-items-center gap-1">
                            ${escapeHtml(section.btn_read)} <i class="bi bi-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        articlesGridContainer.appendChild(col);
    });
}

function setupSearchPipeline(lang, fullLocalData) {
    const searchInput = document.getElementById("articleSearch");
    if (!searchInput) return;

    // Reset old bound events by replicating node state to stop event multiplication leak
    const clearedInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(clearedInput, searchInput);

    clearedInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const data = fullLocalData[lang];
        if (!data || !data.articles_section || !data.articles_section.items) return;

        if (term === "") {
            renderArticlesComponents(lang, fullLocalData);
            return;
        }

        const filtered = data.articles_section.items.filter(item => 
            (item.title && item.title.toLowerCase().includes(term)) || 
            (item.author && item.author.toLowerCase().includes(term)) ||
            (item.excerpt && item.excerpt.toLowerCase().includes(term))
        );

        renderArticlesComponents(lang, fullLocalData, filtered);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateArticlesSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    const pageCanonical = window.GlobalAppCore.seo.computeCanonicalUrl(lang);
    const redundantScripts = document.querySelectorAll("script[data-schema-page='articles']");
    redundantScripts.forEach(script => script.remove());

    const graphElements = [
        {
            "@type": "CollectionPage",
            "@id": pageCanonical,
            "url": pageCanonical,
            "name": document.title,
            "description": data.meta ? data.meta.description : "",
            "isPartOf": {
                "@type": "WebSite",
                "@id": "https://mahadannawawi.com/#website",
                "name": "Ma'had Al-Imam An-Nawawi",
                "url": "https://mahadannawawi.com/"
            }
        }
    ];

    if (data.articles_section && Array.isArray(data.articles_section.items)) {
        data.articles_section.items.forEach(item => {
            graphElements.push({
                "@type": "Article",
                "@id": `https://mahadannawawi.com/makala-single.html?id=${item.id}`,
                "headline": item.title,
                "description": item.excerpt,
                "datePublished": item.date,
                "author": {
                    "@type": "Person",
                    "name": item.author
                },
                "publisher": {
                    "@type": "EducationalOrganization",
                    "@id": "https://mahadnawawi.org/#organization",
                    "name": "Ma'had Al-Imam An-Nawawi",
                    "logo": "https://mahadnawawi.org/assets/img/logo.svg"
                },
                "mainEntityOfPage": `https://mahadnawawi.org/makala-single.html?id=${item.id}`
            });
        });
    }

    const graph = {
        "@context": "https://schema.org",
        "@graph": graphElements
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-page", "articles");
    script.innerHTML = JSON.stringify(graph);
    document.head.appendChild(script);
}

