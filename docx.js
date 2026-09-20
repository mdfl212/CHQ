window.CHQ = window.CHQ || {};

(function () {
    // ─── XML helpers ───
    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }
    function heading(text) {
        return `<w:p><w:pPr><w:spacing w:before="280" w:after="120"/><w:rPr><w:b/><w:color w:val="A13D2C"/><w:sz w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="A13D2C"/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
    }
    function field(label, value) {
        const display = (value && String(value).trim()) ? value : '—';
        const lines = String(display).split('\n');
        let runs = `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(label)}: </w:t></w:r>`;
        lines.forEach((line, i) => {
            runs += `<w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r>`;
            if (i < lines.length - 1) runs += `<w:br/>`;
        });
        return `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr>${runs}</w:p>`;
    }
    function title(text) {
        return `<w:p><w:pPr><w:spacing w:after="200"/><w:jc w:val="center"/><w:rPr><w:b/><w:color w:val="0A0E1A"/><w:sz w:val="36"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="0A0E1A"/><w:sz w:val="36"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
    }

    // ─── Row label maps (must match index.html tables) ───
    const PROFILE_ROWS = [
        'Total population','Total households','Children <1 year','Children 1–4 years',
        'Children 5–9 years','Adolescents','Adults','Older adults ≥60 years',
        'Pregnant women','Persons with disability'
    ];
    const COMM_ROWS = ['Tuberculosis','Dengue','Diarrhea','Acute respiratory infections','Skin infections'];
    const NCD_ROWS  = ['Hypertension','Diabetes mellitus','Heart disease','Stroke','Cancer','Asthma/COPD','Chronic kidney disease','Other'];
    const MCH_ROWS  = ['Pregnant women registered','Pregnant women with adequate prenatal visits','High-risk pregnancies','Facility-based deliveries','Home deliveries','Postnatal visits','Maternal deaths','Infant deaths','Under-five deaths'];

    function chipDisplay(data, field) {
        const vals = Array.isArray(data[field]) ? data[field].slice() : [];
        const other = (data[field + '__other'] || '').trim();
        return vals.map(v => v === 'Other' && other ? `Other: ${other}` : v).join(', ');
    }

    async function generate(ev) {
        const btn = ev && ev.currentTarget ? ev.currentTarget : null;
        const original = btn ? btn.innerHTML : null;
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<span class="spinner"></span>Generating…';
        }
        try {
            const data = window.CHQ.storage.serialize();
            let body = '';
            body += title('Community Health Center Data-Gathering Questionnaire');
            body += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="555555"/></w:rPr><w:t xml:space="preserve">For Community Health Nursing Assessment and Maglaya Health Problem Prioritization</w:t></w:r></w:p>`;

            body += heading('Respondent / Key Informant');
            body += field('Health Center / Barangay', data.fCenter);
            body += field('Purok / Sitio Covered', data.fPurok);
            body += field('Respondent / Position', chipDisplay(data, 'respondent'));
            body += field('Date / Period Covered', data.fPeriod);

            body += heading('I. Community Profile');
            PROFILE_ROWS.forEach((label, i) => { body += field(label, data['prof' + i]); });
            body += field('Vulnerable groups', chipDisplay(data, 'vulnerableGroups'));

            body += heading('II. General Health Status');
            for (let i = 1; i <= 5; i++) {
                body += field(`Rank ${i}`, `${data['gh' + i] || '—'}  (${data['gh' + i + 'n'] || '—'})`);
            }
            body += field('Trend vs. previous year', chipDisplay(data, 'ghTrend'));
            body += field('Affects greatest number of people', data.ghMost);
            body += field('Most serious problem', data.ghSerious);

            body += heading('III. Communicable Diseases');
            COMM_ROWS.forEach((label, i) => {
                const c = data['comm' + i + '_cases'] || '—';
                const inc = document.querySelector(`input[name="comm${i}_trend"][value="Increasing"]`)?.checked ? 'Increasing' : '';
                const dec = document.querySelector(`input[name="comm${i}_trend"][value="Decreasing"]`)?.checked ? 'Decreasing' : '';
                body += field(label, `Cases: ${c} | ${inc || dec || '—'}`);
            });
            body += field('Outbreak or unusual increase?', chipDisplay(data, 'outbreak'));
            body += field('If yes, specify', data.outbreakDetail);

            body += heading('IV. Noncommunicable Diseases');
            NCD_ROWS.forEach((c, i) => { body += field(c, data['ncd' + i]); });
            body += field('Biggest NCD concern', data.ncdConcern);
            body += field('Screening services available', chipDisplay(data, 'ncdScreening'));
            body += field('Common risk factors', chipDisplay(data, 'ncdRisk'));

            body += heading('V. Maternal & Child Health');
            MCH_ROWS.forEach((label, i) => { body += field(label, data['mch' + i]); });
            body += field('Common maternal/child health concerns', chipDisplay(data, 'mchConcerns'));

            body += heading('VI. Immunization');
            body += field('Immunization status of children', chipDisplay(data, 'immStatus'));
            body += field('Reasons for missed vaccinations', chipDisplay(data, 'immMissed'));

            body += heading('VII. Nutrition');
            body += field('Nutrition problems present', chipDisplay(data, 'nutProblems'));
            body += field('Underweight (n)', data.nutUnder);
            body += field('Wasted (n)', data.nutWasted);
            body += field('Stunted (n)', data.nutStunted);
            body += field('Overweight/obese (n)', data.nutOver);
            body += field('Nutrition programs available', chipDisplay(data, 'nutPrograms'));
            body += field('Major nutrition concern', data.nutConcern);

            body += heading('VIII. Water, Sanitation & Environment');
            body += field('Main water sources', chipDisplay(data, 'waterSources'));
            body += field('Major environmental concerns', chipDisplay(data, 'envConcerns'));
            body += field('Most concerning environmental problem', data.envMost);
            body += field('Environmental health programs implemented?', chipDisplay(data, 'envPrograms'));

            body += heading('IX. Mental & Social Health');
            body += field('Mental/social concerns observed', chipDisplay(data, 'mentalConcerns'));
            body += field('Mental health services available', chipDisplay(data, 'mentalServices'));
            body += field('Major mental/social health concern', data.mentalMajor);

            body += heading('X. Health Services & Resources');
            body += field('Services available', chipDisplay(data, 'servicesAvail'));
            body += field('Health personnel available', data.personnel);
            body += field('Resources lacking', chipDisplay(data, 'resourcesLacking'));

            body += heading('XI. Access to Healthcare');
            body += field('Barriers to healthcare', chipDisplay(data, 'barriers'));
            body += field('Referrals to other facilities?', chipDisplay(data, 'referrals'));
            body += field('If yes, common reasons', data.referralReasons);
            body += field('Health services still needed', data.neededServices);

            body += heading("XII. Health Center's Perception of Community Priorities");
            body += field('Three most important health problems', data.top3);
            body += field('Affects the largest number of people', data.affectsMost);
            body += field('Most easily modified/addressed', data.mostModifiable);
            body += field('Greatest potential for prevention', data.mostPreventable);
            body += field('Urgent community concern', data.mostUrgent);
            body += field('Requires most additional resources', data.mostResource);

            body += heading('XIII. Maglaya Health Problem Prioritization Worksheet');
            body += `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="555555"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Total = (Nature × 2) + (Magnitude × 1) + (Modifiability × 3) + (Preventive × 4) + (Social × 5) — max 60</w:t></w:r></w:p>`;
            const rows = Array.isArray(data.__maglaya) ? data.__maglaya : [];
            if (rows.length === 0) {
                body += field('Problems', '—');
            } else {
                rows.forEach(r => {
                    const n = r.nature || '—';
                    const m = r.magnitude || '—';
                    const mo = r.modif || '—';
                    const p = r.prev || '—';
                    const s = r.social || '—';
                    const total = (parseInt(n) * 2 || 0) + (parseInt(m) || 0) + (parseInt(mo) * 3 || 0) + (parseInt(p) * 4 || 0) + (parseInt(s) * 5 || 0);
                    body += field(r.problem || 'Problem',
                        `Evidence: ${r.evidence || '—'} | Nature: ${n} | Magnitude: ${m} | Modifiability: ${mo} | Preventive: ${p} | Social: ${s} | Total: ${total || '—'}`);
                });
            }

            // ─── Package ───
            const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body>
</w:document>`;
            const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;
            const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
            const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
            const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

            const zip = new JSZip();
            zip.file('[Content_Types].xml', contentTypesXml);
            zip.folder('_rels').file('.rels', rootRelsXml);
            const word = zip.folder('word');
            word.file('document.xml', documentXml);
            word.file('styles.xml', stylesXml);
            word.folder('_rels').file('document.xml.rels', docRelsXml);

            const blob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const nameBase = (data.fCenter || 'Community_Health_Questionnaire').replace(/[^a-z0-9]+/gi, '_');
            a.href = url;
            a.download = `${nameBase}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            window.CHQ.showToast('DOCX generated ✓');
        } catch (err) {
            console.error(err);
            window.CHQ.showToast('Error generating DOCX: ' + err.message);
        } finally {
            if (btn) {
                btn.classList.remove('loading');
                btn.innerHTML = original;
            }
        }
    }

    window.CHQ.docx = { generate };
})();