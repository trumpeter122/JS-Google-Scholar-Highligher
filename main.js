// ==UserScript==
// @name         GS Citation Highlighter
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Highlights Google Scholar search result entries: yellow if citation count >= 10, light gray if < 10 or no citations, light blue if the title suggests it's a review (contains 'review' or 'survey')
// @author       Trumpeter
// @match        https://scholar.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const extractMetadata = (result) => {
        // Default to light gray for <10 or no citations
        result.style.backgroundColor = 'lightgray';
        
        const resultMetadata = {};
        
        // Find the citation link
        const citationLink = result.querySelector('div.gs_fl a[href*="cites"]');
        
        if (citationLink) {
            // Extract the citation count text, e.g., "Cited by 123"
            const citationText = citationLink.textContent;
            const match = citationText.match(/Cited by (\d+)/)
            
            if (match) {
                resultMetadata['citations'] = parseInt(match[1], 10);
            }
        }

        // Find the brief information
        const label = result.querySelector('div.gs_a');

        if (label) {
            const labelText = label.textContent;
            const match = labelText.match(/,\s*(\d{4})\s*-/);

            if (match) {
                resultMetadata['year'] = match[1];
            }
        }

        return resultMetadata
    }

    // Function to highlight results
    function highlightResults() {
        // Find all result divs
        const results = document.querySelectorAll('div.gs_r.gs_or.gs_scl');
        
        results.forEach(result => {
            const metadata = extractMetadata(result);

            if (
                metadata['citations'] > 10 ||
                (metadata['citations'] > 5 && Number(metadata['year']) >= 2024)
            ) {
                result.style.backgroundColor = 'powderblue';
            } else {
                result.style.backgroundColor = 'lightgray';
            }
        });

    }

    // Run the function after the page loads
    window.addEventListener('load', highlightResults);

    // Also run on dynamic changes if needed (e.g., for infinite scroll or AJAX loads)
    // If Google Scholar loads more results dynamically, you might need a MutationObserver
    const observer = new MutationObserver(highlightResults);
    observer.observe(document.body, { childList: true, subtree: true });
})();