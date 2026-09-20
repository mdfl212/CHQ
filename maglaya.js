window.CHQ = window.CHQ || {};

(function () {
    let rowCounter = 0;

    function makeRow() {
        const tr = document.createElement('tr');
        tr.dataset.rowId = 'mg' + (rowCounter++);
        tr.innerHTML = `
            <td class="problem-cell"><input type="text" class="mg-problem" placeholder="Problem" /></td>
            <td class="evidence-cell"><input type="text" class="mg-evidence" placeholder="Evidence / magnitude data" /></td>
            <td class="score-cell"><input type="number" min="1" max="4" class="mg-score mg-nature" /></td>
            <td class="score-cell"><input type="number" min="1" max="4" class="mg-score mg-magnitude" /></td>
            <td class="score-cell"><input type="number" min="1" max="4" class="mg-score mg-modif" /></td>
            <td class="score-cell"><input type="number" min="1" max="4" class="mg-score mg-prev" /></td>
            <td class="score-cell"><input type="number" min="1" max="4" class="mg-score mg-social" /></td>
            <td class="total-cell mg-total">—</td>
            <td><button type="button" class="remove-row" title="Remove row">✕</button></td>
        `;
        return tr;
    }

    function bindRow(tr) {
        tr.querySelectorAll('.mg-score').forEach(inp => {
            inp.addEventListener('input', () => {
                const v = parseInt(inp.value, 10);
                if (inp.value !== '') {
                    if (isNaN(v) || v < 1) inp.value = 1;
                    else if (v > 4) inp.value = 4;
                }
                updateTotal(tr);
            });
        });
        tr.querySelector('.remove-row').addEventListener('click', () => {
            const tb = document.getElementById('maglayaBody');
            if (tb.rows.length > 1) {
                tr.remove();
            } else {
                tr.querySelectorAll('input').forEach(i => { i.value = ''; });
                updateTotal(tr);
            }
            window.CHQ.onChange && window.CHQ.onChange();
        });
    }

    function updateTotal(tr) {
        const n  = parseInt(tr.querySelector('.mg-nature').value) || 0;
        const m  = parseInt(tr.querySelector('.mg-magnitude').value) || 0;
        const mo = parseInt(tr.querySelector('.mg-modif').value) || 0;
        const p  = parseInt(tr.querySelector('.mg-prev').value) || 0;
        const s  = parseInt(tr.querySelector('.mg-social').value) || 0;
        const total = (n * 2) + (m * 1) + (mo * 3) + (p * 4) + (s * 5);
        tr.querySelector('.mg-total').textContent = total > 0 ? total : '—';
    }

    function addRow(data) {
        const tb = document.getElementById('maglayaBody');
        if (!tb) return;
        const tr = makeRow();
        tb.appendChild(tr);
        if (data) {
            tr.querySelector('.mg-problem').value = data.problem || '';
            tr.querySelector('.mg-evidence').value = data.evidence || '';
            tr.querySelector('.mg-nature').value = data.nature || '';
            tr.querySelector('.mg-magnitude').value = data.magnitude || '';
            tr.querySelector('.mg-modif').value = data.modif || '';
            tr.querySelector('.mg-prev').value = data.prev || '';
            tr.querySelector('.mg-social').value = data.social || '';
            updateTotal(tr);
        }
        bindRow(tr);
        return tr;
    }

    function reset(seed) {
        const tb = document.getElementById('maglayaBody');
        if (!tb) return;
        tb.innerHTML = '';
        rowCounter = 0;
        const n = typeof seed === 'number' ? seed : 5;
        for (let i = 0; i < n; i++) addRow();
    }

    function getRows() {
        const rows = [];
        document.querySelectorAll('#maglayaBody tr').forEach(tr => {
            const row = {
                problem: tr.querySelector('.mg-problem').value,
                evidence: tr.querySelector('.mg-evidence').value,
                nature: tr.querySelector('.mg-nature').value,
                magnitude: tr.querySelector('.mg-magnitude').value,
                modif: tr.querySelector('.mg-modif').value,
                prev: tr.querySelector('.mg-prev').value,
                social: tr.querySelector('.mg-social').value
            };
            if (Object.values(row).some(v => v && String(v).trim() !== '')) {
                rows.push(row);
            }
        });
        return rows;
    }

    function setRows(rows) {
        const tb = document.getElementById('maglayaBody');
        if (!tb) return;
        tb.innerHTML = '';
        rowCounter = 0;
        if (!Array.isArray(rows) || rows.length === 0) {
            for (let i = 0; i < 5; i++) addRow();
            return;
        }
        rows.forEach(r => addRow(r));
    }

    function init() {
        reset(5);
    }

    window.CHQ.maglaya = { init, addRow, reset, getRows, setRows };
})();