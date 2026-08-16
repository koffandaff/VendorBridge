export const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const NODE_ENV = process.env.NODE_ENV || "development";
