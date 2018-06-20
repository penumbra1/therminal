const http = require("http");
const publicIp = require("public-ip");
const api = require("./api.json");

const host = "dataservice.accuweather.com";

const getLocation = ip => {
  const ipOptions = {
    hostname: host,
    path: `/locations/v1/cities/ipaddress?apikey=${api.key}&q=${ip}`
  };

  return new Promise((resolve, reject) => {
    http
      .get(ipOptions, res => {
        res.on("data", d => {
          const location = JSON.parse(d.toString("utf8"));
          if (!location) {
            reject(
              new Error("My spies are asleep! No location data received...")
            );
          } else if (
            res.statusCode !== 200 ||
            !location.Key ||
            !location.EnglishName
          ) {
            reject(
              new Error(
                `My spies couldn't spot your location: ${res.statusMessage}`
              )
            );
          } else {
            resolve({ code: location.Key, city: location.EnglishName });
          }
        });
      })
      .on("error", e => {
        reject(new Error(`Failed to send your IP to my spies... ${e.message}`));
      });
  });
};

const getWeather = (geoCode, city) => {
  const weatherOptions = {
    hostname: host,
    path: `/currentconditions/v1/${geoCode}?apikey=${api.key}`
  };
  return new Promise((resolve, reject) => {
    http
      .get(weatherOptions, res => {
        res.on("data", d => {
          const weather = JSON.parse(d.toString("utf8"));
          if (!weather) {
            reject(
              new Error(
                "Looks like the weatherman is drunk! No data received..."
              )
            );
          } else if (res.statusCode !== 200) {
            reject(new Error(`The weatherman said: ${res.statusMessage}`));
          } else {
            resolve({
              city,
              desc: weather[0].WeatherText.toLowerCase(),
              temp: weather[0].Temperature.Metric.Value
            });
          }
        });
      })
      .on("error", e => {
        reject(
          new Error(
            `Failed to send your request to the weatherman... ${e.message}`
          )
        );
      });
  });
};

const printForecast = ({ city, desc, temp }) => {
  console.log(`It's ${desc} and ${temp}°C in ${city}`);
};

publicIp
  .v4()
  .then(ipv4 => getLocation(ipv4))
  .then(({ code, city }) => getWeather(code, city))
  .then(data => printForecast(data))
  .catch(e => console.error("Oops!", e));
