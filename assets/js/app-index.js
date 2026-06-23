/**
 * Specialized Sub-runtime Context for Index Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/index.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderIndexComponents(e.detail.lang, e.detail.localData);
        generateIndexSchema(e.detail.lang);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderIndexComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateIndexSchema(e.detail.lang);
    });
});

function renderIndexComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // Render Features Container Section Structure safely without innerHTML reflow mutation
    const featuresContainer = document.getElementById("featuresContainer");
    if (featuresContainer) {
        featuresContainer.innerHTML = ""; // Clear existing structural configurations
        data.features.items.forEach(item => {
            const col = document.createElement("div");
            col.className = "col-lg-4";
            col.innerHTML = `
                <div class="custom-card p-4 h-100 text-center">
                    <div class="icon-box mx-auto">
                        <i class="bi ${escapeHtml(getFeatureIcon(item.title))}" aria-hidden="true"></i>
                    </div>
                    <h4 class="fw-bold mt-3">${escapeHtml(item.title)}</h4>
                    <p class="text-muted mb-0">${escapeHtml(item.desc)}</p>
                </div>
            `;
            featuresContainer.appendChild(col);
        });
    }

    // Render Subjects Sub-Matrices arrays
    renderSubjectLists("primarySubjects", data.levels.primary.subjects);
    renderSubjectLists("preparatorySubjects", data.levels.preparatory.subjects);

    // Render News Section Feeds Arrays
    const newsContainer = document.getElementById("newsArticlesContainer");
    if (newsContainer) {
        newsContainer.innerHTML = "";
        data.news_section.articles.forEach(article => {
            const col = document.createElement("div");
            col.className = "col-lg-4";
            col.innerHTML = `
                <div class="custom-card shadow-sm h-100">
                    <div class="card-body p-4 d-flex flex-column">
                        <small class="text-muted"><i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(article.date)}</small>
                        <h4 class="mt-3 fw-bold">${escapeHtml(article.title)}</h4>
                        <p class="text-muted mb-4">${escapeHtml(article.desc)}</p>
                        <a href="habari.html" class="btn btn-secondary-brand mt-auto align-self-start">${escapeHtml(data.news_section.btn_read_more)}</a>
                    </div>
                </div>
            `;
            newsContainer.appendChild(col);
        });
    }

    // Render Library Cards Grid
    const libraryContainer = document.getElementById("libraryCardsContainer");
    if (libraryContainer) {
        libraryContainer.innerHTML = "";
        data.library_section.cards.forEach((card, idx) => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-6";
            col.innerHTML = `
                <div class="custom-card p-4 h-100 text-center d-flex flex-column">
                    <div class="icon-box mx-auto">
                        <i class="bi ${escapeHtml(getLibraryIcon(idx))}" aria-hidden="true"></i>
                    </div>
                    <h4 class="fw-bold mt-3">${escapeHtml(card.title)}</h4>
                    <p class="text-muted mb-4">${escapeHtml(card.desc)}</p>
                    <a href="${escapeHtml(getLibraryUrl(idx))}" class="btn btn-secondary-brand mt-auto">${escapeHtml(data.library_section.btn_open)}</a>
                </div>
            `;
            libraryContainer.appendChild(col);
        });
    }
}

function renderSubjectLists(elementId, subjectsArray) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;
    listElement.innerHTML = "";
    subjectsArray.forEach(subject => {
        const li = document.createElement("li");
        li.className = "mb-2";
        li.innerHTML = `<i class="bi bi-check-circle-fill text-gold me-2" aria-hidden="true"></i>${escapeHtml(subject)}`;
        listElement.appendChild(li);
    });
}

function getFeatureIcon(title) {
    const map = {
        "Elimu ya Kiislamu": "bi-book", "Islamic Education": "bi-book", "العلوم الشرعية": "bi-book",
        "Lugha ya Kiarabu": "bi-translate", "Arabic Language": "bi-translate", "اللغة العربية": "bi-translate",
        "Malezi na Adabu": "bi-people", "Tarbiya and Adab": "bi-people", "التربية والآداب": "bi-people"
    };
    return map[title] || "bi-star";
}

function getLibraryIcon(index) {
    const icons = ["bi-headphones", "bi-camera-video", "bi-file-earmark-text", "bi-book"];
    return icons[index] || "bi-folder";
}

function getLibraryUrl(index) {
    const urls = ["sauti.html", "video.html", "machapisho.html", "machapisho.html"];
    return urls[index] || "#";
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateIndexSchema(lang) {
    const rootCanonical = window.GlobalAppCore.seo.computeCanonicalUrl(lang);
    const graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "EducationalOrganization",
                "@id": "https://mahadnawawi.org/#organization",
                "name": "Ma'had Al-Imam An-Nawawi",
                "url": "https://mahadnawawi.org/index.html",
                "logo": "https://mahadnawawi.org/assets/img/logo.svg",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Mwera",
                    "addressRegion": "Zanzibar",
                    "addressCountry": "TZ"
                }
            },
            {
                "@type": "WebPage",
                "@id": rootCanonical,
                "url": rootCanonical,
                "name": document.title,
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://mahadnawawi.org/#website",
                    "name": "Ma'had Al-Imam An-Nawawi",
                    "url": "https://mahadnawawi.org/"
                }
            }
        ]
    };
    window.GlobalAppCore.schema.injectUnifiedGraph(graph);
}

