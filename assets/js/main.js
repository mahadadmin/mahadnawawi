/**
 * Core Global Architecture Framework File
 * Manages Core Global System States, Global/Local Data Ingestion Pipes,
 * Dynamic SEO Mutator Loops, Schema Graphs, Accessibility Trees and Light/Dark States.
 */

window.GlobalAppCore = (() => {
    const STATE = {
        lang: localStorage.getItem("language") || "sw",
        cache: new Map(),
        globalData: null,
        localData: null,
        newsData: null, // New State container to hold current active news slices
        activeTheme: localStorage.getItem("theme") || "light",
        localPathPattern: null 
    };

    const CONFIG = {
        supportedLangs: ["sw", "en", "ar"],
        defaultLang: "sw",
        paths: {
            global: "assets/data/global.json",
            // Mapping dynamic news profiles smoothly based on standard pattern design
            newsPattern: "assets/data/[lang]-news.json"
        }
    };

    class EventBus {
        static emit(event, detail) {
            window.dispatchEvent(new CustomEvent(event, { detail }));
        }
        static on(event, callback) {
            window.addEventListener(event, callback);
        }
    }

    class NetworkEngine {
        static async fetchJson(url) {
            if (STATE.cache.has(url)) {
                return STATE.cache.get(url);
            }
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
                const data = await response.json();
                STATE.cache.set(url, data);
                return data;
            } catch (error) {
                console.error(`Network Ingestion Failure on target [${url}]:`, error);
                throw error;
            }
        }
    }

    class I18nEngine {
        static translateNode(node, translationSlice) {
            const key = node.getAttribute("data-i18n");
            const localizedString = key.split('.').reduce((acc, current) => acc?.[current], translationSlice);
            if (localizedString !== undefined) {
                node.innerHTML = localizedString;
            }
        }

        static translateAttributes(node, translationSlice) {
            const rules = node.getAttribute("data-i18n-attr").split(",");
            rules.forEach(rule => {
                const [attrName, cryptoKey] = rule.split(":").map(s => s.trim());
                const localizedString = cryptoKey.split('.').reduce((acc, current) => acc?.[current], translationSlice);
                if (localizedString !== undefined) {
                    node.setAttribute(attrName, localizedString);
                }
            });
        }

        static executeDomSync() {
            const activeLang = STATE.lang;
            const currentGlobal = STATE.globalData?.[activeLang];
            const currentLocal = STATE.localData?.[activeLang] || STATE.localData;

            if (!currentGlobal) return;

            document.querySelectorAll("[data-i18n]").forEach(node => {
                const key = node.getAttribute("data-i18n");
                if (key.startsWith("global.") || key.startsWith("nav.") || key.startsWith("footer.") || key.startsWith("preloader.")) {
                    const normalizedKey = key.startsWith("global.") ? key.replace("global.", "") : key;
                    const localizedString = normalizedKey.split('.').reduce((acc, current) => acc?.[current], currentGlobal);
                    if (localizedString !== undefined) node.innerHTML = localizedString;
                } else if (currentLocal) {
                    this.translateNode(node, currentLocal);
                }
            });

            document.querySelectorAll("[data-i18n-attr]").forEach(node => {
                const attrExpr = node.getAttribute("data-i18n-attr");
                if (attrExpr.includes("nav.") || attrExpr.includes("footer.")) {
                    this.translateAttributes(node, currentGlobal);
                } else if (currentLocal) {
                    this.translateAttributes(node, currentLocal);
                }
            });

            const htmlNode = document.documentElement;
            htmlNode.setAttribute("lang", activeLang);
            htmlNode.setAttribute("dir", activeLang === "ar" ? "rtl" : "ltr");

            this.syncAccessibilityControls();
        }

        static syncAccessibilityControls() {
            document.querySelectorAll(".language-switcher .lang-btn").forEach(btn => {
                const matchesActive = btn.getAttribute("data-lang") === STATE.lang;
                btn.setAttribute("aria-pressed", matchesActive ? "true" : "false");
                if (matchesActive) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        }

        static async changeLanguage(targetLang) {
            if (!CONFIG.supportedLangs.includes(targetLang)) targetLang = CONFIG.defaultLang;
            STATE.lang = targetLang;
            localStorage.setItem("language", targetLang);

            // Fetch structural configuration if path contains dynamic token
            if (STATE.localPathPattern && STATE.localPathPattern.includes("[lang]")) {
                try {
                    const dynamicPath = STATE.localPathPattern.replace("[lang]", targetLang);
                    STATE.localData = await NetworkEngine.fetchJson(dynamicPath);
                } catch (error) {
                    console.error(`Marekebisho ya lugha yamefeli: ${targetLang}`, error);
                }
            }

            // Fetch dynamic external news files seamlessly matching the active locale pipeline
            try {
                const dynamicNewsPath = CONFIG.paths.newsPattern.replace("[lang]", targetLang);
                STATE.newsData = await NetworkEngine.fetchJson(dynamicNewsPath);
            } catch (error) {
                console.error(`News data hydration failed for: ${targetLang}`, error);
            }

            this.executeDomSync();
            EventBus.emit("localeEngineSynced", { lang: targetLang, localData: STATE.localData });
            EventBus.emit("newsPipelineReady", { lang: targetLang, newsData: STATE.newsData });
        }
    }

    class SEOEngine {
        static syncMetadata(localDataRoot) {
            if (!localDataRoot) return;
            const activeMeta = localDataRoot[STATE.lang]?.meta || localDataRoot.meta;
            if (!activeMeta) return;

            document.title = activeMeta.title;

            this.getOrCreateMeta("description", activeMeta.description);
            this.getOrCreateMeta("keywords", activeMeta.keywords);

            document.querySelectorAll("link[rel='alternate']").forEach(el => el.remove());
            
            CONFIG.supportedLangs.forEach(language => {
                const link = document.createElement("link");
                link.rel = "alternate";
                link.hreflang = language;
                link.href = this.computeCanonicalUrl(language);
                document.head.appendChild(link);
            });

            const defaultLink = document.createElement("link");
            defaultLink.rel = "alternate";
            defaultLink.hreflang = "x-default";
            defaultLink.href = this.computeCanonicalUrl(CONFIG.defaultLang);
            document.head.appendChild(defaultLink);

            this.syncSocialGraphs(activeMeta);
        }

        static syncSocialGraphs(meta) {
            const activeUrl = window.location.href;
            this.getOrCreateMetaProperty("og:title", meta.title);
            this.getOrCreateMetaProperty("og:description", meta.description);
            this.getOrCreateMetaProperty("og:url", activeUrl);
            this.getOrCreateMetaProperty("og:type", "website");
            this.getOrCreateMetaProperty("og:locale", STATE.lang === "sw" ? "sw_TZ" : STATE.lang === "ar" ? "ar_001" : "en_US");

            this.getOrCreateMetaProperty("twitter:card", "summary_large_image");
            this.getOrCreateMetaProperty("twitter:title", meta.title);
            this.getOrCreateMetaProperty("twitter:description", meta.description);
        }

        static getOrCreateMeta(name, content) {
            let el = document.querySelector(`meta[name='${name}']`);
            if (!el) {
                el = document.createElement("meta");
                el.name = name;
                document.head.appendChild(el);
            }
            el.content = content;
        }

        static getOrCreateMetaProperty(property, content) {
            let el = document.querySelector(`meta[property='${property}']`);
            if (!el) {
                el = document.createElement("meta");
                el.setAttribute("property", property);
                document.head.appendChild(el);
            }
            el.content = content;
        }

        static computeCanonicalUrl(language) {
            const locationRoot = window.location.origin + window.location.pathname;
            return `${locationRoot}?lang=${language}`;
        }
    }

    class SchemaEngine {
        static injectUnifiedGraph(graphData) {
            let scriptBlock = document.getElementById("structuredDataBlock");
            if (!scriptBlock) {
                scriptBlock = document.createElement("script");
                scriptBlock.id = "structuredDataBlock";
                scriptBlock.type = "application/ld+json";
                document.head.appendChild(scriptBlock);
            }
            scriptBlock.innerHTML = JSON.stringify(graphData);
        }
    }

    class ThemeEngine {
        static init() {
            this.applyTheme(STATE.activeTheme);
            const toggleBtn = document.getElementById("themeToggle");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    const nextTheme = STATE.activeTheme === "light" ? "dark" : "light";
                    STATE.activeTheme = nextTheme;
                    localStorage.setItem("theme", nextTheme);
                    this.applyTheme(nextTheme);
                });
            }
        }
        
        static applyTheme(theme) {
            const icon = document.getElementById("themeIcon");
            const htmlNode = document.documentElement;

            if (theme === "dark") {
                htmlNode.setAttribute("data-theme", "dark");
                document.body.classList.add("dark-theme-active"); 
                if (icon) { icon.className = "bi bi-sun"; }
            } else {
                htmlNode.setAttribute("data-theme", "light");
                document.body.classList.remove("dark-theme-active");
                if (icon) { icon.className = "bi bi-moon"; }
            }
        }
    }

    class PreloaderEngine {
        static kill() {
            const loader = document.getElementById("preloader");
            if (loader) {
                setTimeout(() => {
                    loader.style.transition = "opacity 0.4s ease-out, visibility 0.4s ease-out";
                    loader.style.opacity = "0";
                    loader.style.visibility = "hidden";
                    
                    setTimeout(() => loader.remove(), 400);
                }, 600);
            }
        }
    }

    const bootstrapCoreOrchestration = async (localPathFile) => {
        try {
            ThemeEngine.init();

            STATE.localPathPattern = localPathFile;
            const dynamicPath = localPathFile.replace("[lang]", STATE.lang);
            const dynamicNewsPath = CONFIG.paths.newsPattern.replace("[lang]", STATE.lang);

            // Fetch Global layout, Index structural content, and dynamic news arrays simultaneously
            const [globalData, localData, newsData] = await Promise.all([
                NetworkEngine.fetchJson(CONFIG.paths.global),
                NetworkEngine.fetchJson(dynamicPath),
                NetworkEngine.fetchJson(dynamicNewsPath)
            ]);

            STATE.globalData = globalData;
            STATE.localData = localData;
            STATE.newsData = newsData;

            I18nEngine.executeDomSync();
            SEOEngine.syncMetadata(localData);

            document.querySelectorAll(".language-switcher .lang-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const chosenLocale = e.target.getAttribute("data-lang");
                    I18nEngine.changeLanguage(chosenLocale);
                });
            });

            EventBus.emit("corePipelineStabilized", { lang: STATE.lang, localData: localData });
            // Signal index runtime to render standard dynamic components
            EventBus.emit("newsPipelineReady", { lang: STATE.lang, newsData: newsData });
            
            PreloaderEngine.kill();
        } catch (error) {
            console.error("Critical Failure in Application Lifecycle Initializer:", error);
            PreloaderEngine.kill(); 
        }
    };

    EventBus.on("localeEngineSynced", () => {
        SEOEngine.syncMetadata(STATE.localData);
    });

    return {
        orchestrate: bootstrapCoreOrchestration,
        state: STATE,
        events: EventBus,
        schema: SchemaEngine,
        seo: SEOEngine
    };
})();