/**
 * Specialized Sub-runtime Context for About Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/about.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderAboutComponents(e.detail.lang, e.detail.localData);
        generateAboutSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderAboutComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateAboutSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

function renderAboutComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // Render Vision & Mission Container Section Structure aligned perfectly with Core Values card UI configuration
    const visionMissionContainer = document.getElementById("visionMissionContainer");
    if (visionMissionContainer) {
        visionMissionContainer.innerHTML = ""; // Clear existing structural configurations
        
        if (Array.isArray(data.vision_mission)) {
            data.vision_mission.forEach((item, index) => {
                const col = document.createElement("div");
                col.className = "col-md-6";
                
                // Assign appropriate branding icon based on structural index alignment
                const iconClass = index === 0 ? "bi-eye-fill" : "bi-bullseye";
                
                // Transformed layout syntax to match exactly with rulesContainer style
                col.innerHTML = `
                    <div class="custom-card p-4 h-100">
                        <div class="d-flex align-items-start gap-3">
                            <div class="icon-box flex-shrink-0">
                                <i class="bi ${iconClass}"></i>
                            </div>
                            <div>
                                <h3 class="h5 mb-2 card-title">${escapeHtml(item.title)}</h3>
                                <p class="text-muted small mb-0 lh-base">${escapeHtml(item.desc)}</p>
                            </div>
                        </div>
                    </div>
                `;
                visionMissionContainer.appendChild(col);
            });
        }
    }

    // Render Core Values Container Section Structure safely without innerHTML reflow mutation
    const rulesContainer = document.getElementById("rulesContainer");
    if (rulesContainer) {
        rulesContainer.innerHTML = ""; // Clear existing structural configurations
        
        if (data.rules_section && Array.isArray(data.rules_section.items)) {
            // Predefined static interface mapping layout icons to match UI headings layout metrics
            const standardIcons = ["bi-heart-fill", "bi-star-fill", "bi-person-check-fill"];
            
            data.rules_section.items.forEach((item, index) => {
                const col = document.createElement("div");
                col.className = "col-lg-4 col-md-6";
                
                const iconClass = standardIcons[index % standardIcons.length];
                
                col.innerHTML = `
                    <div class="custom-card p-4 h-100">
                        <div class="d-flex align-items-start gap-3">
                            <div class="icon-box flex-shrink-0">
                                <i class="bi ${iconClass}"></i>
                            </div>
                            <div>
                                <h3 class="h5 mb-2 card-title">${escapeHtml(item.title)}</h3>
                                <p class="text-muted small mb-0 lh-base">${escapeHtml(item.desc)}</p>
                            </div>
                        </div>
                    </div>
                `;
                rulesContainer.appendChild(col);
            });
        }
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateAboutSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    const pageCanonical = window.GlobalAppCore.seo.computeCanonicalUrl(lang);
    
    // Clean up old instances of JSON-LD scripts to avoid memory leak or stale parsing context
    const redundantScripts = document.querySelectorAll("script[data-schema-page='about']");
    redundantScripts.forEach(script => script.remove());

    const graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "EducationalOrganization",
                "@id": "https://mahadannawawi.com/#organization",
                "name": "Ma'had Al-Imam An-Nawawi",
                "url": "https://mahadannawawi.com/index.html",
                "logo": "https://mahadannawawi.com/assets/img/logo.svg",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Mwera",
                    "addressRegion": "Zanzibar",
                    "addressCountry": "TZ"
                }
            },
            {
                "@type": "AboutPage",
                "@id": pageCanonical,
                "url": pageCanonical,
                "name": document.title,
                "description": data.meta ? data.meta.description : "",
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://mahadnawawi.org/#website",
                    "name": "Ma'had Al-Imam An-Nawawi",
                    "url": "https://mahadnawawi.org/"
                },
                "mainEntity": {
                    "@type": "EducationalOrganization",
                    "name": "Ma'had Al-Imam An-Nawawi",
                    "description": data.about_section ? data.about_section.p1 : ""
                }
            }
        ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-page", "about");
    script.innerHTML = JSON.stringify(graph);
    document.head.appendChild(script);
}

