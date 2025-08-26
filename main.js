// ==UserScript==
// @name         GS Citation Highlighter
// @namespace    http://tampermonkey.net/
// @description  Highlights Google Scholar search result entries
// @author       Trumpeter
// @match        https://scholar.google.com/*
// ==/UserScript==

(() => {
    'use strict';


    // Highlight the search entries

    // Ordered in terms of priority
    // First match is applied
    let rules = [];

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

            for (const rule of rules) {
                if (
                    metadata.year >= rule.yearRange.min &&
                    metadata.year <= rule.yearRange.max &&
                    metadata.numCitation >= rule.minNumCitation
                ) {
                    result.style.backgroundColor = rule.color;
                    break;
                }
            }
        }
    }


    // UI for editing rules

    // Create floating button
    const button = document.createElement('button');
    button.textContent = 'Highight';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.borderRadius = '5px';
    document.body.appendChild(button);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);

    // Create modal
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = 'white';
    modal.style.padding = '20px';
    modal.style.border = '1px solid black';
    modal.style.zIndex = '1001';
    modal.style.display = 'none';
    modal.style.maxWidth = '600px';
    modal.style.width = '90%';
    modal.style.maxHeight = '80%';
    modal.style.borderRadius = '10px';
    modal.style.overflowY = 'auto';
    modal.innerHTML = `
        <h2 style="margin-bottom: 10px;">Edit Highlight Rules</h2>
        <div id="rulesList"></div>
        <button id="addRule">Add Rule</button>
        <button id="saveRules" style="margin-left: 10px;">Save</button>
        <button id="cancelRules" style="margin-left: 10px;">Cancel</button>
    `;
    document.body.appendChild(modal);

    let tempRules = [];

    // Render rules in modal
    function renderRules() {
        const rulesList = document.getElementById('rulesList');
        rulesList.innerHTML = '';
        if (tempRules.length === 0) {
            const noRuleDiv = document.createElement('p');
            noRuleDiv.style.marginBottom = '10px';
            noRuleDiv.textContent = 'No rules defined yet';
            rulesList.appendChild(noRuleDiv);
        } else {
            tempRules.forEach((rule, index) => {
                const ruleDiv = document.createElement('div');
                ruleDiv.className = 'rule';
                ruleDiv.style.marginBottom = '10px';
                ruleDiv.style.padding = '10px';
                ruleDiv.style.border = '1px solid #ddd';
                ruleDiv.style.borderRadius = '5px';
                ruleDiv.style.display = 'flex';
                ruleDiv.style.flexDirection = 'column';
                ruleDiv.style.alignItems = 'flex-end';
                ruleDiv.innerHTML = `
                <div style="display: flex; flexDirection: row; gap: 10px;">
                    <label>Color: <input type="color" class="color" value="${rule.color}"></label>
                    <label>Min Year: <input type="number" class="minYear" value="${rule.yearRange.min === Number.NEGATIVE_INFINITY ? '' : rule.yearRange.min}" placeholder="-∞"></label>
                    <label>Max Year: <input type="number" class="maxYear" value="${rule.yearRange.max === Number.POSITIVE_INFINITY ? '' : rule.yearRange.max}" placeholder="∞"></label>
                    <label>Min Citations: <input type="number" class="minCit" value="${rule.minNumCitation}" min="0"></label>
                </div>
                <div style="display: flex; flexDirection: row; gap: 10px;">
                    <button class="up" ${index === 0 ? 'disabled' : ''}>↑ Up</button>
                    <button class="down" ${index === tempRules.length - 1 ? 'disabled' : ''}>↓ Down</button>
                    <button class="delete">Delete</button>
                </div>
            `;
                ruleDiv.querySelector('.up').addEventListener('click', () => moveRule(index, -1));
                ruleDiv.querySelector('.down').addEventListener('click', () => moveRule(index, 1));
                ruleDiv.querySelector('.delete').addEventListener('click', () => deleteRule(index));
                rulesList.appendChild(ruleDiv);
            });
        }
    }

    // Show modal
    function showModal() {
        tempRules = structuredClone(rules);
        renderRules();
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Apply changes to rules
    function changeRules() {
        const ruleDivs = document.querySelectorAll('.rule');
        const changedRules = [];
        for (const div of ruleDivs) {
            const color = div.querySelector('.color').value.trim();
            if (!color) {
                alert('Color cannot be empty.');
                return;
            }
            const minYearStr = div.querySelector('.minYear').value;
            const maxYearStr = div.querySelector('.maxYear').value;
            const minCitStr = div.querySelector('.minCit').value;

            const minYear = minYearStr ? parseInt(minYearStr, 10) : Number.NEGATIVE_INFINITY;
            const maxYear = maxYearStr ? parseInt(maxYearStr, 10) : Number.POSITIVE_INFINITY;
            const minCit = minCitStr ? parseInt(minCitStr, 10) : 0;

            if (isNaN(minYear) || isNaN(maxYear) || isNaN(minCit)) {
                alert('Invalid numbers entered.');
                return;
            }

            changedRules.push({
                color,
                yearRange: { min: minYear, max: maxYear },
                minNumCitation: minCit,
            });
        }
        tempRules = changedRules;
    }

    // Move rule
    function moveRule(index, delta) {
        changeRules();
        if (index + delta < 0 || index + delta >= tempRules.length) return;
        [tempRules[index], tempRules[index + delta]] = [tempRules[index + delta], tempRules[index]];
        renderRules();
    }

    // Delete rule
    function deleteRule(index) {
        changeRules();
        tempRules.splice(index, 1);
        renderRules();
    }

    // Add new rule
    function addRule() {
        changeRules();
        tempRules.push({
            color: '#ffffff',
            yearRange: { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY },
            minNumCitation: 0,
        });
        renderRules();
    }

    // Cancel editing
    function cancelEdit() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    // Save rules
    function saveRules() {
        changeRules();
        rules = structuredClone(tempRules);
        highlight(); // Reapply highlights
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    // Event listeners
    window.addEventListener("load", highlight);

    const observer = new MutationObserver(highlight);
    observer.observe(document.body, { childList: true, subtree: true });

    button.addEventListener('click', showModal);

    overlay.addEventListener('click', cancelEdit);

    document.getElementById('cancelRules').addEventListener('click', cancelEdit);

    document.getElementById('saveRules').addEventListener('click', saveRules);

    document.getElementById('addRule').addEventListener('click', addRule);
})();
