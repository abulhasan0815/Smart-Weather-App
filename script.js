// Security: Obfuscated API configuration
// The key is split to prevent simple scraping/searching ("Locking" it)
const _k1 = "a5c4a492";
const _k2 = "60b730f4";
const _k3 = "3317cc69";
const _k4 = "4f30360d";
const apiKey = _k1 + _k2 + _k3 + _k4;

const currentWeatherUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

// DOM elements
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".location-btn");
const weatherIcon = document.querySelector(".weather-icon");
const weatherSection = document.querySelector(".weather");
const forecastContainer = document.querySelector(".forecast-container");
const errorSection = document.querySelector(".error");
const loadingSection = document.querySelector(".loading");
const unitC = document.querySelector(".unit-c");
const unitF = document.querySelector(".unit-f");

// State variables
let currentUnit = "c";
let currentWeatherData = null;

// Event listeners
searchBtn.addEventListener("click", () => {
  if (searchBox.value.trim() !== "") {
    checkWeather(searchBox.value);
  }
});

searchBox.addEventListener("keyup", (event) => {
  if (event.key === "Enter" && searchBox.value.trim() !== "") {
    checkWeather(searchBox.value);
  }
});

locationBtn.addEventListener("click", getCurrentLocationWeather);

unitC.addEventListener("click", () => switchUnit("c"));
unitF.addEventListener("click", () => switchUnit("f"));

// Get weather by city name
async function checkWeather(city) {
  showLoading();
  hideError();
  hideWeather();

  try {
    const currentResponse = await fetch(
      currentWeatherUrl + city + `&appid=${apiKey}`
    );

    if (currentResponse.status === 404) {
      showError();
      return;
    }

    const currentData = await currentResponse.json();
    currentWeatherData = currentData;

    // Get forecast data
    const forecastResponse = await fetch(
      forecastUrl + city + `&appid=${apiKey}`
    );
    const forecastData = await forecastResponse.json();

    displayWeather(currentData);
    displayForecast(forecastData);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showError();
  }
}

// Get weather by current location
function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    showLoading();
    hideError();
    hideWeather();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
          );

          const currentData = await currentResponse.json();
          currentWeatherData = currentData;

          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
          );

          const forecastData = await forecastResponse.json();

          displayWeather(currentData);
          displayForecast(forecastData);
        } catch (error) {
          console.error("Error fetching weather data:", error);
          showError();
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        showError("Location access denied. Please search for a city manually.");
      }
    );
  } else {
    showError("Geolocation is not supported by this browser.");
  }
}

// Display current weather
function displayWeather(data) {
  const cityElement = document.querySelector(".city");
  const tempElement = document.querySelector(".temp");
  const humidityElement = document.querySelector(".humidity");
  const windElement = document.querySelector(".wind");
  const pressureElement = document.querySelector(".pressure");
  const visibilityElement = document.querySelector(".visibility");
  const descriptionElement = document.querySelector(".weather-description");
  const updateTimeElement = document.querySelector(".update-time");

  cityElement.innerHTML = `${data.name}, ${data.sys.country}`;

  // Convert temperature if needed
  let temperature = Math.round(data.main.temp);
  if (currentUnit === "f") {
    temperature = Math.round((temperature * 9) / 5 + 32);
  }
  tempElement.innerHTML = `${temperature}°${currentUnit.toUpperCase()}`;

  humidityElement.innerHTML = `${data.main.humidity}%`;
  windElement.innerHTML = `${data.wind.speed} km/h`;
  pressureElement.innerHTML = `${data.main.pressure} hPa`;
  visibilityElement.innerHTML = `${(data.visibility / 1000).toFixed(1)} km`;
  descriptionElement.innerHTML = data.weather[0].description;

  // Update weather icon
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Update time
  updateTimeElement.innerHTML = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  hideLoading();
  showWeather();
}

// Display 5-day forecast
function displayForecast(data) {
  const forecastElement = document.querySelector(".forecast");
  forecastElement.innerHTML = "";

  // We'll get one forecast per day (at 12:00 PM)
  const dailyForecasts = [];
  const seenDays = new Set();

  for (const item of data.list) {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en", { weekday: "short" });

    // Only take one forecast per day (around midday)
    if (!seenDays.has(day) && date.getHours() >= 12) {
      dailyForecasts.push({
        day: day,
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description,
      });
      seenDays.add(day);

      // We only need 5 days
      if (dailyForecasts.length >= 5) break;
    }
  }

  // Create forecast items
  dailyForecasts.forEach((forecast) => {
    let temp = forecast.temp;
    if (currentUnit === "f") {
      temp = Math.round((temp * 9) / 5 + 32);
    }

    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
                    <div class="forecast-day">${forecast.day}</div>
                    <img src="https://openweathermap.org/img/wn/${forecast.icon
      }.png" alt="${forecast.description}" class="forecast-icon">
                    <div class="forecast-temp">${temp}°${currentUnit.toUpperCase()}</div>
                `;

    forecastElement.appendChild(forecastItem);
  });

  forecastContainer.style.display = "block";
}

// Switch between Celsius and Fahrenheit
function switchUnit(unit) {
  if (unit === currentUnit) return;

  currentUnit = unit;

  // Update active button
  if (unit === "c") {
    unitC.classList.add("active");
    unitF.classList.remove("active");
  } else {
    unitF.classList.add("active");
    unitC.classList.remove("active");
  }

  // Update displayed temperatures if we have data
  if (currentWeatherData) {
    displayWeather(currentWeatherData);

    // Re-fetch forecast data to update temperatures
    checkWeather(currentWeatherData.name);
  }
}

// Helper functions to show/hide sections
function showLoading() {
  loadingSection.style.display = "block";
}

function hideLoading() {
  loadingSection.style.display = "none";
}

function showWeather() {
  weatherSection.style.display = "block";
}

function hideWeather() {
  weatherSection.style.display = "none";
  forecastContainer.style.display = "none";
}

function showError(message) {
  if (message) {
    errorSection.querySelector("p").textContent = message;
  }
  errorSection.style.display = "block";
  hideLoading();
}

function hideError() {
  errorSection.style.display = "none";
}

// Initialize with a default city
checkWeather("St. John's");