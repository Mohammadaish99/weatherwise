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
let currentDisplayedTemp = 18;
let currentWeatherCode = 0;
let isDaytime = 1;

/* ================= DOM ELEMENTS ================= */
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const quickCityBtns = document.querySelectorAll(".city-pill-3d");
const unitBtn = document.getElementById("unitBtn");
const themeBtn = document.getElementById("themeBtn");

const errorBox = document.getElementById("error");
const loadingBox = document.getElementById("loading");
const weatherCard = document.getElementById("weatherCard");

const cityNameEl = document.getElementById("cityName");
const dateEl = document.getElementById("date");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const tempUnitEl = document.getElementById("tempUnit");
const tempHighLowEl = document.getElementById("tempHighLow");
const conditionEl = document.getElementById("condition");

const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const uvIndexEl = document.getElementById("uvIndex");
const rainChanceEl = document.getElementById("rainChance");
const sunScheduleEl = document.getElementById("sunSchedule");
const pressureEl = document.getElementById("pressure");
const timezoneEl = document.getElementById("timezone");

const forecastContainer = document.getElementById("forecastContainer");

/* ================= EVENT LISTENERS ================= */
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherByCity(city);
        } else {
            showError("Please enter a city name to search.");
        }
    });
}

if (cityInput) {
    cityInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeatherByCity(city);
            } else {
                showError("Please enter a city name to search.");
            }
        }
    });
}

if (locationBtn) {
    locationBtn.addEventListener("click", fetchWeatherByLocation);
}

if (quickCityBtns) {
    quickCityBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const city = btn.getAttribute("data-city");
            if (cityInput) cityInput.value = city;
            fetchWeatherByCity(city);
        });
    });
}

if (unitBtn) {
    unitBtn.addEventListener("click", toggleUnit);
}

if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
}

/* ================= 3D TILT PHYSICS ENGINE ================= */
function init3DTilt() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return; // Disable hover tilt on mobile touch devices

    function applyTiltToCards() {
        const cards = document.querySelectorAll(".card-tilt");

        cards.forEach((card) => {
            if (card.dataset.tiltActive) return;
            card.dataset.tiltActive = "true";

            const glare = card.querySelector(".card-glare");
            const maxTilt = card.classList.contains("weather-card-3d") ? 10 : 14;

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
                    glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.35) 0%, transparent 65%)`;
                }
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                if (glare) glare.style.opacity = "0";
            });
        });
    }

    applyTiltToCards();
    window.applyTiltToCards = applyTiltToCards;
}

/* ================= 3D AMBIENT ATMOSPHERIC CANVAS ================= */
function initAtmosphericCanvas() {
    const canvas = document.getElementById("weatherCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 45;

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2.5 + 1;
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = Math.random() * 0.8 + 0.3;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.angle = Math.random() * Math.PI * 2;
        }

        update(weatherType, isDark) {
            this.angle += this.pulseSpeed;

            if (weatherType === "rain") {
                this.speedY = Math.random() * 4 + 5;
                this.speedX = -1;
                this.size = Math.random() * 1.5 + 1;
            } else if (weatherType === "snow") {
                this.speedY = Math.random() * 1.5 + 0.8;
                this.speedX = Math.sin(this.angle) * 1.2;
                this.size = Math.random() * 3 + 1.5;
            } else {
                // Clear / default floating dust motes
                this.speedY = Math.cos(this.angle) * 0.5 - 0.2;
                this.speedX = Math.sin(this.angle) * 0.5;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw(weatherType, isDark) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

            let color = "255, 255, 255";
            if (weatherType === "rain") {
                color = isDark ? "56, 189, 248" : "37, 99, 235";
            } else if (weatherType === "clear" && !isDark) {
                color = "251, 191, 36";
            } else if (isDark) {
                color = "224, 242, 254";
            }

            const currentAlpha = Math.abs(Math.sin(this.angle)) * this.opacity;
            ctx.fillStyle = `rgba(${color}, ${currentAlpha.toFixed(3)})`;
            ctx.shadowBlur = weatherType === "clear" ? 10 : 5;
            ctx.shadowColor = `rgba(${color}, 0.5)`;
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        let weatherType = "clear";
        if (currentWeatherCode >= 51 && currentWeatherCode <= 67) weatherType = "rain";
        else if (currentWeatherCode >= 80 && currentWeatherCode <= 82) weatherType = "rain";
        else if (currentWeatherCode >= 71 && currentWeatherCode <= 77) weatherType = "snow";
        else if (currentWeatherCode >= 95) weatherType = "rain";

        const isDark = document.body.classList.contains("dark");

        for (let i = 0; i < particles.length; i++) {
            particles[i].update(weatherType, isDark);
            particles[i].draw(weatherType, isDark);
        }

        requestAnimationFrame(animate);
    }

    animate();
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
        // Ease out expo
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

/* ================= WEATHER DATA FETCHING ================= */

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
        const label = `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}, ${loc.country || ""}`;
        currentCityLabel = label;

        await loadWeatherCoordinates(loc.latitude, loc.longitude, label);
        safeStorage.setItem("weatherwise_last_city", city);
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
            const { latitude, longitude } = position.coords;

            let label = "Your Current Location";
            try {
                const revRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
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
            await loadWeatherCoordinates(latitude, longitude, label);
        },
        (err) => {
            console.warn("Geolocation error:", err);
            let msg = "Could not retrieve GPS location.";
            if (err.code === 1) {
                msg = "Location permission denied. Please search your city manually in the box above.";
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
async function loadWeatherCoordinates(latitude, longitude, displayTitle) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("Weather API returned non-200");
        const data = await res.json();

        lastWeatherData = data;
        renderAllWeather(displayTitle, data);
        showLoading(false);
    } catch (err) {
        console.error("Forecast fetch error:", err);
        showError("Failed to retrieve live weather data. Please try again.");
        showLoading(false);
    }
}

/* ================= RENDERING ================= */

function renderAllWeather(title, data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || {};
    currentWeatherCode = current.weather_code ?? 0;
    isDaytime = current.is_day ?? 1;

    const condition = getWeatherInfo(currentWeatherCode, isDaytime);

    // City & Date
    if (cityNameEl) cityNameEl.textContent = title;
    if (dateEl) {
        const now = new Date();
        const dateOptions = { weekday: "long", month: "short", day: "numeric" };
        dateEl.textContent = `${now.toLocaleDateString("en-US", dateOptions)} • Live`;
    }

    // Weather Icon & Condition
    if (weatherIconEl) weatherIconEl.textContent = condition.icon;
    if (conditionEl) conditionEl.textContent = condition.description;

    // Animated Temperature & High / Low
    const targetTemp = formatTemp(current.temperature_2m);
    animateTemperature(targetTemp);

    if (tempUnitEl) tempUnitEl.textContent = `°${currentUnit}`;

    if (tempHighLowEl && daily.temperature_2m_max && daily.temperature_2m_min) {
        const todayMax = formatTemp(daily.temperature_2m_max[0]);
        const todayMin = formatTemp(daily.temperature_2m_min[0]);
        tempHighLowEl.textContent = `H: ${todayMax}°${currentUnit} • L: ${todayMin}°${currentUnit}`;
    }

    // Metrics
    if (feelsLikeEl) feelsLikeEl.textContent = `${formatTemp(current.apparent_temperature)}°${currentUnit}`;
    if (humidityEl) humidityEl.textContent = `${current.relative_humidity_2m ?? "--"}%`;
    if (windEl) windEl.textContent = formatWind(current.wind_speed_10m);

    // UV Index
    if (uvIndexEl) {
        const uv = (daily.uv_index_max && daily.uv_index_max[0] !== undefined) ? daily.uv_index_max[0] : "--";
        uvIndexEl.textContent = uv !== "--" ? `${uv} (${getUVDescription(uv)})` : "--";
    }

    // Precipitation Probability
    if (rainChanceEl) {
        const rainProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined)
            ? daily.precipitation_probability_max[0]
            : (current.precipitation ?? 0);
        rainChanceEl.textContent = `${rainProb}% chance`;
    }

    // Sunrise & Sunset
    if (sunScheduleEl) {
        if (daily.sunrise && daily.sunset && daily.sunrise[0] && daily.sunset[0]) {
            const sr = daily.sunrise[0].includes("T") ? daily.sunrise[0].split("T")[1] : daily.sunrise[0];
            const ss = daily.sunset[0].includes("T") ? daily.sunset[0].split("T")[1] : daily.sunset[0];
            sunScheduleEl.textContent = `↑${sr}  ↓${ss}`;
        } else {
            sunScheduleEl.textContent = "N/A";
        }
    }

    // Pressure & Timezone
    if (pressureEl) pressureEl.textContent = current.surface_pressure ? `${Math.round(current.surface_pressure)} hPa` : "1013 hPa";
    if (timezoneEl) timezoneEl.textContent = data.timezone ? data.timezone.replace(/_/g, " ") : "Auto";

    // 7-Day Forecast Cards
    if (daily.time) {
        renderForecast(daily);
    }

    // Re-apply 3D tilt bindings to dynamically generated elements
    if (window.applyTiltToCards) {
        window.applyTiltToCards();
    }
}

function renderForecast(daily) {
    if (!forecastContainer || !daily || !daily.time) return;
    forecastContainer.innerHTML = "";

    const daysCount = Math.min(daily.time.length, 7);

    for (let i = 0; i < daysCount; i++) {
        const dateStr = daily.time[i];
        let dayName = "Day";
        let formattedDate = dateStr;

        try {
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                dayName = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
                formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
        } catch (e) {
            dayName = i === 0 ? "Today" : `Day ${i + 1}`;
        }

        const isToday = i === 0;
        const code = daily.weather_code ? daily.weather_code[i] : 0;
        const info = getWeatherInfo(code, 1);
        const maxTemp = daily.temperature_2m_max ? formatTemp(daily.temperature_2m_max[i]) : "--";
        const minTemp = daily.temperature_2m_min ? formatTemp(daily.temperature_2m_min[i]) : "--";
        const rainChance = (daily.precipitation_probability_max && daily.precipitation_probability_max[i] !== undefined)
            ? daily.precipitation_probability_max[i]
            : 0;

        const card = document.createElement("div");
        card.className = `forecast-card-3d ${isToday ? "today" : ""} card-tilt`;
        card.setAttribute("data-tilt", "");
        card.innerHTML = `
            <div class="card-glare"></div>
            <div class="forecast-day-header">
                <p class="day-name">${dayName}</p>
                <p class="day-date">${formattedDate}</p>
            </div>
            <div class="forecast-icon-3d">${info.icon}</div>
            <div class="forecast-temps">
                <span class="temp-max">${maxTemp}°</span>
                <span class="temp-min">${minTemp}°</span>
            </div>
            <div class="forecast-condition">${info.description}</div>
            ${rainChance > 0 ? `<div class="rain-chance-badge">💧 ${rainChance}%</div>` : ""}
        `;

        forecastContainer.appendChild(card);
    }
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
    if (num <= 5) return "Mod";
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
            return { description: "Heavy Rainfall", icon: "🌧️" };
        case 66:
        case 67:
            return { description: "Freezing Rain", icon: "🌨️" };
        case 71:
        case 73:
            return { description: "Light Snow", icon: "❄️" };
        case 75:
        case 77:
            return { description: "Blizzard Snow", icon: "❄️" };
        case 80:
        case 81:
        case 82:
            return { description: "Torrential Showers", icon: "🌦️" };
        case 85:
        case 86:
            return { description: "Snow Squalls", icon: "🌨️" };
        case 95:
            return { description: "Thunderstorm", icon: "⛈️" };
        case 96:
        case 99:
            return { description: "Severe Lightning Storm", icon: "⛈️⚡" };
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

function showLoading(show, message = "Fetching atmospheric data...") {
    if (!loadingBox) return;
    if (show) {
        loadingBox.style.display = "flex";
        const p = loadingBox.querySelector("p");
        if (p) p.textContent = message;
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
    init3DTilt();
    initAtmosphericCanvas();

    if (unitBtn) {
        const textSpan = unitBtn.querySelector(".btn-text") || unitBtn;
        textSpan.textContent = `°${currentUnit}`;
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