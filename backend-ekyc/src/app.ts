import express from "express";
import cors from "cors";

const app = express();

// Global Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
