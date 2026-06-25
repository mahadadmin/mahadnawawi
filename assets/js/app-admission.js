/**
 * Specialized Sub-runtime Context for Admission & Registration Page Optimization
 * Consumes state streams provided by window.GlobalAppCore.
 */

document.addEventListener("DOMContentLoaded", () => {
    if (!window.GlobalAppCore) return;

    window.GlobalAppCore.orchestrate("assets/data/admission.json");

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderAdmissionComponents(e.detail.lang, e.detail.localData);
        generateAdmissionSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        renderAdmissionComponents(e.detail.lang, window.GlobalAppCore.state.localData);
        generateAdmissionSchema(e.detail.lang, window.GlobalAppCore.state.localData);
    });
});

function renderAdmissionComponents(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data?.admission) return;

    const container = document.getElementById("admission-container");
    if (!container) return;

    const d = data.admission;

    // ===============================
    // 1. Schedule → CARD SYSTEM (NO TABLE)
    // ===============================
    let scheduleCards = "";
    if (Array.isArray(d.schedule) && d.schedule.length > 0) {
        scheduleCards = d.schedule.map(r => `
            <div class="card mb-3 border-0 shadow-sm bg-light rounded border-start border-4 border-success">
                <div class="card-body py-3 px-4">
                    <div class="row align-items-center">

                        <div class="col-md-5 mb-2 mb-md-0">
                            <div class="fw-bold text-dark">
                                ${escapeHtml(r.event)}
                            </div>
                        </div>

                        <div class="col-md-3 text-md-center mb-2 mb-md-0">
                            <span class="badge bg-success text-white px-3 py-2">
                                <i class="bi bi-calendar3 me-1"></i>
                                ${escapeHtml(r.hijri)}
                            </span>
                        </div>

                        <div class="col-md-4 text-md-end">
                            <span class="text-secondary small">
                                <i class="bi bi-calendar-event me-1"></i>
                                ${escapeHtml(r.gregorian)}
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        `).join("");
    }

    // ===============================
    // 2. Centers
    // ===============================
    let centersItems = "";
    if (Array.isArray(d.centers) && d.centers.length > 0) {
        centersItems = d.centers.map(v => `
            <li class="mb-3">
                <strong>${escapeHtml(v.name)}</strong><br>
                <small class="text-muted">
                    <i class="bi bi-telephone me-1"></i>
                    ${escapeHtml(d.centers_phone_label)}: ${escapeHtml(v.phone)}
                </small>
            </li>
        `).join("");
    }

    // ===============================
    // 3. Requirements
    // ===============================
    let requirementsItems = "";
    if (Array.isArray(d.requirements) && d.requirements.length > 0) {
        requirementsItems = d.requirements.map(req => `
            <li class="mb-2">${escapeHtml(req)}</li>
        `).join("");
    }

    // ===============================
    // MAIN UI
    // ===============================
    container.innerHTML = `
        <div class="row">

            <div class="col-lg-8">

                <h4 class="text-dark fw-bold mb-3">
                    ${escapeHtml(d.section_title)}
                </h4>

                <div class="d-flex align-items-center mb-4 p-3 bg-light rounded border-start border-4 border-success">
                    <span class="badge bg-success me-3 fs-6">
                        ${escapeHtml(d.status)}
                    </span>
                    <span class="text-secondary small">
                        <i class="bi bi-calendar-event me-1"></i>
                        ${escapeHtml(
                            d.deadline_label ||
                            (lang === "en"
                                ? "Deadline:"
                                : lang === "ar"
                                ? "الموعد النهائي:"
                                : "Mwisho:")
                        )}
                        ${escapeHtml(d.deadline)}
                    </span>
                </div>

                <h5 class="text-dark fw-bold mb-3">
                    ${escapeHtml(d.schedule_title)}
                </h5>

                <div class="mb-4 schedule-card-wrapper">
                    ${scheduleCards}
                </div>

                <h5 class="text-dark fw-bold mb-3 mt-4">
                    ${escapeHtml(d.fees_title)}
                </h5>

                <div class="p-4 bg-light rounded mb-4">
                    <ul class="mb-0 ps-3 text-secondary">
                        <li class="mb-2">
                            <strong>${escapeHtml(d.fee_form_label)}:</strong>
                            ${escapeHtml(d.fees?.form)}
                        </li>
                        <li class="mb-2">
                            <strong>${escapeHtml(d.fee_registration_label)}:</strong>
                            ${escapeHtml(d.fees?.registration)}
                        </li>
                        <li class="mb-2">
                            <strong>${escapeHtml(d.fee_annual_label)}:</strong>
                            ${escapeHtml(d.fees?.annual_fee)}
                        </li>
                    </ul>
                </div>

                <h5 class="text-dark fw-bold mb-3 mt-4">
                    ${escapeHtml(d.requirements_title)}
                </h5>

                <div class="p-4 bg-light rounded mb-4">
                    <ul class="mb-0 ps-3 text-secondary" style="text-align: justify;">
                        ${requirementsItems}
                    </ul>
                </div>

            </div>

            <div class="col-lg-4">

                <div class="card shadow-sm border-gold-top bg-light">
                    <div class="card-body p-4">

                        <h5 class="card-title text-success fw-bold border-bottom pb-2 mb-3">
                            <i class="bi bi-building me-2"></i>
                            ${escapeHtml(d.centers_title)}
                        </h5>

                        <ul class="list-unstyled mb-0 text-secondary">
                            ${centersItems}
                        </ul>

                    </div>
                </div>

            </div>
        </div>
    `;
}

// ===============================
// SECURITY HELPER
// ===============================
function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===============================
// JSON-LD SCHEMA
// ===============================
function generateAdmissionSchema(lang, fullLocalData) {
    const data = fullLocalData?.[lang];
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    document
        .querySelectorAll("script[data-schema-dynamic='admission']")
        .forEach(el => el.remove());

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-dynamic", "admission");
    script.textContent = JSON.stringify(organizationGraph);

    document.head.appendChild(script);
}

