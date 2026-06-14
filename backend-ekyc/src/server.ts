import dotenv from "dotenv";
import app from "./app.js";
import initiateRoutes from "./routes/routes.js";
import pool from "./config/db.js"; //  Import your pool configuration here

dotenv.config();

const PORT = process.env.PORT || 5000;

initiateRoutes(app);

// Test database connection pool health immediately on startup
async function checkDatabaseConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log(
      `[Database]: Connection handshake verified at: ${res.rows[0].now}`,
    );
  } catch (err: any) {
    console.error(
      "[Database]: Startup handshake failed! Check your credentials.",
    );
    console.error(err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`[Server]: Operating perfectly on port ${PORT}`);
  await checkDatabaseConnection(); // Run the database verification check
});
