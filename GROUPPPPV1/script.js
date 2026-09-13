/**
 * LifeBoard - Personalized Productivity Dashboard
 * Powered by jQuery UI Sortable
 */

const App = {
  state: {
    history: [],
    redoStack: [],
    selectedWidgetId: null,
    isPreview: false,
  },

  // 1. Widget Definitions & Factories
  widgets: {
    todo: {
      title: "To-Do List",
      html: `
                <div class="w-todo" style="height:100%; display:flex; flex-direction:column;">
                    <input type="text" class="todo-input" placeholder="Add a task... (Press Enter)">
                    <ul class="todo-list"></ul>
                </div>`,
      init: function ($el) {
        const $input = $el.find(".todo-input");
        const $list = $el.find(".todo-list");

        $input.off("keypress").on("keypress", function (e) {
          if (e.key === "Enter" && this.value.trim() !== "") {
            $list.append(
              `<li><input type="checkbox"> <span>${this.value}</span> <i class="ph ph-x del-todo"></i></li>`,
            );
            this.value = "";
            App.debounceSave();
          }
        });

        $list.off("change").on("change", 'input[type="checkbox"]', function () {
          $(this).parent().toggleClass("done", this.checked);
          App.debounceSave();
        });

        $list.off("click").on("click", ".del-todo", function () {
          $(this).parent().remove();
          App.debounceSave();
        });
      },
    },
    pomodoro: {
      title: "Pomodoro Timer",
      html: `
                <div class="w-pomodoro">
                    <div class="pomo-time">25:00</div>
                    <div class="pomo-controls">
                        <button class="btn-play"><i class="ph ph-play"></i></button>
                        <button class="btn-pause"><i class="ph ph-pause"></i></button>
                        <button class="btn-reset"><i class="ph ph-arrow-counter-clockwise"></i></button>
                    </div>
                </div>`,
      init: function ($el) {
        let time = 1500; // 25 min
        let interval = null;
        const $time = $el.find(".pomo-time");

        const format = (t) => {
          const m = Math.floor(t / 60)
            .toString()
            .padStart(2, "0");
          const s = (t % 60).toString().padStart(2, "0");
          return `${m}:${s}`;
        };

        $el
          .find(".btn-play")
          .off("click")
          .on("click", () => {
            if (!interval)
              interval = setInterval(() => {
                if (time > 0) {
                  time--;
                  $time.text(format(time));
                } else clearInterval(interval);
              }, 1000);
          });
        $el
          .find(".btn-pause")
          .off("click")
          .on("click", () => {
            clearInterval(interval);
            interval = null;
          });
        $el
          .find(".btn-reset")
          .off("click")
          .on("click", () => {
            clearInterval(interval);
            interval = null;
            time = 1500;
            $time.text(format(time));
          });
      },
    },
    notes: {
      title: "Quick Notes",
      html: `<div class="w-notes" style="height:100%;"><textarea placeholder="Jot down your thoughts..."></textarea></div>`,
      init: function ($el) {
        $el.find("textarea").off("input").on("input", App.debounceSave);
      },
    },
    clock: {
      title: "Local Time",
      html: `
                <div class="w-clock">
                    <div class="time">00:00</div>
                    <div class="date">Loading...</div>
                </div>`,
      init: function ($el) {
        const update = () => {
          const now = new Date();
          $el.find(".time").text(
            now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          $el.find(".date").text(
            now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            }),
          );
        };
        update();
        $el.data("interval", setInterval(update, 1000));
      },
      destroy: function ($el) {
        clearInterval($el.data("interval"));
      },
    },
    goals: {
      title: "Daily Goals",
      html: `
                <div class="w-todo" style="height:100%; display:flex; flex-direction:column;">
                    <ul class="todo-list" style="margin-top:10px;">
                        <li><input type="checkbox"> <span>Exercise 30 mins</span></li>
                        <li><input type="checkbox"> <span>Read 1 chapter</span></li>
                        <li><input type="checkbox"> <span>Drink 2L water</span></li>
                    </ul>
                </div>`,
      init: function ($el) {
        $el.find('input[type="checkbox"]').on("change", function () {
          $(this).parent().toggleClass("done", this.checked);
          App.debounceSave();
        });
      },
    },
  },

  // 2. Initialization
  init: function () {
    this.cacheDOM();
    this.bindEvents();
    this.initSortable();
    this.loadWorkspace();
  },

  cacheDOM: function () {
    this.$board = $("#board-canvas");
    this.$empty = $(".empty-state");
    this.$inspector = $(".inspector-content");
  },

  bindEvents: function () {
    // UI Toggles (Sidebars & Floating Buttons)
    $(".toggle-sidebar, .floating-toggle").click(function () {
      const targetId = $(this).data("target");
      const $target = $("#" + targetId);

      $target.toggleClass("collapsed");

      // Add a class to the body so CSS knows to show the floating buttons
      if (targetId === "sidebar-left") {
        $("body").toggleClass("left-collapsed", $target.hasClass("collapsed"));
      } else if (targetId === "sidebar-right") {
        $("body").toggleClass("right-collapsed", $target.hasClass("collapsed"));
      }
    });

    $("#btn-preview").click(() => this.togglePreview());
    $("#btn-save").click(() => {
      this.saveToLocal();
      this.showToast("Workspace Saved");
    });
    $("#btn-undo").click(() => this.undo());
    $("#btn-redo").click(() => this.redo());

    // Command Palette
    $("#btn-cmd").click(() =>
      $("#cmd-modal").addClass("active").find("input").focus(),
    );
    $(".modal-overlay").click(function (e) {
      if (e.target === this) $(this).removeClass("active");
    });
    $(".btn-close-modal").click(function () {
      $(this).closest(".modal-overlay").removeClass("active");
    });

    $("#cmd-input").on("input", function () {
      const val = this.value.toLowerCase();
      $(".cmd-list li").each(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
      });
    });
    $(".cmd-list li").click(function () {
      $("#cmd-modal").removeClass("active");
      const action = $(this).data("action");
      if (action === "save") {
        App.saveToLocal();
        App.showToast("Saved");
      }
      if (action === "preview") App.togglePreview();
      if (action === "templates") $("#templates-modal").addClass("active");
      if (action === "clear") {
        App.$board.empty();
        App.checkEmpty();
        App.saveState(true);
      }
    });

    // Templates
    $("#btn-templates, #btn-empty-template").click(() =>
      $("#templates-modal").addClass("active"),
    );
    $(".template-card").click(function () {
      $("#templates-modal").removeClass("active");
      App.loadTemplate($(this).data("template"));
    });

    // Sections
    $("#btn-add-section").click(() => {
      this.addSection("New Section");
      this.saveState(true);
    });

    this.$board.on("click", ".section-delete", function () {
      $(this).closest(".board-section").remove();
      App.checkEmpty();
      App.saveState(true);
    });

    // Widget Selection & Deletion
    this.$board.on("click", ".widget-card", (e) => {
      if ($(e.target).is("button, input, textarea, i, .widget-actions")) return;
      this.selectWidget($(e.currentTarget).attr("id"));
    });

    this.$board.on("click", ".widget-actions", (e) => {
      e.stopPropagation();
      this.deleteWidget($(e.currentTarget).closest(".widget-card").attr("id"));
    });

    $("#btn-delete-widget").click(() => {
      if (this.state.selectedWidgetId)
        this.deleteWidget(this.state.selectedWidgetId);
    });

    // Inspector Tabs
    $(".tab-btn").click(function () {
      $(".tab-btn").removeClass("active");
      $(".tab-pane").removeClass("active");
      $(this).addClass("active");
      $("#tab-" + $(this).data("tab")).addClass("active");
    });

    // Inspector Bindings (Live Edit)
    $("#prop-title").on("input", function () {
      App.updateSelected(".widget-title", "text", this.value);
    });
    $("#prop-bg").on("input", function () {
      App.updateSelectedStyle("background-color", this.value);
    });
    $("#prop-radius").on("input", function () {
      App.updateSelectedStyle("border-radius", this.value + "px");
      $("#val-radius").text(this.value + "px");
    });
    $("#prop-width").on("change", function () {
      App.updateSelectedStyle(
        "width",
        this.value === "100%" ? "100%" : `calc(${this.value} - 10px)`,
      );
    });

    // Effects
    $("#eff-glass").change(function () {
      App.toggleSelectedClass("fx-glass", this.checked);
    });
    $("#eff-neon").change(function () {
      App.toggleSelectedClass("fx-neon", this.checked);
    });
    $("#eff-float").change(function () {
      App.toggleSelectedClass("fx-float", this.checked);
    });

    // Global Keys
    $(document).keydown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        $("#btn-cmd").click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        $("#btn-save").click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        this.redo();
      }
      if (e.key === "Escape") $(".modal-overlay").removeClass("active");
    });
  },

  // 3. Drag and Drop Architecture (jQuery UI Sortable)
  initSortable: function () {
    const self = this;

    // 1. Make Library Items Draggable
    $(".library-item").draggable({
      connectToSortable: ".board-section",
      helper: "clone",
      revert: "invalid",
      appendTo: "body",
      start: function (e, ui) {
        ui.helper.css({ width: "300px", zIndex: 1000 });
      },
    });

    // 2. Make Sections Sortable (to receive widgets AND reorder widgets)
    this.initSectionSortable($(".board-section"));

    // 3. Make Board Sortable (to reorder sections themselves)
    this.$board.sortable({
      axis: "y",
      handle: ".board-section-header",
      tolerance: "pointer",
      placeholder: "ui-sortable-placeholder",
      start: function (e, ui) {
        ui.placeholder.height(ui.item.height());
      },
      stop: function () {
        self.saveState(true);
      },
    });
  },

  initSectionSortable: function ($el) {
    const self = this;
    $el.sortable({
      connectWith: ".board-section",
      handle: ".widget-drag-handle",
      placeholder: "ui-sortable-placeholder",
      tolerance: "pointer",
      start: function (e, ui) {
        ui.placeholder.height(ui.helper.outerHeight());
        ui.placeholder.width(ui.helper.outerWidth());
      },
      receive: function (e, ui) {
        // If it's a template from the library, build the real widget
        if (ui.item.hasClass("library-item")) {
          const type = ui.item.data("type");
          // Fallback to 'todo' if type doesn't exist yet
          const actualType = self.widgets[type] ? type : "todo";
          const $newWidget = self.buildWidgetDOM(actualType);

          // Replace jQuery UI clone with actual widget
          $(this).find(".library-item.ui-draggable").replaceWith($newWidget);

          self.checkEmpty();
          self.saveState(true);
          self.showToast("Widget added");
        }
      },
      update: function (e, ui) {
        // Fire save only if it's not a library item (handled in receive)
        if (!ui.item.hasClass("library-item") && this === ui.item.parent()[0]) {
          self.saveState(true);
        }
      },
    });
  },

  addSection: function (name) {
    const id = "sec-" + Math.random().toString(36).substr(2, 9);
    const $sec = $(`
            <div class="board-section" id="${id}">
                <div class="board-section-header">
                    <i class="ph ph-dots-six-vertical" style="cursor:grab;"></i>
                    <input type="text" value="${name}">
                    <i class="ph ph-x section-delete"></i>
                </div>
            </div>
        `);
    this.$board.append($sec);
    this.initSectionSortable($sec);

    // Save on name change
    $sec.find("input").on("blur", () => this.saveState(true));
    this.checkEmpty();
    return $sec;
  },

  // 4. Widget Rendering
  buildWidgetDOM: function (type, idOverride = null, config = null) {
    const def = this.widgets[type];
    const id = idOverride || "w-" + Math.random().toString(36).substr(2, 9);
    const title = config?.title || def.title;
    const style = config?.style || "";
    const classes = config?.classes || "widget-card";
    const innerHtml = config?.html || def.html;

    const html = `
            <div class="${classes}" id="${id}" data-type="${type}" style="${style}">
                <div class="widget-header">
                    <div class="widget-drag-handle tooltip" data-tooltip="Drag to move"><i class="ph ph-dots-six-vertical"></i></div>
                    <div class="widget-title">${title}</div>
                    <div class="widget-actions tooltip" data-tooltip="Delete"><i class="ph ph-trash"></i></div>
                </div>
                <div class="widget-content">
                    ${innerHtml}
                </div>
            </div>
        `;
    const $el = $(html);
    if (def.init) setTimeout(() => def.init($el), 0);
    return $el;
  },

  deleteWidget: function (id) {
    const $el = $("#" + id);
    const type = $el.data("type");
    if (this.widgets[type]?.destroy) this.widgets[type].destroy($el);

    $el.css({ transform: "scale(0.8)", opacity: 0 });
    setTimeout(() => {
      $el.remove();
      if (this.state.selectedWidgetId === id) this.clearSelection();
      this.checkEmpty();
      this.saveState(true);
    }, 200);
  },

  // 5. Inspector / Meta Logic
  selectWidget: function (id) {
    $(".widget-card").removeClass("selected");
    const $el = $("#" + id);
    $el.addClass("selected");
    this.state.selectedWidgetId = id;

    $(".inspector-empty").hide();
    $(".tab-pane").css("display", ""); // Use stylesheet rules

    // Populate inputs
    $("#prop-title").val($el.find(".widget-title").text());

    const rgb2hex = (rgb) => {
      if (!rgb || rgb.indexOf("rgb") === -1) return "#121212";
      const m = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
      if (m)
        return (
          "#" +
          ("0" + parseInt(m[1], 10).toString(16)).slice(-2) +
          ("0" + parseInt(m[2], 10).toString(16)).slice(-2) +
          ("0" + parseInt(m[3], 10).toString(16)).slice(-2)
        );
      return rgb;
    };
    $("#prop-bg").val(rgb2hex($el.css("background-color")));

    const w = $el[0].style.width;
    if (w === "100%") $("#prop-width").val("100%");
    else if (w.includes("33")) $("#prop-width").val("33.33%");
    else $("#prop-width").val("50%");

    $("#eff-glass").prop("checked", $el.hasClass("fx-glass"));
    $("#eff-neon").prop("checked", $el.hasClass("fx-neon"));
    $("#eff-float").prop("checked", $el.hasClass("fx-float"));

    $("#meta-id").text(id);
    $("#meta-type").text($el.data("type").toUpperCase());
    $("#meta-created").text(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  },

  clearSelection: function () {
    $(".widget-card").removeClass("selected");
    this.state.selectedWidgetId = null;
    $(".inspector-empty").show();
    $(".tab-pane").hide();
  },

  updateSelected: function (selector, prop, val) {
    if (!this.state.selectedWidgetId) return;
    if (prop === "text")
      $("#" + this.state.selectedWidgetId)
        .find(selector)
        .text(val);
    this.debounceSave();
  },
  updateSelectedStyle: function (prop, val) {
    if (!this.state.selectedWidgetId) return;
    $("#" + this.state.selectedWidgetId).css(prop, val);
    this.debounceSave();
  },
  toggleSelectedClass: function (cls, state) {
    if (!this.state.selectedWidgetId) return;
    $("#" + this.state.selectedWidgetId).toggleClass(cls, state);
    this.saveState(true);
  },

  // 6. Data Persistence (State machine)
  getDOMState: function () {
    const layout = [];
    this.$board.find(".board-section").each(function () {
      const $sec = $(this);
      const widgets = [];

      $sec.find(".widget-card").each(function () {
        const $w = $(this);
        // Synchronize inputs/textareas to HTML attributes for pure DOM cloning
        $w.find('input[type="text"]').each(function () {
          $(this).attr("value", this.value);
        });
        $w.find('input[type="checkbox"]').each(function () {
          if (this.checked) $(this).attr("checked", "checked");
          else $(this).removeAttr("checked");
        });
        $w.find("textarea").each(function () {
          $(this).text(this.value);
        });

        widgets.push({
          id: this.id,
          type: $w.data("type"),
          title: $w.find(".widget-title").text(),
          classes: $w.attr("class").replace("selected", "").trim(),
          style: $w.attr("style"),
          html: $w.find(".widget-content").html(),
        });
      });

      layout.push({
        id: this.id,
        name: $sec.find("input").val(),
        widgets: widgets,
      });
    });

    return {
      name: $("#current-board-name").text(),
      layout: layout,
    };
  },

  timer: null,
  debounceSave: function () {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => App.saveState(true), 1000);
  },

  saveState: function (push = false) {
    const s = JSON.stringify(this.getDOMState());
    if (
      push &&
      (this.state.history.length === 0 ||
        this.state.history[this.state.history.length - 1] !== s)
    ) {
      this.state.history.push(s);
      if (this.state.history.length > 30) this.state.history.shift();
      this.state.redoStack = [];
    }
  },

  saveToLocal: function () {
    localStorage.setItem("lifeboard_state", JSON.stringify(this.getDOMState()));
  },

  loadWorkspace: function (stateObj = null) {
    let state = stateObj;
    if (!state) {
      const saved = localStorage.getItem("lifeboard_state");
      if (saved)
        try {
          state = JSON.parse(saved);
        } catch (e) {}
    }

    // Clean up intervals
    this.$board.find(".widget-card").each((i, el) => {
      const t = $(el).data("type");
      if (this.widgets[t]?.destroy) this.widgets[t].destroy($(el));
    });

    this.$board.empty();

    if (state && state.layout && state.layout.length > 0) {
      $("#current-board-name").text(state.name || "My Workspace");
      state.layout.forEach((sec) => {
        const $s = this.addSection(sec.name);
        sec.widgets.forEach((w) => {
          $s.append(this.buildWidgetDOM(w.type, w.id, w));
        });
      });
    }

    this.checkEmpty();
    this.saveState(true); // Base history state
  },

  undo: function () {
    if (this.state.history.length > 1) {
      const curr = this.state.history.pop();
      this.state.redoStack.push(curr);
      const prev = this.state.history[this.state.history.length - 1];
      this.loadWorkspace(JSON.parse(prev));
      this.state.history.pop(); // loader pushes state, prevent double
      this.showToast("Undo performed");
    }
  },
  redo: function () {
    if (this.state.redoStack.length > 0) {
      const next = this.state.redoStack.pop();
      this.loadWorkspace(JSON.parse(next));
      this.showToast("Redo performed");
    }
  },

  // 7. Utils
  checkEmpty: function () {
    if (this.$board.children(".board-section").length === 0) {
      this.$empty.removeClass("hidden");
    } else {
      this.$empty.addClass("hidden");
    }
  },

  togglePreview: function () {
    this.state.isPreview = !this.state.isPreview;
    if (this.state.isPreview) {
      $("body").addClass("preview-mode");
      this.clearSelection();
      this.$board.sortable("disable");
      $(".board-section").sortable("disable");
      this.showToast("Preview Mode ON", "ph-play");
    } else {
      $("body").removeClass("preview-mode");
      this.$board.sortable("enable");
      $(".board-section").sortable("enable");
      this.showToast("Edit Mode ON", "ph-pencil");
    }
  },

  loadTemplate: function (type) {
    this.$board.empty();
    if (type === "student") {
      const $s1 = this.addSection("Focus");
      $s1.append(this.buildWidgetDOM("pomodoro"));
      $s1.append(this.buildWidgetDOM("clock"));
      const $s2 = this.addSection("Organization");
      $s2.append(this.buildWidgetDOM("todo"));
      $s2.append(this.buildWidgetDOM("notes"));
    } else if (type === "productivity") {
      const $s1 = this.addSection("Today");
      $s1.append(
        this.buildWidgetDOM("goals", null, { classes: "widget-card fx-glass" }),
      );
      $s1.append(this.buildWidgetDOM("clock"));
      const $s2 = this.addSection("Inbox");
      $s2.append(this.buildWidgetDOM("todo"));
    } else {
      this.addSection("New Section");
    }

    this.saveState(true);
    this.saveToLocal();
    this.showToast("Template applied");
  },

  showToast: function (msg, icon = "ph-check-circle") {
    const $t = $(
      `<div class="toast"><i class="ph ${icon}"></i> <span>${msg}</span></div>`,
    );
    $("#toast-container").append($t);
    setTimeout(() => {
      $t.css("opacity", 0);
      setTimeout(() => $t.remove(), 300);
    }, 2500);
  },
};

$(document).ready(() => {
  App.init();

  // Deselect on bg click
  $("#workspace").on("click", function (e) {
    if (e.target === this || $(e.target).hasClass("workspace-bg")) {
      App.clearSelection();
    }
  });
});
