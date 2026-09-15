import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/index.js"; //this is hwere all routes are imported and used
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use("/api", apiRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;


//if needed then uncomment and put there up in the code

// Root endpoint
// app.use("*", (req, res) => {
//   res.status(404).json({ error: "Endpoint notfound", message: `The requested / ${req.originalUrl} not exists`,
//     availableEndpoints: "/api", });
// });
// const NODE_ENV = process.env.NODE_ENV || "development";

// Securitt middleware
// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" },}) );

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests
//   message: {error: "Too many requests", message: "Please try again later"},
// });
// app.use(limiter);

// // CORS usage
// app.use(cors({origin: NODE_ENV === "production" , credentials: true })
// );