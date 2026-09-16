(() => {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let banner = document.querySelector('.weather-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'weather-banner';
        banner.setAttribute('aria-label', 'Current Orlando weather');
        banner.innerHTML = `
            <div class="container weather-inner">
                <div class="weather-location">Remote · Orlando, FL</div>
                <div class="weather-current" aria-live="polite">
                    <span class="weather-icon" aria-hidden="true">·</span>
                    <span class="weather-temp">--°F</span>
                    <span class="weather-condition">Loading weather…</span>
                    <span class="weather-separator">•</span>
                    <span class="weather-feels">Feels --°F</span>
                </div>
            </div>`;
        header.insertAdjacentElement('afterend', banner);
    }

    const iconEl = banner.querySelector('.weather-icon');
    const tempEl = banner.querySelector('.weather-temp');
    const conditionEl = banner.querySelector('.weather-condition');
    const feelsEl = banner.querySelector('.weather-feels');

    const weatherState = (code, isDay) => {
        if (code === 0) return { icon: isDay ? '☀️' : '🌙', label: 'Clear' };
        if (code <= 2) return { icon: isDay ? '🌤️' : '☁️', label: 'Partly cloudy' };
        if (code === 3) return { icon: '☁️', label: 'Overcast' };
        if (code === 45 || code === 48) return { icon: '🌫️', label: 'Fog' };
        if (code >= 51 && code <= 67) return { icon: '🌧️', label: 'Rain' };
        if (code >= 71 && code <= 77) return { icon: '🌨️', label: 'Snow' };
        if (code >= 80 && code <= 82) return { icon: '🌦️', label: 'Showers' };
        if (code >= 85 && code <= 86) return { icon: '🌨️', label: 'Snow showers' };
        if (code >= 95) return { icon: '⛈️', label: 'Thunderstorms' };
        return { icon: isDay ? '🌤️' : '🌙', label: 'Current conditions' };
    };

    const loadWeather = async () => {
        try {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=28.5383&longitude=-81.3792&current=temperature_2m,apparent_temperature,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FNew_York';
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const current = data.current || {};
            const temp = Math.round(Number(current.temperature_2m));
            const feels = Math.round(Number(current.apparent_temperature));
            const state = weatherState(Number(current.weather_code), Number(current.is_day) === 1);

            iconEl.textContent = state.icon;
            tempEl.textContent = Number.isFinite(temp) ? `${temp}°F` : '--°F';
            conditionEl.textContent = state.label;
            feelsEl.textContent = Number.isFinite(feels) ? `Feels ${feels}°F` : 'Feels --°F';
        } catch (error) {
            iconEl.textContent = '◌';
            tempEl.textContent = '';
            conditionEl.textContent = 'Weather unavailable';
            feelsEl.textContent = '';
        }
    };

    loadWeather();
    window.setInterval(loadWeather, 600000);
})();
