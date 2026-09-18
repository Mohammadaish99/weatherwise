/* ================= STATE & CONFIG ================= */
let currentUnit = localStorage.getItem("weatherwise_unit") || "C";
let lastWeatherData = null;
let currentCityLabel = "";

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
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    } else {
        showError("Please enter a city name to search.");
    }
});

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

locationBtn.addEventListener("click", fetchWeatherByLocation);

quickCityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const city = btn.getAttribute("data-city");
        cityInput.value = city;
        fetchWeatherByCity(city);
    });
});

unitBtn.addEventListener("click", toggleUnit);
themeBtn.addEventListener("click", toggleTheme);

/* ================= WEATHER DATA FETCHING ================= */

// Search by City Name
async function fetchWeatherByCity(city) {
    showLoading(true, `Searching weather for "${city}"...`);
    hideError();

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError(`City "${city}" not found. Please verify the spelling.`);
            showLoading(false);
            return;
        }

        const loc = geoData.results[0];
        const label = `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}, ${loc.country || ""}`;
        currentCityLabel = label;

        await loadWeatherCoordinates(loc.latitude, loc.longitude, label);
        localStorage.setItem("weatherwise_last_city", city);
    } catch (err) {
        console.error(err);
        showError("Unable to connect to weather service. Please check your network.");
        showLoading(false);
    }
}

// Fetch by GPS Location
function fetchWeatherByLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showLoading(true, "Detecting your current location...");
    hideError();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get readable city
            let label = "Your Current Location";
            try {
                const revRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const revData = await revRes.json();
                const place = revData.city || revData.locality || revData.principalSubdivision;
                if (place) {
                    label = `${place}, ${revData.countryName || ""}`;
                }
            } catch (e) {
                console.warn("Reverse geocode failed:", e);
            }

            currentCityLabel = label;
            await loadWeatherCoordinates(latitude, longitude, label);
        },
        (err) => {
            console.warn("Geolocation error:", err);
            let msg = "Could not retrieve your location.";
            if (err.code === 1) {
                msg = "Location permission was denied. Please search your city manually.";
            } else if (err.code === 2) {
                msg = "Location position is unavailable.";
            }
            showError(msg);
            showLoading(false);
        },
        { timeout: 10000 }
    );
}

// Load Weather Details from Open-Meteo
async function loadWeatherCoordinates(latitude, longitude, displayTitle) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

        const res = await fetch(weatherUrl);
        const data = await res.json();

        lastWeatherData = data;
        renderAllWeather(displayTitle, data);
        showLoading(false);
    } catch (err) {
        console.error("Forecast fetch error:", err);
        showError("Failed to retrieve weather details. Please try again.");
        showLoading(false);
    }
}

/* ================= RENDERING ================= */

function renderAllWeather(title, data) {
    if (!data || !data.current || !data.daily) return;

    const current = data.current;
    const daily = data.daily;
    const condition = getWeatherInfo(current.weather_code, current.is_day);

    // City & Date
    cityNameEl.textContent = title;
    const now = new Date();
    const dateOptions = { weekday: "long", month: "short", day: "numeric" };
    dateEl.textContent = `${now.toLocaleDateString("en-US", dateOptions)} • Live`;

    // Weather Icon & Condition
    weatherIconEl.textContent = condition.icon;
    conditionEl.textContent = condition.description;

    // Temperature & High / Low
    temperatureEl.textContent = formatTemp(current.temperature_2m);
    tempUnitEl.textContent = `°${currentUnit}`;

    const todayMax = formatTemp(daily.temperature_2m_max[0]);
    const todayMin = formatTemp(daily.temperature_2m_min[0]);
    tempHighLowEl.textContent = `H: ${todayMax}°${currentUnit} • L: ${todayMin}°${currentUnit}`;

    // Metrics
    feelsLikeEl.textContent = `${formatTemp(current.apparent_temperature)}°${currentUnit}`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = formatWind(current.wind_speed_10m);

    // UV Index
    const uv = daily.uv_index_max[0] ?? "--";
    uvIndexEl.textContent = `${uv} (${getUVDescription(uv)})`;

    // Precipitation Probability
    const rainProb = daily.precipitation_probability_max[0] ?? current.precipitation ?? 0;
    rainChanceEl.textContent = `${rainProb}% chance`;

    // Sunrise & Sunset
    if (daily.sunrise && daily.sunset && daily.sunrise[0] && daily.sunset[0]) {
        const sr = daily.sunrise[0].split("T")[1] || "--:--";
        const ss = daily.sunset[0].split("T")[1] || "--:--";
        sunScheduleEl.textContent = `↑${sr}  ↓${ss}`;
    } else {
        sunScheduleEl.textContent = "N/A";
    }

    // Pressure & Timezone
    pressureEl.textContent = current.surface_pressure ? `${Math.round(current.surface_pressure)} hPa` : "1013 hPa";
    timezoneEl.textContent = data.timezone ? data.timezone.replace("_", " ") : "Auto";

    // 7-Day Forecast Cards
    renderForecast(daily);
}

function renderForecast(daily) {
    forecastContainer.innerHTML = "";

    const daysCount = Math.min(daily.time.length, 7);

    for (let i = 0; i < daysCount; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr + "T00:00:00");
        const isToday = i === 0;

        const dayName = isToday
            ? "Today"
            : dateObj.toLocaleDateString("en-US", { weekday: "short" });

        const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

        const code = daily.weather_code[i];
        const info = getWeatherInfo(code, 1);
        const maxTemp = formatTemp(daily.temperature_2m_max[i]);
        const minTemp = formatTemp(daily.temperature_2m_min[i]);
        const rainChance = daily.precipitation_probability_max[i] || 0;

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
    localStorage.setItem("weatherwise_unit", currentUnit);
    unitBtn.textContent = `°${currentUnit}`;

    if (lastWeatherData) {
        renderAllWeather(currentCityLabel, lastWeatherData);
    }
}

function formatTemp(celsius) {
    if (celsius === undefined || celsius === null) return "--";
    if (currentUnit === "F") {
        return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
}

function formatWind(kmh) {
    if (kmh === undefined || kmh === null) return "--";
    if (currentUnit === "F") {
        return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
}

function getUVDescription(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Mod";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
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
            return { description: "Severe Thunderstorm", icon: "⛈️⚡" };
        default:
            return { description: "Clear", icon: "☀️" };
    }
}

/* ================= DARK / LIGHT THEME ================= */

function initTheme() {
    const savedTheme = localStorage.getItem("weatherwise_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        themeBtn.textContent = "🌙";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("weatherwise_theme", isDark ? "dark" : "light");
}

/* ================= UI HELPERS ================= */

function showLoading(show, message = "Fetching real-time weather...") {
    if (show) {
        loadingBox.style.display = "flex";
        loadingBox.querySelector("p").textContent = message;
        weatherCard.style.opacity = "0.5";
    } else {
        loadingBox.style.display = "none";
        weatherCard.style.opacity = "1";
    }
}

function showError(msg) {
    errorBox.textContent = `⚠️ ${msg}`;
    errorBox.style.display = "block";
}

function hideError() {
    errorBox.style.display = "none";
    errorBox.textContent = "";
}

/* ================= INITIALIZATION ================= */

function initApp() {
    initTheme();
    unitBtn.textContent = `°${currentUnit}`;

    const savedCity = localStorage.getItem("weatherwise_last_city");
    if (savedCity) {
        cityInput.value = savedCity;
        fetchWeatherByCity(savedCity);
    } else {
        // Auto fetch default city or GPS
        fetchWeatherByCity("London");
    }
}

initApp();