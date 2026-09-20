window.CHQ = window.CHQ || {};

(function () {
    // ─── Toast ───
    let toastTimer = null;
    function showToast(msg, duration = 3500) {
        const el = document.getElementById('toast');
        const text = document.getElementById('toastMsg');
        if (!el || !text) return;
        text.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), duration);
    }
    function hideToast() {
        const el = document.getElementById('toast');
        if (el) el.classList.remove('show');
        clearTimeout(toastTimer);
    }
    window.CHQ.showToast = showToast;
    window.CHQ.hideToast = hideToast;

    // ─── Build static tables ───
    function buildStaticTables() {
        const profileRows = [
            'Total population','Total households','Children <1 year','Children 1–4 years',
            'Children 5–9 years','Adolescents','Adults','Older adults ≥60 years',
            'Pregnant women','Persons with disability'
        ];
        const tbP = document.getElementById('profileTableBody');
        if (tbP) {
            tbP.innerHTML = profileRows.map((label, i) =>
                `<tr><td class="row-label">${label}</td><td><input id="prof${i}" placeholder="value" /></td></tr>`
            ).join('');
        }

        const commRows = ['Tuberculosis','Dengue','Diarrhea','Acute respiratory infections','Skin infections'];
        const tbC = document.getElementById('commTableBody');
        if (tbC) {
            tbC.innerHTML = commRows.map((d, i) =>
                `<tr>
                    <td class="row-label">${d}</td>
                    <td class="num"><input id="comm${i}_cases" type="number" placeholder="n" /></td>
                    <td class="radio-cell"><input type="radio" name="comm${i}_trend" value="Increasing" /></td>
                    <td class="radio-cell"><input type="radio" name="comm${i}_trend" value="Decreasing" /></td>
                </tr>`
            ).join('');
        }

        const ncdRows = ['Hypertension','Diabetes mellitus','Heart disease','Stroke','Cancer','Asthma/COPD','Chronic kidney disease','Other'];
        const tbN = document.getElementById('ncdTableBody');
        if (tbN) {
            tbN.innerHTML = ncdRows.map((c, i) =>
                `<tr><td class="row-label">${c}</td><td><input id="ncd${i}" placeholder="n / rate" /></td></tr>`
            ).join('');
        }

        const mchRows = ['Pregnant women registered','Pregnant women with adequate prenatal visits','High-risk pregnancies','Facility-based deliveries','Home deliveries','Postnatal visits','Maternal deaths','Infant deaths','Under-five deaths'];
        const tbM = document.getElementById('mchTableBody');
        if (tbM) {
            tbM.innerHTML = mchRows.map((label, i) =>
                `<tr><td class="row-label">${label}</td><td><input id="mch${i}" placeholder="n / %" /></td></tr>`
            ).join('');
        }
    }

    // ─── Save indicator ───
    let saveIndicatorTimer = null;
    function flashSaveIndicator() {
        const pill = document.getElementById('savePill');
        const text = document.getElementById('saveText');
        if (!pill || !text) return;
        pill.classList.add('saving');
        text.textContent = 'Saving…';
        clearTimeout(saveIndicatorTimer);
        saveIndicatorTimer = setTimeout(() => {
            pill.classList.remove('saving');
            text.textContent = 'Saved';
        }, 450);
    }

    // ─── Autosave ───
    let saveTimer = null;
    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            window.CHQ.storage.saveNow();
            flashSaveIndicator();
            window.CHQ.ui && window.CHQ.ui.refreshProgress();
        }, 300);
    }
    window.CHQ.onChange = scheduleSave;

    // ─── Reset ───
    function resetForm() {
        if (!confirm('Clear all form fields? This cannot be undone.')) return;
        document.querySelectorAll('#chForm input, #chForm textarea').forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
            else el.value = '';
        });
        if (window.CHQ.maglaya) window.CHQ.maglaya.reset(5);
        window.CHQ.storage.clear();

        // Reset UI back to first section
        const first = document.querySelector('.form-section[data-section-id]');
        if (first && window.CHQ.ui) {
            window.CHQ.ui.activate(first.dataset.sectionId);
        }
        window.CHQ.ui && window.CHQ.ui.refreshProgress();
        showToast('Form reset. Local cache cleared.');
    }
    window.CHQ.reset = resetForm;

    // ─── Wire autosave ───
    function bindAutosave() {
        const form = document.getElementById('chForm');
        if (!form) return;
        form.addEventListener('input', scheduleSave, { passive: true });
        form.addEventListener('change', scheduleSave, { passive: true });
    }

    // ─── Scroll top ───
    function bindScrollTop() {
        const btn = document.getElementById('scrollTopBtn');
        if (!btn) return;
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
    }

    // ─── Boot ───
    function boot() {
        buildStaticTables();
        window.CHQ.maglaya.init();
        window.CHQ.theme.init();
        window.CHQ.ui.init();

        const cached = window.CHQ.storage.load();
        if (cached) {
            window.CHQ.storage.deserialize(cached);
            showToast('Restored saved progress from this device.');
        }

        bindAutosave();
        bindScrollTop();
        window.CHQ.ui.refreshProgress();
        window.CHQ.ui.updateFloatingActions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();