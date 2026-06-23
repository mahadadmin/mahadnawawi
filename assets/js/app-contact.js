/**
 * Specialized Sub-runtime Context for Contact Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/contact.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderContactComponents(e.detail.lang, e.detail.localData);
        generateContactSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderContactComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateContactSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });

    setupContactFormHandler();
});

function renderContactComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // Render Contact Blocks & Info Cards Safely without innerHTML reflow mutation
    const contactInfoCardsContainer = document.getElementById("contactInfoCardsContainer");
    if (contactInfoCardsContainer) {
        contactInfoCardsContainer.innerHTML = ""; // Clear existing structural configurations
        
        if (data.contact_info && Array.isArray(data.contact_info.cards)) {
            const standardIcons = ["bi-geo-alt-fill", "bi-telephone-fill", "bi-envelope-fill"];
            
            data.contact_info.cards.forEach((item, index) => {
                const col = document.createElement("div");
                col.className = "col-md-4";
                
                const iconClass = standardIcons[index % standardIcons.length];
                
                col.innerHTML = `
                    <div class="custom-card p-4 h-100 text-center border-gold-top">
                        <div class="icon-box mx-auto mb-3">
                            <i class="bi ${iconClass} text-success fs-4"></i>
                        </div>
                        <h3 class="h5 mb-2 card-title fw-bold text-success">${escapeHtml(item.title)}</h3>
                        <p class="text-muted small mb-0 lh-base">${sanitizeHtmlStrings(item.desc)}</p>
                    </div>
                `;
                contactInfoCardsContainer.appendChild(col);
            });
        }
    }
}

function setupContactFormHandler() {
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (!contactForm.checkValidity()) {
                e.stopPropagation();
                contactForm.classList.add("was-validated");
                return;
            }

            const submitBtn = document.getElementById("formSubmitBtn");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;

            // System operational feedback pipeline simulation
            setTimeout(() => {
                alert("Ujumbe wako umetumwa kwa mafanikio! / Your message has been sent successfully!");
                contactForm.reset();
                contactForm.classList.remove("was-validated");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1200);
        });
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function sanitizeHtmlStrings(str) {
    if (!str) return "";
    // Allow basic structural breaks while keeping semantic bindings pure
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/&lt;br&gt;/g, "<br>");
}

function generateContactSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    const pageCanonical = window.GlobalAppCore.seo.computeCanonicalUrl(lang);
    
    // Clean up old instances of JSON-LD scripts to avoid memory leak or stale parsing context
    const redundantScripts = document.querySelectorAll("script[data-schema-page='contact']");
    redundantScripts.forEach(script => script.remove());

    const graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "ContactPage",
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
            },
            {
                "@type": "EducationalOrganization",
                "@id": "https://mahadnawawi.org/#organization",
                "name": "Ma'had Al-Imam An-Nawawi",
                "url": "https://mahadnawawi.org/index.html",
                "logo": "https://mahadnawawi.org/assets/img/logo.svg",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+255 776 000 598",
                    "contactType": "customer service",
                    "availableLanguage": ["Swahili", "English", "Arabic"]
                }
            }
        ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-page", "contact");
    script.innerHTML = JSON.stringify(graph);
    document.head.appendChild(script);
}

