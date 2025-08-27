// --- Element Selection ---
const searchBox = document.querySelector(".search-box");
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const suggestionsContainer = document.getElementById("suggestions-container");

const loadingSpinner = document.querySelector(".loading-spinner");
const errorMessage = document.querySelector(".error-message");
const weatherContent = document.querySelector(".weather-content");
const recentSearchesContainer = document.querySelector(".recent-searches-container");

const cityNameEl = document.querySelector(".city-name");
const dateEl = document.querySelector(".date");
const weatherIconEl = document.querySelector(".weather-icon");
const temperatureEl = document.querySelector(".temperature");
const descriptionEl = document.querySelector(".weather-description");
const feelsLikeEl = document.querySelector(".feels-like");
const humidityEl = document.querySelector(".humidity");
const windSpeedEl = document.querySelector(".wind-speed");
const forecastContainer = document.querySelector(".forecast-container");

const chartCanvas = document.getElementById('temperatureChart').getContext('2d');

// --- API Configuration ---
const openWeatherApiKey = "5012ee5430e349dfb97c0115b4d66328"; // Your OpenWeatherMap API key
const openWeatherApiBaseUrl = "https://api.openweathermap.org/data/2.5";

// --- Geoapify API Configuration ---
const geoapifyApiKey = "da3dd2bc68fe4365bf3d24806823969c"; 
const geoapifyApiBaseUrl = "https://api.geoapify.com/v1/geocode";

// --- State Management ---
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let tempChart = null;

// --- UI Helper Functions ---
const showSpinner = () => loadingSpinner.classList.remove('hidden');
const hideSpinner = () => loadingSpinner.classList.add('hidden');
const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    hideSpinner();
};
const hideError = () => {
    errorMessage.classList.add('hidden');
    weatherContent.classList.remove('hidden');
};

// --- Data Fetching ---
async function fetchWeatherData(city) {
    hideError();
    showSpinner();
    const currentWeatherUrl = `${openWeatherApiBaseUrl}/weather?q=${city}&appid=${openWeatherApiKey}&units=metric`;
    const forecastUrl = `${openWeatherApiBaseUrl}/forecast?q=${city}&appid=${openWeatherApiKey}&units=metric`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        if (!currentWeatherResponse.ok) {
            throw new Error(`Could not fetch weather for ${city}. Check city name.`);
        }
         if (!forecastResponse.ok) {
            throw new Error(`Could not fetch forecast for ${city}.`);
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        updateCurrentWeatherUI(currentWeatherData);
        updateForecastUI(forecastData);
        renderTemperatureChart(forecastData); // This will now work
        saveSearch(city);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideSpinner();
    }
}

async function fetchWeatherDataByCoords(lat, lon) {
    hideError();
    showSpinner();
    const currentWeatherUrl = `${openWeatherApiBaseUrl}/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`;
    const forecastUrl = `${openWeatherApiBaseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl),
        ]);

        if (!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error("Could not fetch weather data for your location.");
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        updateCurrentWeatherUI(currentWeatherData);
        updateForecastUI(forecastData);
        renderTemperatureChart(forecastData);

    } catch (error) {
        showError(error.message);
    } finally {
        hideSpinner();
    }
}


// --- UI Update Functions ---
function updateCurrentWeatherUI(data) {
    cityNameEl.textContent = data.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
    descriptionEl.textContent = data.weather[0].description;
    feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${data.wind.speed} km/h`;
}

function updateForecastUI(data) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(forecast => {
        const card = document.createElement('div');
        card.classList.add('forecast-card');
        const dayOfWeek = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        card.innerHTML = `
            <p class="day">${dayOfWeek}</p>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="Weather Icon" class="forecast-icon">
            <p class="forecast-temp">${Math.round(forecast.main.temp)}°C</p>
        `;
        forecastContainer.appendChild(card);
    });
}

// --- CORRECTED CHART RENDERING FUNCTION ---
function renderTemperatureChart(data) {
    if (tempChart) {
        tempChart.destroy();
    }

    const hourlyData = data.list.slice(0, 8);
    const labels = hourlyData.map(item => new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }));
    const temperatures = hourlyData.map(item => item.main.temp);

    tempChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C) for next 24h',
                data: temperatures,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                tension: 0.3,
                fill: true,
            }]
        },
        // --- THIS OPTIONS OBJECT WAS MISSING IN THE PREVIOUS CODE ---
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { color: '#fff' }, // White text for Y-axis labels
                    grid: { color: 'rgba(255, 255, 255, 0.2)' } // Light grid lines
                },
                x: {
                    ticks: { color: '#fff' }, // White text for X-axis labels
                    grid: { color: 'rgba(255, 255, 255, 0.2)' } // Light grid lines
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff' } // White text for legend
                }
            }
        }
    });
}

// --- Local Storage & Recent Searches ---
function saveSearch(city) {
    const normalizedCity = city.toLowerCase();
    if (!recentSearches.includes(normalizedCity)) {
        recentSearches.unshift(normalizedCity);
        if (recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        renderRecentSearches();
    }
}

function renderRecentSearches() {
    recentSearchesContainer.innerHTML = '';
    recentSearches.forEach(city => {
        const btn = document.createElement('button');
        btn.classList.add('recent-search-btn');
        btn.textContent = city.charAt(0).toUpperCase() + city.slice(1);
        btn.addEventListener('click', () => fetchWeatherData(city));
        recentSearchesContainer.appendChild(btn);
    });
}

// Function to handle the final search with auto-correction
async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) return;

    suggestionsContainer.innerHTML = '';
    showSpinner();
    
    const searchUrl = `${geoapifyApiBaseUrl}/search?text=${city}&limit=1&apiKey=${geoapifyApiKey}`;
    
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error("City verification failed. Check API key.");
        }
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const correctedCity = data.features[0].properties.city;
            fetchWeatherData(correctedCity);
        } else {
            showError("City not found. Please check the spelling and try again.");
        }
    } catch (error) {
        showError(error.message);
    }

    searchInput.value = '';
}

// Display city suggestions as the user types
function displaySuggestions(features) {
    suggestionsContainer.innerHTML = '';
    if (features && features.length > 0) {
        features.forEach(feature => {
            const div = document.createElement('div');
            div.classList.add('suggestion-item');
            div.textContent = feature.properties.formatted;
            div.addEventListener('click', () => {
                const city = feature.properties.city;
                searchInput.value = '';
                suggestionsContainer.innerHTML = '';
                fetchWeatherData(city);
            });
            suggestionsContainer.appendChild(div);
        });
    }
}

// --- Event Listeners ---
searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

searchInput.addEventListener('input', async () => {
    const text = searchInput.value.trim();
    if (text.length < 3) {
        suggestionsContainer.innerHTML = '';
        return;
    }

    const autocompleteUrl = `${geoapifyApiBaseUrl}/autocomplete?text=${text}&apiKey=${geoapifyApiKey}`;
    try {
        const response = await fetch(autocompleteUrl);
        if (!response.ok) {
           console.error("Autocomplete API error. Check your API key.");
           return;
        }
        const data = await response.json();
        displaySuggestions(data.features);
    } catch (error) {
        console.error("Autocomplete request failed:", error);
    }
});

document.addEventListener('click', (event) => {
    if (!searchBox.contains(event.target)) {
        suggestionsContainer.innerHTML = '';
    }
});

// --- Initial App Load ---
function initializeApp() {
    renderRecentSearches();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherDataByCoords(latitude, longitude);
        },
        (error) => {
            console.error("Geolocation error:", error);
            const lastSearch = recentSearches.length > 0 ? recentSearches[0] : "Hyderabad";
            fetchWeatherData(lastSearch);
        }
    );
}

initializeApp();
