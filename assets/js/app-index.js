/**
 * Specialized Sub-runtime Context for Index Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/index.json");

    // 2. Render static layout once structural core stabilizes
    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderIndexComponents(e.detail.lang, e.detail.localData);
        generateIndexSchema(e.detail.lang);
    });

    // 3. Render news component ONLY when dynamic language-specific news feeds are loaded
    window.GlobalAppCore.events.on("newsPipelineReady", (e) => {
        renderHomeNewsArticles(e.detail.lang, e.detail.newsData, window.GlobalAppCore.state.localData);
    });

    // 4. Re-sync structural pieces upon locale engine changes
    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderIndexComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateIndexSchema(e.detail.lang);
    });
});

function renderIndexComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // Render Features Container Section Structure
    const featuresContainer = document.getElementById("featuresContainer");
    if (featuresContainer) {
        featuresContainer.innerHTML = ""; 
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

// Function to handle rendering top 3 articles from active [lang]-news.json
function renderHomeNewsArticles(lang, newsData, fullLocalData) {
    const indexData = fullLocalData[lang];
    const newsContainer = document.getElementById("newsArticlesContainer");
    if (!newsContainer || !indexData || !newsData) return;

    newsContainer.innerHTML = "";
    
    // Utafutaji wa safu ya habari kutoka kwenye muundo wa JSON
    const articlesArray = newsData.news || newsData.articles || newsData;
    if (!Array.isArray(articlesArray)) return;

    // Kuchukua habari 3 za mwanzo
    const topThreeArticles = articlesArray.slice(0, 3);

    // Kupata neno la kibandiko cha "Mpya" kutoka kwenye index.json (kama halipo tunaweka 'Mpya')
    const newLabel = indexData.news_section.new_label || (lang === "ar" ? "جديد" : lang === "en" ? "New" : "Mpya");

    topThreeArticles.forEach(article => {
        // Angalia kama habari ni mpya (Siku 3 tangu ichapishwe)
        const isNew = checkIsNew(article.date);
        const newBadgeHtml = isNew ? `<span class="badge bg-danger ms-2">${escapeHtml(newLabel)}</span>` : "";

        const col = document.createElement("div");
        col.className = "col-lg-4";
        col.innerHTML = `
            <div class="custom-card shadow-sm h-100 position-relative">
                <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(article.date)}
                        </small>
                        ${newBadgeHtml}
                    </div>
                    <h4 class="mt-2 fw-bold">${escapeHtml(article.title)}</h4>
                    <p class="text-muted mb-4">${escapeHtml(article.description || (article.paragraphs ? article.paragraphs[0] : ""))}</p>
                    <a href="habari.html" class="btn btn-secondary-brand mt-auto align-self-start">${escapeHtml(indexData.news_section.btn_read_more)}</a>
                </div>
            </div>
        `;
        newsContainer.appendChild(col);
    });
}

// Utendaji wa kuangalia kama tarehe ipo ndani ya siku 3 zilizopita (Kama ilivyo kwenye app-news.js)
function checkIsNew(dateStr) {
    if (!dateStr) return false;
    try {
        const cleanStr = dateStr.split("/")[0].replace(/[^,a-zA-Z0-9\s]/g, '').trim();
        const commaIdx = cleanStr.indexOf(',');
        const targetStr = commaIdx !== -1 ? cleanStr.substring(commaIdx + 1).trim() : cleanStr;
        
        const parsed = Date.parse(targetStr);
        if (isNaN(parsed)) return false;
        
        const diffTime = Math.abs(new Date() - new parsed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    } catch (e) {
        return false;
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
    if (!str) return "";
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