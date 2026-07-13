(function () {
  "use strict";

  const STORAGE_KEY = "daybook.tasks.v1";
  const THEME_KEY = "daybook.theme.v1";
  const RING_CIRCUMFERENCE = 219.9115; // 2 * PI * 35

  const THEMES = [
    { id: "ledger", name: "Ledger" },
    { id: "daylight", name: "Daylight" },
    { id: "dusk", name: "Dusk" },
    { id: "forest", name: "Forest" }
  ];

  /** @type {Array<{id:string, text:string, completed:boolean, createdAt:string, completedAt:string|null}>} */
  let tasks = [];

  // ---- Elements ----
  const addForm = document.getElementById("addForm");
  const taskInput = document.getElementById("taskInput");
  const pendingList = document.getElementById("pendingList");
  const completedList = document.getElementById("completedList");
  const pendingEmpty = document.getElementById("pendingEmpty");
  const completedEmpty = document.getElementById("completedEmpty");
  const pendingCount = document.getElementById("pendingCount");
  const completedCount = document.getElementById("completedCount");
  const totalSummary = document.getElementById("totalSummary");
  const todayDate = document.getElementById("todayDate");
  const template = document.getElementById("taskTemplate");
  const themeSwitcher = document.getElementById("themeSwitcher");
  const ringProgress = document.getElementById("ringProgress");
  const ringPct = document.getElementById("ringPct");
  const statTotal = document.getElementById("statTotal");
  const statPending = document.getElementById("statPending");
  const statCompleted = document.getElementById("statCompleted");

  // ---- Persistence: tasks ----
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Could not read saved tasks:", err);
      tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Could not save tasks:", err);
    }
  }

  // ---- Persistence: theme ----
  function loadTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "ledger";
    } catch (err) {
      return "ledger";
    }
  }

  function saveTheme(id) {
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch (err) {
      console.error("Could not save theme:", err);
    }
  }

  function applyTheme(id) {
    document.documentElement.setAttribute("data-theme", id);
    saveTheme(id);
    document.querySelectorAll(".theme-swatch").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeId === id);
    });
  }

  function buildThemeSwitcher() {
    const current = loadTheme();
    THEMES.forEach(theme => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-swatch";
      btn.dataset.themeId = theme.id;
      btn.setAttribute("aria-label", theme.name + " theme");
      btn.title = theme.name;
      btn.style.background = "var(--swatch)";
      // Set swatch color per-theme regardless of active theme
      btn.setAttribute("data-swatch-theme", theme.id);
      btn.addEventListener("click", () => applyTheme(theme.id));
      themeSwitcher.appendChild(btn);
    });
    applyTheme(current);
    colorSwatches();
  }

  // Each swatch button should show ITS OWN theme's accent color,
  // not the currently active theme's --swatch variable.
  function colorSwatches() {
    const swatchColors = {
      ledger: "#2c5c7a",
      daylight: "#4fd1c5",
      dusk: "#e493b0",
      forest: "#7bc47f"
    };
    document.querySelectorAll(".theme-swatch").forEach(btn => {
      const id = btn.dataset.themeId;
      btn.style.background = swatchColors[id] || "#999";
    });
  }

  // ---- Helpers ----
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatTimestamp(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function setTodayHeading() {
    const now = new Date();
    todayDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    });
  }

  // ---- Rendering ----
  function render() {
    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    pending.forEach(t => pendingList.appendChild(buildRow(t)));
    completed.forEach(t => completedList.appendChild(buildRow(t)));

    pendingEmpty.classList.toggle("visible", pending.length === 0);
    completedEmpty.classList.toggle("visible", completed.length === 0);

    pendingCount.textContent = String(pending.length);
    completedCount.textContent = String(completed.length);

    const total = tasks.length;
    totalSummary.textContent = total === 1 ? "1 task total" : `${total} tasks total`;

    statTotal.textContent = String(total);
    statPending.textContent = String(pending.length);
    statCompleted.textContent = String(completed.length);

    const pct = total === 0 ? 0 : Math.round((completed.length / total) * 100);
    ringPct.textContent = pct + "%";
    ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100));
  }

  function buildRow(task) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    node.classList.toggle("completed", task.completed);

    const textEl = node.querySelector(".task-text");
    const editInput = node.querySelector(".task-edit-input");
    const addedMeta = node.querySelector(".added-meta");
    const completedMeta = node.querySelector(".completed-meta");
    const checkBtn = node.querySelector(".check");
    const editBtn = node.querySelector(".edit-btn");
    const saveBtn = node.querySelector(".save-btn");
    const deleteBtn = node.querySelector(".delete-btn");

    textEl.textContent = task.text;
    editInput.value = task.text;
    addedMeta.textContent = "added " + formatTimestamp(task.createdAt);
    completedMeta.textContent = task.completed ? "done " + formatTimestamp(task.completedAt) : "";

    checkBtn.addEventListener("click", () => toggleComplete(task.id, checkBtn));
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    editBtn.addEventListener("click", () => enterEditMode(node, editInput));
    saveBtn.addEventListener("click", () => saveEdit(task.id, node, editInput));
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); saveEdit(task.id, node, editInput); }
      if (e.key === "Escape") { e.preventDefault(); node.classList.remove("editing"); editInput.value = task.text; }
    });

    return node;
  }

  function enterEditMode(node, input) {
    node.classList.add("editing");
    input.focus();
    input.select();
  }

  function saveEdit(id, node, input) {
    const value = input.value.trim();
    if (!value) return; // ignore empty edits
    const task = tasks.find(t => t.id === id);
    if (task) task.text = value;
    node.classList.remove("editing");
    saveTasks();
    render();
  }

  // ---- Actions ----
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tasks.unshift({
      id: makeId(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    });
    saveTasks();
    render();
  }

  function toggleComplete(id, checkEl) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    if (task.completed && checkEl) {
      // quick tactile pulse right before the row re-renders into the other list
      checkEl.classList.add("pop");
      setTimeout(() => {
        saveTasks();
        render();
      }, 140);
    } else {
      saveTasks();
      render();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }

  // ---- Init ----
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  setTodayHeading();
  buildThemeSwitcher();
  loadTasks();
  render();
})();
