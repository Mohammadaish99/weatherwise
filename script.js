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

/* ================= DOM ELEMENTS ================= */
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const quickCityBtns = document.querySelectorAll(".city-pill");
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

/* ================= WEATHER DATA FETCHING ================= */

// Search by City Name
async function fetchWeatherByCity(city) {
    showLoading(true, `Searching weather for "${city}"...`);
    hideError();

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Network response was not ok");
        const geoData = await geoRes.json();

        if (!geoData || !geoData.results || geoData.results.length === 0) {
            showError(`City "${city}" not found. Please check spelling.`);
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
        showError("Unable to reach weather services. Please check your internet connection.");
        showLoading(false);
    }
}

// Fetch by GPS Location
function fetchWeatherByLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showLoading(true, "Detecting your current GPS location...");
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
            let msg = "Could not retrieve your GPS location.";
            if (err.code === 1) {
                msg = "Location permission denied. You can search your city manually in the box above.";
            } else if (err.code === 2) {
                msg = "Location unavailable. Please search manually.";
            } else if (err.code === 3) {
                msg = "Location request timed out. Please try again or search manually.";
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
        showError("Failed to retrieve live weather data. Please try again in a moment.");
        showLoading(false);
    }
}

/* ================= RENDERING ================= */

function renderAllWeather(title, data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || {};
    const condition = getWeatherInfo(current.weather_code, current.is_day);

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

    // Temperature & High / Low
    if (temperatureEl) temperatureEl.textContent = formatTemp(current.temperature_2m);
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
        card.className = `forecast-card ${isToday ? "today" : ""}`;
        card.innerHTML = `
            <div>
                <p class="day-name">${dayName}</p>
                <p class="day-date">${formattedDate}</p>
            </div>
            <div class="forecast-icon">${info.icon}</div>
            <div class="forecast-temps">
                <span class="temp-max">${maxTemp}°</span>
                <span class="temp-min">${minTemp}°</span>
            </div>
            <div class="forecast-condition">${info.description}</div>
            ${rainChance > 0 ? `<div class="rain-chance">💧 ${rainChance}%</div>` : ""}
        `;

        forecastContainer.appendChild(card);
    }
}

/* ================= UNIT TOGGLING ================= */

function toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    safeStorage.setItem("weatherwise_unit", currentUnit);
    if (unitBtn) unitBtn.textContent = `°${currentUnit}`;

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
            return { description: "Foggy", icon: "🌫️" };
        case 51:
        case 53:
        case 55:
            return { description: "Light Drizzle", icon: "🌦️" };
        case 56:
        case 57:
            return { description: "Freezing Drizzle", icon: "🌨️" };
        case 61:
        case 63:
            return { description: "Rain", icon: "🌧️" };
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
            return { description: "Severe Storm", icon: "⛈️⚡" };
        default:
            return { description: "Clear", icon: "☀️" };
    }
}

/* ================= DARK / LIGHT THEME ================= */

function initTheme() {
    const savedTheme = safeStorage.getItem("weatherwise_theme");
    let prefersDark = false;
    try {
        prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {}

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
        if (themeBtn) themeBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        if (themeBtn) themeBtn.textContent = "🌙";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    if (themeBtn) themeBtn.textContent = isDark ? "☀️" : "🌙";
    safeStorage.setItem("weatherwise_theme", isDark ? "dark" : "light");
}

/* ================= UI HELPERS ================= */

function showLoading(show, message = "Fetching real-time weather...") {
    if (!loadingBox) return;
    if (show) {
        loadingBox.style.display = "flex";
        const p = loadingBox.querySelector("p");
        if (p) p.textContent = message;
        if (weatherCard) weatherCard.style.opacity = "0.6";
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
    if (unitBtn) unitBtn.textContent = `°${currentUnit}`;

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