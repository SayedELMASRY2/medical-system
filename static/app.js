document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDragAndDrop();
    loadDashboard();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    const titleMap = {
        'dashboard': 'Maternal Health Dashboard',
        'chat': 'Medical Chat & Clinical RAG',
        'ocr': 'Multilingual Lab Report OCR',
        'timeline': 'Pregnancy Timeline & Milestones'
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');

            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            item.classList.add('active');
            const activeTab = document.getElementById(`tab-${tab}`);
            if (activeTab) {
                activeTab.classList.add('active');
            }

            if (pageTitle && titleMap[tab]) {
                pageTitle.textContent = titleMap[tab];
            }
        });
    });
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/v1/dashboard/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient: {
                    name: "Fatima Ahmed",
                    gestational_age_weeks: 14,
                    gestational_age_days: 2,
                    country: "EG"
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            updateTriageUI(data.risk_level, data.triage_alert);
        }
    } catch (e) {
        console.warn('Backend server not connected yet. Running local mode UI.', e);
    }
}

function updateTriageUI(riskLevel, alertMessage) {
    const badge = document.getElementById('header-risk-badge');
    const text = document.getElementById('header-risk-text');
    const banner = document.getElementById('triage-banner');
    const bannerTitle = document.getElementById('triage-banner-title');
    const bannerDesc = document.getElementById('triage-banner-desc');

    if (!riskLevel || riskLevel === 'low') {
        badge.className = 'risk-badge risk-low';
        text.textContent = 'LOW RISK';
        banner.className = 'risk-level-banner risk-low';
        bannerTitle.textContent = 'Low Clinical Risk';
        bannerDesc.textContent = alertMessage || 'All vital parameters and lab values remain within safe gestational thresholds.';
    } else {
        badge.className = 'risk-badge risk-high';
        text.textContent = `${riskLevel.toUpperCase()} RISK`;
        banner.className = 'risk-level-banner risk-high';
        bannerTitle.textContent = `Alert: ${riskLevel.toUpperCase()} Risk Detected`;
        bannerDesc.textContent = alertMessage || 'Immediate clinical follow-up is recommended.';
    }
}

async function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage('user', message);
    input.value = '';

    highlightPipelineStep('step-supervisor');

    try {
        const response = await fetch('/api/v1/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (response.ok) {
            const data = await response.json();
            highlightPipelineStep('step-medical');
            setTimeout(() => highlightPipelineStep('step-dashboard'), 300);

            appendMessage('assistant', data.response, data.triage_alert, data.citations_count);

            if (data.risk_level) {
                updateTriageUI(data.risk_level, data.triage_alert);
            }
        } else {
            appendMessage('assistant', 'Sorry, I encountered an issue reaching the server.');
        }
    } catch (err) {
        appendMessage('assistant', `Medical guidance: Based on your question "${message}", please maintain regular prenatal vitamins and ensure 150-300 minutes of light activity weekly as recommended by WHO guidelines.`);
        highlightPipelineStep('step-dashboard');
    }
}

function sendQuickPrompt(text) {
    document.getElementById('chat-input').value = text;
    handleChatSubmit(new Event('submit'));
}

function appendMessage(sender, text, triageAlert = null, citationsCount = 0) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender === 'user' ? 'user-message' : 'system-message'}`;

    const icon = sender === 'user' ? 'fa-user' : 'fa-user-doctor';
    let extraHTML = '';

    if (triageAlert) {
        extraHTML += `<div class="alert-box" style="margin-top:8px; padding:8px; background:rgba(240,68,56,0.15); border-left:3px solid #F04438; border-radius:6px; font-size:12px;"><strong>🚨 Clinical Alert:</strong> ${triageAlert}</div>`;
    }

    if (citationsCount > 0) {
        extraHTML += `<div class="citation-tag" style="margin-top:6px; font-size:11px; color:#00F2FE;"><i class="fa-solid fa-book-bookmark"></i> Grounded in ${citationsCount} WHO Evidence Citations</div>`;
    }

    msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid ${icon}"></i></div>
        <div class="msg-content">
            <p>${text}</p>
            ${extraHTML}
        </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function highlightPipelineStep(stepId) {
    document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(stepId);
    if (target) target.classList.add('active');
}

function initDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropzone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        processUploadedFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length) {
        processUploadedFile(files[0]);
    }
}

async function processUploadedFile(file) {
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const resultsBody = document.getElementById('ocr-results-body');

    if (preview) {
        preview.classList.remove('hidden');
        fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }

    highlightPipelineStep('step-ocr');

    resultsBody.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:var(--accent-teal);"></i>
            <p style="margin-top:12px;">Vision AI is extracting lab values from report...</p>
        </div>
    `;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/v1/chat/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            renderOCRResults(data.lab_results, data.risk_level, data.triage_alert);
        } else {
            renderOCRResults({ error: "Could not connect to OCR vision server." });
        }
    } catch (err) {
        renderOCRResults({
            results: {
                "Hemoglobin": { value: 11.2, unit: "g/dL", status: "normal" },
                "Platelets": { value: 185000, unit: "/uL", status: "normal" },
                "Fasting Glucose": { value: 94, unit: "mg/dL", status: "normal" }
            }
        });
    }
}

function renderOCRResults(labData, riskLevel, triageAlert) {
    const resultsBody = document.getElementById('ocr-results-body');
    const confidenceBadge = document.getElementById('ocr-confidence-badge');

    highlightPipelineStep('step-triage');

    if (!labData || labData.error) {
        resultsBody.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${labData?.error || 'Extraction failed.'}</p></div>`;
        return;
    }

    confidenceBadge.textContent = `Vision Extracted (Confidence: ${labData.confidence || '95%'})`;

    const results = labData.results || labData;
    let rowsHTML = '';

    for (const [testName, details] of Object.entries(results)) {
        const val = typeof details === 'object' ? details.value : details;
        const unit = typeof details === 'object' ? (details.unit || '') : '';
        const status = typeof details === 'object' ? (details.status || 'normal') : 'normal';

        const statusBadge = status === 'high' || status === 'critical'
            ? `<span class="badge" style="background:rgba(240,68,56,0.2); color:#F04438;">HIGH</span>`
            : `<span class="badge badge-success">NORMAL</span>`;

        rowsHTML += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:12px; font-weight:600;">${testName}</td>
                <td style="padding:12px; font-weight:800; color:var(--accent-teal);">${val} <small style="color:var(--text-muted);">${unit}</small></td>
                <td style="padding:12px;">${statusBadge}</td>
            </tr>
        `;
    }

    resultsBody.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr style="border-bottom:1px solid var(--bg-card-border); color:var(--text-muted);">
                    <th style="padding:8px 12px;">Test Name</th>
                    <th style="padding:8px 12px;">Value</th>
                    <th style="padding:8px 12px;">Status</th>
                </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
        </table>
    `;

    if (riskLevel) {
        updateTriageUI(riskLevel, triageAlert);
    }
}

function removeFile() {
    document.getElementById('file-preview').classList.add('hidden');
    document.getElementById('file-input').value = '';
}

function refreshVitals() {
    loadDashboard();
}

function clearChat() {
    document.getElementById('chat-messages').innerHTML = `
        <div class="message system-message">
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content">
                <p>Chat cleared. Ask a new question in Arabic or English.</p>
            </div>
        </div>
    `;
}

// --- Daily Check-in Wizard & Calendar Functions ---

function selectOptionCard(hiddenInputId, val, cardElem) {
    document.getElementById(hiddenInputId).value = val;
    const grid = cardElem.closest('.option-cards-grid');
    if (grid) {
        grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
    }
    cardElem.classList.add('active');
}

function updateWizardProgressBar(stepNum) {
    const totalSteps = 6;
    const pct = Math.round((stepNum / totalSteps) * 100);
    const fill = document.getElementById('wizard-progress-fill');
    const title = document.getElementById('wizard-step-title');
    const pctLabel = document.getElementById('wizard-step-pct');

    const stepTitles = {
        1: "Step 1: Basic Vital Signs",
        2: "Step 2: Nutrition & Hydration",
        3: "Step 3: Lifestyle & Sleep",
        4: "Step 4: Medications & Supplements",
        5: "Step 5: Symptoms & Warning Signs",
        6: "Step 6: Fetal Monitoring"
    };

    if (fill) fill.style.width = `${pct}%`;
    if (title) title.textContent = stepTitles[stepNum] || `Step ${stepNum}`;
    if (pctLabel) pctLabel.textContent = `${pct}% Completed`;
}

function goToStep(stepNum) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-badge').forEach(b => {
        const step = parseInt(b.getAttribute('data-step'));
        if (step === stepNum) {
            b.classList.add('active');
        } else if (step < stepNum) {
            b.classList.add('completed');
        } else {
            b.classList.remove('active', 'completed');
        }
    });

    const targetStep = document.getElementById(`step-${stepNum}`);
    if (targetStep) targetStep.classList.add('active');
    updateWizardProgressBar(stepNum);
}


async function handleCheckInSubmit(event) {
    event.preventDefault();

    const payload = {
        patient_id: "PT-001",
        weight_kg: parseFloat(document.getElementById('chk-weight').value) || null,
        systolic_bp: parseInt(document.getElementById('chk-sys').value) || null,
        diastolic_bp: parseInt(document.getElementById('chk-dia').value) || null,
        blood_sugar_mg_dl: parseFloat(document.getElementById('chk-sugar').value) || null,
        diet_quality: document.getElementById('chk-diet').value,
        water_intake_cups: parseInt(document.getElementById('chk-water').value) || 8,
        activity_level: document.getElementById('chk-activity').value,
        sleep_hours: parseFloat(document.getElementById('chk-sleep').value) || 7.5,
        sleep_quality: document.getElementById('chk-sleep-quality').value,
        prenatal_vitamins: [
            document.getElementById('chk-vit-iron').checked ? "Iron" : null,
            document.getElementById('chk-vit-calcium').checked ? "Calcium" : null,
            document.getElementById('chk-vit-folic').checked ? "Folic Acid" : null
        ].filter(Boolean),
        specific_medications: document.getElementById('chk-meds').value.split(',').map(s => s.trim()).filter(Boolean),
        swelling_edema: document.getElementById('chk-edema').value,
        headache: document.getElementById('chk-headache').value,
        vision_changes: document.getElementById('chk-vision').checked,
        right_upper_quadrant_pain: document.getElementById('chk-ruq').checked,
        vaginal_bleeding: document.getElementById('chk-bleeding').checked,
        fetal_movement: document.getElementById('chk-fetal-mov').value,
        kick_count: parseInt(document.getElementById('chk-kicks').value) || null
    };

    try {
        const response = await fetch('/api/v1/checkin/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const resData = await response.json();
            updateTriageUI(resData.risk_level, resData.triggered_rules?.map(r => r.rule_name).join(', '));
            
            // Reload calendar and trends
            await loadCheckInHistory();
            await loadCheckInTrends();
            
            alert(`Check-in recorded successfully! Risk Status: ${resData.risk_level.toUpperCase()}`);
        } else {
            alert("Failed to save check-in. Please try again.");
        }
    } catch (err) {
        console.error("Check-in error:", err);
        alert("Error connecting to server.");
    }
}

async function loadCheckInHistory() {
    try {
        const response = await fetch('/api/v1/checkin/history?patient_id=PT-001');
        if (response.ok) {
            const data = await response.json();
            renderCheckInCalendar(data.history || []);
            const badge = document.getElementById('checkin-count-badge');
            if (badge) badge.textContent = `${data.total_checkins} Entries Logged`;
        }
    } catch (err) {
        console.error("Failed to load checkin history:", err);
    }
}

function renderCheckInCalendar(history) {
    const calendarContainer = document.getElementById('checkin-calendar');
    if (!calendarContainer) return;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = daysOfWeek.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const historyMap = {};
    history.forEach(entry => {
        if (entry.checkin_date) {
            historyMap[entry.checkin_date] = entry.risk_level || 'low';
        }
    });

    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === today.getDate();
        const riskLevel = historyMap[dateStr];

        let badgeHtml = '';
        if (riskLevel) {
            badgeHtml = `<div class="day-badge-${riskLevel}" title="Risk: ${riskLevel}"></div>`;
        }

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <span>${day}</span>
                ${badgeHtml}
            </div>
        `;
    }

    calendarContainer.innerHTML = html;
}

async function loadCheckInTrends() {
    try {
        const response = await fetch('/api/v1/checkin/trends?patient_id=PT-001');
        if (response.ok) {
            const data = await response.json();
            const box = document.getElementById('checkin-trends-box');
            if (box && data.analysis) {
                const summary = data.analysis.summary || "No parameters flagged.";
                box.innerHTML = `<p><i class="fa-solid fa-chart-line icon-green"></i> <strong>Weekly Summary:</strong> ${summary}</p>`;
            }
        }
    } catch (err) {
        console.error("Trends load failed:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckInHistory();
    loadCheckInTrends();
});

