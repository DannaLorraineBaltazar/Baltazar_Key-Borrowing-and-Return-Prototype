// 1. SCREEN NAVIGATION

var authArea = document.getElementById("authArea");   
var appArea = document.getElementById("app");         

var authScreens = ["login", "signup"];

var sidebarFor = {
  dashboard: "dashboard",
  records: "records",
  add: "add",
  view: "records",
  edit: "records"
};

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(function (screen) {
    screen.classList.remove("active");
  });
  document.getElementById("screen-" + name).classList.add("active");

  var isAuthScreen = authScreens.indexOf(name) !== -1;
  authArea.classList.toggle("hidden", !isAuthScreen);
  appArea.classList.toggle("hidden", isAuthScreen);

  document.querySelectorAll("[data-nav]").forEach(function (link) {
    link.classList.toggle("active", link.dataset.nav === sidebarFor[name]);
  });

  window.scrollTo(0, 0);
}

document.addEventListener("click", function (event) {
  var link = event.target.closest("[data-goto]");
  if (link) {
    event.preventDefault();                 
    showScreen(link.dataset.goto);
  }
});

// 2. LOGIN 

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();
  showScreen("dashboard");
});

// 3. SIGN UP

document.getElementById("signupForm").addEventListener("submit", function (event) {
  event.preventDefault();

  var password = document.getElementById("signupPassword").value;
  var confirm = document.getElementById("confirmPassword").value;
  var message = document.getElementById("confirmError");

  if (password !== confirm) {
    message.textContent = "Passwords do not match.";
  } else {
    message.textContent = "";
    showScreen("dashboard");
  }
});


 // 4. ADD / EDIT RECORD

document.querySelectorAll(".record-form").forEach(function (form) {
  var keySelect = form.querySelector(".key-select");
  var roomSelect = form.querySelector(".room-select");
  var keyCode = form.querySelector(".key-code");

  function syncKey(from, to) {
    to.value = from.value;
    var chosen = from.options[from.selectedIndex];
    keyCode.value = chosen.dataset.code || "KH-001";
  }

  keySelect.addEventListener("change", function () {
    syncKey(keySelect, roomSelect);
  });

  roomSelect.addEventListener("change", function () {
    syncKey(roomSelect, keySelect);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var borrowed = form.querySelector(".borrowed-time").value;
    var expected = form.querySelector(".expected-time").value;
    var message = form.querySelector(".error");

    if (expected <= borrowed) {
      message.textContent = "Expected return must be after the borrowed time.";
    } else {
      message.textContent = "";
      showScreen("records");
    }
  });
});

// 5. SEARCH (Record List) 

var statusFilter = document.getElementById("statusFilter");

function applyFilters() {
  var text = document.getElementById("searchBox").value.toLowerCase();
  var status = statusFilter.value;

  document.querySelectorAll("#screen-records tbody tr").forEach(function (row) {
    var matchesText = row.textContent.toLowerCase().indexOf(text) !== -1;
    var badge = row.querySelector(".badge");
    var matchesStatus = status === "all" || (badge && badge.classList.contains(status));
    row.classList.toggle("hidden", !(matchesText && matchesStatus));
  });
}

document.getElementById("searchBox").addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

// 6. DELETE CONFIRMATION DIALOG 

var deleteDialog = document.getElementById("deleteDialog");
var rowToDelete = null;

document.querySelectorAll(".delete-button").forEach(function (button) {
  button.addEventListener("click", function () {
    rowToDelete = button.closest("tr");
    deleteDialog.showModal();
  });
});

document.getElementById("cancelDelete").addEventListener("click", function () {
  deleteDialog.close();
});

document.getElementById("confirmDelete").addEventListener("click", function () {
  rowToDelete.remove();                     
  deleteDialog.close();
});

// 7. RECORD DATA 

var records = {
  "KH-004": { key: "EMC Lab Key", facility: "EMC Laboratory", borrower: "Moira Cielo F. Tendencia", borrowerId: "2023-70184", borrowed: "2026-10-24T10:30", expected: "2026-10-24T12:00", actual: "", status: "borrowed", notes: "" },
  "KH-005": { key: "IT Laboratory Key", facility: "IT Laboratory", borrower: "Xandra T. Romero", borrowerId: "2023-70211", borrowed: "2026-10-24T09:30", expected: "2026-10-24T12:00", actual: "", status: "borrowed", notes: "" },
  "KH-003": { key: "Sound Production Lab Key", facility: "Sound Production Laboratory", borrower: "Andrea L. Alonzo", borrowerId: "2023-70097", borrowed: "2026-10-24T09:30", expected: "2026-10-24T14:15", actual: "2026-10-24T14:00", status: "returned", notes: "" },
  "KH-001": { key: "SIM1 Key", facility: "Simulation Room 1", borrower: "Sophia Yzabel V. Padua", borrowerId: "2023-70142", borrowed: "2026-10-24T08:00", expected: "2026-10-24T10:30", actual: "", status: "borrowed", notes: "" },
  "KH-006": { key: "CLAB 1 Key", facility: "Computer Laboratory 1", borrower: "Karl Lorenz B. Baltazar", borrowerId: "2023-70256", borrowed: "2026-10-24T07:00", expected: "2026-10-24T12:00", actual: "", status: "borrowed", notes: "" },
  "KH-010": { key: "CLAB 5 Key", facility: "Computer Laboratory 5", borrower: "Rio H. Vidal", borrowerId: "2023-70333", borrowed: "2026-10-24T07:00", expected: "2026-10-24T10:00", actual: "", status: "overdue", notes: "" }
};

var currentCode = null;   

function formatDateTime(value) {
  if (!value) { return ""; }
  var d = new Date(value);
  var date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  var time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date + ", " + time;
}

function statusBadge(status) {
  var label = status.charAt(0).toUpperCase() + status.slice(1);
  return '<span class="badge ' + status + '">' + label + "</span>";
}

function fillView(code) {
  var r = records[code];
  document.getElementById("viewSubtitle").textContent = r.key + " · " + (r.code || code);
  document.getElementById("viewKey").innerHTML = "<b>" + r.key + "</b>";
  document.getElementById("viewCode").textContent = r.code || code;
  document.getElementById("viewFacility").textContent = r.facility;
  document.getElementById("viewBorrower").textContent = r.borrower;
  document.getElementById("viewBorrowerId").textContent = r.borrowerId || "None";
  document.getElementById("viewBorrowed").textContent = formatDateTime(r.borrowed);
  document.getElementById("viewExpected").textContent = formatDateTime(r.expected);
  document.getElementById("viewActual").textContent = r.actual ? formatDateTime(r.actual) : "Not yet returned";
  document.getElementById("viewStatus").innerHTML = statusBadge(r.status);
  document.getElementById("viewNotes").textContent = r.notes || "None";
  document.getElementById("markReturned").classList.toggle("hidden", r.status === "returned");
}

function fillEdit(code) {
  var r = records[code];
  var form = document.getElementById("editForm");
  var keySelect = document.getElementById("editKey");
  var roomSelect = document.getElementById("editRoom");

  for (var i = 0; i < keySelect.options.length; i++) {
    if (keySelect.options[i].dataset.code === (r.code || code)) {
      keySelect.selectedIndex = i;
      roomSelect.selectedIndex = i;
    }
  }
  document.getElementById("editCode").value = r.code || code;
  document.getElementById("editName").value = r.borrower;
  document.getElementById("editId").value = r.borrowerId;
  document.getElementById("editBorrowed").value = r.borrowed;
  document.getElementById("editExpected").value = r.expected;
  document.getElementById("editActual").value = r.actual;
  document.getElementById("editNotes").value = r.notes;
  form.querySelector(".error").textContent = "";
}

function refreshRow(code) {
  var r = records[code];
  document.querySelectorAll('#screen-records tbody tr[data-code="' + code + '"]').forEach(function (row) {
    var cells = row.children;
    cells[0].innerHTML = "<b>" + r.key + "</b><small>" + (r.code || code) + "</small>";
    cells[1].textContent = r.facility;
    cells[2].textContent = r.borrower;
    cells[3].innerHTML = formatDateTime(r.borrowed).replace(/, (?=[^,]*$)/, "<small>") + "</small>";
    cells[4].innerHTML = formatDateTime(r.expected).replace(/, (?=[^,]*$)/, "<small>") + "</small>";
    cells[5].innerHTML = statusBadge(r.status);
  });
  applyFilters();
  document.querySelectorAll('.recent-item[data-code="' + code + '"]').forEach(function (item) {
    item.querySelector("small").textContent = r.borrower + " \u00b7 " + r.facility;
    item.querySelector(".badge").outerHTML = statusBadge(r.status);
  });
}

document.addEventListener("click", function (event) {
  var link = event.target.closest('[data-goto="view"], [data-goto="edit"]');
  if (!link) { return; }
  var holder = link.closest("[data-code]");
  if (!holder) { return; }
  currentCode = holder.dataset.code;
  if (link.dataset.goto === "view") { fillView(currentCode); } else { fillEdit(currentCode); }
}, true);

document.getElementById("markReturned").addEventListener("click", function (event) {
  event.preventDefault();
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  records[currentCode].actual = now.toISOString().slice(0, 16);
  records[currentCode].status = "returned";
  refreshRow(currentCode);
  showScreen("records");
});

document.getElementById("editForm").addEventListener("submit", function () {
  if (document.querySelector("#editForm .error").textContent !== "") { return; }
  var r = records[currentCode];
  var keySelect = document.getElementById("editKey");
  var roomSelect = document.getElementById("editRoom");
  r.key = keySelect.options[keySelect.selectedIndex].text;
  r.facility = roomSelect.options[roomSelect.selectedIndex].text;
  r.code = document.getElementById("editCode").value;
  r.borrower = document.getElementById("editName").value;
  r.borrowerId = document.getElementById("editId").value;
  r.borrowed = document.getElementById("editBorrowed").value;
  r.expected = document.getElementById("editExpected").value;
  r.actual = document.getElementById("editActual").value;
  r.notes = document.getElementById("editNotes").value;
  if (r.actual) { r.status = "returned"; }
  else if (new Date(r.expected) < new Date() && r.status !== "returned") { r.status = "overdue"; }
  refreshRow(currentCode);
});

showScreen("login");