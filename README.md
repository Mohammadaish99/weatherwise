# 🌦️ WeatherWise — Real-Time Weather Web App

A modern, responsive, real-time weather web application providing accurate forecasts, 7-day outlooks, UV Index, precipitation chance, sunrise & sunset times, and instant GPS location detection for any city on Earth.

Built with pure **HTML5, CSS3, and modern JavaScript (Vanilla)** — zero build tools or complicated setups needed. Data powered by the free, open **Open-Meteo API**.

---

## ✨ Features

- 🌍 **Global City Search**: Instant search for any city, state, or country worldwide.
- 📍 **GPS Geolocation**: 1-click "Use My Current Location" with automatic reverse-geocoding.
- 📅 **Live 7-Day Outlook**: Dynamic daily forecast with condition icons, high/low temperatures, and rain probability.
- 🌡️ **°C / °F Unit Toggle**: Seamless switching between Metric (°C, km/h) and Imperial (°F, mph) with local storage memory.
- ☀️ **Rich Weather Metrics**:
  - Feels Like Temperature
  - Humidity Percentage
  - Wind Speed
  - UV Index with health classification (Low, Moderate, High, etc.)
  - Precipitation probability
  - Sunrise & Sunset schedule
  - Surface Air Pressure
  - Automatic Timezone detection
- 🌙 **Dark & Light Mode**: Built-in glassmorphism theme with automatic system preference detection and persistent preference.
- 📱 **Mobile & PWA Ready**: Installable on Android, iPhone, Windows, and macOS homescreens.

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
