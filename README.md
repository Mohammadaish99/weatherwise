# 🌦️ WeatherWise 3D — Real-Time Atmospheric Station & Celestial Planetarium

A luxury, real-time weather web application and astronomical observatory providing high-fidelity meteorological telemetry, precision rotating wind compass, barometric pressure gauge, astronomical moon phase tracking, 24-hour continuous timeline, and an interactive 3D Universe Cosmos background with depth-travel scrolling.

🔗 **Live Deployment**: [https://mohammadaish99.github.io/weatherwise/](https://mohammadaish99.github.io/weatherwise/)

---

## ✨ Features

- 🌕 **Astronomical Moon Phase Engine**:
  - Precision synodic cycle calculation (29.53-day orbit) for today and tomorrow.
  - Plain-English lunar classifications: **Full Moon**, **Half Moon** (First/Last Quarter), **No Moon** (New Moon), **Waxing/Waning Gibbous**, and **Crescent Moon**.
  - Displays illumination percentage, moon age, and countdown to the next major phase.
  - Interactive 3D Moon celestial orbiter in the Horizon Dome stage.
- 🌌 **3D Universe Cosmos & Depth-Travel Scrolling**:
  - Multi-depth starfield with realistic circular glowing halos (`createStarTexture()`) and astronomical color spectrum (Sirius Diamond Cyan, Betelgeuse Amber/Gold, Pleiades Violet, Rigel Sapphire, Vega White).
  - Floating cosmic nebula dust clouds and axial lunar orbit rotation.
  - Smooth universe-travel scrolling: as you scroll down the page, the camera navigates forward into deep space.
- 🧭 **3D Rotating Wind Compass**: Smooth directional needle pointing to true wind bearing with live gusts and wind speed telemetry.
- 📊 **Precision Barometric Pressure Gauge**: Live atmospheric pressure (hPa), standard ATM elevation, and trend analysis.
- ⏳ **24-Hour Continuous Timeline**: Hour-by-hour forecast breakdown for **Today** and **Tomorrow** with horizontal carousel and detailed telemetry table.
- 🎨 **Award-Winning Day & Night Palettes**:
  - **Day Mode**: Crystalline morning sky gradient, ultra-clean frosted glass with sky-blue accents, and sparkling solar gold sunbeams.
  - **Night Mode**: Deep space nebula void, obsidian starlight glass, and electric cyan/violet highlights.
- 📱 **Flawless Mobile Phone Responsiveness**: 100% optimized for iPhone, Android, and tablets down to 360px screens with zero horizontal overflow.
- 👤 **Account & Special Cities Drawer**: Client-side Google Sign-In and local account manager to favorite Home, Work, and Vacation cities.
- 🌍 **Global City Search & GPS**: Instant city search + 1-click "Use My Current Location" with automatic reverse geocoding.

---

## 🚀 How to Get Your Free Domain & Live Hosting (100% Free Forever)

Here are the 3 simplest, completely free methods to launch WeatherWise live on the internet with a free domain and free SSL (HTTPS):

### Method 1: Netlify Drop (Easiest — 30 Seconds, No Code)
1. Open [Netlify Drop](https://app.netlify.com/drop) in your browser.
2. Drag and drop your **`WeatherWise`** folder directly into the browser window.
3. Your site is instantly live! Netlify will give you a free domain URL like:
   `https://random-name.netlify.app`
4. *(Optional)* Click **Site configuration** > **Change site name** to rename it to something custom like:
   `https://weatherwise-app.netlify.app`

---

### Method 2: Vercel (Instant CLI or Git)
1. Open PowerShell or Terminal in the `WeatherWise` folder:
   ```bash
   npx vercel
   ```
2. Press Enter to confirm the defaults.
3. Log in via email or GitHub.
4. Your site will immediately be live on a free edge-network domain:
   `https://weatherwise.vercel.app`

---

### Method 3: GitHub Pages (Direct from GitHub)
1. Create a free account on [GitHub.com](https://github.com) if you don't already have one.
2. Create a new repository named `weatherwise`.
3. In PowerShell, link and push your repository:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/weatherwise.git
   git branch -M main
   git push -u origin main
   ```
4. Go to your repository **Settings** > **Pages**.
5. Under **Build and deployment** > **Source**, choose **Deploy from a branch**, select `main` (or `master`), and click **Save**.
6. Within 1 minute, your app is live for everyone at:
   `https://<YOUR-USERNAME>.github.io/weatherwise/`

---

## 💻 Running Locally on Your Computer

Simply double-click `index.html` to open it in any web browser (Chrome, Edge, Firefox, Safari).

Or run a local development server with Node:
```bash
npx serve .
```

---

## 📄 License
MIT License. Free to use, modify, and distribute!
