/* ================= SAFE STORAGE HELPER ================= */
const safeStorage = {
    getItem(key) {
        try {
            return window.localStorage ? window.localStorage.getItem(key) : null;
        } catch (e) {
            return null;
        }
    },
    setItem(key, value) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (e) {}
    }
};

/* ================= STATE & CONFIG ================= */
let currentUnit = safeStorage.getItem("weatherwise_unit") || "C";
let lastWeatherData = null;
let currentCityLabel = "London, United Kingdom";
let currentLat = 51.5085;
let currentLon = -0.1257;
let currentTimezone = "Europe/London";
let currentDisplayedTemp = 18;
let autoRefreshTimer = null;
let autoRefreshSeconds = 900;
let clockInterval = null;
let selectedHourlyDay = "today"; // 'today' or 'tomorrow'

// 3D Celestial Simulation State
let isSimulating = false;
let simInterval = null;
let simProgress = 0; // 0 to 1

/* ================= DOM ELEMENTS ================= */
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const saveCityBtn = document.getElementById("saveCityBtn");
const saveCityIcon = document.getElementById("saveCityIcon");
const saveCityText = document.getElementById("saveCityText");
const manualRefreshBtn = document.getElementById("manualRefreshBtn");
const refreshTimerText = document.getElementById("refreshTimerText");
const quickCityBtns = document.querySelectorAll(".city-pill-3d");
const unitBtn = document.getElementById("unitBtn");
const themeBtn = document.getElementById("themeBtn");

const localTimeDisplay = document.getElementById("localTimeDisplay");
const localDateDisplay = document.getElementById("localDateDisplay");

const errorBox = document.getElementById("error");
const loadingBox = document.getElementById("loading");
const loadingMsg = document.getElementById("loadingMsg");
const weatherCard = document.getElementById("weatherCard");

const cityNameEl = document.getElementById("cityName");
const timezoneTextEl = document.getElementById("timezoneText");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const tempUnitEl = document.getElementById("tempUnit");
const tempHighLowEl = document.getElementById("tempHighLow");
const conditionEl = document.getElementById("condition");

// 3D Celestial Horizon Dome Elements
const celestialModeIcon = document.getElementById("celestialModeIcon");
const celestialModeName = document.getElementById("celestialModeName");
const celestialHeading = document.getElementById("celestialHeading");
const celestialRemainingText = document.getElementById("celestialRemainingText");
const celestialOrbiter = document.getElementById("celestialOrbiter");
const celestialBody = document.getElementById("celestialBody");
const celestialEmoji = document.getElementById("celestialEmoji");
const sunriseTimeEl = document.getElementById("sunriseTime");
const sunsetTimeEl = document.getElementById("sunsetTime");
const solarProgressBadge = document.getElementById("solarProgressBadge");
const simPlayBtn = document.getElementById("simPlayBtn");
const simResetBtn = document.getElementById("simResetBtn");
const celestialScrubber = document.getElementById("celestialScrubber");

// Real-Time Monitoring Dashboard Elements
const compassNeedle = document.getElementById("compassNeedle");
const windBearingText = document.getElementById("windBearingText");
const windSpeedVal = document.getElementById("windSpeedVal");
const windGustsVal = document.getElementById("windGustsVal");

const pressureNumber = document.getElementById("pressureNumber");
const pressureTrendPill = document.getElementById("pressureTrendPill");
const trendIcon = document.getElementById("trendIcon");
const trendText = document.getElementById("trendText");
const pressureFillBar = document.getElementById("pressureFillBar");
const pressureMsl = document.getElementById("pressureMsl");
const elevationText = document.getElementById("elevationText");

const humidityVal = document.getElementById("humidityVal");
const uvVal = document.getElementById("uvVal");
const precipVal = document.getElementById("precipVal");
const feelsLikeVal = document.getElementById("feelsLikeVal");

// Hourly Timeline Elements
const hourlyContainer = document.getElementById("hourlyContainer");
const btnToday = document.getElementById("btnToday");
const btnTomorrow = document.getElementById("btnTomorrow");
const openDetailsPageBtn = document.getElementById("openDetailsPageBtn");

// Saved Cities
const savedCitiesSection = document.getElementById("savedCitiesSection");
const savedCitiesContainer = document.getElementById("savedCitiesContainer");
const savedCountBadge = document.getElementById("savedCountBadge");

/* ================= 1. ATTACH ALL CORE EVENT LISTENERS IMMEDIATELY ================= */
function setupCoreListeners() {
    // 1. Theme Toggle
    if (themeBtn) {
        themeBtn.onclick = toggleTheme;
    }

    // 2. Unit Toggle (°C / °F)
    if (unitBtn) {
        unitBtn.onclick = toggleUnit;
    }

    // 3. Search City
    if (searchBtn) {
        searchBtn.onclick = () => {
            const city = cityInput.value.trim();
            if (city) fetchWeatherByCity(city);
            else showError("Please enter a city name.");
        };
    }

    if (cityInput) {
        cityInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                const city = cityInput.value.trim();
                if (city) fetchWeatherByCity(city);
                else showError("Please enter a city name.");
            }
        };
    }

    // 4. Use My Location
    if (locationBtn) {
        locationBtn.onclick = fetchWeatherByLocation;
    }

    // 5. Popular City Quick Pills
    if (quickCityBtns) {
        quickCityBtns.forEach((btn) => {
            btn.onclick = () => {
                const city = btn.getAttribute("data-city");
                if (cityInput) cityInput.value = city;
                fetchWeatherByCity(city);
            };
        });
    }

    // 6. Today vs Tomorrow Tabs
    if (btnToday) {
        btnToday.onclick = () => {
            selectedHourlyDay = "today";
            btnToday.classList.add("active");
            btnTomorrow.classList.remove("active");
            if (lastWeatherData) renderHourlyStream(lastWeatherData.hourly, currentTimezone, "today");
        };
    }

    if (btnTomorrow) {
        btnTomorrow.onclick = () => {
            selectedHourlyDay = "tomorrow";
            btnTomorrow.classList.add("active");
            btnToday.classList.remove("active");
            if (lastWeatherData) renderHourlyStream(lastWeatherData.hourly, currentTimezone, "tomorrow");
        };
    }

    // 7. Manual Refresh
    if (manualRefreshBtn) {
        manualRefreshBtn.onclick = () => {
            const icon = manualRefreshBtn.querySelector(".refresh-icon");
            if (icon) icon.style.transform = "rotate(360deg)";
            setTimeout(() => { if (icon) icon.style.transform = "none"; }, 600);

            if (currentLat && currentLon) {
                loadWeatherCoordinates(currentLat, currentLon, currentCityLabel, true);
                autoRefreshSeconds = 900;
            }
        };
    }

    // 8. Save City Button
    if (saveCityBtn) {
        saveCityBtn.onclick = () => {
            const baseName = currentCityLabel.split(",")[0].trim();
            const list = getSavedCities();
            const isSaved = list.some(c => c.name.toLowerCase() === baseName.toLowerCase());

            if (isSaved) {
                removeCityFromStorage(baseName);
            } else {
                saveCityToStorage({
                    name: baseName,
                    lat: currentLat,
                    lon: currentLon,
                    temp: temperatureEl ? temperatureEl.textContent : ""
                });
            }
        };
    }

    // 9. Celestial Horizon Dome Simulation Controls
    if (simPlayBtn) {
        simPlayBtn.onclick = toggleCelestialSimulation;
    }

    if (simResetBtn) {
        simResetBtn.onclick = resetCelestialSimulation;
    }

    if (celestialScrubber) {
        celestialScrubber.oninput = (e) => {
            if (simInterval) clearInterval(simInterval);
            isSimulating = false;
            if (simPlayBtn) simPlayBtn.innerHTML = "<span>▶️</span> Play 24h Arc";

            const val = parseFloat(e.target.value) / 100;
            if (lastWeatherData) {
                updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone, val);
                if (celestialRemainingText) {
                    celestialRemainingText.textContent = `Scrubber Position: ${Math.round(val * 100)}%`;
                }
            }
        };
    }
}

/* ================= 2. THEME CONTROLLER ================= */
function initTheme() {
    const saved = safeStorage.getItem("weatherwise_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (saved === "dark" || (!saved && prefersDark)) {
        document.body.classList.add("dark");
        if (themeBtn) themeBtn.innerHTML = '<span class="btn-icon">☀️</span>';
    } else {
        document.body.classList.remove("dark");
        if (themeBtn) themeBtn.innerHTML = '<span class="btn-icon">🌙</span>';
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    if (themeBtn) themeBtn.innerHTML = isDark ? '<span class="btn-icon">☀️</span>' : '<span class="btn-icon">🌙</span>';
    safeStorage.setItem("weatherwise_theme", isDark ? "dark" : "light");
}

/* ================= 3. UNIT CONTROLLER (°C / °F) ================= */
function toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    safeStorage.setItem("weatherwise_unit", currentUnit);
    if (unitBtn) {
        unitBtn.innerHTML = `<span class="btn-text">°${currentUnit}</span>`;
    }

    if (lastWeatherData) {
        renderAllWeather(currentCityLabel, lastWeatherData);
    }
}

function formatTemp(c) {
    if (c === undefined || c === null || isNaN(c)) return "--";
    const num = Number(c);
    return currentUnit === "F" ? Math.round((num * 9) / 5 + 32) : Math.round(num);
}

function formatWind(kmh) {
    if (kmh === undefined || kmh === null || isNaN(kmh)) return "--";
    const num = Number(kmh);
    return currentUnit === "F" ? `${Math.round(num * 0.621371)} mph` : `${Math.round(num)} km/h`;
}

function getUVDescription(uv) {
    const num = Number(uv);
    if (isNaN(num)) return "N/A";
    if (num <= 2) return "Low";
    if (num <= 5) return "Moderate";
    if (num <= 7) return "High";
    if (num <= 10) return "Very High";
    return "Extreme";
}

/* ================= 4. LOCATION LIVE CLOCK ================= */
function startLocationClock(timezone) {
    if (clockInterval) clearInterval(clockInterval);

    function tick() {
        try {
            const now = new Date();
            const timeFormat = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
            const dateFormat = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                weekday: "short",
                month: "short",
                day: "numeric"
            });

            if (localTimeDisplay) localTimeDisplay.textContent = timeFormat.format(now);
            if (localDateDisplay) localDateDisplay.textContent = `${dateFormat.format(now)} • ${timezone.replace(/_/g, " ")}`;
        } catch (e) {
            const now = new Date();
            if (localTimeDisplay) localTimeDisplay.textContent = now.toLocaleTimeString();
        }
    }

    tick();
    clockInterval = setInterval(tick, 1000);
}

/* ================= 5. 3D ROTATING WIND COMPASS & MONITORING ================= */
function updateMonitoringDashboard(data) {
    if (!data || !data.current) return;
    const cur = data.current;

    // 1. Compass Needle Rotation
    const bearing = Math.round(cur.wind_direction_10m ?? 0);
    if (compassNeedle) {
        compassNeedle.style.transform = `rotate(${bearing}deg)`;
    }

    const cardinal = getCompassCardinal(bearing);
    if (windBearingText) windBearingText.textContent = `${bearing}° ${cardinal}`;
    if (windSpeedVal) windSpeedVal.textContent = formatWind(cur.wind_speed_10m);
    if (windGustsVal) windGustsVal.textContent = formatWind(cur.wind_gusts_10m || (cur.wind_speed_10m * 1.3));

    // 2. Barometric Pressure Gauge
    const pressure = cur.surface_pressure ?? 1013;
    if (pressureNumber) pressureNumber.textContent = Math.round(pressure);

    const pPercent = Math.max(0, Math.min(100, ((pressure - 970) / (1040 - 970)) * 100));
    if (pressureFillBar) pressureFillBar.style.width = `${pPercent}%`;

    if (pressureTrendPill && trendIcon && trendText) {
        if (pressure > 1020) {
            pressureTrendPill.className = "trend-pill trend-rising";
            trendIcon.textContent = "↗️";
            trendText.textContent = "High Barometer (Fair)";
        } else if (pressure < 1005) {
            pressureTrendPill.className = "trend-pill trend-falling";
            trendIcon.textContent = "↘️";
            trendText.textContent = "Low Barometer (Rain/Wind)";
        } else {
            pressureTrendPill.className = "trend-pill trend-steady";
            trendIcon.textContent = "➡️";
            trendText.textContent = "Steady Barometer";
        }
    }

    if (pressureMsl) pressureMsl.textContent = `${Math.round(pressure + 2)} hPa`;
    if (elevationText) elevationText.textContent = `${data.elevation ? Math.round(data.elevation) + "m Elev." : "Standard ATM"}`;

    // 3. Atmospheric Moisture & UV
    if (humidityVal) humidityVal.textContent = `${cur.relative_humidity_2m ?? "--"}%`;
    const uv = data.daily?.uv_index_max?.[0] ?? "--";
    if (uvVal) uvVal.textContent = uv !== "--" ? `${uv} (${getUVDescription(uv)})` : "--";
    const rainProb = data.daily?.precipitation_probability_max?.[0] ?? 10;
    if (precipVal) precipVal.textContent = `${rainProb}%`;
    if (feelsLikeVal) feelsLikeVal.textContent = `${formatTemp(cur.apparent_temperature)}°${currentUnit}`;
}

function getCompassCardinal(deg) {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return directions[idx];
}

/* ================= 6. PROMINENT 3D SUN & MOON HORIZON DOME ================= */
function updateCelestialHorizonDome(daily, timezone, customProgress = null) {
    if (!daily || !daily.sunrise || !daily.sunset) return;

    try {
        const now = new Date();
        const srStr = daily.sunrise[0].split("T")[1];
        const ssStr = daily.sunset[0].split("T")[1];

        if (sunriseTimeEl) sunriseTimeEl.textContent = srStr || "--:--";
        if (sunsetTimeEl) sunsetTimeEl.textContent = ssStr || "--:--";

        const [srH, srM] = srStr.split(":").map(Number);
        const [ssH, ssM] = ssStr.split(":").map(Number);
        const srMins = srH * 60 + srM;
        const ssMins = ssH * 60 + ssM;

        let progress = 0;
        let isDay = true;

        if (customProgress !== null) {
            // Simulation progress (0 to 1)
            // 0.0 to 0.5 represents Day (Sunrise -> Noon -> Sunset)
            // 0.5 to 1.0 represents Night (Sunset -> Midnight -> Sunrise)
            if (customProgress <= 0.5) {
                isDay = true;
                progress = customProgress * 2; // scale 0..0.5 to 0..1
            } else {
                isDay = false;
                progress = (customProgress - 0.5) * 2; // scale 0.5..1.0 to 0..1
            }
        } else {
            // Real-time calculation
            const timeParts = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                hour: "numeric",
                minute: "numeric",
                hour12: false
            }).format(now).split(":");

            const curMins = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
            isDay = curMins >= srMins && curMins <= ssMins;

            if (isDay) {
                progress = (curMins - srMins) / (ssMins - srMins);
                progress = Math.max(0, Math.min(1, progress));
            } else {
                const nightTotal = (1440 - ssMins) + srMins;
                const nightElapsed = curMins > ssMins ? (curMins - ssMins) : ((1440 - ssMins) + curMins);
                progress = nightElapsed / nightTotal;
                progress = Math.max(0, Math.min(1, progress));
            }
        }

        // Apply Sun vs Moon styling
        if (isDay) {
            if (celestialModeIcon) celestialModeIcon.textContent = "☀️";
            if (celestialModeName) celestialModeName.textContent = "Day Sun Orbit (Sunrise to Sunset)";
            if (celestialHeading) celestialHeading.textContent = "Day Sun Orbit: Horizon Start to End";
            if (celestialEmoji) celestialEmoji.textContent = "☀️";
            if (celestialBody) celestialBody.className = "celestial-sphere-3d sun-sphere";

            const percentText = Math.round(progress * 100);
            if (solarProgressBadge) solarProgressBadge.textContent = `${percentText}% Solar Zenith`;
            if (celestialRemainingText && customProgress === null) {
                celestialRemainingText.textContent = `Sun is at ${percentText}% across daytime sky`;
            }
        } else {
            if (celestialModeIcon) celestialModeIcon.textContent = "🌙";
            if (celestialModeName) celestialModeName.textContent = "Nocturnal Moon Orbit (Night to Dawn)";
            if (celestialHeading) celestialHeading.textContent = "Moon Orbit: Sunset to Sunrise";
            if (celestialEmoji) celestialEmoji.textContent = "🌙";
            if (celestialBody) celestialBody.className = "celestial-sphere-3d moon-sphere";

            const percentText = Math.round(progress * 100);
            if (solarProgressBadge) solarProgressBadge.textContent = `${percentText}% Lunar Apex`;
            if (celestialRemainingText && customProgress === null) {
                celestialRemainingText.textContent = `Moon is at ${percentText}% across night sky`;
            }
        }

        // Position along parabolic arch (percentage-based coordinates)
        const leftPercent = 6 + progress * 88;
        const topPercent = 82 - 4 * (82 - 14) * progress * (1 - progress);

        if (celestialOrbiter) {
            celestialOrbiter.style.left = `${leftPercent.toFixed(1)}%`;
            celestialOrbiter.style.top = `${topPercent.toFixed(1)}%`;
        }

        if (celestialScrubber && customProgress === null) {
            const overallProgress = isDay ? (progress * 0.5) : (0.5 + progress * 0.5);
            celestialScrubber.value = Math.round(overallProgress * 100);
        }
    } catch (e) {
        console.warn("Celestial calc error:", e);
    }
}

function toggleCelestialSimulation() {
    if (isSimulating) {
        if (simInterval) clearInterval(simInterval);
        isSimulating = false;
        if (simPlayBtn) simPlayBtn.innerHTML = "<span>▶️</span> Play 24h Arc";
        if (lastWeatherData) updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone);
        return;
    }

    isSimulating = true;
    if (simPlayBtn) simPlayBtn.innerHTML = "<span>⏸️</span> Pause Arc";
    simProgress = 0;

    simInterval = setInterval(() => {
        simProgress += 0.01;
        if (simProgress > 1) simProgress = 0;

        if (lastWeatherData) {
            updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone, simProgress);
        }
        if (celestialScrubber) celestialScrubber.value = Math.round(simProgress * 100);
        if (celestialRemainingText) {
            const label = simProgress <= 0.5 ? "Day (Sun Orbit)" : "Night (Moon Orbit)";
            celestialRemainingText.textContent = `24h Simulation: ${label} - ${Math.round(simProgress * 100)}%`;
        }
    }, 60);
}

function resetCelestialSimulation() {
    if (simInterval) clearInterval(simInterval);
    isSimulating = false;
    if (simPlayBtn) simPlayBtn.innerHTML = "<span>▶️</span> Play 24h Arc";
    if (lastWeatherData) updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone);
}

/* ================= 7. HOURLY TIMELINE (TODAY vs TOMORROW) ================= */
function renderHourlyStream(hourly, timezone, dayMode = "today") {
    if (!hourlyContainer || !hourly || !hourly.time) return;
    hourlyContainer.innerHTML = "";

    const now = new Date();
    let targetHour = now.getHours();
    try {
        const hourStr = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone, hour: "numeric", hour12: false
        }).format(now);
        targetHour = parseInt(hourStr, 10);
    } catch (e) {}

    let startIdx = 0;
    if (dayMode === "today") {
        for (let i = 0; i < Math.min(48, hourly.time.length); i++) {
            const h = parseInt(hourly.time[i].split("T")[1].split(":")[0], 10);
            if (h === targetHour) {
                startIdx = i;
                break;
            }
        }
    } else {
        startIdx = 24;
    }

    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
        const isCurrent = (dayMode === "today" && i === startIdx);
        const isoTime = hourly.time[i];
        const hourNumber = parseInt(isoTime.split("T")[1].split(":")[0], 10);

        const timeLabel = isCurrent ? "Now" : `${hourNumber % 12 || 12} ${hourNumber >= 12 ? "PM" : "AM"}`;
        const code = hourly.weather_code ? hourly.weather_code[i] : 0;
        const info = getWeatherInfo(code, (hourNumber >= 6 && hourNumber < 19) ? 1 : 0);
        const temp = hourly.temperature_2m ? formatTemp(hourly.temperature_2m[i]) : "--";
        const wind = hourly.wind_speed_10m ? formatWind(hourly.wind_speed_10m[i]) : "";
        const rain = hourly.precipitation_probability ? (hourly.precipitation_probability[i] || 0) : 0;

        const card = document.createElement("div");
        card.className = `hourly-card-3d ${isCurrent ? "current-hour" : ""}`;
        card.innerHTML = `
            <div class="hour-time">${timeLabel}</div>
            <div class="hour-icon">${info.icon}</div>
            <div class="hour-temp">${temp}°</div>
            ${rain > 0 ? `<div class="hour-rain">💧 ${rain}%</div>` : ""}
            <div class="hour-wind">${wind}</div>
        `;

        hourlyContainer.appendChild(card);
    }
}

function updateOpenDetailsLink() {
    if (!openDetailsPageBtn) return;
    openDetailsPageBtn.href = `details.html?city=${encodeURIComponent(currentCityLabel)}&lat=${currentLat}&lon=${currentLon}&unit=${currentUnit}`;
}

/* ================= 8. SAVED CITIES MANAGER ================= */
function getSavedCities() {
    const data = safeStorage.getItem("weatherwise_saved_cities");
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveCityToStorage(cityObj) {
    const list = getSavedCities();
    const exists = list.some(c => c.name.toLowerCase() === cityObj.name.toLowerCase());
    if (!exists) {
        list.push(cityObj);
        safeStorage.setItem("weatherwise_saved_cities", JSON.stringify(list));
    }
    renderSavedCities();
    updateSaveButtonState();
}

function removeCityFromStorage(cityName) {
    let list = getSavedCities();
    list = list.filter(c => c.name.toLowerCase() !== cityName.toLowerCase());
    safeStorage.setItem("weatherwise_saved_cities", JSON.stringify(list));
    renderSavedCities();
    updateSaveButtonState();
}

function renderSavedCities() {
    if (!savedCitiesContainer || !savedCitiesSection) return;
    const list = getSavedCities();

    if (list.length === 0) {
        savedCitiesSection.style.display = "none";
        return;
    }

    savedCitiesSection.style.display = "block";
    if (savedCountBadge) savedCountBadge.textContent = `${list.length} saved`;
    savedCitiesContainer.innerHTML = "";

    list.forEach((item) => {
        const card = document.createElement("div");
        card.className = "saved-city-card";
        card.innerHTML = `
            <div class="saved-city-info">
                <span class="saved-city-name">${item.name}</span>
                <span class="saved-city-temp">${item.temp ? item.temp + "°" : "Click to view"}</span>
            </div>
            <button class="saved-delete-btn" title="Remove city">✕</button>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("saved-delete-btn")) {
                e.stopPropagation();
                removeCityFromStorage(item.name);
            } else {
                fetchWeatherByCity(item.name);
            }
        });

        savedCitiesContainer.appendChild(card);
    });
}

function updateSaveButtonState() {
    if (!saveCityBtn) return;
    const list = getSavedCities();
    const baseName = currentCityLabel.split(",")[0].trim();
    const isSaved = list.some(c => c.name.toLowerCase() === baseName.toLowerCase());

    if (isSaved) {
        saveCityBtn.classList.add("saved");
        if (saveCityIcon) saveCityIcon.textContent = "★";
        if (saveCityText) saveCityText.textContent = "Saved";
    } else {
        saveCityBtn.classList.remove("saved");
        if (saveCityIcon) saveCityIcon.textContent = "⭐";
        if (saveCityText) saveCityText.textContent = "Save City";
    }
}

/* ================= 9. 15-MINUTE AUTO-REFRESH ================= */
function startAutoRefreshTimer() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshSeconds = 900;

    function updateTimerUI() {
        const mins = Math.floor(autoRefreshSeconds / 60);
        const secs = autoRefreshSeconds % 60;
        const formatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

        if (refreshTimerText) {
            refreshTimerText.textContent = `Refreshing in ${formatted}`;
        }

        if (autoRefreshSeconds <= 0) {
            autoRefreshSeconds = 900;
            if (currentLat && currentLon) {
                loadWeatherCoordinates(currentLat, currentLon, currentCityLabel, true);
            }
        } else {
            autoRefreshSeconds--;
        }
    }

    updateTimerUI();
    autoRefreshTimer = setInterval(updateTimerUI, 1000);
}

/* ================= 10. CARD TILT PHYSICS ================= */
function init3DTiltPhysics() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return;

    function bindTilt() {
        const cards = document.querySelectorAll(".card-tilt");
        cards.forEach((card) => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = "true";

            const glare = card.querySelector(".card-glare");
            const maxTilt = 7;

            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
                const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -2px, 0)`;

                if (glare) {
                    glare.style.opacity = "1";
                    glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.25) 0%, transparent 60%)`;
                }
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)`;
                if (glare) glare.style.opacity = "0";
            });
        });
    }

    bindTilt();
    window.bindTilt = bindTilt;
}

/* ================= 11. SAFE THREE.JS BACKGROUND ================= */
function initSafeThreeJS() {
    try {
        const canvas = document.getElementById("threeCanvas");
        if (!canvas || typeof THREE === "undefined") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.z = 25;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 60;
            positions[i + 1] = (Math.random() - 0.5) * 60;
            positions[i + 2] = (Math.random() - 0.5) * 30;

            colors[i] = 0.2 + Math.random() * 0.3;
            colors[i + 1] = 0.6 + Math.random() * 0.4;
            colors[i + 2] = 1.0;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        function animate() {
            requestAnimationFrame(animate);
            if (particles) particles.rotation.y += 0.0004;
            renderer.render(scene, camera);
        }

        animate();
    } catch (err) {
        console.warn("Optional WebGL Three.js fallback active:", err);
    }
}

/* ================= 12. WEATHER DATA FETCHING ================= */
async function fetchWeatherByCity(city) {
    showLoading(true, `Connecting to satellites for "${city}"...`);
    hideError();

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Network error");
        const geoData = await geoRes.json();

        if (!geoData || !geoData.results || geoData.results.length === 0) {
            showError(`City "${city}" not found. Please verify spelling.`);
            showLoading(false);
            return;
        }

        const loc = geoData.results[0];
        currentLat = loc.latitude;
        currentLon = loc.longitude;
        const label = `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}, ${loc.country || ""}`;
        currentCityLabel = label;

        await loadWeatherCoordinates(currentLat, currentLon, label);
        safeStorage.setItem("weatherwise_last_city", city);
        updateSaveButtonState();
        updateOpenDetailsLink();
    } catch (err) {
        console.error(err);
        showError("Unable to reach atmospheric telemetry. Please check connection.");
        showLoading(false);
    }
}

function fetchWeatherByLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showLoading(true, "Triangulating GPS coordinates...");
    hideError();

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            currentLat = pos.coords.latitude;
            currentLon = pos.coords.longitude;

            let label = "Your Current Location";
            try {
                const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLat}&longitude=${currentLon}&localityLanguage=en`);
                if (revRes.ok) {
                    const rev = await revRes.json();
                    const place = rev.city || rev.locality || rev.principalSubdivision;
                    if (place) label = `${place}, ${rev.countryName || ""}`;
                }
            } catch (e) {}

            currentCityLabel = label;
            await loadWeatherCoordinates(currentLat, currentLon, label);
            updateSaveButtonState();
            updateOpenDetailsLink();
        },
        (err) => {
            showError("Location access unavailable. Please search your city manually.");
            showLoading(false);
        },
        { timeout: 10000 }
    );
}

async function loadWeatherCoordinates(lat, lon, displayTitle, isBackground = false) {
    if (!isBackground) showLoading(true, "Synchronizing atmospheric telemetry...");

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability&daily=sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        lastWeatherData = data;
        currentTimezone = data.timezone || "auto";

        renderAllWeather(displayTitle, data);
        showLoading(false);
    } catch (err) {
        console.error(err);
        showError("Failed to retrieve live atmospheric telemetry.");
        showLoading(false);
    }
}

/* ================= 13. RENDERING ================= */
function renderAllWeather(title, data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const condition = getWeatherInfo(current.weather_code, current.is_day);

    if (cityNameEl) cityNameEl.textContent = title;
    if (timezoneTextEl) timezoneTextEl.textContent = `Timezone: ${currentTimezone.replace(/_/g, " ")}`;

    startLocationClock(currentTimezone);

    if (weatherIconEl) weatherIconEl.textContent = condition.icon;
    if (conditionEl) conditionEl.textContent = condition.description;

    const targetTemp = formatTemp(current.temperature_2m);
    animateTemperature(targetTemp);

    if (tempUnitEl) tempUnitEl.textContent = `°${currentUnit}`;
    if (tempHighLowEl) {
        tempHighLowEl.textContent = `Feels like ${formatTemp(current.apparent_temperature)}°${currentUnit}`;
    }

    // 3D Celestial Horizon Dome (Sunrise to Sunset & Night)
    updateCelestialHorizonDome(daily, currentTimezone);

    // 3D Rotating Wind Compass & Monitoring
    updateMonitoringDashboard(data);

    // 24-Hour Hourly Timeline (Today vs Tomorrow)
    renderHourlyStream(hourly, currentTimezone, selectedHourlyDay);

    updateSaveButtonState();
    updateOpenDetailsLink();

    if (window.bindTilt) window.bindTilt();
}

function animateTemperature(targetVal) {
    if (!temperatureEl) return;
    if (isNaN(targetVal)) {
        temperatureEl.textContent = targetVal;
        return;
    }

    const startVal = currentDisplayedTemp;
    const duration = 500;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(startVal + (targetVal - startVal) * ease);

        temperatureEl.textContent = current;

        if (progress < 1) requestAnimationFrame(update);
        else currentDisplayedTemp = targetVal;
    }

    requestAnimationFrame(update);
}

function getWeatherInfo(code, isDay = 1) {
    const day = isDay === 1;
    switch (code) {
        case 0: return { description: "Clear Sky", icon: day ? "☀️" : "🌙" };
        case 1: return { description: "Mainly Clear", icon: day ? "🌤️" : "✨" };
        case 2: return { description: "Partly Cloudy", icon: day ? "⛅" : "☁️" };
        case 3: return { description: "Overcast", icon: "☁️" };
        case 45: case 48: return { description: "Foggy Mist", icon: "🌫️" };
        case 51: case 53: case 55: return { description: "Light Drizzle", icon: "🌦️" };
        case 61: case 63: return { description: "Rain Showers", icon: "🌧️" };
        case 65: return { description: "Heavy Rain", icon: "🌧️" };
        case 71: case 73: return { description: "Snowfall", icon: "❄️" };
        case 80: case 81: case 82: return { description: "Showers", icon: "🌦️" };
        case 95: case 96: case 99: return { description: "Thunderstorm", icon: "⛈️⚡" };
        default: return { description: "Clear Sky", icon: "☀️" };
    }
}

function showLoading(show, message = "Synchronizing telemetry...") {
    if (!loadingBox) return;
    loadingBox.style.display = show ? "flex" : "none";
    if (loadingMsg) loadingMsg.textContent = message;
}

function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = `⚠️ ${msg}`;
    errorBox.style.display = "block";
}

function hideError() {
    if (!errorBox) return;
    errorBox.style.display = "none";
}

/* ================= 14. INITIALIZATION ================= */
function initApp() {
    setupCoreListeners();
    initTheme();
    if (unitBtn) unitBtn.innerHTML = `<span class="btn-text">°${currentUnit}</span>`;
    startAutoRefreshTimer();
    renderSavedCities();
    init3DTiltPhysics();
    initSafeThreeJS();

    const savedCity = safeStorage.getItem("weatherwise_last_city");
    if (savedCity) {
        if (cityInput) cityInput.value = savedCity;
        fetchWeatherByCity(savedCity);
    } else {
        fetchWeatherByCity("London");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}