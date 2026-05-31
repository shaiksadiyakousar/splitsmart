/* ─────────────────────────────────────────────────────────
   SplitSmart – script.js
   Handles: theme, form, calculation, history, local storage
   ───────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════
   1. STATE & CONSTANTS
   ══════════════════════════════════════════════════════════ */

// All expense history stored here (loaded from localStorage)
let expenses = [];

// Currently calculated result (before saving)
let currentResult = null;

// Storage key
const STORAGE_KEY = 'splitsmart_expenses';
const THEME_KEY   = 'splitsmart_theme';

/* ══════════════════════════════════════════════════════════
   2. THEME TOGGLE (Dark / Light Mode)
   ══════════════════════════════════════════════════════════ */

const html       = document.documentElement;
const themeBtn   = document.getElementById('themeToggle');
const themeIcon  = document.getElementById('themeIcon');

/**
 * Applies the given theme ('dark' or 'light') to the page
 * and saves the preference to localStorage.
 */
function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem(THEME_KEY, theme);
}

// Toggle between dark and light
themeBtn.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme on page load
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedTheme);

/* ══════════════════════════════════════════════════════════
   3. PARTICIPANT FIELDS – Dynamic Input Generation
   ══════════════════════════════════════════════════════════ */

const numPeopleInput      = document.getElementById('numPeople');
const participantFields   = document.getElementById('participantFields');
const decreaseBtn         = document.getElementById('decreaseBtn');
const increaseBtn         = document.getElementById('increaseBtn');

const EMOJIS = ['👤','🧑','👩','🧔','👱','🧒','👦','👧','🧑‍💼','🧑‍🎓'];

/**
 * Generates name input fields based on the number of people.
 * Preserves existing values when adding/removing fields.
 */
function renderParticipantFields(count) {
  // Save current values
  const existing = [];
  participantFields.querySelectorAll('input').forEach(inp => {
    existing.push(inp.value);
  });

  participantFields.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'participant-input-wrap';

    const emoji = document.createElement('span');
    emoji.className = 'person-emoji';
    emoji.textContent = EMOJIS[i % EMOJIS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Person ${i + 1} name`;
    input.dataset.index = i;
    input.value = existing[i] || '';
    input.autocomplete = 'off';

    wrap.appendChild(emoji);
    wrap.appendChild(input);
    participantFields.appendChild(wrap);
  }
}

// Decrease button
decreaseBtn.addEventListener('click', () => {
  let val = parseInt(numPeopleInput.value, 10);
  if (val > 2) {
    numPeopleInput.value = val - 1;
    renderParticipantFields(val - 1);
  }
});

// Increase button
increaseBtn.addEventListener('click', () => {
  let val = parseInt(numPeopleInput.value, 10);
  if (val < 20) {
    numPeopleInput.value = val + 1;
    renderParticipantFields(val + 1);
  }
});

// Initial render
renderParticipantFields(parseInt(numPeopleInput.value, 10));

/* ══════════════════════════════════════════════════════════
   4. FORM VALIDATION
   ══════════════════════════════════════════════════════════ */

/**
 * Shows an error message under a field.
 * @param {string} fieldId - The error span ID
 * @param {string} inputId - The input to highlight
 * @param {string} message - Error text to show
 */
function showError(fieldId, inputId, message) {
  document.getElementById(fieldId).textContent = message;
  if (inputId) {
    const el = document.getElementById(inputId);
    if (el) el.classList.add('error');
  }
}

/**
 * Clears all error messages and red borders.
 */
function clearErrors() {
  ['titleError', 'amountError', 'peopleError', 'namesError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
}

/**
 * Validates the form. Returns true if valid, false otherwise.
 */
function validateForm(title, amount, count, names) {
  let valid = true;
  clearErrors();

  // Title validation
  if (!title.trim()) {
    showError('titleError', 'expenseTitle', '⚠️ Expense title is required');
    valid = false;
  }

  // Amount validation
  if (!amount || isNaN(amount)) {
    showError('amountError', 'expenseAmount', '⚠️ Please enter an amount');
    valid = false;
  } else if (parseFloat(amount) <= 0) {
    showError('amountError', 'expenseAmount', '⚠️ Amount must be greater than ₹0');
    valid = false;
  }

  // Number of people validation
  if (isNaN(count) || count < 2 || count > 20) {
    showError('peopleError', 'numPeople', '⚠️ Number of people must be between 2 and 20');
    valid = false;
  }

  // Names validation — check each name is not empty
  let allNamed = true;
  names.forEach((name, i) => {
    if (!name.trim()) {
      allNamed = false;
      const inputs = participantFields.querySelectorAll('input');
      if (inputs[i]) inputs[i].classList.add('error');
    }
  });
  if (!allNamed) {
    showError('namesError', null, '⚠️ All participant names are required');
    valid = false;
  }

  return valid;
}

/* ══════════════════════════════════════════════════════════
   5. CALCULATION & RESULT DISPLAY
   ══════════════════════════════════════════════════════════ */

const expenseForm    = document.getElementById('expenseForm');
const resultEmpty    = document.getElementById('resultEmpty');
const resultContent  = document.getElementById('resultContent');
const saveBtn        = document.getElementById('saveBtn');
const saveSuccess    = document.getElementById('saveSuccess');

/**
 * Formats a number as Indian currency string.
 * e.g., 1200 → "₹1,200.00"
 */
function formatCurrency(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Handles form submission: validates, calculates, and shows result.
 */
expenseForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const title   = document.getElementById('expenseTitle').value;
  const amount  = document.getElementById('expenseAmount').value;
  const count   = parseInt(numPeopleInput.value, 10);
  const names   = Array.from(participantFields.querySelectorAll('input')).map(i => i.value);

  if (!validateForm(title, amount, count, names)) return;

  // Calculate equal share
  const total     = parseFloat(amount);
  const perPerson = Math.round((total / count) * 100) / 100; // Round to 2 decimal places

  // Store current result for saving later
  currentResult = {
    id: Date.now(),
    title: title.trim(),
    total,
    count,
    names: names.map(n => n.trim()),
    perPerson,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };

  // Show result
  displayResult(currentResult);

  // Reset save button
  saveBtn.style.display = 'block';
  saveSuccess.style.display = 'none';
});

/**
 * Populates the result card with calculation details.
 */
function displayResult(result) {
  document.getElementById('resultTitle').textContent  = result.title;
  document.getElementById('resultTotal').textContent  = `Total: ${formatCurrency(result.total)}`;
  document.getElementById('resultCount').textContent  = `${result.count} people`;
  document.getElementById('summaryTotal').textContent = formatCurrency(result.total);
  document.getElementById('summaryPer').textContent   = formatCurrency(result.perPerson);

  // Build individual person rows
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = '';

  result.names.forEach((name, i) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.animationDelay = `${i * 0.07}s`;
    item.innerHTML = `
      <div class="result-item-name">
        <span>${EMOJIS[i % EMOJIS.length]}</span>
        <span>${escapeHtml(name)}</span>
      </div>
      <span class="result-item-amount">${formatCurrency(result.perPerson)}</span>
    `;
    resultList.appendChild(item);
  });

  // Show result section
  resultEmpty.style.display  = 'none';
  resultContent.style.display = 'flex';
  resultContent.style.flexDirection = 'column';
  resultContent.style.gap = '0';
}

/* ══════════════════════════════════════════════════════════
   6. SAVE TO HISTORY
   ══════════════════════════════════════════════════════════ */

saveBtn.addEventListener('click', () => {
  if (!currentResult) return;

  // Check if already saved (prevent duplicate)
  const alreadySaved = expenses.some(e => e.id === currentResult.id);
  if (alreadySaved) {
    saveSuccess.textContent = '✅ Already saved!';
    saveSuccess.style.display = 'block';
    return;
  }

  // Add to front of list
  expenses.unshift(currentResult);
  saveToStorage();
  renderHistory(expenses);
  updateDashboard();
  updateHeroStats();

  // Show success message
  saveBtn.style.display = 'none';
  saveSuccess.style.display = 'block';
  saveSuccess.textContent = '✅ Saved to history!';
});

/* ══════════════════════════════════════════════════════════
   7. LOCAL STORAGE
   ══════════════════════════════════════════════════════════ */

/**
 * Saves the expenses array to localStorage as JSON.
 */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * Loads expenses from localStorage and returns them.
 */
function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    // If data is corrupted, return empty array
    return [];
  }
}

/* ══════════════════════════════════════════════════════════
   8. HISTORY RENDERING
   ══════════════════════════════════════════════════════════ */

const historyList  = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');

/**
 * Renders the history list from an array of expense objects.
 * @param {Array} items - Array of expense objects to display
 */
function renderHistory(items) {
  historyList.innerHTML = '';

  if (items.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }

  historyEmpty.style.display = 'none';

  items.forEach((exp, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.style.animationDelay = `${idx * 0.05}s`;

    const participantPreview = exp.names.slice(0, 3).join(', ') +
      (exp.names.length > 3 ? ` +${exp.names.length - 3} more` : '');

    item.innerHTML = `
      <div class="history-item-left">
        <div class="history-title">${escapeHtml(exp.title)}</div>
        <div class="history-meta">
          <span class="history-tag amount">${formatCurrency(exp.total)}</span>
          <span class="history-tag">👥 ${exp.count} people</span>
          <span class="history-tag">💵 ${formatCurrency(exp.perPerson)}/each</span>
        </div>
        <div class="history-participants">👤 ${escapeHtml(participantPreview)}</div>
        <div class="history-datetime">🕐 ${exp.date} at ${exp.time}</div>
      </div>
      <div class="history-item-right">
        <div>
          <div class="per-person-amount">${formatCurrency(exp.perPerson)}</div>
          <div class="per-person-sub">per person</div>
        </div>
        <button class="delete-btn" data-id="${exp.id}" title="Delete this record">🗑️</button>
      </div>
    `;

    historyList.appendChild(item);
  });

  // Attach delete handlers
  historyList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteExpense(parseInt(btn.dataset.id));
    });
  });
}

/**
 * Deletes a single expense by ID and re-renders.
 */
function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  renderHistory(expenses);
  updateDashboard();
  updateHeroStats();
  // Re-apply search filter if active
  const q = document.getElementById('searchInput').value;
  if (q) filterHistory(q);
}

/* ══════════════════════════════════════════════════════════
   9. SEARCH & FILTER
   ══════════════════════════════════════════════════════════ */

const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

/**
 * Filters history items by matching title (case-insensitive).
 */
function filterHistory(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderHistory(expenses);
    clearSearch.style.display = 'none';
    return;
  }

  clearSearch.style.display = 'block';
  const filtered = expenses.filter(e => e.title.toLowerCase().includes(q));

  if (filtered.length === 0) {
    historyList.innerHTML = `<div class="no-results">🔍 No expenses found matching "<strong>${escapeHtml(query)}</strong>"</div>`;
    historyEmpty.style.display = 'none';
  } else {
    renderHistory(filtered);
  }
}

searchInput.addEventListener('input', () => filterHistory(searchInput.value));

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  filterHistory('');
  clearSearch.style.display = 'none';
});

/* ══════════════════════════════════════════════════════════
   10. CLEAR ALL
   ══════════════════════════════════════════════════════════ */

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (expenses.length === 0) return;
  if (confirm('🗑️ Are you sure you want to delete ALL expense history? This cannot be undone.')) {
    expenses = [];
    saveToStorage();
    renderHistory([]);
    updateDashboard();
    updateHeroStats();
    searchInput.value = '';
    clearSearch.style.display = 'none';
  }
});

/* ══════════════════════════════════════════════════════════
   11. DASHBOARD & HERO STATS
   ══════════════════════════════════════════════════════════ */

/**
 * Updates all dashboard stat cards based on current expenses.
 */
function updateDashboard() {
  const totalAmount = expenses.reduce((sum, e) => sum + e.total, 0);
  const totalPeople = expenses.reduce((sum, e) => sum + e.count, 0);

  document.getElementById('dashExpenses').textContent = expenses.length;
  document.getElementById('dashAmount').textContent   = formatCurrency(totalAmount);
  document.getElementById('dashPeople').textContent   = totalPeople;
}

/**
 * Updates the hero section stats (small numbers under CTA).
 */
function updateHeroStats() {
  const totalAmount = expenses.reduce((sum, e) => sum + e.total, 0);
  const totalPeople = expenses.reduce((sum, e) => sum + e.count, 0);

  document.getElementById('statExpenses').textContent = expenses.length;
  document.getElementById('statAmount').textContent   = formatCurrency(totalAmount);
  document.getElementById('statPeople').textContent   = totalPeople;
}

/* ══════════════════════════════════════════════════════════
   12. SCROLL TO APP
   ══════════════════════════════════════════════════════════ */

function scrollToApp() {
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════════════
   13. SECURITY HELPER
   ══════════════════════════════════════════════════════════ */

/**
 * Escapes HTML special characters to prevent XSS.
 * Always use this before inserting user input into innerHTML.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/* ══════════════════════════════════════════════════════════
   14. INITIALISE ON PAGE LOAD
   ══════════════════════════════════════════════════════════ */

function init() {
  // Load saved data
  expenses = loadFromStorage();

  // Render UI
  renderHistory(expenses);
  updateDashboard();
  updateHeroStats();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
