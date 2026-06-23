/**
 * Specialized Sub-runtime Context for Video Library Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Direct initialization pass pointing back into structural json stores
    window.GlobalAppCore.orchestrate("assets/data/video.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderVideoComponents(e.detail.lang, e.detail.localData);
        generateVideoSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderVideoComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateVideoSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

let cachedVideoItems = [];
let currentLang = "sw"; // Hifadhi active language context kwa ajili ya search-trigger filters

function renderVideoComponents(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data || !data.video) return;

    currentLang = lang; // Update active runtime language
    cachedVideoItems = data.video;
    
    // Pata label ya kupakua kutoka kwenye JSON kulingana na lugha iliyopo, weka fallback ikikosekana
    const downloadLabel = data.video_section?.download_video || "Pakua Video";
    
    MwagaVideo(cachedVideoItems, downloadLabel);
    anzishaUtafutaji(downloadLabel);
}

function MwagaVideo(videoList, downloadLabel) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";

    if (videoList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-camera-video-off text-muted fs-1"></i>
                <p class="text-muted mt-2">Hakuna video zilizopatikana.</p>
            </div>
        `;
        return;
    }

    const cards = videoList.map(v => {
        // Kubadili muundo wa ISO duration (Mfano: PT45M kwenda 45 Min au sawa)
        let mudaSafi = v.duration ? v.duration.replace('PT', '').replace('M', ' Min').replace('S', ' Sec') : '';
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm border-gold-top">
                    <div class="ratio ratio-16x9">
                        <video controls preload="metadata" class="card-img-top">
                            <source src="${escapeHtml(v.faili)}" type="video/mp4">
                            Kivinjari chako hakiauni video ya MP4.
                        </video>
                    </div>
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title text-success fw-bold mt-2">${escapeHtml(v.kichwa)}</h5>
                            <p class="card-text text-secondary mb-1">
                                <i class="bi bi-person-circle text-gold me-1"></i> <strong>${escapeHtml(v.mwalimu)}</strong>
                            </p>
                            <p class="small text-muted mb-3">
                                <i class="bi bi-calendar-event me-1"></i> ${escapeHtml(v.tarehe)} ${mudaSafi ? `| <i class="bi bi-clock me-1"></i> ${escapeHtml(mudaSafi)}` : ''}
                            </p>
                        </div>
                        <a href="${escapeHtml(v.faili)}" download class="btn btn-sm btn-outline-success w-100 mt-2">
                            <i class="bi bi-download"></i> ${escapeHtml(downloadLabel)}
                        </a>
                    </div>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = cards;
}

function anzishaUtafutaji(downloadLabel) {
    const searchInput = document.getElementById("videoSearch");
    if (!searchInput) return;

    // Ondoa listeners za zamani kwa kureplace element
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = cachedVideoItems.filter(v => 
            v.kichwa.toLowerCase().includes(term) || 
            v.mwalimu.toLowerCase().includes(term)
        );
        MwagaVideo(filtered, downloadLabel);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function generateVideoSchema(lang, fullLocalData) {
    const data = fullLocalData[lang];
    if (!data) return;

    // 1. Structural Base Schema Configuration
    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    // 2. VideoObject Pipeline Collection
    const videoObjectsGraph = (data.video || []).map(v => ({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": v.kichwa,
        "description": `Video ya elimu na ${v.mwalimu}`,
        "uploadDate": v.tarehe,
        "contentUrl": window.location.origin + "/" + v.faili,
        "thumbnailUrl": [window.location.origin + "/assets/img/hero_bg.jpg"],
        "duration": v.duration,
        "author": {
            "@type": "Person",
            "name": v.mwalimu
        }
    }));

    // Dynamic Script Injection Logic
    document.querySelectorAll("script[data-schema-dynamic='video']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.setAttribute("data-schema-dynamic", "video");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (videoObjectsGraph.length > 0) {
        const scriptVideo = document.createElement("script");
        scriptVideo.type = "application/ld+json";
        scriptVideo.setAttribute("data-schema-dynamic", "video");
        scriptVideo.innerHTML = JSON.stringify(videoObjectsGraph);
        document.head.appendChild(scriptVideo);
    }
}

