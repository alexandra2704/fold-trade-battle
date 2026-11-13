/* ============================================================
   Fold, Trade & Battle — прототип (v2)
   Все 10 визиток, редкости, фрагменты, галерея, аренда, скидка.
   ============================================================ */

const STORAGE_KEY = 'fold_trade_battle_save_v2';

const BOARD_CELLS = [
  'с','р','п','пр','р','п','ш','р',
  'п','пр','р','п','р','п','пр','р',
  'п','ш','р','п','р','пр','р','п',
  'пр','р','п','ш','р','п','р','п'
];

const CELL_META = {
  'с': { name: 'Старт', emoji: '🏁', cls: 'start' },
  'р': { name: 'Рынок', emoji: '🏪', cls: 'market' },
  'п': { name: 'Производство', emoji: '🏭', cls: 'production' },
  'пр': { name: 'Прогулка', emoji: '🚶', cls: 'walk' },
  'ш': { name: 'Штраф', emoji: '⚠️', cls: 'penalty' }
};

/* ---------- Редкости ---------- */
const RARITIES = {
  simple:      { name: 'Простая',       fragments: 1,  rent: 20,  buyPrice: 150,  coinWin: 80,  paperWin: 1, color: '#9be59b' },
  rare:        { name: 'Редкая',        fragments: 2,  rent: 40,  buyPrice: 350,  coinWin: 120, paperWin: 1, color: '#9bdbe5' },
  epic:        { name: 'Эпическая',     fragments: 3,  rent: 60,  buyPrice: 600,  coinWin: 180, paperWin: 2, color: '#c9a0e0' },
  legendary:   { name: 'Легендарная',   fragments: 5,  rent: 100, buyPrice: 1200, coinWin: 280, paperWin: 2, color: '#e5c79b' },
  collectible: { name: 'Коллекционная', fragments: 10, rent: 150, buyPrice: 2500, coinWin: 400, paperWin: 3, color: '#e5a0a0' }
};

/* ---------- Товары ---------- */
const GOODS = {
  'еда':      { base: 10, emoji: '🍲' },
  'топливо':  { base: 12, emoji: '⛽' },
  'алкоголь': { base: 14, emoji: '🍺' },
  'работа':   { base: 16, emoji: '🔨' },
  'удочки':   { base: 18, emoji: '🎣' },
  'механизмы':{ base: 20, emoji: '⚙️' },
  'стекло':   { base: 22, emoji: '🔮' },
  'металл':   { base: 24, emoji: '🔩' },
  'деньги':   { base: 26, emoji: '💵' },
  'часы':     { base: 28, emoji: '⏰' }
};

/* ---------- Визитки (по GDD) ---------- */
const CARDS = {
  'Жи-есть':       { produces: 'еда',      needs: ['удочки', 'часы', 'деньги'],               rarity: 'simple',      emoji: '🥟' },
  'С-метан-а':     { produces: 'топливо',  needs: ['механизмы', 'металл', 'деньги'],          rarity: 'simple',      emoji: '⛽' },
  'Бадяга':        { produces: 'алкоголь', needs: ['еда', 'топливо', 'стекло'],               rarity: 'simple',      emoji: '🍺' },
  'Тяп-ляп':       { produces: 'работа',   needs: ['алкоголь', 'механизмы', 'еда'],           rarity: 'rare',        emoji: '🔨' },
  'Живчик':        { produces: 'удочки',   needs: ['металл', 'часы', 'алкоголь'],             rarity: 'rare',        emoji: '🎣' },
  'Шестерка':      { produces: 'механизмы',needs: ['деньги', 'еда', 'удочки'],                rarity: 'rare',        emoji: '⚙️' },
  'Осколок':       { produces: 'стекло',   needs: ['топливо', 'удочки', 'металл'],            rarity: 'epic',        emoji: '🔮' },
  'Р-туть':        { produces: 'металл',   needs: ['топливо', 'механизмы', 'работа'],         rarity: 'epic',        emoji: '🔩' },
  'Алё, бизнес?':  { produces: 'деньги',   needs: ['работа', 'алкоголь', 'часы', 'стекло'],   rarity: 'legendary',   emoji: '💵' },
  '23:59':         { produces: 'часы',     needs: ['стекло', 'механизмы', 'работа', 'металл'],rarity: 'collectible', emoji: '⏰' }
};

const STARTER_CARD = 'Жи-есть';

/* ---------- Шаблоны юнитов ---------- */
const TEMPLATES = {
  scout:      { id: 'scout',      name: 'Разведчик', hp: 10, dmg: 2, cost: 50,  paper: 1, points: 5,  emoji: '🛶', unlockCycles: 0 },
  frigate:    { id: 'frigate',    name: 'Фрегат',    hp: 20, dmg: 4, cost: 120, paper: 2, points: 8,  emoji: '⛵', unlockCycles: 2 },
  battleship: { id: 'battleship', name: 'Линкор',    hp: 30, dmg: 6, cost: 250, paper: 3, points: 12, emoji: '🚢', unlockCycles: 4 }
};

const FOLD_POSITIONS = {
  5:  [{x:20,y:20},{x:75,y:20},{x:80,y:65},{x:45,y:80},{x:15,y:60}],
  8:  [{x:15,y:15},{x:50,y:10},{x:85,y:20},{x:85,y:60},{x:60,y:85},{x:25,y:85},{x:10,y:55},{x:50,y:50}],
  12: [{x:10,y:12},{x:40,y:10},{x:70,y:12},{x:88,y:30},{x:88,y:60},{x:70,y:82},
       {x:40,y:88},{x:15,y:82},{x:8,y:55},{x:25,y:35},{x:55,y:35},{x:65,y:60}]
};

/* ---------- Игровое состояние ---------- */
const game = {
  player: null,
  bot: null,
  board: null,
  market: null,
  battle: null,
  ui: {
    screen: 'menu',
    modal: null,
    busy: false,
    businessTurn: 'player',
    businessEnded: false,
    dice: null,
    folding: null
  }
};

/* ---------- Хелперы ---------- */
function $(id) { return document.getElementById(id); }

function isCardOwned(name) {
  const card = CARDS[name];
  if (!card) return false;
  const max = RARITIES[card.rarity].fragments;
  return (game.player.cardFragments[name] || 0) >= max;
}

function getOwnedCards() {
  return Object.keys(CARDS).filter(isCardOwned);
}

function getCardRent(name) {
  const card = CARDS[name];
  if (!card) return 0;
  let rent = RARITIES[card.rarity].rent;
  if (game.player.discountCard === name) rent = Math.round(rent * 0.5);
  return rent;
}

function cycleDiscount(justPlayedCard) {
  const owned = getOwnedCards();
  if (owned.length <= 1) {
    game.player.discountCard = owned[0] || null;
    return;
  }
  const others = owned.filter(n => n !== justPlayedCard);
  game.player.discountCard = others[Math.floor(Math.random() * others.length)];
}

function refreshDiscountCard() {
  const owned = getOwnedCards();
  if (owned.length === 0) {
    game.player.discountCard = null;
  } else if (!owned.includes(game.player.discountCard)) {
    game.player.discountCard = owned[0];
  }
}

/* ---------- Инициализация игрока ---------- */
function createDefaultPlayer() {
  const cardFragments = {};
  Object.keys(CARDS).forEach(name => { cardFragments[name] = 0; });
  cardFragments[STARTER_CARD] = RARITIES[CARDS[STARTER_CARD].rarity].fragments;

  return {
    coins: 150,
    paper: 3,
    level: 1,
    cycles: 0,
    cardFragments,
    discountCard: STARTER_CARD,
    unlocked: { scout: true, frigate: false, battleship: false },
    fleet: [],
    business: null
  };
}

/* ---------- Сохранение / загрузка ---------- */
function saveProgress() {
  const data = {
    coins: game.player.coins,
    paper: game.player.paper,
    level: game.player.level,
    cycles: game.player.cycles,
    cardFragments: game.player.cardFragments,
    discountCard: game.player.discountCard,
    unlocked: game.player.unlocked,
    fleet: game.player.fleet
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProgress() {
  game.player = createDefaultPlayer();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (typeof data.coins === 'number') game.player.coins = data.coins;
    if (typeof data.paper === 'number') game.player.paper = data.paper;
    if (typeof data.level === 'number') game.player.level = data.level;
    if (typeof data.cycles === 'number') game.player.cycles = data.cycles;
    if (data.unlocked) {
      game.player.unlocked = Object.assign(
        { scout: true, frigate: false, battleship: false },
        data.unlocked
      );
    }
    if (Array.isArray(data.fleet)) game.player.fleet = data.fleet;
    if (data.cardFragments && typeof data.cardFragments === 'object') {
      Object.keys(CARDS).forEach(name => {
        const v = data.cardFragments[name];
        if (typeof v === 'number') game.player.cardFragments[name] = v;
      });
    }
    if (typeof data.discountCard === 'string') {
      game.player.discountCard = data.discountCard;
    }
  } catch (e) {
    console.warn('Ошибка загрузки прогресса', e);
  }
  updateUnlocks(false);
  refreshDiscountCard();
}

function updateUnlocks(save = true) {
  const cycles = game.player.cycles;
  game.player.unlocked.scout = true;
  game.player.unlocked.frigate = cycles >= 2;
  game.player.unlocked.battleship = cycles >= 4;
  game.player.level = 1 + Math.floor(cycles / 2);
  if (save) saveProgress();
}

function addCycles(n) {
  game.player.cycles += n;
  updateUnlocks(true);
}

function resetProgress() {
  game.player = createDefaultPlayer();
  game.bot = null;
  game.board = null;
  game.market = null;
  game.battle = null;
  game.ui.busy = false;
  game.ui.businessEnded = false;
  game.ui.businessTurn = 'player';
  game.ui.dice = null;
  game.ui.folding = null;
  saveProgress();
  showScreen('menu');
}

/* ---------- Ресурсы в шапке ---------- */
function renderResources() {
  const ownedCount = getOwnedCards().length;
  const html = `
    <span>🪙 ${game.player.coins}</span>
    <span>📄 ${game.player.paper}</span>
    <span>🏢 Ур. ${game.player.level}</span>
    <span>🔄 ${game.player.cycles}</span>
    <span>🎴 ${ownedCount}/10</span>
  `;
  ['menu-resources', 'business-resources', 'prep-resources', 'battle-resources'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = html;
  });
}

/* ---------- Главное меню ---------- */
function renderMenu() {
  renderResources();
  const owned = getOwnedCards();
  const totalFragments = Object.values(game.player.cardFragments).reduce((a,b) => a+b, 0);

  $('menu-stats').innerHTML = `
    <span>Монеты: ${game.player.coins}</span>
    <span>Бумага: ${game.player.paper}</span>
    <span>Уровень: ${game.player.level}</span>
    <span>Циклы: ${game.player.cycles}</span>
    <span>Визиток собрано: ${owned.length}/${Object.keys(CARDS).length}</span>
    <span>Фрагментов всего: ${totalFragments}</span>
    <span>Флот: ${game.player.fleet.length}/3</span>
  `;
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = $('screen-' + name);
  if (screen) screen.classList.add('active');
  game.ui.screen = name;
  if (name === 'menu') renderMenu();
  if (name === 'business') renderBusiness();
  if (name === 'battle-prep') renderBattlePrep();
  if (name === 'battle') renderBattle();
}

/* ---------- Модалки ---------- */
function openModal(title, html, onClose) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <button class="modal-close">×</button>
    <h2>${title}</h2>
    <div class="modal-body">${html}</div>
  `;
  overlay.appendChild(modal);
  $('modal-root').appendChild(overlay);
  game.ui.modal = { overlay, modal, onClose: onClose || null };
  modal.querySelector('.modal-close').addEventListener('click', () => {
    const cb = game.ui.modal ? game.ui.modal.onClose : null;
    closeModal();
    if (cb) cb();
  });
  return modal;
}

function closeModal() {
  if (game.ui.modal) {
    const { overlay } = game.ui.modal;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    game.ui.modal = null;
  }
}

function showMessageModal(title, text, onClose) {
  openModal(
    title,
    `<p>${text}</p><div class="modal-actions"><button id="modal-ok" class="big-btn">ОК</button></div>`,
    onClose
  );
  const ok = $('modal-ok');
  if (ok) {
    ok.addEventListener('click', () => {
      const cb = game.ui.modal ? game.ui.modal.onClose : null;
      closeModal();
      if (cb) cb();
    });
  }
}

/* ============================================================
   ГАЛЕРЕЯ ВИЗИТОК
   ============================================================ */
function openGalleryModal() {
  let modal;
  function render() {
    const cards = Object.entries(CARDS).map(([name, card]) => {
      const rarity = RARITIES[card.rarity];
      const have = game.player.cardFragments[name] || 0;
      const max = rarity.fragments;
      const owned = have >= max;
      const isDiscount = game.player.discountCard === name;

      const nameDisplay = owned ? name : '???';
      const emojiDisplay = owned ? card.emoji : '❓';

      let infoHtml = '';
      if (owned) {
        infoHtml = `
          <div>Производит: ${GOODS[card.produces].emoji} ${card.produces} (${GOODS[card.produces].base})</div>
          <div>Нужно: ${card.needs.map(g => GOODS[g].emoji + ' ' + g).join(', ')}</div>
          <div>Аренда: ${rarity.rent} 🪙 ${isDiscount ? '<span class="discount-badge">−50%</span>' : ''}</div>
        `;
      } else {
        infoHtml = `
          <div>Фрагменты: ${have}/${max}</div>
          <div class="hint">Соберите все фрагменты или купите в галерее.</div>
        `;
      }

      const buyBtn = owned
        ? ''
        : `<button class="big-btn" data-buy-card="${name}" ${game.player.coins < rarity.buyPrice ? 'disabled' : ''}>Купить за ${rarity.buyPrice} 🪙</button>`;

      return `
        <div class="gallery-card ${owned ? '' : 'locked'}">
          <div class="card-emoji">${emojiDisplay}</div>
          <div class="card-name">${nameDisplay}</div>
          <div class="card-rarity">
            <span class="rarity-badge" style="background:${rarity.color}">${rarity.name}</span>
          </div>
          <div class="card-info">${infoHtml}</div>
          ${buyBtn ? `<div class="card-actions">${buyBtn}</div>` : ''}
        </div>
      `;
    }).join('');

    const totalCoins = game.player.coins;
    const html = `
      <p>Монеты: <strong>${totalCoins}</strong></p>
      <div class="gallery-grid">${cards}</div>
    `;
    modal.querySelector('.modal-body').innerHTML = html;

    modal.querySelectorAll('[data-buy-card]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-buy-card');
        buyCard(name);
      });
    });
  }

  function buyCard(name) {
    const card = CARDS[name];
    if (!card) return;
    const rarity = RARITIES[card.rarity];
    if (game.player.coins < rarity.buyPrice) return;
    if (isCardOwned(name)) return;

    game.player.coins -= rarity.buyPrice;
    game.player.cardFragments[name] = rarity.fragments;
    refreshDiscountCard();
    saveProgress();
    renderResources();
    renderMenu();
    render();
    showMessageModal('Визитка куплена', `«${name}» добавлена в коллекцию.`, null);
  }

  modal = openModal('Галерея визиток', '<div id="gallery-body"></div>');
  render();
}

/* ============================================================
   ВЫБОР ВИЗИТКИ ДЛЯ БИЗНЕС-СХВАТКИ
   ============================================================ */
function openRentSelectionModal() {
  const owned = getOwnedCards();

  if (owned.length === 0) {
    showMessageModal(
      'Нет визиток',
      'У вас нет ни одной визитки. Соберите фрагменты в бою или купите визитку в галерее.',
      null
    );
    return;
  }

  // Safety net: если у игрока денег меньше минимальной аренды — выдаём кредит
  const minRent = Math.min(...owned.map(getCardRent));
  if (game.player.coins < minRent) {
    game.player.coins = minRent + 50;
    saveProgress();
    renderResources();
    showMessageModal(
      'Поддержка',
      `Вам выдан кредит ${minRent + 50} монет, чтобы продолжить игру.`,
      null
    );
  }

  let selected = null;
  let modal;

  function render() {
    const cardsHtml = owned.map(name => {
      const card = CARDS[name];
      const rarity = RARITIES[card.rarity];
      const rent = getCardRent(name);
      const canAfford = game.player.coins >= rent;
      const isDiscount = game.player.discountCard === name;
      const isSelected = selected === name;

      return `
        <div class="rent-card ${isSelected ? 'selected' : ''} ${canAfford ? '' : 'unaffordable'}"
             data-card="${name}"
             ${canAfford ? '' : 'title="Недостаточно монет"'}>
          <div style="font-size:1.5rem">${card.emoji}</div>
          <div><strong>${name}</strong></div>
          <div class="card-rarity">
            <span class="rarity-badge" style="background:${rarity.color}">${rarity.name}</span>
          </div>
          <div>Производит: ${GOODS[card.produces].emoji} ${card.produces}</div>
          <div>Нужно: ${card.needs.map(g => GOODS[g].emoji + ' ' + g).join(', ')}</div>
          <div>Аренда: <strong>${rent} 🪙</strong>
            ${isDiscount ? '<span class="discount-badge">−50%</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <p>Монеты: <strong>${game.player.coins}</strong>. Выберите визитку для игры.</p>
      <div class="rent-grid">${cardsHtml}</div>
      <div class="modal-actions">
        <button id="btn-start-business" class="big-btn"
          ${selected ? '' : 'disabled'}>
          ${selected ? `Начать игру за ${getCardRent(selected)} 🪙` : 'Выберите визитку'}
        </button>
      </div>
      <p class="hint">Скидка переходит на другую визитку после игры этой.</p>
    `;
    modal.querySelector('.modal-body').innerHTML = html;

    modal.querySelectorAll('[data-card]').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('unaffordable')) return;
        selected = el.getAttribute('data-card');
        render();
      });
    });

    const startBtn = modal.querySelector('#btn-start-business');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!selected) return;
        closeModal();
        startBusiness(selected);
      });
    }
  }

  modal = openModal('Выбор визитки', '<div id="rent-body"></div>');
  render();
}

/* ============================================================
   БИЗНЕС-СХВАТКА
   ============================================================ */
function pickBotCard(playerCardName, neededGood) {
  const playerProduces = CARDS[playerCardName].produces;

  // Бот всегда производит то, что нужно игроку, и всегда нуждается в том,
  // что производит игрок. Это гарантирует взаимную торговлю и отсутствие софтлока.
  const producers = Object.keys(CARDS).filter(name => {
    if (name === playerCardName) return false;
    return CARDS[name].produces === neededGood;
  });

  if (producers.length === 0) {
    return {
      card: Object.keys(CARDS).find(n => n !== playerCardName),
      needs: playerProduces
    };
  }

  const botCardName = producers[Math.floor(Math.random() * producers.length)];
  return { card: botCardName, needs: playerProduces };
}

function startBusiness(cardName) {
  const playerCardDef = CARDS[cardName];
  if (!playerCardDef) return;

  const rent = getCardRent(cardName);
  if (game.player.coins < rent) {
    showMessageModal('Недостаточно монет', `Нужно ${rent} 🪙 для аренды.`, null);
    return;
  }
  game.player.coins -= rent;

  // Скидка переходит на другую визитку
  if (game.player.discountCard === cardName) {
    cycleDiscount(cardName);
  }
  saveProgress();
  renderResources();

  // Выбираем нужный товар (один из списка)
  const neededGood = playerCardDef.needs[Math.floor(Math.random() * playerCardDef.needs.length)];
  const botPick = pickBotCard(cardName, neededGood);
  const botCardName = botPick.card;
  const botCardDef = CARDS[botCardName];
  const botNeededGood = botPick.needs;

  const playerCard = {
    name: cardName,
    produces: playerCardDef.produces,
    needs: neededGood,          // одна строка
    needQty: 10,
    emoji: playerCardDef.emoji
  };
  const botCard = {
    name: botCardName,
    produces: botCardDef.produces,
    needs: botNeededGood,
    needQty: 10,
    emoji: botCardDef.emoji
  };

  game.player.business = {
    money: 100,
    inventory: {},
    card: playerCard,
    position: 0,
    hasMoved: false
  };
  Object.keys(GOODS).forEach(g => { game.player.business.inventory[g] = 0; });

  game.bot = {
    money: 100,
    inventory: {},
    card: botCard,
    position: 0,
    hasMoved: false
  };
  Object.keys(GOODS).forEach(g => { game.bot.inventory[g] = 0; });

  game.board = {
    cells: BOARD_CELLS.slice(),
    playerPos: 0,
    botPos: 0
  };

  game.market = {
    lots: [],
    nextId: 1
  };

  // Начальный склад: по 3 ед. каждого из нужных товаров + по 1 ед. остальных
  const neededGoods = new Set([playerCard.needs, botCard.needs]);
  Object.keys(GOODS).forEach(g => {
    const qty = neededGoods.has(g) ? 3 : 1;
    game.market.lots.push({
      id: game.market.nextId++,
      seller: 'neutral',
      sellerName: 'Склад',
      good: g,
      qty,
      price: Math.round(GOODS[g].base * 1.15)
    });
  });

  game.ui.businessTurn = 'player';
  game.ui.businessEnded = false;
  game.ui.busy = false;
  game.ui.dice = null;

  showScreen('business');
}

function renderCardHtml(card, inventory, hideInventory) {
  const have = inventory[card.needs] || 0;
  return `
    <div class="card-info">
      <div><strong>${card.emoji} ${card.name}</strong></div>
      <div>Производит: ${GOODS[card.produces].emoji} ${card.produces} (база ${GOODS[card.produces].base})</div>
      <div>Нужно: ${GOODS[card.needs].emoji} ${card.needs} × ${card.needQty} (есть ${have})</div>
      ${hideInventory ? '' : `<div class="inventory-list">${renderInventory(inventory)}</div>`}
    </div>
  `;
}

function renderInventory(inv) {
  const items = Object.keys(inv)
    .filter(g => inv[g] > 0)
    .map(g => `<span class="inventory-item">${GOODS[g].emoji} ${g}: ${inv[g]}</span>`);
  return items.length ? items.join('') : '<span class="hint">Инвентарь пуст</span>';
}

function renderBusiness() {
  if (!game.player.business || !game.bot || !game.board) return;

  const pb = game.player.business;
  const bot = game.bot;

  $('business-resources').innerHTML = `
    <span>🪙 ${game.player.coins}</span>
    <span>📄 ${game.player.paper}</span>
    <span>✂️ ${pb.money} обрезков</span>
    <span>🔄 ${game.player.cycles}</span>
  `;

  $('business-player-card').innerHTML = renderCardHtml(pb.card, pb.inventory, false);
  $('business-bot-card').innerHTML = renderCardHtml(bot.card, bot.inventory, true);

  const boardEl = $('business-board');
  boardEl.innerHTML = '';
  game.board.cells.forEach((cell, index) => {
    const meta = CELL_META[cell];
    const cellEl = document.createElement('div');
    cellEl.className = `cell ${meta.cls}`;
    cellEl.innerHTML = `
      <div class="cell-emoji">${meta.emoji}</div>
      <div class="cell-label">${meta.name}</div>
    `;
    const tokens = document.createElement('div');
    tokens.className = 'tokens';
    if (game.board.playerPos === index) tokens.innerHTML += '<span title="Игрок">🔵</span>';
    if (game.board.botPos === index) tokens.innerHTML += '<span title="Бот">🔴</span>';
    cellEl.appendChild(tokens);
    boardEl.appendChild(cellEl);
  });

  const turnText = game.ui.businessTurn === 'player' ? 'Ваш ход' : 'Ход бота';
  $('business-turn-info').innerHTML = `
    <strong>${turnText}</strong><br>
    Обрезки бота: ${bot.money}
  `;
  $('dice-display').textContent = game.ui.dice ? game.ui.dice : '🎲';
  $('btn-roll').disabled = game.ui.businessTurn !== 'player' || game.ui.busy;
  $('btn-business-cards').disabled = game.ui.businessTurn !== 'player' || game.ui.busy;
}

function playerRollBusiness() {
  if (game.ui.businessTurn !== 'player' || game.ui.busy) return;
  game.ui.busy = true;
  const roll = 1 + Math.floor(Math.random() * 6);
  game.ui.dice = roll;
  renderBusiness();
  setTimeout(() => moveBusinessPlayer(roll), 400);
}

function moveBusinessPlayer(roll) {
  const pb = game.player.business;
  let pos = game.board.playerPos;
  for (let i = 0; i < roll; i++) {
    pos = (pos + 1) % 32;
    if (pos === 0) pb.money += 100;
  }
  game.board.playerPos = pos;
  pb.hasMoved = true;
  renderBusiness();
  processPlayerCell();
}

function processPlayerCell() {
  const cell = game.board.cells[game.board.playerPos];
  switch (cell) {
    case 'с':
      showMessageModal('Старт', 'Вы получили 100 обрезков за прохождение старта.', () => endPlayerTurnBusiness());
      break;
    case 'р': openMarketModal(); break;
    case 'п': openProductionModal(); break;
    case 'ш': applyPenaltyPlayer(); break;
    case 'пр':
      showMessageModal('Прогулка', 'Вы прогуливаетесь и пропускаете действие.', () => endPlayerTurnBusiness());
      break;
  }
}

function endPlayerTurnBusiness() {
  if (game.ui.businessEnded) return;
  game.ui.busy = false;
  game.ui.businessTurn = 'bot';
  game.ui.dice = null;
  renderBusiness();
  setTimeout(botTurnBusiness, 900);
}

function applyPenaltyPlayer() {
  const pb = game.player.business;
  let penalty = 0;
  for (const g in pb.inventory) {
    if (pb.inventory[g] > 0) penalty += pb.inventory[g] * GOODS[g].base * 0.25;
  }
  penalty = Math.round(penalty);

  if (penalty <= 0) {
    showMessageModal('Штраф', 'У вас нет товара в инвентаре. Штраф не начислен.', () => endPlayerTurnBusiness());
    return;
  }

  if (pb.money >= penalty) {
    pb.money -= penalty;
    showMessageModal('Штраф', `Выплачен штраф ${penalty} обрезков.`, () => endPlayerTurnBusiness());
  } else {
    const confiscated = Object.keys(pb.inventory)
      .filter(g => pb.inventory[g] > 0)
      .map(g => `${pb.inventory[g]} ${g}`).join(', ');
    for (const g in pb.inventory) pb.inventory[g] = 0;
    showMessageModal('Штраф', `Не хватило обрезков. Товар конфискован: ${confiscated || '—'}.`, () => endPlayerTurnBusiness());
  }
}

/* ---------- Рынок ---------- */
function openMarketModal() {
  const pb = game.player.business;
  let modal;

  function renderMarket() {
    const lotsHtml = game.market.lots.length === 0
      ? '<p class="hint">Лотов пока нет.</p>'
      : game.market.lots.map(lot => {
          const total = lot.price * lot.qty;
          const canBuy = lot.seller !== 'player' && pb.money >= total && lot.qty > 0;
          return `
            <div class="lot-row">
              <div class="lot-info">
                <strong>${GOODS[lot.good].emoji} ${lot.good}</strong> × ${lot.qty}
                ${lot.good === pb.card.needs ? ' <span class="discount-badge">нужно</span>' : ''}<br>
                Продавец: ${lot.sellerName} · ${lot.price} за ед. (итого ${total})
              </div>
              <button class="big-btn" data-buy="${lot.id}" ${canBuy ? '' : 'disabled'}>Купить</button>
            </div>
          `;
        }).join('');

    const hasInventory = Object.keys(pb.inventory).some(g => pb.inventory[g] > 0);
    const html = `
      <p>Ваши обрезки: <strong>${pb.money}</strong> · Нужно: ${GOODS[pb.card.needs].emoji} ${pb.card.needs} (${pb.inventory[pb.card.needs] || 0}/${pb.card.needQty})</p>
      <div id="market-lots">${lotsHtml}</div>
      <div id="market-msg" class="hint"></div>
      <div class="modal-actions">
        <button id="btn-open-listing" class="big-btn" ${hasInventory ? '' : 'disabled'}>Выставить на продажу</button>
      </div>
    `;
    modal.querySelector('.modal-body').innerHTML = html;

    modal.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-buy'), 10);
        buyLot(id);
      });
    });

    const listingBtn = modal.querySelector('#btn-open-listing');
    if (listingBtn) listingBtn.addEventListener('click', openListingModal);
  }

  modal = openModal('Рынок', '<div id="market-body"></div>', () => endPlayerTurnBusiness());
  renderMarket();
}

function buyLot(id) {
  const pb = game.player.business;
  const lot = game.market.lots.find(l => l.id === id);
  if (!lot || lot.qty <= 0 || lot.seller === 'player') return;

  const total = lot.price * lot.qty;
  if (pb.money < total) {
    const msg = $('market-msg');
    if (msg) msg.textContent = 'Недостаточно обрезков.';
    return;
  }

  pb.money -= total;
  pb.inventory[lot.good] = (pb.inventory[lot.good] || 0) + lot.qty;

  if (lot.seller === 'bot') game.bot.money += total;
  game.market.lots = game.market.lots.filter(l => l.id !== id);

  closeModal();
  showMessageModal('Покупка', `Куплено ${lot.qty} ${lot.good} за ${total} обрезков.`, () => endPlayerTurnBusiness());
}

function openListingModal() {
  const pb = game.player.business;
  const availableGoods = Object.keys(pb.inventory).filter(g => pb.inventory[g] > 0);
  if (availableGoods.length === 0) {
    const msg = $('market-msg');
    if (msg) msg.textContent = 'У вас нет товара для выставления.';
    return;
  }

  let selectedGood = availableGoods[0];
  let qty = 1;
  let price = Math.round(GOODS[selectedGood].base * 0.8);

  const modal = openModal('Выставить на продажу', '<div id="listing-body"></div>', () => endPlayerTurnBusiness());
  const body = modal.querySelector('#listing-body');

  function clamp() {
    const maxQty = Math.min(5, pb.inventory[selectedGood] || 0);
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) qty = 1;
    const base = GOODS[selectedGood].base;
    if (price < Math.round(base * 0.5)) price = Math.round(base * 0.5);
    if (price > Math.round(base * 1.5)) price = Math.round(base * 1.5);
  }

  function render() {
    clamp();
    const base = GOODS[selectedGood].base;
    const percent = Math.round((price / base) * 100);
    body.innerHTML = `
      <p>Выберите товар:</p>
      <div class="inventory-list">
        ${availableGoods.map(g => `
          <button class="inventory-item ${g === selectedGood ? 'selected' : ''}" data-good="${g}">
            ${GOODS[g].emoji} ${g} (${pb.inventory[g]})
          </button>
        `).join('')}
      </div>
      <p>Количество:
        <button id="list-qty-minus" class="secondary-btn">−</button>
        <strong id="list-qty">${qty}</strong>
        <button id="list-qty-plus" class="secondary-btn">+</button>
      </p>
      <p>Цена за единицу:
        <button id="list-price-minus" class="secondary-btn">−</button>
        <strong id="list-price">${price}</strong> (${percent}% от базы ${base})
        <button id="list-price-plus" class="secondary-btn">+</button>
      </p>
      <div id="listing-msg" class="hint"></div>
      <div class="modal-actions">
        <button id="btn-confirm-listing" class="big-btn">Выставить</button>
      </div>
    `;
    body.querySelectorAll('[data-good]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedGood = btn.getAttribute('data-good');
        qty = 1;
        price = Math.round(GOODS[selectedGood].base * 0.8);
        render();
      });
    });
    body.querySelector('#list-qty-minus').addEventListener('click', () => { qty--; render(); });
    body.querySelector('#list-qty-plus').addEventListener('click', () => { qty++; render(); });
    body.querySelector('#list-price-minus').addEventListener('click', () => { price -= 2; render(); });
    body.querySelector('#list-price-plus').addEventListener('click', () => { price += 2; render(); });
    body.querySelector('#btn-confirm-listing').addEventListener('click', () => {
      clamp();
      const base = GOODS[selectedGood].base;
      if (pb.inventory[selectedGood] < qty) {
        body.querySelector('#listing-msg').textContent = 'Недостаточно товара.';
        return;
      }
      if (price < base * 0.5 || price > base * 1.5) {
        body.querySelector('#listing-msg').textContent = 'Цена вне диапазона 50–150%.';
        return;
      }
      pb.inventory[selectedGood] -= qty;
      game.market.lots.push({
        id: game.market.nextId++,
        seller: 'player', sellerName: 'Игрок',
        good: selectedGood, qty, price
      });
      closeModal();
      showMessageModal('Товар выставлен', `Вы выставили ${qty} ${selectedGood} по ${price}.`, () => endPlayerTurnBusiness());
    });
  }
  render();
}

/* ---------- Производство ---------- */
function openProductionModal() {
  const pb = game.player.business;
  const good = pb.card.produces;
  const base = GOODS[good].base;
  const cost2 = Math.round(base * 0.5);
  const cost3 = Math.round(base * 1.5);

  const html = `
    <p>Производим: ${GOODS[good].emoji} ${good} (базовая цена ${base})</p>
    <p>Ваши обрезки: <strong>${pb.money}</strong></p>
    <div class="modal-actions">
      <button class="big-btn" data-prod="1">1 — бесплатно</button>
      <button class="big-btn" data-prod="2" ${pb.money >= cost2 ? '' : 'disabled'}>2 — ${cost2} обрезков</button>
      <button class="big-btn" data-prod="3" ${pb.money >= cost3 ? '' : 'disabled'}>3 — ${cost3} обрезков</button>
    </div>
    <div id="prod-msg" class="hint"></div>
  `;

  const modal = openModal('Производство', html, () => endPlayerTurnBusiness());

  modal.querySelectorAll('[data-prod]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qty = parseInt(btn.getAttribute('data-prod'), 10);
      let cost = 0;
      if (qty === 2) cost = cost2;
      if (qty === 3) cost = cost3;
      if (pb.money < cost) {
        modal.querySelector('#prod-msg').textContent = 'Не хватает обрезков для производства.';
        return;
      }
      pb.money -= cost;
      pb.inventory[good] = (pb.inventory[good] || 0) + qty;
      closeModal();
      showMessageModal('Производство', `Произведено ${qty} ${good}.`, () => endPlayerTurnBusiness());
    });
  });
}

/* ---------- Мои визитки ---------- */
function openPlayerCardsModal() {
  if (game.ui.businessTurn !== 'player' || game.ui.busy) return;

  const pb = game.player.business;
  const card = pb.card;
  const have = pb.inventory[card.needs] || 0;
  const canClose = have >= card.needQty;

  const html = `
    <div class="paper-card">
      <h3>${card.emoji} ${card.name}</h3>
      <p>Производит: ${GOODS[card.produces].emoji} ${card.produces}</p>
      <p>Нужно: ${GOODS[card.needs].emoji} ${card.needs} × ${card.needQty} (есть ${have})</p>
      <h4>Инвентарь</h4>
      <div class="inventory-list">${renderInventory(pb.inventory)}</div>
      <div class="modal-actions">
        <button id="btn-close-card" class="big-btn" ${canClose ? '' : 'disabled'}>Закрыть визитку</button>
      </div>
      ${canClose ? '' : '<p class="hint">Недостаточно товара для закрытия.</p>'}
    </div>
  `;

  openModal('Мои визитки', html);

  const btn = $('btn-close-card');
  if (btn && canClose) {
    btn.addEventListener('click', () => {
      closeModal();
      endBusiness('player');
    });
  }
}

/* ---------- Ход бота ---------- */
function botTurnBusiness() {
  if (game.ui.businessEnded) return;
  const roll = 1 + Math.floor(Math.random() * 6);
  game.ui.dice = roll;
  renderBusiness();

  setTimeout(() => {
    let pos = game.board.botPos;
    for (let i = 0; i < roll; i++) {
      pos = (pos + 1) % 32;
      if (pos === 0) game.bot.money += 100;
    }
    game.board.botPos = pos;
    game.bot.hasMoved = true;
    renderBusiness();
    processBotCell();
  }, 500);
}

function processBotCell() {
  const cell = game.board.cells[game.board.botPos];
  switch (cell) {
    case 'р': botMarketAction(); break;
    case 'п': botProductionAction(); break;
    case 'ш': botPenaltyAction(); break;
  }

  if (checkBotWin()) return;

  setTimeout(() => {
    if (game.ui.businessEnded) return;
    game.ui.businessTurn = 'player';
    game.ui.dice = null;
    game.ui.busy = false;
    renderBusiness();
  }, 700);
}

function botProductionAction() {
  const bot = game.bot;
  const good = bot.card.produces;
  const base = GOODS[good].base;
  let qty = 1;
  if (bot.money >= Math.round(base * 0.5)) qty = 2;
  const cost = qty === 1 ? 0 : Math.round(base * 0.5);
  if (bot.money >= cost) {
    bot.money -= cost;
    bot.inventory[good] = (bot.inventory[good] || 0) + qty;
  } else {
    bot.inventory[good] = (bot.inventory[good] || 0) + 1;
  }
}

function botMarketAction() {
  const bot = game.bot;
  const needed = bot.card.needs;
  const have = bot.inventory[needed] || 0;

  if (have < bot.card.needQty) {
    const maxPrice = Math.round(GOODS[needed].base * 1.3);
    const candidates = game.market.lots
      .filter(l => l.seller !== 'bot' && l.good === needed && l.price <= maxPrice && l.qty > 0)
      .sort((a, b) => a.price - b.price);

    for (const lot of candidates) {
      const total = lot.price * lot.qty;
      if (bot.money >= total) {
        bot.money -= total;
        bot.inventory[needed] += lot.qty;
        if (lot.seller === 'player') game.player.business.money += total;
        game.market.lots = game.market.lots.filter(l => l.id !== lot.id);
        break;
      }
    }
  }

  const product = bot.card.produces;
  const productQty = bot.inventory[product] || 0;
  if (productQty > 0) {
    const listQty = Math.min(productQty, 3);
    const price = Math.round(GOODS[product].base * 1.1);
    bot.inventory[product] -= listQty;
    game.market.lots.push({
      id: game.market.nextId++,
      seller: 'bot', sellerName: 'Бот',
      good: product, qty: listQty, price
    });
  }
}

function botPenaltyAction() {
  const bot = game.bot;
  let penalty = 0;
  for (const g in bot.inventory) {
    if (bot.inventory[g] > 0) penalty += bot.inventory[g] * GOODS[g].base * 0.25;
  }
  penalty = Math.round(penalty);
  if (penalty <= 0) return;
  if (bot.money >= penalty) bot.money -= penalty;
  else for (const g in bot.inventory) bot.inventory[g] = 0;
}

function checkBotWin() {
  const bot = game.bot;
  if (bot.inventory[bot.card.needs] >= bot.card.needQty) {
    endBusiness('bot');
    return true;
  }
  return false;
}

function endBusiness(result) {
  if (game.ui.businessEnded) return;
  game.ui.businessEnded = true;
  game.ui.busy = true;

  const playedCard = game.player.business ? game.player.business.card.name : STARTER_CARD;
  const rarity = CARDS[playedCard] ? RARITIES[CARDS[playedCard].rarity] : RARITIES.simple;

  let coins = 0, paper = 0, cycles = 0, title = '', text = '';

  if (result === 'player') {
    coins = rarity.coinWin;
    paper = rarity.paperWin;
    cycles = 1;
    title = 'Победа в бизнес-схватке!';
    text = `Вы первыми закрыли визитку.<br>Награда: +${coins} 🪙, +${paper} 📄, +${cycles} цикл.`;
  } else {
    coins = 30;
    title = 'Поражение в бизнес-схватке';
    text = `Бот закрыл визитку раньше.<br>Утешительный приз: +${coins} 🪙.`;
  }

  game.player.coins += coins;
  game.player.paper += paper;
  if (cycles) addCycles(cycles);
  saveProgress();
  renderResources();

  openModal(title,
    `<p>${text}</p><div class="modal-actions"><button id="modal-result-ok" class="big-btn">В главное меню</button></div>`,
    () => { cleanupBusiness(); showScreen('menu'); }
  );
  const ok = $('modal-result-ok');
  if (ok) ok.addEventListener('click', () => { closeModal(); cleanupBusiness(); showScreen('menu'); });
}

function cleanupBusiness() {
  game.player.business = null;
  game.bot = null;
  game.board = null;
  game.market = null;
  game.ui.businessTurn = 'player';
  game.ui.businessEnded = false;
  game.ui.busy = false;
  game.ui.dice = null;
}

/* ============================================================
   ПОДГОТОВКА К БОЮ / СКЛАДЫВАНИЕ
   ============================================================ */
function renderBattlePrep() {
  renderResources();
  $('fleet-count').textContent = `${game.player.fleet.length}/3`;
  const fleetEl = $('fleet-display');
  fleetEl.innerHTML = '';
  if (game.player.fleet.length === 0) {
    fleetEl.innerHTML = '<p class="hint">Флот пуст. Сложите юнита в разделе «Складывание».</p>';
  } else {
    game.player.fleet.forEach(unit => {
      const div = document.createElement('div');
      div.className = 'unit-card';
      div.innerHTML = `
        <div class="unit-name">${unit.emoji} ${unit.name}</div>
        <div class="unit-stats">HP ${unit.maxHp} · Урон ${unit.dmg}</div>
      `;
      fleetEl.appendChild(div);
    });
  }
  $('btn-start-battle').disabled = game.player.fleet.length === 0;
}

function openGalleryTemplatesModal() {
  const html = `
    <div class="template-grid">
      ${Object.values(TEMPLATES).map(t => {
        const unlocked = game.player.unlocked[t.id] || game.player.cycles >= t.unlockCycles;
        return `
          <div class="template-card ${unlocked ? '' : 'locked'}">
            <h4>${t.emoji} ${t.name}</h4>
            <div>HP: ${t.hp} · Урон: ${t.dmg}</div>
            <div>Цена: ${t.cost} 🪙 + ${t.paper} 📄</div>
            <div>Точек сгиба: ${t.points}</div>
            <div class="hint">${unlocked ? 'Доступен' : `Откроется после ${t.unlockCycles} циклов`}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  openModal('Галерея шаблонов', html);
}

function openFoldingModal() {
  if (game.player.fleet.length >= 3) {
    showMessageModal('Флот полон', 'Максимум 3 юнита.', null);
    return;
  }
  const html = `
    <div class="template-grid">
      ${Object.values(TEMPLATES).map(t => {
        const unlocked = game.player.unlocked[t.id] || game.player.cycles >= t.unlockCycles;
        const canAfford = game.player.coins >= t.cost && game.player.paper >= t.paper;
        return `
          <div class="template-card ${unlocked ? '' : 'locked'}">
            <h4>${t.emoji} ${t.name}</h4>
            <div>HP: ${t.hp} · Урон: ${t.dmg}</div>
            <div>Цена: ${t.cost} 🪙 + ${t.paper} 📄</div>
            <div class="hint">${unlocked ? (canAfford ? 'Можно складывать' : 'Не хватает ресурсов') : `Откроется после ${t.unlockCycles} циклов`}</div>
            <button class="big-btn" data-template="${t.id}" ${unlocked && canAfford ? '' : 'disabled'}>Складывать</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  const modal = openModal('Складывание', html);
  modal.querySelectorAll('[data-template]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-template');
      const t = TEMPLATES[id];
      if (!t) return;
      if (!game.player.unlocked[t.id] && game.player.cycles < t.unlockCycles) return;
      if (game.player.fleet.length >= 3) { showMessageModal('Флот полон', 'Максимум 3 юнита.', null); return; }
      if (game.player.coins < t.cost || game.player.paper < t.paper) { showMessageModal('Не хватает ресурсов', 'Нужно больше монет или бумаги.', null); return; }
      game.player.coins -= t.cost;
      game.player.paper -= t.paper;
      saveProgress();
      closeModal();
      startFoldingMiniGame(t);
    });
  });
}

function getFoldPositions(count) { return FOLD_POSITIONS[count] || FOLD_POSITIONS[5]; }

function startFoldingMiniGame(template) {
  game.ui.folding = { template, next: 1, errors: 0, totalPoints: template.points };
  const positions = getFoldPositions(template.points);
  const pointsHtml = positions.map((p, i) => `
    <button class="fold-point" data-point="${i + 1}" style="left:${p.x}%; top:${p.y}%;">${i + 1}</button>
  `).join('');

  const html = `
    <p>Кликните по точкам в порядке 1 → 2 → ... → ${template.points}. Ошибок до провала: 3.</p>
    <div class="fold-paper" id="fold-paper">${pointsHtml}</div>
    <div id="fold-status" class="turn-info">Ошибок: 0</div>
  `;

  const modal = openModal(`Складывание: ${template.emoji} ${template.name}`, html, () => {
    game.ui.folding = null;
    renderBattlePrep();
  });

  const paper = modal.querySelector('#fold-paper');
  const status = modal.querySelector('#fold-status');

  paper.addEventListener('click', (e) => {
    const btn = e.target.closest('.fold-point');
    if (!btn) return;
    const num = parseInt(btn.getAttribute('data-point'), 10);
    const f = game.ui.folding;
    if (!f || btn.classList.contains('done')) return;

    if (num === f.next) {
      btn.classList.add('done');
      f.next++;
      if (f.next > f.totalPoints) {
        const unit = {
          id: 'unit_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          templateId: f.template.id,
          name: f.template.name,
          emoji: f.template.emoji,
          maxHp: f.template.hp,
          hp: f.template.hp,
          dmg: f.template.dmg
        };
        game.player.fleet.push(unit);
        saveProgress();
        closeModal();
        game.ui.folding = null;
        showMessageModal('Успех!', `Юнит «${unit.name}» добавлен во флот.`, () => renderBattlePrep());
      } else {
        status.textContent = `Ошибок: ${f.errors}`;
      }
    } else {
      f.errors++;
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 300);
      status.textContent = `Ошибок: ${f.errors}`;
      if (f.errors >= 3) {
        closeModal();
        game.ui.folding = null;
        showMessageModal('Складывание провалено', 'Вы допустили 3 ошибки. Ресурсы не возвращаются.', () => renderBattlePrep());
      }
    }
  });
}

/* ============================================================
   БОЙ
   ============================================================ */
function startBattle() {
  if (!game.player.fleet || game.player.fleet.length === 0) return;

  const playerUnits = game.player.fleet.map(u => ({ ...u, hp: u.maxHp, alive: true }));

  const botSize = Math.min(3, Math.max(1, game.player.fleet.length));
  const botUnits = [];
  for (let i = 0; i < botSize; i++) {
    let templateId = 'scout';
    if (game.player.cycles >= 4 && i === 0) templateId = 'battleship';
    else if (game.player.cycles >= 2 && i < 2) templateId = 'frigate';
    const t = TEMPLATES[templateId];
    botUnits.push({
      id: 'bot_' + i + '_' + Date.now(),
      templateId: t.id, name: t.name, emoji: t.emoji,
      maxHp: t.hp, hp: t.hp, dmg: t.dmg, alive: true
    });
  }

  game.battle = {
    playerUnits, botUnits,
    turn: null, started: false, over: false,
    log: [], resultShown: false, dice: null
  };

  showScreen('battle');
}

function renderUnitCard(unit, isEnemy) {
  const div = document.createElement('div');
  div.className = 'unit-card' + (isEnemy ? ' enemy' : '') + (unit.hp <= 0 ? ' dead' : '');
  const hpPercent = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
  const fillColor = hpPercent > 50 ? 'var(--success)' : hpPercent > 25 ? '#d4a017' : 'var(--danger)';
  div.innerHTML = `
    <div class="unit-name">${unit.emoji} ${unit.name}</div>
    <div class="hp-bar"><div class="hp-bar-fill" style="width:${hpPercent}%; background:${fillColor};"></div></div>
    <div class="unit-stats">HP ${Math.max(0, unit.hp)}/${unit.maxHp} · Урон ${unit.dmg}</div>
  `;
  if (isEnemy && game.battle && game.battle.started && !game.battle.over && game.battle.turn === 'player' && unit.hp > 0) {
    div.addEventListener('click', () => playerAttack(unit.id));
  }
  return div;
}

function renderBattle() {
  if (!game.battle) return;
  renderResources();
  const pEl = $('battle-player-units');
  const bEl = $('battle-bot-units');
  pEl.innerHTML = ''; bEl.innerHTML = '';
  game.battle.playerUnits.forEach(u => pEl.appendChild(renderUnitCard(u, false)));
  game.battle.botUnits.forEach(u => bEl.appendChild(renderUnitCard(u, true)));

  const started = game.battle.started;
  const over = game.battle.over;
  $('btn-battle-start').style.display = started ? 'none' : 'inline-block';
  $('btn-battle-start').disabled = game.battle.playerUnits.length === 0;

  let turnText = '';
  if (!started) turnText = 'Бросьте кубик, чтобы определить первый ход.';
  else if (over) turnText = 'Бой окончен.';
  else turnText = game.battle.turn === 'player'
    ? 'Ваш ход: выберите вражеского юнита.'
    : 'Ход бота...';

  $('battle-turn-info').textContent = turnText;
  $('battle-dice').textContent = game.battle.dice ? game.battle.dice : '🎲';
  $('battle-log').innerHTML = game.battle.log.map(line => `<div>${line}</div>`).join('');
}

function startBattleDice() {
  if (!game.battle || game.battle.started) return;
  const roll = 1 + Math.floor(Math.random() * 6);
  game.battle.dice = roll;
  game.battle.started = true;
  game.battle.turn = roll % 2 === 0 ? 'player' : 'bot';
  game.battle.log.push(`🎲 Выпало ${roll}. Первым ходит ${game.battle.turn === 'player' ? 'игрок' : 'бот'}.`);
  renderBattle();
  if (game.battle.turn === 'bot') setTimeout(botAttack, 800);
}

function playerAttack(targetId) {
  if (!game.battle || game.battle.turn !== 'player' || game.battle.over) return;
  const target = game.battle.botUnits.find(u => u.id === targetId);
  if (!target || target.hp <= 0) return;
  const attackers = game.battle.playerUnits.filter(u => u.hp > 0);
  if (attackers.length === 0) return;
  let totalDamage = 0;
  attackers.forEach(u => { totalDamage += u.dmg; });
  target.hp -= totalDamage;
  game.battle.log.push(`Ваши юниты атакуют ${target.name} на ${totalDamage} урона.`);
  if (target.hp <= 0) { target.hp = 0; game.battle.log.push(`${target.name} уничтожен!`); }
  renderBattle();
  if (checkBattleEnd()) return;
  game.battle.turn = 'bot';
  renderBattle();
  setTimeout(botAttack, 700);
}

function botAttack() {
  if (!game.battle || game.battle.turn !== 'bot' || game.battle.over) return;
  const attackers = game.battle.botUnits.filter(u => u.hp > 0);
  if (attackers.length === 0) { checkBattleEnd(); return; }
  const alivePlayers = game.battle.playerUnits.filter(u => u.hp > 0);
  if (alivePlayers.length === 0) { checkBattleEnd(); return; }
  const target = alivePlayers.reduce((min, u) => u.hp < min.hp ? u : min, alivePlayers[0]);
  let totalDamage = 0;
  attackers.forEach(u => { totalDamage += u.dmg; });
  target.hp -= totalDamage;
  game.battle.log.push(`Бот атакует ${target.name} на ${totalDamage} урона.`);
  if (target.hp <= 0) { target.hp = 0; game.battle.log.push(`${target.name} уничтожен!`); }
  renderBattle();
  if (checkBattleEnd()) return;
  game.battle.turn = 'player';
  renderBattle();
}

function checkBattleEnd() {
  const playerAlive = game.battle.playerUnits.some(u => u.hp > 0);
  const botAlive = game.battle.botUnits.some(u => u.hp > 0);
  if (!playerAlive || !botAlive) {
    game.battle.over = true;
    endBattle(playerAlive && !botAlive);
    return true;
  }
  return false;
}

function dropRandomFragment() {
  const available = Object.keys(CARDS).filter(name => {
    const max = RARITIES[CARDS[name].rarity].fragments;
    return (game.player.cardFragments[name] || 0) < max;
  });
  if (available.length === 0) return null;
  const card = available[Math.floor(Math.random() * available.length)];
  game.player.cardFragments[card] = (game.player.cardFragments[card] || 0) + 1;
  const max = RARITIES[CARDS[card].rarity].fragments;
  return { card, complete: game.player.cardFragments[card] >= max };
}

function endBattle(win) {
  if (!game.battle || game.battle.resultShown) return;
  game.battle.resultShown = true;

  let coins = 0, cycles = 0, title = '', text = '';

  if (win) {
    coins = 50;
    cycles = 1;
    const drop = dropRandomFragment();
    title = 'Победа в бою!';
    let fragText = '';
    if (drop) {
      fragText = `<br>Получен фрагмент визитки «${drop.card}».`;
      if (drop.complete) {
        fragText += `<br><strong>Визитка «${drop.card}» полностью собрана!</strong>`;
        refreshDiscountCard();
      }
    } else {
      fragText = '<br>Все визитки уже собраны.';
    }
    text = `Вражеский флот уничтожен.<br>Награда: +${coins} 🪙, +${cycles} цикл.${fragText}`;
  } else {
    coins = 10;
    title = 'Поражение в бою';
    text = `Ваш флот уничтожен.<br>Утешительный приз: +${coins} 🪙.`;
  }

  game.player.coins += coins;
  if (cycles) addCycles(cycles);
  game.player.fleet = [];
  saveProgress();
  renderResources();

  openModal(title,
    `<p>${text}</p><div class="modal-actions"><button id="modal-battle-result-ok" class="big-btn">В главное меню</button></div>`,
    () => { cleanupBattle(); showScreen('menu'); }
  );
  const ok = $('modal-battle-result-ok');
  if (ok) ok.addEventListener('click', () => { closeModal(); cleanupBattle(); showScreen('menu'); });
}

function cleanupBattle() {
  game.battle = null;
  game.ui.busy = false;
}

/* ============================================================
   СБРОС ПРОГРЕССА
   ============================================================ */
function confirmReset() {
  openModal('Сбросить прогресс?',
    `<p>Все монеты, бумага, циклы, фрагменты, коллекция визиток и флот будут удалены. Это действие нельзя отменить.</p>
     <div class="modal-actions">
       <button id="btn-confirm-reset" class="danger-btn">Да, сбросить</button>
       <button id="btn-cancel-reset" class="secondary-btn">Отмена</button>
     </div>`
  );
  $('btn-confirm-reset').addEventListener('click', () => { closeModal(); resetProgress(); });
  $('btn-cancel-reset').addEventListener('click', closeModal);
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateUnlocks(false);
  renderMenu();
  showScreen('menu');

  $('btn-start-business').addEventListener('click', openRentSelectionModal);
  $('btn-start-battle-prep').addEventListener('click', () => showScreen('battle-prep'));
  $('btn-reset').addEventListener('click', confirmReset);

  $('btn-roll').addEventListener('click', playerRollBusiness);
  $('btn-business-cards').addEventListener('click', openPlayerCardsModal);

  $('btn-gallery').addEventListener('click', openGalleryTemplatesModal);
  $('btn-folding').addEventListener('click', openFoldingModal);
  $('btn-start-battle').addEventListener('click', startBattle);
  $('btn-prep-menu').addEventListener('click', () => showScreen('menu'));

  $('btn-battle-start').addEventListener('click', startBattleDice);
});
