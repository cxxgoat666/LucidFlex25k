const RULES = {
  startingBalance: 25000,
  profitTarget: 1250,
  maxLossLimit: 1000,
  consistencyLimit: 0.5,
  consistencyCushionLimit: 0.52,
  maxMini: 2,
  maxMicro: 20,
  minTradingDays: 2,
  storageKey: "flex25k-practice-journal",
  rulesKey: "flex25k-personal-rules",
  tradeNotesKey: "flex25k-trade-review-notes-v2"
};

const pageMeta = {
  overview: ["Challenge monitor", "Overview"],
  entry: ["Daily builder", "Trade Entry"],
  calendar: ["Monthly performance", "P&L Calendar"],
  journal: ["Trading data", "Journal"],
  rules: ["Account limits", "Rules"]
};

const state = {
  days: loadDays(),
  personalRules: loadPersonalRules(),
  tradeNotes: loadTradeNotes(),
  calendarDate: new Date()
};

const els = {
  nav: document.querySelectorAll("[data-view-target]"),
  views: document.querySelectorAll("[data-view]"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  pageTitle: document.querySelector("#pageTitle"),
  form: document.querySelector("#tradeForm"),
  tradeDate: document.querySelector("#tradeDate"),
  tradeCount: document.querySelector("#tradeCount"),
  tradeRows: document.querySelector("#tradeRows"),
  tradeTemplate: document.querySelector("#tradeRowTemplate"),
  entryDayPnl: document.querySelector("#entryDayPnl"),
  dayPreview: document.querySelector("#dayPreview"),
  currentBalance: document.querySelector("#currentBalance"),
  balanceChange: document.querySelector("#balanceChange"),
  targetPercent: document.querySelector("#targetPercent"),
  progressRing: document.querySelector(".progress-ring"),
  targetProgressLabel: document.querySelector("#targetProgressLabel"),
  targetDangerFill: document.querySelector("#targetDangerFill"),
  targetBarFill: document.querySelector("#targetBarFill"),
  targetBarMarker: document.querySelector("#targetBarMarker"),
  drawdownMarker: document.querySelector("#drawdownMarker"),
  startMarker: document.querySelector("#startMarker"),
  targetDrawdownLabel: document.querySelector("#targetDrawdownLabel"),
  targetStartLabel: document.querySelector("#targetStartLabel"),
  targetCurrentLabel: document.querySelector("#targetCurrentLabel"),
  targetFinishLabel: document.querySelector("#targetFinishLabel"),
  failureAlert: document.querySelector("#failureAlert"),
  failureAlertText: document.querySelector("#failureAlertText"),
  passAlert: document.querySelector("#passAlert"),
  passAlertText: document.querySelector("#passAlertText"),
  targetRemaining: document.querySelector("#targetRemaining"),
  drawdownFloor: document.querySelector("#drawdownFloor"),
  drawdownRoom: document.querySelector("#drawdownRoom"),
  consistencyPercent: document.querySelector("#consistencyPercent"),
  consistencyNote: document.querySelector("#consistencyNote"),
  consistencyStatus: document.querySelector("#consistencyStatus"),
  consistencyTotalProfit: document.querySelector("#consistencyTotalProfit"),
  consistencyLargestDay: document.querySelector("#consistencyLargestDay"),
  consistencyAllowedDay: document.querySelector("#consistencyAllowedDay"),
  consistencyNeeded: document.querySelector("#consistencyNeeded"),
  consistencyFill: document.querySelector("#consistencyFill"),
  consistencyTrackLabel: document.querySelector("#consistencyTrackLabel"),
  consistencyExplanation: document.querySelector("#consistencyExplanation"),
  tradeDayCount: document.querySelector("#tradeDayCount"),
  objectiveList: document.querySelector("#objectiveList"),
  rulesObjectiveList: document.querySelector("#rulesObjectiveList"),
  journalRows: document.querySelector("#journalRows"),
  journalSummary: document.querySelector("#journalSummary"),
  emptyRow: document.querySelector("#emptyRow"),
  chart: document.querySelector("#equityChart"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarWinRate: document.querySelector("#calendarWinRate"),
  calendarMonthPicker: document.querySelector("#calendarMonthPicker"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarJournalModal: document.querySelector("#calendarJournalModal"),
  calendarJournalContent: document.querySelector("#calendarJournalContent"),
  calendarJournalClose: document.querySelector("#calendarJournalClose"),
  prevMonth: document.querySelector("#prevMonth"),
  todayMonth: document.querySelector("#todayMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  exportCsv: document.querySelector("#exportCsv"),
  importCsv: document.querySelector("#importCsv"),
  resetData: document.querySelector("#resetData"),
  ruleForm: document.querySelector("#ruleForm"),
  ruleInput: document.querySelector("#ruleInput"),
  personalRules: document.querySelector("#personalRules"),
  dailyNotesList: document.querySelector("#dailyNotesList")
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

els.tradeDate.valueAsDate = new Date();
renderTradeRows();
render();

els.nav.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewTarget));
});

els.tradeCount.addEventListener("input", () => {
  renderTradeRows();
  updateEntryPreview();
});

els.tradeRows.addEventListener("input", updateEntryPreview);
els.tradeRows.addEventListener("change", updateEntryPreview);

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const trades = readTradeRows();
  const data = new FormData(els.form);
  const date = data.get("date");
  if (!date || !trades.length) return;

  const day = {
    id: crypto.randomUUID(),
    date,
    session: data.get("session"),
    notes: String(data.get("dayNotes") || "").trim(),
    trades
  };

  state.days.push(day);
  saveDays();
  els.form.reset();
  els.tradeDate.valueAsDate = new Date();
  els.tradeCount.value = "1";
  renderTradeRows();
  render();
  setView("journal");
});

els.journalRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const deletedDay = state.days.find((day) => day.id === button.dataset.delete);
  state.days = state.days.filter((day) => day.id !== button.dataset.delete);
  deletedDay?.trades.forEach((trade) => delete state.tradeNotes[trade.id]);
  saveDays();
  saveTradeNotes();
  render();
});

els.resetData.addEventListener("click", () => {
  if (!state.days.length && !state.personalRules.length) return;
  const confirmed = window.confirm("Clear all saved trading days and checklist rules?");
  if (!confirmed) return;
  state.days = [];
  state.personalRules = defaultPersonalRules();
  state.tradeNotes = {};
  saveDays();
  savePersonalRules();
  saveTradeNotes();
  render();
});

els.exportCsv.addEventListener("click", exportCsv);
els.importCsv.addEventListener("change", importCsv);

els.prevMonth.addEventListener("click", () => shiftMonth(-1));
els.todayMonth.addEventListener("click", () => {
  state.calendarDate = new Date();
  renderCalendar(getMetrics());
});
els.nextMonth.addEventListener("click", () => shiftMonth(1));
els.calendarMonthPicker.addEventListener("change", () => {
  if (!els.calendarMonthPicker.value) return;
  const [year, month] = els.calendarMonthPicker.value.split("-").map(Number);
  state.calendarDate = new Date(year, month - 1, 1);
  renderCalendar(getMetrics());
});

// Calendar journal modal experiment: remove these listeners and helpers to revert.
els.calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-calendar-journal-date]");
  if (!dayButton) return;
  openCalendarJournal(dayButton.dataset.calendarJournalDate);
});

els.calendarGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const dayButton = event.target.closest("[data-calendar-journal-date]");
  if (!dayButton) return;
  event.preventDefault();
  openCalendarJournal(dayButton.dataset.calendarJournalDate);
});

els.calendarJournalClose.addEventListener("click", closeCalendarJournal);

els.calendarJournalModal.addEventListener("click", (event) => {
  if (event.target === els.calendarJournalModal) closeCalendarJournal();
});

els.calendarJournalModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCalendarJournal();
});

els.calendarJournalContent.addEventListener("input", (event) => {
  saveTradeNoteInput(event);
});

els.ruleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = els.ruleInput.value.trim();
  if (!text) return;
  state.personalRules.push({ id: crypto.randomUUID(), text, checked: false });
  els.ruleInput.value = "";
  savePersonalRules();
  renderPersonalRules();
});

els.personalRules.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-rule-check]");
  if (!checkbox) return;
  const rule = state.personalRules.find((item) => item.id === checkbox.dataset.ruleCheck);
  if (!rule) return;
  rule.checked = checkbox.checked;
  savePersonalRules();
  renderPersonalRules();
});

els.personalRules.addEventListener("input", (event) => {
  const editable = event.target.closest("[data-rule-text]");
  if (!editable) return;
  const rule = state.personalRules.find((item) => item.id === editable.dataset.ruleText);
  if (!rule) return;
  rule.text = editable.textContent.trim();
  savePersonalRules();
});

els.personalRules.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rule-delete]");
  if (!button) return;
  state.personalRules = state.personalRules.filter((item) => item.id !== button.dataset.ruleDelete);
  savePersonalRules();
  renderPersonalRules();
});

// Daily notes experiment: remove this listener and its render/storage helpers to revert.
els.dailyNotesList.addEventListener("input", (event) => {
  saveTradeNoteInput(event);
});

function saveTradeNoteInput(event) {
  const field = event.target.closest("[data-note-field]");
  if (!field) return;
  const tradeId = field.dataset.noteTrade;
  if (!tradeId) return;
  const current = state.tradeNotes[tradeId] || {};
  state.tradeNotes[tradeId] = {
    ...current,
    [field.dataset.noteField]: field.value
  };
  saveTradeNotes();
}

window.addEventListener("resize", () => drawChart(getMetrics()));

function setView(viewName) {
  els.nav.forEach((button) => button.classList.toggle("active", button.dataset.viewTarget === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.dataset.view === viewName));
  const [eyebrow, title] = pageMeta[viewName] || pageMeta.overview;
  els.pageEyebrow.textContent = eyebrow;
  els.pageTitle.textContent = title;
  if (viewName === "overview") drawChart(getMetrics());
}

function render() {
  const metrics = getMetrics();
  renderStats(metrics);
  renderObjectives(metrics);
  renderJournal(metrics);
  renderDailyNotes(metrics);
  renderCalendar(metrics);
  renderPersonalRules();
  updateEntryPreview();
  drawChart(metrics);
}

function renderTradeRows() {
  const count = clamp(Number(els.tradeCount.value) || 1, 1, 50);
  const existing = readTradeRows({ allowEmptyPnl: true });
  els.tradeRows.innerHTML = "";

  for (let index = 0; index < count; index += 1) {
    const fragment = els.tradeTemplate.content.cloneNode(true);
    fragment.querySelector("[data-trade-number]").textContent = String(index + 1);
    const row = fragment.querySelector(".trade-line");
    const existingTrade = existing[index];
    if (existingTrade) {
      row.querySelector('[data-field="instrument"]').value = existingTrade.instrument;
      row.querySelector('[data-field="direction"]').value = existingTrade.direction;
      row.querySelector('[data-field="tradeSession"]').value = existingTrade.tradeSession || "New York AM";
      row.querySelector('[data-field="pnl"]').value = existingTrade.pnl || "";
      row.querySelector('[data-field="size"]').value = existingTrade.size || 1;
      row.querySelector('[data-field="type"]').value = existingTrade.type;
      row.querySelector('[data-field="setup"]').value = existingTrade.setup;
    }
    els.tradeRows.appendChild(fragment);
  }
}

function readTradeRows(options = {}) {
  return [...els.tradeRows.querySelectorAll(".trade-line")].map((row) => {
    const pnlValue = row.querySelector('[data-field="pnl"]').value;
    return {
      id: crypto.randomUUID(),
      instrument: row.querySelector('[data-field="instrument"]').value.trim().toUpperCase(),
      direction: row.querySelector('[data-field="direction"]').value,
      tradeSession: row.querySelector('[data-field="tradeSession"]').value,
      pnl: Number(pnlValue),
      size: Number(row.querySelector('[data-field="size"]').value),
      type: row.querySelector('[data-field="type"]').value,
      setup: row.querySelector('[data-field="setup"]').value.trim()
    };
  }).filter((trade) => {
    const pnlOk = options.allowEmptyPnl ? true : Number.isFinite(trade.pnl);
    return pnlOk && Number.isFinite(trade.size);
  });
}

function updateEntryPreview() {
  const trades = readTradeRows({ allowEmptyPnl: true });
  const completeTrades = trades.filter((trade) => Number.isFinite(trade.pnl));
  const pnl = sumTrades(completeTrades);
  const miniMax = largestSize(completeTrades, "mini");
  const microMax = largestSize(completeTrades, "micro");
  els.entryDayPnl.textContent = `${currency.format(pnl)} day P&L`;
  els.entryDayPnl.className = `pill ${pnl < 0 ? "money-neg" : pnl > 0 ? "money-pos" : ""}`;
  els.dayPreview.innerHTML = `
    <div class="preview-stat"><span>Trades entered</span><strong>${completeTrades.length}</strong></div>
    <div class="preview-stat"><span>Net P&L</span><strong class="${pnl >= 0 ? "money-pos" : "money-neg"}">${currency.format(pnl)}</strong></div>
    <div class="preview-stat"><span>Largest mini size</span><strong>${miniMax} / ${RULES.maxMini}</strong></div>
    <div class="preview-stat"><span>Largest micro size</span><strong>${microMax} / ${RULES.maxMicro}</strong></div>
    <div class="preview-stat"><span>Projected balance</span><strong>${currency.format(getMetrics().balance + pnl)}</strong></div>
  `;
}

function getSortedDays() {
  return [...state.days].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

function getMetrics() {
  const days = getSortedDays();
  let balance = RULES.startingBalance;
  let highestEod = RULES.startingBalance;
  let floor = RULES.startingBalance - RULES.maxLossLimit;
  const points = [{ label: "Start", date: "", balance, floor }];
  const dayMetrics = [];
  const dayPnlMap = new Map();
  const dayTradeMap = new Map();
  const dayWinTradeMap = new Map();
  let violated = false;
  let breachDay = "";

  days.forEach((day) => {
    const pnl = sumTrades(day.trades);
    balance += pnl;
    highestEod = Math.max(highestEod, balance);
    floor = Math.max(RULES.startingBalance - RULES.maxLossLimit, Math.min(RULES.startingBalance, highestEod - RULES.maxLossLimit));
    if (balance <= floor && !violated) {
      violated = true;
      breachDay = day.date;
    }

    dayPnlMap.set(day.date, (dayPnlMap.get(day.date) || 0) + pnl);
    dayTradeMap.set(day.date, (dayTradeMap.get(day.date) || 0) + day.trades.length);
    dayWinTradeMap.set(day.date, (dayWinTradeMap.get(day.date) || 0) + day.trades.filter((trade) => trade.pnl > 0).length);
    const miniMax = largestSize(day.trades, "mini");
    const microMax = largestSize(day.trades, "micro");
    const winningTrades = day.trades.filter((trade) => trade.pnl > 0).length;

    dayMetrics.push({
      ...day,
      pnl,
      balance,
      floor,
      miniMax,
      microMax,
      winningTrades,
      tradeWinRate: day.trades.length ? winningTrades / day.trades.length : 0,
      sizeOk: miniMax <= RULES.maxMini && microMax <= RULES.maxMicro,
      drawdownOk: balance > floor
    });
    points.push({ label: formatShortDate(day.date), date: day.date, balance, floor });
  });

  const dayProfits = [...dayPnlMap.values()].filter((value) => value > 0);
  const winningDays = [...dayPnlMap.values()].filter((value) => value > 0).length;
  const largestProfitDay = dayProfits.length ? Math.max(...dayProfits) : 0;
  const accountProfit = balance - RULES.startingBalance;
  const consistency = accountProfit > 0 ? largestProfitDay / accountProfit : 0;
  const strictConsistencyLimit = Math.max(0, accountProfit * RULES.consistencyLimit);
  const cushionLimit = Math.max(0, accountProfit * RULES.consistencyCushionLimit);
  const targetCushionLimit = RULES.profitTarget * RULES.consistencyCushionLimit;
  const requiredProfitForLargestDay = largestProfitDay
    ? Math.max(RULES.profitTarget, largestProfitDay / RULES.consistencyCushionLimit)
    : RULES.profitTarget;
  const profitNeededForConsistency = Math.max(0, requiredProfitForLargestDay - accountProfit);
  const consistencyPassReady = accountProfit >= RULES.profitTarget ? largestProfitDay <= cushionLimit : false;
  const consistencyState = accountProfit <= 0 || largestProfitDay === 0
    ? "pending"
    : consistencyPassReady
      ? "pass"
      : accountProfit >= RULES.profitTarget
        ? "fail"
        : "pending";
  const allSizesOk = dayMetrics.every((day) => day.sizeOk);

  return {
    days,
    dayMetrics,
    points,
    dayPnlMap,
    dayTradeMap,
    dayWinTradeMap,
    balance,
    accountProfit,
    floor,
    targetRemaining: Math.max(0, RULES.profitTarget - accountProfit),
    targetProgress: clamp(accountProfit / RULES.profitTarget, 0, 1),
    drawdownRoom: balance - floor,
    tradeDays: dayPnlMap.size,
    winningDays,
    dailyWinRate: dayPnlMap.size ? winningDays / dayPnlMap.size : 0,
    tradeCount: days.reduce((total, day) => total + day.trades.length, 0),
    largestProfitDay,
    consistency,
    consistencyOk: consistencyState !== "fail",
    consistencyPassReady,
    consistencyState,
    strictConsistencyLimit,
    cushionLimit,
    targetCushionLimit,
    profitNeededForConsistency,
    requiredProfitForLargestDay,
    profitTargetHit: accountProfit >= RULES.profitTarget,
    minDaysOk: dayPnlMap.size >= RULES.minTradingDays,
    drawdownOk: !violated && balance > floor,
    failed: violated || balance <= floor,
    breachDay,
    allSizesOk,
    passReady: accountProfit >= RULES.profitTarget && dayPnlMap.size >= RULES.minTradingDays && !violated && allSizesOk && consistencyPassReady
  };
}

function renderStats(metrics) {
  els.currentBalance.textContent = currency.format(metrics.balance);
  els.balanceChange.textContent = `${currency.format(metrics.accountProfit)} ${metrics.accountProfit >= 0 ? "profit" : "drawdown"}`;
  els.balanceChange.className = `metric-note ${metrics.accountProfit < 0 ? "money-neg" : ""}`;
  els.targetRemaining.textContent = currency.format(metrics.targetRemaining);
  els.drawdownFloor.textContent = currency.format(metrics.floor);
  els.drawdownRoom.textContent = `${currency.format(metrics.drawdownRoom)} room`;
  els.drawdownRoom.className = `metric-note ${metrics.drawdownRoom <= 0 ? "money-neg" : ""}`;
  els.targetPercent.textContent = `${Math.round(metrics.targetProgress * 100)}%`;
  els.progressRing.style.setProperty("--progress", `${metrics.targetProgress * 360}deg`);
  els.targetProgressLabel.textContent = `${currency.format(Math.max(0, metrics.accountProfit))} / ${currency.format(RULES.profitTarget)}`;
  const targetBalance = RULES.startingBalance + RULES.profitTarget;
  const rangeMin = Math.min(metrics.floor, RULES.startingBalance, metrics.balance);
  const rangeMax = targetBalance;
  const range = Math.max(1, rangeMax - rangeMin);
  const drawdownPercent = clamp((metrics.floor - rangeMin) / range, 0, 1) * 100;
  const startPercent = clamp((RULES.startingBalance - rangeMin) / range, 0, 1) * 100;
  const currentPercent = clamp((metrics.balance - rangeMin) / range, 0, 1) * 100;
  const fillLeft = Math.min(startPercent, currentPercent);
  const fillWidth = Math.abs(currentPercent - startPercent);
  els.targetDangerFill.style.left = "0%";
  els.targetDangerFill.style.width = `${startPercent}%`;
  els.targetBarFill.style.left = `${fillLeft}%`;
  els.targetBarFill.style.width = `${fillWidth}%`;
  els.targetBarFill.classList.toggle("loss-fill", metrics.balance < RULES.startingBalance);
  els.drawdownMarker.style.left = `${drawdownPercent}%`;
  els.startMarker.style.left = `${startPercent}%`;
  els.targetBarMarker.style.left = `${currentPercent}%`;
  placeTargetMarkerLabels(drawdownPercent, startPercent, currentPercent);
  els.targetDrawdownLabel.textContent = `${currency.format(metrics.floor)} fail`;
  els.targetStartLabel.textContent = `${currency.format(RULES.startingBalance)} start`;
  els.targetCurrentLabel.textContent = `${currency.format(metrics.balance)} current`;
  els.targetFinishLabel.textContent = `${currency.format(RULES.startingBalance + RULES.profitTarget)} target`;
  els.failureAlert.hidden = !metrics.failed;
  els.failureAlertText.textContent = metrics.failed
    ? `Your EOD balance ${metrics.breachDay ? `on ${metrics.breachDay} ` : ""}hit ${currency.format(metrics.balance)} against a trailing threshold of ${currency.format(metrics.floor)}.`
    : "";
  // Challenge pass alert experiment: remove this block with matching HTML/CSS to revert.
  els.passAlert.hidden = !metrics.passReady || metrics.failed;
  els.passAlertText.textContent = metrics.passReady && !metrics.failed
    ? `Target hit at ${currency.format(metrics.balance)} with ${metrics.tradeDays} trading days logged, position size respected, drawdown intact, and consistency inside the pass rules.`
    : "";
  els.consistencyPercent.textContent = metrics.accountProfit > 0 ? `${Math.round(metrics.consistency * 100)}%` : "0%";
  els.consistencyNote.textContent = metrics.largestProfitDay
    ? `Largest winning day: ${currency.format(metrics.largestProfitDay)}`
    : "Largest day must stay at or below 50%";
  els.consistencyNote.className = `metric-note ${metrics.consistencyOk ? "" : "money-neg"}`;
  renderConsistencyPanel(metrics);
  els.tradeDayCount.textContent = `${metrics.tradeDays} days / ${metrics.tradeCount} trades`;
  els.journalSummary.textContent = metrics.days.length
    ? `${metrics.days.length} ${metrics.days.length === 1 ? "day" : "days"} logged - ${formatPercent(metrics.dailyWinRate)} daily win rate`
    : "No entries yet";
}

function renderConsistencyPanel(metrics) {
  const usage = metrics.accountProfit > 0 ? metrics.consistency / RULES.consistencyLimit : 0;
  const usagePercent = clamp(usage, 0, 1.4) * 100;
  const allowedDay = metrics.accountProfit >= RULES.profitTarget
    ? metrics.cushionLimit
    : metrics.targetCushionLimit;
  const status = metrics.accountProfit <= 0
    ? "No profit yet"
    : metrics.consistency <= RULES.consistencyLimit
      ? "Inside limit"
      : metrics.consistency <= RULES.consistencyCushionLimit
        ? "Inside cushion"
        : "Too concentrated";

  els.consistencyStatus.textContent = status;
  els.consistencyStatus.className = `pill ${metrics.accountProfit > 0 && metrics.consistency <= RULES.consistencyCushionLimit ? "money-pos" : metrics.consistency > RULES.consistencyCushionLimit ? "money-neg" : ""}`;
  els.consistencyTotalProfit.textContent = currency.format(metrics.accountProfit);
  els.consistencyLargestDay.textContent = currency.format(metrics.largestProfitDay);
  els.consistencyAllowedDay.textContent = currency.format(allowedDay);
  els.consistencyNeeded.textContent = metrics.profitNeededForConsistency > 0 ? currency.format(metrics.profitNeededForConsistency) : "OK";
  els.consistencyNeeded.className = metrics.profitNeededForConsistency > 0 ? "money-neg" : "money-pos";
  els.consistencyFill.style.width = `${Math.min(100, usagePercent)}%`;
  els.consistencyFill.classList.toggle("over-limit", metrics.consistency > RULES.consistencyLimit);
  els.consistencyTrackLabel.textContent = metrics.accountProfit > 0
    ? `${Math.round(metrics.consistency * 100)}% largest-day share`
    : "0% largest-day share";

  if (metrics.accountProfit <= 0) {
    els.consistencyExplanation.textContent = "Once you are in profit, this will show whether your largest winning day is too much of your total profit.";
  } else if (metrics.consistency <= RULES.consistencyLimit) {
    els.consistencyExplanation.textContent = `Your largest winning day is ${formatPercent(metrics.consistency)} of total profit, so it is inside the 50% rule right now.`;
  } else if (metrics.consistency <= RULES.consistencyCushionLimit) {
    els.consistencyExplanation.textContent = `Your largest winning day is ${formatPercent(metrics.consistency)} of total profit. That is above 50%, but still inside the Lucid Flex pass cushion.`;
  } else {
    els.consistencyExplanation.textContent = `Your largest winning day is above the pass cushion. Estimated extra profit needed is ${currency.format(metrics.profitNeededForConsistency)}, assuming your biggest winning day does not get bigger.`;
  }
}

function renderObjectives(metrics) {
  const objectives = buildObjectives(metrics);
  const html = objectives.map(renderObjective).join("");
  els.objectiveList.innerHTML = html;
  els.rulesObjectiveList.innerHTML = html;
}

function placeTargetMarkerLabels(drawdownPercent, startPercent, currentPercent) {
  const markers = [
    { element: els.drawdownMarker, percent: drawdownPercent, base: "label-top" },
    { element: els.startMarker, percent: startPercent, base: "label-bottom" },
    { element: els.targetBarMarker, percent: currentPercent, base: "label-top" }
  ].sort((a, b) => a.percent - b.percent);

  markers.forEach((marker) => {
    marker.element.classList.remove("label-top", "label-bottom", "label-mid");
    marker.element.classList.add(marker.base);
  });

  for (let index = 1; index < markers.length; index += 1) {
    const previous = markers[index - 1];
    const current = markers[index];
    if (Math.abs(current.percent - previous.percent) < 8) {
      current.element.classList.remove("label-top", "label-bottom", "label-mid");
      current.element.classList.add(previous.element.classList.contains("label-top") ? "label-bottom" : "label-top");
    }
  }
}

function buildObjectives(metrics) {
  const objectives = [
    {
      title: "Reach the $1,250 target",
      detail: `${currency.format(metrics.accountProfit)} of ${currency.format(RULES.profitTarget)} earned`,
      state: metrics.profitTargetHit ? "pass" : "pending"
    },
    {
      title: "Stay above EOD max loss",
      detail: `Current trailing threshold is ${currency.format(metrics.floor)}`,
      state: metrics.drawdownOk ? "pass" : "fail"
    },
    {
      title: "Keep 50% consistency",
      detail: `Largest winning day is ${currency.format(metrics.largestProfitDay)}; pass cushion is ${currency.format(metrics.cushionLimit)}`,
      state: metrics.consistencyState
    },
    {
      title: "Trade at least two days",
      detail: `${metrics.tradeDays} of ${RULES.minTradingDays} days logged`,
      state: metrics.minDaysOk ? "pass" : "pending"
    },
    {
      title: "Respect max position size",
      detail: `Limit: ${RULES.maxMini} minis or ${RULES.maxMicro} micros`,
      state: metrics.allSizesOk ? "pass" : "fail"
    }
  ];

  if (metrics.passReady) {
    objectives.unshift({
      title: "Practice challenge ready",
      detail: "Your journal meets the tracked Flex 25K objectives.",
      state: "pass"
    });
  }
  return objectives;
}

function renderObjective(item) {
  const icon = item.state === "pass" ? "OK" : item.state === "fail" ? "!" : "-";
  return `
    <div class="objective ${item.state}">
      <div class="icon">${icon}</div>
      <div>
        <strong>${item.title}</strong>
        <span>${item.detail}</span>
      </div>
    </div>
  `;
}

function renderJournal(metrics) {
  if (!metrics.dayMetrics.length) {
    els.journalRows.innerHTML = "";
    els.journalRows.appendChild(els.emptyRow.content.cloneNode(true));
    return;
  }

  els.journalRows.innerHTML = metrics.dayMetrics.map((day) => {
    const flags = [];
    flags.push(day.sizeOk ? '<span class="flag">Size ok</span>' : '<span class="flag bad">Size breach</span>');
    flags.push(day.drawdownOk ? '<span class="flag">EOD ok</span>' : '<span class="flag bad">Max loss</span>');
    if (day.pnl > 0) flags.push('<span class="flag warn">Winning day</span>');
    const tradeStack = day.trades.map((trade) => `
        <span>${escapeHtml(trade.instrument || "-")} ${escapeHtml(trade.direction)} ${trade.size} ${trade.type}: <b class="${trade.pnl >= 0 ? "money-pos" : "money-neg"}">${currency.format(trade.pnl)}</b></span>
        <small>${escapeHtml(trade.tradeSession || "Session n/a")}${trade.setup ? ` - ${escapeHtml(trade.setup)}` : ""}</small>
      `).join("");

    return `
      <tr>
        <td>${day.date}<br><small>${escapeHtml(day.session || "")}</small></td>
        <td><div class="trade-stack">${tradeStack}</div></td>
        <td class="${day.pnl >= 0 ? "money-pos" : "money-neg"}">${currency.format(day.pnl)}</td>
        <td>${currency.format(day.balance)}</td>
        <td>${day.miniMax} mini / ${day.microMax} micro</td>
        <td>${formatPercent(day.tradeWinRate)}<br><small>${day.winningTrades}/${day.trades.length} trades</small></td>
        <td><div class="flag-list">${flags.join("")}</div></td>
        <td>${escapeHtml(day.notes || "")}</td>
        <td><button class="delete-button" type="button" data-delete="${day.id}" title="Delete day">x</button></td>
      </tr>
    `;
  }).join("");
}

// Daily notes experiment: remove this function and its matching HTML/CSS/listener to revert.
function renderDailyNotes(metrics) {
  if (!metrics.dayMetrics.length) {
    els.dailyNotesList.innerHTML = `
      <div class="daily-notes-empty">No days to review yet. Add trades first, then come back here to journal them.</div>
    `;
    return;
  }

  els.dailyNotesList.innerHTML = [...metrics.dayMetrics].reverse().map((day) => {
    const dayResultClass = day.pnl >= 0 ? "money-pos" : "money-neg";
    const tradeItems = day.trades.map((trade, index) => {
      const resultClass = trade.pnl >= 0 ? "money-pos" : "money-neg";
      return `
        <details class="trade-review">
          <summary>
            <span>Trade ${index + 1}: ${escapeHtml(trade.instrument || "Market")} ${escapeHtml(trade.direction)}</span>
            <strong class="${resultClass}">${currency.format(trade.pnl)}</strong>
          </summary>
          ${renderTradeNoteTemplate(trade)}
        </details>
      `;
    }).join("");

    return `
      <details class="daily-note-day">
        <summary>
          <span>
            <strong>${formatShortDate(day.date)}</strong>
            <small>${day.trades.length} trades - ${formatPercent(day.tradeWinRate)} trade win rate</small>
          </span>
          <strong class="${dayResultClass}">${currency.format(day.pnl)}</strong>
        </summary>
        <div class="daily-note-body">
          ${day.notes ? `<p class="day-note-copy">${escapeHtml(day.notes)}</p>` : ""}
          <div class="daily-trade-reviews">${tradeItems}</div>
        </div>
      </details>
    `;
  }).join("");
}

function renderTradeNoteTemplate(trade) {
  const notes = state.tradeNotes[trade.id] || {};
  return `
    <div class="trade-review-template">
      <div class="trade-review-meta">
        <span>${escapeHtml(trade.tradeSession || "Session n/a")}</span>
        <span>${trade.size} ${escapeHtml(trade.type)}</span>
        <span>${escapeHtml(trade.setup || "No setup listed")}</span>
      </div>
      <label>
        Trade thesis
        <textarea data-note-trade="${trade.id}" data-note-field="thesis" rows="3" placeholder="Why was this trade valid?">${escapeHtml(notes.thesis || "")}</textarea>
      </label>
      <label>
        Execution review
        <textarea data-note-trade="${trade.id}" data-note-field="execution" rows="3" placeholder="Entry, management, exit, mistakes, patience.">${escapeHtml(notes.execution || "")}</textarea>
      </label>
      <label>
        Emotion and discipline
        <textarea data-note-trade="${trade.id}" data-note-field="psychology" rows="3" placeholder="Calm, rushed, revenge, fear, confidence, rule following.">${escapeHtml(notes.psychology || "")}</textarea>
      </label>
      <label>
        Lesson for next session
        <textarea data-note-trade="${trade.id}" data-note-field="lesson" rows="2" placeholder="One thing to repeat or avoid next time.">${escapeHtml(notes.lesson || "")}</textarea>
      </label>
    </div>
  `;
}

// Calendar journal modal experiment: remove these helpers and matching HTML/CSS/listeners to revert.
function openCalendarJournal(dateKey) {
  const metrics = getMetrics();
  const entries = metrics.dayMetrics.filter((item) => item.date === dateKey);
  if (!entries.length) return;
  const trades = entries.flatMap((entry) => entry.trades);
  const pnl = entries.reduce((total, entry) => total + entry.pnl, 0);
  const winningTrades = trades.filter((trade) => trade.pnl > 0).length;
  const tradeWinRate = trades.length ? winningTrades / trades.length : 0;
  const latestEntry = entries[entries.length - 1];
  const dayNotes = entries.map((entry) => entry.notes).filter(Boolean);
  const dayResultClass = pnl >= 0 ? "money-pos" : "money-neg";
  const tradeItems = trades.map((trade, index) => {
    const resultClass = trade.pnl >= 0 ? "money-pos" : "money-neg";
    return `
      <details class="trade-review" open>
        <summary>
          <span>Trade ${index + 1}: ${escapeHtml(trade.instrument || "Market")} ${escapeHtml(trade.direction)}</span>
          <strong class="${resultClass}">${currency.format(trade.pnl)}</strong>
        </summary>
        ${renderTradeNoteTemplate(trade)}
      </details>
    `;
  }).join("");

  els.calendarJournalContent.innerHTML = `
    <div class="modal-heading">
      <div>
        <p class="eyebrow">Calendar journal</p>
        <h3>${formatShortDate(dateKey)} review</h3>
      </div>
      <span class="pill ${pnl >= 0 ? "money-pos" : "money-neg"}">${currency.format(pnl)}</span>
    </div>
    <div class="modal-day-stats">
      <div><span>Trades</span><strong>${trades.length}</strong></div>
      <div><span>Trade win rate</span><strong>${formatPercent(tradeWinRate)}</strong></div>
      <div><span>EOD balance</span><strong>${currency.format(latestEntry.balance)}</strong></div>
      <div><span>Result</span><strong class="${dayResultClass}">${currency.format(pnl)}</strong></div>
    </div>
    ${dayNotes.length ? `<p class="day-note-copy">${dayNotes.map(escapeHtml).join("<br>")}</p>` : ""}
    <div class="daily-trade-reviews">${tradeItems}</div>
  `;
  els.calendarJournalModal.showModal();
}

function closeCalendarJournal() {
  els.calendarJournalModal.close();
  els.calendarJournalContent.innerHTML = "";
}

function renderCalendar(metrics) {
  const date = state.calendarDate;
  const year = date.getFullYear();
  const month = date.getMonth();
  els.calendarTitle.textContent = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  els.calendarMonthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;

  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const monthKeys = [...metrics.dayPnlMap.keys()].filter((key) => {
    const dayDate = new Date(`${key}T00:00:00`);
    return dayDate.getFullYear() === year && dayDate.getMonth() === month;
  });
  const monthTrades = monthKeys.reduce((total, key) => total + (metrics.dayTradeMap.get(key) || 0), 0);
  const monthWinningTrades = monthKeys.reduce((total, key) => total + (metrics.dayWinTradeMap.get(key) || 0), 0);
  const monthTradeWinRate = monthTrades ? monthWinningTrades / monthTrades : 0;
  els.calendarWinRate.textContent = `${formatPercent(monthTradeWinRate)} trade win rate`;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => `<div class="calendar-head">${name}</div>`);
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + index);
    const key = toDateKey(cellDate);
    const pnl = metrics.dayPnlMap.get(key) || 0;
    const trades = metrics.dayTradeMap.get(key) || 0;
    const winningTrades = metrics.dayWinTradeMap.get(key) || 0;
    const tradeWinRate = trades ? winningTrades / trades : 0;
    const classes = ["calendar-day"];
    if (cellDate.getMonth() !== month) classes.push("muted");
    if (pnl > 0) classes.push("win");
    if (pnl < 0) classes.push("loss");
    cells.push(`
      <div class="${classes.join(" ")}" ${trades ? `data-calendar-journal-date="${key}" role="button" tabindex="0" aria-label="Open journal for ${key}"` : ""}>
        <span class="date-num">${cellDate.getDate()}</span>
        ${trades ? `<span class="calendar-pnl ${pnl >= 0 ? "money-pos" : "money-neg"}">${currency.format(pnl)}</span><small>${trades} trades</small><small class="calendar-win-rate">${formatPercent(tradeWinRate)} trade WR</small>` : ""}
      </div>
    `);
  }

  els.calendarGrid.innerHTML = [...days, ...cells].join("");
}

function renderPersonalRules() {
  els.personalRules.innerHTML = state.personalRules.map((rule) => `
    <div class="personal-rule ${rule.checked ? "done" : ""}">
      <input type="checkbox" data-rule-check="${rule.id}" ${rule.checked ? "checked" : ""} aria-label="Toggle rule">
      <div class="rule-text" contenteditable="true" data-rule-text="${rule.id}">${escapeHtml(rule.text)}</div>
      <button class="icon-button" type="button" data-rule-delete="${rule.id}" title="Delete rule">x</button>
    </div>
  `).join("");
}

function shiftMonth(amount) {
  state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + amount, 1);
  renderCalendar(getMetrics());
}

function drawChart(metrics) {
  const canvas = els.chart;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.floor(rect.width * ratio));
  canvas.height = Math.floor(360 * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  const pad = { top: 28, right: 20, bottom: 42, left: 76 };
  const values = metrics.points.flatMap((point) => [point.balance, point.floor]);
  const min = Math.min(...values, RULES.startingBalance - RULES.maxLossLimit) - 120;
  const max = Math.max(...values, RULES.startingBalance + RULES.profitTarget) + 120;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#101617";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#27383b";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#8fa09d";
  ctx.font = "12px Inter, system-ui, sans-serif";

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (plotH / 4) * i;
    const value = max - ((max - min) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(currency.format(value).replace(".00", ""), 12, y + 4);
  }

  drawLine(ctx, metrics.points, "floor", "#ff6b7a", pad, plotW, plotH, min, max);
  drawLine(ctx, metrics.points, "balance", "#39d98a", pad, plotW, plotH, min, max);

  const targetY = yFor(RULES.startingBalance + RULES.profitTarget, pad, plotH, min, max);
  ctx.strokeStyle = "rgba(246, 196, 69, 0.72)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(pad.left, targetY);
  ctx.lineTo(width - pad.right, targetY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#f6c445";
  ctx.fillText("Target", width - pad.right - 48, targetY - 8);

  ctx.fillStyle = "#9bacaa";
  metrics.points.forEach((point, index) => {
    if (metrics.points.length > 8 && index % Math.ceil(metrics.points.length / 7) !== 0 && index !== metrics.points.length - 1) return;
    const x = xFor(index, metrics.points.length, pad, plotW);
    ctx.fillText(point.label, Math.max(8, Math.min(width - 62, x - 20)), height - 15);
  });
}

function drawLine(ctx, points, key, color, pad, plotW, plotH, min, max) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xFor(index, points.length, pad, plotW);
    const y = yFor(point[key], pad, plotH, min, max);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach((point, index) => {
    const x = xFor(index, points.length, pad, plotW);
    const y = yFor(point[key], pad, plotH, min, max);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function exportCsv() {
  const rows = [["date", "session", "day_notes", "trade_number", "instrument", "direction", "trade_session", "pnl", "size", "type", "setup"]];
  getSortedDays().forEach((day) => {
    day.trades.forEach((trade, index) => {
      rows.push([day.date, day.session, day.notes, index + 1, trade.instrument, trade.direction, trade.tradeSession, trade.pnl, trade.size, trade.type, trade.setup]);
    });
  });
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flex-25k-practice-journal.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function importCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const imported = parseCsv(text);
  if (imported.length) {
    state.days = imported;
    saveDays();
    render();
  }
  event.target.value = "";
}

function loadDays() {
  try {
    const raw = localStorage.getItem(RULES.storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateDay).filter(Boolean);
  } catch {
    return [];
  }
}

function migrateDay(item) {
  if (Array.isArray(item.trades)) {
    return {
      id: item.id || crypto.randomUUID(),
      date: item.date,
      session: item.session || "Mixed",
      notes: item.notes || "",
      trades: item.trades.map((trade) => ({
        id: trade.id || crypto.randomUUID(),
        instrument: trade.instrument || "",
        direction: trade.direction || "Long",
        tradeSession: trade.tradeSession || trade.trade_session || item.session || "Mixed",
        pnl: Number(trade.pnl),
        size: Number(trade.size) || 0,
        type: trade.type === "micro" ? "micro" : "mini",
        setup: trade.setup || ""
      })).filter((trade) => Number.isFinite(trade.pnl))
    };
  }
  if (item.date && Number.isFinite(Number(item.pnl))) {
    return {
      id: item.id || crypto.randomUUID(),
      date: item.date,
      session: "Mixed",
      notes: item.notes || "",
      trades: [{
        id: crypto.randomUUID(),
        instrument: item.instrument || "",
        direction: "Long",
        tradeSession: item.tradeSession || item.trade_session || "Mixed",
        pnl: Number(item.pnl),
        size: Number(item.size) || 0,
        type: item.type === "micro" ? "micro" : "mini",
        setup: "Migrated day entry"
      }]
    };
  }
  return null;
}

function saveDays() {
  localStorage.setItem(RULES.storageKey, JSON.stringify(state.days));
}

function loadPersonalRules() {
  try {
    const raw = localStorage.getItem(RULES.rulesKey);
    if (!raw) return defaultPersonalRules();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultPersonalRules();
  } catch {
    return defaultPersonalRules();
  }
}

function defaultPersonalRules() {
  return [
    { id: crypto.randomUUID(), text: "Only take A+ setups from my plan", checked: false },
    { id: crypto.randomUUID(), text: "No revenge trades after a loss", checked: false },
    { id: crypto.randomUUID(), text: "Stop trading after hitting my daily stop", checked: false },
    { id: crypto.randomUUID(), text: "Respect max contract size", checked: false }
  ];
}

function savePersonalRules() {
  localStorage.setItem(RULES.rulesKey, JSON.stringify(state.personalRules));
}

// Daily notes experiment: remove these helpers and RULES.tradeNotesKey to revert.
function loadTradeNotes() {
  try {
    const raw = localStorage.getItem(RULES.tradeNotesKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveTradeNotes() {
  localStorage.setItem(RULES.tradeNotesKey, JSON.stringify(state.tradeNotes));
}

function parseCsv(text) {
  const rows = splitCsv(text);
  const [header, ...dataRows] = rows.filter((row) => row.some(Boolean));
  if (!header) return [];
  const keys = header.map((key) => key.trim().toLowerCase());
  const days = new Map();

  dataRows.forEach((row) => {
    const object = Object.fromEntries(keys.map((key, index) => [key, row[index] || ""]));
    if (!object.date || !Number.isFinite(Number(object.pnl))) return;
    if (!days.has(object.date)) {
      days.set(object.date, {
        id: crypto.randomUUID(),
        date: object.date,
        session: object.session || "Mixed",
        notes: object.day_notes || object.notes || "",
        trades: []
      });
    }
    days.get(object.date).trades.push({
      id: crypto.randomUUID(),
      instrument: object.instrument || "",
      direction: object.direction || "Long",
      tradeSession: object.trade_session || object.tradeSession || object.session || "Mixed",
      pnl: Number(object.pnl),
      size: Number(object.size) || 0,
      type: object.type === "micro" ? "micro" : "mini",
      setup: object.setup || ""
    });
  });

  return [...days.values()];
}

function splitCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function sumTrades(trades) {
  return trades.reduce((total, trade) => total + (Number(trade.pnl) || 0), 0);
}

function largestSize(trades, type) {
  return trades.filter((trade) => trade.type === type).reduce((max, trade) => Math.max(max, Number(trade.size) || 0), 0);
}

function xFor(index, length, pad, plotW) {
  if (length <= 1) return pad.left;
  return pad.left + (plotW / (length - 1)) * index;
}

function yFor(value, pad, plotH, min, max) {
  return pad.top + plotH - ((value - min) / (max - min)) * plotH;
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
