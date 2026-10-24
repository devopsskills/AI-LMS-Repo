const STORAGE_KEY = "daylist.tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const remainingCount = document.querySelector("#remaining-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const todayLabel = document.querySelector("#today-label");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedTasks)) {
      return [];
    }

    return savedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks:", error);
    remainingCount.textContent = "Changes could not be saved in this browser.";
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function visibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }
  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;

  const content = document.createElement("div");
  content.className = "task-content";

  const toggle = document.createElement("button");
  toggle.className = "task-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", `${task.completed ? "Mark as active" : "Complete"}: ${task.text}`);
  toggle.setAttribute("aria-pressed", String(task.completed));
  toggle.innerHTML = task.completed
    ? '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>'
    : "";
  toggle.addEventListener("click", () => {
    task.completed = !task.completed;
    saveTasks();
    render();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  content.append(toggle, text);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const date = document.createElement("time");
  date.className = "task-date";
  date.dateTime = task.createdAt;
  date.textContent = formatDate(task.createdAt);

  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.setAttribute("aria-label", `Delete: ${task.text}`);
  remove.innerHTML =
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6m-5 3v4m2-4v4" /></svg>';
  remove.addEventListener("click", () => {
    tasks = tasks.filter((entry) => entry.id !== task.id);
    saveTasks();
    render();
  });

  actions.append(date, remove);
  item.append(content, actions);
  return item;
}

function render() {
  const filteredTasks = visibleTasks();
  const remaining = tasks.filter((task) => !task.completed).length;
  list.replaceChildren(...filteredTasks.map(createTaskElement));

  taskCount.textContent = String(tasks.length);
  emptyState.hidden = filteredTasks.length > 0;
  list.hidden = filteredTasks.length === 0;
  clearCompletedButton.hidden = !tasks.some((task) => task.completed);

  if (remaining === 0 && tasks.length > 0) {
    remainingCount.textContent = "Everything done. Nice work!";
  } else if (remaining === 1) {
    remainingCount.textContent = "1 task left. You’ve got this.";
  } else if (remaining > 1) {
    remainingCount.textContent = `${remaining} tasks left. You’ve got this.`;
  } else {
    remainingCount.textContent = "You’ve got this.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
  render();
  form.reset();
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date()).toUpperCase();

render();
