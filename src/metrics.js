const config = require('./config.js');
const os = require("os");

let latency = 0;
let requests = {};

function getRequests() {
  return (req, res, next) => {
    requests[req.method] = (requests[req.method] || 0) + 1;
    next();
  };
}

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

// setInterval(() => {
//   // HTTP requests by method/minute
//   Object.keys(requests).forEach((method) => {
//     sendMetricToGrafana("requests", requests[method], "sum", "1", {method});
//   });

//   //CPU Usage
//   sendMetricToGrafana("cpu", getCpuUsagePercentage(), "gauge", "%");
//   // Memory Usage
//   sendMetricToGrafana("memory", getMemoryUsagePercentage(), "gauge", "%");

// //   latency += Math.floor(Math.random() * 200) + 1;
// //   sendMetricToGrafana("latency", latency, "sum", "ms");
// }, 10000);

function sendMetricToGrafana(metricName, metricValue, type, unit, attributes = {}) {
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
};
