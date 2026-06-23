/**
 * Specialized Sub-runtime Context for Courses Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/courses.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderCoursesComponents(e.detail.lang, e.detail.localData);
        generateCoursesSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderCoursesComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateCoursesSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

function renderCoursesComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data || !data.courses || !data.courses.items) return;

    const container = document.getElementById("courses-container");
    if (!container) return;

    // Kuchora kadi za kozi kwa kufuata muundo asili wa madaraja (classes) na mpangilio wa lugha bila kupunguza maudhui
    container.innerHTML = data.courses.items.map((k, index) => {
        // Kupata majina ya kozi kutoka kwenye data kulingana na muktadha wa lugha asili ilivyosanifiwa kwenye JSON ya kozi
        const swName = fullLocalData["sw"]?.courses?.items[index]?.name || k.name;
        const arName = fullLocalData["ar"]?.courses?.items[index]?.name || k.name;
        const currentName = k.name;

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm border-gold-top">
                    <div class="card-body">
                        <h6 class="text-muted mb-1">
                            <span class="badge bg-light text-success border border-success">${index + 1}</span>
                        </h6>
                        <h5 class="card-title text-success fw-bold">${escapeHtml(currentName)}</h5>
                        ${lang !== 'ar' ? `<h5 class="card-title arabic-text text-gold mt-2" dir="rtl">${escapeHtml(arName)}</h5>` : ''}
                        ${lang === 'ar' ? `<h5 class="card-title text-gold mt-2 small opacity-75">${escapeHtml(swName)}</h5>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateCoursesSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data || !data.courses || !data.courses.items) return;

    // SEO JSON-LD: Dynamic Schema Generation kwa ajili ya ItemList ya Elimu
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": data.courses.section_title || "Courses Offered",
        "itemListElement": data.courses.items.map((k, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": k.name
        }))
    };

    // Dynamic Script Injection Logic
    document.querySelectorAll("script[data-schema-dynamic='courses']").forEach(el => el.remove());

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-dynamic", "courses");
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);
}

