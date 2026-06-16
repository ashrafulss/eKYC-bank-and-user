import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import initiateRoutes from "./routes/routes.js";
import pool from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const PORT = process.env.PORT || 5000;

// ── MOUNT ALL ROUTES ────────────────────────────────────────
initiateRoutes(app);

// ──  GLOBAL ERROR HANDLER (must be after routes) ───────
app.use(notFoundHandler);
app.use(errorHandler);

// ── DATABASE HEALTH CHECK ────────────────────────────────────
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
  await checkDatabaseConnection();
});
