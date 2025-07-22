// --- Element Selection ---
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const cityNameEl = document.querySelector(".city-name");
const dateEl = document.querySelector(".date");
const weatherIconEl = document.querySelector(".weather-icon");
const temperatureEl = document.querySelector(".temperature");
const descriptionEl = document.querySelector(".weather-description");
const feelsLikeEl = document.querySelector(".feels-like");
const humidityEl = document.querySelector(".humidity");
const windSpeedEl = document.querySelector(".wind-speed");

// --- API Configuration ---
const apiKey = "YOUR_API_KEY_HERE"; // Replace with your OpenWeatherMap API key
const apiBaseUrl = "https://api.openweathermap.org/data/2.5/weather";

// --- Functions ---

// Function to fetch weather data
async function getWeatherData(city) {
    try {
        const url = `${apiBaseUrl}?q=${city}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        updateWeatherUI(data);

    } catch (error) {
        console.error("Could not fetch weather data:", error);
        alert("Could not find city. Please try again.");
    }
}

// Function to update the UI with weather data
function updateWeatherUI(data) {
    cityNameEl.textContent = data.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
    descriptionEl.textContent = data.weather[0].description;
    feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${data.wind.speed} km/h`;
}

// --- Event Listeners ---

// Event listener for the search button click
searchButton.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

// Event listener for the Enter key press in the input field
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

// --- Initial Load ---
// Load default weather data for a city when the page opens
getWeatherData("Hyderabad");
