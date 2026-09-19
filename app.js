const STORAGE_KEY = "offline-todo-items";
const THEME_KEY = "todo-theme";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const remainingCount = document.querySelector("#remaining-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const themeToggle = document.querySelector("#theme-toggle");
const filterButtons = document.querySelectorAll(".filter-button");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];
    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function getVisibleTodos() {
  if (currentFilter === "active") return todos.filter((todo) => !todo.completed);
  if (currentFilter === "completed") return todos.filter((todo) => todo.completed);
  return todos;
}

function renderTodos() {
  list.replaceChildren();
  const visibleTodos = getVisibleTodos();

  visibleTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    item.dataset.id = todo.id;
    if (todo.completed) item.classList.add("completed");

    item.innerHTML = `
      <input class="todo-check" type="checkbox" ${todo.completed ? "checked" : ""} aria-label="完成 ${escapeHtml(todo.text)}">
      <span class="todo-text"></span>
      <button class="delete-button" type="button" aria-label="刪除 ${escapeHtml(todo.text)}">&times;</button>
    `;
    item.querySelector(".todo-text").textContent = todo.text;
    list.append(item);
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = getEmptyMessage();
}

function getEmptyMessage() {
  if (todos.length === 0) return "還沒有任何待辦事項,新增一個吧!";
  if (currentFilter === "active") return "目前沒有未完成的待辦事項，其他項目可能已被篩選掉。";
  if (currentFilter === "completed") return "目前沒有已完成的待辦事項，其他項目可能已被篩選掉。";
  return "還沒有任何待辦事項,新增一個吧!";
}

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character];
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  themeToggle.querySelector(".theme-label").textContent = isDark ? "淺色模式" : "深色模式";
  themeToggle.setAttribute("aria-label", isDark ? "切換至淺色模式" : "切換至深色模式");
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(savedTheme || systemTheme);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  todos.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, completed: false });
  saveTodos();
  renderTodos();
  form.reset();
  input.focus();
});

list.addEventListener("change", (event) => {
  if (!event.target.matches(".todo-check")) return;
  const item = event.target.closest(".todo-item");
  const todo = todos.find((entry) => entry.id === item.dataset.id);
  if (todo) { todo.completed = event.target.checked; saveTodos(); renderTodos(); }
});

list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-button");
  if (!deleteButton) return;
  const item = deleteButton.closest(".todo-item");
  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  renderTodos();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderTodos();
  });
});

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});

initializeTheme();
renderTodos();
