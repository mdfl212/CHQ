window.CHQ = window.CHQ || {};

(function () {
    const { getPref, setPref, UI_KEY } = window.CHQ.storage;

    const STEP_ICONS = {
        s0: '📋', s1: '👥', s2: '📊', s3: '🦠', s4: '💊',
        s5: '🤱', s6: '💉', s7: '🍎', s8: '💧', s9: '🧠',
        s10: '🏥', s11: '🚪', s12: '🎯', s13: '📐'
    };

    let activeId = null;

    function getSections() {
        return Array.from(document.querySelectorAll('.form-section[data-section-id]'));
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── Build sidebar nav items ───
    function buildNav() {
        const navList = document.getElementById('navList');
        if (!navList) return;
        const sections = getSections();
        navList.innerHTML = sections.map((s, i) => {
            const id = s.dataset.sectionId;
            const num = s.dataset.sectionNum || (i + 1);
            const title = s.dataset.sectionTitle || '';
            const icon = STEP_ICONS[id] || '•';
            return `
                <button type="button" class="nav-item" data-target="${id}">
                    <span class="nav-num">${escapeHtml(num)}</span>
                    <span class="nav-icon">${icon}</span>
                    <span class="nav-label">${escapeHtml(title)}</span>
                </button>
            `;
        }).join('');

        navList.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                activate(btn.dataset.target);
                if (window.innerWidth <= 900) closeMobileNav();
            });
        });
    }

    // ─── Add step counter to section titles (guided mode only) ───
    function ensureStepMeta() {
        const sections = getSections();
        const total = sections.length;
        sections.forEach((sec, i) => {
            const titleEl = sec.querySelector('.form-section-title');
            if (!titleEl || titleEl.dataset.stepEnhanced) return;
            titleEl.dataset.stepEnhanced = '1';
            const counter = document.createElement('span');
            counter.className = 'step-counter';
            counter.textContent = `${i + 1} / ${total}`;
            titleEl.appendChild(counter);
        });
    }

    // ─── Activate a section ───
    function activate(id) {
        const sections = getSections();
        if (!sections.some(s => s.dataset.sectionId === id)) return;
        activeId = id;
        sections.forEach(s => s.classList.toggle('active', s.dataset.sectionId === id));
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === id);
        });
        updateFloatingActions();
        if (document.documentElement.getAttribute('data-ui') === 'guided') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function next() {
        const sections = getSections();
        const idx = sections.findIndex(s => s.dataset.sectionId === activeId);
        if (idx >= 0 && idx < sections.length - 1) {
            activate(sections[idx + 1].dataset.sectionId);
        } else if (idx === sections.length - 1) {
            window.CHQ.showToast('✅ All sections visited — click DOCX to export.', 4000);
        }
    }

    function prev() {
        const sections = getSections();
        const idx = sections.findIndex(s => s.dataset.sectionId === activeId);
        if (idx > 0) activate(sections[idx - 1].dataset.sectionId);
    }

    // ─── Floating action buttons ───
    function updateFloatingActions() {
        const sections = getSections();
        const idx = sections.findIndex(s => s.dataset.sectionId === activeId);
        const prevBtn = document.getElementById('guidedPrevBtn');
        const nextBtn = document.getElementById('guidedNextBtn');
        const label = document.getElementById('guidedNextLabel');
        if (!prevBtn || !nextBtn || !label) return;

        prevBtn.disabled = idx <= 0;

        if (idx >= 0 && idx < sections.length - 1) {
            label.textContent = `Proceed to ${sections[idx + 1].dataset.sectionTitle || 'next'}`;
            nextBtn.classList.remove('complete');
            nextBtn.textContent = '→';
        } else {
            label.textContent = 'All sections complete — Export DOCX';
            nextBtn.classList.add('complete');
            nextBtn.textContent = '✓';
        }
    }

    // ─── Is a section filled? ───
    function isSectionFilled(section) {
        const inputs = section.querySelectorAll(
            'input[type="text"], input[type="number"], input[type="date"], textarea'
        );
        for (const el of inputs) {
            if (el.value && el.value.trim() !== '') return true;
        }
        if (section.querySelector('.chip-group input:checked')) return true;
        const mg = section.querySelectorAll('.mg-problem, .mg-evidence');
        for (const el of mg) if (el.value && el.value.trim() !== '') return true;
        return false;
    }

    // ─── Progress bar + filled indicators ───
    function refreshProgress() {
        const sections = getSections();
        let filled = 0;
        sections.forEach(s => {
            const isFilled = isSectionFilled(s);
            if (isFilled) filled++;
            const navBtn = document.querySelector(`.nav-item[data-target="${s.dataset.sectionId}"]`);
            if (navBtn) navBtn.classList.toggle('filled', isFilled);
        });
        const pct = sections.length ? Math.round((filled / sections.length) * 100) : 0;
        const fill = document.getElementById('navProgressFill');
        const text = document.getElementById('navProgressText');
        if (fill) fill.style.width = pct + '%';
        if (text) text.textContent = `${filled} / ${sections.length}`;
    }

    // ─── Sidebar collapse ───
    function toggleSidebarCollapse() {
        const html = document.documentElement;
        const isCollapsed = html.classList.toggle('guided-sb-collapsed');
        setPref('chq:sidebar:v1', isCollapsed ? 'collapsed' : 'expanded');
    }

    // ─── Mobile nav ───
    function openMobileNav() {
        document.documentElement.classList.add('nav-mobile-open');
    }
    function closeMobileNav() {
        document.documentElement.classList.remove('nav-mobile-open');
    }

    // ─── UI mode switching ───
    function applyMode(mode) {
        document.documentElement.setAttribute('data-ui', mode);

        const btn = document.getElementById('uiToggleBtn');
        if (btn) btn.textContent = mode === 'guided' ? '▤ Classic UI' : '▦ Guided UI';

        if (mode === 'guided') {
            ensureStepMeta();
            if (!activeId) {
                const first = getSections()[0];
                if (first) activeId = first.dataset.sectionId;
            }
            activate(activeId);
        }
        refreshProgress();
    }

    function toggleMode() {
        const current = document.documentElement.getAttribute('data-ui') || 'classic';
        const next = current === 'guided' ? 'classic' : 'guided';
        applyMode(next);
        setPref(UI_KEY, next);

        if (next === 'guided') {
            window.CHQ.showToast('Guided mode active. Your data is untouched.', 3000);
        }
    }

    // ─── Init ───
    function init() {
        buildNav();
        ensureStepMeta();

        // Restore sidebar collapse state
        const sbState = getPref('chq:sidebar:v1', 'expanded');
        if (sbState === 'collapsed') {
            document.documentElement.classList.add('guided-sb-collapsed');
        }

        const saved = getPref(UI_KEY, 'classic');
        applyMode(saved);

        // Header UI toggle
        const uiBtn = document.getElementById('uiToggleBtn');
        if (uiBtn) uiBtn.addEventListener('click', toggleMode);

        // Sidebar collapse button
        const collapseBtn = document.getElementById('navCollapseBtn');
        if (collapseBtn) collapseBtn.addEventListener('click', toggleSidebarCollapse);

        // Sidebar print button
        const printBtn = document.getElementById('sidebarPrintBtn');
        if (printBtn) printBtn.addEventListener('click', () => window.print());

        // Sidebar reset button
        const resetBtn = document.getElementById('sidebarResetBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => window.CHQ.reset());

        // Mobile menu button
        const mobBtn = document.getElementById('mobileMenuBtn');
        if (mobBtn) mobBtn.addEventListener('click', openMobileNav);

        // Backdrop click closes mobile nav
        const backdrop = document.getElementById('navBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeMobileNav);

        // Floating actions
        const gPrev = document.getElementById('guidedPrevBtn');
        const gNext = document.getElementById('guidedNextBtn');
        if (gPrev) gPrev.addEventListener('click', prev);
        if (gNext) gNext.addEventListener('click', next);

        // Keyboard shortcuts (guided mode only)
        document.addEventListener('keydown', e => {
            if (document.documentElement.getAttribute('data-ui') !== 'guided') return;
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
            if (e.key === 'ArrowLeft')  { prev(); e.preventDefault(); }
            if (e.key === 'Escape')     { closeMobileNav(); }
        });

        refreshProgress();
    }

    window.CHQ.ui = {
        init, applyMode, toggleMode,
        activate, next, prev,
        refreshProgress, updateFloatingActions,
        openMobileNav, closeMobileNav
    };
})();