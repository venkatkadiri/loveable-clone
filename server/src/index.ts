import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api";
import { env } from "./config/env";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

const port = env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
