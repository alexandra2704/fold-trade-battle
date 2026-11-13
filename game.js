const STORAGE_KEY = 'fold_trade_battle_save_v1';

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

const GOODS = {
  'еда': { base: 30, emoji: '🍲' },
  'топливо': { base: 40, emoji: '⛽' },
  'алкоголь': { base: 50, emoji: '🍺' }
};

const CARDS = {
  'Жи-есть': { produces: 'еда', needs: 'топливо', needQty: 2, emoji: '🥟' },
  'С-метан-а': { produces: 'топливо', needs: 'еда', needQty: 2, emoji: '⛽' },
  'Бадяга': { produces: 'алкоголь', needs: 'еда', needQty: 2, emoji: '🍺' }
};

const TEMPLATES = {
  scout: { id: 'scout', name: 'Разведчик', hp: 10, dmg: 2, cost: 50, paper: 1, points: 5, emoji: '🛶', unlockCycles: 0 },
  frigate: { id: 'frigate', name: 'Фрегат', hp: 20, dmg: 4, cost: 120, paper: 2, points: 8, emoji: '⛵', unlockCycles: 2 },
  battleship: { id: 'battleship', name: 'Линкор', hp: 30, dmg: 6, cost: 250, paper: 3, points: 12, emoji: '🚢', unlockCycles: 4 }
};

const FOLD_POSITIONS = {
  5: [
    { x: 20, y: 20 }, { x: 75, y: 20 }, { x: 80, y: 65 },
    { x: 45, y: 80 }, { x: 15, y: 60 }
  ],
  8: [
    { x: 15, y: 15 }, { x: 50, y: 10 }, { x: 85, y: 20 },
    { x: 85, y: 60 }, { x: 60, y: 85 }, { x: 25, y: 85 },
    { x: 10, y: 55 }, { x: 50, y: 50 }
  ],
  12: [
    { x: 10, y: 12 }, { x: 40, y: 10 }, { x: 70, y: 12 },
    { x: 88, y: 30 }, { x: 88, y: 60 }, { x: 70, y: 82 },
    { x: 40, y: 88 }, { x: 15, y: 82 }, { x: 8, y: 55 },
    { x: 25, y: 35 }, { x: 55, y: 35 }, { x: 65, y: 60 }
  ]
};

const game = {
  player: {
    coins: 100,
    paper: 3,
    level: 1,
    cycles: 0,
    fragments: 0,
    unlocked: { scout: true, frigate: false, battleship: false },
    fleet: [],
    business: null
  },
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

function $(id) {
  return document.getElementById(id);
}

function saveProgress() {
  const data = {
    coins: game.player.coins,
    paper: game.player.paper,
    level: game.player.level,
    cycles: game.player.cycles,
    fragments: game.player.fragments,
    unlocked: game.player.unlocked,
    fleet: game.player.fleet
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.coins === 'number') game.player.coins = data.coins;
    if (typeof data.paper === 'number') game.player.paper = data.paper;
    if (typeof data.level === 'number') game.player.level = data.level;
    if (typeof data.cycles === 'number') game.player.cycles = data.cycles;
    if (typeof data.fragments === 'number') game.player.fragments = data.fragments;
    if (data.unlocked) {
      game.player.unlocked = Object.assign(
        { scout: true, frigate: false, battleship: false },
        data.unlocked
      );
    }
    if (Array.isArray(data.fleet)) game.player.fleet = data.fleet;
  } catch (e) {
    console.warn('Ошибка загрузки прогресса', e);
  }
  updateUnlocks(false);
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
  game.player = {
    coins: 100,
    paper: 3,
    level: 1,
    cycles: 0,
    fragments: 0,
    unlocked: { scout: true, frigate: false, battleship: false },
    fleet: [],
    business: null
  };
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

function renderResources() {
  const html = `
    <span>🪙 ${game.player.coins}</span>
    <span>📄 ${game.player.paper}</span>
    <span>🏢 Ур. ${game.player.level}</span>
    <span>🔄 ${game.player.cycles}</span>
    <span>🧩 ${game.player.fragments}</span>
  `;
  ['menu-resources', 'business-resources', 'prep-resources', 'battle-resources'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = html;
  });
}

function renderMenu() {
  renderResources();
  $('menu-stats').innerHTML = `
    <span>Монеты: ${game.player.coins}</span>
    <span>Бумага: ${game.player.paper}</span>
    <span>Уровень компании: ${game.player.level}</span>
    <span>Циклы: ${game.player.cycles}</span>
    <span>Фрагменты визиток: ${game.player.fragments}</span>
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

/* ============================= БИЗНЕС-СХВАТКА ============================= */

function startBusiness() {
  const cardNames = Object.keys(CARDS);
  const playerCardName = cardNames[Math.floor(Math.random() * cardNames.length)];
  const playerCardDef = CARDS[playerCardName];

  const playerCard = {
    name: playerCardName,
    produces: playerCardDef.produces,
    needs: playerCardDef.needs,
    needQty: playerCardDef.needQty,
    emoji: playerCardDef.emoji
  };

  const botCardName = cardNames.find(n => n !== playerCardName) || 'Бот-компания';
  const botCard = {
    name: botCardName,
    produces: playerCard.needs,
    needs: playerCard.produces,
    needQty: 2,
    emoji: CARDS[botCardName] ? CARDS[botCardName].emoji : '🤖'
  };

  game.player.business = {
    money: 100,
    inventory: { 'еда': 0, 'топливо': 0, 'алкоголь': 0 },
    card: playerCard,
    position: 0,
    hasMoved: false
  };

  game.bot = {
    money: 100,
    inventory: { 'еда': 0, 'топливо': 0, 'алкоголь': 0 },
    card: botCard,
    position: 0,
    hasMoved: false
  };

  game.board = {
    cells: BOARD_CELLS.slice(),
    playerPos: 0,
    botPos: 0
  };

  game.market = {
    lots: [],
    nextId: 1
  };

  ['еда', 'топливо', 'алкоголь'].forEach(g => {
    game.market.lots.push({
      id: game.market.nextId++,
      seller: 'neutral',
      sellerName: 'Склад',
      good: g,
      qty: 2,
      price: Math.round(GOODS[g].base * 1.1)
    });
  });

  game.ui.businessTurn = 'player';
  game.ui.businessEnded = false;
  game.ui.busy = false;
  game.ui.dice = null;

  showScreen('business');
  renderBusiness();
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

  setTimeout(() => {
    moveBusinessPlayer(roll);
  }, 400);
}

function moveBusinessPlayer(roll) {
  const pb = game.player.business;
  let pos = game.board.playerPos;

  for (let i = 0; i < roll; i++) {
    pos = (pos + 1) % 32;
    if (pos === 0) {
      pb.money += 100;
    }
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
      showMessageModal(
        'Старт',
        'Вы получили 100 обрезков за прохождение старта.',
        () => endPlayerTurnBusiness()
      );
      break;
    case 'р':
      openMarketModal();
      break;
    case 'п':
      openProductionModal();
      break;
    case 'ш':
      applyPenaltyPlayer();
      break;
    case 'пр':
      showMessageModal(
        'Прогулка',
        'Вы прогуливаетесь и пропускаете действие.',
        () => endPlayerTurnBusiness()
      );
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
    if (pb.inventory[g] > 0) {
      penalty += pb.inventory[g] * GOODS[g].base * 0.25;
    }
  }
  penalty = Math.round(penalty);

  if (penalty <= 0) {
    showMessageModal(
      'Штраф',
      'У вас нет товара в инвентаре. Штраф не начислен.',
      () => endPlayerTurnBusiness()
    );
    return;
  }

  if (pb.money >= penalty) {
    pb.money -= penalty;
    showMessageModal(
      'Штраф',
      `Выплачен штраф ${penalty} обрезков.`,
      () => endPlayerTurnBusiness()
    );
  } else {
    const confiscated = Object.keys(pb.inventory)
      .filter(g => pb.inventory[g] > 0)
      .map(g => `${pb.inventory[g]} ${g}`)
      .join(', ');
    for (const g in pb.inventory) pb.inventory[g] = 0;
    showMessageModal(
      'Штраф',
      `Не хватило обрезков. Товар конфискован: ${confiscated || '—'}.`,
      () => endPlayerTurnBusiness()
    );
  }
}

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
                <strong>${GOODS[lot.good].emoji} ${lot.good}</strong> × ${lot.qty}<br>
                Продавец: ${lot.sellerName} · Цена: ${lot.price} за ед. (итого ${total})
              </div>
              <button class="big-btn" data-buy="${lot.id}" ${canBuy ? '' : 'disabled'}>Купить</button>
            </div>
          `;
        }).join('');

    const hasInventory = Object.keys(pb.inventory).some(g => pb.inventory[g] > 0);
    const html = `
      <p>Ваши обрезки: <strong>${pb.money}</strong></p>
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

  modal = openModal('Рынок', '<div id="market-body"></div>', () => {
    endPlayerTurnBusiness();
  });

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

  if (lot.seller === 'bot') {
    game.bot.money += total;
  }

  game.market.lots = game.market.lots.filter(l => l.id !== id);

  closeModal();
  showMessageModal(
    'Покупка',
    `Куплено ${lot.qty} ${lot.good} за ${total} обрезков.`,
    () => endPlayerTurnBusiness()
  );
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

  const modal = openModal('Выставить на продажу', '<div id="listing-body"></div>', () => {
    endPlayerTurnBusiness();
  });
  const body = modal.querySelector('#listing-body');

  function clamp() {
    const maxQty = Math.min(5, pb.inventory[selectedGood] || 0);
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) qty = 1;
    const base = GOODS[selectedGood].base;
    const minPrice = Math.round(base * 0.5);
    const maxPrice = Math.round(base * 1.5);
    if (price < minPrice) price = minPrice;
    if (price > maxPrice) price = maxPrice;
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
    body.querySelector('#list-price-minus').addEventListener('click', () => { price -= 5; render(); });
    body.querySelector('#list-price-plus').addEventListener('click', () => { price += 5; render(); });

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
        seller: 'player',
        sellerName: 'Игрок',
        good: selectedGood,
        qty: qty,
        price: price
      });

      closeModal();
      showMessageModal(
        'Товар выставлен',
        `Вы выставили ${qty} ${selectedGood} по ${price} обрезков за единицу.`,
        () => endPlayerTurnBusiness()
      );
    });
  }

  render();
}

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

  const modal = openModal('Производство', html, () => {
    endPlayerTurnBusiness();
  });

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
      showMessageModal(
        'Производство',
        `Произведено ${qty} ${good}.`,
        () => endPlayerTurnBusiness()
      );
    });
  });
}

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
      <p>Нужно для закрытия: ${GOODS[card.needs].emoji} ${card.needs} × ${card.needQty} (есть ${have})</p>
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
    case 'р':
      botMarketAction();
      break;
    case 'п':
      botProductionAction();
      break;
    case 'ш':
      botPenaltyAction();
      break;
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
  const neededGood = bot.card.needs;
  const have = bot.inventory[neededGood] || 0;

  if (have < bot.card.needQty) {
    const maxPrice = Math.round(GOODS[neededGood].base * 1.3);
    const candidates = game.market.lots
      .filter(l => l.seller !== 'bot' && l.good === neededGood && l.price <= maxPrice && l.qty > 0)
      .sort((a, b) => a.price - b.price);

    for (const lot of candidates) {
      const total = lot.price * lot.qty;
      if (bot.money >= total) {
        bot.money -= total;
        bot.inventory[neededGood] = (bot.inventory[neededGood] || 0) + lot.qty;

        if (lot.seller === 'player') {
          game.player.business.money += total;
        }

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
      seller: 'bot',
      sellerName: 'Бот',
      good: product,
      qty: listQty,
      price: price
    });
  }
}

function botPenaltyAction() {
  const bot = game.bot;
  let penalty = 0;

  for (const g in bot.inventory) {
    if (bot.inventory[g] > 0) {
      penalty += bot.inventory[g] * GOODS[g].base * 0.25;
    }
  }
  penalty = Math.round(penalty);

  if (penalty <= 0) return;

  if (bot.money >= penalty) {
    bot.money -= penalty;
  } else {
    for (const g in bot.inventory) bot.inventory[g] = 0;
  }
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

  let coins = 0;
  let paper = 0;
  let cycles = 0;
  let title = '';
  let text = '';

  if (result === 'player') {
    coins = 80;
    paper = 2;
    cycles = 1;
    title = 'Победа в бизнес-схватке!';
    text = `Вы первыми закрыли визитку.<br>Награда: +${coins} монет, +${paper} бумаги, +${cycles} цикл.`;
  } else {
    coins = 20;
    title = 'Поражение в бизнес-схватке';
    text = `Бот закрыл визитку раньше.<br>Утешительный приз: +${coins} монет.`;
  }

  game.player.coins += coins;
  game.player.paper += paper;
  if (cycles) addCycles(cycles);
  saveProgress();
  renderResources();

  openModal(
    title,
    `<p>${text}</p><div class="modal-actions"><button id="modal-result-ok" class="big-btn">В главное меню</button></div>`,
    () => {
      cleanupBusiness();
      showScreen('menu');
    }
  );

  const ok = $('modal-result-ok');
  if (ok) {
    ok.addEventListener('click', () => {
      closeModal();
      cleanupBusiness();
      showScreen('menu');
    });
  }
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

/* ============================= СКЛАДЫВАНИЕ И БОЙ ============================= */

function renderBattlePrep() {
  renderResources();

  $('prep-resources').innerHTML = `
    <span>🪙 ${game.player.coins}</span>
    <span>📄 ${game.player.paper}</span>
    <span>🔄 ${game.player.cycles}</span>
  `;

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

function openGalleryModal() {
  const html = `
    <div class="template-grid">
      ${Object.values(TEMPLATES).map(t => {
        const unlocked = game.player.unlocked[t.id] || game.player.cycles >= t.unlockCycles;
        return `
          <div class="template-card ${unlocked ? '' : 'locked'}">
            <h4>${t.emoji} ${t.name}</h4>
            <div>HP: ${t.hp}</div>
            <div>Урон: ${t.dmg}</div>
            <div>Стоимость: ${t.cost} монет</div>
            <div>Бумага: ${t.paper}</div>
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
    showMessageModal('Флот полон', 'Максимум 3 юнита. Начните бой или очистите флот.', null);
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
      if (game.player.fleet.length >= 3) {
        showMessageModal('Флот полон', 'Максимум 3 юнита.', null);
        return;
      }
      if (game.player.coins < t.cost || game.player.paper < t.paper) {
        showMessageModal('Не хватает ресурсов', 'Нужно больше монет или бумаги.', null);
        return;
      }

      game.player.coins -= t.cost;
      game.player.paper -= t.paper;
      saveProgress();

      closeModal();
      startFoldingMiniGame(t);
    });
  });
}

function getFoldPositions(count) {
  return FOLD_POSITIONS[count] || FOLD_POSITIONS[5];
}

function startFoldingMiniGame(template) {
  game.ui.folding = {
    template,
    next: 1,
    errors: 0,
    totalPoints: template.points
  };

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
    if (!f) return;
    if (btn.classList.contains('done')) return;

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
        showMessageModal(
          'Успех!',
          `Юнит «${unit.name}» добавлен во флот.`,
          () => renderBattlePrep()
        );
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
        showMessageModal(
          'Складывание провалено',
          'Вы допустили 3 ошибки. Ресурсы не возвращаются.',
          () => renderBattlePrep()
        );
      }
    }
  });
}

function startBattle() {
  if (!game.player.fleet || game.player.fleet.length === 0) return;

  const playerUnits = game.player.fleet.map(u => ({
    ...u,
    hp: u.maxHp,
    alive: true
  }));

  const botSize = Math.min(3, Math.max(1, game.player.fleet.length));
  const botUnits = [];

  for (let i = 0; i < botSize; i++) {
    let templateId = 'scout';
    if (game.player.cycles >= 4 && i === 0) templateId = 'battleship';
    else if (game.player.cycles >= 2 && i < 2) templateId = 'frigate';

    const t = TEMPLATES[templateId];
    botUnits.push({
      id: 'bot_' + i + '_' + Date.now(),
      templateId: t.id,
      name: t.name,
      emoji: t.emoji,
      maxHp: t.hp,
      hp: t.hp,
      dmg: t.dmg,
      alive: true
    });
  }

  game.battle = {
    playerUnits,
    botUnits,
    turn: null,
    started: false,
    over: false,
    log: [],
    resultShown: false,
    dice: null
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
  $('battle-resources').innerHTML = `
    <span>🪙 ${game.player.coins}</span>
    <span>📄 ${game.player.paper}</span>
    <span>🔄 ${game.player.cycles}</span>
  `;

  const pEl = $('battle-player-units');
  const bEl = $('battle-bot-units');
  pEl.innerHTML = '';
  bEl.innerHTML = '';

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

  game.battle.log.push(
    `🎲 Выпало ${roll}. Первым ходит ${game.battle.turn === 'player' ? 'игрок' : 'бот'}.`
  );

  renderBattle();

  if (game.battle.turn === 'bot') {
    setTimeout(botAttack, 800);
  }
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

  if (target.hp <= 0) {
    target.hp = 0;
    game.battle.log.push(`${target.name} уничтожен!`);
  }

  renderBattle();

  if (checkBattleEnd()) return;

  game.battle.turn = 'bot';
  renderBattle();
  setTimeout(botAttack, 700);
}

function botAttack() {
  if (!game.battle || game.battle.turn !== 'bot' || game.battle.over) return;

  const attackers = game.battle.botUnits.filter(u => u.hp > 0);
  if (attackers.length === 0) {
    checkBattleEnd();
    return;
  }

  const alivePlayers = game.battle.playerUnits.filter(u => u.hp > 0);
  if (alivePlayers.length === 0) {
    checkBattleEnd();
    return;
  }

  const target = alivePlayers.reduce((min, u) => u.hp < min.hp ? u : min, alivePlayers[0]);

  let totalDamage = 0;
  attackers.forEach(u => { totalDamage += u.dmg; });

  target.hp -= totalDamage;
  game.battle.log.push(`Бот атакует ${target.name} на ${totalDamage} урона.`);

  if (target.hp <= 0) {
    target.hp = 0;
    game.battle.log.push(`${target.name} уничтожен!`);
  }

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
    const win = playerAlive && !botAlive;
    endBattle(win);
    return true;
  }

  return false;
}

function endBattle(win) {
  if (!game.battle || game.battle.resultShown) return;
  game.battle.resultShown = true;

  let coins = 0;
  let fragments = 0;
  let cycles = 0;
  let title = '';
  let text = '';

  if (win) {
    coins = 50;
    fragments = 1;
    cycles = 1;
    title = 'Победа в бою!';
    text = `Вражеский флот уничтожен.<br>Награда: +${coins} монет, +${fragments} фрагмент визитки, +${cycles} цикл.`;
  } else {
    coins = 10;
    title = 'Поражение в бою';
    text = `Ваш флот уничтожен.<br>Утешительный приз: +${coins} монет.`;
  }

  game.player.coins += coins;
  game.player.fragments += fragments;
  if (cycles) addCycles(cycles);

  game.player.fleet = [];
  saveProgress();
  renderResources();

  openModal(
    title,
    `<p>${text}</p><div class="modal-actions"><button id="modal-battle-result-ok" class="big-btn">В главное меню</button></div>`,
    () => {
      cleanupBattle();
      showScreen('menu');
    }
  );

  const ok = $('modal-battle-result-ok');
  if (ok) {
    ok.addEventListener('click', () => {
      closeModal();
      cleanupBattle();
      showScreen('menu');
    });
  }
}

function cleanupBattle() {
  game.battle = null;
  game.ui.busy = false;
}

/* ============================= СТАРТ ============================= */

function confirmReset() {
  openModal(
    'Сбросить прогресс?',
    `<p>Все монеты, бумага, циклы, фрагменты и флот будут удалены. Это действие нельзя отменить.</p>
     <div class="modal-actions">
       <button id="btn-confirm-reset" class="danger-btn">Да, сбросить</button>
       <button id="btn-cancel-reset" class="secondary-btn">Отмена</button>
     </div>`
  );

  $('btn-confirm-reset').addEventListener('click', () => {
    closeModal();
    resetProgress();
  });

  $('btn-cancel-reset').addEventListener('click', closeModal);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateUnlocks(false);
  renderMenu();
  showScreen('menu');

  $('btn-start-business').addEventListener('click', startBusiness);
  $('btn-start-battle-prep').addEventListener('click', () => showScreen('battle-prep'));
  $('btn-reset').addEventListener('click', confirmReset);

  $('btn-roll').addEventListener('click', playerRollBusiness);
  $('btn-business-cards').addEventListener('click', openPlayerCardsModal);

  $('btn-gallery').addEventListener('click', openGalleryModal);
  $('btn-folding').addEventListener('click', openFoldingModal);
  $('btn-start-battle').addEventListener('click', startBattle);
  $('btn-prep-menu').addEventListener('click', () => showScreen('menu'));

  $('btn-battle-start').addEventListener('click', startBattleDice);
});