
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");

const weatherContent = document.getElementById("weatherContent");
const forecastContainer = document.getElementById("forecastContainer");

const weatherCodes = {
    0: ["☀️", "Clear Sky"],
    1: ["🌤️", "Mainly Clear"],
    2: ["⛅", "Partly Cloudy"],
    3: ["☁️", "Overcast"],
    45: ["🌫️", "Fog"],
    48: ["🌫️", "Depositing Rime Fog"],
    51: ["🌦️", "Light Drizzle"],
    53: ["🌦️", "Moderate Drizzle"],
    55: ["🌧️", "Heavy Drizzle"],
    61: ["🌧️", "Light Rain"],
    63: ["🌧️", "Moderate Rain"],
    65: ["🌧️", "Heavy Rain"],
    71: ["🌨️", "Light Snow"],
    73: ["❄️", "Moderate Snow"],
    75: ["❄️", "Heavy Snow"],
    80: ["🌦️", "Rain Showers"],
    81: ["🌧️", "Moderate Showers"],
    82: ["⛈️", "Heavy Showers"],
    95: ["⛈️", "Thunderstorm"],
    96: ["⛈️", "Thunderstorm with Hail"],
    99: ["⛈️", "Heavy Thunderstorm"]
};

function getWeather(code) {
    return weatherCodes[code] || ["🌤️", "Unknown Weather"];
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = type;
}

async function getWeatherData() {

    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name!", "error");
        weatherContent.hidden = true;
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    showMessage("Fetching weather data...");
    weatherContent.hidden = true;

    try {

        // Get city coordinates

        const geoUrl = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoUrl.search = new URLSearchParams({
            name: city,
            count: "1",
            language: "en",
            format: "json"
        });

        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error("Unable to search city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        // Fetch current weather and 5-day forecast

        const weatherUrl = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherUrl.search = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            timezone: "auto",
            forecast_days: "5"
        });

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch weather data.");
        }

        const weatherData = await weatherResponse.json();

        displayCurrentWeather(location, weatherData);
        displayForecast(weatherData);

        weatherContent.hidden = false;
        showMessage("Weather updated successfully!");

    } catch (error) {

        showMessage(error.message || "Something went wrong. Please try again.", "error");
        weatherContent.hidden = true;

    } finally {

        searchBtn.disabled = false;
        searchBtn.textContent = "Search";

    }
}

// Display current weather

function displayCurrentWeather(location, data) {

    const current = data.current;
    const weather = getWeather(current.weather_code);

    document.getElementById("cityName").textContent =
        `${location.name}, ${location.country}`;

    document.getElementById("currentDate").textContent =
        new Intl.DateTimeFormat("en-IN", {
            dateStyle: "full",
            timeZone: data.timezone
        }).format(new Date());

    document.getElementById("weatherIcon").textContent = weather[0];

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("weatherDescription").textContent =
        weather[1];

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("windSpeed").textContent =
        `${current.wind_speed_10m} km/h`;
}

// Display 5-day forecast

function displayForecast(data) {

    forecastContainer.innerHTML = "";

    const daily = data.daily;

    daily.time.forEach((date, index) => {

        const weather = getWeather(daily.weather_code[index]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        const dateElement = document.createElement("h3");
        dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
            weekday: "short",
            timeZone: data.timezone
        }).format(new Date(`${date}T12:00:00`));

        const iconElement = document.createElement("div");
        iconElement.className = "forecast-icon";
        iconElement.textContent = weather[0];

        const description = document.createElement("p");
        description.textContent = weather[1];
        description.style.fontSize = "11px";
        description.style.color = "#64748b";
        description.style.marginBottom = "10px";

        const maxTemp = document.createElement("p");
        maxTemp.className = "max-temp";
        maxTemp.textContent =
            `${Math.round(daily.temperature_2m_max[index])}°C`;

        const minTemp = document.createElement("p");
        minTemp.className = "min-temp";
        minTemp.textContent =
            `${Math.round(daily.temperature_2m_min[index])}°C`;

        const rain = document.createElement("p");
        rain.className = "rain";
        rain.textContent =
            `Rain: ${daily.precipitation_probability_max[index] ?? 0}%`;

        card.append(
            dateElement,
            iconElement,
            description,
            maxTemp,
            minTemp,
            rain
        );

        forecastContainer.appendChild(card);

    });
}

// Search button event

searchBtn.addEventListener("click", getWeatherData);

// Enter key event

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        getWeatherData();
    }

});
