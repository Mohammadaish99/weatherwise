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

// Three.js Universe & Cosmos Scene
let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let cosmicStarfield = null;
let cosmicNebula = null;
let cosmicMoonMesh = null;
let cosmicMoonGroup = null;
let cosmicSunLight = null;
let starPositions = null;
let targetCameraX = 0;
let targetCameraY = 0;
let scrollCameraY = 0;
let scrollCameraZ = 0;

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
window.exploreDemoAccount = exploreDemoAccount;
window.handleGoogleSignIn = handleGoogleSignIn;
window.openGoogleChooser = openGoogleChooser;
window.closeGoogleChooser = closeGoogleChooser;
window.selectGoogleAccount = selectGoogleAccount;
window.toggleGoogleCustomAccount = toggleGoogleCustomAccount;
window.submitCustomGoogleAccount = submitCustomGoogleAccount;
window.togglePasswordVisibility = togglePasswordVisibility;
window.updatePasswordStrength = updatePasswordStrength;
window.showForgotPasswordView = showForgotPasswordView;
window.handlePasswordReset = handlePasswordReset;
window.switchProfileTab = switchProfileTab;
window.setProfileUnit = setProfileUnit;
window.setProfileTheme = setProfileTheme;
window.updateUserProfile = updateUserProfile;
window.changeUserPassword = changeUserPassword;
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
window.triggerExtremeCategory = triggerExtremeCategory;
window.selectExtremeCity = selectExtremeCity;
window.selectGeocodedCity = selectGeocodedCity;
window.hideSearchSuggestions = hideSearchSuggestions;
window.closeExtremeShowcase = closeExtremeShowcase;
window.openAntiqueModal = openAntiqueModal;
window.closeAntiqueModal = closeAntiqueModal;
window.filterAntiqueModalGrid = filterAntiqueModalGrid;

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

/* ================= 4. PROFESSIONAL CLIENT-SIDE AUTHENTICATION SYSTEM ================= */

// Web Crypto SHA-256 password hashing (safe client-side cryptographic storage)
async function hashPassword(plainText) {
    if (!plainText) return "";
    try {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(plainText);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        }
    } catch (e) {
        console.warn("Web Crypto unavailable, using fallback hash:", e);
    }
    // Fallback hash implementation for older or restricted environments
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
        const char = plainText.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return "ww_h_" + Math.abs(hash).toString(16);
}

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
    const welcomeAuthBtn = document.getElementById("welcomeAuthBtn");
    const welcomeGreeting = document.getElementById("welcomeGreeting");
    const welcomeUserTag = document.getElementById("welcomeUserTag");

    if (user) {
        if (accountBtn) {
            accountBtn.classList.add("logged-in");
            accountBtn.title = `Signed in as ${user.name} (Click to manage account)`;
        }
        if (accountBtnIcon) accountBtnIcon.textContent = user.name ? user.name.charAt(0).toUpperCase() : "⭐";
        if (accountBtnText) accountBtnText.textContent = user.name ? user.name.split(" ")[0] : "Account";

        if (welcomeAuthBtn) {
            welcomeAuthBtn.textContent = `⭐ ${user.name.split(" ")[0]} (My Account)`;
        }
        if (welcomeGreeting) {
            welcomeGreeting.textContent = `Welcome back, ${user.name}! ✨`;
        }
        if (welcomeUserTag) {
            welcomeUserTag.style.display = "inline-block";
            welcomeUserTag.textContent = "⭐ Special Member";
        }
    } else {
        if (accountBtn) {
            accountBtn.classList.remove("logged-in");
            accountBtn.title = "Sign In or Create Account";
        }
        if (accountBtnIcon) accountBtnIcon.textContent = "👤";
        if (accountBtnText) accountBtnText.textContent = "Sign In";

        if (welcomeAuthBtn) {
            welcomeAuthBtn.textContent = "👤 Sign In / Register";
        }
        if (welcomeUserTag) {
            welcomeUserTag.style.display = "none";
        }
    }
}

// Real-time password strength evaluation
function calculatePasswordStrength(pwd) {
    if (!pwd) return { score: 0, text: "Enter password", color: "var(--text-subtle)", pct: "0%" };
    if (pwd.length < 6) return { score: 1, text: "Too short (minimum 6 characters)", color: "#ef4444", pct: "25%" };

    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) {
        return { score: 2, text: "Weak password", color: "#f97316", pct: "45%" };
    } else if (score <= 4) {
        return { score: 3, text: "Good password", color: "#eab308", pct: "75%" };
    } else {
        return { score: 4, text: "Strong password! ✨", color: "#10b981", pct: "100%" };
    }
}

function updatePasswordStrength(pwd) {
    const fillEl = document.getElementById("pwdStrengthFill");
    const textEl = document.getElementById("pwdStrengthText");
    if (!fillEl || !textEl) return;

    const res = calculatePasswordStrength(pwd);
    fillEl.style.width = res.pct;
    fillEl.style.backgroundColor = res.color;
    textEl.textContent = res.text;
    textEl.style.color = res.color;
}

// Show / Hide password visibility toggle
function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    if (btnEl) {
        btnEl.textContent = isPassword ? "👁️‍🗨️" : "👁️";
        btnEl.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    }
}

// Clean alert notification inside modal
function showAuthAlert(message, type = "error") {
    const authAlert = document.getElementById("authAlert");
    if (!authAlert) return;
    authAlert.className = `auth-alert ${type}`;
    const icon = type === "error" ? "⚠️" : "🎉";
    authAlert.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    authAlert.style.display = "flex";
}

function hideAuthAlert() {
    const authAlert = document.getElementById("authAlert");
    if (authAlert) authAlert.style.display = "none";
}

function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    const user = getCurrentUser();
    const googleAuthSection = document.getElementById("googleAuthSection");
    const authTabs = document.getElementById("authTabs");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const demoSection = document.getElementById("demoLoginSection");
    const profileView = document.getElementById("profileView");
    const modalTitle = document.getElementById("modalTitle");

    hideAuthAlert();

    if (user) {
        // Show Profile Dashboard View
        if (modalTitle) modalTitle.textContent = "Account Dashboard";
        if (googleAuthSection) googleAuthSection.style.display = "none";
        if (authTabs) authTabs.style.display = "none";
        if (signInForm) signInForm.style.display = "none";
        if (signUpForm) signUpForm.style.display = "none";
        if (forgotPasswordForm) forgotPasswordForm.style.display = "none";
        if (demoSection) demoSection.style.display = "none";
        if (profileView) profileView.style.display = "flex";

        const profileName = document.getElementById("profileUserName");
        const profileEmail = document.getElementById("profileUserEmail");
        const profileAvatar = document.getElementById("profileAvatar");
        const profileMemberSince = document.getElementById("profileMemberSince");
        const profileEditName = document.getElementById("profileEditName");
        const profileBadgeGoogle = document.getElementById("profileBadgeGoogle");

        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email || "Active Member";
        if (profileAvatar) {
            profileAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : "👤";
            if (user.authProvider === "google") {
                profileAvatar.style.background = "linear-gradient(135deg, #4285F4, #34A853)";
            } else {
                profileAvatar.style.background = "linear-gradient(135deg, var(--primary), var(--accent-cyan))";
            }
        }
        if (profileMemberSince) profileMemberSince.textContent = `Member since ${user.createdAt || "Recently"}`;
        if (profileEditName) profileEditName.value = user.name;
        if (profileBadgeGoogle) {
            profileBadgeGoogle.style.display = user.authProvider === "google" ? "inline-flex" : "none";
        }

        // Sync preference pills in profile
        updateProfilePreferencesUI();

        // Default to Saved Cities sub-tab
        switchProfileTab("cities");
        renderSpecialCitiesInProfile();
    } else {
        // Show Sign In / Register View
        if (modalTitle) modalTitle.textContent = "WeatherWise Account";
        if (googleAuthSection) googleAuthSection.style.display = "block";
        if (authTabs) authTabs.style.display = "flex";
        if (demoSection) demoSection.style.display = "block";
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
    hideAuthAlert();
}

function switchAuthTab(tab) {
    const tabSignIn = document.getElementById("tabSignIn");
    const tabSignUp = document.getElementById("tabSignUp");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const authTabs = document.getElementById("authTabs");
    const demoSection = document.getElementById("demoLoginSection");
    const googleAuthSection = document.getElementById("googleAuthSection");

    hideAuthAlert();

    if (tab === "signin") {
        if (googleAuthSection) googleAuthSection.style.display = "block";
        if (authTabs) authTabs.style.display = "flex";
        if (tabSignIn) tabSignIn.classList.add("active");
        if (tabSignUp) tabSignUp.classList.remove("active");
        if (signInForm) signInForm.style.display = "flex";
        if (signUpForm) signUpForm.style.display = "none";
        if (forgotPasswordForm) forgotPasswordForm.style.display = "none";
        if (demoSection) demoSection.style.display = "block";
    } else if (tab === "signup") {
        if (googleAuthSection) googleAuthSection.style.display = "block";
        if (authTabs) authTabs.style.display = "flex";
        if (tabSignUp) tabSignUp.classList.add("active");
        if (tabSignIn) tabSignIn.classList.remove("active");
        if (signUpForm) signUpForm.style.display = "flex";
        if (signInForm) signInForm.style.display = "none";
        if (forgotPasswordForm) forgotPasswordForm.style.display = "none";
        if (demoSection) demoSection.style.display = "block";
    } else if (tab === "forgot") {
        if (googleAuthSection) googleAuthSection.style.display = "none";
        if (authTabs) authTabs.style.display = "none";
        if (signInForm) signInForm.style.display = "none";
        if (signUpForm) signUpForm.style.display = "none";
        if (forgotPasswordForm) forgotPasswordForm.style.display = "flex";
        if (demoSection) demoSection.style.display = "none";
    }
}

function showForgotPasswordView() {
    switchAuthTab("forgot");
}

// Professional Sign In Handler with Credential Validation & Simulated Network Delay
async function handleSignIn(e) {
    if (e) e.preventDefault();

    const inputEl = document.getElementById("signInEmail");
    const passEl = document.getElementById("signInPassword");
    const submitBtn = document.getElementById("signInSubmitBtn");
    const spinner = document.getElementById("signInSpinner");
    const btnText = document.getElementById("signInBtnText");

    const input = inputEl ? inputEl.value.trim() : "";
    const pass = passEl ? passEl.value.trim() : "";

    hideAuthAlert();

    if (!input) {
        showAuthAlert("Please enter your email address or username.", "error");
        if (inputEl) inputEl.focus();
        return;
    }
    if (!pass) {
        showAuthAlert("Please enter your password.", "error");
        if (passEl) passEl.focus();
        return;
    }

    // Set loading state for authentic experience
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Authenticating...";

    await new Promise(r => setTimeout(r, 450));

    const users = getUsers();
    const cleanInput = input.toLowerCase();
    const found = users.find(u =>
        (u.email && u.email.toLowerCase() === cleanInput) ||
        (u.username && u.username.toLowerCase() === cleanInput) ||
        (u.name && u.name.toLowerCase() === cleanInput)
    );

    const hashedInputPass = await hashPassword(pass);

    if (!found) {
        // Reset loading state
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.style.display = "none";
        if (btnText) btnText.textContent = "Sign In";
        showAuthAlert("No account found with this email or username. Would you like to create one?", "error");
        return;
    }

    // Check password matching (supports both SHA-256 hashed and legacy passwords)
    const isPasswordValid = (found.passHash && found.passHash === hashedInputPass) ||
                            (found.pass && found.pass === pass);

    if (!isPasswordValid) {
        // Reset loading state
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.style.display = "none";
        if (btnText) btnText.textContent = "Sign In";
        showAuthAlert("Incorrect password. Please verify your password and try again.", "error");
        if (passEl) passEl.focus();
        return;
    }

    // Success: Restore user preferences if saved
    if (found.prefUnit && found.prefUnit !== currentUnit) {
        currentUnit = found.prefUnit;
        safeStorage.setItem("weatherwise_unit", currentUnit);
        const unitBtn = document.getElementById("unitBtn");
        if (unitBtn) unitBtn.innerHTML = `<span class="btn-text">°${currentUnit}</span>`;
    }
    if (found.prefTheme) {
        const isDark = found.prefTheme === "dark";
        document.body.classList.toggle("dark", isDark);
        safeStorage.setItem("weatherwise_theme", found.prefTheme);
        const themeBtn = document.getElementById("themeBtn");
        if (themeBtn) themeBtn.innerHTML = `<span class="btn-icon">${isDark ? "☀️" : "🌙"}</span>`;
    }

    // Reset button
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (btnText) btnText.textContent = "Sign In";

    setCurrentUser(found);
    showLoginSuccess(found.name);
}

// Professional Sign Up Handler with Strict Field Validation
async function handleSignUp(e) {
    if (e) e.preventDefault();

    const nameEl = document.getElementById("signUpName");
    const emailEl = document.getElementById("signUpEmail");
    const passEl = document.getElementById("signUpPassword");
    const confirmPassEl = document.getElementById("signUpConfirmPassword");
    const submitBtn = document.getElementById("signUpSubmitBtn");
    const spinner = document.getElementById("signUpSpinner");
    const btnText = document.getElementById("signUpBtnText");

    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim().toLowerCase() : "";
    const pass = passEl ? passEl.value.trim() : "";
    const confirmPass = confirmPassEl ? confirmPassEl.value.trim() : "";

    hideAuthAlert();

    if (!name || name.length < 2) {
        showAuthAlert("Please enter your full name (at least 2 characters).", "error");
        if (nameEl) nameEl.focus();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showAuthAlert("Please enter a valid email address (e.g., name@example.com).", "error");
        if (emailEl) emailEl.focus();
        return;
    }

    if (!pass || pass.length < 6) {
        showAuthAlert("Password must be at least 6 characters long.", "error");
        if (passEl) passEl.focus();
        return;
    }

    if (pass !== confirmPass) {
        showAuthAlert("Passwords do not match. Please ensure both passwords are identical.", "error");
        if (confirmPassEl) confirmPassEl.focus();
        return;
    }

    const users = getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email);

    if (existing) {
        showAuthAlert("An account with this email already exists. Please Sign In instead.", "error");
        return;
    }

    // Show loading state
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Creating Account...";

    await new Promise(r => setTimeout(r, 500));

    const hashedPass = await hashPassword(pass);
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    const newUser = {
        id: "usr_" + Date.now(),
        name: formattedName,
        username: email.split("@")[0],
        email: email,
        passHash: hashedPass,
        createdAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        prefUnit: currentUnit || "C",
        prefTheme: document.body.classList.contains("dark") ? "dark" : "light",
        specialCities: getSavedCities()
    };

    users.push(newUser);
    saveUsers(users);

    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (btnText) btnText.textContent = "Create Free Account";

    setCurrentUser(newUser);
    showLoginSuccess(newUser.name);
}

// 1-Click Instant Demo Account (Ideal for recruiters, portfolios, and instant evaluators)
async function exploreDemoAccount() {
    const users = getUsers();
    let demoUser = users.find(u => u.email === "demo.explorer@weatherwise.app");

    if (!demoUser) {
        const hashedDemoPass = await hashPassword("demo123");
        demoUser = {
            id: "usr_demo",
            name: "Mohammad Demo",
            username: "mohammad_demo",
            email: "demo.explorer@weatherwise.app",
            passHash: hashedDemoPass,
            createdAt: "Portfolio Showcase",
            prefUnit: "C",
            prefTheme: "dark",
            specialCities: [
                { name: "London", tag: "Home", tagEmoji: "🏠", date: "Verified" },
                { name: "Tokyo", tag: "Travel", tagEmoji: "✈️", date: "Verified" },
                { name: "New York", tag: "Work", tagEmoji: "💼", date: "Verified" },
                { name: "Dubai", tag: "Vacation", tagEmoji: "🏖️", date: "Verified" }
            ]
        };
        users.push(demoUser);
        saveUsers(users);
    }

    setCurrentUser(demoUser);
    showLoginSuccess(demoUser.name);
}

// Legacy demo wrapper for backward compatibility
function quickDemoLogin(userName = "Mohammad") {
    exploreDemoAccount();
}

// ================= GOOGLE AUTHENTICATION SYSTEM =================
function handleGoogleSignIn() {
    // Check if Google Identity Services is available and configured with client ID
    if (window.google && window.google.accounts && window.google.accounts.id && window.GOOGLE_CLIENT_ID) {
        try {
            window.google.accounts.id.prompt();
            return;
        } catch (err) {
            console.log("Google GIS prompt fallback:", err);
        }
    }
    openGoogleChooser();
}

function openGoogleChooser() {
    const modal = document.getElementById("googleChooserModal");
    if (!modal) return;
    const customForm = document.getElementById("googleCustomForm");
    if (customForm) customForm.style.display = "none";
    modal.style.display = "flex";
    modal.style.opacity = "1";
    modal.style.visibility = "visible";
    modal.style.pointerEvents = "auto";
}

function closeGoogleChooser() {
    const modal = document.getElementById("googleChooserModal");
    if (modal) {
        modal.style.display = "none";
        modal.style.opacity = "0";
    }
}

function toggleGoogleCustomAccount() {
    const form = document.getElementById("googleCustomForm");
    if (!form) return;
    form.style.display = form.style.display === "none" ? "flex" : "none";
    if (form.style.display === "flex") {
        const nameInput = document.getElementById("googleCustomName");
        if (nameInput) nameInput.focus();
    }
}

function submitCustomGoogleAccount(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById("googleCustomName");
    const emailInput = document.getElementById("googleCustomEmail");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

    if (!name || name.length < 2) {
        alert("Please enter a valid display name.");
        if (nameInput) nameInput.focus();
        return;
    }
    if (!email || !email.includes("@")) {
        alert("Please enter a valid Google/Gmail address.");
        if (emailInput) emailInput.focus();
        return;
    }

    selectGoogleAccount(name, email);
}

function selectGoogleAccount(name, email) {
    const users = getUsers();
    const cleanEmail = email.toLowerCase();
    let found = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!found) {
        found = {
            id: "usr_google_" + Date.now(),
            name: name,
            username: cleanEmail.split("@")[0],
            email: cleanEmail,
            authProvider: "google",
            createdAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
            prefUnit: currentUnit || "C",
            prefTheme: document.body.classList.contains("dark") ? "dark" : "light",
            specialCities: [
                { name: "London", tag: "Home", tagEmoji: "🏠", date: "Verified" },
                { name: "Tokyo", tag: "Travel", tagEmoji: "✈️", date: "Verified" },
                { name: "New York", tag: "Work", tagEmoji: "💼", date: "Verified" }
            ]
        };
        users.push(found);
        saveUsers(users);
    } else {
        found.authProvider = "google";
        saveUsers(users);
    }

    closeGoogleChooser();
    closeAuthModal();
    setCurrentUser(found);
    showLoginSuccess(found.name);
}

// Client-Side Password Reset Flow
async function handlePasswordReset(e) {
    if (e) e.preventDefault();

    const emailEl = document.getElementById("resetEmail");
    const newPassEl = document.getElementById("resetNewPassword");

    const email = emailEl ? emailEl.value.trim().toLowerCase() : "";
    const newPass = newPassEl ? newPassEl.value.trim() : "";

    hideAuthAlert();

    if (!email) {
        showAuthAlert("Please enter your registered email address or username.", "error");
        return;
    }
    if (!newPass || newPass.length < 6) {
        showAuthAlert("New password must be at least 6 characters long.", "error");
        return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(u =>
        (u.email && u.email.toLowerCase() === email) ||
        (u.username && u.username.toLowerCase() === email) ||
        (u.name && u.name.toLowerCase() === email)
    );

    if (userIndex === -1) {
        showAuthAlert("No account registered with that email or username.", "error");
        return;
    }

    const hashedPass = await hashPassword(newPass);
    users[userIndex].passHash = hashedPass;
    delete users[userIndex].pass; // clear legacy plaintext if any
    saveUsers(users);

    setCurrentUser(users[userIndex]);
    showAuthAlert("Password updated successfully! Signing you in...", "success");

    setTimeout(() => {
        showLoginSuccess(users[userIndex].name);
    }, 600);
}

// Profile Sub-tabs Switching
function switchProfileTab(tab) {
    const tabs = ["cities", "prefs", "security"];
    tabs.forEach(t => {
        const btn = document.getElementById("profTab" + t.charAt(0).toUpperCase() + t.slice(1));
        const panel = document.getElementById("profPanel" + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle("active", t === tab);
        if (panel) {
            panel.style.display = t === tab ? (t === "prefs" || t === "security" ? "block" : "flex") : "none";
            if (t === tab) panel.classList.add("active");
            else panel.classList.remove("active");
        }
    });

    if (tab === "cities") renderSpecialCitiesInProfile();
}

// Profile Preferences Update (Unit & Theme)
function updateProfilePreferencesUI() {
    const prefUnitC = document.getElementById("prefUnitC");
    const prefUnitF = document.getElementById("prefUnitF");
    const prefThemeDark = document.getElementById("prefThemeDark");
    const prefThemeLight = document.getElementById("prefThemeLight");

    if (prefUnitC && prefUnitF) {
        prefUnitC.classList.toggle("active", currentUnit === "C");
        prefUnitF.classList.toggle("active", currentUnit === "F");
    }

    const isDark = document.body.classList.contains("dark");
    if (prefThemeDark && prefThemeLight) {
        prefThemeDark.classList.toggle("active", isDark);
        prefThemeLight.classList.toggle("active", !isDark);
    }
}

function setProfileUnit(unit) {
    if (currentUnit !== unit) {
        toggleUnit();
    }
    const user = getCurrentUser();
    if (user) {
        user.prefUnit = unit;
        setCurrentUser(user);
        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (idx !== -1) {
            users[idx].prefUnit = unit;
            saveUsers(users);
        }
    }
    updateProfilePreferencesUI();
}

function setProfileTheme(theme) {
    const isDark = document.body.classList.contains("dark");
    const wantDark = theme === "dark";
    if (isDark !== wantDark) {
        toggleTheme();
    }
    const user = getCurrentUser();
    if (user) {
        user.prefTheme = theme;
        setCurrentUser(user);
        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (idx !== -1) {
            users[idx].prefTheme = theme;
            saveUsers(users);
        }
    }
    updateProfilePreferencesUI();
}

// Edit Display Name in Profile
function updateUserProfile(e) {
    if (e) e.preventDefault();
    const editNameEl = document.getElementById("profileEditName");
    const newName = editNameEl ? editNameEl.value.trim() : "";
    if (!newName || newName.length < 2) {
        alert("Please enter a valid name (at least 2 characters).");
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    user.name = newName;
    setCurrentUser(user);

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx !== -1) {
        users[idx].name = newName;
        saveUsers(users);
    }

    const profileName = document.getElementById("profileUserName");
    if (profileName) profileName.textContent = newName;

    alert("Profile name updated successfully!");
}

// Change Password in Profile
async function changeUserPassword(e) {
    if (e) e.preventDefault();
    const currentPassEl = document.getElementById("profileCurrentPassword");
    const newPassEl = document.getElementById("profileNewPassword");

    const currentPass = currentPassEl ? currentPassEl.value.trim() : "";
    const newPass = newPassEl ? newPassEl.value.trim() : "";

    if (!currentPass || !newPass) {
        alert("Please fill in both current and new password.");
        return;
    }
    if (newPass.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    const hashedCurrent = await hashPassword(currentPass);
    const isMatch = (user.passHash && user.passHash === hashedCurrent) ||
                    (user.pass && user.pass === currentPass);

    if (!isMatch) {
        alert("Current password is incorrect.");
        return;
    }

    const hashedNew = await hashPassword(newPass);
    user.passHash = hashedNew;
    delete user.pass;
    setCurrentUser(user);

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx !== -1) {
        users[idx].passHash = hashedNew;
        delete users[idx].pass;
        saveUsers(users);
    }

    if (currentPassEl) currentPassEl.value = "";
    if (newPassEl) newPassEl.value = "";

    alert("Password updated securely!");
}

function showLoginSuccess(name) {
    const authAlert = document.getElementById("authAlert");
    if (authAlert) {
        authAlert.className = "auth-alert success";
        authAlert.style.display = "flex";
        authAlert.innerHTML = `<span>🎉</span> <span>Welcome, ${name}! You are now securely signed in.</span>`;
    }

    triggerCelebratorySparkles();
    renderSavedCities();
    updateSaveButtonState();
    updateAccountBtnUI();

    setTimeout(() => {
        closeAuthModal();
    }, 700);
}

function handleLogout() {
    setCurrentUser(null);
    closeAuthModal();
    renderSavedCities();
    updateSaveButtonState();
    updateAccountBtnUI();

    const welcomeGreeting = document.getElementById("welcomeGreeting");
    if (welcomeGreeting) {
        initWelcomeExperience();
    }
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

/* ================= 7.5 ASTRONOMICAL MOON PHASE CALCULATION ENGINE ================= */
function calculateMoonPhase(targetDate = new Date()) {
    // Reference New Moon: January 6, 2000, 18:14 UTC
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const synodicMonth = 29.53058867; // Average synodic lunar month in days
    
    const diffMs = targetDate.getTime() - knownNewMoon.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    const moonAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
    const phaseFraction = moonAge / synodicMonth;
    
    // Geometric illumination percentage (0% to 100%)
    const illumination = Math.round((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2 * 100);

    let phaseName = "";
    let simpleCategory = ""; // "No Moon", "Half Moon", "Full Moon", "Crescent Moon", "Gibbous Moon"
    let emoji = "";
    let nextPhaseText = "";
    let categoryClass = "";

    // Astronomical 8-phase breakdown with explicit Full Moon, Half Moon, and No Moon identification
    if (phaseFraction < 0.03 || phaseFraction >= 0.97) {
        phaseName = "New Moon (No Moon)";
        simpleCategory = "No Moon";
        emoji = "🌑";
        categoryClass = "cat-no-moon";
        const daysToHalf = ((0.25 - phaseFraction + 1) % 1) * synodicMonth;
        nextPhaseText = `Next: Half Moon (First Quarter) in ${Math.round(daysToHalf)} days`;
    } else if (phaseFraction < 0.22) {
        phaseName = "Waxing Crescent Moon";
        simpleCategory = "Crescent Moon";
        emoji = "🌒";
        categoryClass = "cat-crescent-moon";
        const daysToHalf = (0.25 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: Half Moon (First Quarter) in ${Math.max(1, Math.round(daysToHalf))} days`;
    } else if (phaseFraction <= 0.28) {
        phaseName = "First Quarter (Half Moon)";
        simpleCategory = "Half Moon";
        emoji = "🌓";
        categoryClass = "cat-half-moon";
        const daysToFull = (0.50 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: Full Moon in ${Math.max(1, Math.round(daysToFull))} days`;
    } else if (phaseFraction < 0.47) {
        phaseName = "Waxing Gibbous Moon";
        simpleCategory = "Gibbous Moon";
        emoji = "🌔";
        categoryClass = "cat-gibbous-moon";
        const daysToFull = (0.50 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: Full Moon in ${Math.max(1, Math.round(daysToFull))} days`;
    } else if (phaseFraction <= 0.53) {
        phaseName = "Full Moon";
        simpleCategory = "Full Moon";
        emoji = "🌕";
        categoryClass = "cat-full-moon";
        const daysToHalf = (0.75 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: Half Moon (Last Quarter) in ${Math.max(1, Math.round(daysToHalf))} days`;
    } else if (phaseFraction < 0.72) {
        phaseName = "Waning Gibbous Moon";
        simpleCategory = "Gibbous Moon";
        emoji = "🌖";
        categoryClass = "cat-gibbous-moon";
        const daysToHalf = (0.75 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: Half Moon (Last Quarter) in ${Math.max(1, Math.round(daysToHalf))} days`;
    } else if (phaseFraction <= 0.78) {
        phaseName = "Last Quarter (Half Moon)";
        simpleCategory = "Half Moon";
        emoji = "🌗";
        categoryClass = "cat-half-moon";
        const daysToNew = (1.0 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: No Moon (New Moon) in ${Math.max(1, Math.round(daysToNew))} days`;
    } else {
        phaseName = "Waning Crescent Moon";
        simpleCategory = "Crescent Moon";
        emoji = "🌘";
        categoryClass = "cat-crescent-moon";
        const daysToNew = (1.0 - phaseFraction) * synodicMonth;
        nextPhaseText = `Next: No Moon (New Moon) in ${Math.max(1, Math.round(daysToNew))} days`;
    }

    return {
        moonAge: moonAge.toFixed(1),
        phaseFraction,
        illumination,
        phaseName,
        simpleCategory,
        emoji,
        categoryClass,
        nextPhaseText,
        subtext: `${illumination}% Illumination • Moon Age: ${moonAge.toFixed(1)} / 29.5 days`
    };
}

/* ================= 8. ZERO-JITTER 3D CELESTIAL HORIZON DOME ================= */
function updateCelestialHorizonDome(daily, timezone, customProgress = null) {
    const celestialOrbiter = document.getElementById("celestialOrbiter");
    if (!celestialOrbiter || !daily || !daily.sunrise || !daily.sunset) return;

    const celestialModeIcon = document.getElementById("celestialModeIcon");
    const celestialModeName = document.getElementById("celestialModeName");
    const celestialHeading = document.getElementById("celestialHeading");
    const celestialRemainingText = document.getElementById("celestialRemainingText");
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

        // Calculate astronomical moon data
        const moonData = calculateMoonPhase(now);

        // Update Weather Moon Badge in Main Weather Card
        const weatherMoonEmoji = document.getElementById("weatherMoonEmoji");
        const weatherMoonText = document.getElementById("weatherMoonText");
        if (weatherMoonEmoji) weatherMoonEmoji.textContent = moonData.emoji;
        if (weatherMoonText) weatherMoonText.textContent = `Today's Moon: ${moonData.phaseName} (${moonData.illumination}%)`;

        // Update Observatory Lunar Telemetry Strip
        const lunarPhaseIconLarge = document.getElementById("lunarPhaseIconLarge");
        const lunarPhaseName = document.getElementById("lunarPhaseName");
        const lunarCategoryBadge = document.getElementById("lunarCategoryBadge");
        const lunarPhaseSubtext = document.getElementById("lunarPhaseSubtext");
        const lunarNextPhaseText = document.getElementById("lunarNextPhaseText");

        if (lunarPhaseIconLarge) lunarPhaseIconLarge.textContent = moonData.emoji;
        if (lunarPhaseName) lunarPhaseName.textContent = moonData.phaseName;
        if (lunarCategoryBadge) {
            lunarCategoryBadge.textContent = moonData.simpleCategory;
            lunarCategoryBadge.className = `lunar-cat-badge ${moonData.categoryClass}`;
        }
        if (lunarPhaseSubtext) lunarPhaseSubtext.textContent = moonData.subtext;
        if (lunarNextPhaseText) lunarNextPhaseText.textContent = moonData.nextPhaseText;

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
            if (celestialModeIcon) celestialModeIcon.textContent = moonData.emoji;
            if (celestialModeName) celestialModeName.textContent = `Nocturnal ${moonData.simpleCategory} Orbit (${moonData.phaseName})`;
            if (celestialHeading) celestialHeading.textContent = `${moonData.phaseName} Trajectory (${moonData.illumination}% Illum)`;
            if (celestialEmoji) celestialEmoji.textContent = moonData.emoji;
            if (celestialBody) celestialBody.className = "celestial-sphere-3d moon-sphere";
            if (celestialSvgArc) celestialSvgArc.setAttribute("stroke", "url(#domeArcGradNight)");
            if (eastGateLabel) eastGateLabel.textContent = "East (Moonrise)";
            if (westGateLabel) westGateLabel.textContent = "West (Moonset)";

            const percentText = Math.round(progress * 100);
            if (solarProgressBadge) solarProgressBadge.textContent = `${percentText}% Lunar Apex`;
            if (celestialRemainingText && customProgress === null) {
                celestialRemainingText.textContent = `${moonData.phaseName} is at ${percentText}% across nocturnal horizon`;
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

/* ================= 10. LUXURY UNIVERSE 3D COSMOS & SCROLLING ENGINE ================= */
function createStarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Radiant starlight core with gentle astronomical glow halo
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.18, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.40, "rgba(255, 255, 255, 0.50)");
    grad.addColorStop(0.70, "rgba(255, 255, 255, 0.15)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function initHighImpactThreeJS() {
    try {
        const canvas = document.getElementById("threeCanvas");
        if (!canvas || typeof THREE === "undefined") return;

        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        threeCamera.position.set(0, 0, 40);

        threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
        threeRenderer.setSize(window.innerWidth, window.innerHeight);
        threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const isDark = document.body.classList.contains("dark");
        const starTexture = createStarTexture();

        // 1. DEEP UNIVERSE MULTI-DEPTH STARFIELD (1,200 stars along Z axis: -260 to +60)
        const starCount = 1200;
        const starGeo = new THREE.BufferGeometry();
        starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 160;
            starPositions[i + 1] = (Math.random() - 0.5) * 140;
            starPositions[i + 2] = -240 + Math.random() * 300;

            if (isDark) {
                // VIBRANT ASTRONOMICAL DEEP COSMOS SPECTRUM
                const pick = Math.random();
                if (pick < 0.28) {
                    // Sirius Brilliant Diamond Cyan
                    starColors[i] = 0.20; starColors[i + 1] = 0.88; starColors[i + 2] = 1.00;
                } else if (pick < 0.50) {
                    // Betelgeuse & Capella Radiant Solar Amber / Gold
                    starColors[i] = 1.00; starColors[i + 1] = 0.82; starColors[i + 2] = 0.32;
                } else if (pick < 0.70) {
                    // Pleiades Cosmic Amethyst & Violet Starlight
                    starColors[i] = 0.80; starColors[i + 1] = 0.48; starColors[i + 2] = 1.00;
                } else if (pick < 0.85) {
                    // Rigel Deep Sapphire Starlight
                    starColors[i] = 0.40; starColors[i + 1] = 0.65; starColors[i + 2] = 1.00;
                } else if (pick < 0.93) {
                    // Aurora Emerald Stardust
                    starColors[i] = 0.35; starColors[i + 1] = 0.96; starColors[i + 2] = 0.78;
                } else {
                    // Vega Pure Diamond White
                    starColors[i] = 1.00; starColors[i + 1] = 1.00; starColors[i + 2] = 1.00;
                }
            } else {
                // RADIANT CELESTIAL DAYTIME SUNLIGHT DUST & GLINTS
                const pick = Math.random();
                if (pick < 0.32) {
                    // Radiant Solar Gold Sunbeam
                    starColors[i] = 1.00; starColors[i + 1] = 0.78; starColors[i + 2] = 0.20;
                } else if (pick < 0.58) {
                    // Crystalline Sky Azure / Glint Cyan
                    starColors[i] = 0.15; starColors[i + 1] = 0.72; starColors[i + 2] = 1.00;
                } else if (pick < 0.78) {
                    // Warm Champagne Pearl
                    starColors[i] = 1.00; starColors[i + 1] = 0.92; starColors[i + 2] = 0.60;
                } else if (pick < 0.90) {
                    // Sunrise Coral Sparkle
                    starColors[i] = 1.00; starColors[i + 1] = 0.55; starColors[i + 2] = 0.38;
                } else {
                    // Pure Crystal Stardust
                    starColors[i] = 1.00; starColors[i + 1] = 1.00; starColors[i + 2] = 1.00;
                }
            }
        }

        starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: isDark ? 2.8 : 2.4,
            map: starTexture,
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 0.92 : 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        cosmicStarfield = new THREE.Points(starGeo, starMat);
        threeScene.add(cosmicStarfield);

        // 2. COSMIC NEBULA DUST (360 ethereal floating particles)
        const nebulaCount = 360;
        const nebulaGeo = new THREE.BufferGeometry();
        const nebulaPos = new Float32Array(nebulaCount * 3);
        const nebulaColors = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount * 3; i += 3) {
            nebulaPos[i] = (Math.random() - 0.5) * 110;
            nebulaPos[i + 1] = (Math.random() - 0.5) * 90;
            nebulaPos[i + 2] = -180 + Math.random() * 200;

            if (isDark) {
                const pick = Math.random();
                if (pick < 0.45) {
                    // Deep cosmic violet
                    nebulaColors[i] = 0.55; nebulaColors[i + 1] = 0.28; nebulaColors[i + 2] = 0.95;
                } else if (pick < 0.80) {
                    // Luminous cyan nebula
                    nebulaColors[i] = 0.15; nebulaColors[i + 1] = 0.75; nebulaColors[i + 2] = 0.95;
                } else {
                    // Starlight magenta
                    nebulaColors[i] = 0.85; nebulaColors[i + 1] = 0.30; nebulaColors[i + 2] = 0.75;
                }
            } else {
                const pick = Math.random();
                if (pick < 0.5) {
                    nebulaColors[i] = 0.98; nebulaColors[i + 1] = 0.85; nebulaColors[i + 2] = 0.50; // soft daylight gold dust
                } else {
                    nebulaColors[i] = 0.40; nebulaColors[i + 1] = 0.80; nebulaColors[i + 2] = 1.00; // soft morning azure
                }
            }
        }

        nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nebulaPos, 3));
        nebulaGeo.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));

        const nebulaMat = new THREE.PointsMaterial({
            size: isDark ? 5.8 : 4.2,
            map: starTexture,
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 0.42 : 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        cosmicNebula = new THREE.Points(nebulaGeo, nebulaMat);
        threeScene.add(cosmicNebula);

        // 3. 3D CELESTIAL MOON SPHERE (Realistic Lunar Orb in Space)
        cosmicMoonGroup = new THREE.Group();
        cosmicMoonGroup.position.set(24, 13, -26);

        const moonGeo = new THREE.SphereGeometry(6.2, 36, 36);
        const moonMat = new THREE.MeshLambertMaterial({
            color: isDark ? 0xe2e8f0 : 0xf8fafc,
            transparent: true,
            opacity: isDark ? 0.95 : 0.85
        });
        cosmicMoonMesh = new THREE.Mesh(moonGeo, moonMat);
        cosmicMoonGroup.add(cosmicMoonMesh);

        // Ambient cosmic illumination
        const ambientCosmic = new THREE.AmbientLight(isDark ? 0x1e293b : 0xe2e8f0, isDark ? 0.6 : 0.9);
        threeScene.add(ambientCosmic);

        // Directional lunar sunlight matching phase
        cosmicSunLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.6 : 1.2);
        const currentMoon = calculateMoonPhase(new Date());
        const lightAngle = currentMoon.phaseFraction * Math.PI * 2;
        cosmicSunLight.position.set(Math.cos(lightAngle) * 35, 10, Math.sin(lightAngle) * 35);
        threeScene.add(cosmicSunLight);

        threeScene.add(cosmicMoonGroup);

        // Subtle mouse parallax
        window.addEventListener("mousemove", (e) => {
            const normX = (e.clientX / window.innerWidth) * 2 - 1;
            const normY = -(e.clientY / window.innerHeight) * 2 + 1;
            targetCameraX = normX * 2.0;
            targetCameraY = normY * 1.5;
        }, { passive: true });

        window.addEventListener("resize", () => {
            if (!threeCamera || !threeRenderer) return;
            threeCamera.aspect = window.innerWidth / window.innerHeight;
            threeCamera.updateProjectionMatrix();
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        let universeClock = 0;
        function animate() {
            requestAnimationFrame(animate);
            universeClock += 0.008;

            // Gentle axial lunar rotation
            if (cosmicMoonMesh) {
                cosmicMoonMesh.rotation.y += 0.0012;
            }

            // Gentle galactic drift & subtle starlight twinkle pulse
            if (cosmicStarfield) {
                cosmicStarfield.rotation.y = universeClock * 0.015;
                cosmicStarfield.rotation.x = Math.sin(universeClock * 0.25) * 0.012;
            }

            // Ethereal nebula breathing
            if (cosmicNebula) {
                cosmicNebula.rotation.y = -universeClock * 0.01;
                cosmicNebula.rotation.z = Math.sin(universeClock * 0.5) * 0.02;
            }

            // UNIVERSE SCROLLING VOYAGE ENGINE:
            // High-damping smooth camera navigation forward through stellar space as user scrolls
            if (threeCamera) {
                const targetZ = 40 - scrollCameraZ;
                threeCamera.position.z += (targetZ - threeCamera.position.z) * 0.05;
                threeCamera.position.y += ((targetCameraY + scrollCameraY) - threeCamera.position.y) * 0.05;
                threeCamera.position.x += (targetCameraX - threeCamera.position.x) * 0.05;
                threeCamera.lookAt(0, scrollCameraY * 0.4, -40);
            }

            threeRenderer.render(threeScene, threeCamera);
        }

        animate();
    } catch (err) {
        console.warn("Universe 3D background notice:", err);
    }
}

function updateThreeJSPalette() {
    if (!threeScene) return;
    const isDark = document.body.classList.contains("dark");

    if (cosmicStarfield && cosmicStarfield.geometry) {
        const colors = cosmicStarfield.geometry.attributes.color.array;
        const count = colors.length / 3;

        for (let i = 0; i < count * 3; i += 3) {
            if (isDark) {
                const pick = Math.random();
                if (pick < 0.28) {
                    colors[i] = 0.20; colors[i + 1] = 0.88; colors[i + 2] = 1.00;
                } else if (pick < 0.50) {
                    colors[i] = 1.00; colors[i + 1] = 0.82; colors[i + 2] = 0.32;
                } else if (pick < 0.70) {
                    colors[i] = 0.80; colors[i + 1] = 0.48; colors[i + 2] = 1.00;
                } else if (pick < 0.85) {
                    colors[i] = 0.40; colors[i + 1] = 0.65; colors[i + 2] = 1.00;
                } else if (pick < 0.93) {
                    colors[i] = 0.35; colors[i + 1] = 0.96; colors[i + 2] = 0.78;
                } else {
                    colors[i] = 1.00; colors[i + 1] = 1.00; colors[i + 2] = 1.00;
                }
            } else {
                const pick = Math.random();
                if (pick < 0.32) {
                    colors[i] = 1.00; colors[i + 1] = 0.78; colors[i + 2] = 0.20;
                } else if (pick < 0.58) {
                    colors[i] = 0.15; colors[i + 1] = 0.72; colors[i + 2] = 1.00;
                } else if (pick < 0.78) {
                    colors[i] = 1.00; colors[i + 1] = 0.92; colors[i + 2] = 0.60;
                } else if (pick < 0.90) {
                    colors[i] = 1.00; colors[i + 1] = 0.55; colors[i + 2] = 0.38;
                } else {
                    colors[i] = 1.00; colors[i + 1] = 1.00; colors[i + 2] = 1.00;
                }
            }
        }
        cosmicStarfield.geometry.attributes.color.needsUpdate = true;
        if (cosmicStarfield.material) {
            cosmicStarfield.material.size = isDark ? 2.8 : 2.4;
            cosmicStarfield.material.opacity = isDark ? 0.92 : 0.55;
            cosmicStarfield.material.blending = THREE.AdditiveBlending;
            cosmicStarfield.material.depthWrite = false;
        }
    }

    if (cosmicNebula && cosmicNebula.material) {
        cosmicNebula.material.size = isDark ? 5.8 : 4.2;
        cosmicNebula.material.opacity = isDark ? 0.42 : 0.22;
        cosmicNebula.material.depthWrite = false;
    }

    if (cosmicMoonMesh && cosmicMoonMesh.material) {
        cosmicMoonMesh.material.color.setHex(isDark ? 0xe2e8f0 : 0xf8fafc);
    }
}

/* ================= 10.1 REFINED MICRO-TILT ENGINE (SUBTLE & ZERO JITTER) ================= */
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

            const xPct = (mouseX / rect.width - 0.5) * 2;
            const yPct = (mouseY / rect.height - 0.5) * 2;

            // Very subtle micro-tilt (max 1.6 degrees)
            const maxTilt = 1.6;
            const tiltX = -yPct * maxTilt;
            const tiltY = xPct * maxTilt;

            card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px)`;

            const glare = card.querySelector(".card-glare");
            if (glare) {
                glare.style.opacity = "0.7";
                glare.style.background = `radial-gradient(circle at ${(mouseX / rect.width * 100).toFixed(1)}% ${(mouseY / rect.height * 100).toFixed(1)}%, rgba(255, 255, 255, 0.16) 0%, transparent 60%)`;
            }
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
            const glare = card.querySelector(".card-glare");
            if (glare) {
                glare.style.opacity = "0";
            }
            rect = null;
        });
    });
}

/* ================= 10.2 SCROLL DYNAMICS & REVEAL ENGINE ================= */
function initScrollDynamics() {
    const progressBar = document.getElementById("scrollProgressBar");
    const header = document.querySelector(".header");

    const onScroll = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, scrollPct))}%`;
        }

        if (header) {
            if (scrollTop > 24) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }

        // Universe-travel depth flight on scroll (camera traverses forward through deep space)
        const scrollFrac = docHeight > 0 ? (scrollTop / docHeight) : 0;
        scrollCameraZ = scrollFrac * 110;
        scrollCameraY = -scrollTop * 0.012;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Intersection Observer for silky scroll reveals
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px -30px 0px"
        });

        document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
    } else {
        document.querySelectorAll(".scroll-reveal").forEach(el => el.classList.add("revealed"));
    }
}

/* ================= 10.5 EXTREME & ANTIQUE WEATHER TELEMETRY SYSTEM ================= */
const EXTREME_AND_ANTIQUE_DATA = {
    lowest_temp: {
        id: "lowest_temp",
        name: "Lowest Temperature on Planet Earth (Polar Cryosphere)",
        icon: "❄️",
        categoryBadge: "Global Coldest Record",
        keywords: ["lowest temp", "lowest temperature", "lowest", "coldest", "min temp", "minimum temp", "coldest city", "coldest place", "coldest country", "freezing record", "extreme cold", "sub zero"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Oymyakon, Sakha, Russia",
                shortName: "Oymyakon (-71.2°C)",
                lat: 63.4641,
                lon: 142.7737,
                record: "-71.2°C (-96.2°F)",
                alertLevel: "POLAR HYPOTHERMIA & INSTANT CRYO-HAZARD",
                alertHeading: "Extreme Sub-Zero Frostbite Advisory",
                alertDesc: "Exposed human flesh freezes in under 90 to 120 seconds. Metallic objects are hazardous to touch. Eyelashes freeze instantly upon blinking.",
                antiqueTitle: "\"The Whisper of the Stars\" & 10,000-Year Permafrost",
                antiqueDate: "Recorded Feb 6, 1933",
                antiqueStory: "In sub -60°C conditions, human breath freezes instantly mid-air, creating microscopic falling ice needles that collide with a distinct rustling chime locals call 'the whisper of the stars'. The ground beneath has remained frozen permafrost since the last Ice Age.",
                mechanism: "Siberian High Pressure Ring & Intermontane Basin Thermal Inversion",
                classification: "Hyperborean Continental Cryosphere"
            },
            {
                city: "Yakutsk, Sakha Republic, Russia",
                shortName: "Yakutsk (-64.4°C)",
                lat: 62.0355,
                lon: 129.6755,
                record: "-64.4°C (-83.9°F)",
                alertLevel: "CONTINUOUS URBAN PERMAFROST ADVISORY",
                alertHeading: "Deep Winter Ice Fog Warning",
                alertDesc: "Coldest major city on Earth. Car engines must run 24 hours a day to prevent motor oil crystallization; buildings rest on 6-meter concrete stilts above shifting permafrost.",
                antiqueTitle: "Subterranean Mammoth Ice Vaults",
                antiqueDate: "Settled in 1632",
                antiqueStory: "Subterranean permafrost tunnels beneath Yakutsk stay naturally frozen at -10°C year-round, preserving prehistoric Woolly Mammoth carcasses and ancient biological fossils intact from the Pleistocene epoch.",
                mechanism: "Subpolar Continental High with Lena River Basin Inversion",
                classification: "Continuous Urban Permafrost Metropolis"
            },
            {
                city: "Vostok Station, Antarctica",
                shortName: "Vostok Station (-89.2°C)",
                lat: -78.4642,
                lon: 106.8373,
                record: "-89.2°C (-128.6°F) Absolute Earth Record",
                alertLevel: "PLANETARY SURFACE MINIMUM WARNING",
                alertHeading: "Absolute Terrestrial Cold Warning",
                alertDesc: "Coldest temperature ever measured on Earth's surface by meteorological instruments. Breathing without thermal pre-heaters causes acute lung hemorrhaging.",
                antiqueTitle: "Subglacial Lake Vostok (Sealed for 15 Million Years)",
                antiqueDate: "Ground Record July 21, 1983",
                antiqueStory: "Beneath 4 kilometers of ice under Vostok Station lies a massive liquid freshwater lake sealed away from Earth's atmosphere for over 15 million years, harboring isolated primordial microbes.",
                mechanism: "3,488m Polar Ice Plateau Elevation & Katabatic Solar Deficit",
                classification: "Antarctic Polar Plateau Interior"
            },
            {
                city: "Eureka, Nunavut, Canada",
                shortName: "Eureka (-55.3°C)",
                lat: 79.9889,
                lon: -85.9408,
                record: "-55.3°C (-67.5°F)",
                alertLevel: "HIGH ARCTIC POLAR NIGHT ADVISORY",
                alertHeading: "Zero-Sunlight Deep Freeze Warning",
                alertDesc: "Northernmost inhabited research settlement in North America, experiencing complete perpetual darkness from October to late February each year.",
                antiqueTitle: "Antique High Arctic Mummified Forests",
                antiqueDate: "Settlement Established 1947",
                antiqueStory: "Despite current brutal polar cold, Ellesmere Island houses ancient mummified redwood and dawn redwood forests from 50 million years ago when the Arctic was a warm subtropical swamp.",
                mechanism: "Circumpolar Vortex & Slanted High-Latitude Insolation",
                classification: "High Arctic Tundra Research Post"
            }
        ]
    },

    highest_temp: {
        id: "highest_temp",
        name: "Highest Temperature on Planet Earth (Thermal Furnace)",
        icon: "🔥",
        categoryBadge: "Global Maximum Heat Record",
        keywords: ["highest temp", "highest temperature", "highest", "hottest", "max temp", "maximum temp", "hottest city", "hottest place", "hottest country", "heat record", "extreme heat", "death valley"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Death Valley, California, USA",
                shortName: "Death Valley (+56.7°C)",
                lat: 36.4614,
                lon: -116.8656,
                record: "56.7°C (134°F) / Ground 93.9°C (201°F)",
                alertLevel: "DANGEROUS HYPERTHERMIA & THERMAL RADIATION ALERT",
                alertHeading: "Extreme Atmospheric Furnace & Dehydration Warning",
                alertDesc: "Highest officially recognized ambient air temperature in history. Ground surface reaches 93.9°C (201°F); severe dehydration occurs in under an hour without shade and water.",
                antiqueTitle: "The Mystery of the Sailing Stones (Racetrack Playa)",
                antiqueDate: "World Record July 10, 1913",
                antiqueStory: "Ancient dolomite boulders weighing up to 700 lbs glide across the dry playa floor leaving long serpentine trails. Scientists discovered this is propelled by ultra-rare micro-ice sheets and desert gales on freezing winter nights.",
                mechanism: "Sub-Sea-Level Topographic Basin Trapping & Adiabatic Compression",
                classification: "Hyper-Arid Sub-Sea-Level Grabens"
            },
            {
                city: "Kuwait City, Kuwait",
                shortName: "Kuwait City (+53.5°C)",
                lat: 29.3759,
                lon: 47.9774,
                record: "53.5°C (128.3°F)",
                alertLevel: "SEVERE URBAN HEAT DOME ALERT",
                alertHeading: "Metropolitan Super-Heat Warning",
                alertDesc: "Hottest capital city on planet Earth. Traffic lights melt under concentrated sunlight, and outdoor labor is legally suspended during summer afternoons.",
                antiqueTitle: "Antique Arabian Gulf Windcatchers (Barjeel)",
                antiqueDate: "Recorded 2016 / 2021",
                antiqueStory: "For centuries before electricity, traditional Kuwaiti architects engineered antique windcatchers (barjeel) that funneled ambient desert breeze through courtyard fountains to naturally cool palatial quarters.",
                mechanism: "Subtropical High Pressure Ridge & Arabian Desert Shammal Winds",
                classification: "Hyper-Thermal Coastal Desert Metropolis"
            },
            {
                city: "Dallol, Danakil Depression, Ethiopia",
                shortName: "Dallol (+48°C Mean)",
                lat: 14.2417,
                lon: 40.2989,
                record: "Highest Year-Round Average Temperature on Earth",
                alertLevel: "GEOTHERMAL ACID & SULPHUR VOLCANIC ALERT",
                alertHeading: "Alien Toxic Hydrothermal Environment Warning",
                alertDesc: "The lowest subaerial volcano on Earth (-130 meters below sea level). Searing ambient heat is combined with boiling acidic brine pools.",
                antiqueTitle: "Antique Neon Hydrothermal Springs & Ancient Salt Caravans",
                antiqueDate: "Recorded 1960–1966",
                antiqueStory: "Dallol features surreal neon green, yellow, and orange acid terraces formed by subterranean magma heating super-saline groundwater. Afar salt miners still harvest salt slabs using antique camel caravans.",
                mechanism: "Triple Plate Tectonic Rift & Geothermal Magma Uplift",
                classification: "Extraterrestrial-Analog Hydrothermal Crater"
            },
            {
                city: "Ahvaz, Khuzestan, Iran",
                shortName: "Ahvaz (+54.0°C)",
                lat: 31.3183,
                lon: 48.6706,
                record: "54.0°C (129.2°F)",
                alertLevel: "EXTREME HEAT & DUST SQUALL ADVISORY",
                alertHeading: "Khuzestan Thermal Inversion Warning",
                alertDesc: "Suffocating heat dome combined with heavy particulate dust. Temperatures consistently hover above 50°C for weeks in midsummer.",
                antiqueTitle: "Antique 2,500-Year Shushtar Hydraulic Water Works",
                antiqueDate: "Recorded June 29, 2017",
                antiqueStory: "Ahvaz lies along the ancient Karun River basin, proximate to the 2,500-year-old Shushtar Historical Hydraulic System—a UNESCO masterpiece of antique milling and water diversion.",
                mechanism: "Zagros Mountain Leeward Compressional Heating",
                classification: "Continental Arid Lowland River Basin"
            }
        ]
    },

    rain: {
        id: "rain",
        name: "World Rain Record Capital (Extreme Monsoon & Torrential Deluge)",
        icon: "🌧️",
        categoryBadge: "World Rainfall Capital",
        keywords: ["rain", "rainy", "raining", "rainfall", "wettest", "most rain", "heavy rain", "monsoon", "downpour", "extreme rain", "mawsynram", "cherrapunji"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Mawsynram, Meghalaya, India",
                shortName: "Mawsynram (11,872mm/yr)",
                lat: 25.2975,
                lon: 91.5826,
                record: "11,872 mm (467.4 inches) Annual Rainfall",
                alertLevel: "TORRENTIAL CLOUDBURST & LANDSLIP ADVISORY",
                alertHeading: "Extreme Monsoon Precipitation Warning",
                alertDesc: "Guinness World Record for the wettest place on Earth. In 1985, Mawsynram received 26,000 mm of rain—enough to submerge a two-story building.",
                antiqueTitle: "500-Year-Old Living Root Bridges (Jingkieng Jri)",
                antiqueDate: "Annual Guinness Record",
                antiqueStory: "To cross torrential monsoon rivers that rotted wooden planks and rusted iron chains, indigenous Khasi elders guided the aerial roots of Ficus elastica trees across canyons for over 500 years, growing living bridges that become stronger with age.",
                mechanism: "Bay of Bengal Monsoon Funneling into Khasi Gorge Orographic Lift",
                classification: "Subtropical Highland Extreme Monsoonal Apex"
            },
            {
                city: "Cherrapunji (Sohra), Meghalaya, India",
                shortName: "Cherrapunji (Twin Rain Capital)",
                lat: 25.2702,
                lon: 91.7323,
                record: "Holds World 48-Hour Rainfall Record (2,493 mm)",
                alertLevel: "FLASH FLOOD & MIST OVERFLOW ADVISORY",
                alertHeading: "Catastrophic Rainfall Inundation Warning",
                alertDesc: "Holds world records for the most rain in a single calendar month (9,300 mm) and single year (26,470 mm in 1860-1861).",
                antiqueTitle: "The Seven Sisters Waterfalls & Antique Khasi Monoliths",
                antiqueDate: "Historical Records since 1851",
                antiqueStory: "Perched 1,400 meters high, Cherrapunji's precipice overlooks the plains of Bangladesh. Antique standing megaliths erected centuries ago commemorate tribal ancestors along misty waterfalls.",
                mechanism: "Double Monsoonal Air Mass Squeeze against Southern Plateau Cliffs",
                classification: "Orographic Wet Valley Precipice"
            },
            {
                city: "Tutunendo, Chocó, Colombia",
                shortName: "Tutunendo (300 Rain Days)",
                lat: 5.7500,
                lon: -76.5333,
                record: "11,770 mm (463.4 inches) / Rain 300+ Days/Year",
                alertLevel: "PERPETUAL EQUATORIAL RAIN ADVISORY",
                alertHeading: "Continuous Tropical Cloudburst Alert",
                alertDesc: "One of the rainiest rainforest settlements on Earth. It experiences rain nearly every single day, with two distinct daily torrential peaks.",
                antiqueTitle: "Antique Chocó Gold Rivers & Bio-Diverse Rainforest Canopies",
                antiqueDate: "Continuous Meteorological Log",
                antiqueStory: "Tutunendo's rivers have yielded alluvial gold for pre-Columbian indigenous tribes for thousands of years. The permanent rain fosters the highest plant diversity on planet Earth.",
                mechanism: "Pacific Intertropical Convergence Zone (ITCZ) Moisture Lock",
                classification: "Equatorial Rainforest Lowland Inundation"
            },
            {
                city: "Mount Waiʻaleʻale, Kauai, Hawaii",
                shortName: "Mt. Waiʻaleʻale (11,430mm)",
                lat: 22.0700,
                lon: -159.5000,
                record: "11,430 mm (450 inches) / 335 Rain Days/Year",
                alertLevel: "ALPINE RAIN CLOUD SHIELD WARNING",
                alertHeading: "Perpetual Cloud Cap Orographic Warning",
                alertDesc: "Waiʻaleʻale means 'rippling water' in Hawaiian. The 1,569-meter volcanic summit is perpetually enveloped in dense cumulus rain clouds.",
                antiqueTitle: "Ancient Hawaiian Mountain Heiau (Sacred Shrines)",
                antiqueDate: "Recorded 1912 to Present",
                antiqueStory: "Ancient Native Hawaiians built high-elevation stone Heiau (shrines) near the caldera to honor Kāne, god of water and rain, hiking through sheer cliffs where 80 cascades drop into the Blue Room.",
                mechanism: "Northeast Trade Winds Striking 1,500m Sheer Shield Caldera",
                classification: "Shield Volcano Orographic Cloud Core"
            }
        ]
    },

    snow: {
        id: "snow",
        name: "World Snowfall Capital (Extreme Snow Accumulation & Ice)",
        icon: "🌨️",
        categoryBadge: "World Snowfall Capital",
        keywords: ["snow", "snowy", "snowing", "snowfall", "snowiest", "most snow", "heavy snow", "blizzard", "snow record", "extreme snow", "aomori", "sapporo"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Aomori City, Tōhoku, Japan",
                shortName: "Aomori (8-Meter Snow Walls)",
                lat: 40.8244,
                lon: 140.7400,
                record: "7.9 to 8.2 Meters (26 to 28 Feet) Annual Snowfall",
                alertLevel: "MASSIVE BLIZZARD & SNOW DRIFT WARNING",
                alertHeading: "Giant Snow Wall & Ocean Blizzard Advisory",
                alertDesc: "Officially the snowiest major city in the world. Colossal 20-meter (65-foot) snow walls line the Hakkoda Pass road, cleared daily by rotary snowplows.",
                antiqueTitle: "The Antique 'Snow Monsters' (Juhyo) of Hakkōda",
                antiqueDate: "Winter Meteorological Log",
                antiqueStory: "Sub-zero sea winds supercool moisture droplets as they slam into ancient Maries' fir trees on Mount Hakkōda, coating them layer upon layer into giant frozen ice creatures known since samurai times as 'Juhyo' (Snow Monsters).",
                mechanism: "Sea-Effect Snow: Freezing Siberian Winds Absorbing Sea of Japan Vapor",
                classification: "Coastal Mountainous Maritime Blizzard Convergence"
            },
            {
                city: "Sapporo, Hokkaido, Japan",
                shortName: "Sapporo (6-Meter Snow)",
                lat: 43.0618,
                lon: 141.3545,
                record: "5.97 Meters (20 Feet) Snowfall in a 2M Pop. Metropolis",
                alertLevel: "URBAN HEAVY SNOWFALL ADVISORY",
                alertHeading: "Metropolitan Whiteout & Sub-Zero Freeze Alert",
                alertDesc: "The only major metropolis of 2 million people on Earth operating smoothly with over 600 cm of annual snow, utilizing heated sidewalks and underground highway tunnels.",
                antiqueTitle: "Sapporo Historic Snow Festival & Antique Ainu Snow Lore",
                antiqueDate: "Snow Festival Founded 1950",
                antiqueStory: "Originated when high school students carved six ice statues in Odori Park in 1950, now evolving into towering 15-meter palace replicas celebrated alongside centuries of indigenous Ainu winter traditions.",
                mechanism: "Ishikari Bay Sea-Effect Convergence Stream",
                classification: "High-Latitude Coastal Megalopolis"
            },
            {
                city: "Valdez, Alaska, USA",
                shortName: "Valdez (8.3m Snowfall)",
                lat: 61.1308,
                lon: -146.3483,
                record: "8.26 Meters (325 Inches) Annual Snowfall",
                alertLevel: "GULF OF ALASKA AVALANCHE ADVISORY",
                alertHeading: "Extreme Coastal Maritime Snow Warning",
                alertDesc: "Snowiest sea-level town in North America. Thompson Pass holds the Alaskan single-season record of 24.75 meters (81.2 feet!) of snow.",
                antiqueTitle: "Antique 1898 Klondike Gold Trail & Thompson Glacier",
                antiqueDate: "Established 1898",
                antiqueStory: "During the 1898 Klondike Gold Rush, gold stampeders attempted the hazardous Valdez Glacier route in brutal blizzards, carving staircase steps directly into sheer ice walls.",
                mechanism: "Aleutian Low Systems Crashing into the Chugach Mountain Range",
                classification: "Subarctic Fjord-Mountain Barrier"
            },
            {
                city: "Mount Washington, New Hampshire, USA",
                shortName: "Mt Washington (Extreme Rime)",
                lat: 44.2706,
                lon: -71.3033,
                record: "7.14 Meters Snowfall + Rime Ice Feathers",
                alertLevel: "HIGH-ALTITUDE HURRICANE BLIZZARD WARNING",
                alertHeading: "Extreme Wind-Driven Blizzard Advisory",
                alertDesc: "Known as 'Home of the World's Worst Weather'. Temperatures plunge to -44°C (-47°F) with hurricane-force blizzard gusts causing windchills of -78°C (-108°F).",
                antiqueTitle: "Antique 1932 Mountain Observatory & Feather Rime",
                antiqueDate: "Observatory Built 1932",
                antiqueStory: "Perpetual cloud immersion and supersonic gale winds grow bizarre horizontal rime ice 'feathers' up to 6 feet long pointing directly into the oncoming wind.",
                mechanism: "Convergence of 3 Major Continental Storm Tracks (Atlantic, Gulf, Pacific)",
                classification: "Alpine Summit High-Velocity Cryo-Core"
            }
        ]
    },

    wind: {
        id: "wind",
        name: "World Wind Record Capital (Extreme Velocity & Jetstream Force)",
        icon: "💨",
        categoryBadge: "World Windiest Capital",
        keywords: ["wind", "windy", "windiest", "highest wind", "stormy wind", "gale", "cyclone", "hurricane", "wind record", "extreme wind", "wellington"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Wellington, Greater Wellington, New Zealand",
                shortName: "Wellington (Gale City)",
                lat: -41.2865,
                lon: 174.7762,
                record: "Winds Exceed Gale Force (63+ km/h) Over 173 Days/Year",
                alertLevel: "SEVERE GALE FORCE & WIND TUNNEL ADVISORY",
                alertHeading: "Cook Strait Aerodynamic Funnel Warning",
                alertDesc: "Known worldwide as 'Windy Welly', situated in the Cook Strait wind funnel. Gusts regularly exceed 140 km/h (87 mph), testing building aerodynamics and flight arrivals.",
                antiqueTitle: "The Roaring Forties & Historic Tall Ship Navigators",
                antiqueDate: "Recorded Since 1840",
                antiqueStory: "Wellington lies squarely in the 40th parallel south (the Roaring Forties), where 18th-century clipper ships ran before howling uninterrupted circumpolar winds on their antique voyages around the globe.",
                mechanism: "Venturi Aerodynamic Squeeze Between North & South Islands",
                classification: "Maritime Chokepoint Wind Jet"
            },
            {
                city: "Commonwealth Bay, George V Coast, Antarctica",
                shortName: "Commonwealth Bay (320km/h)",
                lat: -67.0000,
                lon: 142.6667,
                record: "Average Annual Wind 80 km/h (50 mph) / Gusts to 320 km/h (200 mph)",
                alertLevel: "SUPER-KATABATIC POLAR GALE ALERT",
                alertHeading: "Guinness Record Windiest Place on Earth",
                alertDesc: "Listed in Guinness Book of Records and National Geographic Atlas as the windiest place on planet Earth due to relentless cold air avalanching down polar ice sheets.",
                antiqueTitle: "Sir Douglas Mawson’s 1912 'Home of the Blizzard' Expedition",
                antiqueDate: "Expedition 1911–1914",
                antiqueStory: "Australian explorer Sir Douglas Mawson based his team in wooden huts here in 1912. The gale was so relentless that men had to lean into the wind at 45-degree angles wearing antique crampons just to avoid being blown out to sea.",
                mechanism: "Dense Katabatic Gravitational Drainage from Antarctic Polar Plateau",
                classification: "Coastal Polar Super-Katabatic Fall-Wind"
            },
            {
                city: "Mount Washington Observatory, USA",
                shortName: "Mt Washington (372 km/h Record)",
                lat: 44.2706,
                lon: -71.3033,
                record: "372 km/h (231 mph) Historic Surface Wind Record",
                alertLevel: "SUPER-VELOCITY TROPOSPHERIC GALE ALERT",
                alertHeading: "Extreme Atmospheric Jet Stream Blast",
                alertDesc: "Held the world record for highest wind speed ever directly measured on Earth's surface from 1934 until 1996.",
                antiqueTitle: "The Historic Great Gale of April 12, 1934",
                antiqueDate: "April 12, 1934 Record",
                antiqueStory: "Meteorologists Salvatore Pagliuca and Wendell Poole used heated anemometers to record the historic 231 mph gust. The building had to be bolted directly into the bedrock with massive railroad ties.",
                mechanism: "Bernoulli Effect Compressing Jet Stream Over Presidential Range",
                classification: "Orographic Tropospheric Venturi Funnel"
            },
            {
                city: "Cape Blanco, Oregon, USA",
                shortName: "Cape Blanco (Ocean Gale)",
                lat: 42.8364,
                lon: -124.5658,
                record: "Frequent Winter Pacific Gusts Over 160 km/h (100 mph)",
                alertLevel: "PACIFIC MARITIME STORM SURGE WARNING",
                alertHeading: "Northwest Headland Hurricane Force Gale",
                alertDesc: "Westernmost point of Oregon, jutting out 1.5 miles into the open Pacific. Winter bomb-cyclone gales cause stunted spruce trees to grow sideways.",
                antiqueTitle: "Antique 1870 Cape Blanco Lighthouse",
                antiqueDate: "Lit in 1870",
                antiqueStory: "Oregon's oldest standing lighthouse has survived 150+ years of violent ocean gales. Keepers historically reported sea spume and gravel crashing against the lantern room 250 feet above sea level.",
                mechanism: "Pacific Mid-Latitude Cyclonic Fetch Striking Rocky Headland",
                classification: "Pacific Maritime Coastal Promontory"
            }
        ]
    },

    alert: {
        id: "alert",
        name: "Antique Atmospheric Wonders & Special Severe Phenomena",
        icon: "⚡",
        categoryBadge: "Rare Antique Curiosities",
        keywords: ["alert", "alerts", "special", "antique", "antique things", "special happening", "special weather", "wonder", "phenomenon", "phenomena", "rare weather", "miracle", "catatumbo", "aurora", "blood rain", "morning glory", "sailing stones"],
        defaultIndex: 0,
        contenders: [
            {
                city: "Lake Maracaibo (Catatumbo Lightning), Venezuela",
                shortName: "Catatumbo (Everlasting Lightning)",
                lat: 9.3400,
                lon: -71.6000,
                record: "1.2 Million Lightning Strikes/Year (28 Strikes/Minute)",
                alertLevel: "HIGH-VOLTAGE ATMOSPHERIC ELECTRICAL HAZARD",
                alertHeading: "Relámpago del Catatumbo Flash Warning",
                alertDesc: "Guinness Record: The lightning capital of the globe. Generates continuous silent electrical storms up to 260 nights a year, acting as Earth's largest single generator of tropospheric ozone.",
                antiqueTitle: "The 16th-Century 'Antique Beacon of Maracaibo'",
                antiqueDate: "Recorded 1595 by Sir Francis Drake",
                antiqueStory: "Used by 16th-century Spanish colonial caravels as a natural lighthouse visible 400 km away. In 1595, the mysterious lightning illuminated Sir Francis Drake’s surprise fleet, foiling his attack on the city.",
                mechanism: "Swamp Methane Updrafts + Caribbean Sea Breeze Trapped in Andean Horseshoe",
                classification: "Perpetual Tropical Electrical Crucible"
            },
            {
                city: "Tromsø, Northern Norway",
                shortName: "Tromsø (Aurora Borealis)",
                lat: 69.6492,
                lon: 18.9553,
                record: "Prime Geomagnetic Auroral Oval Apex",
                alertLevel: "GEOMAGNETIC SOLAR STORM & AURORA ALERT",
                alertHeading: "Solar Flare Ionospheric Activity Advisory",
                alertDesc: "Solar wind particles colliding with oxygen and nitrogen atoms in Earth's magnetosphere produce glowing neon green, violet, and crimson ribbons dancing across the polar sky.",
                antiqueTitle: "Antique Norse Lore of the Valkyries' Armor",
                antiqueDate: "Centuries of Nordic Observation",
                antiqueStory: "Ancient Norse Vikings believed the shimmering green lights were the reflections from the shields and armor of the Valkyries guiding fallen warriors to Valhalla. Sami folklore held that whistling would summon the auroral spirits.",
                mechanism: "Coronal Mass Ejections Trapped in Terrestrial Van Allen Belts",
                classification: "High-Latitude Ionospheric Magneto-Optic Spectacle"
            },
            {
                city: "Burketown, Gulf of Carpentaria, Australia",
                shortName: "Morning Glory Cloud (1,000km)",
                lat: -17.7408,
                lon: 139.5492,
                record: "World's Only Predictable 1,000 km Long Roll Cloud",
                alertLevel: "MESOSCALE ATMOSPHERIC SOLITON WAVE ADVISORY",
                alertHeading: "Giant Rolling Tube Cloud & Wind Shear Alert",
                alertDesc: "A colossal cylindrical roll cloud up to 1,000 km (620 miles) long and 2 km high, rolling across the dawn sky at 60 km/h with turbulent updrafts beneath.",
                antiqueTitle: "Antique Garrawa Aboriginal 'Kangólgi' Cloud Stories",
                antiqueDate: "Spring Phenomena (Sept–Nov)",
                antiqueStory: "Local Garrawa and Waanyi Aboriginal peoples called this atmospheric giant 'Kangólgi' and considered it an antique herald of abundant bird life and shifting coastal winds, gliding like a mammoth serpent across the heavens.",
                mechanism: "Collision of Sea Breezes Across Cape York Peninsula Creating Solitary Undular Bores",
                classification: "Mesoscale Atmospheric Solitary Wave (Soliton)"
            },
            {
                city: "Kerala, South India",
                shortName: "Kerala (Blood Rain Phenomenon)",
                lat: 9.9312,
                lon: 76.2673,
                record: "Historic Coloured Rain of 2001 & 2012",
                alertLevel: "ANOMALOUS ATMOSPHERIC SPORE INUNDATION ADVISORY",
                alertHeading: "Rare Red Precipitation Curiosity",
                alertDesc: "Torrential downpours stained crimson red fallen over southern India, coloring clothes and water reservoirs. Scientific analysis revealed billions of microscopic aerial algal spores.",
                antiqueTitle: "Antique Meteorological Chronicles of 'Blood Rain'",
                antiqueDate: "Recorded July 25, 2001",
                antiqueStory: "Historical chronicles by Roman historian Livy and medieval British monks recorded mysterious 'rains of blood'. In Kerala, modern aerobiologists proved heavy stratosphere drafts lifted microscopic micro-algae into monsoon clouds.",
                mechanism: "Trentepohlia Algal Aerial Spore Convergence in Monsoonal Stratus",
                classification: "Biological-Meteorological Spore Precipitation"
            }
        ]
    }
};

/* ================= 10.6 QUERY INTENT DETECTION ENGINE ================= */
function detectExtremeOrAntiqueQuery(rawQuery) {
    if (!rawQuery) return null;
    const q = rawQuery.trim().toLowerCase();

    // Hot & Cold combined query (e.g. "hot and cold", "cold and hot")
    if (/\b(hot|heat)\b/i.test(q) && /\b(cold|freeze|ice)\b/i.test(q)) {
        return { category: "lowest_temp", index: 0 };
    }

    // Lowest Temperature / Polar & Cold records (includes 'cold', 'lowest', 'min temp', 'freeze', 'ice', 'polar', 'sub zero')
    if (/^(cold|coldest|colder|lowest|lowest\s*temp|lowest\s*temperature|min\s*temp|minimum\s*temp|coldest\s*city|coldest\s*place|coldest\s*country|extreme\s*cold|freezing\s*record|freeze|freezing|ice\s*record|sub\s*zero|low\s*temp)\b/i.test(q) ||
        /\b(coldest|coldest\s*place|coldest\s*city|coldest\s*in\s*the\s*world|lowest\s*temp|lowest\s*temperature)\b/i.test(q)) {
        return { category: "lowest_temp", index: 0 };
    }

    // Highest Temperature / Extreme Heat records (includes 'hot', 'heat', 'warm', 'highest', 'max temp', 'furnace')
    if (/^(hot|hottest|hotter|heat|heatwave|warm|warmest|highest|highest\s*temp|highest\s*temperature|max\s*temp|maximum\s*temp|hottest\s*city|hottest\s*place|hottest\s*country|extreme\s*heat|heat\s*record|high\s*temp|furnace)\b/i.test(q) ||
        /\b(highest\s*temp|hottest\s*place|hottest\s*city|hottest\s*in\s*the\s*world|highest\s*temperature)\b/i.test(q)) {
        return { category: "highest_temp", index: 0 };
    }

    // Typo 'hold' (commonly typed for hot or cold on keyboards)
    if (/^(hold)\b/i.test(q)) {
        return { category: "lowest_temp", index: 0 };
    }

    // General temperature keyword ('temp', 'temperature')
    if (/^(temp|temperature)\b/i.test(q)) {
        return { category: "lowest_temp", index: 0 };
    }

    // Extreme Rain / Monsoon records (includes 'rain', 'rainy', 'monsoon', 'wet', 'deluge', 'downpour')
    if (/^(rain|rainy|raining|rainfall|wet|wettest|most\s*rain|heavy\s*rain|rain\s*record|extreme\s*rain|monsoon|monsoon\s*record|downpour)\b/i.test(q) ||
        /\b(wettest\s*place|wettest\s*city|most\s*rain|rain\s*record|highest\s*rain)\b/i.test(q)) {
        return { category: "rain", index: 0 };
    }

    // Extreme Snow / Blizzard records (includes 'snow', 'snowy', 'snowing', 'snowfall', 'blizzard')
    if (/^(snow|snowy|snowing|snowfall|snowiest|most\s*snow|heavy\s*snow|snow\s*record|extreme\s*snow|blizzard|blizzard\s*record)\b/i.test(q) ||
        /\b(snowiest\s*place|snowiest\s*city|most\s*snow|snow\s*record|highest\s*snow)\b/i.test(q)) {
        return { category: "snow", index: 0 };
    }

    // Extreme Wind / Gale records (includes 'wind', 'windy', 'windiest', 'gale', 'cyclone', 'storm')
    if (/^(wind|windy|windiest|highest\s*wind|stormy\s*wind|wind\s*record|extreme\s*wind|gale|gale\s*record|cyclone|hurricane)\b/i.test(q) ||
        /\b(windiest\s*place|windiest\s*city|highest\s*wind|most\s*wind|windiest)\b/i.test(q)) {
        return { category: "wind", index: 0 };
    }

    // Weather Alerts, Special Happenings & Antique Phenomena (opens modal popup)
    if (/^(alert|alerts|warning|warnings|special|antique|antique\s*things|special\s*happening|special\s*weather|wonder|wonders|phenomenon|phenomena|rare\s*weather|miracle|catatumbo|aurora|blood\s*rain|morning\s*glory|sailing\s*stones)/i.test(q) ||
        /\b(alert|antique|special\s*happening|antique\s*things|rare\s*phenomenon|extreme\s*wonder|aurora\s*borealis)\b/i.test(q)) {
        return { category: "alert", index: 0 };
    }

    return null;
}

/* ================= 10.7 EXTREME CATEGORY TRIGGER & TELEMETRY LOADER ================= */
function triggerExtremeCategory(catKey, locIndex = 0, updateInput = false) {
    const cat = EXTREME_AND_ANTIQUE_DATA[catKey];
    if (!cat) return;

    // IF USER QUERIED FOR ALERTS / ANTIQUE WONDERS: POPUP THE MODAL ONLY!
    if (catKey === "alert") {
        hideSearchSuggestions();
        openAntiqueModal();
        return;
    }

    const loc = cat.contenders[locIndex] || cat.contenders[0];

    // DO NOT autotype in search bar during search execution! Only update if explicitly requested
    if (updateInput) {
        const input = document.getElementById("cityInput");
        if (input) input.value = loc.city;
    }

    hideSearchSuggestions();

    // Fetch real-time live satellite Open-Meteo weather
    currentCityLabel = loc.city;
    currentLat = loc.lat;
    currentLon = loc.lon;
    loadWeatherCoordinates(loc.lat, loc.lon, loc.city);

    safeStorage.setItem("weatherwise_last_city", loc.city);
    updateSaveButtonState();
    updateOpenDetailsLink();
}

function selectExtremeCity(catKey, locIndex) {
    const cat = EXTREME_AND_ANTIQUE_DATA[catKey];
    if (!cat) return;
    const loc = cat.contenders[locIndex] || cat.contenders[0];
    hideSearchSuggestions();

    if (catKey === "alert") {
        openAntiqueModal();
        return;
    }

    // Explicit user click on a suggestion: show selected city in search bar
    const input = document.getElementById("cityInput");
    if (input) input.value = loc.city;

    currentCityLabel = loc.city;
    currentLat = loc.lat;
    currentLon = loc.lon;
    loadWeatherCoordinates(loc.lat, loc.lon, loc.city);

    safeStorage.setItem("weatherwise_last_city", loc.city);
    updateSaveButtonState();
    updateOpenDetailsLink();
}

function selectGeocodedCity(lat, lon, label) {
    hideSearchSuggestions();
    const input = document.getElementById("cityInput");
    if (input) input.value = label;

    currentCityLabel = label;
    currentLat = lat;
    currentLon = lon;
    loadWeatherCoordinates(lat, lon, label);

    safeStorage.setItem("weatherwise_last_city", label);
    updateSaveButtonState();
    updateOpenDetailsLink();
}

function renderExtremeShowcase(catKey, locIndex = 0) {
    const showcaseSec = document.getElementById("extremeShowcaseSection");
    if (!showcaseSec) return;

    const cat = EXTREME_AND_ANTIQUE_DATA[catKey];
    if (!cat) return;
    const loc = cat.contenders[locIndex] || cat.contenders[0];

    const card = document.getElementById("extremeShowcaseCard");
    if (card) {
        card.className = `extreme-showcase-card card-3d-interactive theme-${catKey}`;
    }

    showcaseSec.style.display = "block";
    showcaseSec.classList.add("revealed");
}

function closeExtremeShowcase() {
    const showcaseSec = document.getElementById("extremeShowcaseSection");
    if (showcaseSec) {
        showcaseSec.style.display = "none";
    }
}

/* ================= 10.8 SMART SEARCH SUGGESTIONS DROPDOWN ================= */
let geocodeDebounceTimer = null;
let activeGeocodeAbortController = null;

function initSearchSuggestions() {
    const input = document.getElementById("cityInput");
    const dropdown = document.getElementById("searchSuggestions");
    if (!input || !dropdown) return;

    input.addEventListener("input", (e) => {
        // Zero autotype in search bar: only render dropdown suggestions
        renderSearchSuggestions(e.target.value);
    });

    input.addEventListener("focus", (e) => {
        renderSearchSuggestions(e.target.value);
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box-wrapper")) {
            hideSearchSuggestions();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hideSearchSuggestions();
        }
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ================= 10.8 LIVE CONTENDER WEATHER TELEMETRY CACHE ================= */
let contendersLiveCache = {};
let contendersLiveCacheTimestamp = 0;
let isPrefetchingContenders = false;

// Attempt to restore contenders cache from localStorage on startup for zero-latency live suggestions
try {
    const rawLocal = localStorage.getItem("weatherwise_contenders_live");
    if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (parsed && parsed.data && (Date.now() - (parsed.timestamp || 0) < 900000)) {
            contendersLiveCache = parsed.data;
            contendersLiveCacheTimestamp = parsed.timestamp;
        }
    }
} catch (e) {}

async function prefetchContenderLiveWeather() {
    const now = Date.now();
    if (contendersLiveCacheTimestamp && (now - contendersLiveCacheTimestamp < 900000) && Object.keys(contendersLiveCache).length > 0) {
        return contendersLiveCache;
    }
    if (isPrefetchingContenders) return contendersLiveCache;
    isPrefetchingContenders = true;

    try {
        const all = getAllExtremeContenders();
        const lats = all.map(c => c.lat).join(',');
        const lons = all.map(c => c.lon).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach((d, idx) => {
                    const c = all[idx];
                    if (c && d.current) {
                        const key = `${Number(c.lat).toFixed(4)},${Number(c.lon).toFixed(4)}`;
                        contendersLiveCache[key] = {
                            temp: d.current.temperature_2m,
                            apparent: d.current.apparent_temperature,
                            humidity: d.current.relative_humidity_2m,
                            wind: d.current.wind_speed_10m,
                            code: d.current.weather_code,
                            precip: d.current.precipitation
                        };
                    }
                });
                contendersLiveCacheTimestamp = Date.now();
                try {
                    localStorage.setItem("weatherwise_contenders_live", JSON.stringify({
                        timestamp: contendersLiveCacheTimestamp,
                        data: contendersLiveCache
                    }));
                } catch(e) {}

                // If suggestions dropdown is currently open and focused, re-render it with real-time live temperatures
                const input = document.getElementById("cityInput");
                const dropdown = document.getElementById("searchSuggestions");
                if (dropdown && dropdown.style.display !== "none" && input) {
                    renderSearchSuggestions(input.value);
                }
            }
        }
    } catch(err) {
        console.warn("Contender live batch fetch warning:", err);
    } finally {
        isPrefetchingContenders = false;
    }
    return contendersLiveCache;
}

function getContenderLiveInfo(lat, lon) {
    if (lat === undefined || lon === undefined) return null;
    const key = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
    return contendersLiveCache[key] || null;
}

function getAllExtremeContenders() {
    const items = [];
    Object.keys(EXTREME_AND_ANTIQUE_DATA).forEach(k => {
        const cat = EXTREME_AND_ANTIQUE_DATA[k];
        cat.contenders.forEach((loc, idx) => {
            const kw = [
                ...(cat.keywords || []),
                loc.city.toLowerCase(),
                loc.shortName.toLowerCase(),
                loc.record.toLowerCase()
            ];
            if (k === "lowest_temp") {
                kw.push("cold", "coldest", "lowest", "freeze", "freezing", "ice", "polar", "sub zero", "min temp", "hold", "temp", "lowest temp");
            } else if (k === "highest_temp") {
                kw.push("hot", "hottest", "heat", "warm", "highest", "max temp", "furnace", "hold", "temp", "highest temp");
            } else if (k === "rain") {
                kw.push("rain", "rainy", "raining", "rainfall", "wet", "wettest", "monsoon", "deluge", "downpour", "heavy rain");
            } else if (k === "snow") {
                kw.push("snow", "snowy", "snowing", "snowfall", "snowiest", "blizzard", "heavy snow");
            } else if (k === "wind") {
                kw.push("wind", "windy", "windiest", "gale", "cyclone", "storm", "hurricane", "highest wind");
            } else if (k === "alert") {
                kw.push("alert", "alerts", "warning", "antique", "antique things", "special", "special happening", "wonder", "phenomenon");
            }

            items.push({
                type: "extreme",
                catKey: k,
                idx: idx,
                icon: cat.icon,
                city: loc.city,
                shortName: loc.shortName,
                record: loc.record,
                badge: cat.categoryBadge,
                keywords: kw,
                lat: loc.lat,
                lon: loc.lon
            });
        });
    });
    return items;
}

function renderSearchSuggestions(query = "") {
    const dropdown = document.getElementById("searchSuggestions");
    if (!dropdown) return;

    // Trigger asynchronous prefetch if not yet cached
    if (!contendersLiveCacheTimestamp) {
        prefetchContenderLiveWeather();
    }

    const q = query.trim().toLowerCase();
    const allContenders = getAllExtremeContenders();

    // Attach live telemetry to each contender item
    allContenders.forEach(c => {
        c.live = getContenderLiveInfo(c.lat, c.lon);
    });

    let matchedItems = [];

    if (!q) {
        // Default: display live world-record capitals with real-time conditions
        const coldGroup = allContenders.filter(c => c.catKey === "lowest_temp");
        coldGroup.sort((a, b) => ((a.live?.temp ?? 999) - (b.live?.temp ?? 999)));
        const topCold = coldGroup[0] || allContenders.find(c => c.catKey === "lowest_temp" && c.idx === 0);
        if (topCold && topCold.live) {
            topCold.customLiveBadge = `❄️ Earth's Coldest: ${formatTemp(topCold.live.temp)}°${currentUnit}`;
            topCold.isTopLive = true;
        }

        const heatGroup = allContenders.filter(c => c.catKey === "highest_temp");
        heatGroup.sort((a, b) => ((b.live?.temp ?? -999) - (a.live?.temp ?? -999)));
        const topHeat = heatGroup[0] || allContenders.find(c => c.catKey === "highest_temp" && c.idx === 0);
        if (topHeat && topHeat.live) {
            topHeat.customLiveBadge = `🔥 Peak Heat: ${formatTemp(topHeat.live.temp)}°${currentUnit}`;
            topHeat.isTopLive = true;
        }

        const windGroup = allContenders.filter(c => c.catKey === "wind");
        windGroup.sort((a, b) => ((b.live?.wind ?? -999) - (a.live?.wind ?? -999)));
        const topWind = windGroup[0] || allContenders.find(c => c.catKey === "wind" && c.idx === 0);
        if (topWind && topWind.live) {
            topWind.customLiveBadge = `💨 Windiest Now: ${Math.round(topWind.live.wind)} km/h`;
            topWind.isTopLive = true;
        }

        const topRain = allContenders.find(c => c.catKey === "rain" && c.idx === 0);
        const topSnow = allContenders.find(c => c.catKey === "snow" && c.idx === 0);

        matchedItems = [
            topCold,
            topHeat,
            topWind,
            topRain,
            topSnow,
            {
                type: "antique_modal",
                icon: "🏛️",
                city: currentCityLabel ? `🚨 Severe Alerts & 🏛️ Antique Wonders for ${currentCityLabel}` : "Antique Wonders & Severe Alerts",
                record: "Active atmospheric advisory & authentic historical chronicles strictly for current location",
                badge: "Searched Location"
            }
        ].filter(Boolean);
    } else {
        const extremeIntent = detectExtremeOrAntiqueQuery(q);
        if (extremeIntent) {
            if (q === "hold" || q === "temp" || q === "temperature" || (/\b(hot|heat)\b/i.test(q) && /\b(cold|freeze|ice)\b/i.test(q))) {
                // Show ALL 8 temperature contenders (both coldest 4 and hottest 4)
                const colds = allContenders.filter(c => c.catKey === "lowest_temp");
                colds.sort((a, b) => ((a.live?.temp ?? 999) - (b.live?.temp ?? 999)));
                if (colds[0] && colds[0].live) {
                    colds[0].customLiveBadge = `❄️ Earth's Coldest Now`;
                    colds[0].isTopLive = true;
                }

                const hots = allContenders.filter(c => c.catKey === "highest_temp");
                hots.sort((a, b) => ((b.live?.temp ?? -999) - (a.live?.temp ?? -999)));
                if (hots[0] && hots[0].live) {
                    hots[0].customLiveBadge = `🔥 Earth's Peak Heat Now`;
                    hots[0].isTopLive = true;
                }

                matchedItems = [...colds, ...hots];
            } else if (extremeIntent.category === "lowest_temp") {
                // Sort all 4 cold contenders by live temperature ASCENDING (coldest first)
                matchedItems = allContenders.filter(c => c.catKey === "lowest_temp");
                matchedItems.sort((a, b) => ((a.live?.temp ?? 999) - (b.live?.temp ?? 999)));
                if (matchedItems[0] && matchedItems[0].live) {
                    matchedItems[0].customLiveBadge = `❄️ Coldest on Earth: ${formatTemp(matchedItems[0].live.temp)}°${currentUnit}`;
                    matchedItems[0].isTopLive = true;
                }
            } else if (extremeIntent.category === "highest_temp") {
                // Sort all 4 heat contenders by live temperature DESCENDING (hottest first)
                matchedItems = allContenders.filter(c => c.catKey === "highest_temp");
                matchedItems.sort((a, b) => ((b.live?.temp ?? -999) - (a.live?.temp ?? -999)));
                if (matchedItems[0] && matchedItems[0].live) {
                    matchedItems[0].customLiveBadge = `🔥 Peak Heat on Earth: ${formatTemp(matchedItems[0].live.temp)}°${currentUnit}`;
                    matchedItems[0].isTopLive = true;
                }
            } else if (extremeIntent.category === "wind") {
                // Sort all 4 wind contenders by live wind speed DESCENDING (windiest first)
                matchedItems = allContenders.filter(c => c.catKey === "wind");
                matchedItems.sort((a, b) => ((b.live?.wind ?? -999) - (a.live?.wind ?? -999)));
                if (matchedItems[0] && matchedItems[0].live) {
                    matchedItems[0].customLiveBadge = `💨 Windiest on Earth: ${Math.round(matchedItems[0].live.wind)} km/h`;
                    matchedItems[0].isTopLive = true;
                }
            } else if (extremeIntent.category === "rain") {
                matchedItems = allContenders.filter(c => c.catKey === "rain");
            } else if (extremeIntent.category === "snow") {
                matchedItems = allContenders.filter(c => c.catKey === "snow");
            } else if (extremeIntent.category === "alert") {
                matchedItems = allContenders.filter(c => c.catKey === "alert");
                matchedItems.push({
                    type: "antique_modal",
                    icon: "🏛️",
                    city: currentCityLabel ? `🚨 Severe Alerts & 🏛️ Antique Wonders for ${currentCityLabel}` : "Antique Wonders & Severe Alerts Modal",
                    record: "Active atmospheric advisory & authentic historical chronicles strictly for current location",
                    badge: "Explore Modal"
                });
            } else {
                matchedItems = allContenders.filter(c => c.catKey === extremeIntent.category);
            }
        } else {
            // General query: match city, country, or specific keywords
            matchedItems = allContenders.filter(item => {
                return item.city.toLowerCase().includes(q) ||
                       item.shortName.toLowerCase().includes(q) ||
                       item.record.toLowerCase().includes(q) ||
                       item.keywords.some(k => k === q || (q.length >= 3 && k.includes(q)));
            });
        }
    }

    // Render immediate local / extreme matches synchronously with live weather
    buildDropdownHTML(matchedItems, []);

    // Debounced live geocoding ONLY for regular cities/countries (e.g. Paris, London, Tokyo, Delhi, Mumbai, etc.)
    // CRITICAL: NEVER geocode weather queries (rain, snow, cold, hot, hold, wind, alert)
    if (q.length >= 2 && !detectExtremeOrAntiqueQuery(q)) {
        debounceGeocode(q, matchedItems);
    }
}

function debounceGeocode(q, existingMatches) {
    if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
    if (activeGeocodeAbortController) {
        activeGeocodeAbortController.abort();
    }

    // Never fetch geocoded towns for weather condition searches!
    if (detectExtremeOrAntiqueQuery(q)) {
        return;
    }

    geocodeDebounceTimer = setTimeout(async () => {
        try {
            activeGeocodeAbortController = new AbortController();
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
            const res = await fetch(url, { signal: activeGeocodeAbortController.signal });
            if (!res.ok) return;
            const data = await res.json();

            // Verify current input still matches query
            const input = document.getElementById("cityInput");
            if (!input || input.value.trim().toLowerCase() !== q) return;

            if (data && data.results && data.results.length > 0) {
                const geoItems = data.results.map(loc => {
                    const label = `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}, ${loc.country || ""}`;
                    return {
                        type: "geocoded",
                        lat: loc.latitude,
                        lon: loc.longitude,
                        label: label,
                        sub: `Lat: ${loc.latitude.toFixed(2)}°, Lon: ${loc.longitude.toFixed(2)}° • ${loc.timezone || "Station"}`,
                        badge: loc.country_code || "City"
                    };
                }).filter(geo => !existingMatches.some(m => m.city && m.city.toLowerCase().includes(geo.label.toLowerCase())));

                buildDropdownHTML(existingMatches, geoItems);
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                console.warn("Geocoding suggestion fetch error:", err);
            }
        }
    }, 220);
}

function buildDropdownHTML(extremeItems, geoItems) {
    const dropdown = document.getElementById("searchSuggestions");
    if (!dropdown) return;

    const total = (extremeItems || []).length + (geoItems || []).length;
    if (total === 0) {
        dropdown.style.display = "none";
        return;
    }

    let html = "";

    // 1. Extreme & World Record City suggestions with Live Weather
    (extremeItems || []).forEach(item => {
        if (item.type === "antique_modal") {
            html += `
                <div class="suggestion-item" onclick="window.hideSearchSuggestions && window.hideSearchSuggestions(); window.openAntiqueModal && window.openAntiqueModal();">
                    <div class="suggestion-item-left">
                        <span class="suggestion-icon">${item.icon}</span>
                        <div class="suggestion-info">
                            <span class="suggestion-title">${escapeHtml(item.city)}</span>
                            <span class="suggestion-sub">${escapeHtml(item.record)}</span>
                        </div>
                    </div>
                    <span class="suggestion-badge">${escapeHtml(item.badge)}</span>
                </div>
            `;
        } else {
            const live = item.live || getContenderLiveInfo(item.lat, item.lon);
            let liveRowHtml = "";
            let displayBadge = item.customLiveBadge || item.badge;

            if (live) {
                const formattedTemp = formatTemp(live.temp);
                const tempClass = live.temp <= 0 ? "temp-cold" : (live.temp >= 30 ? "temp-hot" : "temp-normal");
                const cond = getWeatherInfo(live.code, 1);
                liveRowHtml = `
                    <div class="suggestion-live-row">
                        <span class="suggestion-live-temp ${tempClass}">🌡️ Live: ${formattedTemp}°${currentUnit}</span>
                        <span class="suggestion-live-wind">💨 ${Math.round(live.wind)} km/h</span>
                        <span class="suggestion-live-desc">${cond.icon} ${cond.description}</span>
                    </div>
                `;
            }

            html += `
                <div class="suggestion-item" onclick="window.selectExtremeCity && window.selectExtremeCity('${item.catKey}', ${item.idx})">
                    <div class="suggestion-item-left">
                        <span class="suggestion-icon">${item.icon}</span>
                        <div class="suggestion-info">
                            <span class="suggestion-title">${escapeHtml(item.city)}</span>
                            ${liveRowHtml}
                            <span class="suggestion-record-sub">Record: ${escapeHtml(item.record)}</span>
                        </div>
                    </div>
                    <span class="suggestion-badge ${item.isTopLive ? 'live-extreme-badge' : ''}">${escapeHtml(displayBadge)}</span>
                </div>
            `;
        }
    });

    // 2. Live Geocoded City and Country suggestions
    (geoItems || []).forEach(geo => {
        html += `
            <div class="suggestion-item" onclick="window.selectGeocodedCity && window.selectGeocodedCity(${geo.lat}, ${geo.lon}, '${escapeHtml(geo.label)}')">
                <div class="suggestion-item-left">
                    <span class="suggestion-icon">📍</span>
                    <div class="suggestion-info">
                        <span class="suggestion-title">${escapeHtml(geo.label)}</span>
                        <span class="suggestion-sub">${escapeHtml(geo.sub)}</span>
                    </div>
                </div>
                <span class="suggestion-badge">${escapeHtml(geo.badge)}</span>
            </div>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = "flex";
}

function hideSearchSuggestions() {
    const dropdown = document.getElementById("searchSuggestions");
    if (dropdown) dropdown.style.display = "none";
    if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
    if (activeGeocodeAbortController) activeGeocodeAbortController.abort();
}

/* ================= 10.9 LOCATION-SPECIFIC ALERT & ANTIQUE METEOROLOGICAL ENGINE ================= */
const HISTORICAL_CITY_CHRONICLES = {
    "london": {
        title: "The Great Frost Fairs & The 1952 Smog Inversion",
        date: "Historic Chronicles (1608–1814 & 1952)",
        story: "During the Little Ice Age, the River Thames froze solid enough to host festive 'Frost Fairs' upon thick ice sheets, complete with printing presses and ox-roasts. In December 1952, an impenetrable thermal ceiling trapped smoke across London for 5 days, establishing the world's first modern clean air legislative framework.",
        classification: "Maritime Temperate Basin Thermal Inversion"
    },
    "new york": {
        title: "The Great White Hurricane of 1888",
        date: "Recorded March 11–14, 1888",
        story: "One of the most legendary blizzards in North American history dumped 50+ inches of snow with 40-foot drifts, paralyzing Manhattan's elevated railways and directly prompting the construction of America's first underground subway system.",
        classification: "Mid-Atlantic Nor'easter Cyclone Convergence"
    },
    "tokyo": {
        title: "Edo Period Imperial Sakura Phenology & Kantō Inversions",
        date: "Continuous Records Since 1603",
        story: "Tokyo retains the world's longest unbroken meteorological phenology log. For over four centuries since the Edo Shogunate, imperial court astronomers documented the precise blooming day of cherry blossoms to track century-scale climatic cycles.",
        classification: "East Asian Humid Subtropical Island Megacity"
    },
    "paris": {
        title: "The 100-Year Great Seine River Inundation",
        date: "Recorded January 1910",
        story: "In January 1910, following months of saturated soils and torrential rains, the Seine River rose 8.62 meters above normal. Parisians navigated boulevards in antique rowboats and raised wooden boardwalks for weeks without a single electrical catastrophe.",
        classification: "Western European Riverine Sedimentary Basin"
    },
    "delhi": {
        title: "Ancient Yamuna Inundations & Stepwell Hydraulics",
        date: "Recorded Since 14th Century Sultanate",
        story: "Delhi's climate oscillates between blistering summer Loo winds and torrential monsoons. Medieval engineers constructed subterranean Baolis (stepwells) like Agrasen ki Baoli to capture monsoon rainwater and maintain underground temperatures 10°C cooler than the searing air.",
        classification: "Subtropical Semi-Arid Monsoonal Inversion"
    },
    "dubai": {
        title: "Ancient Arabian Coastal Fog & Traditional Barjeel Aerodynamics",
        date: "Historical Gulf Maritime Chronicles",
        story: "Dense marine advection fog blankets the Persian Gulf coastline at dawn when arid desert heat meets humid sea breeze. Traditional Emirati settlements engineered towering open-topped Barjeel wind towers to channel and circulate cooling maritime breezes.",
        classification: "Subtropical Hyper-Arid Coastal Promontory"
    },
    "cairo": {
        title: "The Nilometer & Millennia-Old Inundation Records",
        date: "Recorded on Roda Island Since 861 AD",
        story: "On Roda Island in Cairo stands the antique Nilometer, an octagonal marble column used by ancient astronomers and caliphs for over 1,160 years to measure the annual Nile flood depth and predict famine or agricultural prosperity.",
        classification: "Lower Nile Desert River Oasis"
    },
    "sydney": {
        title: "The Southerly Buster Meteorological Phenomenon",
        date: "Logged by Captain James Cook (1770)",
        story: "Sydney is famed for the 'Southerly Buster'—an intense shallow cold front that sweeps up the coast in spring and summer, dropping ambient temperatures by up to 15°C within 15 minutes, accompanied by dramatic rolling shelf clouds.",
        classification: "Tasman Sea Maritime Coastal Barrier"
    }
};

function getSearchedLocationPhenomena(cityName, weatherData, lat, lon) {
    if (!cityName) cityName = "Selected Location";
    const nameLow = cityName.toLowerCase();

    // 1. Check if matches any of our 24 contenders in EXTREME_AND_ANTIQUE_DATA
    for (const k of Object.keys(EXTREME_AND_ANTIQUE_DATA)) {
        const cat = EXTREME_AND_ANTIQUE_DATA[k];
        for (let i = 0; i < cat.contenders.length; i++) {
            const loc = cat.contenders[i];
            const locCityLow = loc.city.toLowerCase();
            const locShortLow = loc.shortName.toLowerCase();
            const isCoordMatch = (lat !== undefined && lon !== undefined && 
                Math.abs(loc.lat - lat) < 0.25 && Math.abs(loc.lon - lon) < 0.25);
            
            if (isCoordMatch || nameLow.includes(locShortLow.split(" ")[0].toLowerCase()) || locCityLow.includes(nameLow) || nameLow.includes(locCityLow)) {
                return {
                    isContender: true,
                    catKey: k,
                    icon: cat.icon,
                    city: loc.city,
                    alertLevel: loc.alertLevel,
                    alertHeading: loc.alertHeading,
                    alertDesc: loc.alertDesc,
                    mechanism: loc.mechanism,
                    antiqueTitle: loc.antiqueTitle,
                    antiqueDate: loc.antiqueDate,
                    antiqueStory: loc.antiqueStory,
                    classification: loc.classification,
                    record: loc.record
                };
            }
        }
    }

    // 2. Dynamic synthesis for ANY global city based on real-time live telemetry
    const curr = weatherData?.current || {};
    const daily = weatherData?.daily || {};
    const temp = curr.temperature_2m ?? 20;
    const wind = curr.wind_speed_10m ?? 10;
    const gusts = curr.wind_gusts_10m ?? wind;
    const precip = curr.precipitation ?? 0;
    const uv = daily.uv_index_max?.[0] ?? 3;
    const pressure = curr.surface_pressure ?? 1013;

    let alertLevel = "STABLE ATMOSPHERIC CONDITIONS ADVISORY";
    let alertHeading = "Optimal Regional Barometric Equilibrium";
    let alertDesc = `Current atmospheric pressure is stable at ${Math.round(pressure)} hPa with ambient wind of ${Math.round(wind)} km/h. No severe convective storm cells or thermal extremes detected within the local boundary layer.`;
    let mechanism = "Subtropical / Mid-Latitude Synoptic Barometric Balance";
    let alertIcon = "🟢";

    if (temp >= 40) {
        alertLevel = "EXTREME DANGEROUS HYPERTHERMIA WARNING";
        alertHeading = "Severe Heat Dome & Thermal Radiation Advisory";
        alertDesc = `Critical ambient air temperature (${temp}°C). Severe risk of heat stroke, surface heat absorption, and acute dehydration. Avoid strenuous outdoor activities.`;
        mechanism = "Subtropical High Pressure Ridge & Adiabatic Compression";
        alertIcon = "🔥";
    } else if (temp >= 35) {
        alertLevel = "HIGH AMBIENT HEAT & UV ADVISORY";
        alertHeading = "Elevated Heat Index & Midday Thermal Warning";
        alertDesc = `Elevated thermal telemetry (${temp}°C) with UV radiation. Prolonged exposure without hydration and sun protection increases heat exhaustion risk.`;
        mechanism = "Solar Insolation Apex & Compressional Air Sinking";
        alertIcon = "☀️";
    } else if (temp <= -25) {
        alertLevel = "DEEP POLAR CRYO-HAZARD WARNING";
        alertHeading = "Extreme Sub-Zero Frostbite & Cryo-Freeze Alert";
        alertDesc = `Brutal cryogenic temperatures (${temp}°C). Exposed flesh freezes in under 3 minutes. Hypothermia risk is immediate without multi-layer thermal insulation.`;
        mechanism = "Polar Vortex Jet Displacement & Radiational Heat Deficit";
        alertIcon = "❄️";
    } else if (temp <= -5) {
        alertLevel = "FREEZING CRYO-HAZARD & ROADWAY GLAZE ADVISORY";
        alertHeading = "Sub-Zero Freeze & Black Ice Hazard Warning";
        alertDesc = `Sub-zero temperatures (${temp}°C) are generating surface ice glaze and wind-chill stress. Exercise caution on elevated roadways and exposed walkways.`;
        mechanism = "Continental Cold Air Advection & Radiative Cooling";
        alertIcon = "🧊";
    } else if (gusts >= 75 || wind >= 60) {
        alertLevel = "SEVERE STORM-FORCE GALE WARNING";
        alertHeading = "High-Velocity Gale & Squall Hazard Advisory";
        alertDesc = `Turbulent wind gusts reaching ${Math.round(gusts)} km/h. Elevated risk of branch failure, structural facade stress, and pedestrian instability.`;
        mechanism = "Tight Barometric Isobar Gradient & Upper-Tropospheric Jet Funneling";
        alertIcon = "💨";
    } else if (wind >= 40) {
        alertLevel = "BRISK GALE & WIND SQUALL ADVISORY";
        alertHeading = "Active Surface Wind Gust Advisory";
        alertDesc = `Elevated winds measuring ${Math.round(wind)} km/h creating aerodynamic drag, dust agitation, and intensified wind-chill cooling.`;
        mechanism = "Regional Pressure Discontinuity & Boundary-Layer Friction";
        alertIcon = "💨";
    } else if (precip >= 10) {
        alertLevel = "TORRENTIAL PLUVIAL INUNDATION WARNING";
        alertHeading = "Extreme Cloudburst & Pluvial Flooding Advisory";
        alertDesc = `Intense precipitation rate (${precip} mm/h) exceeding local drainage capacities. Reduced horizontal visibility and flash-flood potential in low-lying zones.`;
        mechanism = "Deep Convective Moist Updrafts & Orographic Moisture Lock";
        alertIcon = "🌧️";
    } else if (precip >= 1) {
        alertLevel = "CONTINUOUS PRECIPITATION ADVISORY";
        alertHeading = "Active Rainfall & Roadway Hydroplaning Alert";
        alertDesc = `Consistent precipitation (${precip} mm) creating slick surfaces, humid boundary-layer saturation, and compromised visibility.`;
        mechanism = "Warm Frontal Stratiform Cloud Condensation";
        alertIcon = "🌧️";
    } else if (uv >= 8) {
        alertLevel = "HIGH ULTRAVIOLET RADIATION ALERT";
        alertHeading = "Extreme Solar Photon Erythema Advisory";
        alertDesc = `UV Index is dangerously elevated at ${uv.toFixed(1)}. Direct skin exposure without UV filtering can trigger cellular damage within 15 minutes.`;
        mechanism = "High Solar Elevation Angle & Low Stratospheric Ozone Absorption";
        alertIcon = "☀️";
    }

    // Antique curiosity lookup or procedural generator
    let antique = null;
    for (const k of Object.keys(HISTORICAL_CITY_CHRONICLES)) {
        if (nameLow.includes(k)) {
            antique = HISTORICAL_CITY_CHRONICLES[k];
            break;
        }
    }

    if (!antique) {
        const latVal = lat !== undefined ? Number(lat) : 0;
        const hemi = latVal >= 0 ? "Northern" : "Southern";
        antique = {
            title: `Microclimatic Heritage of the ${Math.abs(Math.round(latVal))}° Parallel`,
            date: "Historical Climatological Baseline",
            story: `${cityName} lies squarely in the ${hemi} Hemisphere along a unique geographic elevation threshold. Centuries of meteorological tracking indicate its local microclimate is governed by maritime and continental air-mass migrations following the annual solar solstice transit.`,
            classification: "Regional Synoptic Climate Convergence"
        };
    }

    return {
        isContender: false,
        catKey: "local",
        icon: alertIcon,
        city: cityName,
        alertLevel: alertLevel,
        alertHeading: alertHeading,
        alertDesc: alertDesc,
        mechanism: mechanism,
        antiqueTitle: antique.title,
        antiqueDate: antique.date,
        antiqueStory: antique.story,
        classification: antique.classification,
        record: `Telemetry: ${temp}°C, Wind ${Math.round(wind)} km/h`
    };
}

function renderSearchedLocationPhenomena(cityName, weatherData, lat, lon) {
    const p = getSearchedLocationPhenomena(cityName, weatherData, lat, lon);
    if (!p) return;

    // 1. Update on-card strip in main dashboard
    const strip = document.getElementById("searchedLocationAlertStrip");
    const iconCircle = document.getElementById("alertStripIconCircle");
    const levelEl = document.getElementById("alertStripLevel");
    const headingEl = document.getElementById("alertStripHeading");
    const antiqueTeaserEl = document.getElementById("alertStripAntiqueTeaser");

    if (strip) strip.style.display = "flex";
    if (iconCircle) iconCircle.textContent = p.icon;
    if (levelEl) levelEl.textContent = p.alertLevel;
    if (headingEl) headingEl.textContent = p.alertHeading;
    if (antiqueTeaserEl) antiqueTeaserEl.textContent = `🏛️ Antique Wonder: ${p.antiqueTitle}`;

    // 2. Pre-render content for modal strictly for this location
    const modalCityName = document.getElementById("antiqueModalCityName");
    const modalView = document.getElementById("searchedLocationModalView");
    if (modalCityName) modalCityName.textContent = p.city;

    if (modalView) {
        modalView.innerHTML = `
            <!-- CARD 1: ACTIVE SEVERE ALERT -->
            <div class="modal-section-hero hero-alert">
                <div class="hero-header-row">
                    <div class="hero-icon-box">${p.icon}</div>
                    <div class="hero-titles">
                        <span class="hero-badge-tag">${escapeHtml(p.alertLevel)}</span>
                        <h4 class="hero-title">${escapeHtml(p.alertHeading)}</h4>
                        <span class="hero-city-tag">📍 ${escapeHtml(p.city)}</span>
                    </div>
                </div>
                <p class="hero-desc">${escapeHtml(p.alertDesc)}</p>
                <div class="hero-spec-grid">
                    <div class="hero-spec-card">
                        <span class="hero-spec-label">Atmospheric Mechanism</span>
                        <strong class="hero-spec-value">${escapeHtml(p.mechanism)}</strong>
                    </div>
                    <div class="hero-spec-card">
                        <span class="hero-spec-label">Climatic Baseline</span>
                        <strong class="hero-spec-value">${escapeHtml(p.record)}</strong>
                    </div>
                </div>
            </div>

            <!-- CARD 2: ANTIQUE PHENOMENON & HISTORIC CHRONICLE -->
            <div class="modal-section-hero hero-antique">
                <div class="hero-header-row">
                    <div class="hero-icon-box">🏛️</div>
                    <div class="hero-titles">
                        <span class="hero-badge-tag hero-badge-antique">Historical Meteorological Curiosity</span>
                        <h4 class="hero-title">${escapeHtml(p.antiqueTitle)}</h4>
                        <span class="hero-city-tag">📜 Chronicle: ${escapeHtml(p.antiqueDate)}</span>
                    </div>
                </div>
                <p class="hero-desc">${escapeHtml(p.antiqueStory)}</p>
                <div class="hero-spec-grid">
                    <div class="hero-spec-card">
                        <span class="hero-spec-label">Climatological Classification</span>
                        <strong class="hero-spec-value">${escapeHtml(p.classification)}</strong>
                    </div>
                    <div class="hero-spec-card">
                        <span class="hero-spec-label">Location Context</span>
                        <strong class="hero-spec-value">Strictly for ${escapeHtml(p.city)}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}

function openAntiqueModal() {
    const modal = document.getElementById("antiqueModal");
    if (!modal) return;

    // Ensure searched location view is updated strictly for current location
    if (lastWeatherData) {
        renderSearchedLocationPhenomena(currentCityLabel, lastWeatherData, currentLat, currentLon);
    }

    // Global grid is collapsed by default
    const globalWrap = document.getElementById("antiqueGlobalRecordsWrap");
    const toggleBtn = document.getElementById("globalRecordsToggleText");
    if (globalWrap) globalWrap.style.display = "none";
    if (toggleBtn) toggleBtn.textContent = "Browse Other Worldwide Records & Curiosities (Optional)";

    modal.style.display = "flex";
}

function closeAntiqueModal() {
    const modal = document.getElementById("antiqueModal");
    if (modal) modal.style.display = "none";
}

function toggleGlobalRecordsGrid() {
    const globalWrap = document.getElementById("antiqueGlobalRecordsWrap");
    const toggleBtn = document.getElementById("globalRecordsToggleText");
    if (!globalWrap) return;

    if (globalWrap.style.display === "none") {
        globalWrap.style.display = "block";
        if (toggleBtn) toggleBtn.textContent = "Hide Worldwide Records";
        renderAntiqueModalCards("all");
    } else {
        globalWrap.style.display = "none";
        if (toggleBtn) toggleBtn.textContent = "Browse Other Worldwide Records & Curiosities (Optional)";
    }
}

function filterAntiqueModalGrid(catKey, btn) {
    const tabs = document.querySelectorAll(".antique-tab-btn");
    tabs.forEach(t => t.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderAntiqueModalCards(catKey);
}

function renderAntiqueModalCards(filterCat = "all") {
    const grid = document.getElementById("antiqueWondersGrid");
    if (!grid) return;

    let items = [];

    Object.keys(EXTREME_AND_ANTIQUE_DATA).forEach(k => {
        if (filterCat !== "all" && filterCat !== k) return;
        const cat = EXTREME_AND_ANTIQUE_DATA[k];
        cat.contenders.forEach((loc, idx) => {
            const live = getContenderLiveInfo(loc.lat, loc.lon);
            items.push({
                catKey: k,
                idx: idx,
                icon: cat.icon,
                tag: cat.categoryBadge,
                city: loc.city,
                shortName: loc.shortName,
                record: loc.record,
                title: loc.antiqueTitle,
                date: loc.antiqueDate,
                story: loc.antiqueStory,
                mechanism: loc.mechanism,
                alertLevel: loc.alertLevel,
                live: live
            });
        });
    });

    grid.innerHTML = items.map(item => {
        let liveTag = "";
        if (item.live) {
            liveTag = `<span class="suggestion-live-temp ${item.live.temp <= 0 ? 'temp-cold' : 'temp-hot'}" style="margin-left: 6px; font-size: 11px;">🌡️ Live: ${formatTemp(item.live.temp)}°${currentUnit}</span>`;
        }
        return `
            <div class="antique-wonder-card">
                <div>
                    <div class="antique-wonder-top">
                        <div class="wonder-card-icon">${item.icon}</div>
                        <div class="wonder-card-title-group">
                            <span class="wonder-card-tag">${item.tag} ${liveTag}</span>
                            <h4 class="wonder-card-title">${item.title}</h4>
                            <span class="wonder-card-city">📍 ${item.city}</span>
                        </div>
                    </div>
                    <p class="wonder-card-story" style="margin-top: 10px;">${item.story}</p>
                    <div class="wonder-card-specs" style="margin-top: 12px;">
                        <div class="wonder-spec-row">
                            <span>Record / Spec:</span>
                            <strong>${item.record}</strong>
                        </div>
                        <div class="wonder-spec-row">
                            <span>Chronicle:</span>
                            <strong>${item.date}</strong>
                        </div>
                    </div>
                </div>
                <button type="button" class="wonder-card-action-btn" onclick="window.closeAntiqueModal && window.closeAntiqueModal(); window.triggerExtremeCategory && window.triggerExtremeCategory('${item.catKey}', ${item.idx})">
                    <span>🛰️</span> View Live Telemetry & Station Dials ↗
                </button>
            </div>
        `;
    }).join("");
}

// Window attachments for cross-scope access
window.openAntiqueModal = openAntiqueModal;
window.closeAntiqueModal = closeAntiqueModal;
window.toggleGlobalRecordsGrid = toggleGlobalRecordsGrid;
window.filterAntiqueModalGrid = filterAntiqueModalGrid;
window.selectExtremeCity = selectExtremeCity;
window.selectGeocodedCity = selectGeocodedCity;
window.hideSearchSuggestions = hideSearchSuggestions;

/* ================= 11. WEATHER DATA RETRIEVAL ================= */
function searchCurrentInput() {
    const input = document.getElementById("cityInput");
    if (!input) return;
    const rawVal = input.value.trim();
    if (!rawVal) {
        showError("Please enter a city or country, or try 'cold', 'hot', 'rain', 'snow', 'wind', 'alert'...");
        return;
    }

    // Check if query is an extreme or antique weather query
    const extremeMatch = detectExtremeOrAntiqueQuery(rawVal);
    if (extremeMatch) {
        hideSearchSuggestions();
        // NEVER autotype in search bar: keep input exactly as typed
        triggerExtremeCategory(extremeMatch.category, extremeMatch.index, false);
        return;
    }

    hideSearchSuggestions();
    fetchWeatherByCity(rawVal);
}

async function fetchWeatherByCity(city) {
    if (!city) return;

    // Route weather phenomenon keywords directly to their world record extreme locations
    // rather than geocoding to accidental matches like "Rain, Germany" or "Snow, Oklahoma"
    const extreme = detectExtremeOrAntiqueQuery(city);
    if (extreme) {
        triggerExtremeCategory(extreme.category, extreme.index, false);
        return;
    }

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

    // Searched Location Severe Alert & Antique Wonders Telemetry
    renderSearchedLocationPhenomena(title, data, currentLat, currentLon);

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
    initScrollDynamics();
    initSearchSuggestions();
    prefetchContenderLiveWeather();

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