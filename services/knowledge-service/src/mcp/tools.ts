import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPool } from "../lib/db";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DOCS_DIR = join(process.cwd(), "docs");

/**
 * Creates a new stateless MCP server instance with all knowledge tools registered.
 */
export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "knowledge-mcp-server",
        version: "1.0.0",
    });

    // -------------------------------------------------
    // Tool: preference
    // Reads all uploaded .md knowledge files and returns
    // their concatenated content as context.
    // -------------------------------------------------
    server.registerTool(
        "preference",
        {
            title: "Agricultural Preference & Knowledge",
            description:
                "Retrieves context from uploaded agricultural knowledge .md files. Returns the full text content of all uploaded documents to provide greenhouse preferences and domain knowledge.",
            inputSchema: {
                topic: z
                    .string()
                    .optional()
                    .describe(
                        "Optional topic keyword to filter relevant documents",
                    ),
            },
        },
        async ({ topic }) => {
            const files = await readdir(DOCS_DIR);
            const mdFiles = files.filter((f) => f.endsWith(".md"));

            if (mdFiles.length === 0) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: "No knowledge documents have been uploaded yet.",
                        },
                    ],
                };
            }

            const sections: string[] = [];

            for (const file of mdFiles) {
                const content = await readFile(join(DOCS_DIR, file), "utf-8");
                // If a topic is provided, only include files that mention it
                if (
                    topic &&
                    !content.toLowerCase().includes(topic.toLowerCase())
                ) {
                    continue;
                }
                sections.push(`--- ${file} ---\n${content}`);
            }

            if (sections.length === 0) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `No documents found matching topic: "${topic}"`,
                        },
                    ],
                };
            }

            return {
                content: [{ type: "text" as const, text: sections.join("\n\n") }],
            };
        },
    );

    // -------------------------------------------------
    // Tool: sensor_history
    // Queries the TimescaleDB `telemetry` hypertable
    // for historical sensor readings.
    // -------------------------------------------------
    server.registerTool(
        "sensor_history",
        {
            title: "Sensor History",
            description:
                "Queries historical sensor telemetry data from TimescaleDB. Returns recent environmental and soil readings.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe("Filter by a specific device ID"),
                hours: z
                    .number()
                    .default(24)
                    .describe(
                        "Number of hours of history to retrieve (default: 24)",
                    ),
                limit: z
                    .number()
                    .default(50)
                    .describe(
                        "Maximum number of rows to return (default: 50)",
                    ),
            },
        },
        async ({ device_id, hours, limit }) => {
            let query = `
                SELECT
                    e.time,
                    e.device_id,
                    e.env_temperature,
                    e.env_humidity,
                    e.light_lux,
                    s.slave_id,
                    s.soil_temperature,
                    s.soil_humidity,
                    s.soil_ph,
                    s.soil_conductivity
                FROM env_telemetry e
                LEFT JOIN soil_telemetry s ON e.time = s.time AND e.device_id = s.device_id
                WHERE e.time >= NOW() - INTERVAL '${hours} hours'
            `;

            if (device_id) {
                params.push(device_id);
                query += ` AND e.device_id = $${params.length}`;
            }

            query += ` ORDER BY e.time DESC LIMIT ${limit}`;

            try {
                const result = await getPool().query(query, params);

                if (result.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `No sensor data found for the last ${hours} hours.`,
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error querying sensor history: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    // -------------------------------------------------
    // Tool: disease_log
    // Queries the PostgreSQL `disease_log` table.
    // -------------------------------------------------
    server.registerTool(
        "disease_log",
        {
            title: "Disease Log",
            description:
                "Retrieves plant disease classification results that have been saved to the database.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe("Filter by a specific device ID"),
                days: z
                    .number()
                    .default(7)
                    .describe(
                        "Number of days of history to retrieve (default: 7)",
                    ),
                limit: z
                    .number()
                    .default(10)
                    .describe(
                        "Maximum number of rows to return (default: 10)",
                    ),
            },
        },
        async ({ device_id, days, limit }) => {
            let query = `
                SELECT
                    id,
                    time,
                    device_id,
                    disease_name
                FROM disease_log
                WHERE time >= NOW() - INTERVAL '${days} days'
            `;

            const params: string[] = [];
            if (device_id) {
                params.push(device_id);
                query += ` AND device_id = $${params.length}`;
            }

            query += ` ORDER BY time DESC LIMIT ${limit}`;

            try {
                const result = await getPool().query(query, params);

                if (result.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `No disease classifications found in the last ${days} days.`,
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error querying disease log: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    // -------------------------------------------------
    // Tool: latest_sensor_data
    // Queries the TimescaleDB `telemetry` hypertable
    // for the absolute latest sensor reading.
    // -------------------------------------------------
    server.registerTool(
        "latest_sensor_data",
        {
            title: "Latest Sensor Data",
            description:
                "Retrieves the most recent sensor telemetry reading from TimescaleDB. Returns the absolute latest environmental and soil data snapshot.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe(
                        "Optional device ID to get the latest reading for a specific device",
                    ),
            },
        },
        async ({ device_id }) => {
            let query = `
                SELECT
                    e.time,
                    e.device_id,
                    e.env_temperature,
                    e.env_humidity,
                    e.light_lux,
                    s.slave_id,
                    s.soil_temperature,
                    s.soil_humidity,
                    s.soil_ph,
                    s.soil_conductivity
                FROM env_telemetry e
                LEFT JOIN soil_telemetry s ON e.time = s.time AND e.device_id = s.device_id
            `;

            const params: string[] = [];
            if (device_id) {
                params.push(device_id);
                query += ` WHERE e.device_id = $${params.length}`;
            }

            // Since there can be multiple slaves, limiting to 5 rows will grab the latest env and its associated soil sensors
            query += ` ORDER BY e.time DESC LIMIT 5`;

            try {
                const result = await getPool().query(query, params);

                if (result.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: device_id
                                    ? `No telemetry data found for device: ${device_id}.`
                                    : "No telemetry data found in the database.",
                            },
                        ],
                    };
                }

                // Group results by device_id and time to format nicely for the LLM
                const latestReadings: any[] = [];
                let currentEnv: any = null;
                
                for (const row of result.rows) {
                    if (!currentEnv || currentEnv.time.getTime() !== row.time.getTime()) {
                        currentEnv = {
                            time: row.time,
                            device_id: row.device_id,
                            env_temperature: row.env_temperature,
                            env_humidity: row.env_humidity,
                            light_lux: row.light_lux,
                            soil_sensors: []
                        };
                        latestReadings.push(currentEnv);
                    }
                    if (row.slave_id) {
                        currentEnv.soil_sensors.push({
                            slave_id: row.slave_id,
                            temperature: row.soil_temperature,
                            humidity: row.soil_humidity,
                            ph: row.soil_ph,
                            ec: row.soil_conductivity
                        });
                    }
                }

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(latestReadings[0], null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error querying latest sensor data: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    // -------------------------------------------------
    // Tool: weather_forecast
    // Fetches weather forecast from OpenWeatherMap API
    // using latitude and longitude coordinates.
    // -------------------------------------------------
    server.registerTool(
        "weather_forecast",
        {
            title: "Weather Forecast",
            description:
                "Fetches weather forecast data from OpenWeatherMap using geographic coordinates (latitude and longitude). Provides external environmental context for agricultural decision-making.",
            inputSchema: {
                lat: z
                    .string()
                    .describe("Latitude coordinate of the location")
                    .default("-6.92526061593066"),
                lon: z
                    .string()
                    .describe("Longitude coordinate of the location")
                    .default("107.77446392772714"),
            },
        },

        async ({ lat, lon }) => {
            const apiKey = process.env.OPENWEATHERMAP_API_KEY;

            if (!apiKey) {
                return {
                    content: [{ type: "text", text: "API Key missing." }],
                    isError: true,
                };
            }

            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    return {
                        content: [{ type: "text", text: `API Error: ${response.status}` }],
                        isError: true,
                    };
                }

                const data: any = await response.json();

                // --- PROSES FILTERING DATA ---
                const simplifiedForecast = data.list.map((item: any) => ({
                    dt_txt: item.dt_txt,
                    temp: item.main.temp,
                    humidity: item.main.humidity,
                    pop: item.pop, // Probability of Precipitation
                    description: item.weather?.description,
                }));

                return {
                    content: [
                        {
                            type: "text" as const,
                            // Mengirimkan hasil filter yang lebih ramping
                            text: JSON.stringify({
                                city: data.city?.name,
                                forecast: simplifiedForecast
                            }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error: ${String(error)}` }],
                    isError: true,
                };
            }
        },
    );

    return server;
}
