/**
 * Specialized Sub-runtime Context for Publications Library Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.GlobalAppCore.orchestrate(
        "assets/data/publications.json"
    );

    window.GlobalAppCore.events.on(
        "corePipelineStabilized",
        (e) => {
            renderPublicationsComponents(
                e.detail.lang,
                e.detail.localData
            );

            generatePublicationsSchema(
                e.detail.lang,
                e.detail.localData
            );
        }
    );

    window.GlobalAppCore.events.on(
        "localeEngineSynced",
        (e) => {
            renderPublicationsComponents(
                e.detail.lang,
                window.GlobalAppCore.state.localData
            );

            generatePublicationsSchema(
                e.detail.lang,
                window.GlobalAppCore.state.localData
            );
        }
    );
});

let cachedPublicationsItems = [];

function renderPublicationsComponents(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data || !data.publications) return;

    cachedPublicationsItems = data.publications;

    MwagaMachapisho(
        cachedPublicationsItems,
        data
    );

    anzishaUtafutaji();
}

function MwagaMachapisho(vitabuList, data) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";
    const ui = data?.ui || {};

    if (!vitabuList || vitabuList.length === 0) {
        container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-book-half text-muted fs-1"></i>
            <p class="text-muted mt-2">
                ${ui.no_books || "Hakuna vitabu vilivyopatikana."}
            </p>
        </div>`;
        return;
    }

    vitabuList.forEach(v => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-4";

        col.innerHTML = `
        <div class="card h-100 shadow-sm border-gold-top p-2">
            <div class="text-center p-3 bg-white rounded">
                <img 
                    src="${escapeHtml(v.cover)}"
                    class="img-fluid"
                    style="max-height:180px;object-fit:contain;"
                    alt="${escapeHtml(v.title)}">
            </div>

            <div class="card-body d-flex flex-column justify-content-between">
                <div>
                    <h5 class="card-title text-success fw-bold mt-2">
                        ${escapeHtml(v.title)}
                    </h5>

                    <p class="card-text text-secondary mb-2">
                        <i class="bi bi-person-fill text-gold me-1"></i>
                        <strong>${escapeHtml(v.author)}</strong>
                    </p>

                    <p class="text-muted small">
                        ${escapeHtml(v.description)}
                    </p>
                </div>

                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-outline-success btn-sm w-50" onclick="window.open('${escapeHtml(v.link)}','_blank')">
                        <i class="bi bi-eye"></i>
                        ${ui.read_book || "Soma"}
                    </button>

                    <a class="btn btn-success btn-sm w-50" href="${escapeHtml(v.link)}" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-download"></i>
                        ${ui.download_pdf || "Pakua"}
                    </a>
                </div>
            </div>
        </div>
        `;

        container.appendChild(col);
    });
}

function anzishaUtafutaji() {
    const searchInput = document.getElementById("publicationSearch");
    if (!searchInput) return;

    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();

        const filtered = cachedPublicationsItems.filter(v =>
            v.title.toLowerCase().includes(term) ||
            v.author.toLowerCase().includes(term)
        );

        const currentData = window.GlobalAppCore.state.localData?.[window.GlobalAppCore.state.lang];

        MwagaMachapisho(filtered, currentData);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generatePublicationsSchema(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    const booksGraph = (data.publications || []).map(v => ({
        "@context": "https://schema.org",
        "@type": "Book",
        "name": v.title,
        "description": v.description,
        "image": window.location.origin + "/" + v.cover,
        "url": v.link,
        "author": {
            "@type": "Person",
            "name": v.author
        }
    }));

    document.querySelectorAll("script[data-schema-dynamic='publications']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.dataset.schemaDynamic = "publications";
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (booksGraph.length) {
        const scriptBooks = document.createElement("script");
        scriptBooks.type = "application/ld+json";
        scriptBooks.dataset.schemaDynamic = "publications";
        scriptBooks.innerHTML = JSON.stringify(booksGraph);
        document.head.appendChild(scriptBooks);
    }
}

