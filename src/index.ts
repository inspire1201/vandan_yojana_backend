import express from "express";

import fileUpload from "express-fileupload";

import cors from "cors";

import prisma from "./prisma.js";  

import { authRoute } from "./router/auth.route.js";
import { userRoute } from "./router/user.route.js";
import { adminRoute } from "./router/admin.route.js";
import hierarchyRoute from "./router/hierarchy.route.js";
import { initRedis, redisClient } from "./redis/redis.js";
// import resetBoothFields, { fillDummyBlaData } from "./utils/fillDummyBlaData.js";
// import updateBlocks from "./config/updateblocks.utils.js";

const app = express();
const PORT = Number(process.env.PORT) || 6000;

app.use(express.json());
app.use(express.text({ type: 'text/csv' }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Define CORS options
const corsOptions = {
  origin: "*",
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));


app.use("/api/v1/auth",authRoute)
app.use("/api/v1/districts",userRoute)
app.use("/api/v1/admin",adminRoute)
app.use("/api/v1/admin/hierarchy",hierarchyRoute)


app.get("/", (req:any, res:any) => {
  res.send("Hello World!");
});
app.get("/health", (req:any, res:any) => {
  res.send("All are woriking fine");
});

// ✅ Start server after Prisma connects
async function startServer() {
  try {
    await prisma.$connect(); // <-- Connect once
   initRedis();
    console.log("✅ Prisma connected");
    app.listen(PORT, '0.0.0.0',() => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1); // Exit if Prisma cannot connect
  }
}

startServer();
