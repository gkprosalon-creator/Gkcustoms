// Убираем экран загрузки после полной загрузки приложения
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.visibility = 'hidden'; }, 500);
  }, 1500); // 1500 миллисекунд = 1.5 секунды
});

const defaultPersonalConfig = [
  { id: 'apartment', name: 'Квартира', percent: 35 },
  { id: 'savings', name: 'Накопления', percent: 20 },
  { id: 'car', name: 'Машина', percent: 15 },
  { id: 'vacation', name: 'Отпуск', percent: 10 },
  { id: 'leisure', name: 'Отдых', percent: 10 },
  { id: 'clothes', name: 'Одежда', percent: 10 }
];

const workshopConfig = { amortizationPercent: 30, profitPercent: 70 };

let appData = {
  personalBanks: {},
  workshop: { amortization: 0, profit: 0 },
  config: []
};

function initEmptyBanks() {
  appData.config = JSON.parse(JSON.stringify(defaultPersonalConfig));
  appData.config.forEach(cat => appData.personalBanks[cat.id] = 0);
}

try {
  const saved = localStorage.getItem('gkFinanceData_v2');
  if (saved) {
    appData = JSON.parse(saved);
    if (!appData.config || appData.config.length === 0) {
        appData.config = JSON.parse(JSON.stringify(defaultPersonalConfig));
    }
    appData.config.forEach(cat => {
      if (appData.personalBanks[cat.id] === undefined) appData.personalBanks[cat.id] = 0;
    });
  } else {
    initEmptyBanks();
  }
} catch (e) {
  initEmptyBanks();
}

function saveData() {
  try { localStorage.setItem('gkFinanceData_v2', JSON.stringify(appData)); } catch (e) {}
  renderUI();
}

function addWorkIncome(amount = null) {
  const input = document.getElementById('work-income');
  const val = amount !== null ? amount : parseFloat(input.value);
  if (isNaN(val) || val <= 0) return;
  appData.config.forEach(cat => appData.personalBanks[cat.id] += val * (cat.percent / 100));
  input.value = '';
  saveData();
}

function addWorkshopIncome() {
  const input = document.getElementById('workshop-income');
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) return;
  appData.workshop.amortization += val * (workshopConfig.amortizationPercent / 100);
  appData.workshop.profit += val * (workshopConfig.profitPercent / 100);
  input.value = '';
  saveData();
}

function transferToPersonal() {
  const amountToTransfer = appData.workshop.profit;
  if (amountToTransfer <= 0) return;
  appData.workshop.profit = 0;
  addWorkIncome(amountToTransfer);
}

function toggleSpendBlock(id) {
  const el = document.getElementById('spend-area-' + id);
  if(el) el.classList.toggle('active');
}

function spendMoney(id, type = 'personal') {
  const input = document.getElementById('spend-input-' + id);
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) return;

  if (type === 'personal') {
    appData.personalBanks[id] -= val;
  } else if (type === 'workshop') {
    appData.workshop[id] -= val;
  }
  input.value = ''; // Очищаем поле после списания
  toggleSpendBlock(id); // Скрываем блок после списания
  saveData();
}

function checkSettingsSum() {
  let sum = 0;
  const inputs = document.querySelectorAll('.setting-input');
  inputs.forEach(input => sum += parseFloat(input.value) || 0);
  
  const statusEl = document.getElementById('settings-status');
  const btnSave = document.getElementById('btn-save-settings');
  
  if (sum === 100) {
    statusEl.innerText = Сумма: 100%;
    statusEl.className = 'status-ok';
    btnSave.disabled = false;
  } else {
    statusEl.innerText = Сумма: ${sum}% (Нужно 100%);
    statusEl.className = 'status-error';
    btnSave.disabled = true;
  }
}

function saveSettings() {
  const inputs = document.querySelectorAll('.setting-input');
  inputs.forEach(input => {
    const id = input.dataset.id;
    const newPercent = parseFloat(input.value) || 0;
    const cat = appData.config.find(c => c.id === id);
    if(cat) cat.percent = newPercent;
  });
  saveData();
  alert("Новые пропорции сохранены!");
}
function renderUI() {
  const workContainer = document.getElementById('work-categories');
  workContainer.innerHTML = '';
  let totalPersonal = 0;

  appData.config.forEach(cat => {
    const balance = appData.personalBanks[cat.id] || 0;
    totalPersonal += balance;
    workContainer.innerHTML += 
      <div class="category-wrapper">
        <div class="category" onclick="toggleSpendBlock('${cat.id}')">
          <div class="cat-info">
            <span class="cat-name">${cat.name}</span>
            <span class="cat-percent">${cat.percent}%</span>
          </div>
          <span class="cat-value">${balance.toFixed(2)}</span>
        </div>
        <div class="spend-area" id="spend-area-${cat.id}">
          <input type="number" id="spend-input-${cat.id}" placeholder="Сумма расхода" inputmode="decimal">
          <button class="btn-spend" onclick="spendMoney('${cat.id}', 'personal')">Списать</button>
        </div>
      </div>
    ;
  });
  document.getElementById('total-personal').innerText = totalPersonal.toFixed(2);

  const wsContainer = document.getElementById('workshop-categories');
  wsContainer.innerHTML = 
    <div class="category-wrapper">
      <div class="category" onclick="toggleSpendBlock('amortization')">
         <div class="cat-info"><span class="cat-name">Амортизация (30%)</span></div>
         <span class="cat-value">${appData.workshop.amortization.toFixed(2)}</span>
      </div>
      <div class="spend-area" id="spend-area-amortization">
        <input type="number" id="spend-input-amortization" placeholder="Расход (материалы)" inputmode="decimal">
        <button class="btn-spend" onclick="spendMoney('amortization', 'workshop')">Списать</button>
      </div>
    </div>
    <div class="category-wrapper" style="border: 1px dashed var(--accent);">
      <div class="category" onclick="toggleSpendBlock('profit')">
         <div class="cat-info"><span class="cat-name">Прибыль (70%)</span></div>
         <span class="cat-value">${appData.workshop.profit.toFixed(2)}</span>
      </div>
      <div class="spend-area" id="spend-area-profit">
        <input type="number" id="spend-input-profit" placeholder="Снять наличные" inputmode="decimal">
        <button class="btn-spend" onclick="spendMoney('profit', 'workshop')">Списать</button>
      </div>
    </div>
  ;

  const settingsContainer = document.getElementById('settings-list');
  settingsContainer.innerHTML = '';
  appData.config.forEach(cat => {
    settingsContainer.innerHTML += 
      <div class="setting-row">
        <span>${cat.name}</span>
        <div><input type="number" class="setting-input" data-id="${cat.id}" value="${cat.percent}" oninput="checkSettingsSum()"> %</div>
      </div>
    ;
  });
  checkSettingsSum();
}

renderUI();