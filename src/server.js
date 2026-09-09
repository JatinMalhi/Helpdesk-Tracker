import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { checkDatabaseConnection } from "./database.js";
import { ticketRouter } from "./ticket-routes.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const publicDirectory = path.join(currentDirectory, "..", "public");

app.use(express.json({ limit: "50kb" }));
app.use(express.static(publicDirectory));
app.use("/api/tickets", ticketRouter);

app.use((request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.use((error, request, response, next) => {
  console.error(error);
  response
    .status(500)
    .json({ error: "The server could not complete the request." });
});

try {
  await checkDatabaseConnection();

  app.listen(port, () => {
    console.log(`QuickDesk is running at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not connect to MySQL:", error.message);
  process.exit(1);
}
