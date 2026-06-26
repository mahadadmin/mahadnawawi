/**
 * Specialized Sub-runtime Context for News & Events Page Optimization
 * Consumes state streams provided by window.GlobalAppCore dynamically per locale.
 */

document.addEventListener("DOMContentLoaded", () => {
    const initialLang = window.GlobalAppCore?.state?.lang || "sw";
    window.GlobalAppCore.orchestrate(`assets/data/${initialLang}-news.json`);

    window.GlobalAppCore.events.on("corePipelineStabilized", (e) => {
        renderNewsComponents(e.detail.lang, e.detail.localData);
        generateNewsSchema(e.detail.lang, e.detail.localData);
    });

    window.GlobalAppCore.events.on("localeEngineSynced", (e) => {
        const mpyaLang = e.detail.lang;
        
        fetch(`assets/data/${mpyaLang}-news.json`)
            .then(res => res.json())
            .then(data => {
                renderNewsComponents(mpyaLang, data);
                generateNewsSchema(mpyaLang, data);
            })
            .catch(err => console.error("Imeshindwa kupakia faili la lugha mpya:", err));
    });
});

let cachedNewsItems = [];
let currentLang = "sw";
let currentLabel = "Ilichapishwa";
let currentNewLabel = "Mpya";

function renderNewsComponents(lang, fullLocalData) {
    const data = fullLocalData[lang] || fullLocalData;
    if (!data || !data.news) return;

    currentLang = lang;
    currentLabel = data.news_section?.published_label || "Ilichapishwa";
    currentNewLabel = data.news_section?.new_label || "Mpya";
    cachedNewsItems = data.news;

    MwagaHabari(cachedNewsItems);
    anzishaUtafutaji();
}

/**
 * Inatengeneza HTML ya aya kulingana na lugha ya sasa ya mfumo (RTL kwa 'ar' pekee)
 */
function formatParagraph(pText, lang, extraClass = "mb-3") {
    if (!pText) return "";
    
    const isAr = (lang === "ar");
    const direction = isAr ? 'dir="rtl"' : 'dir="ltr"';
    const alignment = isAr ? 'text-align: right;' : 'text-align: justify;';
    
    return `<p class="m-0 ${extraClass}" ${direction} style="${alignment}">${pText}</p>`;
}

function MwagaHabari(habariList) {
    const container = document.getElementById("courses-container");
    if (!container) return;

    container.innerHTML = "";

    if (habariList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-newspaper text-muted fs-1"></i>
                <p class="text-muted mt-2">Hakuna habari au matukio yaliyopatikana.</p>
            </div>
        `;
        return;
    }

    const readMoreLabels = {
        "sw": "Soma Zaidi",
        "en": "Read More",
        "ar": "اقرأ المزيد"
    };

    const readMoreText = readMoreLabels[currentLang] || "Read More";

    habariList.forEach((h, index) => {
        let tareheSanifu = h.date || "";
        const paragraphs = h.paragraphs || [];
        const descriptionHtmlId = `news-desc-${index}`;
        let descriptionHtml = "";

        if (paragraphs.length > 0) {
            // 1. Tenga utangulizi (hadi "Ama baad:") na aya za maudhui
            let utanguliziAya = [];
            let maudhuiAya = [];
            let kizingitiMaudhui = false;

            paragraphs.forEach(p => {
                if (!kizingitiMaudhui) {
                    utanguliziAya.push(p);
                    if (p.includes("Ama baad:") || p.includes("أما بعد:")) {
                        kizingitiMaudhui = true; 
                    }
                } else {
                    maudhuiAya.push(p);
                }
            });

            // Kama hakuna muundo wa "Ama baad:", chukua kila kitu kama maudhui
            if (maudhuiAya.length === 0) {
                utanguliziAya = [];
                maudhuiAya = [...paragraphs];
            }

            // 2. Chukua aya ya kwanza ya maudhui na kuikata katikati (maneno 25 ya mwanzo)
            const ayaYaKwanzaMaudhui = maudhuiAya[0] || "";
            const kikomoManeno = 25; 
            const maneno = ayaYaKwanzaMaudhui.split(/\s+/);
            
            let muhtasariMaudhui = ayaYaKwanzaMaudhui;
            let mabakiMaudhui = "";
            let inaMuendelezo = maudhuiAya.length > 1 || maneno.length > kikomoManeno;

            if (maneno.length > kikomoManeno) {
                muhtasariMaudhui = maneno.slice(0, kikomoManeno).join(" ") + "...";
                mabakiMaudhui = "..." + maneno.slice(kikomoManeno).join(" ");
            }

            // UTANGULIZI SASA UNACHAPISHWA KIKAMILIFU HAPA (HAUONDOKI)
            let htmlInayoonekana = utanguliziAya.map(p => formatParagraph(p, currentLang, "mb-2")).join("");
            
            // Hapa inaunganishwa na kile kipande cha kwanza cha aya ya kwanza ya maudhui
            htmlInayoonekana += formatParagraph(muhtasariMaudhui, currentLang, "news-excerpt mb-0");

            if (inaMuendelezo) {
                // Hapa tunaweka mabaki yaliyofichwa (mabaki ya aya ya kwanza + aya zote zilizobaki)
                let htmlIliyofichwa = "";
                if (mabakiMaudhui) {
                    htmlIliyofichwa += formatParagraph(mabakiMaudhui, currentLang, "mb-3 mt-2");
                }
                
                maudhuiAya.slice(1).forEach((p, idx, arr) => {
                    const isLast = (idx === arr.length - 1);
                    htmlIliyofichwa += formatParagraph(p, currentLang, isLast ? "mb-0 mt-3" : "mb-3 mt-3");
                });

                descriptionHtml = `
                <div id="${descriptionHtmlId}" class="text-secondary">
                    <div class="news-visible-part">
                        ${htmlInayoonekana}
                    </div>
                    <span class="news-full d-none">
                        ${htmlIliyofichwa}
                    </span>
                    <div class="mt-2 read-more-wrapper">
                        <a href="#"
                           class="btn btn-link p-0 text-gold fw-bold text-decoration-none read-more-toggle"
                           style="font-size: 0.9rem;"
                           onclick="
                               const parent = document.getElementById('${descriptionHtmlId}');
                               parent.querySelector('.news-full').classList.remove('d-none');
                               
                               const excerptEl = parent.querySelector('.news-excerpt');
                               if (excerptEl) { 
                                   excerptEl.classList.remove('mb-0'); 
                                   excerptEl.classList.add('mb-2');
                                   if(excerptEl.innerText.endsWith('...')) {
                                       excerptEl.innerText = excerptEl.innerText.slice(0, -3);
                                   }
                               }
                               this.remove();
                               return false;
                           ">
                            ${readMoreText} <i class="bi bi-chevron-down small"></i>
                        </a>
                    </div>
                </div>
                `;
            } else {
                descriptionHtml = `<div class="text-secondary">${htmlInayoonekana}</div>`;
            }
        } else if (h.description) {
            descriptionHtml = `<div class="text-secondary">${formatParagraph(h.description, currentLang, "mb-0")}</div>`;
        }

        // Mfumo wa Beji ya Mpya yenye uhuishaji wa Upole na rangi ya Gold maalum
        const isNew = niMpya(h.date);
        const newBadge = isNew 
            ? `<span class="placeholder-glow me-2 d-inline-block"><span class="badge placeholder d-inline-block animate-pulse" style="animation: pulse 1.5s infinite ease-in-out; --bs-placeholder-opacity: 1; width: auto; background-color: #c5a059 !important; color: #fff;">${currentNewLabel}</span></span>` 
            : "";

        const col = document.createElement("div");
        col.className = "col-12 mb-3";

        const cardDirection = (currentLang === "ar") ? 'dir="rtl"' : 'dir="ltr"';

        col.innerHTML = `
            <div class="card shadow-sm border-gold-top p-3 bg-transparent" ${cardDirection}>
                <div class="card-body p-0">
                    <small class="text-success fw-bold d-block mb-3">
                        <i class="bi bi-clock me-1"></i>
                        ${newBadge}
                        ${currentLabel}: ${tareheSanifu}
                    </small>
                    <h4 class="card-title fw-bold text-dark m-0 mb-2" style="line-height: 1.3; text-align: ${currentLang === 'ar' ? 'right' : 'left'};">
                        ${h.title}
                    </h4>
                    <div class="card-text mt-2">
                        ${descriptionHtml}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(col);
    });

    if (!document.getElementById("news-pulse-style")) {
        const style = document.createElement("style");
        style.id = "news-pulse-style";
        style.innerHTML = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

function niMpya(dateStr) {
    if (!dateStr) return false;
    try {
        let cleanDate = dateStr;
        if (dateStr.includes("/")) {
            cleanDate = dateStr.split("/")[0].trim();
        }
        if (cleanDate.includes("،")) {
            cleanDate = cleanDate.split("،")[1].trim();
        } else if (cleanDate.includes(",")) {
            cleanDate = cleanDate.split(",")[1].trim();
        }

        const arabicNorm = {"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
        cleanDate = cleanDate.replace(/[٠-٩]/g, function(d) { return arabicNorm[d]; });

        const arabicMonths = {
            "يناير": "January", "فبراير": "February", "مارس": "March", "أبريل": "April",
            "مايو": "May", "يونيو": "June", "يوليو": "July", "أغسطس": "August",
            "سبتمبر": "September", "أكتوبر": "October", "نوفمبر": "November", "ديسمبر": "December"
        };
        
        for (const [arMonth, enMonth] of Object.entries(arabicMonths)) {
            if (cleanDate.includes(arMonth)) {
                cleanDate = cleanDate.replace(arMonth, enMonth);
                break;
            }
        }

        const leo = new Date();
        const tareheHabari = new Date(cleanDate);

        if (isNaN(tareheHabari.getTime())) return false;

        const tofauti = (leo - tareheHabari) / (1000 * 60 * 60 * 24);
        return tofauti >= 0 && tofauti <= 7;
    } catch (e) {
        return false;
    }
}

function anzishaUtafutaji() {
    const searchInput = document.getElementById("newsSearch");
    if (!searchInput) return;

    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    newInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();

        const filtered = cachedNewsItems.filter(h => {
            const searchableText = `
                ${h.title}
                ${h.description || ""}
                ${(h.paragraphs || []).join(" ")}
            `.toLowerCase();

            return searchableText.includes(term);
        });

        MwagaHabari(filtered);
    });
}

function generateNewsSchema(lang, fullLocalData) {
    const data = fullLocalData[lang] || fullLocalData;
    if (!data) return;

    const organizationGraph = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://mahadnawawi.org/#organization",
        "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
        "description": data.organization?.description || ""
    };

    const newsGraph = (data.news || []).map(h => ({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": h.title,
        "description": h.description || (h.paragraphs ? h.paragraphs.join(" ") : ""),
        "datePublished": h.date,
        "author": {
            "@type": "Organization",
            "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi"
        },
        "publisher": {
            "@type": "EducationalOrganization",
            "name": data.organization?.name || "Ma'had Al-Imam An-Nawawi",
            "logo": {
                "@type": "ImageObject",
                "url": window.location.origin + "/assets/img/logo.png"
            }
        }
    }));

    document.querySelectorAll("script[data-schema-dynamic='news']").forEach(el => el.remove());

    const scriptOrg = document.createElement("script");
    scriptOrg.type = "application/ld+json";
    scriptOrg.setAttribute("data-schema-dynamic", "news");
    scriptOrg.innerHTML = JSON.stringify(organizationGraph);
    document.head.appendChild(scriptOrg);

    if (newsGraph.length > 0) {
        const scriptNews = document.createElement("script");
        scriptNews.type = "application/ld+json";
        scriptNews.setAttribute("data-schema-dynamic", "news");
        scriptNews.innerHTML = JSON.stringify(newsGraph);
        document.head.appendChild(scriptNews);
    }
}