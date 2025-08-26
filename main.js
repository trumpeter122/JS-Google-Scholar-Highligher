// ==UserScript==
// @name         GS Citation Highlighter
// @namespace    http://tampermonkey.net/
// @description  Highlights Google Scholar search result entries
// @author       Trumpeter
// @match        https://scholar.google.com/*
// ==/UserScript==

(() => {
    // Ordered in terms of priority
    // First match is applied
    const highlights = {
        lavender: {
            yearRange: { min: 2020, max: 2025 },
            minNumCitation: 20,
        },
        lightcyan: {
            yearRange: { min: 2010, max: 2025 },
            minNumCitation: 10,
        },
        // Default
        aliceblue: {
            yearRange: {
                min: Number.NEGATIVE_INFINITY,
                max: Number.POSITIVE_INFINITY,
            },
            minNumCitation: 0,
        },
    };

    // Extracts metadata from a single search result entry
    const extractMetadata = (result) => {
        return {
            numCitation: (() => {
                try {
                    const match = result
                        .querySelector('div.gs_fl a[href*="cites"]')
                        .textContent.match(/Cited by (\d+)/);
                    return Number.parseInt(match[1], 10) || 0;
                } catch (e) {
                    return 0;
                }
            })(),
            year: (() => {
                try {
                    const match = result
                        .querySelector("div.gs_a")
                        .textContent.match(/, (\d{4})/);
                    return (
                        Number.parseInt(match[1], 10) ||
                        Number.NEGATIVE_INFINITY
                    );
                } catch (e) {
                    return Number.NEGATIVE_INFINITY;
                }
            })(),
        };
    };

    // Highlights search result entries based on metadata
    function highlight() {
        const results = document.querySelectorAll("div.gs_r.gs_or.gs_scl");

        for (const result of results) {
            const metadata = extractMetadata(result);

            for (const [color, condition] of Object.entries(highlights)) {
                console.log(`Highlighting with ${color}:`, metadata);
                if (
                    metadata.year >= condition.yearRange.min &&
                    metadata.year <= condition.yearRange.max &&
                    metadata.numCitation >= condition.minNumCitation
                ) {
                    result.style.backgroundColor = color;
                    break;
                }
            }
        }
    }

    // Run highlight on page load and when DOM changes
    window.addEventListener("load", highlight);

    const observer = new MutationObserver(highlight);
    observer.observe(document.body, { childList: true, subtree: true });
})();
