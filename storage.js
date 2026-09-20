window.CHQ = window.CHQ || {};

(function () {
    const STATE_KEY = 'chq:state:v1';
    const META_KEY  = 'chq:meta:v1';
    const UI_KEY    = 'chq:ui:v1';
    const THEME_KEY = 'chq:theme:v1';

    // ─── Serialize the entire form to a plain object ───
    function serialize() {
        const data = {};

        // text / number / date / textarea (by id)
        document.querySelectorAll(
            '#chForm input[id]:not([type=checkbox]):not([type=radio]), #chForm textarea[id]'
        ).forEach(el => {
            data[el.id] = el.value;
        });

        // chip groups (by data-field)
        document.querySelectorAll('.chip-group[data-field]').forEach(wrap => {
            const field = wrap.dataset.field;
            const values = [];
            wrap.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked').forEach(inp => {
                values.push(inp.value);
            });
            data[field] = values;
            const other = wrap.querySelector('.chip-other-input');
            if (other) data[field + '__other'] = other.value;
        });

        // Maglaya rows
        data.__maglaya = window.CHQ.maglaya
            ? window.CHQ.maglaya.getRows()
            : [];

        return data;
    }

    // ─── Apply a serialized object back to the form ───
    function deserialize(data) {
        if (!data || typeof data !== 'object') return;

        Object.entries(data).forEach(([key, value]) => {
            if (key === '__maglaya') return;
            if (key.endsWith('__other')) return;
            const el = document.getElementById(key);
            if (!el) return;
            if (el.type === 'checkbox' || el.type === 'radio') return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = value == null ? '' : value;
            }
        });

        document.querySelectorAll('.chip-group[data-field]').forEach(wrap => {
            const field = wrap.dataset.field;
            const values = Array.isArray(data[field]) ? data[field] : [];
            wrap.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(inp => {
                inp.checked = values.includes(inp.value);
            });
            const other = wrap.querySelector('.chip-other-input');
            if (other) other.value = data[field + '__other'] || '';
        });

        if (window.CHQ.maglaya && Array.isArray(data.__maglaya)) {
            window.CHQ.maglaya.setRows(data.__maglaya);
        }
    }

    // ─── Save / load / clear state ───
    function saveNow() {
        try {
            const data = serialize();
            localStorage.setItem(STATE_KEY, JSON.stringify(data));
            localStorage.setItem(META_KEY, JSON.stringify({ savedAt: Date.now() }));
            return true;
        } catch (e) {
            console.warn('[CHQ] save failed', e);
            return false;
        }
    }

    function load() {
        try {
            const raw = localStorage.getItem(STATE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('[CHQ] load failed', e);
            return null;
        }
    }

    function clear() {
        try {
            localStorage.removeItem(STATE_KEY);
            localStorage.removeItem(META_KEY);
        } catch (e) { /* ignore */ }
    }

    function lastSavedAt() {
        try {
            const raw = localStorage.getItem(META_KEY);
            if (!raw) return null;
            return JSON.parse(raw).savedAt || null;
        } catch { return null; }
    }

    // ─── Preference helpers ───
    function getPref(key, fallback) {
        try { return localStorage.getItem(key) || fallback; }
        catch { return fallback; }
    }
    function setPref(key, value) {
        try { localStorage.setItem(key, value); } catch { /* ignore */ }
    }

    window.CHQ.storage = {
        serialize, deserialize,
        saveNow, load, clear, lastSavedAt,
        getPref, setPref,
        STATE_KEY, META_KEY, UI_KEY, THEME_KEY
    };
})();