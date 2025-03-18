const config = require("./config.js");
const os = require("os");

let latency = 0;
let requests = {};
let authSuccess = 0;
let authFail = 0;

//HTTP Requests
function getRequests() {
  return (req, res, next) => {
    requests[req.method] = (requests[req.method] || 0) + 1;
    next();
  };
}

//Authentication Requests
function authenticationRequests(status) {
    status == true ? authSuccess += 1 : authFail += 1;
}

//CPU Usage
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

//Memory Usage
function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

setInterval(() => {
  // HTTP requests by method/minute
  Object.keys(requests).forEach((method) => {
    sendMetricToGrafana("requests", requests[method], "sum", "1", {method});
  });

  //Authentication per minute
  sendMetricToGrafana("auth_success", authSuccess, "sum", "1");
  sendMetricToGrafana("auth_fail", authFail, "sum", "1");

  //CPU Usage
  sendMetricToGrafana("cpu", getCpuUsagePercentage(), "gauge", "%");
  // Memory Usage
  sendMetricToGrafana("memory", getMemoryUsagePercentage(), "gauge", "%");

}, 60000);

function sendMetricToGrafana(
  metricName,
  metricValue,
  type,
  unit,
  attributes = {}
) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: unit,
                [type]: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: Object.entries(attributes).map(
                        ([key, value]) => ({
                          key,
                          value: { stringValue: value.toString() },
                        })
                      ),
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (type === "sum") {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].aggregationTemporality = "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].isMonotonic = true;
  }

  const body = JSON.stringify(metric);
  fetch(`${config.metrics.url}`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(
            `Failed to push metrics data to Grafana: ${text}\n${body}`
          );
        });
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

module.exports = {
  getRequests,
  authenticationRequests
};
