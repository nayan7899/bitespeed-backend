import express from "express";
import identifyRoute from "./routes/identify.route";
import path from "path/win32";

const app = express();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.get("/", (req, res) => {
  res.status(200).send("Bitespeed Identity Reconciliation API is running perfectly!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "API is active and running!" });
});

app.use("/identify", identifyRoute);

export default app;