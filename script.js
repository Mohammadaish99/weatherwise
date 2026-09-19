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
let autoRefreshSeconds = 900; // 15 minutes (900 seconds)
let clockInterval = null;

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

// 3D Celestial Tracker Elements
const celestialModeIcon = document.getElementById("celestialModeIcon");
const celestialModeName = document.getElementById("celestialModeName");
const celestialRemainingText = document.getElementById("celestialRemainingText");
const celestialOrbiter = document.getElementById("celestialOrbiter");
const celestialBody = document.getElementById("celestialBody");
const celestialEmoji = document.getElementById("celestialEmoji");
const sunriseTimeEl = document.getElementById("sunriseTime");
const sunsetTimeEl = document.getElementById("sunsetTime");
const solarProgressBadge = document.getElementById("solarProgressBadge");

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

const hourlyContainer = document.getElementById("hourlyContainer");

// Saved Cities
const savedCitiesSection = document.getElementById("savedCitiesSection");
const savedCitiesContainer = document.getElementById("savedCitiesContainer");
const savedCountBadge = document.getElementById("savedCountBadge");

/* ================= 1. TRUE 3D WEBGL ENGINE (THREE.JS) ================= */
let threeScene, threeCamera, threeRenderer, particlesMesh, floatingOrbs = [];

function initThreeJSWorld() {
    const canvas = document.getElementById("threeCanvas");
    if (!canvas || typeof THREE === "undefined") return;

    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeCamera.position.z = 30;

    threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient 3D Particle Cloud
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 80;
        positions[i + 1] = (Math.random() - 0.5) * 80;
        positions[i + 2] = (Math.random() - 0.5) * 60;

        colors[i] = 0.2 + Math.random() * 0.4;
        colors[i + 1] = 0.6 + Math.random() * 0.4;
        colors[i + 2] = 1.0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(geometry, material);
    threeScene.add(particlesMesh);

    // Floating 3D Glowing Atmospheric Orbs
    const orbGeom = new THREE.SphereGeometry(2.5, 32, 32);
    const orbColors = [0x38bdf8, 0x818cf8, 0xf59e0b];

    for (let i = 0; i < 3; i++) {
        const orbMat = new THREE.MeshBasicMaterial({
            color: orbColors[i],
            transparent: true,
            opacity: 0.25,
            wireframe: true
        });
        const orb = new THREE.Mesh(orbGeom, orbMat);
        orb.position.set((i - 1) * 22, (Math.random() - 0.5) * 20, -10 + i * 5);
        threeScene.add(orb);
        floatingOrbs.push(orb);
    }

    // Mouse Movement Parallax
    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Window Resize
    window.addEventListener("resize", () => {
        threeCamera.aspect = window.innerWidth / window.innerHeight;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 3D Animation Loop
    function animateThree() {
        requestAnimationFrame(animateThree);

        // Rotation & drift
        if (particlesMesh) {
            particlesMesh.rotation.y += 0.0008;
            particlesMesh.rotation.x += 0.0004;
        }

        floatingOrbs.forEach((orb, idx) => {
            orb.rotation.x += 0.004 * (idx + 1);
            orb.rotation.y += 0.003 * (idx + 1);
            orb.position.y += Math.sin(Date.now() * 0.001 + idx) * 0.02;
        });

        // Smooth camera drift responding to mouse and scroll
        const scrollY = window.scrollY || window.pageYOffset;
        const targetCamZ = 30 + (scrollY * 0.015);
        const targetCamY = -(scrollY * 0.02) - (mouseY * 2);
        const targetCamX = mouseX * 3;

        threeCamera.position.x += (targetCamX - threeCamera.position.x) * 0.05;
        threeCamera.position.y += (targetCamY - threeCamera.position.y) * 0.05;
        threeCamera.position.z += (targetCamZ - threeCamera.position.z) * 0.05;

        threeRenderer.render(threeScene, threeCamera);
    }

    animateThree();
}

/* ================= 2. 3D SCROLL EFFECTS ENGINE ================= */
function init3DScrollPhysics() {
    const scrollItems = document.querySelectorAll(".scroll-3d-item");

    function onScroll() {
        const viewportHeight = window.innerHeight;

        scrollItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
            const scrollFraction = centerOffset / (viewportHeight / 2);

            // Subtle 3D tilt & depth based on position relative to center of screen
            const rotateX = Math.max(-6, Math.min(6, scrollFraction * 4));
            const translateZ = Math.max(-20, Math.min(10, (1 - Math.abs(scrollFraction)) * 10));

            item.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) translateZ(${translateZ.toFixed(1)}px)`;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

/* ================= 3. 3D CARD TILT & GLARE ================= */
function init3DTiltPhysics() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return;

    function bindTilt() {
        const cards = document.querySelectorAll(".card-tilt");

        cards.forEach((card) => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = "true";

            const glare = card.querySelector(".card-glare");
            const maxTilt = card.classList.contains("weather-card-3d") ? 8 : 12;

            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -maxTilt;
                const rotateY = ((x - centerX) / centerX) * maxTilt;

                card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

                if (glare) {
                    glare.style.opacity = "1";
                    glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.32) 0%, transparent 65%)`;
                }
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                if (glare) glare.style.opacity = "0";
            });
        });
    }

    bindTilt();
    window.bindTilt = bindTilt;
}

/* ================= 4. LOCATION-ACCURATE LIVE CLOCK ================= */
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
            console.warn("Timezone clock fallback:", e);
            const now = new Date();
            if (localTimeDisplay) localTimeDisplay.textContent = now.toLocaleTimeString();
        }
    }

    tick();
    clockInterval = setInterval(tick, 1000);
}

/* ================= 5. 3D SUN & MOON CELESTIAL ORBIT TRACKER ================= */
function updateCelestialTrajectory(daily, timezone) {
    if (!daily || !daily.sunrise || !daily.sunset) return;

    try {
        const now = new Date();
        const sunriseStr = daily.sunrise[0];
        const sunsetStr = daily.sunset[0];

        // Format sunrise & sunset labels
        const srParts = sunriseStr.split("T")[1];
        const ssParts = sunsetStr.split("T")[1];

        if (sunriseTimeEl) sunriseTimeEl.textContent = srParts || "--:--";
        if (sunsetTimeEl) sunsetTimeEl.textContent = ssParts || "--:--";

        // Current minutes into day for timezone
        const timeParts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "numeric",
            hour12: false
        }).format(now).split(":");

        const curMins = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

        const [srH, srM] = srParts.split(":").map(Number);
        const [ssH, ssM] = ssParts.split(":").map(Number);

        const sunriseMins = srH * 60 + srM;
        const sunsetMins = ssH * 60 + ssM;

        let isDay = curMins >= sunriseMins && curMins <= sunsetMins;
        let progress = 0;

        if (isDay) {
            // DAY SUN TRAJECTORY
            progress = (curMins - sunriseMins) / (sunsetMins - sunriseMins);
            progress = Math.max(0, Math.min(1, progress));

            if (celestialModeIcon) celestialModeIcon.textContent = "☀️";
            if (celestialModeName) celestialModeName.textContent = "Day Sun Path";
            if (celestialEmoji) celestialEmoji.textContent = "☀️";

            if (celestialBody) {
                celestialBody.className = "celestial-body sun-body";
            }

            const remMins = sunsetMins - curMins;
            const remH = Math.floor(remMins / 60);
            const remM = remMins % 60;
            if (celestialRemainingText) {
                celestialRemainingText.textContent = `${remH}h ${remM}m daylight remaining`;
            }
            if (solarProgressBadge) {
                solarProgressBadge.textContent = `${Math.round(progress * 100)}% Sun Orbit`;
            }
        } else {
            // NIGHT MOON TRAJECTORY
            const nightTotal = (1440 - sunsetMins) + sunriseMins;
            const nightElapsed = curMins > sunsetMins ? (curMins - sunsetMins) : ((1440 - sunsetMins) + curMins);
            progress = nightElapsed / nightTotal;
            progress = Math.max(0, Math.min(1, progress));

            if (celestialModeIcon) celestialModeIcon.textContent = "🌙";
            if (celestialModeName) celestialModeName.textContent = "Nocturnal Lunar Path";
            if (celestialEmoji) celestialEmoji.textContent = "🌙";

            if (celestialBody) {
                celestialBody.className = "celestial-body moon-body";
            }

            const untilSunMins = (nightTotal - nightElapsed);
            const uH = Math.floor(untilSunMins / 60);
            const uM = untilSunMins % 60;
            if (celestialRemainingText) {
                celestialRemainingText.textContent = `${uH}h ${uM}m until sunrise`;
            }
            if (solarProgressBadge) {
                solarProgressBadge.textContent = `${Math.round(progress * 100)}% Moon Orbit`;
            }
        }

        // Compute 3D parabolic arc position
        // X goes from 6% to 94%
        const leftPercent = 6 + progress * 88;
        // Y follows parabolic curve: highest at progress = 0.5 (top: 15px), lowest at 0 & 1 (top: 110px)
        const topPx = 110 - 4 * (110 - 15) * progress * (1 - progress);

        if (celestialOrbiter) {
            celestialOrbiter.style.left = `${leftPercent.toFixed(1)}%`;
            celestialOrbiter.style.top = `${topPx.toFixed(1)}px`;
        }
    } catch (err) {
        console.warn("Celestial calculation error:", err);
    }
}

/* ================= 6. REAL-TIME MONITORING DASHBOARD ================= */
function updateMonitoringDashboard(data) {
    if (!data || !data.current) return;
    const cur = data.current;

    // 1. 3D Wind Vector Compass
    const bearing = cur.wind_direction_10m ?? 0;
    if (compassNeedle) {
        compassNeedle.style.transform = `rotate(${bearing}deg)`;
    }

    const cardinalDirection = getCompassCardinal(bearing);
    if (windBearingText) windBearingText.textContent = `${bearing}° ${cardinalDirection}`;
    if (windSpeedVal) windSpeedVal.textContent = formatWind(cur.wind_speed_10m);
    if (windGustsVal) windGustsVal.textContent = formatWind(cur.wind_gusts_10m || (cur.wind_speed_10m * 1.3));

    // 2. Barometric Pressure Gauge
    const pressure = cur.surface_pressure ?? 1013;
    if (pressureNumber) pressureNumber.textContent = Math.round(pressure);

    // Calculate gauge fill bar (970 to 1040 range)
    const pMin = 970, pMax = 1040;
    const pPercent = Math.max(0, Math.min(100, ((pressure - pMin) / (pMax - pMin)) * 100));
    if (pressureFillBar) pressureFillBar.style.width = `${pPercent}%`;

    // Pressure Trend analysis
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
            trendText.textContent = "Steady Normal Barometer";
        }
    }

    if (pressureMsl) pressureMsl.textContent = `${Math.round(pressure + 2)} hPa`;
    if (elevationText) elevationText.textContent = `${data.elevation ? Math.round(data.elevation) + "m Elev." : "Sea-Level ATM"}`;

    // 3. Atmospheric Stack
    if (humidityVal) humidityVal.textContent = `${cur.relative_humidity_2m ?? "--"}%`;

    const uv = data.daily?.uv_index_max?.[0] ?? "--";
    if (uvVal) uvVal.textContent = uv !== "--" ? `${uv} (${getUVDescription(uv)})` : "--";

    const rainProb = data.daily?.precipitation_probability_max?.[0] ?? (cur.precipitation ? 100 : 0);
    if (precipVal) precipVal.textContent = `${rainProb}%`;

    if (feelsLikeVal) feelsLikeVal.textContent = `${formatTemp(cur.apparent_temperature)}°${currentUnit}`;
}

function getCompassCardinal(deg) {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return directions[idx];
}

/* ================= 7. 24-HOUR REAL-TIME HOURLY STREAM ================= */
function renderHourlyStream(hourly, timezone) {
    if (!hourlyContainer || !hourly || !hourly.time) return;
    hourlyContainer.innerHTML = "";

    const now = new Date();
    // Get current hour in destination timezone
    let targetHour = now.getHours();
    try {
        const hourStr = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            hour12: false
        }).format(now);
        targetHour = parseInt(hourStr, 10);
    } catch (e) {}

    // Find starting index matching today's current hour
    let startIdx = 0;
    const totalHours = hourly.time.length;

    for (let i = 0; i < Math.min(48, totalHours); i++) {
        const timePart = hourly.time[i].split("T")[1];
        if (timePart) {
            const h = parseInt(timePart.split(":")[0], 10);
            if (h === targetHour) {
                startIdx = i;
                break;
            }
        }
    }

    // Render 24 consecutive hours
    const endIdx = Math.min(startIdx + 24, totalHours);

    for (let i = startIdx; i < endIdx; i++) {
        const isCurrent = (i === startIdx);
        const isoTime = hourly.time[i];
        const hourNumber = parseInt(isoTime.split("T")[1].split(":")[0], 10);

        const timeLabel = isCurrent
            ? "Now"
            : `${hourNumber % 12 || 12} ${hourNumber >= 12 ? "PM" : "AM"}`;

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

/* ================= 8. 15-MINUTE AUTO-REFRESH MONITOR ================= */
function startAutoRefreshTimer() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshSeconds = 900; // 15 mins

    function updateTimerUI() {
        const mins = Math.floor(autoRefreshSeconds / 60);
        const secs = autoRefreshSeconds % 60;
        const formatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

        if (refreshTimerText) {
            refreshTimerText.textContent = `Next update in ${formatted}`;
        }

        if (autoRefreshSeconds <= 0) {
            // Auto refresh triggered!
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

if (manualRefreshBtn) {
    manualRefreshBtn.addEventListener("click", () => {
        const icon = manualRefreshBtn.querySelector(".refresh-icon");
        if (icon) icon.style.transform = "rotate(360deg)";
        setTimeout(() => { if (icon) icon.style.transform = "none"; }, 600);

        if (currentLat && currentLon) {
            loadWeatherCoordinates(currentLat, currentLon, currentCityLabel, true);
            autoRefreshSeconds = 900;
        }
    });
}

/* ================= 9. SAVED CITIES ("ADD CITY") MANAGER ================= */
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
    // Prevent duplicate
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
    const isSaved = list.some(c => c.name.toLowerCase() === currentCityLabel.toLowerCase() || c.name.toLowerCase() === currentCityLabel.split(",")[0].toLowerCase());

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

if (saveCityBtn) {
    saveCityBtn.addEventListener("click", () => {
        const list = getSavedCities();
        const baseName = currentCityLabel.split(",")[0].trim();
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
    });
}

/* ================= 10. WEATHER DATA FETCHING ================= */

// Search by City Name
async function fetchWeatherByCity(city) {
    showLoading(true, `Connecting to satellites for "${city}"...`);
    hideError();

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Network response was not ok");
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
    } catch (err) {
        console.error("Geocoding fetch error:", err);
        showError("Unable to reach atmospheric services. Please check connection.");
        showLoading(false);
    }
}

// Fetch by GPS Location
function fetchWeatherByLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showLoading(true, "Triangulating GPS coordinates...");
    hideError();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;

            let label = "Your Current Location";
            try {
                const revRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLat}&longitude=${currentLon}&localityLanguage=en`
                );
                if (revRes.ok) {
                    const revData = await revRes.json();
                    const place = revData.city || revData.locality || revData.principalSubdivision;
                    if (place) {
                        label = `${place}, ${revData.countryName || ""}`;
                    }
                }
            } catch (e) {
                console.warn("Reverse geocode fallback:", e);
            }

            currentCityLabel = label;
            await loadWeatherCoordinates(currentLat, currentLon, label);
            updateSaveButtonState();
        },
        (err) => {
            console.warn("Geolocation error:", err);
            let msg = "Could not retrieve GPS location.";
            if (err.code === 1) {
                msg = "Location permission denied. Please search your city manually.";
            } else if (err.code === 2) {
                msg = "Location unavailable. Please search manually.";
            } else if (err.code === 3) {
                msg = "Location request timed out. Please search manually.";
            }
            showError(msg);
            showLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
    );
}

// Load Weather Details from Open-Meteo
async function loadWeatherCoordinates(latitude, longitude, displayTitle, isBackground = false) {
    if (!isBackground) {
        showLoading(true, "Synchronizing atmospheric telemetry...");
    }

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability&daily=sunrise,sunset,uv_index_max&timezone=auto`;

        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("Weather API returned non-200");
        const data = await res.json();

        lastWeatherData = data;
        currentTimezone = data.timezone || "auto";

        renderAllWeather(displayTitle, data);
        showLoading(false);
    } catch (err) {
        console.error("Forecast fetch error:", err);
        showError("Failed to retrieve live atmospheric telemetry. Please try again.");
        showLoading(false);
    }
}

/* ================= 11. RENDERING ================= */

function renderAllWeather(title, data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const condition = getWeatherInfo(current.weather_code, current.is_day);

    // City & Timezone
    if (cityNameEl) cityNameEl.textContent = title;
    if (timezoneTextEl) timezoneTextEl.textContent = `Timezone: ${currentTimezone.replace(/_/g, " ")}`;

    // Start Location Clock Ticking
    startLocationClock(currentTimezone);

    // Weather Icon & Condition
    if (weatherIconEl) weatherIconEl.textContent = condition.icon;
    if (conditionEl) conditionEl.textContent = condition.description;

    // Animated Temperature
    const targetTemp = formatTemp(current.temperature_2m);
    animateTemperature(targetTemp);

    if (tempUnitEl) tempUnitEl.textContent = `°${currentUnit}`;
    if (tempHighLowEl) {
        tempHighLowEl.textContent = `Feels like ${formatTemp(current.apparent_temperature)}°${currentUnit}`;
    }

    // Update 3D Sun & Moon Celestial Arc Trajectory
    updateCelestialTrajectory(daily, currentTimezone);

    // Update Real-Time Monitoring Dashboard
    updateMonitoringDashboard(data);

    // Render 24-Hour Hourly Timeline
    renderHourlyStream(hourly, currentTimezone);

    // Update Save button state
    updateSaveButtonState();

    // Re-bind 3D tilt
    if (window.bindTilt) window.bindTilt();
}

/* ================= ANIMATED TEMPERATURE COUNTER ================= */
function animateTemperature(targetVal) {
    if (!temperatureEl) return;
    if (isNaN(targetVal)) {
        temperatureEl.textContent = targetVal;
        return;
    }

    const startVal = currentDisplayedTemp;
    const duration = 650;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(startVal + (targetVal - startVal) * ease);

        temperatureEl.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            currentDisplayedTemp = targetVal;
        }
    }

    requestAnimationFrame(update);
}

/* ================= UNIT TOGGLING ================= */

function toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    safeStorage.setItem("weatherwise_unit", currentUnit);
    if (unitBtn) {
        const textSpan = unitBtn.querySelector(".btn-text") || unitBtn;
        textSpan.textContent = `°${currentUnit}`;
    }

    if (lastWeatherData) {
        renderAllWeather(currentCityLabel, lastWeatherData);
    }
}

function formatTemp(celsius) {
    if (celsius === undefined || celsius === null || isNaN(celsius)) return "--";
    const num = Number(celsius);
    if (currentUnit === "F") {
        return Math.round((num * 9) / 5 + 32);
    }
    return Math.round(num);
}

function formatWind(kmh) {
    if (kmh === undefined || kmh === null || isNaN(kmh)) return "--";
    const num = Number(kmh);
    if (currentUnit === "F") {
        return `${Math.round(num * 0.621371)} mph`;
    }
    return `${Math.round(num)} km/h`;
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

/* ================= WMO WEATHER CONDITION MAPPING ================= */

function getWeatherInfo(code, isDay = 1) {
    const day = isDay === 1;

    switch (code) {
        case 0:
            return { description: "Clear Sky", icon: day ? "☀️" : "🌙" };
        case 1:
            return { description: "Mainly Clear", icon: day ? "🌤️" : "✨" };
        case 2:
            return { description: "Partly Cloudy", icon: day ? "⛅" : "☁️" };
        case 3:
            return { description: "Overcast", icon: "☁️" };
        case 45:
        case 48:
            return { description: "Foggy Mist", icon: "🌫️" };
        case 51:
        case 53:
        case 55:
            return { description: "Light Drizzle", icon: "🌦️" };
        case 56:
        case 57:
            return { description: "Freezing Drizzle", icon: "🌨️" };
        case 61:
        case 63:
            return { description: "Rain Showers", icon: "🌧️" };
        case 65:
            return { description: "Heavy Rain", icon: "🌧️" };
        case 66:
        case 67:
            return { description: "Freezing Rain", icon: "🌨️" };
        case 71:
        case 73:
            return { description: "Snowfall", icon: "❄️" };
        case 75:
        case 77:
            return { description: "Heavy Snow", icon: "❄️" };
        case 80:
        case 81:
        case 82:
            return { description: "Rain Showers", icon: "🌦️" };
        case 85:
        case 86:
            return { description: "Snow Showers", icon: "🌨️" };
        case 95:
            return { description: "Thunderstorm", icon: "⛈️" };
        case 96:
        case 99:
            return { description: "Severe Lightning", icon: "⛈️⚡" };
        default:
            return { description: "Clear Sky", icon: "☀️" };
    }
}

/* ================= DARK / LIGHT THEME ================= */

function initTheme() {
    const savedTheme = safeStorage.getItem("weatherwise_theme");
    let prefersDark = false;
    try {
        prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {}

    const iconSpan = themeBtn ? (themeBtn.querySelector(".btn-icon") || themeBtn) : null;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
        if (iconSpan) iconSpan.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        if (iconSpan) iconSpan.textContent = "🌙";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    const iconSpan = themeBtn ? (themeBtn.querySelector(".btn-icon") || themeBtn) : null;
    if (iconSpan) iconSpan.textContent = isDark ? "☀️" : "🌙";
    safeStorage.setItem("weatherwise_theme", isDark ? "dark" : "light");
}

/* ================= UI HELPERS ================= */

function showLoading(show, message = "Synchronizing atmospheric telemetry...") {
    if (!loadingBox) return;
    if (show) {
        loadingBox.style.display = "flex";
        if (loadingMsg) loadingMsg.textContent = message;
        if (weatherCard) weatherCard.style.opacity = "0.65";
    } else {
        loadingBox.style.display = "none";
        if (weatherCard) weatherCard.style.opacity = "1";
    }
}

function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = `⚠️ ${msg}`;
    errorBox.style.display = "block";
}

function hideError() {
    if (!errorBox) return;
    errorBox.style.display = "none";
    errorBox.textContent = "";
}

/* ================= INITIALIZATION ================= */

function initApp() {
    initTheme();
    initThreeJSWorld();
    init3DTiltPhysics();
    init3DScrollPhysics();
    startAutoRefreshTimer();
    renderSavedCities();

    if (unitBtn) {
        const textSpan = unitBtn.querySelector(".btn-text") || unitBtn;
        textSpan.textContent = `°${currentUnit}`;
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            const city = cityInput.value.trim();
            if (city) fetchWeatherByCity(city);
            else showError("Please enter a city name to search.");
        });
    }

    if (cityInput) {
        cityInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const city = cityInput.value.trim();
                if (city) fetchWeatherByCity(city);
                else showError("Please enter a city name to search.");
            }
        });
    }

    if (locationBtn) locationBtn.addEventListener("click", fetchWeatherByLocation);
    if (unitBtn) unitBtn.addEventListener("click", toggleUnit);
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    if (quickCityBtns) {
        quickCityBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const city = btn.getAttribute("data-city");
                if (cityInput) cityInput.value = city;
                fetchWeatherByCity(city);
            });
        });
    }

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