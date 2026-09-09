//1. Select elements and load saved tickets

const STORAGE_KEY = "quickDeskTicketsV1";
const ticketForm = document.querySelector("#ticketForm");
const ticketList = document.querySelector("#ticketList");
const emptyState = document.querySelector("#emptyState");
const ticketCount = document.querySelector("#ticketCount");
const statusFilter = document.querySelector("#statusFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const clearButton = document.querySelector("#clearButton");
const message = document.querySelector("#message");

let tickets = loadTickets();
function loadTickets() {
  const savedTickets = localStorage.getItem(STORAGE_KEY);
  if (!savedTickets) {
    return [];
  }
  try {
    const parsedTickets = JSON.parse(savedTickets);
    return Array.isArray(parsedTickets) ? parsedTickets : [];
  } catch (error) {
    console.error("Could not read saved tickets:", error);
    return [];
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function showMessage(text) {
  message.textContent = text;
  message.className = "alert alert-success shadow success-message";
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

//2. Choose visible tickets and create status controls

function getVisibleTickets() {
  return tickets
    .filter((ticket) => {
      const matchesStatus =
        statusFilter.value === "All" || ticket.status === statusFilter.value;
      const matchesCategory =
        categoryFilter.value === "All" ||
        ticket.category === categoryFilter.value;
      return matchesStatus && matchesCategory;
    })
    .sort((b, a) => new Date(b.createdAt) - new Date(a.createdAt));
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
  select.addEventListener("change", () => {
    updateTicketStatus(ticket.id, select.value);
  });
  return select;
}

//3. Create ticket cards and render the list

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

//4. Handle form submission, status changes, and clearing tickets

function createTicket(event) {
  event.preventDefault();
  if (!ticketForm.checkValidity()) {
    ticketForm.reportValidity();
    return;
  }
  const formData = new FormData(ticketForm);
  const ticket = {
    id: Date.now(),
    requesterName: formData.get("requesterName").trim(),
    title: formData.get("title").trim(),
    category: formData.get("category"),
    description: formData.get("description").trim(),
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  saveTickets();
  renderTickets();
  ticketForm.reset();
  document.querySelector("#requesterName").focus();
  showMessage("Ticket saved.");
}

function updateTicketStatus(ticketId, newStatus) {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    return;
  }
  ticket.status = newStatus;
  saveTickets();
  renderTickets();
  showMessage("Status updated.");
}

function clearTickets() {
  if (tickets.length === 0) {
    return;
  }
  const confirmed = window.confirm("Delete every saved demo ticket?");
  if (!confirmed) {
    return;
  }
  tickets = [];
  saveTickets();
  renderTickets();
  showMessage("Demo data cleared.");
}

ticketForm.addEventListener("submit", createTicket);
statusFilter.addEventListener("change", renderTickets);
categoryFilter.addEventListener("change", renderTickets);
clearButton.addEventListener("click", clearTickets);
renderTickets();
