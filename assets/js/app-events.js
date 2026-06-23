/**
 * Specialized Sub-runtime Context for Upcoming Events Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/events.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderEventsComponents(e.detail.lang, e.detail.localData);
        generateEventsSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderEventsComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateEventsSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

let cachedEventsItems = [];
let currentLang = "sw";
let timeLabel = "Muda";
let locationLabel = "Mahali";

function renderEventsComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data || !data.events) return;

    currentLang = lang;
    timeLabel = data.events_section?.time_label || "Muda";
    locationLabel = data.events_section?.location_label || "Mahali";
    cachedEventsItems = data.events;

    MwagaMatukio(cachedEventsItems);
    anzishaUtafutaji();
}

function MwagaMatukio(matukioList) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";

    if (matukioList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-calendar-x text-muted fs-1"></i>
                <p class="text-muted mt-2">Hakuna matukio yaliyopatikana.</p>
            </div>
        `;
        return;
    }

    matukioList.forEach(m => {
        // Kubadili tarehe kwenda mfumo wa lugha iliyochaguliwa (Isipokuwa kama ni maandishi kama "Kila Ijumaa")
        let tareheSanifu = m.date;
        try {
            const mabadilikoyaTarehe = new Date(m.date);
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

        const col = document.createElement("div");
        col.className = "col-md-6 mb-4";
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-gold-top bg-light">
                <div class="card-body d-flex flex-column justify-content-between p-4">
                    <div>
                        <h4 class="card-title fw-bold text-dark mb-3">${escapeHtml(m.title)}</h4>
                        <p class="mb-2 text-secondary small"><i class="bi bi-calendar3 text-gold me-2"></i>${escapeHtml(tareheSanifu)}</p>
                        <p class="mb-2 text-secondary small"><i class="bi bi-alarm text-gold me-2"></i><strong>${escapeHtml(timeLabel)}:</strong> ${escapeHtml(m.time)}</p>
                        <p class="mb-0 text-secondary small"><i class="bi bi-geo-alt text-gold me-2"></i><strong>${escapeHtml(locationLabel)}:</strong> ${escapeHtml(m.location)}</p>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function anzishaUtafutaji() {
    const searchInput = document.getElementById("eventsSearch");
    if (!searchInput) return;

    // Ondoa listeners za zamani kwa kureplace element
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = cachedEventsItems.filter(m => 
            m.title.toLowerCase().includes(term) || 
            m.location.toLowerCase().includes(term) ||
            m.date.toLowerCase().includes(term)
        );
        MwagaMatukio(filtered);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateEventsSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // 1. Structural Base Schema Configuration
    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadannawawi.com/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    // 2. Event Schema Pipeline Collection
    const eventsGraph = (data.events || []).map(m => {
        let isoDate = m.date;
        const checkDate = new Date(m.date);
        if (isNaN(checkDate.getTime())) {
            // Kama tarehe si halali ya ISO (mfano "Kila Ijumaa"), weka tarehe ya sasa kama fallback kwa Schema compliance
            isoDate = new Date().toISOString().split('T')[0];
        }

        return {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": m.title,
            "startDate": isoDate,
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
                "@type": "Place",
                "name": m.location,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Zanzibar",
                    "addressCountry": "TZ"
                }
            },
            "description": `${m.title} - ${m.time}`,
            "organizer": {
                "@type": "EducationalOrganization",
                "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi"
            }
        };
    });

    // Dynamic Script Injection Logic
    document.querySelectorAll("script[data-schema-dynamic='events']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.setAttribute("data-schema-dynamic", "events");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (eventsGraph.length > 0) {
        const scriptEv = document.createElement("script");
        scriptEv.type = "application/ld+json";
        scriptEv.setAttribute("data-schema-dynamic", "events");
        scriptEv.innerHTML = JSON.stringify(eventsGraph);
        document.head.appendChild(scriptEv);
    }
}

