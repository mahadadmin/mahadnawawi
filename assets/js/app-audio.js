/**
 * Specialized Sub-runtime Context for Audio Library Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    window.GlobalAppCore.orchestrate("assets/data/audio.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderAudioComponents(
            e.detail.lang,
            e.detail.localData
        );

        generateAudioSchema(
            e.detail.lang,
            e.detail.localData
        );
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderAudioComponents(
            e.detail.lang,
            window.GlobalAppCore.state.localData
        );

        generateAudioSchema(
            e.detail.lang,
            window.GlobalAppCore.state.localData
        );
    });
});

let cachedAudioItems = [];

function renderAudioComponents(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data || !data.sauti) return;

    cachedAudioItems = data.sauti;

    mwagaSauti(
        cachedAudioItems,
        data
    );

    anzishaUtafutaji();
}

function mwagaSauti(audioList, data) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";
    const ui = data?.ui || {};

    if (!audioList || audioList.length === 0) {
        container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-music-note-beamed text-muted fs-1"></i>
            <p class="text-muted mt-2">
                ${ui.no_audio || "Hakuna darsa zilizopatikana."}
            </p>
        </div>
        `;
        return;
    }

    audioList.forEach(s => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 mb-4";

        col.innerHTML = `
        <div class="card h-100 shadow-sm border-gold-top">
            <div class="card-body d-flex flex-column justify-content-between">
                <div>
                    <h5 class="card-title text-success fw-bold">
                        ${escapeHtml(s.kichwa)}
                    </h5>

                    <p class="text-muted small mb-3">
                        <i class="bi bi-person-fill text-gold me-1"></i>
                        ${escapeHtml(s.mzungumzaji)}
                    </p>
                </div>

                <div>
                    <audio controls class="w-100 mt-2">
                        <source src="${escapeHtml(s.faili)}" type="audio/mpeg">
                        ${ui.audio_not_supported || "Browser haitumii audio player."}
                    </audio>

                    <a href="${escapeHtml(s.faili)}" download class="btn btn-sm btn-outline-success w-100 mt-3">
                        <i class="bi bi-download"></i>
                        ${ui.download_audio || "Pakua Sauti"}
                    </a>
                </div>
            </div>
        </div>
        `;

        container.appendChild(col);
    });
}

function anzishaUtafutaji() {
    const searchInput = document.getElementById("audioSearch");
    if (!searchInput) return;

    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();

        const filtered = cachedAudioItems.filter(s =>
            s.kichwa.toLowerCase().includes(term) ||
            s.mzungumzaji.toLowerCase().includes(term)
        );

        mwagaSauti(
            filtered,
            window.GlobalAppCore.state.localData?.[window.GlobalAppCore.state.lang]
        );
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

function generateAudioSchema(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    const audioObjectsGraph = (data.sauti || []).map(s => ({
        "@context": "https://schema.org",
        "@type": "AudioObject",
        "name": s.kichwa,
        "author": {
            "@type": "Person",
            "name": s.mzungumzaji
        },
        "contentUrl": window.location.origin + "/" + s.faili,
        "duration": s.muda
    }));

    document.querySelectorAll("script[data-schema-dynamic='audio']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.setAttribute("data-schema-dynamic", "audio");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (audioObjectsGraph.length > 0) {
        const scriptAudio = document.createElement("script");
        scriptAudio.type = "application/ld+json";
        scriptAudio.setAttribute("data-schema-dynamic", "audio");
        scriptAudio.innerHTML = JSON.stringify(audioObjectsGraph);
        document.head.appendChild(scriptAudio);
    }
}

