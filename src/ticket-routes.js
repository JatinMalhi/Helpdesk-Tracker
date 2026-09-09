import { Router } from "express";
import { pool } from "./database.js";
export const ticketRouter = Router();
const categories = ["Hardware", "Software", "Network", "Account", "Other"];
const statuses = ["Open", "Working", "Done"];
const ticketSelect = `
 SELECT
 id,
 requester_name AS requesterName,
 title,
 category,
 description,
 status,
 DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS createdAt
 FROM tickets
`;
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function validateTicket(body) {
  const ticket = {
    requesterName: cleanText(body.requesterName),
    title: cleanText(body.title),
    category: cleanText(body.category),
    description: cleanText(body.description),
  };
  if (ticket.requesterName.length < 2 || ticket.requesterName.length > 40) {
    return { error: "Name must be 2 to 40 characters." };
  }
  if (ticket.title.length < 5 || ticket.title.length > 80) {
    return { error: "Title must be 5 to 80 characters." };
  }
  if (!categories.includes(ticket.category)) {
    return { error: "Choose a valid category." };
  }
  if (ticket.description.length < 10 || ticket.description.length > 500) {
    return { error: "Description must be 10 to 500 characters." };
  }
  return { ticket };
}
async function findTicket(ticketId) {
  const [rows] = await pool.execute(`${ticketSelect} WHERE id = ?`, [ticketId]);
  return rows[0] ?? null;
}

ticketRouter.get("/", async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `${ticketSelect} ORDER BY created_at DESC, id DESC`,
    );
    response.json({ tickets: rows });
  } catch (error) {
    next(error);
  }
});
ticketRouter.post("/", async (request, response, next) => {
  try {
    const result = validateTicket(request.body);
    if (result.error) {
      return response.status(422).json({ error: result.error });
    }
    const ticket = result.ticket;
    const [insertResult] = await pool.execute(
      `INSERT INTO tickets
 (requester_name, title, category, description)
 VALUES (?, ?, ?, ?)`,
      [ticket.requesterName, ticket.title, ticket.category, ticket.description],
    );
    const createdTicket = await findTicket(insertResult.insertId);
    return response.status(201).json({ ticket: createdTicket });
  } catch (error) {
    return next(error);
  }
});

ticketRouter.patch("/:id/status", async (request, response, next) => {
  try {
    const ticketId = Number(request.params.id);
    const status = cleanText(request.body.status);
    if (
      !Number.isInteger(ticketId) ||
      ticketId < 1 ||
      !statuses.includes(status)
    ) {
      return response
        .status(422)
        .json({ error: "Invalid ticket ID or status." });
    }
    const [updateResult] = await pool.execute(
      "UPDATE tickets SET status = ? WHERE id = ?",
      [status, ticketId],
    );
    if (updateResult.affectedRows === 0) {
      return response.status(404).json({ error: "Ticket not found." });
    }
    const updatedTicket = await findTicket(ticketId);
    return response.json({ ticket: updatedTicket });
  } catch (error) {
    return next(error);
  }
});
ticketRouter.delete("/demo", async (request, response, next) => {
  try {
    const [deleteResult] = await pool.execute("DELETE FROM tickets");
    response.json({ deleted: deleteResult.affectedRows });
  } catch (error) {
    next(error);
  }
});
