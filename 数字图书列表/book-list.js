const BOOKS = createBooks();
const PAGE_SEARCH_PARAMS = new URLSearchParams(window.location.search);
const LIST_VIEW_STATE_STORAGE_KEY = "digital-book-list-view-state";
const RESTORE_LIST_STATE_PARAM = "restoreListState";
let tableResizeObserver = null;
let lastAppliedTableLayoutSignature = "";
let modalDragState = null;
const TABLE_WIDTH_VARIABLE_MAPPINGS = [
  ["--sticky-select-base-width", "--sticky-select-width"],
  ["--sticky-code-base-width", "--sticky-code-width"],
  ["--sticky-cover-base-width", "--sticky-cover-width"],
  ["--sticky-name-base-width", "--sticky-name-width"],
  ["--col-category-base-width", "--col-category-width"],
  ["--col-type-base-width", "--col-type-width"],
  ["--col-tag-base-width", "--col-tag-width"],
  ["--col-series-base-width", "--col-series-width"],
  ["--col-created-meta-base-width", "--col-created-meta-width"],
  ["--col-recent-meta-base-width", "--col-recent-meta-width"],
  ["--col-progress-base-width", "--col-progress-width"],
  ["--col-answer-region-base-width", "--col-answer-region-width"],
  ["--col-shelf-base-width", "--col-shelf-width"],
  ["--col-auto-grading-base-width", "--col-auto-grading-width"],
  ["--col-action-base-width", "--col-action-width"]
];

const REASON_SAMPLE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
    <rect width="960" height="560" rx="20" fill="#ffffff"/>
    <rect x="26" y="24" width="908" height="58" rx="10" fill="#f7f9fc" stroke="#e5eaf1"/>
    <rect x="42" y="108" width="876" height="20" rx="10" fill="#e9eef5"/>
    <rect x="42" y="144" width="760" height="18" rx="9" fill="#eef2f7"/>
    <rect x="42" y="176" width="820" height="18" rx="9" fill="#eef2f7"/>
    <rect x="42" y="214" width="400" height="18" rx="9" fill="#eef2f7"/>
    <rect x="124" y="248" width="218" height="88" rx="8" fill="#ffffff" stroke="#cfd8e3"/>
    <circle cx="228" cy="292" r="62" fill="#f4f7fb" stroke="#c8d2de"/>
    <path d="M228 230 L228 354 M166 292 L290 292" stroke="#d4dce6" stroke-width="2" stroke-dasharray="6 6"/>
    <rect x="514" y="258" width="136" height="42" rx="8" fill="none" stroke="#ff4d4f" stroke-width="4"/>
    <rect x="96" y="148" width="114" height="42" rx="8" fill="none" stroke="#ff4d4f" stroke-width="4"/>
    <path d="M238 169 C290 182 332 198 390 220" fill="none" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round"/>
    <path d="M389 220 L368 214 L376 233" fill="none" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M644 280 C700 260 748 244 804 230" fill="none" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round"/>
    <path d="M804 230 L786 226 L792 242" fill="none" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="42" y="382" width="236" height="16" rx="8" fill="#d8e7ff"/>
    <rect x="42" y="412" width="300" height="16" rx="8" fill="#d8e7ff"/>
    <rect x="42" y="442" width="188" height="16" rx="8" fill="#d8e7ff"/>
  </svg>
`)}`;

const TAG_STAGE_OPTIONS = ["小学", "初中"];
const TAG_SUBJECT_OPTIONS = {
  小学: ["语文", "数学", "英语"],
  初中: ["语文", "数学", "英语", "物理", "化学"]
};
const TAG_VERSION_OPTIONS = {
  小学: {
    语文: ["人教版", "统编版"],
    数学: ["人教版", "北师大版", "苏教版"],
    英语: ["人教版", "外研版"]
  },
  初中: {
    语文: ["人教版", "统编版"],
    数学: ["人教版", "北师大版", "沪科版"],
    英语: ["人教版", "外研版"],
    物理: ["人教版", "沪科版"],
    化学: ["人教版", "鲁教版"]
  }
};
const TAG_GRADE_VOLUME_OPTIONS = {
  小学: ["一年级/上册", "一年级/下册", "二年级/上册", "二年级/下册", "三年级/上册", "三年级/下册", "四年级/上册", "四年级/下册", "五年级/上册", "五年级/下册", "六年级/上册", "六年级/下册"],
  初中: ["七年级/上册", "七年级/下册", "八年级/上册", "八年级/下册", "九年级/上册", "九年级/下册", "九年级/全一册"]
};

const state = {
  filters: {
    shelfStatus: "",
    autoGradingStatus: "",
    bookType: "",
    category: "",
    subject: "",
    stage: "",
    grade: "",
    customCode: "",
    code: "",
    name: "",
    creator: "",
    createdStart: "",
    createdEnd: "",
    recentOperator: "",
    recentStart: "",
    recentEnd: ""
  },
  currentPage: 1,
  pageSize: 10,
  selectedIds: [],
  filterExpanded: false,
  filterOverflowVisible: false,
  logDrawerCloseTimer: null,
  activeSelectClearWrap: null,
  activeDateClearWrap: null,
  activeHeaderTooltipTrigger: null,
  activeLogEntries: [],
  pendingConfirmAction: null,
  pendingNameEdit: null,
  editingBookId: null,
  homeworkQrBookId: null,
  homeworkQrSize: 0,
  homeworkQrLeafType: false,
  basicInfoCoverUrl: "",
  modalTagStage: "",
  modalTagGroups: [],
  activeTagDropdown: {
    groupId: "",
    type: "",
    cascadeGrade: "",
    query: ""
  },
  datePicker: {
    targetKey: null,
    anchorElement: null,
    draftStart: "",
    draftEnd: "",
    previewStart: "",
    previewEnd: "",
    selectionPart: "",
    focusTransferTimer: null,
    switchingFocus: false,
    visibleMonthStart: getMonthStart(new Date())
  }
};

const elements = {
  shelfFilter: document.querySelector("#shelf-filter"),
  autoGradingFilter: document.querySelector("#auto-grading-filter"),
  typeFilter: document.querySelector("#type-filter"),
  categoryFilter: document.querySelector("#category-filter"),
  subjectFilter: document.querySelector("#subject-filter"),
  stageFilter: document.querySelector("#stage-filter"),
  gradeFilter: document.querySelector("#grade-filter"),
  customFilter: document.querySelector("#custom-filter"),
  codeFilter: document.querySelector("#code-filter"),
  nameFilter: document.querySelector("#name-filter"),
  creatorFilter: document.querySelector("#creator-filter"),
  createdStartFilter: document.querySelector("#created-start-filter"),
  createdEndFilter: document.querySelector("#created-end-filter"),
  recentOperatorFilter: document.querySelector("#recent-operator-filter"),
  recentStartFilter: document.querySelector("#recent-start-filter"),
  recentEndFilter: document.querySelector("#recent-end-filter"),
  dateRangeTriggers: Array.from(document.querySelectorAll("[data-date-range-trigger]")),
  datePicker: document.querySelector("#date-range-picker"),
  datePickerCalendars: document.querySelector("#date-picker-calendars"),
  datePickerSummary: document.querySelector("#date-picker-summary"),
  datePickerClear: document.querySelector("#date-picker-clear"),
  datePickerApply: document.querySelector("#date-picker-apply"),
  createBookButton: document.querySelector("#create-book-button"),
  selectionToolbar: document.querySelector("#selection-toolbar"),
  selectedCount: document.querySelector("#selected-count"),
  batchUpButton: document.querySelector("#batch-up-button"),
  batchDownButton: document.querySelector("#batch-down-button"),
  tablePanel: document.querySelector(".table-panel"),
  confirmModal: document.querySelector("#confirm-modal"),
  confirmClose: document.querySelector("#confirm-close"),
  confirmMessage: document.querySelector("#confirm-message"),
  confirmCancel: document.querySelector("#confirm-cancel"),
  confirmSubmit: document.querySelector("#confirm-submit"),
  previewModal: document.querySelector("#preview-modal"),
  previewImage: document.querySelector("#preview-image"),
  previewClose: document.querySelector("#preview-close"),
  homeworkQrModal: document.querySelector("#homework-qr-modal"),
  homeworkQrClose: document.querySelector("#homework-qr-close"),
  homeworkQrCancel: document.querySelector("#homework-qr-cancel"),
  homeworkQrDownload: document.querySelector("#homework-qr-download"),
  homeworkQrLeafType: document.querySelector("#homework-qr-leaf-type"),
  homeworkQrSizeButtons: Array.from(document.querySelectorAll("[data-qr-size]")),
  basicInfoModal: document.querySelector("#basic-info-modal"),
  basicInfoContent: document.querySelector("#basic-info-content"),
  basicInfoClose: document.querySelector("#basic-info-close"),
  basicInfoCancel: document.querySelector("#basic-info-cancel"),
  basicInfoSave: document.querySelector("#basic-info-save"),
  basicInfoForm: document.querySelector("#basic-info-form"),
  modalClassification: document.querySelector("#modal-classification"),
  modalName: document.querySelector("#modal-name"),
  modalCoverTrigger: document.querySelector("#modal-cover-trigger"),
  modalCoverInput: document.querySelector("#modal-cover-input"),
  modalCoverPreview: document.querySelector("#modal-cover-preview"),
  modalDescription: document.querySelector("#modal-description"),
  modalTagStage: document.querySelector("#modal-tag-stage"),
  modalTagGroups: document.querySelector("#modal-tag-groups"),
  modalTagGroupAdd: document.querySelector("#modal-tag-group-add"),
  modalSeriesYear: document.querySelector("#modal-series-year"),
  modalSeriesName: document.querySelector("#modal-series-name"),
  modalSeriesRegion: document.querySelector("#modal-series-region"),
  logDrawer: document.querySelector("#log-drawer"),
  logDrawerContent: document.querySelector("#log-drawer-content"),
  logDrawerClose: document.querySelector("#log-drawer-close"),
  reasonModal: document.querySelector("#reason-modal"),
  reasonContent: document.querySelector("#reason-content"),
  reasonClose: document.querySelector("#reason-close"),
  reasonConfirm: document.querySelector("#reason-confirm"),
  toastHost: document.querySelector("#toast-host"),
  nameEditorPopover: document.querySelector("#name-editor-popover"),
  nameEditorTextarea: document.querySelector("#name-editor-textarea"),
  nameEditorClose: document.querySelector("#name-editor-close"),
  nameEditorCancel: document.querySelector("#name-editor-cancel"),
  nameEditorSave: document.querySelector("#name-editor-save"),
  headerTooltip: document.querySelector("#header-tooltip"),
  selectAll: document.querySelector("#select-all"),
  tableHeadScroll: document.querySelector(".table-head-scroll"),
  tableBodyScroll: document.querySelector("#table-body-scroll"),
  tableBody: document.querySelector("#book-table-body"),
  mobileCardList: document.querySelector("#mobile-card-list"),
  paginationTotal: document.querySelector("#pagination-total"),
  prevPage: document.querySelector("#prev-page"),
  nextPage: document.querySelector("#next-page"),
  pageList: document.querySelector("#page-list"),
  pageJumpInput: document.querySelector("#page-jump-input"),
  pageSize: document.querySelector("#page-size"),
  searchButton: document.querySelector("#search-button"),
  resetButton: document.querySelector("#reset-button"),
  exportButton: document.querySelector("#export-button"),
  filterSelects: Array.from(document.querySelectorAll(".filter-panel .field-select")),
  filterControls: document.querySelector("#filter-controls"),
  filterControlsOverflow: document.querySelector("#filter-controls-overflow"),
  filterToggleRow: document.querySelector("#filter-toggle-row"),
  filterToggleButton: document.querySelector("#filter-toggle-button")
};

boot();

function boot() {
  state.filterExpanded = false;
  initializeFilterClearControls();
  initializeFilterOptions();
  const restoredListViewState = consumeListViewStateOnReturn();
  syncSelectPlaceholderStates();
  updateFilterCollapseState();
  bindEvents();
  initializeTableScaleObserver();
  render();
  syncTableLayoutMetrics();
  if (restoredListViewState) {
    scheduleListViewScrollRestore(restoredListViewState);
  }
}

function canUseSessionStorage() {
  try {
    return typeof window.sessionStorage !== "undefined";
  } catch (error) {
    return false;
  }
}

function getCurrentListViewState() {
  return {
    filters: { ...state.filters },
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    tableScrollTop: elements.tableBodyScroll instanceof HTMLElement ? elements.tableBodyScroll.scrollTop : 0,
    tableScrollLeft: elements.tableBodyScroll instanceof HTMLElement ? elements.tableBodyScroll.scrollLeft : 0,
    mobileScrollTop: elements.mobileCardList instanceof HTMLElement ? elements.mobileCardList.scrollTop : 0
  };
}

function saveCurrentListViewState() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(LIST_VIEW_STATE_STORAGE_KEY, JSON.stringify(getCurrentListViewState()));
}

function readSavedListViewState() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(LIST_VIEW_STATE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.sessionStorage.removeItem(LIST_VIEW_STATE_STORAGE_KEY);
    return null;
  }
}

function clearSavedListViewState() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(LIST_VIEW_STATE_STORAGE_KEY);
}

function consumeListViewStateOnReturn() {
  if (PAGE_SEARCH_PARAMS.get(RESTORE_LIST_STATE_PARAM) !== "1") {
    return null;
  }

  const savedState = readSavedListViewState();
  clearSavedListViewState();
  removeRestoreListStateParam();
  if (!savedState) {
    return null;
  }

  applyRestoredListViewState(savedState);
  return savedState;
}

function removeRestoreListStateParam() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete(RESTORE_LIST_STATE_PARAM);
  window.history.replaceState(null, "", nextUrl.toString());
}

function applyRestoredListViewState(snapshot) {
  const restoredFilters = snapshot && typeof snapshot === "object" && snapshot.filters && typeof snapshot.filters === "object"
    ? snapshot.filters
    : {};

  state.filters = {
    ...state.filters,
    shelfStatus: String(restoredFilters.shelfStatus || ""),
    autoGradingStatus: String(restoredFilters.autoGradingStatus || ""),
    bookType: String(restoredFilters.bookType || ""),
    category: String(restoredFilters.category || ""),
    subject: String(restoredFilters.subject || ""),
    stage: String(restoredFilters.stage || ""),
    grade: String(restoredFilters.grade || ""),
    customCode: String(restoredFilters.customCode || ""),
    code: String(restoredFilters.code || ""),
    name: String(restoredFilters.name || ""),
    creator: String(restoredFilters.creator || ""),
    createdStart: String(restoredFilters.createdStart || ""),
    createdEnd: String(restoredFilters.createdEnd || ""),
    recentOperator: String(restoredFilters.recentOperator || ""),
    recentStart: String(restoredFilters.recentStart || ""),
    recentEnd: String(restoredFilters.recentEnd || "")
  };

  elements.shelfFilter.value = state.filters.shelfStatus;
  elements.autoGradingFilter.value = state.filters.autoGradingStatus;
  elements.typeFilter.value = state.filters.bookType;
  elements.categoryFilter.value = state.filters.category;
  elements.subjectFilter.value = state.filters.subject;
  elements.stageFilter.value = state.filters.stage;
  syncGradeFilterOptions();
  elements.gradeFilter.value = state.filters.grade;
  elements.customFilter.value = state.filters.customCode;
  elements.codeFilter.value = state.filters.code;
  elements.nameFilter.value = state.filters.name;
  elements.creatorFilter.value = state.filters.creator;
  elements.createdStartFilter.value = state.filters.createdStart;
  elements.createdEndFilter.value = state.filters.createdEnd;
  elements.recentOperatorFilter.value = state.filters.recentOperator;
  elements.recentStartFilter.value = state.filters.recentStart;
  elements.recentEndFilter.value = state.filters.recentEnd;

  const restoredPageSize = Number(snapshot?.pageSize);
  state.pageSize = restoredPageSize > 0 ? restoredPageSize : state.pageSize;
  elements.pageSize.value = String(state.pageSize);

  const restoredCurrentPage = Number(snapshot?.currentPage);
  state.currentPage = restoredCurrentPage > 0 ? restoredCurrentPage : 1;
  syncSelectPlaceholderStates();
  syncFilterClearButtons();
}

function scheduleListViewScrollRestore(snapshot) {
  const restoreScroll = () => {
    if (elements.tableBodyScroll instanceof HTMLElement) {
      elements.tableBodyScroll.scrollTop = Math.max(Number(snapshot?.tableScrollTop) || 0, 0);
      elements.tableBodyScroll.scrollLeft = Math.max(Number(snapshot?.tableScrollLeft) || 0, 0);
    }
    if (elements.mobileCardList instanceof HTMLElement) {
      elements.mobileCardList.scrollTop = Math.max(Number(snapshot?.mobileScrollTop) || 0, 0);
    }
    syncTableHeaderScroll();
  };

  window.requestAnimationFrame(() => {
    restoreScroll();
    window.setTimeout(restoreScroll, 80);
  });
}

function initializeTableScaleObserver() {
  if (typeof ResizeObserver !== "function") {
    return;
  }

  tableResizeObserver?.disconnect();
  tableResizeObserver = new ResizeObserver(() => {
    syncTableLayoutMetrics();
    syncTableFreezeState();
  });

  if (elements.tablePanel instanceof HTMLElement) {
    tableResizeObserver.observe(elements.tablePanel);
  }

  if (elements.tableBodyScroll instanceof HTMLElement) {
    tableResizeObserver.observe(elements.tableBodyScroll);
  }
}

function bindEvents() {
  elements.shelfFilter.addEventListener("change", updateFiltersFromForm);
  elements.autoGradingFilter.addEventListener("change", updateFiltersFromForm);
  elements.typeFilter.addEventListener("change", updateFiltersFromForm);
  elements.categoryFilter.addEventListener("change", updateFiltersFromForm);
  elements.subjectFilter.addEventListener("change", updateFiltersFromForm);
  elements.stageFilter.addEventListener("change", () => {
    syncGradeFilterOptions();
    updateFiltersFromForm();
  });
  elements.gradeFilter.addEventListener("change", updateFiltersFromForm);
  elements.pageSize.addEventListener("change", handlePageSizeChange);
  elements.filterSelects.forEach((select) => {
    select.addEventListener("change", () => {
      syncSelectPlaceholderStates();
      syncFilterClearButtons();
    });
  });

  elements.dateRangeTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openDatePicker(trigger.dataset.dateRangeTrigger || "", trigger);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      openDatePicker(trigger.dataset.dateRangeTrigger || "", trigger);
    });
  });

  [
    [elements.createdStartFilter, "created", "start"],
    [elements.createdEndFilter, "created", "end"],
    [elements.recentStartFilter, "recent", "start"],
    [elements.recentEndFilter, "recent", "end"]
  ].forEach(([input, rangeKey, part]) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    input.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    input.addEventListener("focus", () => {
      state.datePicker.selectionPart = part;
      const trigger = input.closest("[data-date-range-trigger]");
      if (trigger instanceof HTMLElement) {
        openDatePicker(rangeKey, trigger, part);
      }
    });

    input.addEventListener("input", () => {
      handleManualDateInput(rangeKey, part, input);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== "ArrowDown") {
        return;
      }
      event.preventDefault();
      const trigger = input.closest("[data-date-range-trigger]");
      if (trigger instanceof HTMLElement) {
        openDatePicker(rangeKey, trigger, part);
      }
    });

    input.addEventListener("blur", (event) => {
      const normalizedValue = normalizeManualDateInput(input.value);
      input.value = normalizedValue;
      updateDateInputValidity(input, normalizedValue);

      const nextFocus = event.relatedTarget;
      if (nextFocus instanceof Node && elements.datePicker.contains(nextFocus)) {
        return;
      }

      applyManualDateRangeIfComplete(rangeKey);
      updateFiltersFromForm();
      syncFilterClearButtons();
    });
  });

  [
    elements.customFilter,
    elements.codeFilter,
    elements.nameFilter,
    elements.creatorFilter,
    elements.createdStartFilter,
    elements.createdEndFilter,
    elements.recentOperatorFilter,
    elements.recentStartFilter,
    elements.recentEndFilter
  ].forEach((input) => {
    input.addEventListener("input", () => {
      updateFiltersFromForm();
      syncFilterClearButtons();
    });
    input.addEventListener("change", () => {
      updateFiltersFromForm();
      syncFilterClearButtons();
    });
  });

  elements.searchButton.addEventListener("click", () => {
    state.currentPage = 1;
    render();
    scrollListViewportToTop();
  });

  elements.modalCoverTrigger?.addEventListener("click", () => {
    elements.modalCoverInput?.click();
  });

  elements.modalCoverInput?.addEventListener("change", handleBasicInfoCoverChange);
  elements.modalTagStage?.addEventListener("change", handleModalTagStageChange);
  elements.modalTagGroupAdd?.addEventListener("click", addModalTagGroup);
  elements.basicInfoForm?.addEventListener("click", handleBasicInfoFormClick);
  elements.basicInfoForm?.addEventListener("change", handleBasicInfoFormChange);
  elements.basicInfoForm?.addEventListener("input", handleBasicInfoFormInput);

  elements.resetButton.addEventListener("click", resetFilters);
  elements.exportButton.addEventListener("click", exportCurrentView);
  elements.selectAll.addEventListener("change", handleSelectAllChange);
  elements.tableBodyScroll?.addEventListener("scroll", syncTableHeaderScroll, { passive: true });

  document.addEventListener("click", (event) => {
    const clearTrigger = event.target instanceof HTMLElement ? event.target.closest("[data-filter-clear]") : null;
    if (clearTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      event.stopPropagation();
      clearFilterControl(clearTrigger);
    }
  });

  const handleSelectClearHotspotMove = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      setActiveSelectClearWrap(null);
      setActiveDateClearWrap(null);
      return;
    }

    const wrap = target.closest(".filter-control-wrap.is-select-wrap.has-value");
    if (!(wrap instanceof HTMLElement)) {
      setActiveSelectClearWrap(null);
    } else {
      const rect = wrap.getBoundingClientRect();
      const hotzoneWidth = 22;
      const isInsideHotzone = event.clientX >= rect.right - hotzoneWidth && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      setActiveSelectClearWrap(isInsideHotzone ? wrap : null);
    }

    const dateWrap = target.closest(".filter-control-wrap.is-date-wrap.has-value");
    if (!(dateWrap instanceof HTMLElement)) {
      setActiveDateClearWrap(null);
      return;
    }

    const dateRect = dateWrap.getBoundingClientRect();
    const dateHotzoneWidth = 22;
    const isInsideDateHotzone = event.clientX >= dateRect.right - dateHotzoneWidth && event.clientX <= dateRect.right && event.clientY >= dateRect.top && event.clientY <= dateRect.bottom;
    setActiveDateClearWrap(isInsideDateHotzone ? dateWrap : null);
  };

  document.addEventListener("mousemove", handleSelectClearHotspotMove, { passive: true });
  document.addEventListener("mouseleave", () => {
    setActiveSelectClearWrap(null);
    setActiveDateClearWrap(null);
  });

  elements.tableBody.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-row-checkbox]");
    if (!(checkbox instanceof HTMLInputElement)) {
      return;
    }
    toggleSelection(checkbox.dataset.bookId || "", checkbox.checked);
  });

  elements.mobileCardList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-row-checkbox]");
    if (!(checkbox instanceof HTMLInputElement)) {
      return;
    }
    toggleSelection(checkbox.dataset.bookId || "", checkbox.checked);
  });

  elements.confirmClose?.addEventListener("click", closeConfirmModal);
  elements.confirmCancel.addEventListener("click", closeConfirmModal);
  elements.confirmSubmit.addEventListener("click", submitConfirmAction);
  elements.confirmModal.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-confirm-close]");
    if (closeTarget) {
      closeConfirmModal();
    }
  });

  elements.previewClose.addEventListener("click", closePreviewModal);
  elements.previewModal.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-preview-close]");
    if (closeTarget) {
      closePreviewModal();
    }
  });

  elements.homeworkQrClose?.addEventListener("click", closeHomeworkQrModal);
  elements.homeworkQrCancel?.addEventListener("click", closeHomeworkQrModal);
  elements.homeworkQrDownload?.addEventListener("click", downloadHomeworkQrCode);
  elements.homeworkQrLeafType?.addEventListener("change", handleHomeworkQrLeafTypeChange);
  elements.homeworkQrSizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectHomeworkQrSize(Number(button.dataset.qrSize || "0"));
    });
  });
  elements.homeworkQrModal?.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-homework-qr-close]");
    if (closeTarget) {
      closeHomeworkQrModal();
    }
  });

  elements.basicInfoClose.addEventListener("click", closeBasicInfoModal);
  elements.basicInfoCancel.addEventListener("click", closeBasicInfoModal);
  elements.basicInfoSave.addEventListener("click", submitBasicInfoForm);
  elements.basicInfoModal.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-basic-close]");
    if (closeTarget) {
      closeBasicInfoModal();
    }
  });

  elements.logDrawerClose.addEventListener("click", closeLogDrawer);
  elements.logDrawer.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-drawer-close]");
    if (closeTarget) {
      closeLogDrawer();
    }
  });
  elements.logDrawerContent.addEventListener("click", (event) => {
    const trigger = event.target instanceof HTMLElement ? event.target.closest("[data-log-reason-index]") : null;
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }

    const reasonIndex = Number(trigger.dataset.logReasonIndex || "-1");
    const targetLog = state.activeLogEntries[reasonIndex];
    if (targetLog?.reason) {
      openReasonModal(targetLog.reason, targetLog.reasonImage || "");
    }
  });

  elements.reasonClose?.addEventListener("click", closeReasonModal);
  elements.reasonConfirm?.addEventListener("click", closeReasonModal);
  elements.reasonModal?.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-reason-close]");
    if (closeTarget) {
      closeReasonModal();
    }
  });

  elements.nameEditorClose.addEventListener("click", closeNameEditor);
  elements.nameEditorCancel.addEventListener("click", closeNameEditor);
  elements.nameEditorSave.addEventListener("click", submitNameEdit);
  elements.datePicker.addEventListener("click", handleDatePickerClick);
  elements.datePicker.addEventListener("mouseover", handleDatePickerShortcutHover);
  elements.datePicker.addEventListener("mouseout", handleDatePickerShortcutLeave);
  elements.datePickerClear?.addEventListener("click", clearDatePickerSelection);
  elements.datePickerApply?.addEventListener("click", applyDatePickerSelection);
  elements.headerTooltip?.addEventListener("mouseenter", () => {
    if (elements.headerTooltip instanceof HTMLElement && !elements.headerTooltip.hidden) {
      elements.headerTooltip.dataset.hovering = "true";
    }
  });
  elements.headerTooltip?.addEventListener("mouseleave", () => {
    if (!(elements.headerTooltip instanceof HTMLElement)) {
      return;
    }
    elements.headerTooltip.dataset.hovering = "false";
    hideHeaderTooltip();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const createButton = target.closest("#create-book-button");
    if (createButton instanceof HTMLButtonElement) {
      event.preventDefault();
      openBasicInfoModal();
      return;
    }

    const batchUpTrigger = target.closest("#batch-up-button");
    if (batchUpTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      openBatchConfirm(true);
      return;
    }

    const batchDownTrigger = target.closest("#batch-down-button");
    if (batchDownTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      openBatchConfirm(false);
      return;
    }

    const basicEditTrigger = target.closest("[data-basic-edit]");
    if (basicEditTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      openBookEditorPage(basicEditTrigger.dataset.bookId || "", "edit");
      return;
    }

    const viewTrigger = target.closest("[data-open-book-view]");
    if (viewTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      openBookEditorPage(viewTrigger.dataset.bookId || "", "view");
      return;
    }

    const nameEditTrigger = target.closest("[data-name-edit]");
    if (nameEditTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      openNameEditor(nameEditTrigger.dataset.bookId || "", nameEditTrigger);
      return;
    }

    const previewTrigger = target.closest("[data-preview-image]");
    if (previewTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      closeActionMenu();
      openPreviewModal(previewTrigger.dataset.previewImage || "", previewTrigger.dataset.previewTitle || "图书封面预览");
      return;
    }

    const actionTrigger = target.closest("[data-action-menu-trigger]");
    if (actionTrigger instanceof HTMLButtonElement) {
      event.preventDefault();
      toggleActionMenu(actionTrigger);
      return;
    }

    const menuAction = target.closest("[data-menu-action]");
    if (menuAction instanceof HTMLButtonElement) {
      event.preventDefault();
      handleMenuAction(menuAction.dataset.menuAction || "", menuAction.dataset.bookId || "");
      return;
    }

    const toggleButton = target.closest("[data-shelf-toggle]");
    if (toggleButton instanceof HTMLButtonElement) {
      event.preventDefault();
      closeActionMenu();
      openShelfConfirm(toggleButton.dataset.bookId || "");
      return;
    }

    const autoGradingButton = target.closest("[data-auto-grading-toggle]");
    if (autoGradingButton instanceof HTMLButtonElement) {
      event.preventDefault();
      closeActionMenu();
      toggleAutoGrading(autoGradingButton.dataset.bookId || "");
      return;
    }

    if (
      state.datePicker.switchingFocus ||
      target.closest("[data-picker-date]") ||
      target.closest("[data-picker-nav]") ||
      target.closest("[data-range-shortcut]")
    ) {
      return;
    }

    if (!target.closest(".action-menu-wrap")) {
      closeActionMenu();
    }

    if (!target.closest(".name-editor-popover") && !target.closest("[data-name-edit]")) {
      closeNameEditor();
    }

    if (!target.closest(".date-picker-popover") && !target.closest("[data-date-range-trigger]")) {
      closeDatePicker(true);
    }

    if (!target.closest(".tag-dropdown") && !target.closest("#modal-tag-group-add")) {
      closeTagDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeActionMenu();
      closeNameEditor();
      closePreviewModal();
      closeHomeworkQrModal();
      closeConfirmModal();
      closeBasicInfoModal();
      closeReasonModal();
      closeLogDrawer();
      closeDatePicker(true);
      closeTagDropdown();
      hideHeaderTooltip();
    }
  });

  document.addEventListener("mouseover", handleHeaderTooltipPointer);
  document.addEventListener("mousemove", handleHeaderTooltipPointerMove);
  document.addEventListener("mouseout", handleHeaderTooltipPointerLeave);
  document.addEventListener("focusin", handleHeaderTooltipFocus);
  document.addEventListener("focusout", handleHeaderTooltipBlur);

  elements.prevPage.addEventListener("click", () => {
    if (state.currentPage <= 1) {
      return;
    }
    state.currentPage -= 1;
    render();
    scrollListViewportToTop();
  });

  elements.nextPage.addEventListener("click", () => {
    const totalPages = getTotalPages(getFilteredBooks().length, state.pageSize);
    if (state.currentPage >= totalPages) {
      return;
    }
    state.currentPage += 1;
    render();
    scrollListViewportToTop();
  });

  elements.pageList?.addEventListener("click", (event) => {
    const trigger = event.target instanceof HTMLElement ? event.target.closest("[data-page-number]") : null;
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }

    const nextPage = Number(trigger.dataset.pageNumber || "0");
    if (!nextPage || nextPage === state.currentPage) {
      return;
    }

    state.currentPage = nextPage;
    render();
    scrollListViewportToTop();
  });

  const submitPageJump = () => {
    if (!(elements.pageJumpInput instanceof HTMLInputElement)) {
      return;
    }

    const totalPages = getTotalPages(getFilteredBooks().length, state.pageSize);
    const nextPage = Number(elements.pageJumpInput.value || "0");
    if (!nextPage) {
      return;
    }

    state.currentPage = Math.min(Math.max(nextPage, 1), totalPages);
    render();
    scrollListViewportToTop();
  };

  elements.pageJumpInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    submitPageJump();
  });
  elements.pageJumpInput?.addEventListener("change", submitPageJump);
  elements.pageJumpInput?.addEventListener("blur", submitPageJump);

  window.addEventListener("resize", () => {
    if (state.datePicker.targetKey && state.datePicker.anchorElement instanceof HTMLElement) {
      positionDatePicker(state.datePicker.anchorElement);
    }
    updateFilterCollapseState();
    syncTableHeaderScroll();
    updateOpenActionMenuPosition();
  }, { passive: true });

  elements.filterToggleButton?.addEventListener("click", () => {
    state.filterExpanded = !state.filterExpanded;
    applyFilterCollapseState();
  });

  bindModalDrag(elements.confirmModal, ".confirm-header", ".confirm-dialog");
  bindModalDrag(elements.previewModal, ".preview-header", ".preview-dialog");
  bindModalDrag(elements.homeworkQrModal, ".detail-header", ".homework-qr-dialog");
  bindModalDrag(elements.basicInfoModal, ".detail-header", ".detail-dialog");
  bindModalDrag(elements.reasonModal, ".detail-header", ".reason-dialog");
  window.addEventListener("pointermove", handleModalDrag);
  window.addEventListener("pointerup", stopModalDrag);
  window.addEventListener("pointercancel", stopModalDrag);

  window.addEventListener("scroll", updateOpenActionMenuPosition, true);
}

function initializeFilterOptions() {
  populateFilterOptions(elements.subjectFilter, getUniqueValues(BOOKS, "subject"), "请选择学科");
  populateFilterOptions(elements.stageFilter, getUniqueValues(BOOKS, "stage"), "请选择学段");
  syncGradeFilterOptions();
}

function populateFilterOptions(selectElement, values, placeholder) {
  const currentValue = selectElement.value;
  const optionsMarkup = [`<option value="" hidden>${placeholder}</option>`]
    .concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
  selectElement.innerHTML = optionsMarkup;
  if (values.includes(currentValue)) {
    selectElement.value = currentValue;
  } else {
    selectElement.value = "";
  }
  syncSelectPlaceholderStates();
}

function syncGradeFilterOptions() {
  const selectedStage = elements.stageFilter.value.trim();
  const stageGradeMap = {
    小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
    初中: ["七年级", "八年级", "九年级"]
  };
  const gradeValues = selectedStage
    ? (stageGradeMap[selectedStage] || [])
    : [...stageGradeMap.小学, ...stageGradeMap.初中];
  const previousValue = elements.gradeFilter.value;
  populateFilterOptions(elements.gradeFilter, gradeValues, "请选择年级");
  if (gradeValues.includes(previousValue)) {
    elements.gradeFilter.value = previousValue;
  }
}
function getUniqueValues(list, key) {
  return Array.from(new Set(list.map((item) => item[key]).filter(Boolean)));
}

function updateFiltersFromForm() {
  state.filters = {
    shelfStatus: elements.shelfFilter.value.trim(),
    autoGradingStatus: elements.autoGradingFilter.value.trim(),
    bookType: elements.typeFilter.value.trim(),
    category: elements.categoryFilter.value.trim(),
    subject: elements.subjectFilter.value.trim(),
    stage: elements.stageFilter.value.trim(),
    grade: elements.gradeFilter.value.trim(),
    customCode: elements.customFilter.value.trim(),
    code: elements.codeFilter.value.trim(),
    name: elements.nameFilter.value.trim(),
    creator: elements.creatorFilter.value.trim(),
    createdStart: elements.createdStartFilter.value,
    createdEnd: elements.createdEndFilter.value,
    recentOperator: elements.recentOperatorFilter.value.trim(),
    recentStart: elements.recentStartFilter.value,
    recentEnd: elements.recentEndFilter.value
  };
  state.currentPage = 1;
}

function scrollListViewportToTop() {
  [elements.tableBodyScroll, elements.mobileCardList].forEach((element) => {
    if (element instanceof HTMLElement) {
      element.scrollTop = 0;
    }
  });
}

function handlePageSizeChange() {
  state.pageSize = Number(elements.pageSize.value) || 10;
  state.currentPage = 1;
  render();
  scrollListViewportToTop();
}

function resetFilters() {
  state.filters = {
    shelfStatus: "",
    autoGradingStatus: "",
    bookType: "",
    category: "",
    subject: "",
    stage: "",
    grade: "",
    customCode: "",
    code: "",
    name: "",
    creator: "",
    createdStart: "",
    createdEnd: "",
    recentOperator: "",
    recentStart: "",
    recentEnd: ""
  };
  state.currentPage = 1;

  elements.shelfFilter.value = "";
  elements.autoGradingFilter.value = "";
  elements.typeFilter.value = "";
  elements.categoryFilter.value = "";
  elements.subjectFilter.value = "";
  elements.stageFilter.value = "";
  elements.gradeFilter.value = "";
  elements.customFilter.value = "";
  elements.codeFilter.value = "";
  elements.nameFilter.value = "";
  elements.creatorFilter.value = "";
  elements.createdStartFilter.value = "";
  elements.createdEndFilter.value = "";
  elements.recentOperatorFilter.value = "";
  elements.recentStartFilter.value = "";
  elements.recentEndFilter.value = "";

  syncGradeFilterOptions();
  closeDatePicker();
  syncSelectPlaceholderStates();
  render();
}

function exportCurrentView() {
  const rows = getFilteredBooks();
  const header = ["编号", "名称", "分类", "类型", "图书标签", "套系信息", "创建人与时间", "最近操作人与时间", "精编进度", "作答区完成情况", "上架状态", "书版自动批改状态"];
  const content = rows.map((item) => [
    item.code,
    item.name,
    item.category,
    item.bookType,
    [item.subject, item.version, item.gradeLabel].filter(Boolean).join(" | "),
    [item.seriesYear, item.seriesName, item.seriesRegion].filter(Boolean).join(" | "),
    [item.creator, item.createdAt].join("\n"),
    [item.recentOperator, item.recentAt].join("\n"),
    item.editingProgress,
    [getBookFileUploadLabel(item), getAnswerRegionProgressLabel(item)].join("\n"),
    item.shelfStatus ? "上架" : "下架",
    item.autoGradingEnabled ? "开启" : "关闭"
  ]);
  const csv = [header, ...content]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "教辅列表导出.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function render() {
  syncSelectPlaceholderStates();
  syncFilterClearButtons();
  updateFilterCollapseState();
  closeNameEditor();
  state.selectedIds = state.selectedIds.filter((id) => {
    const targetBook = BOOKS.find((book) => book.id === id);
    return !!targetBook && isBookSelectable(targetBook);
  });

  const filtered = getFilteredBooks();
  const totalPages = getTotalPages(filtered.length, state.pageSize);
  state.currentPage = Math.min(state.currentPage, totalPages);

  const pageStart = (state.currentPage - 1) * state.pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + state.pageSize);

  renderTable(pageRows, pageStart);
  renderMobileCards(pageRows, pageStart);
  renderPagination(filtered.length, totalPages);
  renderSelectAllState(pageRows);
  renderSelectionToolbar();
  syncTableHeaderScroll();
  requestAnimationFrame(() => {
    syncTableHeaderScroll();
  });
  window.setTimeout(() => {
    syncTableHeaderScroll();
  }, 80);
}

function showToast(message, type = "success", duration = 3000) {
  if (!(elements.toastHost instanceof HTMLElement) || !message) {
    return;
  }

  if (typeof type === "number") {
    duration = type;
    type = "warning";
  }

  const normalizedType = ["success", "error", "warning"].includes(type) ? type : "warning";
  const icons = {
    success: "✓",
    error: "×",
    warning: "!"
  };
  const normalizedMessage = String(message).trim().replace(/[。！？!?\.]+$/u, "") + "！";

  const toast = document.createElement("div");
  toast.className = `toast is-${normalizedType}`;
  toast.setAttribute("role", normalizedType === "error" ? "alert" : "status");
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[normalizedType]}</span><span class="toast-message">${escapeHtml(normalizedMessage)}</span>`;
  elements.toastHost.appendChild(toast);

  while (elements.toastHost.children.length > 3) {
    elements.toastHost.firstElementChild?.remove();
  }

  window.requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, duration);
}

function renderSelectionToolbar() {
  const count = state.selectedIds.length;
  elements.selectedCount.textContent = String(count);
  elements.selectionToolbar.classList.toggle("is-idle", count === 0);
  elements.selectionToolbar.setAttribute("aria-hidden", count === 0 ? "true" : "false");
}

function syncSelectPlaceholderStates() {
  elements.filterSelects.forEach((select) => {
    select.dataset.empty = select.value ? "false" : "true";
  });

  document.querySelectorAll("#basic-info-form .field-select").forEach((select) => {
    if (select instanceof HTMLSelectElement) {
      select.dataset.empty = select.value ? "false" : "true";
    }
  });
}

function createModalPlaceholderOption(label, selected = false, hidden = true) {
  return `<option value="" disabled${hidden ? " hidden" : ""}${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function getDefaultModalTagSubject(stage) {
  return "";
}

function createDefaultModalTagGroup(stage = state.modalTagStage) {
  return {
    id: `tag-group-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    subject: getDefaultModalTagSubject(stage),
    versions: [],
    gradeVolumes: []
  };
}

function getModalTagSubjectOptions(stage) {
  return TAG_SUBJECT_OPTIONS[stage] || [];
}

function getModalTagVersionOptions(stage, subject) {
  return TAG_VERSION_OPTIONS[stage]?.[subject] || [];
}

function getModalTagGradeVolumeOptions(stage) {
  return TAG_GRADE_VOLUME_OPTIONS[stage] || [];
}

function getModalTagGradeVolumeMap(stage) {
  return getModalTagGradeVolumeOptions(stage).reduce((result, label) => {
    const parsed = parseGradeVolumeLabel(label);
    if (!parsed.gradeLabel) {
      return result;
    }

    if (!result[parsed.gradeLabel]) {
      result[parsed.gradeLabel] = [];
    }

    if (parsed.volume) {
      result[parsed.gradeLabel].push(parsed.volume);
    }
    return result;
  }, {});
}

function normalizeTagGroup(group = {}) {
  const versions = Array.isArray(group.versions)
    ? group.versions.filter(Boolean)
    : (group.version ? [group.version] : []);
  const gradeVolumes = Array.isArray(group.gradeVolumes)
    ? group.gradeVolumes.filter(Boolean)
    : (group.gradeVolume ? [group.gradeVolume] : [formatGradeVolumeLabel(group.gradeLabel || "", group.volume || "")].filter(Boolean));

  return {
    id: group.id || createDefaultModalTagGroup().id,
    subject: group.subject || "",
    versions,
    gradeVolumes
  };
}

function buildBookTagGroups(book) {
  if (Array.isArray(book?.tagGroups) && book.tagGroups.length) {
    return book.tagGroups.map((group) => normalizeTagGroup(group));
  }

  return [normalizeTagGroup({ subject: book?.subject || "", version: book?.version || "", gradeLabel: book?.gradeLabel || "", volume: book?.volume || "" })];
}

function formatGradeVolumeLabel(gradeLabel, volume) {
  if (!gradeLabel && !volume) {
    return "";
  }

  return [gradeLabel, volume].filter(Boolean).join("/");
}

function parseGradeVolumeLabel(label) {
  if (!label) {
    return { gradeLabel: "", volume: "" };
  }

  const parts = label.split("/");
  return {
    gradeLabel: parts[0] || "",
    volume: parts.slice(1).join("/") || ""
  };
}

function getSelectMultipleValues(select) {
  if (!(select instanceof HTMLSelectElement)) {
    return [];
  }

  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function getTagDropdownSelectionMarkup(values, placeholder) {
  if (!values.length) {
    return `<span class="tag-dropdown-placeholder">${escapeHtml(placeholder)}</span>`;
  }

  return values.map((value) => `<span class="tag-dropdown-token">${escapeHtml(value)}</span>`).join("");
}

function getTagDropdownSearchQuery(groupId, type) {
  if (state.activeTagDropdown.groupId === groupId && state.activeTagDropdown.type === type) {
    return state.activeTagDropdown.query || "";
  }

  return "";
}

function getGradeVolumeDisplayItems(values, stage) {
  const gradeMap = getModalTagGradeVolumeMap(stage);
  const selected = new Set(values);
  const items = [];

  Object.entries(gradeMap).forEach(([grade, volumes]) => {
    const fullValues = volumes.map((volume) => `${grade}/${volume}`);
    const selectedValues = fullValues.filter((value) => selected.has(value));
    if (!selectedValues.length) {
      return;
    }

    if (selectedValues.length === fullValues.length) {
      items.push({ label: grade, value: grade, kind: "grade" });
      selectedValues.forEach((value) => selected.delete(value));
      return;
    }

    selectedValues.forEach((value) => {
      items.push({ label: value, value, kind: "gradeVolume" });
      selected.delete(value);
    });
  });

  selected.forEach((value) => {
    items.push({ label: value, value, kind: "gradeVolume" });
  });

  return items;
}

function getTagDropdownTokenMarkup(groupId, field, item) {
  return `<span class="tag-dropdown-token">${escapeHtml(item.label)}<span class="tag-dropdown-token-remove" data-tag-token-remove="${escapeHtml(field)}" data-tag-token-kind="${escapeHtml(item.kind || field)}" data-tag-token-value="${escapeHtml(item.value)}" data-tag-group-id="${escapeHtml(groupId)}">×</span></span>`;
}

function getVersionSelectionMarkup(groupId, values, placeholder) {
  if (!values.length) {
    return `<span class="tag-dropdown-placeholder">${escapeHtml(placeholder)}</span>`;
  }

  return values.map((value) => getTagDropdownTokenMarkup(groupId, "versions", { label: value, value, kind: "versions" })).join("");
}

function getGradeVolumeSelectionMarkup(groupId, values, stage, placeholder) {
  const items = getGradeVolumeDisplayItems(values, stage);
  if (!items.length) {
    return `<span class="tag-dropdown-placeholder">${escapeHtml(placeholder)}</span>`;
  }

  return items.map((item) => getTagDropdownTokenMarkup(groupId, "gradeVolumes", item)).join("");
}

function getActiveCascadeGrade(group) {
  const gradeMap = getModalTagGradeVolumeMap(state.modalTagStage);
  const grades = Object.keys(gradeMap);
  if (!grades.length) {
    return "";
  }

  if (state.activeTagDropdown.groupId === group.id && state.activeTagDropdown.type === "gradeVolumes" && gradeMap[state.activeTagDropdown.cascadeGrade]) {
    return state.activeTagDropdown.cascadeGrade;
  }

  const selectedGrade = group.gradeVolumes.map((value) => parseGradeVolumeLabel(value).gradeLabel).find((grade) => gradeMap[grade]);
  return selectedGrade || grades[0];
}

function renderModalTagGroups() {
  if (!(elements.modalTagGroups instanceof HTMLElement)) {
    return;
  }

  elements.modalTagGroups.innerHTML = state.modalTagGroups
    .map((group, index) => {
      const subjectOptions = getModalTagSubjectOptions(state.modalTagStage);
      const selectedSubject = subjectOptions.includes(group.subject) ? group.subject : "";
      const versionQuery = getTagDropdownSearchQuery(group.id, "versions").trim().toLowerCase();
      const allVersionOptions = getModalTagVersionOptions(state.modalTagStage, selectedSubject);
      const versionOptions = allVersionOptions
        .filter((value) => !versionQuery || value.toLowerCase().includes(versionQuery));
      const gradeVolumeMap = getModalTagGradeVolumeMap(state.modalTagStage);
      const cascadeGrades = Object.keys(gradeVolumeMap);
      const activeCascadeGrade = getActiveCascadeGrade(group);
      const visibleCascadeGrade = cascadeGrades.includes(activeCascadeGrade) ? activeCascadeGrade : (cascadeGrades[0] || "");
      const activeVolumes = gradeVolumeMap[visibleCascadeGrade] || [];
      const canOpenVersions = Boolean(state.modalTagStage && selectedSubject && allVersionOptions.length);
      const canOpenGradeVolumes = Boolean(state.modalTagStage && Object.keys(gradeVolumeMap).length);
      const isVersionOpen = canOpenVersions && state.activeTagDropdown.groupId === group.id && state.activeTagDropdown.type === "versions";
      const isGradeOpen = canOpenGradeVolumes && state.activeTagDropdown.groupId === group.id && state.activeTagDropdown.type === "gradeVolumes";
      const addButton = index === 0
        ? '<button id="modal-tag-group-add" class="basic-tag-action-button basic-tag-add-button" type="button" aria-label="新增图书标签组"><span aria-hidden="true">+</span></button>'
        : "";
      const removeButton = state.modalTagGroups.length > 1
        ? `<button class="basic-tag-action-button basic-tag-remove-button" type="button" data-tag-group-remove="${escapeHtml(group.id)}" aria-label="删除标签组"><span aria-hidden="true">-</span></button>`
        : "";

      return `
        <div class="basic-tag-group" data-tag-group-id="${escapeHtml(group.id)}">
          <div class="basic-tag-group-card">
            <div class="basic-tag-group-row">
              <label class="basic-field basic-field-inline">
                <span><span class="field-required">*</span>学科</span>
                <select class="field-control field-select" data-tag-group-field="subject" data-tag-group-id="${escapeHtml(group.id)}">
                  ${createModalPlaceholderOption("请选择学科", !selectedSubject, false)}
                  ${subjectOptions.map((value) => `<option value="${escapeHtml(value)}"${value === selectedSubject ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}
                </select>
              </label>
            </div>
            <div class="basic-tag-group-grid">
              <label class="basic-field basic-field-inline">
                <span><span class="field-required">*</span>教材版本</span>
                <div class="tag-dropdown tag-dropdown-multi${isVersionOpen ? " is-open" : ""}${canOpenVersions ? "" : " is-disabled"}" data-tag-dropdown="versions" data-tag-group-id="${escapeHtml(group.id)}">
                  <button class="tag-dropdown-trigger" type="button" data-tag-dropdown-trigger="versions" data-tag-group-id="${escapeHtml(group.id)}" aria-expanded="${isVersionOpen ? "true" : "false"}" ${canOpenVersions ? "" : "disabled"}>
                    <span class="tag-dropdown-values${group.versions.length ? " has-value" : ""}">${getVersionSelectionMarkup(group.id, group.versions, selectedSubject ? "请选择教材版本" : "请先选择学科")}</span>
                    <span class="tag-dropdown-arrow" aria-hidden="true"></span>
                  </button>
                  <div class="tag-dropdown-panel tag-dropdown-panel-multi"${isVersionOpen ? "" : " hidden"}>
                    <div class="tag-dropdown-search-row"><input class="tag-dropdown-search-input" type="text" value="${escapeHtml(getTagDropdownSearchQuery(group.id, "versions"))}" placeholder="搜索教材版本" data-tag-search="versions" data-tag-group-id="${escapeHtml(group.id)}" /></div>
                    <div class="tag-dropdown-option-list">
                      ${versionOptions.length
                        ? versionOptions.map((value) => `<button class="tag-dropdown-option${group.versions.includes(value) ? " is-selected" : ""}" type="button" data-tag-option-toggle="versions" data-tag-option-value="${escapeHtml(value)}" data-tag-group-id="${escapeHtml(group.id)}"><span class="tag-dropdown-option-label">${escapeHtml(value)}</span><span class="tag-dropdown-option-check" aria-hidden="true">✓</span></button>`).join("")
                        : '<div class="tag-dropdown-empty">暂无可选教材版本</div>'}
                    </div>
                  </div>
                </div>
              </label>
              <label class="basic-field basic-field-inline">
                <span><span class="field-required">*</span>年级与分册</span>
                <div class="tag-dropdown tag-dropdown-cascade${isGradeOpen ? " is-open" : ""}${canOpenGradeVolumes ? "" : " is-disabled"}" data-tag-dropdown="gradeVolumes" data-tag-group-id="${escapeHtml(group.id)}">
                  <button class="tag-dropdown-trigger" type="button" data-tag-dropdown-trigger="gradeVolumes" data-tag-group-id="${escapeHtml(group.id)}" aria-expanded="${isGradeOpen ? "true" : "false"}" ${canOpenGradeVolumes ? "" : "disabled"}>
                    <span class="tag-dropdown-values${group.gradeVolumes.length ? " has-value" : ""}">${getGradeVolumeSelectionMarkup(group.id, group.gradeVolumes, state.modalTagStage, "请选择年级与分册")}</span>
                    <span class="tag-dropdown-arrow" aria-hidden="true"></span>
                  </button>
                  <div class="tag-dropdown-panel tag-dropdown-panel-cascade"${isGradeOpen ? "" : " hidden"}>
                    <div class="tag-cascade-grades">
                      ${cascadeGrades.map((grade) => {
                        const gradeFullValues = (gradeVolumeMap[grade] || []).map((volume) => `${grade}/${volume}`);
                        const selectedCount = gradeFullValues.filter((value) => group.gradeVolumes.includes(value)).length;
                        const allSelected = gradeFullValues.length > 0 && selectedCount === gradeFullValues.length;
                        const partialSelected = selectedCount > 0 && !allSelected;
                        return `<button class="tag-cascade-grade${grade === visibleCascadeGrade ? " is-active" : ""}" type="button" data-tag-cascade-grade="${escapeHtml(grade)}" data-tag-group-id="${escapeHtml(group.id)}"><span class="tag-cascade-grade-check${allSelected ? " is-selected" : ""}${partialSelected ? " is-indeterminate" : ""}"></span><span class="tag-cascade-grade-label">${escapeHtml(grade)}</span><span class="tag-cascade-grade-arrow">›</span></button>`;
                      }).join("")}
                    </div>
                    <div class="tag-cascade-volumes">
                      ${activeVolumes.length ? activeVolumes.map((volume) => {
                        const fullValue = `${visibleCascadeGrade}/${volume}`;
                        const selected = group.gradeVolumes.includes(fullValue);
                        return `<button class="tag-cascade-volume${selected ? " is-selected" : ""}" type="button" data-tag-option-toggle="gradeVolumes" data-tag-option-value="${escapeHtml(fullValue)}" data-tag-group-id="${escapeHtml(group.id)}"><span class="tag-cascade-volume-check${selected ? " is-selected" : ""}"></span><span class="tag-cascade-volume-label">${escapeHtml(volume.replace("册", ""))}</span></button>`;
                      }).join("") : '<div class="tag-dropdown-empty">暂无可选年级与分册</div>'}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          <div class="basic-tag-group-side">${addButton}${removeButton}</div>
        </div>
      `;
    })
    .join("");

  syncSelectPlaceholderStates();
}

function addModalTagGroup() {
  state.modalTagGroups = [...state.modalTagGroups, createDefaultModalTagGroup(state.modalTagStage)];
  renderModalTagGroups();
}

function closeTagDropdown() {
  if (!state.activeTagDropdown.groupId && !state.activeTagDropdown.type) {
    return;
  }

  state.activeTagDropdown = {
    groupId: "",
    type: "",
    cascadeGrade: "",
    query: ""
  };
  renderModalTagGroups();
}

function openTagDropdown(groupId, type) {
  const group = state.modalTagGroups.find((item) => item.id === groupId);
  if (!group) {
    return;
  }

  if (type === "versions" && (!state.modalTagStage || !group.subject || !getModalTagVersionOptions(state.modalTagStage, group.subject).length)) {
    return;
  }

  if (type === "gradeVolumes" && (!state.modalTagStage || !Object.keys(getModalTagGradeVolumeMap(state.modalTagStage)).length)) {
    return;
  }

  state.activeTagDropdown = {
    groupId,
    type,
    cascadeGrade: type === "gradeVolumes" && group ? getActiveCascadeGrade(group) : "",
    query: ""
  };
  renderModalTagGroups();
}

function removeTagGroupSelection(groupId, field, value, kind = "") {
  state.modalTagGroups = state.modalTagGroups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    if (field === "versions") {
      return {
        ...group,
        versions: group.versions.filter((item) => item !== value)
      };
    }

    if (field === "gradeVolumes") {
      if (kind === "grade") {
        return {
          ...group,
          gradeVolumes: group.gradeVolumes.filter((item) => parseGradeVolumeLabel(item).gradeLabel !== value)
        };
      }

      return {
        ...group,
        gradeVolumes: group.gradeVolumes.filter((item) => item !== value)
      };
    }

    return group;
  });
  renderModalTagGroups();
}

function toggleCascadeGradeSelection(groupId, grade) {
  const gradeOptions = (getModalTagGradeVolumeMap(state.modalTagStage)[grade] || []).map((volume) => `${grade}/${volume}`);
  state.modalTagGroups = state.modalTagGroups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    const hasAll = gradeOptions.length > 0 && gradeOptions.every((value) => group.gradeVolumes.includes(value));
    return {
      ...group,
      gradeVolumes: hasAll
        ? group.gradeVolumes.filter((value) => !gradeOptions.includes(value))
        : Array.from(new Set([...group.gradeVolumes.filter((value) => parseGradeVolumeLabel(value).gradeLabel !== grade), ...gradeOptions]))
    };
  });

  state.activeTagDropdown = {
    ...state.activeTagDropdown,
    groupId,
    type: "gradeVolumes",
    cascadeGrade: grade
  };
  renderModalTagGroups();
}

function toggleTagDropdown(groupId, type) {
  if (state.activeTagDropdown.groupId === groupId && state.activeTagDropdown.type === type) {
    closeTagDropdown();
    return;
  }

  openTagDropdown(groupId, type);
}

function toggleTagGroupOption(groupId, field, value) {
  state.modalTagGroups = state.modalTagGroups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    const list = Array.isArray(group[field]) ? group[field] : [];
    const exists = list.includes(value);
    return {
      ...group,
      [field]: exists ? list.filter((item) => item !== value) : [...list, value]
    };
  });
  renderModalTagGroups();
}

function removeModalTagGroup(groupId) {
  if (state.modalTagGroups.length <= 1) {
    return;
  }

  state.modalTagGroups = state.modalTagGroups.filter((group) => group.id !== groupId);
  if (state.activeTagDropdown.groupId === groupId) {
    state.activeTagDropdown = {
      groupId: "",
      type: "",
      cascadeGrade: "",
      query: ""
    };
  }
  renderModalTagGroups();
}

function handleModalTagStageChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  state.activeTagDropdown = {
    groupId: "",
    type: "",
    cascadeGrade: "",
    query: ""
  };
  state.modalTagStage = target.value;
  const availableSubjects = getModalTagSubjectOptions(state.modalTagStage);
  state.modalTagGroups = state.modalTagGroups.map((group) => ({
    ...group,
    subject: availableSubjects.includes(group.subject)
      ? group.subject
      : (group.subject ? (availableSubjects[0] || "") : ""),
    versions: group.versions.filter((value) => getModalTagVersionOptions(
      state.modalTagStage,
      availableSubjects.includes(group.subject)
        ? group.subject
        : (group.subject ? (availableSubjects[0] || "") : "")
    ).includes(value)),
    gradeVolumes: group.gradeVolumes.filter((value) => getModalTagGradeVolumeOptions(state.modalTagStage).includes(value))
  }));
  renderModalTagGroups();
}

function handleBasicInfoFormClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const addTrigger = target.closest("#modal-tag-group-add");
  if (addTrigger instanceof HTMLButtonElement) {
    event.preventDefault();
    addModalTagGroup();
    return;
  }

  const tokenRemoveTrigger = target.closest("[data-tag-token-remove]");
  if (tokenRemoveTrigger instanceof HTMLElement) {
    event.preventDefault();
    event.stopPropagation();
    removeTagGroupSelection(
      tokenRemoveTrigger.dataset.tagGroupId || "",
      tokenRemoveTrigger.dataset.tagTokenRemove || "",
      tokenRemoveTrigger.dataset.tagTokenValue || "",
      tokenRemoveTrigger.dataset.tagTokenKind || ""
    );
    return;
  }

  const dropdownTrigger = target.closest("[data-tag-dropdown-trigger]");
  if (dropdownTrigger instanceof HTMLButtonElement) {
    event.preventDefault();
    toggleTagDropdown(dropdownTrigger.dataset.tagGroupId || "", dropdownTrigger.dataset.tagDropdownTrigger || "");
    return;
  }

  const cascadeGradeTrigger = target.closest("[data-tag-cascade-grade]");
  if (cascadeGradeTrigger instanceof HTMLButtonElement) {
    event.preventDefault();
    toggleCascadeGradeSelection(cascadeGradeTrigger.dataset.tagGroupId || "", cascadeGradeTrigger.dataset.tagCascadeGrade || "");
    return;
  }

  const optionTrigger = target.closest("[data-tag-option-toggle]");
  if (optionTrigger instanceof HTMLButtonElement) {
    event.preventDefault();
    toggleTagGroupOption(
      optionTrigger.dataset.tagGroupId || "",
      optionTrigger.dataset.tagOptionToggle || "",
      optionTrigger.dataset.tagOptionValue || ""
    );
    return;
  }

  const removeTrigger = target.closest("[data-tag-group-remove]");
  if (removeTrigger instanceof HTMLButtonElement) {
    event.preventDefault();
    removeModalTagGroup(removeTrigger.dataset.tagGroupRemove || "");
  }
}

function handleBasicInfoFormChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const field = target.dataset.tagGroupField;
  const groupId = target.dataset.tagGroupId;
  if (!field || !groupId) {
    syncSelectPlaceholderStates();
    return;
  }

  state.modalTagGroups = state.modalTagGroups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    if (field === "subject") {
      return {
        ...group,
        subject: target.value,
        versions: group.versions.filter((value) => getModalTagVersionOptions(state.modalTagStage, target.value).includes(value))
      };
    }

    if (field === "versions" || field === "gradeVolumes") {
      return {
        ...group,
        [field]: getSelectMultipleValues(target)
      };
    }

    return {
      ...group,
      [field]: target.value
    };
  });

  renderModalTagGroups();
}

function handleBasicInfoFormInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.tagSearch !== "versions") {
    return;
  }

  state.activeTagDropdown = {
    ...state.activeTagDropdown,
    groupId: target.dataset.tagGroupId || "",
    type: target.dataset.tagSearch || "",
    query: target.value,
    cascadeGrade: target.dataset.tagSearch === "gradeVolumes" ? state.activeTagDropdown.cascadeGrade : ""
  };
  renderModalTagGroups();

  const nextInput = elements.basicInfoForm?.querySelector(`[data-tag-search="${state.activeTagDropdown.type}"][data-tag-group-id="${state.activeTagDropdown.groupId}"]`);
  if (nextInput instanceof HTMLInputElement) {
    nextInput.focus();
    const cursor = nextInput.value.length;
    nextInput.setSelectionRange(cursor, cursor);
  }
}

function initializeFilterClearControls() {
  const container = document.querySelector(".filter-controls");
  if (!(container instanceof HTMLElement)) {
    return;
  }

  Array.from(container.children).forEach((child, index) => {
    if (!(child instanceof HTMLElement) || child.classList.contains("filter-control-wrap")) {
      return;
    }

    const isSupported = child.matches(".field-input, .field-select, .date-range-field");
    if (!isSupported) {
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "filter-control-wrap";
    wrap.dataset.filterOrder = String(index);
    if (child.matches(".field-select")) {
      wrap.classList.add("is-select-wrap");
    } else if (child.matches(".date-range-field")) {
      wrap.classList.add("is-date-wrap");
    }
    child.before(wrap);
    wrap.appendChild(child);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-clear-button";
    button.setAttribute("aria-label", "清除当前筛选条件");
    button.setAttribute("data-filter-clear", "true");
    button.textContent = "×";
    wrap.appendChild(button);
  });

  syncFilterClearButtons();
}

function syncFilterClearButtons() {
  document.querySelectorAll(".filter-control-wrap").forEach((wrap) => {
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    const field = wrap.querySelector(".field-input, .field-select, .date-range-field");
    let hasValue = false;

    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      hasValue = Boolean(field.value.trim());
    } else if (field instanceof HTMLElement && field.classList.contains("date-range-field")) {
      const rangeKey = field.dataset.dateRangeTrigger || "";
      const { start, end } = getDateRangeElements(rangeKey);
      hasValue = Boolean(start.value || end.value);
    }

    wrap.classList.toggle("has-value", hasValue);
  });

  if (state.activeSelectClearWrap instanceof HTMLElement && !state.activeSelectClearWrap.classList.contains("has-value")) {
    setActiveSelectClearWrap(null);
  }

  if (state.activeDateClearWrap instanceof HTMLElement && !state.activeDateClearWrap.classList.contains("has-value")) {
    setActiveDateClearWrap(null);
  }
}

function setActiveSelectClearWrap(nextWrap) {
  if (state.activeSelectClearWrap instanceof HTMLElement && state.activeSelectClearWrap !== nextWrap) {
    state.activeSelectClearWrap.classList.remove("is-clear-hot");
  }

  state.activeSelectClearWrap = nextWrap instanceof HTMLElement ? nextWrap : null;

  if (state.activeSelectClearWrap instanceof HTMLElement) {
    state.activeSelectClearWrap.classList.add("is-clear-hot");
  }
}

function setActiveDateClearWrap(nextWrap) {
  if (state.activeDateClearWrap instanceof HTMLElement && state.activeDateClearWrap !== nextWrap) {
    state.activeDateClearWrap.classList.remove("is-date-clear-hot");
  }

  state.activeDateClearWrap = nextWrap instanceof HTMLElement ? nextWrap : null;

  if (state.activeDateClearWrap instanceof HTMLElement) {
    state.activeDateClearWrap.classList.add("is-date-clear-hot");
  }
}

function getFilterControlItems() {
  if (!(elements.filterControls instanceof HTMLElement)) {
    return [];
  }

  return Array.from(elements.filterControls.children).filter((child) => child instanceof HTMLElement);
}

function restoreOverflowFilterItems() {
  if (!(elements.filterControls instanceof HTMLElement) || !(elements.filterControlsOverflow instanceof HTMLElement)) {
    return;
  }

  const primaryItems = Array.from(elements.filterControls.children).filter((child) => child instanceof HTMLElement);
  const overflowItems = Array.from(elements.filterControlsOverflow.children).filter((child) => child instanceof HTMLElement);
  const mergedItems = primaryItems.concat(overflowItems);
  mergedItems
    .sort((left, right) => Number(left.dataset.filterOrder || "0") - Number(right.dataset.filterOrder || "0"))
    .forEach((item) => {
      elements.filterControls.appendChild(item);
    });
}

function updateFilterCollapseState() {
  if (!(elements.filterControls instanceof HTMLElement) || !(elements.filterControlsOverflow instanceof HTMLElement) || !(elements.filterToggleRow instanceof HTMLElement) || !(elements.filterToggleButton instanceof HTMLButtonElement)) {
    return;
  }

  restoreOverflowFilterItems();

  const items = getFilterControlItems();
  items.forEach((item) => {
    item.classList.remove("filter-item-hidden");
    item.dataset.filterOverflow = "false";
  });
  elements.filterControlsOverflow.classList.remove("is-open");
  elements.filterControlsOverflow.hidden = true;

  if (window.innerWidth <= 767 || !items.length) {
    elements.filterToggleRow.hidden = true;
    elements.filterControls.classList.remove("is-collapsed");
    elements.filterControlsOverflow.classList.remove("is-open");
    elements.filterControlsOverflow.hidden = true;
    state.filterOverflowVisible = false;
    elements.filterToggleButton.setAttribute("aria-expanded", "false");
    elements.filterToggleButton.textContent = "展开筛选";
    return;
  }

  const firstRowTop = items[0].offsetTop;
  let hasOverflowRows = false;
  items.forEach((item) => {
    if (item.offsetTop > firstRowTop + 1) {
      hasOverflowRows = true;
      item.dataset.filterOverflow = "true";
    }
  });

  elements.filterToggleRow.hidden = !hasOverflowRows;
  if (!hasOverflowRows) {
    state.filterExpanded = false;
    state.filterOverflowVisible = false;
  }
  applyFilterCollapseState();
}

function applyFilterCollapseState() {
  if (!(elements.filterControls instanceof HTMLElement) || !(elements.filterControlsOverflow instanceof HTMLElement) || !(elements.filterToggleRow instanceof HTMLElement) || !(elements.filterToggleButton instanceof HTMLButtonElement)) {
    return;
  }

  const shouldExpand = !elements.filterToggleRow.hidden && state.filterExpanded;
  elements.filterToggleButton.setAttribute("aria-expanded", shouldExpand ? "true" : "false");
  elements.filterToggleButton.textContent = shouldExpand ? "收起筛选" : "展开筛选";

  restoreOverflowFilterItems();
  const items = getFilterControlItems();
  const overflowItems = items.filter((item) => item.dataset.filterOverflow === "true");
  const shouldShowOverflow = shouldExpand && overflowItems.length > 0;
  const shouldAnimateOpen = shouldShowOverflow && !state.filterOverflowVisible;

  elements.filterControls.classList.toggle("is-collapsed", !shouldExpand);
  elements.filterControlsOverflow.classList.remove("is-open");
  elements.filterControlsOverflow.hidden = overflowItems.length === 0;

  overflowItems.forEach((item) => {
    elements.filterControlsOverflow.appendChild(item);
  });

  if (shouldShowOverflow) {
    elements.filterControlsOverflow.hidden = false;
    if (shouldAnimateOpen) {
      window.requestAnimationFrame(() => {
        elements.filterControlsOverflow.classList.add("is-open");
      });
    } else {
      elements.filterControlsOverflow.classList.add("is-open");
    }
  }

  state.filterOverflowVisible = shouldShowOverflow;
}

function clearFilterControl(trigger) {
  const wrap = trigger.closest(".filter-control-wrap");
  if (!(wrap instanceof HTMLElement)) {
    return;
  }

  const field = wrap.querySelector(".field-input, .field-select, .date-range-field");
  if (field instanceof HTMLInputElement) {
    field.value = "";
  } else if (field instanceof HTMLSelectElement) {
    field.value = "";
    if (field === elements.stageFilter) {
      syncGradeFilterOptions();
      elements.gradeFilter.value = "";
    }
  } else if (field instanceof HTMLElement && field.classList.contains("date-range-field")) {
    const rangeKey = field.dataset.dateRangeTrigger || "";
    const { start, end } = getDateRangeElements(rangeKey);
    start.value = "";
    end.value = "";
  }

  closeDatePicker();
  syncSelectPlaceholderStates();
  syncFilterClearButtons();
  updateFiltersFromForm();
  state.currentPage = 1;
}

function renderTable(rows, pageStart) {
  lastAppliedTableLayoutSignature = "";
  elements.tablePanel?.classList.toggle("is-empty", rows.length === 0);

  if (!rows.length) {
    elements.tableBody.innerHTML = '<tr class="table-empty-row"><td colspan="15" class="empty-state table-empty-cell">暂无符合条件的教辅数据</td></tr>';
    return;
  }

  elements.tableBody.innerHTML = rows
    .map((book, index) => {
      const actions = createRowActions(book);
      const checked = isBookSelected(book.id) ? "checked" : "";
      const disabled = isBookSelectable(book) ? "" : "disabled";
      return `
        <tr>
          <td class="checkbox-cell sticky-left sticky-left-0"><input class="table-checkbox" type="checkbox" data-row-checkbox data-book-id="${escapeHtml(book.id)}" ${checked} ${disabled} aria-label="选择${escapeHtml(book.name)}" /></td>
          <td class="sticky-left sticky-left-1">${escapeHtml(book.code)}</td>
          <td class="cover-cell sticky-left sticky-left-2">${createCoverCell(book)}</td>
          <td class="align-left name-cell sticky-left sticky-left-3">${createNameCell(book)}</td>
          <td>${createCategoryBadge(book.category)}</td>
          <td>${createBookType(book.bookType)}</td>
          <td class="align-left">${createBookTagInfo(book)}</td>
          <td class="align-left">${createSeriesInfo(book)}</td>
          <td>${createOperatorTimeCell(book.creator, book.createdAt)}</td>
          <td>${createOperatorTimeCell(book.recentOperator, book.recentAt)}</td>
          <td>${escapeHtml(book.editingProgress)}</td>
          <td>${createAnswerRegionStatusCell(book)}</td>
          <td>${createShelfStatus(book)}</td>
          <td>${createAutoGradingStatus(book)}</td>
          <td class="action-cell">${actions}</td>
        </tr>
      `;
    })
    .join("");
}

function renderMobileCards(rows, pageStart) {
  if (!rows.length) {
    elements.mobileCardList.innerHTML = '<div class="empty-state">暂无符合条件的教辅数据</div>';
    return;
  }

  elements.mobileCardList.innerHTML = rows
    .map((book, index) => {
      const checked = isBookSelected(book.id) ? "checked" : "";
      const disabled = isBookSelectable(book) ? "" : "disabled";
      return `
        <article class="mobile-card">
          <div class="mobile-card-top">
            <div>
              <label class="mobile-card-select">
                <input class="table-checkbox" type="checkbox" data-row-checkbox data-book-id="${escapeHtml(book.id)}" ${checked} ${disabled} aria-label="选择${escapeHtml(book.name)}" />
                <span>已选</span>
              </label>
              <div class="mobile-code">${escapeHtml(book.code)}</div>
              <div class="mobile-card-title-row"><h2 class="mobile-card-title">${escapeHtml(book.name)}</h2><button class="name-edit-trigger" type="button" data-name-edit="true" data-book-id="${escapeHtml(book.id)}" aria-label="编辑${escapeHtml(book.name)}名称">✍</button></div>
            </div>
            ${createShelfStatus(book)}
          </div>
          <div class="mobile-cover">${createCoverCell(book)}</div>
          <div class="mobile-grid">
            ${createMobileField("分类", createCategoryBadge(book.category))}
            ${createMobileField("类型", createBookType(book.bookType))}
            ${createMobileField("图书标签", createBookTagInfo(book))}
            ${createMobileField("套系信息", createSeriesInfo(book))}
            ${createMobileField("创建人与时间", createOperatorTimeCell(book.creator, book.createdAt))}
            ${createMobileField("最近操作人与时间", createOperatorTimeCell(book.recentOperator, book.recentAt))}
            ${createMobileField("精编进度", book.editingProgress)}
            ${createMobileField("作答区完成情况", createAnswerRegionStatusCell(book))}
            ${createMobileField("书版自动批改状态", createAutoGradingStatus(book))}
          </div>
          <div class="mobile-card-actions">
            ${createRowActions(book)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPagination(total, totalPages) {
  elements.paginationTotal.textContent = `共${total}条`;
  elements.prevPage.disabled = state.currentPage <= 1;
  elements.nextPage.disabled = state.currentPage >= totalPages;
  if (elements.pageList instanceof HTMLElement) {
    elements.pageList.innerHTML = createPaginationMarkup(Math.max(totalPages, 1), state.currentPage);
  }
  if (elements.pageJumpInput instanceof HTMLInputElement) {
    elements.pageJumpInput.value = String(state.currentPage);
    elements.pageJumpInput.max = String(Math.max(totalPages, 1));
  }
}

function createPaginationMarkup(totalPages, currentPage) {
  const pages = getVisiblePages(totalPages, currentPage);
  return pages
    .map((page) => {
      if (page === "...") {
        return '<span class="page-number is-ellipsis">...</span>';
      }

      const activeClass = page === currentPage ? " is-current" : "";
      return `<button class="page-number${activeClass}" type="button" data-page-number="${page}" aria-label="跳转到第${page}页" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
    })
    .join("");
}

function getVisiblePages(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function renderSelectAllState(rows) {
  const selectableRows = rows.filter((book) => isBookSelectable(book));

  if (elements.selectAll instanceof HTMLInputElement) {
    elements.selectAll.disabled = selectableRows.length === 0;
  }

  if (!selectableRows.length) {
    elements.selectAll.checked = false;
    elements.selectAll.indeterminate = false;
    return;
  }

  const selectedCount = selectableRows.filter((book) => isBookSelected(book.id)).length;
  elements.selectAll.checked = selectedCount === selectableRows.length;
  elements.selectAll.indeterminate = selectedCount > 0 && selectedCount < selectableRows.length;
}

function handleSelectAllChange() {
  const filtered = getFilteredBooks();
  const pageStart = (state.currentPage - 1) * state.pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + state.pageSize).filter((book) => isBookSelectable(book));

  if (elements.selectAll.checked) {
    const merged = new Set(state.selectedIds);
    pageRows.forEach((book) => merged.add(book.id));
    state.selectedIds = Array.from(merged);
  } else {
    const pageIds = new Set(pageRows.map((book) => book.id));
    state.selectedIds = state.selectedIds.filter((id) => !pageIds.has(id));
  }

  render();
}

function toggleSelection(bookId, checked) {
  if (!bookId) {
    return;
  }

  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook || !isBookSelectable(targetBook)) {
    return;
  }

  if (checked) {
    if (!state.selectedIds.includes(bookId)) {
      state.selectedIds = [...state.selectedIds, bookId];
    }
  } else {
    state.selectedIds = state.selectedIds.filter((id) => id !== bookId);
  }

  render();
}

function isBookSelected(bookId) {
  return state.selectedIds.includes(bookId);
}

function isSelfOwnedBook(book) {
  return book?.bookType === "自有教辅";
}

function isBookSelectable(book) {
  return !isSelfOwnedBook(book);
}

function getBookProgressByType(bookType, fallbackProgress = "") {
  if (bookType === "自有教辅") {
    return "0/0";
  }

  if (fallbackProgress && fallbackProgress !== "0/0") {
    return fallbackProgress;
  }

  return "0/24";
}

function createDuplicateBook(sourceBook) {
  const nextIndex = BOOKS.length + 1;
  const now = formatNow();
  return {
    ...sourceBook,
    id: `book-${Date.now()}`,
    code: `jf${String(100000 + nextIndex).slice(-6)}`,
    name: `【副本】${sourceBook.name}`,
    subCode: `26-016004-${String(nextIndex).padStart(3, "0")}`,
    customCode: `26-016004-${String(nextIndex).padStart(3, "0")}`,
    category: "成书",
    bookType: "数字教辅",
    editingProgress: getBookProgressByType("数字教辅", sourceBook.editingProgress),
    hasUploadedBookFile: false,
    answerRegionCompleted: 0,
    answerRegionTotal: sourceBook.answerRegionTotal || 600,
    autoGradingEnabled: false,
    shelfStatus: false,
    creator: "当前用户",
    createdAt: now,
    recentOperator: "当前用户",
    recentAt: now
  };
}

function getFilteredBooks() {
  const keywordFilter = (value, keyword) => value.toLowerCase().includes(keyword.toLowerCase());
  const dateInRange = (value, start, end) => {
    if (!value) {
      return !start && !end;
    }
    const day = value.slice(0, 10);
    if (start && day < start) {
      return false;
    }
    if (end && day > end) {
      return false;
    }
    return true;
  };

  return BOOKS.filter((book) => {
    const matchesShelf = !state.filters.shelfStatus || (book.shelfStatus ? "上架" : "下架") === state.filters.shelfStatus;
    const matchesAutoGrading = !state.filters.autoGradingStatus || (book.autoGradingEnabled ? "开启" : "关闭") === state.filters.autoGradingStatus;
    const matchesType = !state.filters.bookType || book.bookType === state.filters.bookType;
    const matchesCategory = !state.filters.category || book.category === state.filters.category;
    const matchesSubject = !state.filters.subject || book.subject === state.filters.subject;
    const matchesStage = !state.filters.stage || book.stage === state.filters.stage;
    const matchesGrade = !state.filters.grade || String(book.grade || "").startsWith(state.filters.grade);
    const matchesCustom = !state.filters.customCode || keywordFilter(book.customCode, state.filters.customCode);
    const matchesCode = !state.filters.code || keywordFilter(book.code, state.filters.code);
    const matchesName = !state.filters.name || keywordFilter(book.name, state.filters.name);
    const matchesCreator = !state.filters.creator || keywordFilter(book.creator, state.filters.creator);
    const matchesCreatedTime = dateInRange(book.createdAt, state.filters.createdStart, state.filters.createdEnd);
    const matchesRecentOperator = !state.filters.recentOperator || keywordFilter(book.recentOperator, state.filters.recentOperator);
    const matchesRecentTime = dateInRange(book.recentAt, state.filters.recentStart, state.filters.recentEnd);

    return matchesShelf && matchesAutoGrading && matchesType && matchesCategory && matchesSubject && matchesStage && matchesGrade && matchesCustom && matchesCode && matchesName && matchesCreator && matchesCreatedTime && matchesRecentOperator && matchesRecentTime;
  });
}

function createCoverCell(book) {
  if (!book.coverUrl) {
    return '<div class="book-cover"><div class="book-cover-placeholder">暂无\n封面</div></div>';
  }
  return `<button class="cover-preview-trigger" type="button" data-preview-image="${escapeHtml(book.coverUrl)}" data-preview-title="${escapeHtml(book.name)}封面预览"><div class="book-cover"><img src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.name)}封面" /></div></button>`;
}

function createNameCell(book) {
  const subCodeMarkup = book.bookType === "数字教辅" ? "" : `<span class="name-meta">${escapeHtml(book.subCode)}</span>`;
  return `<div class="name-cell-wrap"><button class="name-link" type="button" data-open-book-view="true" data-book-id="${escapeHtml(book.id)}" aria-label="查看${escapeHtml(book.name)}">${escapeHtml(book.name)}</button><button class="name-edit-trigger" type="button" data-name-edit="true" data-book-id="${escapeHtml(book.id)}" aria-label="编辑${escapeHtml(book.name)}名称">✍</button></div>${subCodeMarkup}`;
}

function getBookEditorUrl(book, mode = "edit") {
  const nextUrl = new URL("../图书编辑页面/index.html", window.location.href);
  nextUrl.searchParams.set("bookId", book.id);
  nextUrl.searchParams.set("bookName", book.name);
  nextUrl.searchParams.set("mode", mode === "view" ? "view" : "edit");
  return nextUrl.toString();
}

function openBookEditorPage(bookId, mode = "edit") {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook) {
    return;
  }

  window.location.assign(getBookEditorUrl(targetBook, mode));
}

function createBookType(value) {
  const toneClass = value === "数字教辅" ? "is-digital" : "is-self";
  return `<span class="book-type-badge ${toneClass}">${escapeHtml(value)}</span>`;
}

function createCategoryBadge(value) {
  const toneClass = value === "活页" ? "is-leaf" : "is-book";
  return `<span class="category-badge ${toneClass}">${escapeHtml(value)}</span>`;
}

function createBookTagInfo(book) {
  const tagGroups = buildBookTagGroups(book);
  return `<div class="info-stack is-accent">${tagGroups.map((group) => `<span>${escapeHtml([book?.stage ? `${book.stage}${group.subject || ""}` : group.subject || "-", group.versions.join("、") || "-", group.gradeVolumes.join("、") || "-"].join(" / "))}</span>`).join("")}</div>`;
}

function createSeriesInfo(book) {
  return `
    <div class="info-stack is-series">
      <span class="series-year">${escapeHtml(book.seriesYear || "-")}</span>
      <span class="series-name">${escapeHtml(book.seriesName || "-")}</span>
      <span class="series-region">${escapeHtml(book.seriesRegion || "-")}</span>
    </div>
  `;
}

function createOperatorTimeCell(operator, time) {
  return `
    <div class="info-stack is-meta">
      <span class="meta-primary">${escapeHtml(operator || "-")}</span>
      <span class="meta-secondary">${escapeHtml(time || "-")}</span>
    </div>
  `;
}

function getBookFileUploadLabel(book) {
  return book?.hasUploadedBookFile ? "文件已设置" : "文件未设置";
}

function getAnswerRegionProgressLabel(book) {
  if (!book?.hasUploadedBookFile) {
    return "---";
  }

  return `${Number(book.answerRegionCompleted || 0)}/${Number(book.answerRegionTotal || 0)}`;
}

function createAnswerRegionStatusCell(book) {
  const uploadLabel = getBookFileUploadLabel(book);
  const progressLabel = getAnswerRegionProgressLabel(book);
  const uploadClass = book?.hasUploadedBookFile ? "is-uploaded" : "is-pending";
  return `
    <div class="info-stack is-answer-region">
      <span class="answer-upload-status ${uploadClass}">${escapeHtml(uploadLabel)}</span>
      <span class="answer-progress">${escapeHtml(progressLabel)}</span>
    </div>
  `;
}

function createShelfStatus(book) {
  const disabled = isSelfOwnedBook(book) ? "disabled" : "";
  return `<button class="shelf-switch ${book.shelfStatus ? "is-on" : ""}" type="button" data-shelf-toggle="true" data-book-id="${escapeHtml(book.id)}" ${disabled} aria-label="${book.shelfStatus ? "下架" : "上架"}" aria-pressed="${book.shelfStatus ? "true" : "false"}"></button>`;
}

function isAnswerRegionCompleted(book) {
  if (!book?.hasUploadedBookFile) {
    return false;
  }

  const total = Number(book.answerRegionTotal || 0);
  const completed = Number(book.answerRegionCompleted || 0);
  return total > 0 && completed >= total;
}

function canToggleAutoGrading(book) {
  return isAnswerRegionCompleted(book);
}

function createAutoGradingStatus(book) {
  const enabled = canToggleAutoGrading(book);
  return `<button class="shelf-switch auto-grading-switch ${book.autoGradingEnabled ? "is-on" : ""}" type="button" data-auto-grading-toggle="true" data-book-id="${escapeHtml(book.id)}" ${enabled ? "" : "disabled"} aria-label="${book.autoGradingEnabled ? "关闭书版自动批改" : "开启书版自动批改"}" aria-pressed="${book.autoGradingEnabled ? "true" : "false"}"></button>`;
}

function toggleAutoGrading(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook || !canToggleAutoGrading(targetBook)) {
    return;
  }

  targetBook.autoGradingEnabled = !targetBook.autoGradingEnabled;
  targetBook.recentOperator = "当前用户";
  targetBook.recentAt = formatNow();
  render();
}

function createMobileField(label, value) {
  return `
    <div class="mobile-field">
      <div class="mobile-field-label">${escapeHtml(label)}</div>
      <div class="mobile-field-value">${value}</div>
    </div>
  `;
}

function createRowActions(book) {
  const deleteAction = book.bookType === "数字教辅"
    ? `<button class="action-menu-item is-danger" type="button" role="menuitem" data-menu-action="delete" data-book-id="${escapeHtml(book.id)}">删除</button>`
    : "";
  return `<div class="row-actions"><button class="action-link" type="button" data-basic-edit="true" data-book-id="${escapeHtml(book.id)}">编辑</button><div class="action-menu-wrap"><button class="action-link action-link-more" type="button" data-action-menu-trigger="true" data-book-id="${escapeHtml(book.id)}" aria-haspopup="menu" aria-expanded="false">更多</button><div class="action-menu" data-action-menu="true" hidden role="menu" aria-label="更多操作菜单"><button class="action-menu-item" type="button" role="menuitem" data-menu-action="basic" data-book-id="${escapeHtml(book.id)}">基本信息</button><button class="action-menu-item" type="button" role="menuitem" data-menu-action="homework-qr" data-book-id="${escapeHtml(book.id)}">下载校本作业码</button><button class="action-menu-item" type="button" role="menuitem" data-menu-action="book-pdf" data-book-id="${escapeHtml(book.id)}">设置图书PDF</button><button class="action-menu-item" type="button" role="menuitem" data-menu-action="logs" data-book-id="${escapeHtml(book.id)}">操作日志</button><button class="action-menu-item" type="button" role="menuitem" data-menu-action="duplicate" data-book-id="${escapeHtml(book.id)}">创建副本</button>${deleteAction}</div></div></div>`;
}

function getBookPdfSetupUrl(book) {
  const targetUrl = new URL("../图书PDF设置/index.html", window.location.href);
  targetUrl.searchParams.set("from", "book-list");
  targetUrl.searchParams.set("bookId", book.id);
  targetUrl.searchParams.set("bookName", book.name);
  targetUrl.searchParams.set("hideContinueAutoSplit", "1");
  return targetUrl.toString();
}

function openBookPdfSetupPage(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook) {
    return;
  }

  saveCurrentListViewState();
  window.location.assign(getBookPdfSetupUrl(targetBook));
}

function openResetBookFileStatusConfirm(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook) {
    return;
  }

  state.pendingConfirmAction = {
    type: "reset-book-file-status",
    bookId
  };
  elements.confirmMessage.textContent = "当前图书PDF已设置。若还要继续设置，则需要先还原[文件状态]，确认现在要还原[文件状态]吗？";
  resetModalDialogPosition(elements.confirmModal, ".confirm-dialog");
  elements.confirmModal.hidden = false;
  elements.confirmModal.setAttribute("aria-hidden", "false");
}

function toggleActionMenu(trigger) {
  if (!(trigger instanceof HTMLButtonElement)) {
    return;
  }

  const wrap = trigger.closest(".action-menu-wrap");
  const menu = wrap ? wrap.querySelector("[data-action-menu]") : null;
  const container = trigger.closest(".action-cell, .mobile-card-actions");
  if (!(menu instanceof HTMLElement)) {
    return;
  }

  const shouldOpen = menu.hidden;
  closeActionMenu();
  menu.hidden = !shouldOpen;
  trigger.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    wrap?.classList.add("is-open");
    container?.classList.add("is-menu-open");
    positionActionMenu(trigger, menu);
  }
}

function positionActionMenu(trigger, menu) {
  if (!(trigger instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const previousHidden = menu.hidden;
  if (previousHidden) {
    menu.hidden = false;
  }

  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gap = 8;

  let left = triggerRect.right - menuRect.width;
  let top = triggerRect.bottom + gap;

  if (left + menuRect.width > viewportWidth - gap) {
    left = viewportWidth - menuRect.width - gap;
  }
  if (left < gap) {
    left = gap;
  }

  if (top + menuRect.height > viewportHeight - gap) {
    top = triggerRect.top - menuRect.height - gap;
  }
  if (top < gap) {
    top = gap;
  }

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;

  if (previousHidden) {
    menu.hidden = true;
  }
}

function updateOpenActionMenuPosition() {
  document.querySelectorAll(".action-menu-wrap.is-open").forEach((wrap) => {
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    const trigger = wrap.querySelector("[data-action-menu-trigger]");
    const menu = wrap.querySelector("[data-action-menu]");
    if (trigger instanceof HTMLElement && menu instanceof HTMLElement && !menu.hidden) {
      positionActionMenu(trigger, menu);
    }
  });
}

function closeActionMenu() {
  document.querySelectorAll("[data-action-menu]").forEach((menu) => {
    if (menu instanceof HTMLElement) {
      menu.hidden = true;
      menu.style.left = "0px";
      menu.style.top = "0px";
    }
  });
  document.querySelectorAll("[data-action-menu-trigger]").forEach((trigger) => {
    if (trigger instanceof HTMLElement) {
      trigger.setAttribute("aria-expanded", "false");
    }
  });
  document.querySelectorAll(".action-menu-wrap.is-open").forEach((wrap) => {
    wrap.classList.remove("is-open");
  });
  document.querySelectorAll(".action-cell.is-menu-open, .mobile-card-actions.is-menu-open").forEach((container) => {
    container.classList.remove("is-menu-open");
  });
}

function handleMenuAction(action, bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook) {
    closeActionMenu();
    return;
  }

  if (action === "basic") {
    openBasicInfoModal(targetBook.id);
    closeActionMenu();
    return;
  }

  if (action === "homework-qr") {
    openHomeworkQrModal(targetBook.id);
    closeActionMenu();
    return;
  }

  if (action === "book-pdf") {
    closeActionMenu();
    if (targetBook.hasUploadedBookFile) {
      openResetBookFileStatusConfirm(targetBook.id);
      return;
    }

    openBookPdfSetupPage(targetBook.id);
    return;
  }

  if (action === "logs") {
    openLogDrawer(targetBook);
    closeActionMenu();
    return;
  }

  if (action === "copy") {
    copyBookContent(targetBook);
    closeActionMenu();
    return;
  }

  if (action === "duplicate") {
    BOOKS.unshift(createDuplicateBook(targetBook));
    closeActionMenu();
    state.currentPage = 1;
    render();
    scrollListViewportToTop();
    showToast("创建副本成功");
    return;
  }

  if (action === "delete" && targetBook.bookType === "数字教辅") {
    openDeleteConfirm(targetBook.id);
    closeActionMenu();
    return;
  }

  closeActionMenu();
}

function openBasicInfoModal(bookId = "") {
  state.editingBookId = bookId || null;
  const targetBook = bookId ? BOOKS.find((book) => book.id === bookId) : null;
  fillBasicInfoForm(targetBook);
  renderBasicInfoSide(targetBook);
  elements.basicInfoModal.querySelector(".detail-title").textContent = targetBook ? "修改图书基本信息" : "新增图书基本信息";
  resetModalDialogPosition(elements.basicInfoModal, ".detail-dialog");
  elements.basicInfoModal.hidden = false;
  elements.basicInfoModal.setAttribute("aria-hidden", "false");
}

function closeBasicInfoModal() {
  state.editingBookId = null;
  state.basicInfoCoverUrl = "";
  state.activeTagDropdown = {
    groupId: "",
    type: "",
    cascadeGrade: "",
    query: ""
  };
  stopModalDrag();
  elements.basicInfoModal.hidden = true;
  elements.basicInfoModal.setAttribute("aria-hidden", "true");
}

function openLogDrawer(book) {
  if (state.logDrawerCloseTimer) {
    window.clearTimeout(state.logDrawerCloseTimer);
    state.logDrawerCloseTimer = null;
  }

  elements.logDrawerContent.innerHTML = createLogDrawerMarkup(book);
  elements.logDrawer.hidden = false;
  elements.logDrawer.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(() => {
    elements.logDrawer.classList.add("is-visible");
  });
}

function closeLogDrawer() {
  state.activeLogEntries = [];
  closeReasonModal();
  elements.logDrawer.classList.remove("is-visible");
  if (state.logDrawerCloseTimer) {
    window.clearTimeout(state.logDrawerCloseTimer);
  }
  state.logDrawerCloseTimer = window.setTimeout(() => {
    elements.logDrawer.hidden = true;
    elements.logDrawer.setAttribute("aria-hidden", "true");
    state.logDrawerCloseTimer = null;
  }, 220);
}

function openReasonModal(reason, imageSrc = "") {
  if (!(elements.reasonContent instanceof HTMLElement) || !(elements.reasonModal instanceof HTMLElement)) {
    return;
  }

  const paragraphsMarkup = String(reason || "")
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
  const mediaMarkup = imageSrc
    ? `<div class="reason-media"><img class="reason-image" src="${escapeHtml(imageSrc)}" alt="异常原因示例图片" /></div>`
    : "";
  elements.reasonContent.innerHTML = `${paragraphsMarkup}${mediaMarkup}`;
  resetModalDialogPosition(elements.reasonModal, ".reason-dialog");
  elements.reasonModal.hidden = false;
  elements.reasonModal.setAttribute("aria-hidden", "false");
}

function closeReasonModal() {
  if (!(elements.reasonModal instanceof HTMLElement) || !(elements.reasonContent instanceof HTMLElement)) {
    return;
  }

  stopModalDrag();
  elements.reasonModal.hidden = true;
  elements.reasonModal.setAttribute("aria-hidden", "true");
  elements.reasonContent.innerHTML = "";
}

function fillBasicInfoForm(book) {
  state.activeTagDropdown = {
    groupId: "",
    type: "",
    cascadeGrade: "",
    query: ""
  };
  elements.modalClassification.value = book?.classification || "";
  elements.modalName.value = book?.name || "";
  elements.modalDescription.value = book?.description || "";
  state.modalTagStage = book?.stage || "";
  if (elements.modalTagStage instanceof HTMLSelectElement) {
    const optionsMarkup = [createModalPlaceholderOption("请选择学段", !state.modalTagStage)]
      .concat(TAG_STAGE_OPTIONS.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
      .join("");
    elements.modalTagStage.innerHTML = optionsMarkup;
    elements.modalTagStage.value = state.modalTagStage;
  }
  state.modalTagGroups = buildBookTagGroups(book);
  if (!state.modalTagGroups.length) {
    state.modalTagGroups = [createDefaultModalTagGroup(state.modalTagStage)];
  }
  renderModalTagGroups();
  elements.modalSeriesYear.value = book?.seriesYear || "";
  elements.modalSeriesName.value = book?.seriesName || "";
  elements.modalSeriesRegion.value = book?.seriesRegion || "";
  state.basicInfoCoverUrl = book?.coverUrl || "";
  updateBasicInfoCoverPreview(state.basicInfoCoverUrl);
  if (elements.modalCoverInput instanceof HTMLInputElement) {
    elements.modalCoverInput.value = "";
  }
  syncSelectPlaceholderStates();
}

function resolveCategoryByBookType(bookType, currentCategory = "") {
  if (bookType === "数字教辅") {
    return "成书";
  }

  return currentCategory || "成书";
}

function formatBookUnitPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${value}元`;
}

function updateBasicInfoCoverPreview(imageUrl) {
  if (!(elements.modalCoverPreview instanceof HTMLElement)) {
    return;
  }

  if (!imageUrl) {
    elements.modalCoverPreview.hidden = true;
    elements.modalCoverPreview.style.backgroundImage = "none";
    return;
  }

  elements.modalCoverPreview.hidden = false;
  elements.modalCoverPreview.style.backgroundImage = `url("${imageUrl.replace(/"/g, '\\"')}")`;
}

function handleBasicInfoCoverChange(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.length) {
    return;
  }

  const [file] = input.files;
  const reader = new FileReader();
  reader.onload = () => {
    state.basicInfoCoverUrl = typeof reader.result === "string" ? reader.result : "";
    updateBasicInfoCoverPreview(state.basicInfoCoverUrl);
  };
  reader.readAsDataURL(file);
}

function renderBasicInfoSide(book) {
  const fields = [
    ["名称", book?.name || "待填写"],
    ["物流码", book?.logisticsCode || "保存后生成"],
    ["自编号", book?.customCode || "-"],
    ["单价", formatBookUnitPrice(book?.unitPrice)],
    ["学段", book?.stage || "-"],
    ["年级", book?.gradeLabel || "-"],
    ["学科", book?.subject || "-"],
    ["年份", book?.seriesYear || "-"],
    ["分册", book?.volume || "-"],
    ["教材版本", book?.version || "-"],
  ];

  elements.basicInfoContent.innerHTML = fields
    .map(([label, value]) => `<div class="basic-side-item"><div class="basic-side-label">${escapeHtml(label)}</div><div class="basic-side-value">${escapeHtml(value)}</div></div>`)
    .join("");
}

function submitBasicInfoForm() {
  const isCreating = !state.editingBookId;
  const currentBook = state.editingBookId ? BOOKS.find((book) => book.id === state.editingBookId) : null;
  const primaryTagGroup = state.modalTagGroups[0] || createDefaultModalTagGroup();
  const primaryVersion = primaryTagGroup.versions[0] || "";
  const primaryGradeVolume = parseGradeVolumeLabel(primaryTagGroup.gradeVolumes[0] || "");
  const payload = {
    classification: elements.modalClassification.value.trim(),
    bookType: currentBook?.bookType || "数字教辅",
    name: elements.modalName.value.trim(),
    description: elements.modalDescription.value.trim(),
    stage: state.modalTagStage.trim(),
    subject: primaryTagGroup.subject.trim(),
    gradeLabel: primaryGradeVolume.gradeLabel.trim(),
    version: primaryVersion.trim(),
    volume: primaryGradeVolume.volume.trim(),
    tagGroups: state.modalTagGroups.map((group) => {
      const parsedGradeVolumes = group.gradeVolumes.map((value) => parseGradeVolumeLabel(value));
      return {
        subject: group.subject.trim(),
        versions: group.versions.map((value) => value.trim()).filter(Boolean),
        gradeVolumes: group.gradeVolumes.map((value) => value.trim()).filter(Boolean),
        version: (group.versions[0] || "").trim(),
        gradeVolume: (group.gradeVolumes[0] || "").trim(),
        gradeLabel: (parsedGradeVolumes[0]?.gradeLabel || "").trim(),
        volume: (parsedGradeVolumes[0]?.volume || "").trim()
      };
    }),
    seriesYear: elements.modalSeriesYear.value.trim(),
    seriesName: elements.modalSeriesName.value.trim(),
    seriesRegion: elements.modalSeriesRegion.value.trim()
  };

  if (!payload.classification) {
    elements.modalClassification.focus();
    return;
  }

  if (!payload.name) {
    elements.modalName.focus();
    return;
  }

  if (!payload.stage) {
    elements.modalTagStage?.focus();
    return;
  }

  if (!payload.tagGroups.length || payload.tagGroups.some((group) => !group.subject || !group.versions.length || !group.gradeVolumes.length)) {
    const firstEmptySelect = elements.basicInfoForm?.querySelector("#modal-tag-groups .field-select[data-empty='true']");
    if (firstEmptySelect instanceof HTMLElement) {
      firstEmptySelect.focus();
    }
    return;
  }

  payload.category = resolveCategoryByBookType(
    payload.bookType,
    currentBook?.category || ""
  );

  if (state.editingBookId) {
    const targetBook = currentBook;
    if (targetBook) {
      targetBook.classification = payload.classification;
      targetBook.name = payload.name;
      targetBook.bookType = payload.bookType;
      targetBook.category = payload.category;
      targetBook.description = payload.description;
      targetBook.coverUrl = state.basicInfoCoverUrl || targetBook.coverUrl;
      targetBook.stage = payload.stage || targetBook.stage;
      targetBook.subject = payload.subject || targetBook.subject;
      targetBook.grade = payload.gradeLabel || targetBook.grade;
      targetBook.gradeLabel = payload.gradeLabel || targetBook.gradeLabel;
      targetBook.version = payload.version || targetBook.version;
      targetBook.volume = payload.volume || targetBook.volume;
      targetBook.tagGroups = payload.tagGroups;
      targetBook.seriesYear = payload.seriesYear;
      targetBook.seriesName = payload.seriesName;
      targetBook.seriesRegion = payload.seriesRegion;
      targetBook.editingProgress = getBookProgressByType(payload.bookType, targetBook.editingProgress);
      if (payload.bookType === "自有教辅") {
        targetBook.shelfStatus = false;
      }
      targetBook.recentOperator = "当前用户";
      targetBook.recentAt = formatNow();
    }
  } else {
    BOOKS.unshift(createBookFromForm(payload));
  }

  closeBasicInfoModal();
  if (isCreating) {
    state.currentPage = 1;
  }
  render();
  if (isCreating) {
    scrollListViewportToTop();
  }
  if (isCreating) {
    showToast("创建图书成功");
  }
}

function createLogDrawerMarkup(book) {
  const logs = createBookLogs(book);
  state.activeLogEntries = logs;
  return `<div class="log-timeline">${logs.map((log, index) => `<div class="log-item${index === 0 ? " is-latest" : ""}"><div class="log-dot"></div><div class="log-meta"><div class="log-time">${escapeHtml(log.time)}</div>${log.reason && String(log.detail).includes("不通过") ? `<button class="log-exception-flag" type="button" data-log-reason-index="${index}" aria-label="查看异常原因"></button>` : ""}</div><div class="log-main">${log.detail}</div></div>`).join("")}</div>`;
}

function createBookLogs(book) {
  const latestOperator = escapeHtml(book.recentOperator === "-" ? book.creator : book.recentOperator);
  const creator = escapeHtml(book.creator);
  const name = escapeHtml(book.name);
  const logs = [
    { time: book.recentAt === "-" ? book.createdAt : book.recentAt, detail: `由 <strong>${latestOperator}</strong> 编辑基础信息（${name}）` },
    { time: book.createdAt, detail: `由 <strong>${creator}</strong> 创建图书（${name}）` },
    { time: book.createdAt, detail: `由 <strong>${creator}</strong> 录入目录完成` },
    { time: book.createdAt, detail: `由 <strong>${creator}</strong> 上传了目录及封面素材` }
  ];

  if (book.bookType === "数字教辅" && !book.shelfStatus) {
    logs.unshift({
      time: book.recentAt === "-" ? book.createdAt : book.recentAt,
      detail: `由 <strong>${latestOperator}</strong> 提交的内容审核不通过`,
      reason: "第10题答案与解析表述不一致，请核对题干、选项与答案的对应关系。\n第4小题图示中的受力标注缺失，建议补全关键辅助线与单位。\n修正后请重新提交审核。",
      reasonImage: REASON_SAMPLE_IMAGE
    });
  }

  return logs;
}

function createBookFromForm(payload) {
  const nextIndex = BOOKS.length + 1;
  const now = formatNow();
  return {
    id: `book-${Date.now()}`,
    code: `jf${String(100000 + nextIndex).slice(-6)}`,
    name: payload.name,
    subCode: `26-016004-${String(nextIndex).padStart(3, "0")}`,
    logisticsCode: `50-4500-${String(16823 + nextIndex).padStart(6, "0")}-001`,
    coverUrl: state.basicInfoCoverUrl,
    category: payload.category,
    classification: payload.classification,
    bookType: payload.bookType,
    subject: payload.subject || "语文",
    stage: payload.stage || "小学",
    grade: payload.gradeLabel || "一年级(上)",
    version: payload.version || "人教版",
    gradeLabel: payload.gradeLabel || "一年级/上",
    customCode: `26-016004-${String(nextIndex).padStart(3, "0")}`,
    unitPrice: 45,
    volume: payload.volume || "上册",
    tagGroups: payload.tagGroups,
    description: payload.description,
    seriesYear: payload.seriesYear,
    seriesName: payload.seriesName,
    seriesRegion: payload.seriesRegion,
    creator: "当前用户",
    createdAt: now,
    recentOperator: "当前用户",
    recentAt: now,
    editingProgress: getBookProgressByType(payload.bookType),
    hasUploadedBookFile: false,
    answerRegionCompleted: 0,
    answerRegionTotal: 600,
    autoGradingEnabled: false,
    shelfStatus: false
  };
}

function openBatchConfirm(targetStatus) {
  if (!state.selectedIds.length) {
    return;
  }
  const selectedCount = state.selectedIds.length;
  state.pendingConfirmAction = {
    type: "bulk-shelf",
    targetStatus,
    ids: [...state.selectedIds]
  };
  elements.confirmMessage.innerHTML = `确认要对已选中的 <span class="confirm-message-highlight">${selectedCount}</span> 本图书执行${targetStatus ? "批量上架" : "批量下架"}吗？`;
  resetModalDialogPosition(elements.confirmModal, ".confirm-dialog");
  elements.confirmModal.hidden = false;
  elements.confirmModal.setAttribute("aria-hidden", "false");
}

function openDeleteConfirm(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId && book.bookType === "数字教辅");
  if (!targetBook) {
    return;
  }

  state.pendingConfirmAction = {
    type: "delete-book",
    bookId
  };
  elements.confirmMessage.innerHTML = `确认删除《${escapeHtml(targetBook.name)}》吗？<br /><span class="confirm-message-danger">删除后不可恢复。</span>`;
  resetModalDialogPosition(elements.confirmModal, ".confirm-dialog");
  elements.confirmModal.hidden = false;
  elements.confirmModal.setAttribute("aria-hidden", "false");
}

function copyBookContent(book) {
  const tagGroups = buildBookTagGroups(book);
  const content = [
    `编号：${book.code}`,
    `名称：${book.name}`,
    `分类：${book.category}`,
    `类型：${book.bookType}`,
    `图书标签：${tagGroups.map((group) => `${book.stage}${group.subject} / ${group.versions.join("、")} / ${group.gradeVolumes.join("、")}`).join("；")}`,
    `套系信息：${[book.seriesYear, book.seriesName, book.seriesRegion].filter(Boolean).join(" / ") || "-"}`
  ].join("\n");

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(content).catch(() => {
      fallbackCopyText(content);
    });
    return;
  }

  fallbackCopyText(content);
}

function fallbackCopyText(content) {
  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function openNameEditor(bookId, trigger) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook || !(trigger instanceof HTMLElement)) {
    return;
  }

  const rect = trigger.getBoundingClientRect();
  const popoverTop = Math.min(window.innerHeight - 220, rect.bottom + 12);
  const popoverLeft = Math.min(window.innerWidth - 360, Math.max(16, rect.left - 150));

  state.pendingNameEdit = bookId;
  elements.nameEditorTextarea.value = targetBook.name;
  elements.nameEditorPopover.style.top = `${Math.max(16, popoverTop)}px`;
  elements.nameEditorPopover.style.left = `${Math.max(16, popoverLeft)}px`;
  elements.nameEditorPopover.hidden = false;
  elements.nameEditorTextarea.focus();
  elements.nameEditorTextarea.select();
}

function closeNameEditor() {
  if (elements.nameEditorPopover.hidden && !state.pendingNameEdit) {
    return;
  }

  state.pendingNameEdit = null;
  elements.nameEditorPopover.hidden = true;
}

function submitNameEdit() {
  if (!state.pendingNameEdit) {
    closeNameEditor();
    return;
  }

  const targetBook = BOOKS.find((book) => book.id === state.pendingNameEdit);
  if (!targetBook) {
    closeNameEditor();
    return;
  }

  const nextName = elements.nameEditorTextarea.value.trim();
  if (!nextName) {
    elements.nameEditorTextarea.focus();
    return;
  }

  targetBook.name = nextName;
  closeNameEditor();
  render();
}

function openDatePicker(rangeKey, trigger, selectionPart = "") {
  if (!rangeKey || !(trigger instanceof HTMLElement)) {
    return;
  }

  const { start, end } = getDateRangeElements(rangeKey);
  const isSamePickerSession = state.datePicker.targetKey === rangeKey && !elements.datePicker.hidden;

  state.datePicker.targetKey = rangeKey;
  state.datePicker.anchorElement = trigger;

  if (!isSamePickerSession) {
    state.datePicker.draftStart = start.value;
    state.datePicker.draftEnd = end.value;
    state.datePicker.visibleMonthStart = getMonthStart(parseDateValue(start.value) || parseDateValue(end.value) || new Date());
  }

  state.datePicker.selectionPart = selectionPart || state.datePicker.selectionPart;

  renderDatePicker();
  positionDatePicker(trigger);
  elements.datePicker.hidden = false;
  elements.datePicker.setAttribute("aria-hidden", "false");
}

function closeDatePicker(force = false) {
  if (state.datePicker.switchingFocus && !force) {
    return;
  }

  if (state.datePicker.focusTransferTimer) {
    window.clearTimeout(state.datePicker.focusTransferTimer);
    state.datePicker.focusTransferTimer = null;
  }

  if (elements.datePicker.hidden) {
    return;
  }

  clearIncompleteDateRangeOnClose();

  elements.datePicker.hidden = true;
  elements.datePicker.setAttribute("aria-hidden", "true");
  state.datePicker.targetKey = null;
  state.datePicker.anchorElement = null;
  state.datePicker.previewStart = "";
  state.datePicker.previewEnd = "";
  state.datePicker.selectionPart = "";
  state.datePicker.switchingFocus = false;
}

function clearIncompleteDateRangeOnClose() {
  if (!state.datePicker.targetKey) {
    return;
  }

  const { start, end } = getDateRangeElements(state.datePicker.targetKey);
  const startValue = String(start.value || "").trim();
  const endValue = String(end.value || "").trim();
  const hasOnlyOneSide = (!!startValue && !endValue) || (!startValue && !!endValue);

  if (!hasOnlyOneSide) {
    return;
  }

  start.value = "";
  end.value = "";
  state.datePicker.draftStart = "";
  state.datePicker.draftEnd = "";
  updateDateInputValidity(start, "");
  updateDateInputValidity(end, "");
  updateFiltersFromForm();
  syncFilterClearButtons();
}

function handleDatePickerClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const shortcut = target.closest("[data-range-shortcut]");
  if (shortcut instanceof HTMLButtonElement) {
    applyShortcutRange(shortcut.dataset.rangeShortcut || "");
    return;
  }

  const nav = target.closest("[data-picker-nav]");
  if (nav instanceof HTMLButtonElement) {
    const delta = nav.dataset.pickerNav === "prev" ? -1 : 1;
    state.datePicker.visibleMonthStart = addMonths(state.datePicker.visibleMonthStart, delta);
    renderDatePicker();
    return;
  }

  const day = target.closest("[data-picker-date]");
  if (day instanceof HTMLButtonElement) {
    updateDraftDateRange(day.dataset.pickerDate || "");
  }
}

function handleDatePickerShortcutHover(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const shortcut = target.closest("[data-range-shortcut]");
  if (!(shortcut instanceof HTMLButtonElement)) {
    return;
  }

  applyShortcutPreview(shortcut.dataset.rangeShortcut || "", shortcut);
}

function handleDatePickerShortcutLeave(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const shortcut = target.closest("[data-range-shortcut]");
  if (!(shortcut instanceof HTMLButtonElement)) {
    return;
  }

  const related = event.relatedTarget;
  if (related instanceof Node && shortcut.contains(related)) {
    return;
  }

  clearShortcutPreview(shortcut);
}

function updateDraftDateRange(nextDate) {
  if (!nextDate) {
    return;
  }

  if (!state.datePicker.targetKey) {
    return;
  }

  const { start, end } = getDateRangeElements(state.datePicker.targetKey);
  const activePart = state.datePicker.selectionPart === "end" ? "end" : "start";
  const currentInput = activePart === "end" ? end : start;
  const otherInput = activePart === "end" ? start : end;
  const nextPart = activePart === "end" ? "start" : "end";

  currentInput.value = nextDate;

  const normalizedCurrent = normalizeManualDateInput(currentInput.value);
  const normalizedOther = normalizeManualDateInput(otherInput.value);
  currentInput.value = normalizedCurrent;
  otherInput.value = normalizedOther;

  state.datePicker.draftStart = normalizeManualDateInput(start.value);
  state.datePicker.draftEnd = normalizeManualDateInput(end.value);

  updateDateInputValidity(currentInput, normalizedCurrent);
  updateDateInputValidity(otherInput, normalizedOther);
  updateFiltersFromForm();
  syncFilterClearButtons();

  if (parseDateValue(start.value) && parseDateValue(end.value)) {
    const normalizedRange = normalizeDateRange(start.value, end.value);
    start.value = normalizedRange.start;
    end.value = normalizedRange.end;
    state.datePicker.draftStart = normalizedRange.start;
    state.datePicker.draftEnd = normalizedRange.end;
    updateDateInputValidity(start, normalizedRange.start);
    updateDateInputValidity(end, normalizedRange.end);
    renderDatePicker();
    closeDatePicker();
    return;
  }

  transferDateRangeFocus(state.datePicker.targetKey, activePart, 220);
}

function applyShortcutRange(shortcut) {
  const { start, end, startDate } = getShortcutRange(shortcut);
  clearShortcutPreview();
  state.datePicker.draftStart = start;
  state.datePicker.draftEnd = end;
  state.datePicker.visibleMonthStart = getMonthStart(startDate);
  renderDatePicker();
  applyDatePickerSelection();
}

function applyDatePickerSelection() {
  if (!state.datePicker.targetKey) {
    closeDatePicker();
    return;
  }

  if (!state.datePicker.draftStart || !state.datePicker.draftEnd) {
    renderDatePicker();
    return;
  }

  const { start, end } = getDateRangeElements(state.datePicker.targetKey);
  const normalized = normalizeDateRange(state.datePicker.draftStart, state.datePicker.draftEnd);
  start.value = normalized.start;
  end.value = normalized.end;
  updateDateInputValidity(start, normalized.start);
  updateDateInputValidity(end, normalized.end);
  syncFilterClearButtons();
  closeDatePicker();
  updateFiltersFromForm();
}

function clearDatePickerSelection() {
  state.datePicker.draftStart = "";
  state.datePicker.draftEnd = "";
  if (!state.datePicker.targetKey) {
    renderDatePicker();
    return;
  }

  const { start, end } = getDateRangeElements(state.datePicker.targetKey);
  start.value = "";
  end.value = "";
  updateDateInputValidity(start, "");
  updateDateInputValidity(end, "");
  syncFilterClearButtons();
  closeDatePicker();
  updateFiltersFromForm();
}

function renderDatePicker() {
  if (!elements.datePickerCalendars) {
    return;
  }

  const firstMonth = state.datePicker.visibleMonthStart;
  const secondMonth = addMonths(firstMonth, 1);
  elements.datePickerCalendars.innerHTML = [
    renderCalendarMonth(firstMonth, true, false),
    renderCalendarMonth(secondMonth, false, true)
  ].join("");
  elements.datePickerSummary.textContent = getDatePickerSummary();
  const activeRange = getActiveDatePickerRange();
  elements.datePickerSummary.classList.toggle("is-pending", !!activeRange.start && !activeRange.end);
  if (elements.datePickerApply instanceof HTMLButtonElement) {
    elements.datePickerApply.disabled = !state.datePicker.draftStart || !state.datePicker.draftEnd;
  }
}

function renderCalendarMonth(monthDate, showPrev, showNext) {
  const monthStart = getMonthStart(monthDate);
  const gridStart = addDays(monthStart, -getWeekOffset(monthStart));
  const dayCells = [];
  const range = getActiveDatePickerRange();

  for (let index = 0; index < 42; index += 1) {
    const current = addDays(gridStart, index);
    const currentValue = formatDateValue(current);
    const isMuted = current.getMonth() !== monthStart.getMonth();
    const isRangeStart = !!range.start && currentValue === range.start;
    const isRangeEnd = !!range.end && currentValue === range.end;
    const isInRange = !!range.start && !!range.end && currentValue >= range.start && currentValue <= range.end;

    dayCells.push(`
      <div class="calendar-day${isMuted ? " is-muted" : ""}${isInRange ? " is-in-range" : ""}${isRangeStart ? " is-range-start is-selected" : ""}${isRangeEnd ? " is-range-end is-selected" : ""}">
        <button type="button" data-picker-date="${currentValue}">${current.getDate()}</button>
      </div>
    `);
  }

  return `
    <section class="calendar-panel">
      <div class="calendar-header">
        <button class="calendar-nav${showPrev ? "" : " is-placeholder"}" type="button" data-picker-nav="prev" aria-label="上个月">‹</button>
        <div class="calendar-title">${monthStart.getFullYear()}年 ${monthStart.getMonth() + 1}月</div>
        <button class="calendar-nav${showNext ? "" : " is-placeholder"}" type="button" data-picker-nav="next" aria-label="下个月">›</button>
      </div>
      <div class="calendar-weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
      <div class="calendar-grid">${dayCells.join("")}</div>
    </section>
  `;
}

function getDatePickerSummary() {
  const range = getActiveDatePickerRange();
  if (!range.start && !range.end) {
    return "未选择时间范围";
  }
  if (range.start && !range.end) {
    return "请选择结束时间，形成完整范围";
  }
  return `${range.start} 至 ${range.end}`;
}

function getActiveDatePickerRange() {
  if (state.datePicker.previewStart || state.datePicker.previewEnd) {
    return normalizeDateRange(state.datePicker.previewStart, state.datePicker.previewEnd);
  }

  return normalizeDateRange(state.datePicker.draftStart, state.datePicker.draftEnd);
}

function getShortcutRange(shortcut) {
  const today = getToday();
  let startDate = today;
  let endDate = today;

  if (shortcut === "past-7") {
    startDate = addDays(today, -6);
  } else if (shortcut === "past-15") {
    startDate = addDays(today, -14);
  } else if (shortcut === "past-30") {
    startDate = addDays(today, -29);
  } else if (shortcut === "this-year") {
    startDate = new Date(today.getFullYear(), 0, 1);
  } else if (shortcut === "this-month") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (shortcut === "next-15") {
    endDate = addDays(today, 14);
  }

  return {
    start: formatDateValue(startDate),
    end: formatDateValue(endDate),
    startDate,
    endDate
  };
}

function applyShortcutPreview(shortcut, button) {
  const { start, end, startDate } = getShortcutRange(shortcut);
  document.querySelectorAll("[data-range-shortcut].is-active").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  state.datePicker.previewStart = start;
  state.datePicker.previewEnd = end;
  state.datePicker.visibleMonthStart = getMonthStart(startDate);
  renderDatePicker();
}

function clearShortcutPreview(button) {
  if (button instanceof HTMLElement) {
    button.classList.remove("is-active");
  }
  state.datePicker.previewStart = "";
  state.datePicker.previewEnd = "";
  state.datePicker.visibleMonthStart = getMonthStart(
    parseDateValue(state.datePicker.draftStart) || parseDateValue(state.datePicker.draftEnd) || new Date()
  );
  renderDatePicker();
}

function positionDatePicker(trigger) {
  const rect = trigger.getBoundingClientRect();
  const pickerWidth = Math.min(650, window.innerWidth - 24);
  const left = Math.min(window.innerWidth - pickerWidth - 12, Math.max(12, rect.left));
  const availableBottom = window.innerHeight - rect.bottom;
  const top = availableBottom >= 360 ? rect.bottom + 8 : Math.max(12, rect.top - 372);
  elements.datePicker.style.left = `${left}px`;
  elements.datePicker.style.top = `${top}px`;
}

function getDateRangeElements(rangeKey) {
  if (rangeKey === "created") {
    return {
      start: elements.createdStartFilter,
      end: elements.createdEndFilter
    };
  }

  return {
    start: elements.recentStartFilter,
    end: elements.recentEndFilter
  };
}

function normalizeDateRange(startValue, endValue) {
  if (!startValue && !endValue) {
    return { start: "", end: "" };
  }
  if (startValue && !endValue) {
    return { start: startValue, end: "" };
  }
  if (!startValue && endValue) {
    return { start: endValue, end: endValue };
  }
  return startValue <= endValue ? { start: startValue, end: endValue } : { start: endValue, end: startValue };
}

function normalizeManualDateInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  const normalizedText = trimmed.replace(/[./]/g, "-");
  const matched = normalizedText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!matched) {
    return trimmed;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return trimmed;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return trimmed;
  }

  return formatDateValue(date);
}

function applyManualDateRangeIfComplete(rangeKey) {
  const { start, end } = getDateRangeElements(rangeKey);
  const normalizedStart = normalizeManualDateInput(start.value);
  const normalizedEnd = normalizeManualDateInput(end.value);

  start.value = normalizedStart;
  end.value = normalizedEnd;
  updateDateInputValidity(start, normalizedStart);
  updateDateInputValidity(end, normalizedEnd);

  if (!parseDateValue(normalizedStart) || !parseDateValue(normalizedEnd)) {
    return;
  }

  const normalizedRange = normalizeDateRange(normalizedStart, normalizedEnd);
  start.value = normalizedRange.start;
  end.value = normalizedRange.end;
  state.datePicker.draftStart = normalizedRange.start;
  state.datePicker.draftEnd = normalizedRange.end;

  if (state.datePicker.targetKey === rangeKey && !elements.datePicker.hidden) {
    closeDatePicker();
  }
}

function handleManualDateInput(rangeKey, part, input) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const { start, end } = getDateRangeElements(rangeKey);
  const currentInput = part === "end" ? end : start;
  const otherInput = part === "end" ? start : end;
  const normalizedCurrent = normalizeManualDateInput(currentInput.value);
  const normalizedOther = normalizeManualDateInput(otherInput.value);
  const currentValid = !!parseDateValue(normalizedCurrent);
  const otherValid = !!parseDateValue(normalizedOther);
  updateDateInputValidity(currentInput, normalizedCurrent);
  updateDateInputValidity(otherInput, normalizedOther);

  state.datePicker.selectionPart = part;
  state.datePicker.draftStart = normalizeManualDateInput(start.value);
  state.datePicker.draftEnd = normalizeManualDateInput(end.value);
  renderDatePicker();

  if (!currentValid || otherValid || document.activeElement !== input) {
    return;
  }

  currentInput.value = normalizedCurrent;
  state.datePicker.draftStart = normalizeManualDateInput(start.value);
  state.datePicker.draftEnd = normalizeManualDateInput(end.value);
  updateFiltersFromForm();
  syncFilterClearButtons();
  transferDateRangeFocus(rangeKey, part, 0);
}

function updateDateInputValidity(input, value) {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const hasValue = !!String(value || "").trim();
  const isValid = !!parseDateValue(String(value || "").trim());
  input.classList.toggle("is-invalid", hasValue && !isValid);
}

function transferDateRangeFocus(rangeKey, currentPart, delayMs) {
  const { start, end } = getDateRangeElements(rangeKey);
  const otherInput = currentPart === "end" ? start : end;
  const nextPart = currentPart === "end" ? "start" : "end";

  state.datePicker.selectionPart = nextPart;
  renderDatePicker();
  state.datePicker.switchingFocus = true;

  if (state.datePicker.anchorElement instanceof HTMLElement) {
    elements.datePicker.hidden = false;
    elements.datePicker.setAttribute("aria-hidden", "false");
    positionDatePicker(state.datePicker.anchorElement);
  }

  if (state.datePicker.focusTransferTimer) {
    window.clearTimeout(state.datePicker.focusTransferTimer);
  }

  state.datePicker.focusTransferTimer = window.setTimeout(() => {
    otherInput.focus();
    otherInput.select();
    state.datePicker.switchingFocus = false;
    state.datePicker.focusTransferTimer = null;
  }, delayMs);
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekOffset(date) {
  return (date.getDay() + 6) % 7;
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function formatDateValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function openShelfConfirm(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook || isSelfOwnedBook(targetBook)) {
    return;
  }

  state.pendingConfirmAction = {
    type: "single-shelf",
    bookId,
    targetStatus: !targetBook.shelfStatus
  };
  elements.confirmMessage.textContent = `确认要${targetBook.shelfStatus ? "下架" : "上架"}《${targetBook.name}》吗？`;
  resetModalDialogPosition(elements.confirmModal, ".confirm-dialog");
  elements.confirmModal.hidden = false;
  elements.confirmModal.setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  state.pendingConfirmAction = null;
  stopModalDrag();
  elements.confirmModal.hidden = true;
  elements.confirmModal.setAttribute("aria-hidden", "true");
}

function openPreviewModal(imageUrl, title) {
  if (!imageUrl) {
    return;
  }
  elements.previewImage.src = imageUrl;
  elements.previewImage.alt = title;
  resetModalDialogPosition(elements.previewModal, ".preview-dialog");
  elements.previewModal.hidden = false;
  elements.previewModal.setAttribute("aria-hidden", "false");
}

function closePreviewModal() {
  elements.previewImage.removeAttribute("src");
  stopModalDrag();
  elements.previewModal.hidden = true;
  elements.previewModal.setAttribute("aria-hidden", "true");
}

function openHomeworkQrModal(bookId) {
  const targetBook = BOOKS.find((book) => book.id === bookId);
  if (!targetBook || !(elements.homeworkQrModal instanceof HTMLElement)) {
    return;
  }

  state.homeworkQrBookId = bookId;
  state.homeworkQrSize = 0;
  state.homeworkQrLeafType = false;
  syncHomeworkQrModal();
  resetModalDialogPosition(elements.homeworkQrModal, ".homework-qr-dialog");
  elements.homeworkQrModal.hidden = false;
  elements.homeworkQrModal.setAttribute("aria-hidden", "false");
}

function closeHomeworkQrModal() {
  if (!(elements.homeworkQrModal instanceof HTMLElement)) {
    return;
  }

  state.homeworkQrBookId = null;
  state.homeworkQrSize = 0;
  state.homeworkQrLeafType = false;
  stopModalDrag();
  elements.homeworkQrModal.hidden = true;
  elements.homeworkQrModal.setAttribute("aria-hidden", "true");
  syncHomeworkQrModal();
}

function handleHomeworkQrLeafTypeChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  state.homeworkQrLeafType = target.checked;
}

function selectHomeworkQrSize(size) {
  if (![256, 512, 1024].includes(size)) {
    return;
  }

  state.homeworkQrSize = size;
  syncHomeworkQrModal();
}

function syncHomeworkQrModal() {
  if (elements.homeworkQrLeafType instanceof HTMLInputElement) {
    elements.homeworkQrLeafType.checked = state.homeworkQrLeafType;
  }

  elements.homeworkQrSizeButtons.forEach((button) => {
    const size = Number(button.dataset.qrSize || "0");
    const selected = size === state.homeworkQrSize;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  if (elements.homeworkQrDownload instanceof HTMLButtonElement) {
    elements.homeworkQrDownload.disabled = !state.homeworkQrBookId || !state.homeworkQrSize;
  }
}

function createHomeworkQrPayload(book) {
  return {
    type: state.homeworkQrLeafType ? "未级目录码" : "校本作业码",
    bookId: book.id,
    code: book.code,
    name: book.name,
    customCode: book.customCode,
    timestamp: new Date().toISOString()
  };
}

function hashHomeworkQrSeed(input) {
  let hash = 2166136261;
  const text = String(input || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createHomeworkQrMatrix(content, size = 29) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const markFinder = (startRow, startCol) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const outer = row === 0 || row === 6 || col === 0 || col === 6;
        const inner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        matrix[startRow + row][startCol + col] = outer || inner;
        reserved[startRow + row][startCol + col] = true;
      }
    }

    for (let row = -1; row <= 7; row += 1) {
      for (let col = -1; col <= 7; col += 1) {
        const nextRow = startRow + row;
        const nextCol = startCol + col;
        if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
          continue;
        }

        reserved[nextRow][nextCol] = true;
        if (row === -1 || row === 7 || col === -1 || col === 7) {
          matrix[nextRow][nextCol] = false;
        }
      }
    }
  };

  markFinder(0, 0);
  markFinder(0, size - 7);
  markFinder(size - 7, 0);

  for (let index = 8; index < size - 8; index += 1) {
    const value = index % 2 === 0;
    if (!reserved[6][index]) {
      matrix[6][index] = value;
      reserved[6][index] = true;
    }
    if (!reserved[index][6]) {
      matrix[index][6] = value;
      reserved[index][6] = true;
    }
  }

  const seed = hashHomeworkQrSeed(content);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (reserved[row][col]) {
        continue;
      }

      const bitSeed = seed ^ Math.imul(row + 1, 1103515245) ^ Math.imul(col + 1, 12345);
      matrix[row][col] = ((bitSeed >>> ((row + col) % 23)) & 1) === 1;
    }
  }

  return matrix;
}

function createHomeworkQrSvg(book, size) {
  const payload = JSON.stringify(createHomeworkQrPayload(book));
  const matrix = createHomeworkQrMatrix(payload);
  const quietZone = 4;
  const moduleCount = matrix.length + quietZone * 2;
  const moduleSize = size / moduleCount;
  const rects = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((filled, colIndex) => {
      if (!filled) {
        return;
      }

      const x = (colIndex + quietZone) * moduleSize;
      const y = (rowIndex + quietZone) * moduleSize;
      rects.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#111827" />`);
    });
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${rects.join("")}
    </svg>
  `.trim();
}

function createHomeworkQrFileName(book, size) {
  const typeLabel = state.homeworkQrLeafType ? "未级目录码" : "校本作业码";
  const safeName = String(book.name || "图书")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${safeName}-${typeLabel}-${size}px.png`;
}

function triggerFileDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadHomeworkQrCode() {
  const targetBook = BOOKS.find((book) => book.id === state.homeworkQrBookId);
  if (!targetBook || !state.homeworkQrSize) {
    return;
  }

  const size = state.homeworkQrSize;
  const svgMarkup = createHomeworkQrSvg(targetBook, size);
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(svgUrl);
      showToast("下载失败", "error");
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(svgUrl);
      if (!blob) {
        showToast("下载失败", "error");
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      triggerFileDownload(downloadUrl, createHomeworkQrFileName(targetBook, size));
      URL.revokeObjectURL(downloadUrl);
      closeHomeworkQrModal();
      showToast("二维码下载成功");
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    showToast("下载失败", "error");
  };

  image.src = svgUrl;
}

function bindModalDrag(modal, headerSelector, dialogSelector) {
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  const header = modal.querySelector(headerSelector);
  const dialog = modal.querySelector(dialogSelector);
  if (!(header instanceof HTMLElement) || !(dialog instanceof HTMLElement) || header.dataset.dragBound === "true") {
    return;
  }

  header.dataset.dragBound = "true";
  header.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest("button")) {
      return;
    }

    const explicitDragHandle = header.querySelector("[data-drag-handle='true']");
    const dragHandle = event.target.closest("[data-drag-handle='true']");
    if (explicitDragHandle && (!(dragHandle instanceof Element) || !header.contains(dragHandle))) {
      return;
    }

    const position = getModalDialogPosition(dialog);
    modalDragState = {
      pointerId: event.pointerId,
      dialog,
      header,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };
    dialog.classList.add("is-dragging");
    header.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
}

function handleModalDrag(event) {
  if (!modalDragState || event.pointerId !== modalDragState.pointerId) {
    return;
  }

  const nextX = modalDragState.originX + (event.clientX - modalDragState.startX);
  const nextY = modalDragState.originY + (event.clientY - modalDragState.startY);
  const clamped = clampModalDialogOffset(modalDragState.dialog, nextX, nextY);
  applyModalDialogPosition(modalDragState.dialog, clamped.x, clamped.y);
}

function stopModalDrag(event) {
  if (!modalDragState || (event?.pointerId != null && event.pointerId !== modalDragState.pointerId)) {
    return;
  }

  modalDragState.dialog?.classList.remove("is-dragging");
  modalDragState.header?.releasePointerCapture?.(modalDragState.pointerId);
  modalDragState = null;
}

function getModalDialogPosition(dialog) {
  return {
    x: Number(dialog.dataset.dragX || 0),
    y: Number(dialog.dataset.dragY || 0)
  };
}

function applyModalDialogPosition(dialog, x, y) {
  if (!(dialog instanceof HTMLElement)) {
    return;
  }

  dialog.dataset.dragX = String(x);
  dialog.dataset.dragY = String(y);
  dialog.style.transform = x === 0 && y === 0 ? "" : `translate(${x}px, ${y}px)`;
}

function resetModalDialogPosition(modal, dialogSelector) {
  const dialog = modal?.querySelector(dialogSelector);
  if (!(dialog instanceof HTMLElement)) {
    return;
  }

  dialog.classList.remove("is-dragging");
  applyModalDialogPosition(dialog, 0, 0);
}

function clampModalDialogOffset(dialog, x, y) {
  const dialogWidth = dialog.offsetWidth || 0;
  const dialogHeight = dialog.offsetHeight || 0;
  const horizontalTravel = Math.max(0, (window.innerWidth - dialogWidth) / 2 - 16);
  const verticalTravel = Math.max(0, (window.innerHeight - dialogHeight) / 2 - 24);

  return {
    x: Math.min(horizontalTravel, Math.max(-horizontalTravel, x)),
    y: Math.min(verticalTravel, Math.max(-verticalTravel, y))
  };
}

function submitConfirmAction() {
  if (!state.pendingConfirmAction) {
    closeConfirmModal();
    return;
  }

  const now = formatNow();
  let successMessage = "";

  if (state.pendingConfirmAction.type === "single-shelf") {
    const targetBook = BOOKS.find((book) => book.id === state.pendingConfirmAction.bookId);
    if (targetBook && !isSelfOwnedBook(targetBook)) {
      targetBook.shelfStatus = state.pendingConfirmAction.targetStatus;
      targetBook.recentOperator = "当前用户";
      targetBook.recentAt = now;
      successMessage = state.pendingConfirmAction.targetStatus ? "上架成功" : "下架成功";
    }
  }

  if (state.pendingConfirmAction.type === "bulk-shelf") {
    const targetIds = new Set(state.pendingConfirmAction.ids);
    BOOKS.forEach((book) => {
      if (targetIds.has(book.id) && !isSelfOwnedBook(book)) {
        book.shelfStatus = state.pendingConfirmAction.targetStatus;
        book.recentOperator = "当前用户";
        book.recentAt = now;
      }
    });
    state.selectedIds = [];
    successMessage = state.pendingConfirmAction.targetStatus ? "上架成功" : "下架成功";
  }

  if (state.pendingConfirmAction.type === "delete-book") {
    const targetIndex = BOOKS.findIndex((book) => book.id === state.pendingConfirmAction.bookId && book.bookType === "数字教辅");
    if (targetIndex >= 0) {
      const [removedBook] = BOOKS.splice(targetIndex, 1);
      state.selectedIds = state.selectedIds.filter((id) => id !== removedBook.id);
      successMessage = "删除成功";
    }
  }

  if (state.pendingConfirmAction.type === "reset-book-file-status") {
    const targetBook = BOOKS.find((book) => book.id === state.pendingConfirmAction.bookId);
    if (targetBook) {
      targetBook.hasUploadedBookFile = false;
      targetBook.answerRegionCompleted = 0;
      targetBook.autoGradingEnabled = false;
      targetBook.recentOperator = "当前用户";
      targetBook.recentAt = now;
      successMessage = "文件状态已还原为未设置";
    }
  }

  closeConfirmModal();
  render();
  if (successMessage) {
    showToast(successMessage);
  }
}

function formatNow() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getTotalPages(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function createBooks() {
  const names = [
    "实验班提优训练七年级英语下外研社新标准",
    "24秋·单元双测七年级语文下人教版",
    "24秋·单元双测八年级数学上北师大版",
    "核心素养周测九年级物理全一册",
    "单元精练六年级语文上册统编版",
    "期末冲刺卷八年级英语下册外研版",
    "名校真题汇编三年级数学下册",
    "实验班提优训练七年级语文上册",
    "同步精讲精练五年级英语上册",
    "周周清四年级数学下册"
  ];
  const creators = ["张三", "李四", "王五", "赵六"];
  const categories = ["成书", "活页"];
  const bookTypes = ["自有教辅", "数字教辅"];
  const seriesYears = ["2026", "2025", "2024"];
  const volumes = ["上册", "下册", "全一册", "其他"];
  const classifications = ["学科类", "社科类"];
  const seriesNames = ["实验班提优训练北京", "单元双测北京", "同步精讲精练北京"];
  const covers = ["./assets/cover-orange.svg", "./assets/cover-purple.svg"];
  const answerRegionTotals = [600, 480, 360, 240];
  const metadata = [
    { stage: "小学", subject: "语文", grade: "一年级(上)", gradeLabel: "一年级/上", version: "人教版" },
    { stage: "小学", subject: "数学", grade: "三年级(下)", gradeLabel: "三年级/下", version: "北师大版" },
    { stage: "初中", subject: "英语", grade: "七年级(下)", gradeLabel: "七年级/下", version: "外研版" },
    { stage: "初中", subject: "物理", grade: "九年级(全)", gradeLabel: "九年级/上", version: "人教版" },
    { stage: "初中", subject: "化学", grade: "九年级(全)", gradeLabel: "九年级/上", version: "人教版" }
  ];
  const books = [];
  const latestCreatedAt = new Date(2025, 9, 31, 12, 30, 0);

  for (let index = 0; index < 56; index += 1) {
    const meta = metadata[index % metadata.length];
    const bookType = bookTypes[index % bookTypes.length];
    const selfOwnedIndex = Math.floor(index / 2);
    const category = bookType === "数字教辅" ? "成书" : categories[selfOwnedIndex % categories.length];
    const tagGroups = [
      {
        subject: meta.subject,
        versions: [meta.version],
        version: meta.version,
        gradeLabel: meta.gradeLabel,
        volume: volumes[index % volumes.length],
        gradeVolumes: [formatGradeVolumeLabel(meta.gradeLabel, volumes[index % volumes.length])],
        gradeVolume: formatGradeVolumeLabel(meta.gradeLabel, volumes[index % volumes.length])
      }
    ];
    if (index % 6 === 0) {
      const sameStageMetadata = metadata.filter((item) => item.stage === meta.stage && item.subject !== meta.subject);
      const extraMeta = sameStageMetadata[index % sameStageMetadata.length] || meta;
      tagGroups.push({
        subject: extraMeta.subject,
        versions: [extraMeta.version],
        version: extraMeta.version,
        gradeLabel: extraMeta.gradeLabel,
        volume: volumes[(index + 1) % volumes.length],
        gradeVolumes: [formatGradeVolumeLabel(extraMeta.gradeLabel, volumes[(index + 1) % volumes.length])],
        gradeVolume: formatGradeVolumeLabel(extraMeta.gradeLabel, volumes[(index + 1) % volumes.length])
      });
    }
    const codeNumber = 100056 - index;
    const createdDate = addDays(latestCreatedAt, -index);
    const recentDate = addDays(createdDate, Math.max(0, (index % 3) - 1));
    const hasUploadedBookFile = index % 4 !== 1;
    const answerRegionTotal = answerRegionTotals[index % answerRegionTotals.length];
    const answerRegionCompleted = hasUploadedBookFile
      ? (index % 6 === 0 ? answerRegionTotal : Math.min(answerRegionTotal - 15, (index * 45) % Math.max(answerRegionTotal, 1)))
      : 0;
    books.push({
      id: `book-${index + 1}`,
      code: `jf${String(codeNumber).padStart(6, "0")}`,
      name: names[index % names.length],
      subCode: `26-016004-${String(index + 2).padStart(3, "0")}`,
      logisticsCode: `50-4500-${String(16823 + index).padStart(6, "0")}-001`,
      coverUrl: index % 5 === 1 ? "" : covers[Math.floor(Math.random() * covers.length)],
      category,
      classification: classifications[index % classifications.length],
      bookType,
      subject: meta.subject,
      stage: meta.stage,
      grade: meta.grade,
      version: meta.version,
      gradeLabel: meta.gradeLabel,
      customCode: `26-016004-${String(index + 2).padStart(3, "0")}`,
      unitPrice: 45 + (index % 4) * 5,
      volume: volumes[index % volumes.length],
      tagGroups,
      description: `${names[index % names.length]}的基础资料说明`,
      seriesYear: index % 4 === 1 ? "" : seriesYears[index % seriesYears.length],
      seriesName: index % 4 === 2 ? "" : seriesNames[index % seriesNames.length],
      seriesRegion: index % 4 === 3 ? "" : ["北京", "江苏", "上海"][index % 3],
      creator: creators[index % creators.length],
      createdAt: formatDateTime(createdDate),
      recentOperator: index % 5 === 4 ? "-" : creators[(index + 1) % creators.length],
      recentAt: index % 5 === 4 ? "-" : formatDateTime(recentDate),
      editingProgress: bookType === "自有教辅" ? "0/0" : `${index % 5 === 0 ? 19 : 0}/${24 + (index % 5)}`,
      hasUploadedBookFile,
      answerRegionCompleted,
      answerRegionTotal,
      autoGradingEnabled: false,
      shelfStatus: bookType === "数字教辅" ? index % 4 === 2 : false
    });
  }

  return books;
}

function syncTableHeaderScroll() {
  if (!(elements.tableHeadScroll instanceof HTMLElement) || !(elements.tableBodyScroll instanceof HTMLElement)) {
    return;
  }

  elements.tableHeadScroll.scrollLeft = elements.tableBodyScroll.scrollLeft;
  syncTableLayoutMetrics();
  syncTableFreezeState();
  updateOpenActionMenuPosition();
}

function syncTableLayoutMetrics() {
  if (!(elements.tableHeadScroll instanceof HTMLElement) || !(elements.tableBodyScroll instanceof HTMLElement)) {
    return;
  }

  const scrollbarWidth = Math.max(elements.tableBodyScroll.offsetWidth - elements.tableBodyScroll.clientWidth, 0);
  const rootStyle = getComputedStyle(document.documentElement);
  const scaleSource = elements.tablePanel instanceof HTMLElement ? getComputedStyle(elements.tablePanel) : rootStyle;
  const baseWidth = Number.parseFloat(scaleSource?.getPropertyValue("--table-base-width") || "0") || 1886;
  const effectiveAvailableWidth = Math.max(elements.tableBodyScroll.clientWidth - 2, 0);
  const nextScale = Math.min(1, effectiveAvailableWidth / Math.max(baseWidth, 1) || 1);
  let computedTableWidth = 0;
  const columnWidths = [];
  const baseWidths = TABLE_WIDTH_VARIABLE_MAPPINGS.map(([baseVariable]) => Number.parseFloat(rootStyle.getPropertyValue(baseVariable) || "0") || 0);
  const baseWidthSum = baseWidths.reduce((sum, value) => sum + value, 0) || baseWidth;

  TABLE_WIDTH_VARIABLE_MAPPINGS.forEach(([baseVariable, widthVariable], index) => {
    const baseValue = baseWidths[index] || (Number.parseFloat(rootStyle.getPropertyValue(baseVariable) || "0") || 0);
    const computedWidth = Number(((effectiveAvailableWidth * baseValue) / Math.max(baseWidthSum, 1)).toFixed(3));
    document.documentElement.style.setProperty(widthVariable, `${computedWidth}px`);
    elements.tablePanel?.style.setProperty(widthVariable, `${computedWidth}px`);
    computedTableWidth += computedWidth;
    columnWidths.push(computedWidth);
  });

  if (columnWidths.length) {
    const diff = Number((effectiveAvailableWidth - computedTableWidth).toFixed(3));
    columnWidths[columnWidths.length - 1] = Number((columnWidths[columnWidths.length - 1] + diff).toFixed(3));
    computedTableWidth = Number((computedTableWidth + diff).toFixed(3));
  }

  document.documentElement.style.setProperty("--table-width", `${computedTableWidth}px`);
  elements.tablePanel?.style.setProperty("--table-width", `${computedTableWidth}px`);
  document.documentElement.style.setProperty("--table-scale", `${nextScale}`);
  elements.tableHeadScroll.style.setProperty("--table-scrollbar-width", `${scrollbarWidth}px`);
  elements.tableBodyScroll.style.setProperty("--table-scrollbar-width", `${scrollbarWidth}px`);
  elements.tablePanel?.style.setProperty("--table-scrollbar-width", `${scrollbarWidth}px`);
  elements.tablePanel?.style.setProperty("--table-scale", `${nextScale}`);
  applyConcreteTableWidths(columnWidths, scrollbarWidth);
}

function applyConcreteTableWidths(columnWidths, scrollbarWidth) {
  if (!Array.isArray(columnWidths) || columnWidths.length !== TABLE_WIDTH_VARIABLE_MAPPINGS.length) {
    return;
  }

  const signature = `${columnWidths.map((value) => value.toFixed(3)).join(",")}|${scrollbarWidth}`;
  if (signature === lastAppliedTableLayoutSignature) {
    return;
  }

  lastAppliedTableLayoutSignature = signature;

  const headerTable = elements.tableHeadScroll?.querySelector(".data-table");
  const bodyTable = elements.tableBodyScroll?.querySelector(".data-table");
  if (!(headerTable instanceof HTMLTableElement) || !(bodyTable instanceof HTMLTableElement)) {
    return;
  }

  const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
  const headerTotalWidth = totalWidth + scrollbarWidth;

  applyTableElementWidths(headerTable, columnWidths, scrollbarWidth, headerTotalWidth, true);
  applyTableElementWidths(bodyTable, columnWidths, 0, totalWidth, false);
}

function applyTableElementWidths(table, columnWidths, actionExtraWidth, totalWidth, includeScrollbarOnAction) {
  if (!(table instanceof HTMLTableElement)) {
    return;
  }

  table.style.width = `${totalWidth}px`;
  table.style.minWidth = `${totalWidth}px`;

  const colElements = Array.from(table.querySelectorAll("colgroup col"));
  colElements.forEach((col, index) => {
    if (!(col instanceof HTMLTableColElement)) {
      return;
    }

    const width = columnWidths[index] + (includeScrollbarOnAction && index === columnWidths.length - 1 ? actionExtraWidth : 0);
    col.style.width = `${width}px`;
    col.style.minWidth = `${width}px`;
    col.style.maxWidth = `${width}px`;
  });

  table.querySelectorAll("tr").forEach((row) => {
    Array.from(row.children).forEach((cell, index) => {
      if (!(cell instanceof HTMLTableCellElement) && !(cell instanceof HTMLTableHeaderCellElement)) {
        return;
      }

      if (cell.colSpan > 1) {
        cell.style.width = `${totalWidth}px`;
        cell.style.minWidth = `${totalWidth}px`;
        cell.style.maxWidth = `${totalWidth}px`;
        return;
      }

      const width = columnWidths[index] + (includeScrollbarOnAction && index === columnWidths.length - 1 ? actionExtraWidth : 0);
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });
  });
}

function syncTableFreezeState() {
  if (!(elements.tablePanel instanceof HTMLElement) || !(elements.tableBodyScroll instanceof HTMLElement)) {
    return;
  }

  const currentLeft = elements.tableBodyScroll.scrollLeft;
  const maxLeft = Math.max(elements.tableBodyScroll.scrollWidth - elements.tableBodyScroll.clientWidth, 0);
  const hasLeftFreeze = currentLeft > 1;
  const hasRightFreeze = maxLeft - currentLeft > 1;

  elements.tablePanel.classList.toggle("is-left-frozen", hasLeftFreeze);
  elements.tablePanel.classList.toggle("is-right-frozen", hasRightFreeze);
}

function handleHeaderTooltipPointer(event) {
  const trigger = event.target instanceof HTMLElement ? event.target.closest(".header-help[data-tooltip]") : null;
  if (!(trigger instanceof HTMLElement)) {
    return;
  }

  state.activeHeaderTooltipTrigger = trigger;
  showHeaderTooltip(trigger);
  positionHeaderTooltip(trigger);
}

function handleHeaderTooltipPointerMove(event) {
  const trigger = event.target instanceof HTMLElement ? event.target.closest(".header-help[data-tooltip]") : null;
  if (!(trigger instanceof HTMLElement) || elements.headerTooltip?.hidden) {
    return;
  }

  positionHeaderTooltip(trigger);
}

function handleHeaderTooltipPointerLeave(event) {
  const from = event.target instanceof HTMLElement ? event.target.closest(".header-help[data-tooltip]") : null;
  const to = event.relatedTarget instanceof HTMLElement ? event.relatedTarget.closest(".header-help[data-tooltip]") : null;
  const movingToTooltip = event.relatedTarget instanceof HTMLElement && !!event.relatedTarget.closest(".floating-tooltip");
  if (from && !to && !movingToTooltip) {
    hideHeaderTooltip();
  }
}

function handleHeaderTooltipFocus(event) {
  const trigger = event.target instanceof HTMLElement ? event.target.closest(".header-help[data-tooltip]") : null;
  if (!(trigger instanceof HTMLElement)) {
    return;
  }

  showHeaderTooltip(trigger);
  positionHeaderTooltip(trigger);
}

function handleHeaderTooltipBlur(event) {
  const trigger = event.target instanceof HTMLElement ? event.target.closest(".header-help[data-tooltip]") : null;
  const movingToTooltip = event.relatedTarget instanceof HTMLElement && !!event.relatedTarget.closest(".floating-tooltip");
  if (trigger && !movingToTooltip) {
    hideHeaderTooltip();
  }
}

function showHeaderTooltip(trigger) {
  if (!(elements.headerTooltip instanceof HTMLElement) || !(trigger instanceof HTMLElement)) {
    return;
  }

  elements.headerTooltip.dataset.hovering = "false";
  elements.headerTooltip.textContent = trigger.dataset.tooltip || "";
  elements.headerTooltip.dataset.placement = "bottom";
  elements.headerTooltip.hidden = !elements.headerTooltip.textContent;
}

function hideHeaderTooltip() {
  if (!(elements.headerTooltip instanceof HTMLElement)) {
    return;
  }

  if (elements.headerTooltip.dataset.hovering === "true") {
    return;
  }

  elements.headerTooltip.hidden = true;
  elements.headerTooltip.textContent = "";
  elements.headerTooltip.removeAttribute("data-placement");
  elements.headerTooltip.dataset.hovering = "false";
  state.activeHeaderTooltipTrigger = null;
}

function positionHeaderTooltip(trigger) {
  if (!(elements.headerTooltip instanceof HTMLElement) || !(trigger instanceof HTMLElement) || elements.headerTooltip.hidden) {
    return;
  }

  const rect = trigger.getBoundingClientRect();
  const tipRect = elements.headerTooltip.getBoundingClientRect();
  const gap = 12;
  const maxLeft = window.innerWidth - tipRect.width - 12;
  const centerX = rect.left + (rect.width / 2);
  const preferredLeft = centerX - (tipRect.width / 2);
  const left = Math.min(Math.max(12, preferredLeft), Math.max(12, maxLeft));
  const placeAbove = rect.top - tipRect.height - gap > 12;
  const top = placeAbove ? rect.top - tipRect.height - gap : rect.bottom + gap;
  const arrowLeft = Math.min(Math.max(centerX - left, 16), tipRect.width - 16);

  elements.headerTooltip.dataset.placement = placeAbove ? "top" : "bottom";
  elements.headerTooltip.style.setProperty("--tooltip-arrow-left", `${Math.round(arrowLeft)}px`);

  elements.headerTooltip.style.left = `${Math.round(left)}px`;
  elements.headerTooltip.style.top = `${Math.round(top)}px`;
}