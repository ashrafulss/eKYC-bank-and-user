import pg from "pg";

const pool = new pg.Pool({
  // Fallback to 'postgres_second' (your docker service name) instead of 'localhost'
  host: process.env.DB_HOST || "postgres_second",

  // Inside the docker network, containers talk on the internal port 5432
  port: Number(process.env.DB_PORT) || 5432,

  database: process.env.DB_NAME || "ekyc",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "sa",

  // Production pool limits
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log(" [Database]: PostgreSQL client connected successfully.");
});

pool.on("error", (err: Error) => {
  console.error(" [Database Error]: Pool connection broke down:", err.message);
});

export default pool;
