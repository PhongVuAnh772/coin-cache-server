import express from "express";
import priceRoutes from "./routes/routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/app", priceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
