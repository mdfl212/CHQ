window.CHQ = window.CHQ || {};

(function () {
    const { getPref, setPref, THEME_KEY } = window.CHQ.storage;

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Header toggle
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.textContent = theme === 'night' ? '☀ Day' : '🌙 Night';

        // Sidebar toggle (guided mode)
        const sIcon = document.getElementById('sidebarThemeIcon');
        const sLabel = document.getElementById('sidebarThemeLabel');
        if (sIcon)   sIcon.textContent   = theme === 'night' ? '☀' : '🌙';
        if (sLabel)  sLabel.textContent  = theme === 'night' ? 'Light Mode' : 'Dark Mode';
    }

    function toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'day';
        const next = current === 'night' ? 'day' : 'night';
        apply(next);
        setPref(THEME_KEY, next);
    }

    function init() {
        const saved = getPref(THEME_KEY, 'day');
        apply(saved);

        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.addEventListener('click', toggle);

        const sbBtn = document.getElementById('sidebarThemeBtn');
        if (sbBtn) sbBtn.addEventListener('click', toggle);
    }

    window.CHQ.theme = { init, apply, toggle };
})();