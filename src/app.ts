import express from "express";
import identifyRoute from "./routes/identify.route";

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).send("Bitespeed Identity Reconciliation API is running perfectly!");
});

app.use("/identify", identifyRoute);

export default app;