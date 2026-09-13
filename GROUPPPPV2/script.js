/* =====================================================================
   LIFEBOARD — application script
   Vanilla JS + jQuery + jQuery UI Sortable. No frameworks.
===================================================================== */
(function(){
"use strict";

var STORAGE_KEY = "lifeboard_state_v2";
var HISTORY_LIMIT = 40;

/* ---------------------------------------------------------------------
   WIDGET CATALOG — definitions grouped by category.
   engine = which rendering/behavior engine powers this widget type.
--------------------------------------------------------------------- */
var CATEGORIES = [
  {key:"productivity", label:"Productivity", icon:"📋"},
  {key:"planning",     label:"Planning",     icon:"📅"},
  {key:"study",        label:"Study",        icon:"🎓"},
  {key:"analytics",    label:"Analytics",    icon:"📊"},
  {key:"utilities",    label:"Utilities",    icon:"🛠"},
  {key:"information",  label:"Information",  icon:"📝"}
];

var WIDGET_DEFS = [
  // PRODUCTIVITY
  {type:"todo",         engine:"list",    category:"productivity", title:"To-do List",     icon:"✓", span:1, height:"md", data:{items:[], showPriority:true,  showDeadline:true,  showProgress:false}},
  {type:"dailygoals",   engine:"list",    category:"productivity", title:"Daily Goals",     icon:"🎯", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},
  {type:"weeklygoals",  engine:"list",    category:"productivity", title:"Weekly Goals",    icon:"🗓", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},
  {type:"habits",       engine:"habit",   category:"productivity", title:"Habit Tracker",   icon:"🔥", span:2, height:"md", data:{habits:[]}},
  {type:"priority",     engine:"list",    category:"productivity", title:"Priority List",   icon:"⚑", span:1, height:"md", data:{items:[], showPriority:true,  showDeadline:false, showProgress:false}},
  {type:"quicknotes",   engine:"notes",   category:"productivity", title:"Quick Notes",     icon:"📝", span:1, height:"md", data:{text:""}},
  {type:"checklist",    engine:"list",    category:"productivity", title:"Checklist",       icon:"☑", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:false}},
  {type:"progresstrk",  engine:"list",    category:"productivity", title:"Progress Tracker",icon:"📈", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},

  // PLANNING
  {type:"calendar",     engine:"calendar",category:"planning", title:"Calendar",          icon:"📅", span:2, height:"lg", data:{events:{}}},
  {type:"schedule",     engine:"schedule",category:"planning", title:"Today's Schedule",  icon:"🕐", span:1, height:"md", data:{items:[]}},
  {type:"events",       engine:"schedule",category:"planning", title:"Upcoming Events",   icon:"📌", span:1, height:"md", data:{items:[]}},
  {type:"countdown",    engine:"countdown",category:"planning", title:"Countdown",        icon:"⏳", span:1, height:"sm", data:{target:"", label:"Big day"}},
  {type:"deadlines",    engine:"list",    category:"planning", title:"Deadline Tracker",  icon:"⏰", span:1, height:"md", data:{items:[], showPriority:true, showDeadline:true, showProgress:false}},
  {type:"weeklyplan",   engine:"schedule",category:"planning", title:"Weekly Planner",    icon:"🗂", span:2, height:"md", data:{items:[]}},

  // STUDY
  {type:"studytimer",   engine:"pomodoro",category:"study", title:"Study Timer",       icon:"⏱", span:1, height:"md", data:{work:50, brk:10, phase:"work", remaining:50*60, running:false, lastTick:null}},
  {type:"pomodoro",     engine:"pomodoro",category:"study", title:"Pomodoro",          icon:"🍅", span:1, height:"md", data:{work:25, brk:5, phase:"work", remaining:25*60, running:false, lastTick:null}},
  {type:"subjects",     engine:"list",    category:"study", title:"Subject Tracker",   icon:"📚", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},
  {type:"assignments",  engine:"list",    category:"study", title:"Assignment Tracker",icon:"📄", span:1, height:"md", data:{items:[], showPriority:true, showDeadline:true, showProgress:false}},
  {type:"examcountdown",engine:"countdown",category:"study", title:"Exam Countdown",   icon:"🧪", span:1, height:"sm", data:{target:"", label:"Next exam"}},
  {type:"studyprogress",engine:"list",    category:"study", title:"Study Progress",    icon:"📖", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},
  {type:"gpa",          engine:"grades",  category:"study", title:"Grade Tracker",     icon:"🎓", span:1, height:"md", data:{courses:[]}},
  {type:"studynotes",   engine:"notes",   category:"study", title:"Study Notes",       icon:"🖋", span:1, height:"md", data:{text:""}},

  // ANALYTICS
  {type:"prodscore",    engine:"score",    category:"analytics", title:"Productivity Score", icon:"⚡", span:1, height:"md", data:{}},
  {type:"weeklyactivity",engine:"activity",category:"analytics", title:"Weekly Activity",    icon:"📶", span:1, height:"md", data:{}},
  {type:"goalcompletion",engine:"list",    category:"analytics", title:"Goal Completion",    icon:"✅", span:1, height:"md", data:{items:[], showPriority:false, showDeadline:false, showProgress:true}},
  {type:"studyhours",   engine:"counter",  category:"analytics", title:"Study Hours",        icon:"⏳", span:1, height:"md", data:{unit:"min", log:{}}},
  {type:"habitstreak",  engine:"streak",   category:"analytics", title:"Habit Streak",       icon:"🔥", span:1, height:"sm", data:{}},

  // UTILITIES
  {type:"calculator",   engine:"calculator",category:"utilities", title:"Calculator",       icon:"🧮", span:1, height:"lg", data:{}},
  {type:"stopwatch",    engine:"stopwatch", category:"utilities", title:"Stopwatch",        icon:"⏲", span:1, height:"sm", data:{elapsed:0, running:false, lastTick:null}},
  {type:"timer",        engine:"timer",     category:"utilities", title:"Timer",            icon:"⏱", span:1, height:"sm", data:{minutes:10, remaining:600, running:false, lastTick:null}},
  {type:"clock",        engine:"clock",     category:"utilities", title:"Clock",            icon:"🕐", span:1, height:"sm", data:{}},
  {type:"worldclock",   engine:"worldclock",category:"utilities", title:"World Clock",      icon:"🌍", span:1, height:"md", data:{zones:[{city:"New York", tz:"America/New_York"},{city:"London", tz:"Europe/London"},{city:"Tokyo", tz:"Asia/Tokyo"}]}},
  {type:"unitconv",     engine:"unitconv",  category:"utilities", title:"Unit Converter",   icon:"🔁", span:1, height:"md", data:{kind:"length", from:0}},
  {type:"colorpicker",  engine:"color",     category:"utilities", title:"Color Picker",     icon:"🎨", span:1, height:"sm", data:{color:"#8B7CFA"}},
  {type:"password",     engine:"password",  category:"utilities", title:"Password Generator",icon:"🔑", span:1, height:"sm", data:{length:16, symbols:true, numbers:true}},
  {type:"qrgen",        engine:"qr",        category:"utilities", title:"QR Generator",     icon:"▦", span:1, height:"md", data:{text:"https://lifeboard.app"}},

  // INFORMATION
  {type:"quote",        engine:"quote",    category:"information", title:"Quote of the Day", icon:"❝", span:1, height:"sm", data:{}},
  {type:"weather",      engine:"weather",  category:"information", title:"Weather",          icon:"⛅", span:1, height:"sm", data:{city:"Quezon City"}},
  {type:"news",         engine:"news",     category:"information", title:"News",             icon:"📰", span:1, height:"md", data:{}},
  {type:"quicklinks",   engine:"links",    category:"information", title:"Quick Links",      icon:"🔗", span:1, height:"md", data:{items:[]}},
  {type:"bookmarks",    engine:"links",    category:"information", title:"Bookmarks",        icon:"⭐", span:1, height:"md", data:{items:[]}},
  {type:"customtext",   engine:"info",     category:"information", title:"Custom Text",      icon:"✎", span:1, height:"sm", data:{text:"Write anything here — a reminder, an address, a plan."}},
  {type:"importantinfo",engine:"info",     category:"information", title:"Important Info",   icon:"❗", span:1, height:"sm", data:{text:"Emergency contact, WiFi password, or anything you don't want to lose."}}
];
var DEFS_BY_TYPE = {};
WIDGET_DEFS.forEach(function(d){ DEFS_BY_TYPE[d.type] = d; });

/* ---------------------------------------------------------------------
   TEMPLATES
--------------------------------------------------------------------- */
var TEMPLATES = {
  student: {name:"Student", desc:"Tasks, class schedule, pomodoro, assignments and notes.", sections:[
    {name:"Today", widgets:["todo","clock","schedule"]},
    {name:"School", widgets:["assignments","pomodoro","studynotes"]}
  ]},
  productivity: {name:"Productivity", desc:"Goals, tasks, habits and a live analytics view.", sections:[
    {name:"Focus", widgets:["dailygoals","todo","habits"]},
    {name:"Analytics", widgets:["prodscore","weeklyactivity"]}
  ]},
  minimal: {name:"Minimal", desc:"Just the essentials — clock, tasks, notes.", sections:[
    {name:"Today", widgets:["clock","todo","quicknotes"]}
  ]},
  developer: {name:"Developer", desc:"Tasks, notes, utilities and a meta-friendly layout.", sections:[
    {name:"Work", widgets:["todo","quicknotes"]},
    {name:"Utilities", widgets:["calculator","password","qrgen"]}
  ]},
  personal: {name:"Personal", desc:"Calendar, habits, goals and notes for everyday life.", sections:[
    {name:"Life", widgets:["calendar","habits","dailygoals"]},
    {name:"Notes", widgets:["quicknotes","quote"]}
  ]},
  blank: {name:"Blank Workspace", desc:"Start from nothing and build it your way.", sections:[
    {name:"My Section", widgets:[]}
  ]}
};

/* ---------------------------------------------------------------------
   UTILITIES
--------------------------------------------------------------------- */
function uid(prefix){ return (prefix||"id") + "_" + Math.random().toString(36).slice(2,9); }
function nowISO(){ return new Date().toISOString(); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function pad(n){ return n<10 ? "0"+n : ""+n; }
function fmtTime(d){ var h=d.getHours(),m=d.getMinutes(),s=d.getSeconds(); var ap= h>=12?"PM":"AM"; var h12=h%12; if(h12===0)h12=12; return pad(h12)+":"+pad(m)+":"+pad(s)+" "+ap; }
function fmtHM(totalSeconds){ totalSeconds = Math.max(0,Math.round(totalSeconds)); var m=Math.floor(totalSeconds/60), s=totalSeconds%60; return pad(m)+":"+pad(s); }
function escapeHtml(str){ return (str==null?"":String(str)).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function dayKey(d){ d=d||new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function weekdayShort(i){ return ["S","M","T","W","T","F","S"][i]; }
function toast(msg, type){
  var $t = $("#toast");
  $t.removeClass("hidden success").attr("class","toast").addClass(type||"").text(msg).removeClass("hidden");
  clearTimeout(toast._h);
  toast._h = setTimeout(function(){ $t.addClass("hidden"); }, 2200);
}

/* ---------------------------------------------------------------------
   STATE
--------------------------------------------------------------------- */
var state = null;
var history = [];
var future = [];
var selectedWidgetId = null;
var draggingLibType = null;

function freshDashboard(name, templateKey){
  var tpl = TEMPLATES[templateKey] || TEMPLATES.blank;
  var dash = {id: uid("dash"), name: name || tpl.name, sections: []};
  tpl.sections.forEach(function(sec){
    var section = {id: uid("sec"), name: sec.name, collapsed:false, widgets: []};
    sec.widgets.forEach(function(t){ section.widgets.push(makeWidget(t)); });
    dash.sections.push(section);
  });
  return dash;
}

function makeWidget(type){
  var def = DEFS_BY_TYPE[type];
  if(!def) return null;
  var ts = nowISO();
  return {
    id: uid("w"),
    type: type,
    engine: def.engine,
    category: def.category,
    icon: def.icon,
    title: def.title,
    size: {span: def.span, height: def.height},
    style: {bg:"", radius:"md", shadow:true, opacity:100, font:"body", fontSize:"md", align:"left",
            fx:{glow:false, glass:false, gradient:false, float:false, entrance:true}},
    data: clone(def.data),
    createdAt: ts,
    modifiedAt: ts
  };
}

function defaultState(){
  var d1 = freshDashboard("My Dashboard", "productivity");
  var d2 = freshDashboard("My School", "student");
  return {
    dashboards: [d1, d2],
    activeId: d1.id,
    mode: "edit",
    meta: false,
    sidebarCollapsed: false
  };
}

function loadState(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ state = JSON.parse(raw); return; }
  }catch(e){ /* fall through */ }
  state = defaultState();
}
function saveState(silent){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  if(!silent) flashSaveBtn();
}
function flashSaveBtn(){
  var $b = $("#btnSave");
  $b.text("Saved");
  clearTimeout(flashSaveBtn._h);
  flashSaveBtn._h = setTimeout(function(){ $b.text("Save"); }, 900);
}
function getActiveDash(){
  for(var i=0;i<state.dashboards.length;i++) if(state.dashboards[i].id===state.activeId) return state.dashboards[i];
  return state.dashboards[0];
}
function getSection(sectionId){
  var dash = getActiveDash();
  for(var i=0;i<dash.sections.length;i++) if(dash.sections[i].id===sectionId) return dash.sections[i];
  return null;
}
function findWidget(widgetId){
  var dash = getActiveDash();
  for(var i=0;i<dash.sections.length;i++){
    var sec = dash.sections[i];
    for(var j=0;j<sec.widgets.length;j++) if(sec.widgets[j].id===widgetId) return {widget:sec.widgets[j], section:sec};
  }
  return null;
}

/* ---------------------------------------------------------------------
   HISTORY (undo / redo) — snapshots of the active dashboard's sections
--------------------------------------------------------------------- */
function snapshot(){
  var dash = getActiveDash();
  return {dashId: dash.id, sections: clone(dash.sections)};
}
function pushHistory(){
  history.push(snapshot());
  if(history.length>HISTORY_LIMIT) history.shift();
  future = [];
}
function undo(){
  if(!history.length){ toast("Nothing to undo"); return; }
  var dash = getActiveDash();
  future.push(snapshot());
  var snap = history.pop();
  if(snap.dashId===dash.id) dash.sections = snap.sections;
  saveState(); renderAll(); toast("Undid last change");
}
function redo(){
  if(!future.length){ toast("Nothing to redo"); return; }
  var dash = getActiveDash();
  history.push(snapshot());
  var snap = future.pop();
  if(snap.dashId===dash.id) dash.sections = snap.sections;
  saveState(); renderAll(); toast("Redid change");
}

/* ---------------------------------------------------------------------
   BOOT
--------------------------------------------------------------------- */
$(function(){
  loadState();
  buildWidgetLibrary();
  renderAll();
  bindGlobalUI();
  buildCommandList();
  startTicker();
  updateGreeting();
});

/* =====================================================================
   RENDERING
===================================================================== */
function renderAll(){
  $("#app").toggleClass("sidebar-collapsed", !!state.sidebarCollapsed);
  $("#app").removeClass("mode-edit mode-preview").addClass("mode-"+state.mode);
  $(".mode-opt").removeClass("active").filter("[data-mode='"+state.mode+"']").addClass("active");
  $("#app").toggleClass("meta-on", !!state.meta);
  $("#btnMeta").toggleClass("on", !!state.meta);
  renderDashSwitcher();
  renderSectionList();
  updateGreeting();
}

function updateGreeting(){
  var h = new Date().getHours();
  var g = h<5 ? "Still up?" : h<12 ? "Good morning." : h<18 ? "Good afternoon." : "Good evening.";
  $("#greeting").text(g);
  var d = new Date();
  var opts = {weekday:"long", month:"long", day:"numeric"};
  $("#dateLine").text(d.toLocaleDateString(undefined, opts).toUpperCase());
  var dash = getActiveDash();
  var count = 0; dash.sections.forEach(function(s){ count += s.widgets.length; });
  $("#subGreeting").text(dash.name + " · " + dash.sections.length + " section" + (dash.sections.length===1?"":"s") + " · " + count + " widget" + (count===1?"":"s"));
}

function renderDashSwitcher(){
  var dash = getActiveDash();
  $("#dashCurrentName").text(dash.name);
  var $menu = $("#dashSwitcherMenu").empty();
  state.dashboards.forEach(function(d){
    var $item = $('<div class="dash-menu-item"></div>').text(d.name);
    if(d.id===state.activeId) $item.addClass("active");
    $item.on("click", function(){
      state.activeId = d.id; state.mode="edit"; history=[]; future=[];
      saveState(); renderAll(); $menu.addClass("hidden");
    });
    $menu.append($item);
  });
  $menu.append('<div class="dash-menu-divider"></div>');
  var $new = $('<div class="dash-menu-new">+ New dashboard</div>').on("click", function(){
    $menu.addClass("hidden"); openTemplateModal();
  });
  $menu.append($new);
  if(state.dashboards.length>1){
    var $del = $('<div class="dash-menu-item" style="color:var(--coral)">Delete this dashboard</div>').on("click", function(){
      if(confirm('Delete "'+dash.name+'"? This cannot be undone.')){
        state.dashboards = state.dashboards.filter(function(d){ return d.id!==dash.id; });
        state.activeId = state.dashboards[0].id;
        saveState(); renderAll(); toast("Dashboard deleted");
      }
      $menu.addClass("hidden");
    });
    $menu.append($del);
  }
}

function renderSectionList(){
  var dash = getActiveDash();
  var $list = $("#sectionList").empty();
  if(!dash.sections.length){
    $list.append('<div class="w-empty-hint" style="padding:40px">This dashboard is empty. Add a section to get started.</div>');
  }
  dash.sections.forEach(function(section){ $list.append(renderSectionEl(section)); });
  initSectionSortable();
}

function renderSectionEl(section){
  var $sec = $('<section class="dash-section"></section>').attr("data-section-id", section.id);
  if(section.collapsed) $sec.addClass("collapsed");

  var $head = $('<div class="section-head"></div>');
  $head.append('<span class="section-drag-handle"><svg viewBox="0 0 24 24"><path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"/></svg></span>');
  var $name = $('<input class="section-name" type="text">').val(section.name);
  $name.on("change", function(){
    pushHistory();
    section.name = $(this).val() || "Untitled section";
    saveState(); updateGreeting();
  });
  $head.append($name);
  $head.append('<span class="section-count">'+section.widgets.length+' widget'+(section.widgets.length===1?"":"s")+'</span>');

  var $actions = $('<div class="section-actions"></div>');
  var $collapse = iconButton(section.collapsed ? svgChevDown() : svgChevUp(), "Collapse/expand");
  $collapse.on("click", function(){
    section.collapsed = !section.collapsed;
    saveState(true); renderSectionList();
  });
  var $dup = iconButton(svgCopy(), "Duplicate section");
  $dup.on("click", function(){
    pushHistory();
    var copy = clone(section);
    copy.id = uid("sec");
    copy.name = section.name + " copy";
    copy.widgets.forEach(function(w){ w.id = uid("w"); });
    var dash = getActiveDash();
    var idx = dash.sections.indexOf(section);
    dash.sections.splice(idx+1, 0, copy);
    saveState(); renderSectionList(); toast("Section duplicated");
  });
  var $del = iconButton(svgTrash(), "Delete section");
  $del.on("click", function(){
    if(!confirm('Delete section "'+section.name+'"?')) return;
    pushHistory();
    var dash = getActiveDash();
    dash.sections = dash.sections.filter(function(s){ return s.id!==section.id; });
    saveState(); renderSectionList(); updateGreeting(); toast("Section deleted");
  });
  $actions.append($collapse, $dup, $del);
  $head.append($actions);
  $sec.append($head);

  var $wlist = $('<div class="widget-list"></div>').attr("data-section-id", section.id);
  if(!section.widgets.length){
    $wlist.append('<div class="widget-list-empty">Drag a widget here from the library</div>');
  }
  section.widgets.forEach(function(w){ $wlist.append(renderWidgetEl(w, section)); });
  $sec.append($wlist);

  initWidgetListSortable($wlist);
  initSectionDroppable($wlist, section.id);
  return $sec;
}

function iconButton(svgHtml, title){
  return $('<button class="icon-btn small" type="button" title="'+title+'"></button>').html(svgHtml);
}
function svgChevUp(){ return '<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>'; }
function svgChevDown(){ return '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>'; }
function svgCopy(){ return '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>'; }
function svgTrash(){ return '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'; }
function svgGear(){ return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'; }

function widgetClasses(w){
  var cls = "widget span-"+w.size.span+" h-"+w.size.height;
  if(w.style.fx.glow) cls += " fx-glow";
  if(w.style.fx.glass) cls += " fx-glass";
  if(w.style.fx.gradient) cls += " fx-gradient";
  if(w.style.fx.float) cls += " fx-float";
  return cls;
}
function applyWidgetInlineStyle($el, w){
  var css = {};
  if(w.style.bg) css.background = w.style.bg;
  css.opacity = (w.style.opacity!=null ? w.style.opacity : 100)/100;
  css.borderRadius = w.style.radius==="sm" ? "9px" : w.style.radius==="lg" ? "24px" : "14px";
  css.boxShadow = w.style.shadow ? "" : "none";
  css.textAlign = w.style.align || "left";
  css.fontFamily = w.style.font==="display" ? "var(--font-display)" : w.style.font==="mono" ? "var(--font-mono)" : "var(--font-body)";
  $el.css(css);
  $el.find(".widget-body").css("font-size", w.style.fontSize==="sm"?"11.5px":w.style.fontSize==="lg"?"14.5px":"13px");
}

function renderWidgetEl(w, section){
  var $w = $('<div></div>').attr("class", widgetClasses(w)).attr("data-widget-id", w.id).attr("data-section-id", section.id);
  if(w.style.fx.entrance) $w.css({animation:"toastIn .3s ease"});
  if(selectedWidgetId===w.id) $w.addClass("selected");

  var $head = $('<div class="widget-head"></div>');
  $head.append('<span class="widget-drag-handle"><svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg></span>');
  $head.append('<span class="widget-icon">'+w.icon+'</span>');
  $head.append('<span class="widget-title">'+escapeHtml(w.title)+'</span>');
  var $controls = $('<div class="widget-controls"></div>');
  var $settings = iconButton(svgGear(), "Customize").on("click", function(e){ e.stopPropagation(); openInspector(w.id); });
  var $trash = iconButton(svgTrash(), "Remove").on("click", function(e){ e.stopPropagation(); removeWidget(w.id); });
  $controls.append($settings, $trash);
  $head.append($controls);
  $w.append($head);

  var $body = $('<div class="widget-body"></div>');
  $w.append($body);

  var $meta = $('<div class="meta-badge"></div>');
  $meta.html(
    '<div class="m-row"><span>id</span><b>'+w.id+'</b></div>'+
    '<div class="m-row"><span>type</span><b>'+w.type+'</b></div>'+
    '<div class="m-row"><span>category</span><b>'+w.category+'</b></div>'+
    '<div class="m-row"><span>section</span><b>'+escapeHtml(section.name)+'</b></div>'+
    '<div class="m-row"><span>size</span><b>span '+w.size.span+' / '+w.size.height+'</b></div>'+
    '<div class="m-row"><span>created</span><b>'+new Date(w.createdAt).toLocaleTimeString()+'</b></div>'+
    '<div class="m-row"><span>modified</span><b>'+new Date(w.modifiedAt).toLocaleTimeString()+'</b></div>'
  );
  $w.append($meta);

  $w.on("click", function(){ if(state.mode==="edit") openInspector(w.id); });

  applyWidgetInlineStyle($w, w);
  var engine = ENGINES[w.engine];
  if(engine){
    $body.html(engine.render(w));
    engine.afterRender($body, w, section);
  }
  return $w;
}

function refreshWidget(widgetId){
  var found = findWidget(widgetId);
  if(!found) return;
  var $old = $('.widget[data-widget-id="'+widgetId+'"]');
  if(!$old.length) return;
  var $new = renderWidgetEl(found.widget, found.section);
  $old.replaceWith($new);
}

function removeWidget(widgetId){
  var found = findWidget(widgetId);
  if(!found) return;
  pushHistory();
  found.section.widgets = found.section.widgets.filter(function(w){ return w.id!==widgetId; });
  if(selectedWidgetId===widgetId) closeInspector();
  saveState(); renderSectionList(); updateGreeting(); toast("Widget removed");
}

/* =====================================================================
   DRAG & DROP — jQuery UI Sortable (reorder) + Draggable/Droppable (add)
===================================================================== */
function initSectionSortable(){
  var $list = $("#sectionList");
  if($list.data("ui-sortable")) $list.sortable("destroy");
  $list.sortable({
    items: "> .dash-section",
    handle: ".section-drag-handle",
    placeholder: "dash-section sortable-placeholder",
    forcePlaceholderSize: true,
    tolerance: "pointer",
    axis: "y",
    animation: 180,
    cursor: "grabbing",
    start: function(e, ui){ pushHistory(); },
    stop: function(){ syncSectionOrderFromDom(); saveState(); updateGreeting(); }
  });
}

function initWidgetListSortable($list){
  $list.sortable({
    items: "> .widget",
    connectWith: ".widget-list",
    handle: ".widget-drag-handle",
    placeholder: "widget-placeholder",
    forcePlaceholderSize: true,
    tolerance: "pointer",
    cursor: "grabbing",
    start: function(e, ui){
      pushHistory();
      ui.item.data("dragStarted", true);
    },
    stop: function(){
      syncWidgetsFromDom();
      saveState();
      renderSectionList(); // rebuild empty-state hints / counts cleanly
      updateGreeting();
    }
  }).disableSelection();
}

function syncSectionOrderFromDom(){
  var dash = getActiveDash();
  var newOrder = [];
  $("#sectionList > .dash-section").each(function(){
    var id = $(this).attr("data-section-id");
    var sec = dash.sections.filter(function(s){ return s.id===id; })[0];
    if(sec) newOrder.push(sec);
  });
  if(newOrder.length===dash.sections.length) dash.sections = newOrder;
}

function syncWidgetsFromDom(){
  var dash = getActiveDash();
  $("#sectionList .widget-list").each(function(){
    var sectionId = $(this).attr("data-section-id");
    var sec = dash.sections.filter(function(s){ return s.id===sectionId; })[0];
    if(!sec) return;
    var newWidgets = [];
    $(this).children(".widget").each(function(){
      var wid = $(this).attr("data-widget-id");
      var found = findWidgetAnySection(dash, wid);
      if(found) newWidgets.push(found);
    });
    sec.widgets = newWidgets;
  });
}
function findWidgetAnySection(dash, widgetId){
  for(var i=0;i<dash.sections.length;i++){
    for(var j=0;j<dash.sections[i].widgets.length;j++){
      if(dash.sections[i].widgets[j].id===widgetId) return dash.sections[i].widgets[j];
    }
  }
  return null;
}

function initSectionDroppable($list, sectionId){
  $list.droppable({
    accept: ".lib-item",
    tolerance: "pointer",
    hoverClass: "drag-over",
    drop: function(e, ui){
      var type = ui.draggable.attr("data-type");
      if(!type) return;
      pushHistory();
      var section = getSection(sectionId);
      if(!section) return;
      section.widgets.push(makeWidget(type));
      saveState();
      renderSectionList();
      updateGreeting();
      toast(DEFS_BY_TYPE[type].title + " added");
    }
  });
}

function buildWidgetLibrary(){
  var $lib = $("#widgetLibrary").empty();
  CATEGORIES.forEach(function(cat){
    var $cat = $('<div class="lib-category"></div>').attr("data-cat", cat.key);
    $cat.append('<div class="lib-category-title">'+cat.icon+' '+cat.label+'</div>');
    WIDGET_DEFS.filter(function(d){ return d.category===cat.key; }).forEach(function(def){
      var $item = $('<div class="lib-item"></div>').attr("data-type", def.type).attr("data-name", def.title.toLowerCase());
      $item.html('<span class="lib-ic">'+def.icon+'</span><span>'+def.title+'</span>');
      $cat.append($item);
    });
    $lib.append($cat);
  });
  applyLibraryFilter("");
  $lib.find(".lib-item").draggable({
    helper: "clone",
    appendTo: "body",
    revert: "invalid",
    revertDuration: 150,
    zIndex: 999,
    cursor: "grabbing",
    connectToSortable: false,
    start: function(){ $(this).addClass("dragging-source"); },
    stop: function(){ $(this).removeClass("dragging-source"); }
  });
}

function applyLibraryFilter(q){
  q = (q||"").toLowerCase().trim();
  $("#widgetLibrary .lib-item").each(function(){
    var match = !q || $(this).attr("data-name").indexOf(q) > -1;
    $(this).toggle(match);
  });
  $("#widgetLibrary .lib-category").each(function(){
    var anyVisible = $(this).find(".lib-item:visible").length > 0;
    $(this).toggle(anyVisible);
  });
}

/* =====================================================================
   GLOBAL UI — topbar, sidebar, mode, inspector shell, keyboard shortcuts
===================================================================== */
function bindGlobalUI(){
  $("#btnToggleSidebar").on("click", function(){
    state.sidebarCollapsed = !state.sidebarCollapsed;
    saveState(true); renderAll();
  });

  $("#widgetSearch").on("input", function(){ applyLibraryFilter($(this).val()); });

  $("#dashSwitcherBtn").on("click", function(e){
    e.stopPropagation();
    $("#dashSwitcherMenu").toggleClass("hidden");
  });
  $(document).on("click", function(){ $("#dashSwitcherMenu").addClass("hidden"); });
  $("#dashSwitcherMenu").on("click", function(e){ e.stopPropagation(); });

  $(".mode-opt").on("click", function(){
    state.mode = $(this).attr("data-mode");
    if(state.mode==="preview") closeInspector();
    saveState(true); renderAll();
  });

  $("#btnUndo").on("click", undo);
  $("#btnRedo").on("click", redo);

  $("#btnMeta").on("click", function(){
    state.meta = !state.meta;
    saveState(true); renderAll();
  });

  $("#btnSave").on("click", function(){ saveState(); toast("Workspace saved", "success"); });

  $("#btnAddSection").on("click", function(){
    pushHistory();
    var dash = getActiveDash();
    dash.sections.push({id: uid("sec"), name: "New Section", collapsed:false, widgets:[]});
    saveState(); renderSectionList(); updateGreeting();
  });

  $("#btnCloseInspector").on("click", closeInspector);
  $("#btnDeleteWidget").on("click", function(){
    if(selectedWidgetId) removeWidget(selectedWidgetId);
  });
  $("#inspectorTabs").on("click", ".tab-btn", function(){
    $("#inspectorTabs .tab-btn").removeClass("active");
    $(this).addClass("active");
    renderInspectorBody($(this).attr("data-tab"));
  });

  $("#cmdPaletteBtn").on("click", openCommandPalette);
  $("#cmdPalette").on("click", function(e){ if(e.target.id==="cmdPalette") closeCommandPalette(); });
  $("#cmdInput").on("input", function(){ filterCommands($(this).val()); });
  $("#cmdInput").on("keydown", function(e){
    var $items = $("#cmdList .cmdk-item:visible");
    var $active = $items.filter(".active");
    var idx = $items.index($active);
    if(e.key==="ArrowDown"){ e.preventDefault(); idx = Math.min(idx+1, $items.length-1); $items.removeClass("active"); $items.eq(idx).addClass("active")[0].scrollIntoView({block:"nearest"}); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); idx = Math.max(idx-1, 0); $items.removeClass("active"); $items.eq(idx).addClass("active")[0].scrollIntoView({block:"nearest"}); }
    else if(e.key==="Enter"){ e.preventDefault(); $items.eq(idx>=0?idx:0).trigger("click"); }
    else if(e.key==="Escape"){ closeCommandPalette(); }
  });

  $("#btnCloseTemplate").on("click", closeTemplateModal);
  $("#templateModal").on("click", function(e){ if(e.target.id==="templateModal") closeTemplateModal(); });

  $(document).on("keydown", function(e){
    var meta = e.metaKey || e.ctrlKey;
    var tag = (e.target.tagName||"").toLowerCase();
    var typing = tag==="input" || tag==="textarea" || e.target.isContentEditable;
    if(meta && e.key.toLowerCase()==="k"){ e.preventDefault(); openCommandPalette(); return; }
    if(!$("#cmdPalette").hasClass("hidden") && e.key==="Escape"){ closeCommandPalette(); return; }
    if(typing) return;
    if(meta && e.shiftKey && e.key.toLowerCase()==="z"){ e.preventDefault(); redo(); }
    else if(meta && e.key.toLowerCase()==="z"){ e.preventDefault(); undo(); }
    else if(meta && e.key.toLowerCase()==="s"){ e.preventDefault(); saveState(); toast("Workspace saved","success"); }
  });

  window.addEventListener("resize", function(){
    if(window.innerWidth <= 820) state.sidebarCollapsed = true;
  });
  if(window.innerWidth <= 820) state.sidebarCollapsed = true;
}

/* =====================================================================
   INSPECTOR
===================================================================== */
function openInspector(widgetId){
  selectedWidgetId = widgetId;
  $(".widget").removeClass("selected");
  $('.widget[data-widget-id="'+widgetId+'"]').addClass("selected");
  var found = findWidget(widgetId);
  if(!found) return;
  $("#inspectorTitle").text(found.widget.title);
  $("#inspector").removeClass("hidden");
  $("#inspectorTabs .tab-btn").removeClass("active").filter('[data-tab="content"]').addClass("active");
  renderInspectorBody("content");
}
function closeInspector(){
  selectedWidgetId = null;
  $(".widget").removeClass("selected");
  $("#inspector").addClass("hidden");
}

function field(labelText, inputHtml){
  return '<div class="field"><label>'+labelText+'</label>'+inputHtml+'</div>';
}

function renderInspectorBody(tab){
  var found = findWidget(selectedWidgetId);
  if(!found){ closeInspector(); return; }
  var w = found.widget;
  var $body = $("#inspectorBody").empty();

  if(tab==="content"){
    $body.append(field("Title", '<input class="text-input" id="insTitle" value="'+escapeHtml(w.title)+'">'));
    var engine = ENGINES[w.engine];
    if(engine.contentFields) $body.append(engine.contentFields(w));
    $("#insTitle").on("input", function(){
      w.title = $(this).val() || w.title;
      w.modifiedAt = nowISO();
      $("#inspectorTitle").text(w.title);
      $('.widget[data-widget-id="'+w.id+'"] .widget-title').text(w.title);
      saveState(true);
    });
  }

  if(tab==="appearance"){
    var colors = ["", "#1c2030", "#231a33", "#1a2b26", "#2b1f1f", "#20242f"];
    var swatches = colors.map(function(c){
      return '<span class="swatch" data-color="'+c+'" style="background:'+(c||"#12151E")+';'+(c?'':'border:1px dashed var(--line);')+(w.style.bg===c?' ':'')+'"></span>';
    }).join("");
    $body.append(field("Background", '<div class="swatch-row">'+swatches+'</div>'));
    $body.append(field("Font", '<div class="seg" id="segFont">'+
      '<button data-v="body" class="'+(w.style.font==="body"?"active":"")+'">Body</button>'+
      '<button data-v="display" class="'+(w.style.font==="display"?"active":"")+'">Display</button>'+
      '<button data-v="mono" class="'+(w.style.font==="mono"?"active":"")+'">Mono</button></div>'));
    $body.append(field("Font size", '<div class="seg" id="segFontSize">'+
      '<button data-v="sm" class="'+(w.style.fontSize==="sm"?"active":"")+'">Small</button>'+
      '<button data-v="md" class="'+(w.style.fontSize==="md"?"active":"")+'">Medium</button>'+
      '<button data-v="lg" class="'+(w.style.fontSize==="lg"?"active":"")+'">Large</button></div>'));
    $body.append(field("Alignment", '<div class="seg" id="segAlign">'+
      '<button data-v="left" class="'+(w.style.align==="left"?"active":"")+'">Left</button>'+
      '<button data-v="center" class="'+(w.style.align==="center"?"active":"")+'">Center</button>'+
      '<button data-v="right" class="'+(w.style.align==="right"?"active":"")+'">Right</button></div>'));
    $body.append(field("Corner radius", '<div class="seg" id="segRadius">'+
      '<button data-v="sm" class="'+(w.style.radius==="sm"?"active":"")+'">Sharp</button>'+
      '<button data-v="md" class="'+(w.style.radius==="md"?"active":"")+'">Soft</button>'+
      '<button data-v="lg" class="'+(w.style.radius==="lg"?"active":"")+'">Round</button></div>'));
    $body.append(field("Shadow", '<div class="toggle-row"><span>Elevated shadow</span><label class="switch"><input type="checkbox" id="chkShadow" '+(w.style.shadow?"checked":"")+'><span class="switch-track"></span></label></div>'));
    $body.append(field("Transparency", '<input type="range" id="rngOpacity" min="40" max="100" value="'+w.style.opacity+'">'));

    $body.find(".swatch-row .swatch").on("click", function(){
      $(this).siblings().removeClass("active"); $(this).addClass("active");
      w.style.bg = $(this).attr("data-color");
      touchAndRefresh(w);
    });
    $body.find("#segFont .seg button, #segFontSize .seg button, #segAlign .seg button, #segRadius .seg button").on("click", function(){
      var $seg = $(this).parent();
      $seg.find("button").removeClass("active"); $(this).addClass("active");
      var v = $(this).attr("data-v");
      if($seg.is("#segFont")) w.style.font = v;
      if($seg.is("#segFontSize")) w.style.fontSize = v;
      if($seg.is("#segAlign")) w.style.align = v;
      if($seg.is("#segRadius")) w.style.radius = v;
      touchAndRefresh(w);
    });
    $("#chkShadow").on("change", function(){ w.style.shadow = this.checked; touchAndRefresh(w); });
    $("#rngOpacity").on("input", function(){ w.style.opacity = +this.value; touchAndRefresh(w); });
  }

  if(tab==="layout"){
    $body.append(field("Width", '<div class="seg" id="segSpan">'+
      '<button data-v="1" class="'+(w.size.span===1?"active":"")+'">Narrow</button>'+
      '<button data-v="2" class="'+(w.size.span===2?"active":"")+'">Wide</button>'+
      '<button data-v="3" class="'+(w.size.span===3?"active":"")+'">Full</button></div>'));
    $body.append(field("Height", '<div class="seg" id="segHeight">'+
      '<button data-v="sm" class="'+(w.size.height==="sm"?"active":"")+'">Compact</button>'+
      '<button data-v="md" class="'+(w.size.height==="md"?"active":"")+'">Medium</button>'+
      '<button data-v="lg" class="'+(w.size.height==="lg"?"active":"")+'">Tall</button></div>'));
    var dash = getActiveDash();
    var opts = dash.sections.map(function(s){ return '<option value="'+s.id+'" '+(s.id===found.section.id?"selected":"")+'>'+escapeHtml(s.name)+'</option>'; }).join("");
    $body.append(field("Section", '<select class="select-input" id="selSection">'+opts+'</select>'));

    $body.find("#segSpan button").on("click", function(){
      $(this).siblings().removeClass("active"); $(this).addClass("active");
      w.size.span = +$(this).attr("data-v");
      pushHistory(); saveState(); renderSectionList();
    });
    $body.find("#segHeight button").on("click", function(){
      $(this).siblings().removeClass("active"); $(this).addClass("active");
      w.size.height = $(this).attr("data-v");
      pushHistory(); saveState(); renderSectionList();
    });
    $("#selSection").on("change", function(){
      var newSectionId = $(this).val();
      pushHistory();
      found.section.widgets = found.section.widgets.filter(function(x){ return x.id!==w.id; });
      var newSection = getSection(newSectionId);
      newSection.widgets.push(w);
      saveState(); renderSectionList(); openInspector(w.id);
    });
  }

  if(tab==="effects"){
    var fx = w.style.fx;
    [["glow","Glow","Soft accent glow around the card"],
     ["glass","Glass","Frosted glassmorphism background"],
     ["gradient","Gradient","Subtle violet-to-mint gradient wash"],
     ["float","Floating","Gentle idle floating animation"],
     ["entrance","Entrance","Fade in when the widget appears"]].forEach(function(f){
      $body.append('<div class="toggle-row"><span>'+f[1]+'<br><small style="color:var(--text-faint);font-size:11px">'+f[2]+'</small></span><label class="switch"><input type="checkbox" data-fx="'+f[0]+'" '+(fx[f[0]]?"checked":"")+'><span class="switch-track"></span></label></div>');
    });
    $body.find("[data-fx]").on("change", function(){
      fx[$(this).attr("data-fx")] = this.checked;
      touchAndRefresh(w, true);
    });
  }
}

/* =====================================================================
   COMMAND PALETTE
===================================================================== */
var COMMANDS = [];
function buildCommandList(){
  COMMANDS = [
    {label:"Add widget…", icon:"➕", run:function(){ closeCommandPalette(); $("#widgetSearch").focus(); if(state.sidebarCollapsed){ state.sidebarCollapsed=false; saveState(true); renderAll(); } }},
    {label:"Create dashboard", icon:"🗂", run:function(){ closeCommandPalette(); openTemplateModal(); }},
    {label:"Switch dashboard…", icon:"🔀", run:function(){ closeCommandPalette(); $("#dashSwitcherMenu").removeClass("hidden"); }},
    {label:"Add section", icon:"➕", run:function(){ closeCommandPalette(); $("#btnAddSection").trigger("click"); }},
    {label:"Save workspace", icon:"💾", run:function(){ closeCommandPalette(); saveState(); toast("Workspace saved","success"); }},
    {label:"Toggle preview mode", icon:"👁", run:function(){ closeCommandPalette(); state.mode = state.mode==="edit"?"preview":"edit"; saveState(true); renderAll(); }},
    {label:"Toggle meta mode", icon:"◆", run:function(){ closeCommandPalette(); state.meta=!state.meta; saveState(true); renderAll(); }},
    {label:"Toggle widget library", icon:"▤", run:function(){ closeCommandPalette(); state.sidebarCollapsed=!state.sidebarCollapsed; saveState(true); renderAll(); }},
    {label:"Undo", icon:"↺", run:function(){ closeCommandPalette(); undo(); }},
    {label:"Redo", icon:"↻", run:function(){ closeCommandPalette(); redo(); }},
    {label:"Export workspace (JSON)", icon:"⭳", run:function(){ closeCommandPalette(); exportWorkspace(); }},
    {label:"Import workspace (JSON)", icon:"⭱", run:function(){ closeCommandPalette(); importWorkspace(); }},
    {label:"Reset workspace", icon:"⟲", run:function(){ closeCommandPalette(); if(confirm("Reset LifeBoard to its default state? This deletes all dashboards.")){ localStorage.removeItem(STORAGE_KEY); state = defaultState(); history=[]; future=[]; saveState(); renderAll(); toast("Workspace reset"); } }}
  ];
}
function openCommandPalette(){
  $("#cmdPalette").removeClass("hidden");
  $("#cmdInput").val("").focus();
  filterCommands("");
}
function closeCommandPalette(){ $("#cmdPalette").addClass("hidden"); }
function filterCommands(q){
  q = (q||"").toLowerCase();
  var $list = $("#cmdList").empty();
  var matches = COMMANDS.filter(function(c){ return c.label.toLowerCase().indexOf(q) > -1; });
  if(!matches.length){ $list.append('<div class="cmdk-empty">No matching commands</div>'); return; }
  matches.forEach(function(c, i){
    var $item = $('<div class="cmdk-item"></div>').toggleClass("active", i===0);
    $item.html('<span class="cmdk-ic">'+c.icon+'</span><span>'+c.label+'</span>');
    $item.on("click", c.run);
    $list.append($item);
  });
}

function exportWorkspace(){
  var blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "lifeboard-export.json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Workspace exported", "success");
}
function importWorkspace(){
  var input = document.createElement("input");
  input.type = "file"; input.accept = "application/json";
  input.onchange = function(){
    var file = input.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var parsed = JSON.parse(reader.result);
        if(!parsed.dashboards) throw new Error("invalid");
        state = parsed; history=[]; future=[];
        saveState(); renderAll(); toast("Workspace imported", "success");
      }catch(e){ toast("Could not import that file"); }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* =====================================================================
   TEMPLATE MODAL — create a new dashboard
===================================================================== */
function openTemplateModal(){
  $("#newDashName").val("");
  var $grid = $("#templateGrid").empty();
  Object.keys(TEMPLATES).forEach(function(key){
    var t = TEMPLATES[key];
    var $card = $('<div class="template-card"></div>');
    $card.html("<h3>"+t.name+"</h3><p>"+t.desc+"</p>");
    $card.on("click", function(){
      var name = $("#newDashName").val().trim() || t.name;
      var dash = freshDashboard(name, key);
      state.dashboards.push(dash);
      state.activeId = dash.id;
      history=[]; future=[];
      saveState(); renderAll(); closeTemplateModal();
      toast('"'+name+'" created', "success");
    });
    $grid.append($card);
  });
  $("#templateModal").removeClass("hidden");
}
function closeTemplateModal(){ $("#templateModal").addClass("hidden"); }

/* =====================================================================
   WIDGET ENGINES
   Each engine: render(w) -> html string, afterRender($body,w,section) -> bind events,
   contentFields(w) [optional] -> html string for inspector Content tab.
===================================================================== */
var ENGINES = {};
function commitWidget(w){ w.modifiedAt = nowISO(); saveState(true); }
function logCompletion(){ // used by analytics engines
  var key = dayKey();
  if(!state._activity) state._activity = {};
  state._activity[key] = (state._activity[key]||0) + 1;
  saveState(true);
}

/* ---------- LIST (todo / goals / checklist / priority / deadlines / subjects...) ---------- */
ENGINES.list = {
  render: function(w){
    var items = w.data.items || [];
    var html = '<ul class="w-list" data-role="list">';
    items.forEach(function(it){
      html += '<li class="w-list-item '+(it.done?"done":"")+'" data-id="'+it.id+'">';
      if(w.data.showPriority) html += '<span class="w-prio '+(it.priority||"low")+'"></span>';
      html += '<span class="w-check '+(it.done?"checked":"")+'" data-role="check">'+(it.done?'<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>':'')+'</span>';
      html += '<span class="w-item-label">'+escapeHtml(it.text)+(w.data.showDeadline && it.deadline ? ' <span style="color:var(--text-faint);font-size:10.5px">· '+escapeHtml(it.deadline)+'</span>':'')+'</span>';
      html += '<span class="w-item-del" data-role="del"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></span>';
      html += '</li>';
    });
    html += '</ul>';
    if(!items.length) html += '<div class="w-empty-hint">Nothing yet — add your first item below.</div>';
    if(w.data.showProgress){
      var total = items.length, done = items.filter(function(i){return i.done;}).length;
      var pct = total ? Math.round(done/total*100) : 0;
      html += '<div class="w-progress-track"><div class="w-progress-fill" style="width:'+pct+'%"></div></div>';
      html += '<div class="w-progress-label">'+done+' of '+total+' complete · '+pct+'%</div>';
    }
    html += '<div class="w-add-row">'+
      '<input type="text" placeholder="Add item…" data-role="input">'+
      (w.data.showPriority ? '<select class="select-input" data-role="prio" style="flex:0 0 74px;padding:6px"><option value="low">Low</option><option value="med">Med</option><option value="high">High</option></select>' : '') +
      (w.data.showDeadline ? '<input type="date" data-role="deadline" style="flex:0 0 130px;background:var(--glass);border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:11.5px;padding:0 4px">' : '') +
      '<button data-role="add">+</button></div>';
    return html;
  },
  afterRender: function($body, w){
    function addItem(){
      var $in = $body.find('[data-role="input"]');
      var text = $in.val().trim();
      if(!text) return;
      var item = {id: uid("it"), text: text, done:false};
      if(w.data.showPriority) item.priority = $body.find('[data-role="prio"]').val();
      if(w.data.showDeadline) item.deadline = $body.find('[data-role="deadline"]').val();
      w.data.items.push(item);
      commitWidget(w); refreshWidget(w.id);
    }
    $body.find('[data-role="add"]').on("click", addItem);
    $body.find('[data-role="input"]').on("keydown", function(e){ if(e.key==="Enter") addItem(); });
    $body.find('[data-role="check"]').on("click", function(){
      var id = $(this).closest("li").attr("data-id");
      var it = w.data.items.filter(function(i){return i.id===id;})[0];
      if(it){ it.done = !it.done; if(it.done) logCompletion(); commitWidget(w); refreshWidget(w.id); }
    });
    $body.find('[data-role="del"]').on("click", function(){
      var id = $(this).closest("li").attr("data-id");
      w.data.items = w.data.items.filter(function(i){return i.id!==id;});
      commitWidget(w); refreshWidget(w.id);
    });
  },
  contentFields: function(w){
    return field("List options",
      '<div class="toggle-row"><span>Show priority</span><label class="switch"><input type="checkbox" data-role="cfgPrio" '+(w.data.showPriority?"checked":"")+'><span class="switch-track"></span></label></div>'+
      '<div class="toggle-row" style="margin-top:8px"><span>Show deadline</span><label class="switch"><input type="checkbox" data-role="cfgDeadline" '+(w.data.showDeadline?"checked":"")+'><span class="switch-track"></span></label></div>'+
      '<div class="toggle-row" style="margin-top:8px"><span>Show progress bar</span><label class="switch"><input type="checkbox" data-role="cfgProgress" '+(w.data.showProgress?"checked":"")+'><span class="switch-track"></span></label></div>'
    );
  }
};

/* ---------- HABIT TRACKER ---------- */
ENGINES.habit = {
  render: function(w){
    var habits = w.data.habits || [];
    var today = new Date(); var startIdx = today.getDay();
    var html = '<div class="w-habit-grid">';
    habits.forEach(function(h){
      html += '<div class="w-habit-row" data-id="'+h.id+'"><span class="w-habit-name">'+escapeHtml(h.name)+'</span><span class="w-habit-days">';
      for(var i=6;i>=0;i--){
        var d = new Date(); d.setDate(d.getDate()-i);
        var key = dayKey(d);
        var on = !!h.days[key];
        html += '<span class="w-habit-day '+(on?"on":"")+'" data-key="'+key+'" title="'+d.toDateString()+'">'+(on?"✓":weekdayShort(d.getDay()))+'</span>';
      }
      html += '</span><span class="w-item-del" data-role="delHabit" style="opacity:.6"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></span></div>';
    });
    html += '</div>';
    if(!habits.length) html += '<div class="w-empty-hint">Add a habit to start tracking your streak.</div>';
    html += '<div class="w-add-row"><input type="text" placeholder="New habit… e.g. Read 20 min" data-role="input"><button data-role="add">+</button></div>';
    return html;
  },
  afterRender: function($body, w){
    function add(){
      var $in = $body.find('[data-role="input"]');
      var v = $in.val().trim(); if(!v) return;
      w.data.habits.push({id:uid("hb"), name:v, days:{}});
      commitWidget(w); refreshWidget(w.id);
    }
    $body.find('[data-role="add"]').on("click", add);
    $body.find('[data-role="input"]').on("keydown", function(e){ if(e.key==="Enter") add(); });
    $body.find(".w-habit-day").on("click", function(){
      var id = $(this).closest(".w-habit-row").attr("data-id");
      var key = $(this).attr("data-key");
      var h = w.data.habits.filter(function(x){return x.id===id;})[0];
      if(!h) return;
      if(h.days[key]) delete h.days[key]; else { h.days[key]=true; logCompletion(); }
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="delHabit"]').on("click", function(){
      var id = $(this).closest(".w-habit-row").attr("data-id");
      w.data.habits = w.data.habits.filter(function(x){return x.id!==id;});
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- NOTES ---------- */
ENGINES.notes = {
  render: function(w){
    return '<textarea class="w-notes-area" data-role="text" placeholder="Start typing…">'+escapeHtml(w.data.text||"")+'</textarea>';
  },
  afterRender: function($body, w){
    var t;
    $body.find('[data-role="text"]').on("input", function(){
      w.data.text = $(this).val();
      clearTimeout(t); t = setTimeout(function(){ commitWidget(w); }, 400);
    });
  }
};

/* ---------- POMODORO / STUDY TIMER ---------- */
ENGINES.pomodoro = {
  render: function(w){
    var d = w.data;
    return '<div class="w-pomo-phase">'+(d.phase==="work"?"Focus":"Break")+'</div>'+
      '<div class="w-pomo-time" data-role="time">'+fmtHM(d.remaining)+'</div>'+
      '<div class="w-pomo-controls">'+
      '<button class="w-pomo-btn primary" data-role="toggle">'+(d.running?"Pause":"Start")+'</button>'+
      '<button class="w-pomo-btn" data-role="reset">Reset</button>'+
      '</div>';
  },
  afterRender: function($body, w){
    $body.find('[data-role="toggle"]').on("click", function(){
      w.data.running = !w.data.running;
      w.data.lastTick = Date.now();
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="reset"]').on("click", function(){
      w.data.phase = "work";
      w.data.remaining = (w.data.work||25)*60;
      w.data.running = false;
      commitWidget(w); refreshWidget(w.id);
    });
  },
  contentFields: function(w){
    return field("Focus length (minutes)", '<input type="number" min="1" max="180" class="text-input" data-role="cfgWork" value="'+w.data.work+'">') +
           field("Break length (minutes)", '<input type="number" min="1" max="60" class="text-input" data-role="cfgBrk" value="'+w.data.brk+'">');
  }
};

/* ---------- COUNTDOWN ---------- */
ENGINES.countdown = {
  render: function(w){
    var d = w.data;
    if(!d.target){
      return '<div class="w-empty-hint">Pick a date in the settings panel to start the countdown.</div>';
    }
    var diff = Math.max(0, new Date(d.target+"T00:00:00") - new Date());
    var days = Math.ceil(diff / 86400000);
    return '<div class="w-countdown-num" data-role="num">'+days+'</div>'+
      '<div class="w-countdown-unit">day'+(days===1?"":"s")+' to go</div>'+
      '<div class="w-countdown-target">'+escapeHtml(d.label||"Target")+' · '+new Date(d.target+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})+'</div>';
  },
  afterRender: function(){},
  contentFields: function(w){
    return field("Label", '<input type="text" class="text-input" data-role="cfgLabel" value="'+escapeHtml(w.data.label||"")+'">') +
           field("Target date", '<input type="date" class="text-input" data-role="cfgTarget" value="'+(w.data.target||"")+'">');
  }
};

/* ---------- CLOCK ---------- */
ENGINES.clock = {
  render: function(){
    var d = new Date();
    return '<div class="w-clock-time" data-role="time">'+fmtTime(d)+'</div><div class="w-clock-date" data-role="date">'+d.toDateString()+'</div>';
  },
  afterRender: function(){}
};

/* ---------- WORLD CLOCK ---------- */
ENGINES.worldclock = {
  render: function(w){
    var html = '<div data-role="rows">';
    (w.data.zones||[]).forEach(function(z){
      html += '<div class="w-worldclock-row" data-tz="'+z.tz+'"><span class="w-worldclock-city">'+escapeHtml(z.city)+'</span><span class="w-worldclock-time" data-role="t">--:--</span></div>';
    });
    html += '</div>';
    return html;
  },
  afterRender: function($body, w){ ENGINES.worldclock.tick($body, w); },
  tick: function($body, w){
    (w.data.zones||[]).forEach(function(z){
      try{
        var str = new Date().toLocaleTimeString(undefined, {timeZone:z.tz, hour:"2-digit", minute:"2-digit"});
        $body.find('.w-worldclock-row[data-tz="'+z.tz+'"] [data-role="t"]').text(str);
      }catch(e){}
    });
  },
  contentFields: function(w){
    var opts = ["America/New_York","America/Los_Angeles","America/Chicago","Europe/London","Europe/Paris","Europe/Berlin","Asia/Tokyo","Asia/Manila","Asia/Singapore","Asia/Kolkata","Asia/Dubai","Australia/Sydney","Pacific/Auckland"];
    var rows = (w.data.zones||[]).map(function(z,i){
      return '<div class="field-row" data-idx="'+i+'"><div class="field"><input class="text-input" data-role="zcity" value="'+escapeHtml(z.city)+'"></div>'+
        '<div class="field"><select class="select-input" data-role="ztz">'+opts.map(function(o){return '<option value="'+o+'" '+(o===z.tz?"selected":"")+'>'+o+'</option>';}).join("")+'</select></div>'+
        '<button class="icon-btn small" data-role="zdel" style="align-self:center">✕</button></div>';
    }).join("");
    return field("Time zones", '<div data-role="zoneList">'+rows+'</div><button class="w-pomo-btn" data-role="zadd" style="margin-top:8px;width:100%">+ Add zone</button>');
  }
};

/* ---------- CALENDAR ---------- */
ENGINES.calendar = {
  render: function(w){
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y,m,1); var startDow = first.getDay();
    var daysInMonth = new Date(y,m+1,0).getDate();
    var daysInPrev = new Date(y,m,0).getDate();
    var monthName = now.toLocaleDateString(undefined,{month:"long", year:"numeric"});
    var html = '<div class="w-cal-title">'+monthName+'</div><div class="w-cal-grid">';
    ["S","M","T","W","T","F","S"].forEach(function(d){ html += '<div class="w-cal-dow">'+d+'</div>'; });
    for(var i=0;i<startDow;i++) html += '<div class="w-cal-day other">'+(daysInPrev-startDow+i+1)+'</div>';
    for(var d2=1; d2<=daysInMonth; d2++){
      var key = y+"-"+pad(m+1)+"-"+pad(d2);
      var isToday = d2===now.getDate();
      var hasEvent = !!(w.data.events||{})[key];
      html += '<div class="w-cal-day '+(isToday?"today":"")+' '+(hasEvent?"has-event":"")+'" data-key="'+key+'" title="'+(w.data.events[key]||"Click to add a note")+'">'+d2+'</div>';
    }
    var remain = (7 - (startDow+daysInMonth)%7)%7;
    for(var d3=1; d3<=remain; d3++) html += '<div class="w-cal-day other">'+d3+'</div>';
    html += '</div>';
    return html;
  },
  afterRender: function($body, w){
    $body.find(".w-cal-day:not(.other)").on("click", function(){
      var key = $(this).attr("data-key");
      var current = w.data.events[key] || "";
      var note = prompt("Note for "+key+":", current);
      if(note===null) return;
      if(note.trim()) w.data.events[key] = note.trim(); else delete w.data.events[key];
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- CALCULATOR ---------- */
ENGINES.calculator = {
  render: function(){
    var keys = ["7","8","9","÷","4","5","6","×","1","2","3","−","0",".","C","+","="];
    var html = '<div class="w-calc-display" data-role="disp">0</div><div class="w-calc-grid">';
    keys.forEach(function(k){
      var cls = "w-calc-btn" + (["÷","×","−","+"].indexOf(k)>-1?" op":"") + (k==="="?" eq":"");
      html += '<button class="'+cls+'" data-k="'+k+'">'+k+'</button>';
    });
    html += '</div>';
    return html;
  },
  afterRender: function($body, w){
    var expr = "";
    var $disp = $body.find('[data-role="disp"]');
    function render(){ $disp.text(expr || "0"); }
    $body.find(".w-calc-btn").on("click", function(){
      var k = $(this).attr("data-k");
      if(k==="C"){ expr=""; render(); return; }
      if(k==="="){
        try{
          var safe = expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
          if(!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error("bad");
          var result = Function('"use strict";return ('+safe+')')();
          expr = String(Math.round(result*10000)/10000);
        }catch(e){ expr = "Error"; }
        render(); return;
      }
      if(expr==="Error") expr="";
      expr += k;
      render();
    });
    render();
  }
};

/* ---------- PRODUCTIVITY SCORE (analytics) ---------- */
ENGINES.score = {
  render: function(){
    var dash = getActiveDash();
    var total=0, done=0;
    dash.sections.forEach(function(s){ s.widgets.forEach(function(w){
      if(w.engine==="list" && w.data.items){ total += w.data.items.length; done += w.data.items.filter(function(i){return i.done;}).length; }
    }); });
    var pct = total ? Math.round(done/total*100) : 0;
    var week = last7CountsFromActivity();
    var max = Math.max(1, Math.max.apply(null, week));
    var bars = week.map(function(v){ return '<div class="w-score-bar" style="height:'+Math.max(6,(v/max)*44)+'px"></div>'; }).join("");
    return '<div class="w-score-num">'+pct+'</div><div class="w-score-label">across '+total+' tracked item'+(total===1?"":"s")+'</div>'+
      '<div class="w-score-bars">'+bars+'</div>';
  },
  afterRender: function(){}
};
function last7CountsFromActivity(){
  var act = state._activity || {};
  var out = [];
  for(var i=6;i>=0;i--){
    var d = new Date(); d.setDate(d.getDate()-i);
    out.push(act[dayKey(d)] || 0);
  }
  return out;
}

/* ---------- WEEKLY ACTIVITY (analytics) ---------- */
ENGINES.activity = {
  render: function(){
    var week = last7CountsFromActivity();
    var max = Math.max(1, Math.max.apply(null, week));
    var labels = []; for(var i=6;i>=0;i--){ var d=new Date(); d.setDate(d.getDate()-i); labels.push(weekdayShort(d.getDay())); }
    var bars = week.map(function(v,i){ return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div class="w-score-bar" style="width:60%;height:'+Math.max(6,(v/max)*60)+'px"></div><span style="font-size:9.5px;color:var(--text-faint)">'+labels[i]+'</span></div>'; }).join("");
    var total = week.reduce(function(a,b){return a+b;},0);
    return '<div class="w-score-label" style="text-align:left;margin-bottom:6px">'+total+' actions completed this week</div><div style="display:flex;align-items:flex-end;height:70px;gap:4px">'+bars+'</div>';
  },
  afterRender: function(){}
};

/* ---------- COUNTER (study hours) ---------- */
ENGINES.counter = {
  render: function(w){
    var key = dayKey();
    var today = (w.data.log[key]||0);
    var week = 0; for(var i=0;i<7;i++){ var d=new Date(); d.setDate(d.getDate()-i); week += (w.data.log[dayKey(d)]||0); }
    return '<div class="w-score-num" style="font-size:34px" data-role="today">'+today+'</div><div class="w-score-label">minutes today · '+week+' this week</div>'+
      '<div class="w-pomo-controls" style="margin-top:10px"><button class="w-pomo-btn" data-role="m15">+15</button><button class="w-pomo-btn" data-role="m30">+30</button><button class="w-pomo-btn" data-role="m60">+60</button><button class="w-pomo-btn" data-role="reset">Reset today</button></div>';
  },
  afterRender: function($body, w){
    function add(mins){
      var key = dayKey();
      w.data.log[key] = (w.data.log[key]||0) + mins;
      logCompletion();
      commitWidget(w); refreshWidget(w.id);
    }
    $body.find('[data-role="m15"]').on("click", function(){ add(15); });
    $body.find('[data-role="m30"]').on("click", function(){ add(30); });
    $body.find('[data-role="m60"]').on("click", function(){ add(60); });
    $body.find('[data-role="reset"]').on("click", function(){ w.data.log[dayKey()]=0; commitWidget(w); refreshWidget(w.id); });
  }
};

/* ---------- HABIT STREAK (analytics) ---------- */
ENGINES.streak = {
  render: function(){
    var dash = getActiveDash();
    var best = {name:null, streak:0};
    dash.sections.forEach(function(s){ s.widgets.forEach(function(w){
      if(w.engine==="habit"){
        (w.data.habits||[]).forEach(function(h){
          var streak = 0;
          for(var i=0;i<365;i++){ var d=new Date(); d.setDate(d.getDate()-i); if(h.days[dayKey(d)]) streak++; else break; }
          if(streak>best.streak){ best = {name:h.name, streak:streak}; }
        });
      }
    }); });
    if(!best.name) return '<div class="w-empty-hint">Add a Habit Tracker widget to see your streak here.</div>';
    return '<div class="w-score-num" style="font-size:36px">'+best.streak+'</div><div class="w-score-label">day streak · '+escapeHtml(best.name)+'</div>';
  },
  afterRender: function(){}
};

/* ---------- GRADES / GPA ---------- */
ENGINES.grades = {
  render: function(w){
    var courses = w.data.courses || [];
    var scale = {"A":4,"A-":3.7,"B+":3.3,"B":3,"B-":2.7,"C+":2.3,"C":2,"D":1,"F":0};
    var sum=0, n=0;
    var html = '<ul class="w-list">';
    courses.forEach(function(c){
      sum += (scale[c.grade]!=null?scale[c.grade]:0); n++;
      html += '<li class="w-list-item" data-id="'+c.id+'"><span class="w-item-label">'+escapeHtml(c.name)+'</span><span style="font-family:var(--font-mono);font-size:11.5px;color:var(--accent)">'+c.grade+'</span><span class="w-item-del" data-role="del"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></span></li>';
    });
    html += '</ul>';
    if(!courses.length) html += '<div class="w-empty-hint">Add a course and its grade below.</div>';
    var gpa = n ? (sum/n).toFixed(2) : "—";
    html = '<div class="w-score-label" style="text-align:left;margin-bottom:6px">GPA: <b style="color:var(--text);font-family:var(--font-display);font-size:16px">'+gpa+'</b></div>' + html;
    html += '<div class="w-add-row"><input type="text" placeholder="Course name" data-role="input" style="flex:1.4">'+
      '<select class="select-input" data-role="grade" style="flex:0 0 66px;padding:6px">'+Object.keys(scale).map(function(g){return '<option value="'+g+'">'+g+'</option>';}).join("")+'</select>'+
      '<button data-role="add">+</button></div>';
    return html;
  },
  afterRender: function($body, w){
    $body.find('[data-role="add"]').on("click", function(){
      var name = $body.find('[data-role="input"]').val().trim(); if(!name) return;
      w.data.courses.push({id:uid("crs"), name:name, grade:$body.find('[data-role="grade"]').val()});
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="del"]').on("click", function(){
      var id = $(this).closest("li").attr("data-id");
      w.data.courses = w.data.courses.filter(function(c){return c.id!==id;});
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- SCHEDULE (today / events / weekly planner) ---------- */
ENGINES.schedule = {
  render: function(w){
    var items = (w.data.items||[]).slice().sort(function(a,b){ return (a.time||"").localeCompare(b.time||""); });
    var html = "";
    items.forEach(function(it){
      html += '<div class="w-schedule-item" data-id="'+it.id+'"><span class="w-schedule-time">'+escapeHtml(it.time||"")+'</span><span class="w-schedule-label">'+escapeHtml(it.label)+'</span><span class="w-item-del" data-role="del"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></span></div>';
    });
    if(!items.length) html += '<div class="w-empty-hint">Nothing scheduled — add your first item.</div>';
    html += '<div class="w-add-row"><input type="time" data-role="time" style="flex:0 0 92px;background:var(--glass);border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:11.5px;padding:0 4px">'+
      '<input type="text" placeholder="What\'s happening?" data-role="input"><button data-role="add">+</button></div>';
    return html;
  },
  afterRender: function($body, w){
    $body.find('[data-role="add"]').on("click", function(){
      var label = $body.find('[data-role="input"]').val().trim(); if(!label) return;
      w.data.items.push({id:uid("sc"), time:$body.find('[data-role="time"]').val(), label:label});
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="input"]').on("keydown", function(e){ if(e.key==="Enter") $body.find('[data-role="add"]').trigger("click"); });
    $body.find('[data-role="del"]').on("click", function(){
      var id = $(this).closest(".w-schedule-item").attr("data-id");
      w.data.items = w.data.items.filter(function(i){return i.id!==id;});
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- QUICK LINKS / BOOKMARKS ---------- */
ENGINES.links = {
  render: function(w){
    var items = w.data.items || [];
    var html = "";
    items.forEach(function(it){
      var href = /^https?:\/\//.test(it.url) ? it.url : "https://"+it.url;
      html += '<div class="w-link-item" data-id="'+it.id+'"><a href="'+escapeHtml(href)+'" target="_blank" rel="noopener">🔗 '+escapeHtml(it.label||it.url)+'</a><span class="w-item-del" data-role="del"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></span></div>';
    });
    if(!items.length) html += '<div class="w-empty-hint">Add a link you visit often.</div>';
    html += '<div class="w-add-row"><input type="text" placeholder="Label" data-role="label" style="flex:0.8"><input type="text" placeholder="URL" data-role="url"><button data-role="add">+</button></div>';
    return html;
  },
  afterRender: function($body, w){
    $body.find('[data-role="add"]').on("click", function(){
      var url = $body.find('[data-role="url"]').val().trim(); if(!url) return;
      var label = $body.find('[data-role="label"]').val().trim();
      w.data.items.push({id:uid("lnk"), url:url, label:label||url});
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="del"]').on("click", function(){
      var id = $(this).closest(".w-link-item").attr("data-id");
      w.data.items = w.data.items.filter(function(i){return i.id!==id;});
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- CUSTOM TEXT / IMPORTANT INFO ---------- */
ENGINES.info = {
  render: function(w){
    return '<textarea class="w-notes-area w-info-text" data-role="text" style="min-height:60px">'+escapeHtml(w.data.text||"")+'</textarea>';
  },
  afterRender: function($body, w){
    var t;
    $body.find('[data-role="text"]').on("input", function(){
      w.data.text = $(this).val();
      clearTimeout(t); t=setTimeout(function(){ commitWidget(w); }, 400);
    });
  }
};

/* ---------- QUOTE OF THE DAY ---------- */
var QUOTES = [
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  ["Small daily improvements are the key to staggering long-term results.", "Anonymous"],
  ["Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"],
  ["Focus on being productive instead of busy.", "Tim Ferriss"],
  ["You do not rise to the level of your goals; you fall to the level of your systems.", "James Clear"],
  ["Action is the foundational key to all success.", "Pablo Picasso"],
  ["The way to get started is to quit talking and begin doing.", "Walt Disney"],
  ["A year from now you may wish you had started today.", "Karen Lamb"]
];
ENGINES.quote = {
  render: function(){
    var idx = Math.floor(new Date().setHours(0,0,0,0)/86400000) % QUOTES.length;
    var q = QUOTES[idx];
    return '<div class="w-quote-text">"'+q[0]+'"</div><div class="w-quote-author">— '+q[1]+'</div>';
  },
  afterRender: function(){}
};

/* ---------- WEATHER (demo data — offline-safe) ---------- */
ENGINES.weather = {
  render: function(w){
    var city = w.data.city || "Your city";
    var seed = 0; for(var i=0;i<city.length;i++) seed += city.charCodeAt(i);
    seed += new Date().getDate();
    var conds = ["Clear","Partly cloudy","Cloudy","Light rain","Sunny","Windy"];
    var cond = conds[seed % conds.length];
    var temp = 18 + (seed % 14);
    return '<div class="w-weather-temp">'+temp+'°</div><div class="w-weather-cond">'+cond+'</div><div class="w-weather-city">'+escapeHtml(city)+' · demo data</div>';
  },
  afterRender: function(){},
  contentFields: function(w){
    return field("City", '<input type="text" class="text-input" data-role="cfgCity" value="'+escapeHtml(w.data.city||"")+'">');
  }
};

/* ---------- NEWS (static evergreen headlines, offline-safe) ---------- */
var NEWS_ITEMS = [
  "Study finds short breaks improve sustained focus",
  "Time-blocking remains a top productivity technique for 2026",
  "Researchers link consistent sleep schedules to better recall",
  "Minimalist workspaces linked to reduced decision fatigue",
  "The Pomodoro Technique, 35 years on, still holds up"
];
ENGINES.news = {
  render: function(){
    var html = "";
    NEWS_ITEMS.forEach(function(h){ html += '<div class="w-schedule-item"><span class="w-schedule-label">📰 '+h+'</span></div>'; });
    html += '<div class="w-empty-hint" style="text-align:left;padding-top:8px">Demo headlines — connect a news source for live updates.</div>';
    return html;
  },
  afterRender: function(){}
};

/* ---------- UNIT CONVERTER ---------- */
var UNIT_DEFS = {
  length: {units:{m:1, km:1000, cm:0.01, mi:1609.34, ft:0.3048, in:0.0254}, label:"Length"},
  weight: {units:{kg:1, g:0.001, lb:0.453592, oz:0.0283495}, label:"Weight"},
  temp: {label:"Temperature"}
};
ENGINES.unitconv = {
  render: function(w){
    var kind = w.data.kind || "length";
    var opts = kind==="temp" ? {c:"°C", f:"°F", k:"K"} : UNIT_DEFS[kind].units;
    var unitKeys = Object.keys(opts);
    var seg = Object.keys(UNIT_DEFS).map(function(k){ return '<button data-v="'+k+'" class="'+(kind===k?"active":"")+'">'+UNIT_DEFS[k].label+'</button>'; }).join("");
    var fromOpts = unitKeys.map(function(u){ return '<option value="'+u+'">'+u+'</option>'; }).join("");
    return '<div class="seg" data-role="kindSeg" style="margin-bottom:10px">'+seg+'</div>'+
      '<div class="field-row"><div class="field"><input type="number" class="text-input" data-role="val" value="1"></div><div class="field"><select class="select-input" data-role="fromUnit">'+fromOpts+'</select></div></div>'+
      '<div style="text-align:center;color:var(--text-faint);margin:6px 0">↓ converts to all units ↓</div>'+
      '<div data-role="results" style="display:flex;flex-direction:column;gap:4px;font-size:12px"></div>';
  },
  afterRender: function($body, w){
    function compute(){
      var val = parseFloat($body.find('[data-role="val"]').val()) || 0;
      var kind = w.data.kind;
      var $res = $body.find('[data-role="results"]').empty();
      if(kind==="temp"){
        var from = $body.find('[data-role="fromUnit"]').val();
        var c = from==="c" ? val : from==="f" ? (val-32)*5/9 : val-273.15;
        var out = {c:c, f:c*9/5+32, k:c+273.15};
        Object.keys(out).forEach(function(u){ $res.append('<div>'+u.toUpperCase()+': <b>'+out[u].toFixed(2)+'</b></div>'); });
      } else {
        var units = UNIT_DEFS[kind].units;
        var fromU = $body.find('[data-role="fromUnit"]').val();
        var base = val * units[fromU];
        Object.keys(units).forEach(function(u){ $res.append('<div>'+u+': <b>'+(base/units[u]).toFixed(4)+'</b></div>'); });
      }
    }
    $body.find('[data-role="kindSeg"] button').on("click", function(){
      w.data.kind = $(this).attr("data-v");
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="val"], [data-role="fromUnit"]').on("input change", compute);
    compute();
  }
};

/* ---------- COLOR PICKER ---------- */
ENGINES.color = {
  render: function(w){
    var c = w.data.color || "#8B7CFA";
    return '<div class="w-swatch-preview" style="background:'+c+'"></div>'+
      '<div class="field-row"><input type="color" data-role="picker" value="'+c+'" style="width:44px;height:36px;border:none;background:none;padding:0"><input type="text" class="text-input" data-role="hex" value="'+c+'"></div>';
  },
  afterRender: function($body, w){
    function apply(v){
      w.data.color = v;
      commitWidget(w);
      $body.find(".w-swatch-preview").css("background", v);
      $body.find('[data-role="hex"]').val(v);
      $body.find('[data-role="picker"]').val(v);
    }
    $body.find('[data-role="picker"]').on("input", function(){ apply(this.value); });
    $body.find('[data-role="hex"]').on("change", function(){ apply(this.value); });
  }
};

/* ---------- PASSWORD GENERATOR ---------- */
ENGINES.password = {
  render: function(w){
    return '<div class="w-pw-output" data-role="out">—</div>'+
      '<div class="field"><label>Length: <span data-role="lenLabel">'+w.data.length+'</span></label><input type="range" min="6" max="32" value="'+w.data.length+'" data-role="len"></div>'+
      '<div class="toggle-row"><span>Numbers</span><label class="switch"><input type="checkbox" data-role="nums" '+(w.data.numbers?"checked":"")+'><span class="switch-track"></span></label></div>'+
      '<div class="toggle-row" style="margin:6px 0"><span>Symbols</span><label class="switch"><input type="checkbox" data-role="syms" '+(w.data.symbols?"checked":"")+'><span class="switch-track"></span></label></div>'+
      '<button class="w-pomo-btn primary" data-role="gen" style="width:100%">Generate</button>';
  },
  afterRender: function($body, w){
    function gen(){
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      if(w.data.numbers) chars += "0123456789";
      if(w.data.symbols) chars += "!@#$%^&*()_-+=?";
      var out = "";
      for(var i=0;i<w.data.length;i++) out += chars[Math.floor(Math.random()*chars.length)];
      $body.find('[data-role="out"]').text(out);
    }
    $body.find('[data-role="len"]').on("input", function(){
      w.data.length = +this.value; $body.find('[data-role="lenLabel"]').text(this.value); commitWidget(w);
    });
    $body.find('[data-role="nums"]').on("change", function(){ w.data.numbers = this.checked; commitWidget(w); });
    $body.find('[data-role="syms"]').on("change", function(){ w.data.symbols = this.checked; commitWidget(w); });
    $body.find('[data-role="gen"]').on("click", gen);
    gen();
  }
};

/* ---------- QR GENERATOR ---------- */
ENGINES.qr = {
  render: function(w){
    var text = encodeURIComponent(w.data.text || "https://lifeboard.app");
    return '<img data-role="img" alt="QR code" style="width:100%;max-width:150px;display:block;margin:0 auto 10px;border-radius:8px;background:#fff;padding:8px" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+text+'">'+
      '<input type="text" class="text-input" data-role="text" value="'+escapeHtml(w.data.text||"")+'" placeholder="Text or URL">';
  },
  afterRender: function($body, w){
    $body.find('[data-role="text"]').on("change", function(){
      w.data.text = $(this).val();
      commitWidget(w);
      $body.find('[data-role="img"]').attr("src", "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="+encodeURIComponent(w.data.text||""));
    });
  }
};

/* ---------- STOPWATCH ---------- */
ENGINES.stopwatch = {
  render: function(w){
    return '<div class="w-pomo-time" data-role="time">'+fmtHM(w.data.elapsed)+'</div>'+
      '<div class="w-pomo-controls"><button class="w-pomo-btn primary" data-role="toggle">'+(w.data.running?"Pause":"Start")+'</button><button class="w-pomo-btn" data-role="reset">Reset</button></div>';
  },
  afterRender: function($body, w){
    $body.find('[data-role="toggle"]').on("click", function(){
      w.data.running = !w.data.running; w.data.lastTick = Date.now();
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="reset"]').on("click", function(){
      w.data.elapsed = 0; w.data.running = false;
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* ---------- TIMER ---------- */
ENGINES.timer = {
  render: function(w){
    return '<div class="w-pomo-time" data-role="time">'+fmtHM(w.data.remaining)+'</div>'+
      '<div class="field-row" style="margin-bottom:8px"><input type="number" min="1" max="180" class="text-input" data-role="mins" value="'+w.data.minutes+'" placeholder="Minutes"></div>'+
      '<div class="w-pomo-controls"><button class="w-pomo-btn primary" data-role="toggle">'+(w.data.running?"Pause":"Start")+'</button><button class="w-pomo-btn" data-role="reset">Reset</button></div>';
  },
  afterRender: function($body, w){
    $body.find('[data-role="mins"]').on("change", function(){
      w.data.minutes = Math.max(1, +this.value||1);
      w.data.remaining = w.data.minutes*60; w.data.running=false;
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="toggle"]').on("click", function(){
      w.data.running = !w.data.running; w.data.lastTick = Date.now();
      commitWidget(w); refreshWidget(w.id);
    });
    $body.find('[data-role="reset"]').on("click", function(){
      w.data.remaining = (w.data.minutes||10)*60; w.data.running = false;
      commitWidget(w); refreshWidget(w.id);
    });
  }
};

/* =====================================================================
   ENGINE-SPECIFIC INSPECTOR "CONTENT" WIRING
   (handles the config fields declared by contentFields() above)
===================================================================== */
$(document).on("change input", "#inspectorBody [data-role]", function(){
  var found = findWidget(selectedWidgetId);
  if(!found) return;
  var w = found.widget;
  var role = $(this).attr("data-role");
  var v = this.value;
  switch(role){
    case "cfgPrio": w.data.showPriority = this.checked; break;
    case "cfgDeadline": w.data.showDeadline = this.checked; break;
    case "cfgProgress": w.data.showProgress = this.checked; break;
    case "cfgWork": w.data.work = Math.max(1,+v||25); if(!w.data.running){ w.data.remaining = w.data.work*60; } break;
    case "cfgBrk": w.data.brk = Math.max(1,+v||5); break;
    case "cfgLabel": w.data.label = v; break;
    case "cfgTarget": w.data.target = v; break;
    case "cfgCity": w.data.city = v; break;
    default: return;
  }
  commitWidget(w);
  refreshWidget(w.id);
});
$(document).on("click", "#inspectorBody [data-role='zadd']", function(){
  var found = findWidget(selectedWidgetId); if(!found) return;
  found.widget.data.zones.push({city:"New City", tz:"UTC"});
  commitWidget(found.widget); refreshWidget(found.widget.id); renderInspectorBody("content");
});
$(document).on("click", "#inspectorBody [data-role='zdel']", function(){
  var found = findWidget(selectedWidgetId); if(!found) return;
  var idx = +$(this).closest("[data-idx]").attr("data-idx");
  found.widget.data.zones.splice(idx,1);
  commitWidget(found.widget); refreshWidget(found.widget.id); renderInspectorBody("content");
});
$(document).on("input change", "#inspectorBody [data-role='zcity'], #inspectorBody [data-role='ztz']", function(){
  var found = findWidget(selectedWidgetId); if(!found) return;
  var idx = +$(this).closest("[data-idx]").attr("data-idx");
  var z = found.widget.data.zones[idx]; if(!z) return;
  if($(this).attr("data-role")==="zcity") z.city = this.value; else z.tz = this.value;
  commitWidget(found.widget); refreshWidget(found.widget.id);
});

/* =====================================================================
   TICKER — live clocks & running timers
===================================================================== */
function startTicker(){
  setInterval(function(){
    tickLiveWidgets();
  }, 1000);
}
function tickLiveWidgets(){
  var dash = getActiveDash();
  var changed = false;
  var nowD = new Date();
  dash.sections.forEach(function(s){ s.widgets.forEach(function(w){
    var $el = $('.widget[data-widget-id="'+w.id+'"] .widget-body');
    if(!$el.length) return;
    if(w.engine==="clock"){
      $el.find('[data-role="time"]').text(fmtTime(nowD));
      $el.find('[data-role="date"]').text(nowD.toDateString());
    } else if(w.engine==="worldclock"){
      ENGINES.worldclock.tick($el, w);
    } else if(w.engine==="pomodoro" && w.data.running){
      w.data.remaining = Math.max(0, w.data.remaining-1);
      if(w.data.remaining<=0){
        if(w.data.phase==="work"){ w.data.phase="break"; w.data.remaining=(w.data.brk||5)*60; logCompletion(); }
        else { w.data.phase="work"; w.data.remaining=(w.data.work||25)*60; }
      }
      $el.find('[data-role="time"]').text(fmtHM(w.data.remaining));
      changed = true;
    } else if(w.engine==="stopwatch" && w.data.running){
      w.data.elapsed += 1;
      $el.find('[data-role="time"]').text(fmtHM(w.data.elapsed));
      changed = true;
    } else if(w.engine==="timer" && w.data.running){
      w.data.remaining = Math.max(0, w.data.remaining-1);
      $el.find('[data-role="time"]').text(fmtHM(w.data.remaining));
      if(w.data.remaining<=0) w.data.running=false;
      changed = true;
    }
  }); });
  if(changed) saveState(true);
}

function touchAndRefresh(w, needsClassRefresh){
  w.modifiedAt = nowISO();
  saveState(true);
  var $el = $('.widget[data-widget-id="'+w.id+'"]');
  if(needsClassRefresh){ $el.attr("class", widgetClasses(w)); if(selectedWidgetId===w.id) $el.addClass("selected"); }
  applyWidgetInlineStyle($el, w);
}

})();
