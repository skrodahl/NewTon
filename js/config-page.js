// config-page.js - Global Settings page: controls, unsaved changes, one save bar
//
// The form's inputs keep their ids, and the steppers, segmented buttons and lane chips
// write into hidden fields with the original ids. So applyConfigToUI() fills the form and
// the save functions in results-config.js read it, exactly as before; this file only adds
// the controls on top, tracks what has changed, and saves everything in one go
// (saveAllSettings()). Leaving the page with unsaved changes asks to save or discard.

/**
 * The Global Settings page.
 */
const ConfigPage = (() => {
    let saved = null;          // the form as last saved or loaded
    let pendingPage = null;    // where the user was going when asked to save
    let bound = false;

    const $ = id => document.getElementById(id);
    const root = () => $('config');
    const isOpen = () => !!(root() && root().classList.contains('active'));

    const HANDOVER_TEXT = {
        qr: 'QR shows a code for the Chalker to scan.',
        network: 'Sends the match to a Chalker on the local network. Experimental, and <b>needs the Docker image</b>: it does nothing when this file is opened directly or on the hosted version.',
        none: 'Results are entered by hand.'
    };

    // ---------- controls on top of the hidden fields ----------
    function stepperText(step, v) {
        if (step.dataset.format === 'bo') return 'Bo' + v;
        if (step.dataset.format === 'darts') return v + ' darts';
        return String(v);
    }
    function drawStepper(step) {
        const input = $(step.dataset.target);
        const min = +step.dataset.min, max = +step.dataset.max;
        let v = parseInt(input.value);
        if (isNaN(v)) v = min;
        step.querySelector('output').textContent = stepperText(step, v);
        const [down, up] = step.querySelectorAll('button');
        down.disabled = v <= min;
        up.disabled = v >= max;
    }
    function drawPressed(group, value) {
        group.querySelectorAll('button[data-value]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
    }
    function drawLaneChips() {
        const host = $('cfgLaneChips');
        const max = parseInt($('maxLanes').value) || 1;
        const excluded = new Set(parseExcludedLanesString($('excludedLanes').value || ''));
        host.innerHTML = '';
        for (let i = 1; i <= max; i++) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'cfg-lane';
            b.textContent = i;
            b.setAttribute('aria-pressed', String(excluded.has(i)));
            b.setAttribute('aria-label', `Lane ${i}${excluded.has(i) ? ', not in use' : ''}`);
            b.addEventListener('click', () => {
                excluded.has(i) ? excluded.delete(i) : excluded.add(i);
                $('excludedLanes').value = [...excluded].sort((a, b) => a - b).join(',');
                drawLaneChips();
                refresh();
            });
            host.appendChild(b);
        }
    }
    function drawX01() {
        const custom = $('chalkerX01CustomToggle').checked;
        drawPressed($('cfgX01Seg'), custom ? 'other' : $('chalkerX01Format').value);
    }
    function drawLogo() {
        const img = document.querySelector('#clubLogo img');
        const preview = $('cfgLogoPreview');
        if (img && img.src) { preview.src = img.src; preview.hidden = false; } else preview.hidden = true;
    }

    /** A verified remote server locks its address and key; "Change…" asks before unlocking. */
    function drawRemoteLock() {
        const locked = $('remoteServerVerified').value === '1';
        $('remoteServerUrl').readOnly = locked;
        $('remoteServerApiKey').readOnly = locked;
        $('remoteLockNote').hidden = !locked;
    }
    function closeUnlock() { $('cfgUnlock').hidden = true; }
    function unlockRemote() {
        closeUnlock();
        $('remoteServerApiKey').value = '';
        $('remoteTestResult').hidden = true;
        $('remoteServerVerified').value = '';
        $('remoteServerVerified').dispatchEvent(new Event('input', { bubbles: true }));
        $('remoteServerApiKey').focus();
    }

    /** Round Robin's panel only while the format is offered; its cup rows only for groups and cups. */
    function drawRoundRobin() {
        const panel = $('cfgRoundRobin');
        if (!panel) return;
        const offered = root().querySelector('.format-visibility-toggle[data-format-id="GROUPS"]');
        panel.hidden = !!offered && !offered.checked;
        const single = $('rrStructure').value === 'single';
        panel.querySelectorAll('.cfg-rr-cups').forEach(row => { row.hidden = single; });
        panel.querySelectorAll('.cfg-rr-single').forEach(row => { row.hidden = !single; });
        // Swiss's panel only while Swiss is offered
        const swiss = $('cfgSwiss'), swissOffered = root().querySelector('.format-visibility-toggle[data-format-id="SWISS"]');
        if (swiss) swiss.hidden = !!swissOffered && !swissOffered.checked;
    }

    /** Redraw every control from the hidden fields (after the form was filled). */
    function syncControls() {
        drawRoundRobin();
        root().querySelectorAll('.cfg-step').forEach(drawStepper);
        root().querySelectorAll('.cfg-seg[data-target], .cfg-pics[data-target]').forEach(g => drawPressed(g, $(g.dataset.target).value));
        drawLaneChips();
        drawX01();
        $('cfgHandoverDesc').innerHTML = HANDOVER_TEXT[$('chalkerHandover').value] || HANDOVER_TEXT.qr;
        drawLogo();
        drawRemoteLock();
    }

    // ---------- what has changed ----------
    function snapshot() {
        const s = {};
        const x01Fields = ['chalkerX01Format', 'chalkerX01Custom', 'chalkerX01CustomToggle'];
        root().querySelectorAll('input[id], select[id]').forEach(el => {
            if (el.id === 'serverIdDisplay' || x01Fields.includes(el.id)) return;
            s[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        });
        // the game is one setting, kept in three fields
        s.chalkerX01Format = $('chalkerX01CustomToggle').checked ? 'custom:' + $('chalkerX01Custom').value : $('chalkerX01Format').value;
        root().querySelectorAll('.format-visibility-toggle').forEach(cb => { s['format:' + cb.dataset.formatId] = cb.checked; });
        return s;
    }
    function changedKeys() {
        if (!saved) return [];
        const now = snapshot();
        return Object.keys(now).filter(k => now[k] !== saved[k]);
    }

    /**
     * True when the Global Settings form has changes that are not saved.
     * @returns {boolean}
     */
    function isDirty() { return changedKeys().length > 0; }

    function sectionOf(key) {
        const el = key.startsWith('format:') ? $('formatVisibilityOptions') : $(key);
        const sec = el && el.closest('.cfg-section');
        return sec ? sec.id : null;
    }
    function refresh() {
        const keys = changedKeys();
        const n = keys.length;
        $('cfgSaveBar').classList.toggle('show', n > 0);
        if (n > 0 && !$('cfgBarText').dataset.error) {
            $('cfgCount').textContent = n;
            $('cfgCountText').textContent = n === 1 ? 'unsaved change' : 'unsaved changes';
        }
        const dirty = new Set(keys.map(sectionOf).filter(Boolean));
        root().querySelectorAll('.cfg-toc button').forEach(b => b.classList.toggle('dirty', dirty.has(b.dataset.target)));
    }
    let errorTimer = null;
    function clearError() {
        clearTimeout(errorTimer);
        const text = $('cfgBarText');
        if (!text.dataset.error) return;
        delete text.dataset.error;
        text.innerHTML = '<span class="cfg-count" id="cfgCount"></span> <span id="cfgCountText"></span>';
    }
    function showError(message, field) {
        clearError();
        const text = $('cfgBarText');
        text.dataset.error = '1';
        text.innerHTML = `<span class="cfg-bar-error">${escapeHtml(message)}</span>`;
        if (field && $(field)) $(field).focus();
        errorTimer = setTimeout(() => { clearError(); refresh(); }, 3500);
    }

    // ---------- save, discard ----------
    /** Fill the form from the stored settings and take that as the saved state. */
    function load() {
        clearError();
        applyConfigToUI();
        syncControls();
        saved = snapshot();
        refresh();
    }

    /**
     * Save every section. Returns false (and says why in the save bar) when the form
     * has something invalid.
     * @returns {boolean}
     */
    function save() {
        const result = saveAllSettings();
        if (!result.ok) { showError(result.error, result.field); return false; }
        load();
        const toast = $('cfgToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1600);
        return true;
    }

    /** Put the form back to the stored settings. */
    function discard() { load(); }

    // ---------- leaving with unsaved changes ----------
    /**
     * Called by showPage() before it switches page. When the user is leaving Global
     * Settings with unsaved changes, ask first and stop the switch.
     * @param {string} pageId - the page being opened
     * @returns {boolean} true when the switch was stopped (the dialog is showing)
     */
    function interceptLeave(pageId) {
        if (!isOpen() || pageId === 'config' || !isDirty()) return false;
        pendingPage = pageId;
        const n = changedKeys().length;
        $('cfgLeaveCount').textContent = n + (n === 1 ? ' unsaved change' : ' unsaved changes');
        $('cfgLeave').hidden = false;
        $('cfgLeaveSave').focus();
        return true;
    }
    function closeLeave() { $('cfgLeave').hidden = true; }
    function continueTo() {
        const target = pendingPage;
        pendingPage = null;
        closeLeave();
        if (target && typeof showPage === 'function') showPage(target);
    }

    // ---------- section list ----------
    // The highlighted section is the last one whose heading has passed the top of the window
    // (or the last section at the bottom of the page). After a click, the clicked section
    // stays highlighted until the scroll there has finished, so short sections can't lose it
    // to the next one.
    let lockedTo = null, lockTimer = null;
    function markToc(id) {
        root().querySelectorAll('.cfg-toc button').forEach(b => b.classList.toggle('on', b.dataset.target === id));
    }
    function currentSection() {
        const sections = [...root().querySelectorAll('.cfg-section')].filter(s => s.offsetParent !== null);
        if (!sections.length) return null;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom) return sections[sections.length - 1].id;
        let id = sections[0].id;
        sections.forEach(s => { if (s.getBoundingClientRect().top <= 80) id = s.id; });
        return id;
    }
    function onScroll() {
        if (!isOpen()) return;
        if (lockedTo) {
            // keep the clicked section until scrolling settles
            clearTimeout(lockTimer);
            lockTimer = setTimeout(() => { lockedTo = null; }, 150);
            return;
        }
        markToc(currentSection());
    }
    function bindToc() {
        root().querySelectorAll('.cfg-toc button').forEach(b => b.addEventListener('click', () => {
            const sec = $(b.dataset.target);
            if (!sec) return;
            lockedTo = b.dataset.target;
            markToc(lockedTo);
            clearTimeout(lockTimer);
            lockTimer = setTimeout(() => { lockedTo = null; }, 1000); // in case the page can't scroll
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
        let raf = null;
        window.addEventListener('scroll', () => {
            if (raf) return;
            raf = requestAnimationFrame(() => { raf = null; onScroll(); });
        }, { passive: true });
    }

    // ---------- wiring (once) ----------
    function bind() {
        if (bound || !root()) return;
        bound = true;

        root().querySelectorAll('.cfg-step').forEach(step => {
            const [down, up] = step.querySelectorAll('button');
            const move = dir => {
                const input = $(step.dataset.target);
                const min = +step.dataset.min, max = +step.dataset.max, by = +step.dataset.step || 1;
                let v = parseInt(input.value);
                if (isNaN(v)) v = min;
                v = Math.max(min, Math.min(max, v + dir * by));
                input.value = v;
                drawStepper(step);
                if (step.dataset.target === 'maxLanes') {
                    // lanes above the new count can't be left out any more
                    $('excludedLanes').value = parseExcludedLanesString($('excludedLanes').value || '').filter(l => l <= v).join(',');
                    drawLaneChips();
                }
                refresh();
            };
            down.addEventListener('click', () => move(-1));
            up.addEventListener('click', () => move(1));
        });

        root().querySelectorAll('.cfg-seg[data-target], .cfg-pics[data-target]').forEach(group => {
            group.querySelectorAll('button[data-value]').forEach(b => b.addEventListener('click', () => {
                $(group.dataset.target).value = b.dataset.value;
                drawPressed(group, b.dataset.value);
                if (group.dataset.target === 'chalkerHandover') $('cfgHandoverDesc').innerHTML = HANDOVER_TEXT[b.dataset.value];
                refresh();
            }));
        });

        // Game: three common scores, or Other with a number of your own
        $('cfgX01Seg').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            const other = b.dataset.value === 'other';
            const custom = $('chalkerX01Custom');
            $('chalkerX01CustomToggle').checked = other;
            if (other) { if (!custom.value) custom.value = $('chalkerX01Format').value; }
            else $('chalkerX01Format').value = b.dataset.value;
            custom.style.display = other ? '' : 'none';
            $('chalkerX01Warning').style.display = other ? '' : 'none';
            drawX01();
            if (other) custom.focus();
            refresh();
        }));

        root().querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.reset === 'points') resetPointValuesToDefaults();
            else resetMatchConfigToDefaults();
            syncControls();
            refresh();
        }));

        root().addEventListener('input', refresh);
        root().addEventListener('change', refresh);
        root().addEventListener('change', e => { if (e.target.classList.contains('format-visibility-toggle')) drawRoundRobin(); });
        root().querySelectorAll('.cfg-seg[data-target="rrStructure"] button').forEach(b => b.addEventListener('click', drawRoundRobin));

        $('remoteServerVerified').addEventListener('input', drawRemoteLock);
        $('remoteUnlockBtn').addEventListener('click', () => { $('cfgUnlock').hidden = false; $('cfgUnlockGo').focus(); });
        $('cfgUnlockCancel').addEventListener('click', closeUnlock);
        $('cfgUnlockGo').addEventListener('click', unlockRemote);

        $('cfgSave').addEventListener('click', save);
        $('cfgDiscard').addEventListener('click', discard);
        $('cfgLeaveStay').addEventListener('click', () => { pendingPage = null; closeLeave(); });
        $('cfgLeaveDiscard').addEventListener('click', () => { discard(); continueTo(); });
        $('cfgLeaveSave').addEventListener('click', () => { if (save()) continueTo(); else closeLeave(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !$('cfgLeave').hidden) { pendingPage = null; closeLeave(); }
            if (e.key === 'Escape' && !$('cfgUnlock').hidden) closeUnlock();
        });
        // Closing or reloading the tab: the browser's own warning
        window.addEventListener('beforeunload', e => {
            if (isOpen() && isDirty()) { e.preventDefault(); e.returnValue = ''; }
        });

        bindToc();
    }

    /**
     * Called by showPage() when Global Settings opens: fill the form from the stored
     * settings and start tracking changes from there.
     * @returns {void}
     */
    function onShow() {
        bind();
        load();
        markToc(currentSection());
    }

    return { onShow, interceptLeave, isDirty, save, discard };
})();
