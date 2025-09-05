// ==UserScript==
// @name         TTRS Full Mod Toolkit + GUI overlay
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Override TTRS balance & unlock all shop items (refresh & avatar/shop/info hooks)
// @match        https://play.ttrockstars.com/*
// @match        https://nest.ttrockstars.com/avatar/shop/info*
// @grant        none
// @author       MegaCode111
// ==/UserScript==

(function() {
    'use strict';

    // ————————————————————————————————————————————————
    // Persistent coin value
    // ————————————————————————————————————————————————
    let TARGET_COINS = localStorage.getItem('ttrs_mod_coins');
    TARGET_COINS = TARGET_COINS ? parseInt(TARGET_COINS) : null;

    // ————————————————————————————————————————————————
    // Fetch override
    // ————————————————————————————————————————————————
    const _fetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;

        if (url.includes('/auth3/token/refresh?includeSummary=true')) {
            return _fetch(input, init).then(res => {
                return res.clone().json().then(data => {
                    if (TARGET_COINS !== null && data.user?.ttrs) {
                        data.user.ttrs.coins = TARGET_COINS;
                        data.user.ttrs.totalCoins = TARGET_COINS;
                    }
                    if (TARGET_COINS !== null && data.finance) {
                        data.finance.total = TARGET_COINS;
                    }
                    return new Response(JSON.stringify(data), res);
                });
            });
        }

        return _fetch(input, init);
    };

    // ————————————————————————————————————————————————
    // DOM override (force re-render)
    // ————————————————————————————————————————————————
    function overrideDOM() {
        if (TARGET_COINS !== null) {
            const spans = [...document.querySelectorAll('span')];
            spans.forEach(span => {
                if (span.textContent.replace(/,/g, '') === '3175') {
                    span.textContent = TARGET_COINS.toLocaleString();
                }
            });
        }
    }

    window.addEventListener('load', overrideDOM);
    new MutationObserver(() => {
        overrideDOM();
    }).observe(document.body, { childList: true, subtree: true });

    // ————————————————————————————————————————————————
    // GUI Panel (Draggable + Resizable + Visible Input)
    // ————————————————————————————————————————————————
    function createOverlay() {
        const panel = document.createElement('div');
        panel.id = 'ttrs-mod-panel';
        panel.style.position = 'fixed';
        panel.style.top = '20px';
        panel.style.right = '20px';
        panel.style.zIndex = '9999';
        panel.style.background = '#111';
        panel.style.color = '#fff';
        panel.style.padding = '12px';
        panel.style.borderRadius = '8px';
        panel.style.fontFamily = 'monospace';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        panel.style.resize = 'both';
        panel.style.overflow = 'auto';
        panel.style.width = '220px';
        panel.style.cursor = 'move';

        panel.innerHTML = `
      <div style="margin-bottom: 8px;"><strong>TTRS Mod Panel</strong></div>
      <input id="coinInput" type="number" placeholder="Enter coins" style="width: 100%; padding: 4px; margin-bottom: 6px; background:#222; color:#0f0; border:1px solid #555;" />
      <button id="setCoinsBtn" style="width: 100%; margin-bottom: 6px;">Inject Coins</button>
      <button id="clearCoinsBtn" style="width: 100%; margin-bottom: 6px;">Clear Coins</button>
    `;
        document.body.appendChild(panel);

        // Drag logic
        let isDragging = false, offsetX, offsetY;
        panel.addEventListener('mousedown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener('mousemove', e => {
            if (isDragging) {
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
            }
        });
        document.addEventListener('mouseup', () => isDragging = false);

        // Button logic
        document.getElementById('setCoinsBtn').onclick = () => {
            const val = parseInt(document.getElementById('coinInput').value);
            if (!isNaN(val)) {
                TARGET_COINS = val;
                localStorage.setItem('ttrs_mod_coins', val);
                overrideDOM();
                alert(`Coins set to ${val}. Reload shop to apply.`);
            } else {
                alert('Please enter a valid number.');
            }
        };

        document.getElementById('clearCoinsBtn').onclick = () => {
            localStorage.removeItem('ttrs_mod_coins');
            TARGET_COINS = null;
            alert('Coin override cleared. Reload to restore original balance.');
        };
    }

    window.addEventListener('load', createOverlay);
})();
