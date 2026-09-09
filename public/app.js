const API_URL = "/api/tickets";
const ticketForm = document.querySelector("#ticketForm");
const ticketList = document.querySelector("#ticketList");
const emptyState = document.querySelector("#emptyState");
const ticketCount = document.querySelector("#ticketCount");
const statusFilter = document.querySelector("#statusFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const clearButton = document.querySelector("#clearButton");
const message = document.querySelector("#message");

let tickets = [];

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The request failed.");
  }

  return data;
}

async function loadTickets() {
  try {
    const data = await requestJson(API_URL);
    tickets = data.tickets;
    renderTickets();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `alert alert-${type} shadow success-message`;

  window.setTimeout(() => {
    message.className = "visually-hidden";
  }, 3000);
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateText));
}

function getVisibleTickets() {
  return tickets.filter((ticket) => {
    const matchesStatus =
      statusFilter.value === "All" || ticket.status === statusFilter.value;

    const matchesCategory =
      categoryFilter.value === "All" ||
      ticket.category === categoryFilter.value;

    return matchesStatus && matchesCategory;
  });
}

function makeTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createStatusSelect(ticket) {
  const select = document.createElement("select");
  select.className = "form-select form-select-sm status-select";
  select.setAttribute("aria-label", `Status for ${ticket.title}`);
  ["Open", "Working", "Done"].forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = ticket.status === status;
    select.append(option);
  });
  select.addEventListener("change", async () => {
    await updateTicketStatus(ticket.id, select.value);
  });
  return select;
}
function createTicketCard(ticket) {
  const article = document.createElement("article");
  article.className = "card ticket-card shadow-sm";
  const body = document.createElement("div");
  body.className = "card-body";
  const headingRow = document.createElement("div");
  headingRow.className =
    "d-flex flex-column flex-sm-row justify-content-between gap-2 mb-2";
  const title = makeTextElement("h3", "h5 mb-0", ticket.title);
  const status = createStatusSelect(ticket);
  status.style.maxWidth = "9rem";
  headingRow.append(title, status);
  const details = makeTextElement(
    "p",
    "small text-secondary mb-2",
    `${ticket.category} | ${ticket.requesterName} | ${formatDate(ticket.createdAt)}`,
  );
  const description = makeTextElement(
    "p",
    "ticket-description mb-0",
    ticket.description,
  );
  body.append(headingRow, details, description);
  article.append(body);
  return article;
}

function renderTickets() {
  const visibleTickets = getVisibleTickets();
  ticketList.replaceChildren();
  ticketCount.textContent = `${visibleTickets.length} of ${tickets.length} tickets`;
  emptyState.hidden = visibleTickets.length > 0;
  visibleTickets.forEach((ticket) => {
    ticketList.append(createTicketCard(ticket));
  });
}
async function createTicket(event) {
  event.preventDefault();
  if (!ticketForm.checkValidity()) {
    ticketForm.reportValidity();
    return;
  }
  const formData = new FormData(ticketForm);
  const newTicket = {
    requesterName: formData.get("requesterName").trim(),
    title: formData.get("title").trim(),
    category: formData.get("category"),
    description: formData.get("description").trim(),
  };
  try {
    const data = await requestJson(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    });
    tickets.unshift(data.ticket);
    renderTickets();
    ticketForm.reset();
    document.querySelector("#requesterName").focus();
    showMessage("Ticket saved in MySQL.");
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    const data = await requestJson(`${API_URL}/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const index = tickets.findIndex((ticket) => ticket.id === ticketId);
    tickets[index] = data.ticket;
    renderTickets();
    showMessage("Status updated in MySQL.");
  } catch (error) {
    showMessage(error.message, "danger");
    await loadTickets();
  }
}
async function clearTickets() {
  if (tickets.length === 0) {
    return;
  }
  const confirmed = window.confirm("Delete every ticket from the database?");
  if (!confirmed) {
    return;
  }
  try {
    await requestJson(`${API_URL}/demo`, { method: "DELETE" });
    tickets = [];
    renderTickets();
    showMessage("Database tickets cleared.");
  } catch (error) {
    showMessage(error.message, "danger");
  }
}
ticketForm.addEventListener("submit", createTicket);
statusFilter.addEventListener("change", renderTickets);
categoryFilter.addEventListener("change", renderTickets);
clearButton.addEventListener("click", clearTickets);
renderTickets();
loadTickets();
