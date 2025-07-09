document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
const elements = {
    todayLocationPremium: document.getElementById('today-location-premium'),
    todayLocationPolicies: document.getElementById('today-location-policies'),
    todayCompanyPremium: document.getElementById('today-company-premium'),
    todayCompanyPolicies: document.getElementById('today-company-policies'),
    monthLocationPremium: document.getElementById('month-location-premium'),
    monthLocationPolicies: document.getElementById('month-location-policies'),
    monthCompanyPremium: document.getElementById('month-company-premium'),
    monthCompanyPolicies: document.getElementById('month-company-policies'),
    csrTodayTable: document.getElementById('csr-today-table'),
    csrTodayTotals: document.getElementById('csr-today-totals'),
    csrMonthTable: document.getElementById('csr-month-table'),
    csrMonthTotals: document.getElementById('csr-month-totals'),
    currentTime: document.getElementById('current-time'),
    nextUpdate: document.getElementById('next-update'),
    currentDate: document.getElementById('current-date'),
    updateTime: document.getElementById('update-time'),
    errorContainer: document.getElementById('error-container'),
    locationAlias: document.getElementById('location-alias'),
    footerLocationAlias: document.getElementById('footer-location-alias'),
    remainingGoal: document.getElementById('remaining-goal'),
    monthlyGoalAmount: document.getElementById('monthly-goal-amount'),
    monthlyGoalRaw: document.getElementById('monthly-goal-raw'),
    companyLogo: document.getElementById('company-logo')
};

const refreshInterval = 600000; // 10 min
let monthlyGoal;
let updateTimer;
let retryCount = 0;

    function parseCurrencyToNumber(currencyString) {
        if (typeof currencyString === 'number') return currencyString;
        if (typeof currencyString !== 'string') return 0;
        if (currencyString.endsWith('M')) {
            return parseFloat(currencyString.replace(/[^\d.-]/g, '')) * 1000000;
        }
        if (currencyString.endsWith('K')) {
            return parseFloat(currencyString.replace(/[^\d.-]/g, '')) * 1000;
        }
        return parseFloat(currencyString.replace(/[^\d.-]/g, '')) || 0;
    }

    function formatTVCurrency(amount) {
        if (typeof amount === 'string' && amount.startsWith('$')) return amount;
        const numericAmount = typeof amount === 'number' ? amount : parseCurrencyToNumber(amount);
        if (isNaN(numericAmount)) return '$0';
        const isNegative = numericAmount < 0;
        const absAmount = Math.abs(numericAmount);
        let formatted;
        if (absAmount >= 1000000) {
            formatted = `$${(absAmount / 1000000).toFixed(1)}M`;
        } else if (absAmount >= 1000) {
            formatted = `$${(absAmount / 1000).toFixed(1)}K`;
        } else {
            formatted = `$${Math.round(absAmount).toLocaleString()}`;
        }
        return isNegative ? `-${formatted}` : formatted;
    }

    function animateMetricUpdate(element) {
        if (!element) return;
        element.classList.remove('metric-animate');
        void element.offsetWidth; // reflow para reiniciar la animación
        element.classList.add('metric-animate');
    }

    function formatTableCurrency(amount) {
        const numericAmount = typeof amount === 'number' ? amount : parseCurrencyToNumber(amount);
        if (isNaN(numericAmount)) return '$0.00';
        const isNegative = numericAmount < 0;
        const absAmount = Math.abs(numericAmount);
        return (isNegative ? '-' : '') + '$' + absAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    function safeUpdate(element, value, fallback = '0') {
        if (element) element.textContent = value !== undefined && value !== null ? value : fallback;
    }

    function safeUpdateCSRTable(tableElement, csrData) {
        if (!tableElement) return;
        while (tableElement.rows.length > 1) { tableElement.deleteRow(1); }
        const MAX_ROWS = 10;
        const dataToShow = Array(MAX_ROWS)
            .fill(null)
            .map((_, i) => (csrData && csrData[i]) ? csrData[i] : null);
        dataToShow.forEach(csr => {
            const row = tableElement.insertRow();
            if (csr) {
                const nameCell = row.insertCell(0);
                nameCell.textContent = csr.csr || csr.name || 'N/A';
                nameCell.className = 'csr-name';
                const policiesCell = row.insertCell(1);
                policiesCell.textContent = csr.policies || '0';
                policiesCell.className = 'csr-policies';
                const premiumCell = row.insertCell(2);
                premiumCell.textContent = formatTableCurrency(csr.premium) || '$0.00';
                premiumCell.className = 'csr-premium';
            } else {
                row.classList.add('filler-row');
                for (let j = 0; j < 3; j++) {
                    const td = row.insertCell(j);
                    td.innerHTML = '&nbsp;';
                }
            }
        });
    }

    function safeUpdateCSRTotals(data) {
        const sumPremium = (csrArray) => Array.isArray(csrArray)
            ? csrArray.reduce((sum, csr) => sum + parseCurrencyToNumber(csr.premium), 0)
            : 0;
        const sumPolicies = (csrArray) => Array.isArray(csrArray)
            ? csrArray.reduce((sum, csr) => sum + (parseInt(csr.policies) || 0), 0)
            : 0;
        if (elements.csrTodayTotals) {
            const todayTotalPremium = sumPremium(data.csrToday);
            const todayTotalPolicies = sumPolicies(data.csrToday);
            elements.csrTodayTotals.textContent =
                `${formatTableCurrency(todayTotalPremium)} / ${todayTotalPolicies}`;
        }
        if (elements.csrMonthTotals) {
            const monthTotalPremium = sumPremium(data.csrMonth);
            const monthTotalPolicies = sumPolicies(data.csrMonth);
            elements.csrMonthTotals.textContent =
                `${formatTableCurrency(monthTotalPremium)} / ${monthTotalPolicies}`;
        }
    }

    function safeApplyChangeAnimation() {
        try {
            const metricValues = document.querySelectorAll('.metric-value, .csr-premium, .csr-policies, .remaining-amount');
            metricValues.forEach(value => {
                if (value) {
                    value.classList.add('changing');
                    setTimeout(() => {
                        if (value) value.classList.remove('changing');
                    }, 500);
                }
            });
        } catch (e) { }
    }

    function safeResetNextUpdateCounter() {
        if (!elements.nextUpdate) return;
        try {
            if (updateTimer) clearInterval(updateTimer);
            let secondsLeft = refreshInterval / 1000;
            elements.nextUpdate.textContent = `${secondsLeft} sec`;
            updateTimer = setInterval(() => {
                secondsLeft--;
                if (elements.nextUpdate) elements.nextUpdate.textContent = `${secondsLeft} sec`;
                if (secondsLeft <= 0) {
                    clearInterval(updateTimer);
                    if (elements.nextUpdate) elements.nextUpdate.textContent = 'Updating...';
                }
            }, 1000);
        } catch (e) { }
    }


function updateGoalProgress(current, goal) {
    const circle = document.querySelector('.progress-bar');
    const text = document.getElementById('goal-progress-text');
    let percent = 0;

    if (typeof current === "string") current = Number(current.replace(/[^\d.-]/g, ""));
    if (typeof goal === "string") goal = Number(goal.replace(/[^\d.-]/g, ""));
    if (goal > 0 && !isNaN(current) && !isNaN(goal)) {
        percent = Math.round(Math.min(100, Math.max(0, (current / goal) * 100)));
    }
    const radius = 42;
    const circumference = 2 * Math.PI * radius; // 263.89
    const offset = circumference - percent / 100 * circumference;

    if (circle) {
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = offset;
    }
    if (text) text.textContent = percent + "%";
}

    function initMonthlyGoal() {
        try {
            let goalValue = elements.monthlyGoalRaw ? elements.monthlyGoalRaw.textContent : null;
            if (goalValue && !isNaN(Number(goalValue))) {
                monthlyGoal = Number(goalValue);
            } else {
                const goalText = elements.monthlyGoalAmount.textContent;
                monthlyGoal = parseCurrencyToNumber(goalText);
            }
            if (!monthlyGoal) monthlyGoal = 10000000;
            console.log(`Meta mensual inicializada: $${monthlyGoal.toLocaleString()}`);
        } catch (error) {
            console.error('Error inicializando meta mensual:', error);
            monthlyGoal = 10000000;
        }
    }

function updateClockAndDate() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedDate = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('current-time').textContent = formattedTime;
    document.getElementById('current-date').textContent = formattedDate;
}

// Esta función asegura que el reloj siempre actualice justo al inicio de cada minuto:
function startClockMinuteSync() {
    updateClockAndDate();
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
        updateClockAndDate();
        setInterval(updateClockAndDate, 60000);
    }, msToNextMinute);
}


    function updateLocationAliasInDOM(alias) {
        document.querySelectorAll('.js-location-alias').forEach(el => {
            el.textContent = alias;
        });
        safeUpdate(elements.locationAlias, alias, 'Location');
        safeUpdate(elements.footerLocationAlias, alias, 'Location');
    }

    function updateUI(data) {
        // === ACTUALIZA Y ANIMA LAS MÉTRICAS ===
        safeUpdate(elements.todayLocationPremium, formatTVCurrency(data.today.location.premium), '$0');
        animateMetricUpdate(elements.todayLocationPremium);

        safeUpdate(elements.todayLocationPolicies, data.today.location.policies, '0');
        animateMetricUpdate(elements.todayLocationPolicies);

        safeUpdate(elements.todayCompanyPremium, formatTVCurrency(data.today.company.premium), '$0');
        animateMetricUpdate(elements.todayCompanyPremium);

        safeUpdate(elements.todayCompanyPolicies, data.today.company.policies, '0');
        animateMetricUpdate(elements.todayCompanyPolicies);

        safeUpdate(elements.monthLocationPremium, formatTVCurrency(data.month.location.premium), '$0');
        animateMetricUpdate(elements.monthLocationPremium);

        safeUpdate(elements.monthLocationPolicies, data.month.location.policies, '0');
        animateMetricUpdate(elements.monthLocationPolicies);

        safeUpdate(elements.monthCompanyPremium, formatTVCurrency(data.month.company.premium), '$0');
        animateMetricUpdate(elements.monthCompanyPremium);

        safeUpdate(elements.monthCompanyPolicies, data.month.company.policies, '0');
        animateMetricUpdate(elements.monthCompanyPolicies);

        // === ACTUALIZA Y ANIMA EL GOAL ===
        try {
            const companyMonthPremium = parseCurrencyToNumber(data.month.company.premium);
            const remaining = monthlyGoal - companyMonthPremium;
            safeUpdate(elements.remainingGoal, formatTableCurrency(remaining), '$0');
            animateMetricUpdate(elements.remainingGoal);
            updateGoalProgress(companyMonthPremium, monthlyGoal);

            if (remaining <= 0) {
                elements.remainingGoal.classList.add('goal-reached');
                elements.remainingGoal.classList.remove('goal-not-reached');
            } else {
                elements.remainingGoal.classList.add('goal-not-reached');
                elements.remainingGoal.classList.remove('goal-reached');
            }
        } catch (e) { 
            safeUpdate(elements.remainingGoal, '$0'); 
        }

        // === ACTUALIZA TABLAS Y TOTALES ===
        safeUpdateCSRTable(elements.csrTodayTable, data.csrToday);
        safeUpdateCSRTable(elements.csrMonthTable, data.csrMonth);
        safeUpdateCSRTotals(data);

        // === FECHA Y HORA ===
        try {
            const now = new Date();
            const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            safeUpdate(elements.currentTime, formattedTime);
            safeUpdate(elements.updateTime, formattedTime);
            const formattedDate = now.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            safeUpdate(elements.currentDate, formattedDate);
        } catch (e) { }

        safeResetNextUpdateCounter();
        updateLocationAliasInDOM(data.locationAlias || 'Corporate');
        if (elements.errorContainer && elements.errorContainer.style.display === 'block') {
            elements.errorContainer.style.display = 'none';
        }
        safeApplyChangeAnimation();
    }

    function showError(message) {
        if (!elements.errorContainer) {
            const errorContainer = document.createElement('div');
            errorContainer.id = 'error-container';
            errorContainer.style.position = 'absolute';
            errorContainer.style.top = '50%';
            errorContainer.style.left = '50%';
            errorContainer.style.transform = 'translate(-50%, -50%)';
            errorContainer.style.background = 'rgba(231, 76, 60, 0.95)';
            errorContainer.style.padding = '40px';
            errorContainer.style.borderRadius = '20px';
            errorContainer.style.textAlign = 'center';
            errorContainer.style.width = '80%';
            errorContainer.style.maxWidth = '700px';
            errorContainer.style.fontSize = '2.2rem';
            errorContainer.style.zIndex = '10';
            errorContainer.style.display = 'none';
            errorContainer.style.border = '3px solid #fff';
            errorContainer.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(errorContainer);
            elements.errorContainer = errorContainer;
        }
        elements.errorContainer.innerHTML = `
            <h2>SYSTEM ERROR</h2>
            <p>${message}</p>
            <p style="font-size: 1.5rem; margin-top: 20px;">Reconnecting in 15 seconds...</p>
        `;
        elements.errorContainer.style.display = 'block';
    }

    function createBackgroundElements() {
        const bgContainer = document.getElementById('background-elements');
        if (!bgContainer) return;
        for (let i = 0; i < 25; i++) {
            const circle = document.createElement('div');
            circle.className = 'bg-circle';
            const size = Math.random() * 100 + 30;
            circle.style.width = `${size}px`;
            circle.style.height = `${size}px`;
            circle.style.left = `${Math.random() * 100}%`;
            circle.style.top = `${Math.random() * 100}%`;
            circle.style.opacity = Math.random() * 0.1 + 0.05;
            circle.style.animationDelay = `${Math.random() * 20}s`;
            bgContainer.appendChild(circle);
        }
    }

    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        let locationType = urlParams.get('location_type') || 1;
        let locationId = urlParams.get('location_id');
        if (!locationId || locationId === 'null') locationId = '';
        return {
            locationType,
            locationId
        };
    }

    async function fetchData() {
        try {
            const { locationType, locationId } = getUrlParams();
            let apiUrl = `/televisor/data?location_type=${locationType}`;
            if (locationId) {
                apiUrl += `&location_id=${locationId}`;
            }
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMsg = errorData?.error || `Error ${response.status}: ${response.statusText}`;
                throw new Error(errorMsg);
            }
            const data = await response.json();
            if (data.error) {
                showError(`Backend Error: ${data.error}`);
            } else {
                retryCount = 0;
                updateUI({
                    today: data.today,
                    month: data.month,
                    csrToday: data.csrToday || [],
                    csrMonth: data.csrMonth || [],
                    locations: data.locations || [],
                    locationAlias: data.locationAlias || 'Corporate'
                });
            }
        } catch (error) {
            showError('Connection Error: ' + error.message);
            const delay = Math.min(30000, 2000 * Math.pow(2, retryCount));
            setTimeout(fetchData, delay);
            retryCount++;
        }
    }

    function checkCriticalElements() {
        const criticalElements = [
            'today-location-premium', 'today-company-premium',
            'month-location-premium', 'month-company-premium',
            'csr-today-table', 'csr-month-table',
            'monthly-goal-amount', 'remaining-goal'
        ];
        criticalElements.forEach(id => {
            if (!document.getElementById(id)) {
                showError(`Critical element #${id} is missing from the page`);
            }
        });
    }

    // --- NEWS TICKER ---
    async function fetchAndRenderTicker() {
        try {
            const { locationId } = getUrlParams(); 
            const res = await fetch(`/ticker/data?location_id=${locationId || ''}`);
            if (!res.ok) throw new Error('Ticker fetch failed');
            const { tickerLines } = await res.json();
            renderNewsTicker(tickerLines);
        } catch (e) {
            renderNewsTicker(["No ticker data available"]);
        }
    }

    function renderNewsTicker(lines) {
        const ticker = document.getElementById('news-ticker');
        if (!ticker) return;
        ticker.innerHTML = lines && lines.length
            ? lines.map(line => `<span class="ticker-item">${line}</span>`).join(' ')
            : '<span class="ticker-item">No ticker data</span>';
        ticker.style.animation = 'none';
        void ticker.offsetWidth;
        ticker.style.animation = '';
    }

    // --- INIT ---
 function init() {
    checkCriticalElements();
    createBackgroundElements();
    initMonthlyGoal();
    fetchData();
    fetchAndRenderTicker();
    setInterval(fetchData, refreshInterval);
    setInterval(fetchAndRenderTicker, refreshInterval);
    safeResetNextUpdateCounter();
    startClockMinuteSync(); // <-- AQUÍ debes ponerlo
    if (elements.companyLogo) {
        elements.companyLogo.innerHTML = `
             <img src="/img/branding/gti_logo1.png" alt="Company Logo" 
                 style="max-width: 200px; max-height: 80px;">
        `;
    }
}
init();
});
