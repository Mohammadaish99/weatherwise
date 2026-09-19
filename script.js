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
    },
    removeItem(key) {
        try {
            if (window.localStorage) {
                window.localStorage.removeItem(key);
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
let selectedSpecialTag = "Home";

// 3D Celestial Simulation State
let isSimulating = false;
let simInterval = null;
let simProgress = 0; // 0 to 1

// Three.js 3D WebGL Planetarium Scene
let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let threeCelestialGlobe = null;
let threeOrbitRing = null;
let threeOrbitRing2 = null;
let threeStarParticles = null;
let threeStarMaterial = null;
let targetCameraX = 0;
let targetCameraY = 0;

/* ================= EXPOSE ALL HANDLERS ON WINDOW IMMEDIATELY ================= */
window.toggleTheme = toggleTheme;
window.toggleUnit = toggleUnit;
window.switchHourlyDay = switchHourlyDay;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.initCard3DTilt = initCard3DTilt;
window.switchAuthTab = switchAuthTab;
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleLogout = handleLogout;
window.quickDemoLogin = quickDemoLogin;
window.handleSaveCityClick = handleSaveCityClick;
window.openSaveSpecialModal = openSaveSpecialModal;
window.closeSaveSpecialModal = closeSaveSpecialModal;
window.selectSpecialTag = selectSpecialTag;
window.confirmSaveSpecialCity = confirmSaveSpecialCity;
window.toggleCelestialSimulation = toggleCelestialSimulation;
window.resetCelestialSimulation = resetCelestialSimulation;
window.handleScrubberInput = handleScrubberInput;
window.dismissWelcomeBanner = dismissWelcomeBanner;
window.forceRefreshWeather = forceRefreshWeather;
window.fetchWeatherByLocation = fetchWeatherByLocation;
window.fetchWeatherByCity = fetchWeatherByCity;
window.searchCurrentInput = searchCurrentInput;
window.navigateToDetails = navigateToDetails;

/* ================= 1. THEME CONTROLLER ================= */
function initTheme() {
    const saved = safeStorage.getItem("weatherwise_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const themeBtn = document.getElementById("themeBtn");
    if (saved === "dark" || (!saved && prefersDark)) {
        document.body.classList.add("dark");
        if (themeBtn) themeBtn.innerHTML = '<span class="btn-icon">☀️</span>';
    } else {
        document.body.classList.remove("dark");
        if (themeBtn) themeBtn.innerHTML = '<span class="btn-icon">🌙</span>';
    }
    updateThreeJSPalette();
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) themeBtn.innerHTML = isDark ? '<span class="btn-icon">☀️</span>' : '<span class="btn-icon">🌙</span>';
    safeStorage.setItem("weatherwise_theme", isDark ? "dark" : "light");
    updateThreeJSPalette();

    if (lastWeatherData) {
        updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone);
    }
}

/* ================= 2. UNIT CONTROLLER (°C / °F) ================= */
function toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    safeStorage.setItem("weatherwise_unit", currentUnit);
    const unitBtn = document.getElementById("unitBtn");
    if (unitBtn) {
        unitBtn.innerHTML = `<span class="btn-text">°${currentUnit}</span>`;
    }

    if (lastWeatherData) {
        renderAllWeather(currentCityLabel, lastWeatherData);
    }
    updateOpenDetailsLink();
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

/* ================= 3. UPLIFTING WELCOME & HAPPY MIND SYSTEM ================= */
const UPLIFTING_AFFIRMATIONS = [
    "Wherever you go, no matter what the weather, always bring your own sunshine. ☀️",
    "Your potential is limitless — radiate peace, joy, and confidence today. ✨",
    "Clear skies or rainy days, every morning brings a fresh new perspective. 🌈",
    "Breathe deeply, smile warmly, and let calm positive energy guide you. 🌿",
    "You are capable of wonderful things — embrace today with an open heart. 💫",
    "A peaceful mind creates a beautiful life. Enjoy every moment today. 🌸",
    "Let your inner light shine brighter than the sun today. ☀️✨"
];

function initWelcomeExperience() {
    const banner = document.getElementById("welcomeBanner");
    const greetingEl = document.getElementById("welcomeGreeting");
    const userTag = document.getElementById("welcomeUserTag");
    const quoteEl = document.getElementById("welcomeVibeQuote");
    const emojiEl = document.getElementById("welcomeEmoji");

    if (!banner) return;

    const user = getCurrentUser();
    const now = new Date();
    const hour = now.getHours();

    let greeting = "Good Morning!";
    let emoji = "☀️";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning!";
        emoji = "☀️";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon!";
        emoji = "🌤️";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening!";
        emoji = "🌇";
    } else {
        greeting = "Good Night!";
        emoji = "🌙";
    }

    if (greetingEl) greetingEl.textContent = user ? `Welcome back, ${user.name}!` : greeting;
    if (userTag) {
        if (user) {
            userTag.style.display = "inline-block";
            userTag.textContent = "⭐ Special Member";
        } else {
            userTag.style.display = "none";
        }
    }
    if (emojiEl) emojiEl.textContent = emoji;

    const randomAffirmation = UPLIFTING_AFFIRMATIONS[Math.floor(Math.random() * UPLIFTING_AFFIRMATIONS.length)];
    if (quoteEl) quoteEl.textContent = `"${randomAffirmation}"`;

    banner.style.display = "flex";
    triggerCelebratorySparkles();
}

function dismissWelcomeBanner() {
    const banner = document.getElementById("welcomeBanner");
    if (banner) {
        banner.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        banner.style.opacity = "0";
        banner.style.transform = "translateY(-10px)";
        setTimeout(() => { banner.style.display = "none"; }, 300);
    }
}

function triggerCelebratorySparkles() {
    const container = document.getElementById("sparkleContainer");
    if (!container) return;

    container.innerHTML = "";
    const sparkles = ["✨", "⭐", "💫", "🌟", "☀️"];
    const count = 16;

    for (let i = 0; i < count; i++) {
        const span = document.createElement("span");
        span.className = "floating-sparkle";
        span.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];

        const startX = Math.random() * 80 + 10;
        const startY = Math.random() * 25 + 5;
        const dx = (Math.random() - 0.5) * 90;
        const dy = -(Math.random() * 70 + 20);

        span.style.left = `${startX}vw`;
        span.style.top = `${startY}vh`;
        span.style.setProperty("--dx", `${dx}px`);
        span.style.setProperty("--dy", `${dy}px`);
        span.style.animationDelay = `${Math.random() * 0.6}s`;

        container.appendChild(span);
        setTimeout(() => span.remove(), 2400);
    }
}

/* ================= 4. GENUINE & FRICTIONLESS LOGIN SYSTEM ================= */
function getUsers() {
    const data = safeStorage.getItem("weatherwise_users");
    if (!data) return [];
    try { return JSON.parse(data); } catch (e) { return []; }
}

function saveUsers(users) {
    safeStorage.setItem("weatherwise_users", JSON.stringify(users));
}

function getCurrentUser() {
    const data = safeStorage.getItem("weatherwise_current_user");
    if (!data) return null;
    try { return JSON.parse(data); } catch (e) { return null; }
}

function setCurrentUser(user) {
    if (user) safeStorage.setItem("weatherwise_current_user", JSON.stringify(user));
    else safeStorage.removeItem("weatherwise_current_user");
    updateAccountBtnUI();
}

function updateAccountBtnUI() {
    const user = getCurrentUser();
    const accountBtn = document.getElementById("accountBtn");
    const accountBtnIcon = document.getElementById("accountBtnIcon");
    const accountBtnText = document.getElementById("accountBtnText");

    if (!accountBtn) return;

    if (user) {
        accountBtn.classList.add("logged-in");
        if (accountBtnIcon) accountBtnIcon.textContent = "⭐";
        if (accountBtnText) accountBtnText.textContent = user.name.split(" ")[0];
    } else {
        accountBtn.classList.remove("logged-in");
        if (accountBtnIcon) accountBtnIcon.textContent = "👤";
        if (accountBtnText) accountBtnText.textContent = "Sign In";
    }
}

function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    const user = getCurrentUser();
    const quickLoginBox = document.getElementById("quickLoginBox");
    const authTabs = document.getElementById("authTabs");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const profileView = document.getElementById("profileView");
    const modalTitle = document.getElementById("modalTitle");
    const authAlert = document.getElementById("authAlert");

    if (authAlert) authAlert.style.display = "none";

    if (user) {
        // Show Profile View
        if (modalTitle) modalTitle.textContent = `Welcome, ${user.name}!`;
        if (quickLoginBox) quickLoginBox.style.display = "none";
        if (authTabs) authTabs.style.display = "none";
        if (signInForm) signInForm.style.display = "none";
        if (signUpForm) signUpForm.style.display = "none";
        if (profileView) profileView.style.display = "flex";

        const profileName = document.getElementById("profileUserName");
        const profileEmail = document.getElementById("profileUserEmail");
        const profileAvatar = document.getElementById("profileAvatar");

        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email || "Special WeatherWise Member";
        if (profileAvatar) profileAvatar.textContent = user.name.charAt(0).toUpperCase();

        renderSpecialCitiesInProfile();
    } else {
        // Show Sign In / 1-Click Login
        if (modalTitle) modalTitle.textContent = "WeatherWise Account";
        if (quickLoginBox) quickLoginBox.style.display = "block";
        if (authTabs) authTabs.style.display = "flex";
        if (profileView) profileView.style.display = "none";
        switchAuthTab("signin");
    }

    modal.style.display = "flex";
    modal.style.opacity = "1";
    modal.style.visibility = "visible";
    modal.style.pointerEvents = "auto";
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = "none";
        modal.style.opacity = "0";
    }
}

function switchAuthTab(tab) {
    const tabSignIn = document.getElementById("tabSignIn");
    const tabSignUp = document.getElementById("tabSignUp");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const authAlert = document.getElementById("authAlert");

    if (authAlert) authAlert.style.display = "none";

    if (tab === "signin") {
        if (tabSignIn) tabSignIn.classList.add("active");
        if (tabSignUp) tabSignUp.classList.remove("active");
        if (signInForm) signInForm.style.display = "flex";
        if (signUpForm) signUpForm.style.display = "none";
    } else {
        if (tabSignUp) tabSignUp.classList.add("active");
        if (tabSignIn) tabSignIn.classList.remove("active");
        if (signUpForm) signUpForm.style.display = "flex";
        if (signInForm) signInForm.style.display = "none";
    }
}

// 1-Click Instant Demo Login
function quickDemoLogin(userName = "Mohammad") {
    const users = getUsers();
    let found = users.find(u => u.name.toLowerCase() === userName.toLowerCase());

    if (!found) {
        found = {
            name: userName,
            email: `${userName.toLowerCase()}@weatherwise.app`,
            pass: "demo123",
            specialCities: getSavedCities()
        };
        users.push(found);
        saveUsers(users);
    }

    setCurrentUser(found);
    showLoginSuccess(found.name);
}

// Smart Unified Login: If user exists, log in; if new, auto-registers seamlessly!
function handleSignIn(e) {
    if (e) e.preventDefault();
    const inputEl = document.getElementById("signInEmail");
    const passEl = document.getElementById("signInPassword");
    const input = inputEl ? inputEl.value.trim() : "";
    const pass = passEl ? passEl.value.trim() : "";

    // If blank, instantly log in as Mohammad
    if (!input) {
        quickDemoLogin("Mohammad");
        return;
    }

    const users = getUsers();
    let found = users.find(u => u.name.toLowerCase() === input.toLowerCase() || u.email.toLowerCase() === input.toLowerCase());

    if (found) {
        setCurrentUser(found);
        showLoginSuccess(found.name);
    } else {
        // Smart Auto-Registration: user doesn't exist yet, create and log in immediately!
        const cleanName = input.includes("@") ? input.split("@")[0] : input;
        const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        const newUser = {
            name: formattedName,
            email: input.includes("@") ? input : `${input.toLowerCase()}@weatherwise.app`,
            pass: pass || "123456",
            specialCities: getSavedCities()
        };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);
        showLoginSuccess(newUser.name);
    }
}

function handleSignUp(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("signUpName").value.trim();
    const email = document.getElementById("signUpEmail").value.trim();
    const pass = document.getElementById("signUpPassword").value.trim();
    if (!name) return;

    const users = getUsers();
    const existing = users.find(u => u.name.toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
        setCurrentUser(existing);
        showLoginSuccess(existing.name);
        return;
    }

    const newUser = {
        name,
        email: email || `${name.toLowerCase()}@weatherwise.app`,
        pass: pass || "123456",
        specialCities: getSavedCities()
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    showLoginSuccess(newUser.name);
}

function showLoginSuccess(name) {
    const authAlert = document.getElementById("authAlert");
    if (authAlert) {
        authAlert.style.display = "block";
        authAlert.textContent = `🎉 Welcome, ${name}! You are now signed in.`;
    }

    triggerCelebratorySparkles();
    renderSavedCities();
    updateSaveButtonState();

    // Update welcome banner dynamically
    const greetingEl = document.getElementById("welcomeGreeting");
    const userTag = document.getElementById("welcomeUserTag");
    if (greetingEl) greetingEl.textContent = `Welcome back, ${name}! ✨`;
    if (userTag) {
        userTag.style.display = "inline-block";
        userTag.textContent = "⭐ Special Member";
    }

    setTimeout(() => {
        closeAuthModal();
    }, 900);
}

function handleLogout() {
    setCurrentUser(null);
    closeAuthModal();
    renderSavedCities();
    updateSaveButtonState();

    const userTag = document.getElementById("welcomeUserTag");
    if (userTag) userTag.style.display = "none";
}

/* ================= 5. SPECIAL & FAVORITE CITIES ================= */
function getSavedCities() {
    const user = getCurrentUser();
    if (user && user.specialCities) {
        return user.specialCities;
    }
    const guestData = safeStorage.getItem("weatherwise_saved_cities");
    if (!guestData) return [];
    try { return JSON.parse(guestData); } catch (e) { return []; }
}

function saveCityWithTag(cityObj) {
    const user = getCurrentUser();
    let list = getSavedCities();

    const existsIdx = list.findIndex(c => c.name.toLowerCase() === cityObj.name.toLowerCase());
    if (existsIdx >= 0) {
        list[existsIdx] = cityObj;
    } else {
        list.push(cityObj);
    }

    if (user) {
        user.specialCities = list;
        setCurrentUser(user);
        const users = getUsers();
        const uIdx = users.findIndex(u => u.name === user.name);
        if (uIdx >= 0) {
            users[uIdx].specialCities = list;
            saveUsers(users);
        }
    } else {
        safeStorage.setItem("weatherwise_saved_cities", JSON.stringify(list));
    }

    renderSavedCities();
    updateSaveButtonState();
}

function removeCityFromStorage(cityName) {
    const user = getCurrentUser();
    let list = getSavedCities().filter(c => c.name.toLowerCase() !== cityName.toLowerCase());

    if (user) {
        user.specialCities = list;
        setCurrentUser(user);
        const users = getUsers();
        const uIdx = users.findIndex(u => u.name === user.name);
        if (uIdx >= 0) {
            users[uIdx].specialCities = list;
            saveUsers(users);
        }
    } else {
        safeStorage.setItem("weatherwise_saved_cities", JSON.stringify(list));
    }

    renderSavedCities();
    updateSaveButtonState();
    renderSpecialCitiesInProfile();
}

function handleSaveCityClick() {
    const baseName = currentCityLabel.split(",")[0].trim();
    const list = getSavedCities();
    const isSaved = list.some(c => c.name.toLowerCase() === baseName.toLowerCase());

    if (isSaved) {
        removeCityFromStorage(baseName);
    } else {
        openSaveSpecialModal();
    }
}

function openSaveSpecialModal() {
    const modal = document.getElementById("saveSpecialModal");
    const label = document.getElementById("saveSpecialCityLabel");
    if (label) label.textContent = currentCityLabel;
    selectedSpecialTag = "Home";

    document.querySelectorAll(".tag-pill").forEach(pill => {
        if (pill.getAttribute("data-tag") === "Home") pill.classList.add("active");
        else pill.classList.remove("active");
    });

    if (modal) modal.style.display = "flex";
}

function closeSaveSpecialModal() {
    const modal = document.getElementById("saveSpecialModal");
    if (modal) modal.style.display = "none";
}

function selectSpecialTag(btn, tag) {
    selectedSpecialTag = tag;
    document.querySelectorAll(".tag-pill").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
}

function confirmSaveSpecialCity() {
    const baseName = currentCityLabel.split(",")[0].trim();
    const tagEmoji = { Home: "🏠", Work: "💼", Vacation: "🏖️", Special: "⭐" }[selectedSpecialTag] || "⭐";

    saveCityWithTag({
        name: baseName,
        fullLabel: currentCityLabel,
        lat: currentLat,
        lon: currentLon,
        tag: selectedSpecialTag,
        tagEmoji,
        temp: currentDisplayedTemp
    });

    closeSaveSpecialModal();
    triggerCelebratorySparkles();
}

function renderSavedCities() {
    const container = document.getElementById("savedCitiesContainer");
    const section = document.getElementById("savedCitiesSection");
    const badge = document.getElementById("savedCountBadge");

    if (!container || !section) return;
    const list = getSavedCities();

    if (list.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    if (badge) badge.textContent = `${list.length} saved`;
    container.innerHTML = "";

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "saved-city-card";
        const emoji = item.tagEmoji || "⭐";
        const tag = item.tag || "Special";

        card.innerHTML = `
            <div class="saved-city-info">
                <span class="saved-city-name">
                    ${emoji} ${item.name}
                    <span class="saved-city-tag">${tag}</span>
                </span>
                <span class="saved-city-temp">${item.temp ? item.temp + "°" : "Click to view"}</span>
            </div>
            <button class="saved-delete-btn" title="Remove city" aria-label="Remove city">✕</button>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("saved-delete-btn")) {
                e.stopPropagation();
                removeCityFromStorage(item.name);
            } else {
                fetchWeatherByCity(item.name);
            }
        });

        container.appendChild(card);
    });
}

function renderSpecialCitiesInProfile() {
    const listEl = document.getElementById("specialCitiesList");
    const countEl = document.getElementById("specialCitiesCount");
    if (!listEl) return;

    const list = getSavedCities();
    if (countEl) countEl.textContent = `${list.length} cities`;

    if (list.length === 0) {
        listEl.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px;">No special cities saved yet. Search any city and click "Save Special City"!</p>`;
        return;
    }

    listEl.innerHTML = "";
    list.forEach(item => {
        const row = document.createElement("div");
        row.className = "special-city-item";
        const emoji = item.tagEmoji || "⭐";
        const tag = item.tag || "Special";

        row.innerHTML = `
            <div class="special-city-main">
                <span>${emoji}</span>
                <span>${item.name}</span>
                <span class="special-tag-badge">${tag}</span>
            </div>
            <button class="special-del-btn" title="Delete">✕</button>
        `;

        row.addEventListener("click", (e) => {
            if (e.target.classList.contains("special-del-btn")) {
                e.stopPropagation();
                removeCityFromStorage(item.name);
            } else {
                closeAuthModal();
                fetchWeatherByCity(item.name);
            }
        });

        listEl.appendChild(row);
    });
}

function updateSaveButtonState() {
    const saveCityBtn = document.getElementById("saveCityBtn");
    const saveCityIcon = document.getElementById("saveCityIcon");
    const saveCityText = document.getElementById("saveCityText");

    if (!saveCityBtn) return;
    const list = getSavedCities();
    const baseName = currentCityLabel.split(",")[0].trim();
    const isSaved = list.some(c => c.name.toLowerCase() === baseName.toLowerCase());

    if (isSaved) {
        saveCityBtn.classList.add("saved");
        if (saveCityIcon) saveCityIcon.textContent = "★";
        if (saveCityText) saveCityText.textContent = "Saved Special";
    } else {
        saveCityBtn.classList.remove("saved");
        if (saveCityIcon) saveCityIcon.textContent = "⭐";
        if (saveCityText) saveCityText.textContent = "Save Special City";
    }
}

/* ================= 6. LOCATION LIVE CLOCK ================= */
function startLocationClock(timezone) {
    if (clockInterval) clearInterval(clockInterval);

    const localTimeDisplay = document.getElementById("localTimeDisplay");
    const localDateDisplay = document.getElementById("localDateDisplay");

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

/* ================= 7. 3D ROTATING WIND COMPASS & MONITORING ================= */
function updateMonitoringDashboard(data) {
    if (!data || !data.current) return;
    const cur = data.current;

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

    // Compass Needle Rotation
    const bearing = Math.round(cur.wind_direction_10m ?? 0);
    if (compassNeedle) {
        compassNeedle.style.transform = `rotate(${bearing}deg)`;
    }

    const cardinal = getCompassCardinal(bearing);
    if (windBearingText) windBearingText.textContent = `${bearing}° ${cardinal}`;
    if (windSpeedVal) windSpeedVal.textContent = formatWind(cur.wind_speed_10m);
    if (windGustsVal) windGustsVal.textContent = formatWind(cur.wind_gusts_10m || (cur.wind_speed_10m * 1.3));

    // Barometric Pressure Gauge
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

    // Atmospheric Moisture & UV
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

/* ================= 8. ZERO-JITTER 3D CELESTIAL HORIZON DOME ================= */
function updateCelestialHorizonDome(daily, timezone, customProgress = null) {
    if (!daily || !daily.sunrise || !daily.sunset) return;

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
    const celestialScrubber = document.getElementById("celestialScrubber");
    const eastGateLabel = document.getElementById("eastGateLabel");
    const westGateLabel = document.getElementById("westGateLabel");
    const celestialSvgArc = document.getElementById("celestialSvgArc");

    try {
        const now = new Date();
        const srStr = daily.sunrise[0].split("T")[1];
        const ssStr = daily.sunset[0].split("T")[1];

        if (sunriseTimeEl) sunriseTimeEl.textContent = srStr || "06:00";
        if (sunsetTimeEl) sunsetTimeEl.textContent = ssStr || "18:00";

        const [srH, srM] = (srStr || "06:00").split(":").map(Number);
        const [ssH, ssM] = (ssStr || "18:00").split(":").map(Number);
        const srMins = srH * 60 + srM;
        const ssMins = ssH * 60 + ssM;

        let progress = 0;
        let isDay = true;

        if (customProgress !== null) {
            // Simulation progress (0 to 1)
            // 0.0 to 0.5: Day (Sunrise -> Noon Zenith -> Sunset)
            // 0.5 to 1.0: Night (Sunset -> Midnight Apex -> Sunrise)
            if (customProgress <= 0.5) {
                isDay = true;
                progress = customProgress * 2;
            } else {
                isDay = false;
                progress = (customProgress - 0.5) * 2;
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
                progress = (curMins - srMins) / Math.max(1, ssMins - srMins);
                progress = Math.max(0, Math.min(1, progress));
            } else {
                const nightTotal = (1440 - ssMins) + srMins;
                const nightElapsed = curMins > ssMins ? (curMins - ssMins) : ((1440 - ssMins) + curMins);
                progress = nightElapsed / Math.max(1, nightTotal);
                progress = Math.max(0, Math.min(1, progress));
            }
        }

        // Apply Sun vs Moon styling
        if (isDay) {
            if (celestialModeIcon) celestialModeIcon.textContent = "☀️";
            if (celestialModeName) celestialModeName.textContent = "Day Solar Orbit (Sunrise to Sunset)";
            if (celestialHeading) celestialHeading.textContent = "Sun Orbit Trajectory (Sunrise to Sunset)";
            if (celestialEmoji) celestialEmoji.textContent = "☀️";
            if (celestialBody) celestialBody.className = "celestial-sphere-3d sun-sphere";
            if (celestialSvgArc) celestialSvgArc.setAttribute("stroke", "url(#domeArcGradDay)");
            if (eastGateLabel) eastGateLabel.textContent = "East (Sunrise)";
            if (westGateLabel) westGateLabel.textContent = "West (Sunset)";

            const percentText = Math.round(progress * 100);
            if (solarProgressBadge) solarProgressBadge.textContent = `${percentText}% Solar Zenith`;
            if (celestialRemainingText && customProgress === null) {
                celestialRemainingText.textContent = `Sun is at ${percentText}% across the daytime sky`;
            }
        } else {
            if (celestialModeIcon) celestialModeIcon.textContent = "🌙";
            if (celestialModeName) celestialModeName.textContent = "Nocturnal Moon Orbit (Sunset to Dawn)";
            if (celestialHeading) celestialHeading.textContent = "Moon Orbit Trajectory (Night Sky Arc)";
            if (celestialEmoji) celestialEmoji.textContent = "🌙";
            if (celestialBody) celestialBody.className = "celestial-sphere-3d moon-sphere";
            if (celestialSvgArc) celestialSvgArc.setAttribute("stroke", "url(#domeArcGradNight)");
            if (eastGateLabel) eastGateLabel.textContent = "East (Dawn)";
            if (westGateLabel) westGateLabel.textContent = "West (Dusk)";

            const percentText = Math.round(progress * 100);
            if (solarProgressBadge) solarProgressBadge.textContent = `${percentText}% Lunar Apex`;
            if (celestialRemainingText && customProgress === null) {
                celestialRemainingText.textContent = `Moon is at ${percentText}% across the nocturnal sky`;
            }
        }

        // Mathematical Bezier position on SVG arch
        let leftPercent = 5.7 + progress * 88.5;
        let topPercent = 87.5 - 158.3 * progress * (1 - progress);

        if (celestialSvgArc && typeof celestialSvgArc.getPointAtLength === "function") {
            try {
                const totalLen = celestialSvgArc.getTotalLength();
                if (totalLen > 0) {
                    const pt = celestialSvgArc.getPointAtLength(progress * totalLen);
                    leftPercent = (pt.x / 700) * 100;
                    topPercent = (pt.y / 240) * 100;
                }
            } catch (err) {}
        }

        if (celestialOrbiter) {
            celestialOrbiter.style.left = `${leftPercent.toFixed(2)}%`;
            celestialOrbiter.style.top = `${topPercent.toFixed(2)}%`;
        }

        if (celestialScrubber && customProgress === null) {
            const overall = isDay ? (progress * 0.5) : (0.5 + progress * 0.5);
            celestialScrubber.value = Math.round(overall * 100);
        }
    } catch (e) {
        console.warn("Celestial calculation error:", e);
    }
}

function toggleCelestialSimulation() {
    const simPlayBtn = document.getElementById("simPlayBtn");
    const celestialRemainingText = document.getElementById("celestialRemainingText");
    const celestialScrubber = document.getElementById("celestialScrubber");

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
        simProgress += 0.008;
        if (simProgress > 1) simProgress = 0;

        if (lastWeatherData) {
            updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone, simProgress);
        }
        if (celestialScrubber) celestialScrubber.value = Math.round(simProgress * 100);
        if (celestialRemainingText) {
            const label = simProgress <= 0.5 ? "Day (Sun Orbit)" : "Night (Moon Orbit)";
            celestialRemainingText.textContent = `24h Simulation: ${label} - ${Math.round(simProgress * 100)}%`;
        }
    }, 50);
}

function resetCelestialSimulation() {
    if (simInterval) clearInterval(simInterval);
    isSimulating = false;
    const simPlayBtn = document.getElementById("simPlayBtn");
    if (simPlayBtn) simPlayBtn.innerHTML = "<span>▶️</span> Play 24h Arc";
    if (lastWeatherData) updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone);
}

function handleScrubberInput(e) {
    if (simInterval) clearInterval(simInterval);
    isSimulating = false;
    const simPlayBtn = document.getElementById("simPlayBtn");
    if (simPlayBtn) simPlayBtn.innerHTML = "<span>▶️</span> Play 24h Arc";

    const val = parseFloat(e.target.value) / 100;
    if (lastWeatherData) {
        updateCelestialHorizonDome(lastWeatherData.daily, currentTimezone, val);
        const celestialRemainingText = document.getElementById("celestialRemainingText");
        if (celestialRemainingText) {
            const label = val <= 0.5 ? "Day (Sun Orbit)" : "Night (Moon Orbit)";
            celestialRemainingText.textContent = `Scrubber: ${label} at ${Math.round(val * 100)}%`;
        }
    }
}

/* ================= 9. HOURLY TIMELINE ================= */
function switchHourlyDay(mode) {
    selectedHourlyDay = mode;
    const btnToday = document.getElementById("btnToday");
    const btnTomorrow = document.getElementById("btnTomorrow");

    if (mode === "today") {
        if (btnToday) btnToday.classList.add("active");
        if (btnTomorrow) btnTomorrow.classList.remove("active");
    } else {
        if (btnTomorrow) btnTomorrow.classList.add("active");
        if (btnToday) btnToday.classList.remove("active");
    }

    if (lastWeatherData && lastWeatherData.hourly) {
        renderHourlyStream(lastWeatherData.hourly, currentTimezone, selectedHourlyDay);
    }
}

function renderHourlyStream(hourly, timezone, dayMode = "today") {
    const hourlyContainer = document.getElementById("hourlyContainer");
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
        card.title = "Click to view full hourly table";
        card.innerHTML = `
            <div class="hour-time">${timeLabel}</div>
            <div class="hour-icon">${info.icon}</div>
            <div class="hour-temp">${temp}°</div>
            ${rain > 0 ? `<div class="hour-rain">💧 ${rain}%</div>` : ""}
            <div class="hour-wind">${wind}</div>
        `;

        card.addEventListener("click", () => {
            navigateToDetails();
        });

        hourlyContainer.appendChild(card);
    }
    initCard3DTilt();
}

function updateOpenDetailsLink() {
    const openDetailsPageBtn = document.getElementById("openDetailsPageBtn");
    if (!openDetailsPageBtn) return;
    openDetailsPageBtn.href = `details.html?city=${encodeURIComponent(currentCityLabel)}&lat=${currentLat}&lon=${currentLon}&unit=${currentUnit}&day=${selectedHourlyDay}`;
}

function navigateToDetails(e) {
    if (e) e.preventDefault();
    const targetUrl = `details.html?city=${encodeURIComponent(currentCityLabel)}&lat=${currentLat}&lon=${currentLon}&unit=${currentUnit}&day=${selectedHourlyDay}`;
    window.location.href = targetUrl;
}

/* ================= 10. HIGH-IMPACT 3D WEBGL ATMOSPHERIC PLANETARIUM ================= */
function initHighImpactThreeJS() {
    try {
        const canvas = document.getElementById("threeCanvas");
        if (!canvas || typeof THREE === "undefined") return;

        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        threeCamera.position.z = 32;

        threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
        threeRenderer.setSize(window.innerWidth, window.innerHeight);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const isDark = document.body.classList.contains("dark");

        // 1. Central 3D Celestial Wireframe Globe
        const globeGeo = new THREE.SphereGeometry(14, 28, 28);
        const globeMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0x38bdf8 : 0x0284c7,
            wireframe: true,
            transparent: true,
            opacity: isDark ? 0.38 : 0.24
        });
        threeCelestialGlobe = new THREE.Mesh(globeGeo, globeMat);
        threeCelestialGlobe.position.set(0, -2, -5);
        threeScene.add(threeCelestialGlobe);

        // 2. 3D Primary Planetary Orbit Ring
        const ringGeo = new THREE.RingGeometry(18, 18.7, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0xa855f7 : 0xf59e0b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isDark ? 0.45 : 0.32
        });
        threeOrbitRing = new THREE.Mesh(ringGeo, ringMat);
        threeOrbitRing.rotation.x = Math.PI / 2.6;
        threeOrbitRing.rotation.y = Math.PI / 8;
        threeOrbitRing.position.set(0, -2, -5);
        threeScene.add(threeOrbitRing);

        // 3. 3D Secondary Concentric Ring
        const ring2Geo = new THREE.RingGeometry(22, 22.6, 64);
        const ring2Mat = new THREE.MeshBasicMaterial({
            color: isDark ? 0x22d3ee : 0x06b6d4,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isDark ? 0.35 : 0.22
        });
        threeOrbitRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
        threeOrbitRing2.rotation.x = Math.PI / 3.4;
        threeOrbitRing2.rotation.y = -Math.PI / 6;
        threeOrbitRing2.position.set(0, -2, -5);
        threeScene.add(threeOrbitRing2);

        // 4. Floating 3D Celestial Particles (240 points)
        const particleCount = 240;
        const particleGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 80;
            posArray[i + 1] = (Math.random() - 0.5) * 70;
            posArray[i + 2] = (Math.random() - 0.5) * 50;

            if (isDark) {
                // Night colors: Cyan, Indigo, Silver
                colorArray[i] = 0.2 + Math.random() * 0.4;
                colorArray[i + 1] = 0.7 + Math.random() * 0.3;
                colorArray[i + 2] = 1.0;
            } else {
                // Day colors: Golden Amber, Azure, Sunlight Gold
                colorArray[i] = 0.96;
                colorArray[i + 1] = 0.7 + Math.random() * 0.25;
                colorArray[i + 2] = 0.2 + Math.random() * 0.3;
            }
        }

        particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
        particleGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

        threeStarMaterial = new THREE.PointsMaterial({
            size: 2.2,
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 0.85 : 0.70,
            blending: THREE.AdditiveBlending
        });

        threeStarParticles = new THREE.Points(particleGeo, threeStarMaterial);
        threeScene.add(threeStarParticles);

        // Parallax Interaction with Mouse
        window.addEventListener("mousemove", (e) => {
            const normX = (e.clientX / window.innerWidth) * 2 - 1;
            const normY = -(e.clientY / window.innerHeight) * 2 + 1;
            targetCameraX = normX * 4;
            targetCameraY = normY * 3;
        });

        window.addEventListener("resize", () => {
            if (!threeCamera || !threeRenderer) return;
            threeCamera.aspect = window.innerWidth / window.innerHeight;
            threeCamera.updateProjectionMatrix();
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        function animate() {
            requestAnimationFrame(animate);

            // Rotate 3D celestial elements
            if (threeCelestialGlobe) {
                threeCelestialGlobe.rotation.y += 0.0014;
                threeCelestialGlobe.rotation.x += 0.0005;
            }
            if (threeOrbitRing) {
                threeOrbitRing.rotation.z += 0.0018;
            }
            if (threeOrbitRing2) {
                threeOrbitRing2.rotation.z -= 0.0015;
            }
            if (threeStarParticles) {
                threeStarParticles.rotation.y += 0.0008;
            }

            // Smooth parallax lerp
            if (threeCamera) {
                threeCamera.position.x += (targetCameraX - threeCamera.position.x) * 0.05;
                threeCamera.position.y += (targetCameraY - threeCamera.position.y) * 0.05;
                threeCamera.lookAt(0, 0, 0);
            }

            threeRenderer.render(threeScene, threeCamera);
        }

        animate();
    } catch (err) {
        console.warn("WebGL Three.js 3D background notice:", err);
    }
}

function updateThreeJSPalette() {
    if (!threeScene) return;
    const isDark = document.body.classList.contains("dark");

    if (threeCelestialGlobe && threeCelestialGlobe.material) {
        threeCelestialGlobe.material.color.setHex(isDark ? 0x38bdf8 : 0x0284c7);
        threeCelestialGlobe.material.opacity = isDark ? 0.38 : 0.24;
    }
    if (threeOrbitRing && threeOrbitRing.material) {
        threeOrbitRing.material.color.setHex(isDark ? 0xa855f7 : 0xf59e0b);
        threeOrbitRing.material.opacity = isDark ? 0.45 : 0.32;
    }
    if (threeOrbitRing2 && threeOrbitRing2.material) {
        threeOrbitRing2.material.color.setHex(isDark ? 0x22d3ee : 0x06b6d4);
        threeOrbitRing2.material.opacity = isDark ? 0.35 : 0.22;
    }
    if (threeStarParticles && threeStarParticles.geometry) {
        const colors = threeStarParticles.geometry.attributes.color.array;
        const count = colors.length / 3;

        for (let i = 0; i < count * 3; i += 3) {
            if (isDark) {
                colors[i] = 0.2 + Math.random() * 0.4;
                colors[i + 1] = 0.7 + Math.random() * 0.3;
                colors[i + 2] = 1.0;
            } else {
                colors[i] = 0.96;
                colors[i + 1] = 0.7 + Math.random() * 0.25;
                colors[i + 2] = 0.2 + Math.random() * 0.3;
            }
        }
        threeStarParticles.geometry.attributes.color.needsUpdate = true;
    }
    if (threeStarMaterial) {
        threeStarMaterial.opacity = isDark ? 0.85 : 0.70;
    }
}

/* ================= 10.1 DYNAMIC 3D TILT ENGINE FOR ALL DASHBOARD BOXES ================= */
function initCard3DTilt() {
    const cardSelectors = [
        ".weather-card-3d",
        ".monitoring-card-3d",
        ".celestial-dome-card-3d",
        ".hourly-card-3d"
    ];

    const cards = document.querySelectorAll(cardSelectors.join(","));
    cards.forEach(card => {
        if (card.dataset.tiltInitialized) return;
        card.dataset.tiltInitialized = "true";

        let rect = null;

        card.addEventListener("mouseenter", () => {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener("mousemove", (e) => {
            if (!rect) rect = card.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const xPct = (mouseX / rect.width - 0.5) * 2; // -1 to 1
            const yPct = (mouseY / rect.height - 0.5) * 2; // -1 to 1

            const maxTilt = 8; // degrees
            const tiltX = -yPct * maxTilt;
            const tiltY = xPct * maxTilt;

            card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-8px) translateZ(16px)`;

            const glare = card.querySelector(".card-glare");
            if (glare) {
                glare.style.opacity = "0.85";
                glare.style.background = `radial-gradient(circle at ${(mouseX / rect.width * 100).toFixed(1)}% ${(mouseY / rect.height * 100).toFixed(1)}%, rgba(255, 255, 255, 0.42) 0%, transparent 65%)`;
            }
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)";
            const glare = card.querySelector(".card-glare");
            if (glare) {
                glare.style.opacity = "0.4";
            }
            rect = null;
        });

        // Touch support for mobile 3D tilt
        card.addEventListener("touchmove", (e) => {
            if (!e.touches || !e.touches[0]) return;
            if (!rect) rect = card.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            const xPct = Math.max(-1, Math.min(1, (touchX / rect.width - 0.5) * 2));
            const yPct = Math.max(-1, Math.min(1, (touchY / rect.height - 0.5) * 2));

            const tiltX = -yPct * 7;
            const tiltY = xPct * 7;

            card.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px) translateZ(10px)`;
        }, { passive: true });

        card.addEventListener("touchend", () => {
            card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)";
            rect = null;
        });
    });
}

/* ================= 11. WEATHER DATA RETRIEVAL ================= */
function searchCurrentInput() {
    const input = document.getElementById("cityInput");
    if (!input) return;
    const city = input.value.trim();
    if (city) fetchWeatherByCity(city);
    else showError("Please enter a city name.");
}

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

function forceRefreshWeather() {
    const btn = document.getElementById("manualRefreshBtn");
    const icon = btn ? btn.querySelector(".refresh-icon") : null;
    if (icon) icon.style.transform = "rotate(360deg)";
    setTimeout(() => { if (icon) icon.style.transform = "none"; }, 600);

    if (currentLat && currentLon) {
        loadWeatherCoordinates(currentLat, currentLon, currentCityLabel, true);
        autoRefreshSeconds = 900;
    }
}

/* ================= 12. WEATHER RENDERING ================= */
function renderAllWeather(title, data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const condition = getWeatherInfo(current.weather_code, current.is_day);

    const cityNameEl = document.getElementById("cityName");
    const timezoneTextEl = document.getElementById("timezoneText");
    const weatherIconEl = document.getElementById("weatherIcon");
    const conditionEl = document.getElementById("condition");
    const tempUnitEl = document.getElementById("tempUnit");
    const tempHighLowEl = document.getElementById("tempHighLow");

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
}

function animateTemperature(targetVal) {
    const temperatureEl = document.getElementById("temperature");
    if (!temperatureEl) return;
    if (isNaN(targetVal)) {
        temperatureEl.textContent = targetVal;
        return;
    }

    const startVal = currentDisplayedTemp;
    const duration = 400;
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
        default: return { description: "Clear Sky", icon: day ? "☀️" : "🌙" };
    }
}

function startAutoRefreshTimer() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshSeconds = 900;

    const refreshTimerText = document.getElementById("refreshTimerText");

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

function showLoading(show, message = "Synchronizing telemetry...") {
    const loadingBox = document.getElementById("loading");
    const loadingMsg = document.getElementById("loadingMsg");
    if (!loadingBox) return;
    loadingBox.style.display = show ? "flex" : "none";
    if (loadingMsg) loadingMsg.textContent = message;
}

function showError(msg) {
    const errorBox = document.getElementById("error");
    if (!errorBox) return;
    errorBox.textContent = `⚠️ ${msg}`;
    errorBox.style.display = "block";
}

function hideError() {
    const errorBox = document.getElementById("error");
    if (!errorBox) return;
    errorBox.style.display = "none";
}

/* ================= 13. BOOTSTRAP INITIALIZATION ================= */
function initApp() {
    initTheme();
    const unitBtn = document.getElementById("unitBtn");
    if (unitBtn) unitBtn.innerHTML = `<span class="btn-text">°${currentUnit}</span>`;

    // Explicit event listener on accountBtn
    const accountBtn = document.getElementById("accountBtn");
    if (accountBtn) {
        accountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAuthModal();
        });
    }

    updateAccountBtnUI();
    initWelcomeExperience();
    startAutoRefreshTimer();
    renderSavedCities();
    initHighImpactThreeJS();
    initCard3DTilt();

    const savedCity = safeStorage.getItem("weatherwise_last_city");
    if (savedCity) {
        const cityInput = document.getElementById("cityInput");
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