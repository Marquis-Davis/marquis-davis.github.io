(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer || document.querySelector('.system-health')) return;

    const section = document.createElement('section');
    section.className = 'system-health';
    section.setAttribute('aria-label', 'Portfolio system health');
    section.innerHTML = `
        <div class="container system-health-inner">
            <div class="system-health-head">
                <div class="system-health-title">
                    <div>
                        <div class="system-health-kicker">System Status</div>
                        <div class="system-health-summary" id="systemHealthSummary">Checking portfolio services…</div>
                    </div>
                </div>
                <div class="system-health-overall" id="systemHealthOverall">Checking</div>
            </div>
            <div class="system-health-grid">
                <a class="health-item" id="healthPortfolio" href="index.html">
                    <div class="health-item-top"><span class="health-item-name">Portfolio</span><span class="health-state">Online</span></div>
                    <div class="health-item-detail">GitHub Pages responding</div>
                </a>
                <a class="health-item" id="healthFeed" href="index.html#activity">
                    <div class="health-item-top"><span class="health-item-name">Engineering Feed</span><span class="health-state">Checking</span></div>
                    <div class="health-item-detail">Reading activity telemetry</div>
                </a>
                <div class="health-item" id="healthWeather">
                    <div class="health-item-top"><span class="health-item-name">Orlando Weather</span><span class="health-state">Checking</span></div>
                    <div class="health-item-detail">Waiting for current conditions</div>
                </div>
                <a class="health-item" id="healthMarket" href="ai-buildout-radar.html">
                    <div class="health-item-top"><span class="health-item-name">AI Market Data</span><span class="health-state">Checking</span></div>
                    <div class="health-item-detail">Reading latest snapshot</div>
                </a>
                <a class="health-item" id="healthDeploy" href="https://github.com/Marquis-Davis/marquis-davis.github.io/actions" target="_blank" rel="noopener noreferrer">
                    <div class="health-item-top"><span class="health-item-name">Last Deploy</span><span class="health-state">Checking</span></div>
                    <div class="health-item-detail">Reading GitHub Pages status</div>
                </a>
            </div>
        </div>`;
    footer.parentNode.insertBefore(section, footer);

    const overallEl = document.getElementById('systemHealthOverall');
    const summaryEl = document.getElementById('systemHealthSummary');
    const statuses = new Map();
    let lastDeployTimestamp = null;

    const relativeTime = value => {
        if (!value) return 'unknown';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'unknown';
        const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const ageMs = value => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? Infinity : Math.max(0, Date.now() - date.getTime());
    };

    const setStatus = (id, level, state, detail) => {
        const item = document.getElementById(id);
        if (!item) return;
        item.classList.remove('warn', 'error');
        if (level === 'warn' || level === 'error') item.classList.add(level);
        const stateEl = item.querySelector('.health-state');
        const detailEl = item.querySelector('.health-item-detail');
        if (stateEl) stateEl.textContent = state;
        if (detailEl) detailEl.textContent = detail;
        statuses.set(id, level);
        updateOverall();
    };

    const updateOverall = () => {
        const values = [...statuses.values()];
        if (!values.length) return;
        const errors = values.filter(level => level === 'error').length;
        const warnings = values.filter(level => level === 'warn').length;
        overallEl.classList.remove('warn', 'error');
        if (errors) {
            overallEl.classList.add('error');
            overallEl.textContent = 'Attention';
            summaryEl.textContent = `${errors} service${errors === 1 ? '' : 's'} unavailable`;
        } else if (warnings) {
            overallEl.classList.add('warn');
            overallEl.textContent = 'Operational';
            summaryEl.textContent = `${warnings} signal${warnings === 1 ? '' : 's'} delayed · core portfolio online`;
        } else if (values.length >= 5) {
            overallEl.textContent = 'All systems operational';
            summaryEl.textContent = 'Portfolio services are healthy and reporting';
        } else {
            overallEl.textContent = 'Checking';
            summaryEl.textContent = 'Verifying portfolio services…';
        }
    };

    setStatus('healthPortfolio', 'healthy', 'Online', 'GitHub Pages responding');

    const refreshFeed = async () => {
        try {
            const response = await fetch(`data/activity.json?v=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const generated = data.generatedAtUtc;
            const age = ageMs(generated);
            if (age <= 45 * 60 * 1000) {
                setStatus('healthFeed', 'healthy', 'Live', `Refreshed ${relativeTime(generated)}`);
            } else if (age <= 6 * 60 * 60 * 1000) {
                setStatus('healthFeed', 'warn', 'Delayed', `Last refresh ${relativeTime(generated)}`);
            } else {
                setStatus('healthFeed', 'warn', 'Stale', `Last refresh ${relativeTime(generated)}`);
            }

            if (!lastDeployTimestamp) {
                const deployment = (data.items || []).find(item => item.id === 'deployment');
                if (deployment?.timestamp) {
                    lastDeployTimestamp = deployment.timestamp;
                    setStatus('healthDeploy', 'healthy', relativeTime(deployment.timestamp), 'GitHub Pages · main');
                    if (deployment.url) document.getElementById('healthDeploy').href = deployment.url;
                }
            }
        } catch (error) {
            setStatus('healthFeed', 'error', 'Unavailable', 'Activity telemetry could not be loaded');
        }
    };

    const refreshWeather = () => {
        const conditionEl = document.querySelector('.weather-condition');
        const tempEl = document.querySelector('.weather-temp');
        if (!conditionEl) {
            setStatus('healthWeather', 'warn', 'Waiting', 'Weather component not ready');
            return;
        }
        const condition = (conditionEl.textContent || '').trim();
        const temp = (tempEl?.textContent || '').trim();
        if (!condition || /loading/i.test(condition)) {
            setStatus('healthWeather', 'warn', 'Waiting', 'Current conditions are loading');
        } else if (/unavailable/i.test(condition)) {
            setStatus('healthWeather', 'error', 'Unavailable', 'Weather provider did not respond');
        } else {
            setStatus('healthWeather', 'healthy', 'Live', [temp, condition].filter(Boolean).join(' · '));
        }
    };

    const refreshMarket = async () => {
        try {
            const response = await fetch(`data/ai-market-context.json?v=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const timestamps = (data.companies || []).map(company => company.priceAsOf).filter(Boolean);
            const newest = timestamps.sort((a, b) => new Date(b) - new Date(a))[0] || data.generatedAtUtc;
            const age = ageMs(newest);
            if (age <= 4 * 24 * 60 * 60 * 1000) {
                setStatus('healthMarket', 'healthy', 'Synced', `Latest price snapshot ${relativeTime(newest)}`);
            } else if (age <= 7 * 24 * 60 * 60 * 1000) {
                setStatus('healthMarket', 'warn', 'Aging', `Latest price snapshot ${relativeTime(newest)}`);
            } else {
                setStatus('healthMarket', 'warn', 'Stale', `Latest price snapshot ${relativeTime(newest)}`);
            }
        } catch (error) {
            setStatus('healthMarket', 'error', 'Unavailable', 'Market snapshot could not be loaded');
        }
    };

    const refreshDeploy = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/Marquis-Davis/marquis-davis.github.io/actions/runs?per_page=20', {
                headers: { Accept: 'application/vnd.github+json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const run = (data.workflow_runs || []).find(item => item.name === 'pages build and deployment' && item.conclusion === 'success');
            if (!run) throw new Error('No successful Pages run found');
            lastDeployTimestamp = run.updated_at || run.created_at;
            const deployEl = document.getElementById('healthDeploy');
            deployEl.href = run.html_url || deployEl.href;
            setStatus('healthDeploy', 'healthy', relativeTime(lastDeployTimestamp), 'GitHub Pages · main');
        } catch (error) {
            if (!lastDeployTimestamp) {
                setStatus('healthDeploy', 'warn', 'Unknown', 'GitHub deployment status unavailable');
            }
        }
    };

    const refreshRelativeDeploy = () => {
        if (lastDeployTimestamp) setStatus('healthDeploy', 'healthy', relativeTime(lastDeployTimestamp), 'GitHub Pages · main');
    };

    refreshFeed();
    refreshMarket();
    refreshDeploy();
    window.setTimeout(refreshWeather, 1200);
    window.setInterval(() => {
        refreshFeed();
        refreshMarket();
        refreshWeather();
        refreshRelativeDeploy();
    }, 60000);
    window.setInterval(refreshDeploy, 600000);
})();
