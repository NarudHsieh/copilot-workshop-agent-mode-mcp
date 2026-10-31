// ===== 我的待辦清單 =====
// 純前端實作,不使用任何框架或套件。資料存在瀏覽器的 localStorage。

const STORAGE_KEY = 'workshop-todos';
const THEME_STORAGE_KEY = 'workshop-theme';

// 取得畫面上會用到的元素
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const themeToggle = document.getElementById('theme-toggle');
const filterControls = document.getElementById('filter-controls');
const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

// 所有待辦事項都放在這個陣列裡
// 每一筆的格式:{ id: '169...', text: '買牛奶', completed: false }
let todos = loadTodos();
let activeFilter = 'all';
let savedTheme = loadThemePreference();

// ---------- 資料存取 ----------

/** 從 localStorage 讀回待辦清單,讀不到或格式壞掉就回傳空陣列 */
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('讀取待辦清單失敗,將以空清單開始。', error);
    return [];
  }
}

/** 把目前的待辦清單寫回 localStorage */
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

/** 讀取使用者手動選擇的主題,沒有有效設定時交由系統決定 */
function loadThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (error) {
    console.warn('讀取主題設定失敗,將跟隨系統設定。', error);
    return null;
  }
}

/** 更新主題按鈕並套用手動選擇;未設定時保留系統色彩方案 */
function updateTheme() {
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  } else {
    delete document.documentElement.dataset.theme;
  }

  const isDark = savedTheme ? savedTheme === 'dark' : systemColorScheme.matches;
  themeToggle.textContent = isDark ? '☀️ 淺色模式' : '🌙 深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

// ---------- 畫面繪製 ----------

/** 依照目前的 todos 陣列,重新畫出整份清單 */
function render() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === 'active') return !todo.completed;
    if (activeFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    // 完成勾選框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    // 待辦文字
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    // 刪除按鈕
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  // 依照完整清單與目前篩選條件顯示空狀態提示
  emptyState.hidden = visibleTodos.length > 0;
  if (todos.length === 0) {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  } else if (activeFilter === 'active') {
    emptyState.textContent = '沒有未完成的待辦事項。';
  } else if (activeFilter === 'completed') {
    emptyState.textContent = '沒有已完成的待辦事項。';
  }

  // 更新未完成數量
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
}

// ---------- 操作行為 ----------

/** 產生一組不會重複的 id(時間戳 + 隨機碼) */
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 新增一筆待辦 */
function addTodo(text) {
  todos.push({
    id: createId(),
    text,
    completed: false,
  });
  saveTodos();
  render();
}

/** 切換某一筆待辦的完成狀態 */
function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

/** 刪除某一筆待辦 */
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

// ---------- 事件綁定 ----------

// 送出表單 = 新增待辦
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return; // 空白內容不新增

  addTodo(text);
  input.value = '';
  input.focus();
});

// 用事件委派處理清單內的點擊(勾選完成 / 刪除)
list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;

  const id = item.dataset.id;

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTodo(id);
  } else if (event.target.matches('.btn-delete')) {
    deleteTodo(id);
  }
});

// 切換深淺色主題並記住使用者的選擇
themeToggle.addEventListener('click', () => {
  const isDark = savedTheme ? savedTheme === 'dark' : systemColorScheme.matches;
  savedTheme = isDark ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
  } catch (error) {
    console.warn('儲存主題設定失敗。', error);
  }
  updateTheme();
});

// 系統色彩方案變更時,只在使用者尚未手動選擇主題的情況下跟隨
systemColorScheme.addEventListener('change', () => {
  if (!savedTheme) updateTheme();
});

// 切換清單篩選條件
filterControls.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-button');
  if (!button) return;

  activeFilter = button.dataset.filter;
  filterControls.querySelectorAll('.filter-button').forEach((filterButton) => {
    const isActive = filterButton === button;
    filterButton.classList.toggle('active', isActive);
    filterButton.setAttribute('aria-pressed', String(isActive));
  });
  render();
});

// 頁面載入時先畫一次
updateTheme();
render();
