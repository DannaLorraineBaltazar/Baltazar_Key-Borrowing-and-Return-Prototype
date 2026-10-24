(function () {
'use strict';
var H = 3600e3, PER = 8, KEY = 'kbr-proto-v2';
var IC = {
  key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', plus: 'M12 5v14M5 12h14', back: 'M15 6l-6 6 6 6',
  fac: 'M5 3h14v18H5zM9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  set: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M14 4v4M8 10v4M16 16v4', out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'
};
function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* ---------- data ---------- */
function seed() {
  var fac = [['SIM1', 'Simulation Room 1'], ['SIM2', 'Simulation Room 2'], ['Sound Production Lab', 'Sound Production Laboratory'], ['EMC Lab', 'EMC Laboratory'], ['IT Laboratory', 'IT Laboratory'],
    ['CLAB 1', 'Computer Laboratory 1'], ['CLAB 2', 'Computer Laboratory 2'], ['CLAB 3', 'Computer Laboratory 3'], ['CLAB 4', 'Computer Laboratory 4'], ['CLAB 5', 'Computer Laboratory 5'], ['CLAB 6', 'Computer Laboratory 6']]
    .map(function (f, i) { return { id: i + 1, name: f[0], description: f[1], code: 'KH-' + ('00' + (i + 1)).slice(-3) }; });
  var d = function (h, m) { return new Date(2026, 9, 24, h, m).toISOString(); };
  var R = function (id, fid, who, sid, out, due, ret) { return { id: id, fid: fid, who: who, sid: sid, out: out, due: due, ret: ret || null, notes: '' }; };
  var rec = [
    R(9, 4, 'Moira Cielo F. Tendencia', '2023-70184', d(10, 30), d(12, 0)),
    R(8, 5, 'Xandra T. Romero', '', d(9, 30), d(12, 0)),
    R(7, 3, 'Andrea L. Alonzo', '2023-00143', d(9, 30), d(14, 15), d(10, 21)),
    R(6, 1, 'Sophia Yzabel V. Padua', '', d(8, 0), d(10, 30)),
    R(5, 6, 'Karl Lorenz B. Baltazar', '', d(7, 0), d(12, 0)),
    R(4, 10, 'Rio H. Vidal', '', d(7, 0), d(10, 0))
  ];
  var users = [
    { id: 1, name: 'Administrator', email: 'admin@example.com', role: 'Administrator', active: true },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', role: 'Staff', active: true },
    { id: 3, name: 'John Reyes', email: 'john@example.com', role: 'Staff', active: false }
  ];
  return { fac: fac, rec: rec, users: users, theme: 'light' };
}
// Demo clock: starts at Oct 24, 2026 10:23 AM (matches the screenshots) and runs in real time.
var T0 = new Date(2026, 9, 24, 10, 23).getTime(), L0 = Date.now();
function now() { return new Date(T0 + (Date.now() - L0)); }
var D;
try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { D = null; }
if (!D || !D.rec) D = seed();
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

var S = { user: null, q: '', status: '', page: 1, flash: '', modal: null, err: {}, draft: null, loginErr: '', signup: false };
function facOf(id) { return D.fac.filter(function (f) { return f.id === id; })[0]; }
function recOf(id) { return D.rec.filter(function (r) { return r.id === id; })[0]; }
function status(r) { return r.ret ? 'Returned' : (new Date(r.due) < now() ? 'Overdue' : 'Borrowed'); }
function keyName(f) { return f.name + ' Key'; }
function openRec(fid, exceptId) { return D.rec.filter(function (r) { return r.fid === fid && !r.ret && r.id !== exceptId; })[0]; }
function fmtD(iso) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtT(iso) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function pad(n) { return ('0' + n).slice(-2); }
function toLocal(iso) { if (!iso) return ''; var d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function isAdmin() { return S.user && S.user.role === 'Administrator'; }
function pill(s) { return '<span class="pill ' + s.replace(' ', '') + '">' + s + '</span>'; }
function go(h) { location.hash = h; }

/* ---------- layout ---------- */
function shell(active, title, sub, action, body) {
  var items = [['dashboard', 'home', 'Dashboard'], ['records', 'key', 'Keys / Records'], ['records/new', 'plus', 'Add Record'], ['facilities', 'fac', 'Facilities']];
  if (isAdmin()) items.push(['users', 'users', 'Users']);
  var nav = items.map(function (i) { return '<a href="#/' + i[0] + '" class="' + (i[0] === active ? 'on' : '') + '">' + ic(i[1]) + i[2] + '</a>'; }).join('');
  return '<div class="shell"><aside class="side"><div class="brand"><span class="logo">' + ic('key') + '</span><span>Key Borrowing<br>and Return</span></div>' +
    '<nav class="nav" aria-label="Main">' + nav + '</nav>' +
    '<nav class="nav foot" aria-label="Account"><a href="#/settings" class="' + (active === 'settings' ? 'on' : '') + '">' + ic('set') + 'Settings</a><a href="#/login" data-act="logout">' + ic('out') + 'Sign Out</a></nav></aside>' +
    '<main class="main"><div class="top"><div><h1>' + title + '</h1><p class="mute">' + sub + '</p></div><div class="rt">' + (action || '') +
    '<div class="who"><span class="av">' + esc(S.user.name.charAt(0).toUpperCase()) + '</span>' + esc(S.user.role === 'Administrator' ? 'Admin' : S.user.name.split(' ')[0]) + '</div></div></div>' +
    (S.flash ? '<div class="flash" role="status">' + esc(S.flash) + '</div>' : '') + body + '</main></div>' + modal();
}
function modal() {
  var m = S.modal; if (!m) return '';
  var inner = '';
  if (m.type === 'confirm') {
    inner = '<h2 style="text-align:center;font-size:1.25rem">' + esc(m.title) + '</h2><p class="mute" style="text-align:center">' + esc(m.text) + '</p><div class="acts end dgrid"><button class="btn w" data-act="close">Cancel</button><button class="btn rd" data-act="confirm">' + esc(m.label) + '</button></div>';
  } else if (m.type === 'fac') {
    var f = m.id ? facOf(m.id) : { name: '', description: '' };
    inner = '<form data-form="fac" data-id="' + (m.id || '') + '"><h2>' + (m.id ? 'Edit Facility' : 'Add Facility') + '</h2>' +
      '<label for="fn">Facility name</label><input id="fn" name="name" required maxlength="100" value="' + esc(f.name) + '">' +
      '<label for="fd">Description</label><input id="fd" name="description" required maxlength="150" value="' + esc(f.description) + '">' +
      '<div class="acts end"><button type="button" class="btn w" data-act="close">Cancel</button><button class="btn">Save</button></div></form>';
  } else if (m.type === 'user') {
    var u = m.id ? D.users.filter(function (x) { return x.id === m.id; })[0] : { name: '', email: '', role: 'Staff', active: true };
    inner = '<form data-form="user" data-id="' + (m.id || '') + '"><h2>' + (m.id ? 'Edit User' : 'Add User') + '</h2>' +
      '<label for="un">Full name</label><input id="un" name="name" required value="' + esc(u.name) + '">' +
      '<label for="ue">Email</label><input id="ue" name="email" type="email" required value="' + esc(u.email) + '">' +
      '<label for="ur">Role</label><select id="ur" name="role"><option' + (u.role === 'Staff' ? ' selected' : '') + '>Staff</option><option' + (u.role === 'Administrator' ? ' selected' : '') + '>Administrator</option></select>' +
      '<label class="chk" style="margin-top:14px"><input type="checkbox" name="active"' + (u.active ? ' checked' : '') + '> Active (can log in)</label>' +
      '<div class="acts end"><button type="button" class="btn w" data-act="close">Cancel</button><button class="btn">Save</button></div></form>';
  }
  return '<div class="ov" data-act="ovclose"><div class="dlg" role="dialog" aria-modal="true">' + inner + '</div></div>';
}

/* ---------- pages ---------- */
function pageAuth() {
  var su = S.signup, ph = function (t) { return ' placeholder="' + t + '"'; };
  return '<div class="auth"><div class="auth-card"><section class="auth-l"><span class="logo">' + ic('key') + '</span><h1>Key Borrowing and Return System</h1><p>Track facility keys, borrowers, and return schedules in one simple, organized place.</p></section>' +
    '<section class="auth-r"><h2>' + (su ? 'Create your account.' : 'Login to your account.') + '</h2><p class="mute">' + (su ? 'Sign up to start managing facility keys.' : 'Welcome back! Please enter your details.') + '</p>' +
    '<form data-form="' + (su ? 'signup' : 'login') + '">' +
    (su ? '<label for="nm">Full Name</label><input id="nm" name="name" required' + ph('Enter your full name') + '>' : '') +
    '<label for="em">Email Address</label><input id="em" name="email" type="email" required' + ph('name@example.com') + '>' +
    '<label for="pw">Password</label><input id="pw" name="password" type="password" required' + ph(su ? 'At least 8 characters' : 'Password') + '>' +
    (su ? '<label for="cf">Confirm Password</label><input id="cf" name="confirm" type="password" required' + ph('Confirm password') + '>' : '') +
    (S.loginErr ? '<small class="err" role="alert">' + esc(S.loginErr) + '</small>' : '') +
    (su ? '<div style="height:18px"></div>' : '<div class="rowb"><label class="chk"><input type="checkbox"> Remember Me</label><button type="button" class="lnk" data-act="forgot">Forgot password?</button></div>') +
    '<button class="btn k full">' + (su ? 'Sign Up' : 'Log In') + '</button></form>' +
    '<p class="mute" style="text-align:center;margin-top:16px">' + (su ? 'Already have an account? ' : "Don't have an account? ") + '<a class="lnk" href="#/' + (su ? 'login' : 'signup') + '">' + (su ? 'Log In' : 'Sign Up') + '</a></p>' +
    '</section></div></div>';
}
function pageDash() {
  var tot = D.rec.length, st = { Borrowed: 0, Overdue: 0, Returned: 0 };
  D.rec.forEach(function (r) { st[status(r)]++; });
  var avail = D.fac.filter(function (f) { return !openRec(f.id); }).length;
  var card = function (v, l, link) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span>' + link + '</div>'; };
  var L = function (t, h) { return '<a class="lnk" href="#/' + h + '" data-filter="' + (h.split('?')[1] || '') + '">' + t + ' →</a>'; };
  var recent = D.rec.slice().sort(function (a, b) { return new Date(b.out) - new Date(a.out) || b.id - a.id; }).slice(0, 4).map(function (r) {
    return '<div class="item"><div><b>' + esc(keyName(facOf(r.fid))) + '</b><small>' + esc(r.who) + ' · ' + esc(facOf(r.fid).description) + '</small></div>' + pill(status(r)) + '<a class="btn w sm" href="#/records/' + r.id + '">View</a></div>';
  }).join('');
  var bar = function (l, n, c) { return '<div style="--c:' + c + '"><span>' + l + '</span><span class="track"><i style="width:' + (tot ? Math.round(n / tot * 100) : 0) + '%"></i></span><b>' + n + '</b></div>'; };
  var body = '<div class="cards">' + card(D.fac.length, 'Total Keys Registered', L(avail + ' Available', 'facilities')) + card(tot, 'Total Borrowing Records', L('View All', 'records')) +
    card(st.Borrowed, 'Currently Borrowed', L('View All', 'records?Borrowed')) + card(st.Overdue, 'Overdue Keys', L('View All', 'records?Overdue')) + card(st.Returned, 'Returned Keys', L('View All', 'records?Returned')) + '</div>' +
    '<div class="two"><section class="panel big"><h2>Recent Records</h2>' + recent + '</section><section class="panel"><h2>Records by Status</h2><div class="bars">' +
    bar('Borrowed', st.Borrowed, '#1d5fe0') + bar('Overdue', st.Overdue, '#e5484d') + bar('Returned', st.Returned, '#1f9d63') + '</div></section></div>';
  return shell('dashboard', 'Key Borrowing and Return System', 'Overview of borrowed keys and their return status.', '', body);
}
function filtered() {
  var q = S.q.toLowerCase();
  return D.rec.filter(function (r) {
    var f = facOf(r.fid);
    if (S.status && status(r) !== S.status) return false;
    return !q || [r.who, r.sid, f.name, f.description, f.code].join(' ').toLowerCase().indexOf(q) > -1;
  }).sort(function (a, b) { return new Date(b.out) - new Date(a.out) || b.id - a.id; });
}
function pageRecords() {
  var all = filtered(), pages = Math.max(1, Math.ceil(all.length / PER));
  if (S.page > pages) S.page = pages;
  var slice = all.slice((S.page - 1) * PER, S.page * PER);
  var rows = slice.map(function (r) {
    var f = facOf(r.fid);
    return '<tr><td><b>' + esc(keyName(f)) + '</b><small>' + esc(f.code) + '</small></td><td>' + esc(f.description) + '</td><td>' + esc(r.who) + '</td>' +
      '<td style="white-space:nowrap">' + fmtD(r.out) + '<small>' + fmtT(r.out) + '</small></td><td style="white-space:nowrap">' + fmtD(r.due) + '<small>' + fmtT(r.due) + '</small></td><td>' + pill(status(r)) + '</td>' +
      '<td><div class="acts"><a class="btn w sm" href="#/records/' + r.id + '">View</a><a class="btn w sm" href="#/records/' + r.id + '/edit">Edit</a><button class="btn r sm" data-act="del-rec" data-id="' + r.id + '">Delete</button></div></td></tr>';
  }).join('') || '<tr><td colspan="7" class="empty">No records match. Try another search or add a record.</td></tr>';
  var opts = ['', 'Borrowed', 'Overdue', 'Returned'].map(function (s) { return '<option value="' + s + '"' + (S.status === s ? ' selected' : '') + '>' + (s || 'All Statuses') + '</option>'; }).join('');
  var body = '<div class="bar"><input id="q" type="search" aria-label="Search records" placeholder="Search key, code, facility, or borrower." value="' + esc(S.q) + '"><select id="st" aria-label="Filter by status">' + opts + '</select></div>' +
    '<div class="tw"><table><thead><tr><th>Key / Code</th><th>Facility</th><th>Borrower</th><th>Borrowed</th><th>Expected Return</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="pager"><p class="mute">' + (all.length ? 'Showing ' + ((S.page - 1) * PER + 1) + '–' + Math.min(S.page * PER, all.length) + ' of ' + all.length + ' Record' + (all.length === 1 ? '' : 's') : 'Showing 0 Records') + '</p>' +
    (pages > 1 ? '<div class="acts"><button class="btn w sm' + (S.page === 1 ? ' dis' : '') + '" data-act="prev">Previous</button><span class="mute">Page ' + S.page + ' of ' + pages + '</span><button class="btn w sm' + (S.page === pages ? ' dis' : '') + '" data-act="next">Next</button></div>' : '') + '</div>';
  return shell('records', 'Key Borrowing Records', 'Search, review, and manage every borrowed key.', '<a class="btn" href="#/records/new">' + ic('plus') + ' Add Record</a>', body);
}
function pageShow(id) {
  var r = recOf(id); if (!r) return go('#/records');
  var f = facOf(r.fid), s = status(r);
  var kv = [['Key Name', '<b>' + esc(keyName(f)) + '</b>'], ['Key Code / Tag', esc(f.code)], ['Facility / Room', esc(f.description)], ['Borrower', esc(r.who)], ['Borrower ID', esc(r.sid || '—')],
    ['Borrowed', fmtD(r.out) + ', ' + fmtT(r.out)], ['Expected Return', fmtD(r.due) + ', ' + fmtT(r.due)], ['Actual Return', r.ret ? fmtD(r.ret) + ', ' + fmtT(r.ret) : 'Not yet returned'], ['Status', pill(s)], ['Notes', esc(r.notes || 'None')]]
    .map(function (p) { return '<div class="kvr"><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>'; }).join('');
  var body = '<a class="btn w sm" style="align-self:flex-start" href="#/records">' + ic('back') + ' Back</a><div class="form"><dl class="kv">' + kv + '</dl>' +
    (r.ret ? '' : '<div class="acts end"><button class="btn" data-act="return" data-id="' + r.id + '">Mark as Returned</button></div>') + '</div>';
  return shell('records', 'Record Details', esc(keyName(f)) + ' · ' + esc(f.code), '', body);
}
function pageForm(id) {
  var editing = id != null, r = editing ? recOf(id) : null;
  if (editing && !r) return go('#/records');
  var d = S.draft || (editing ? { fid: r.fid, who: r.who, sid: r.sid, out: toLocal(r.out), due: toLocal(r.due), ret: toLocal(r.ret), notes: r.notes } :
    { fid: '', who: '', sid: '', out: toLocal(now().toISOString()), due: toLocal(new Date(now().getTime() + 4 * H).toISOString()), ret: '', notes: '' });
  var e = S.err, cur = d.fid ? facOf(+d.fid) : null;
  var opt = function (f, text, busyText) {
    var b = openRec(f.id, editing ? id : null);
    return '<option value="' + f.id + '" data-code="' + esc(f.code) + '"' + (b ? ' disabled' : '') + (+d.fid === f.id && !b ? ' selected' : '') + '>' + esc(text) + (b ? esc(busyText(b)) : '') + '</option>';
  };
  var body = '<a class="btn w sm" style="align-self:flex-start" href="#/records">' + ic('back') + ' Back</a><div class="form"><form data-form="rec" data-id="' + (editing ? id : '') + '" novalidate><div class="g2">' +
    '<div><label for="keySel">Key Name *</label><select id="keySel" name="fid"><option value="">Select Key</option>' + D.fac.map(function (f) { return opt(f, keyName(f), function (b) { return ' — Borrowed by ' + b.who; }); }).join('') + '</select>' +
    (e.fid ? '<small class="err">' + e.fid + '</small>' : '') + '</div>' +
    '<div><label for="code">Key Code / Tag</label><input id="code" readonly value="' + esc(cur ? cur.code : 'KH-001') + '"></div>' +
    '<div><label for="roomSel">Facility / Room *</label><select id="roomSel"><option value="">Select Facility</option>' + D.fac.map(function (f) { return opt(f, f.description, function () { return ' — Borrowed'; }); }).join('') + '</select></div>' +
    '<div><label for="who">Borrower Full Name *</label><input id="who" name="who" maxlength="100" placeholder="Enter Borrower Name" value="' + esc(d.who) + '">' + (e.who ? '<small class="err">' + e.who + '</small>' : '') + '</div>' +
    '<div><label for="sid">Borrower ID</label><input id="sid" name="sid" maxlength="50" placeholder="Enter ID Number" value="' + esc(d.sid) + '"></div>' +
    '<div><label for="out">Borrowed Date and Time *</label><input id="out" name="out" type="datetime-local" value="' + esc(d.out) + '">' + (e.out ? '<small class="err">' + e.out + '</small>' : '') + '</div>' +
    '<div><label for="due">Expected Return Date and Time *</label><input id="due" name="due" type="datetime-local" value="' + esc(d.due) + '">' + (e.due ? '<small class="err">' + e.due + '</small>' : '') + '</div>' +
    (editing ? '<div><label for="ret">Actual Return Date and Time</label><input id="ret" name="ret" type="datetime-local" value="' + esc(d.ret) + '">' + (e.ret ? '<small class="err">' + e.ret + '</small>' : '') + '</div>' : '') +
    '<div class="full2"><label for="note">Notes</label><textarea id="note" name="notes" rows="3" maxlength="1000" placeholder="Optional notes about this borrowing record.">' + esc(d.notes) + '</textarea></div></div>' +
    '<div class="acts end"><a class="btn w" href="#/records">Cancel</a><button class="btn">' + (editing ? 'Save Changes' : 'Save Record') + '</button></div></form></div>';
  return shell(editing ? 'records' : 'records/new', editing ? 'Edit Key Borrowing Record' : 'Add Key Borrowing Record', editing ? 'Update the details below.' : 'Enter the details below to create a new record.', '', body);
}
function pageFac() {
  var rows = D.fac.map(function (f) {
    return '<tr><td><b>' + esc(f.name) + '</b></td><td>' + esc(f.description) + '</td><td>' + esc(f.code) + '</td><td>' + (openRec(f.id) ? pill('In Use') : pill('Available')) + '</td>' +
      (isAdmin() ? '<td><div class="acts"><button class="btn w sm" data-act="edit-fac" data-id="' + f.id + '">Edit</button><button class="btn r sm" data-act="del-fac" data-id="' + f.id + '">Delete</button></div></td>' : '') + '</tr>';
  }).join('');
  var body = '<div class="tw"><table><thead><tr><th>Facility</th><th>Description</th><th>Key Code</th><th>Status</th>' + (isAdmin() ? '<th>Actions</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  return shell('facilities', 'Facilities', 'Manage rooms and the keys registered to them.' + (isAdmin() ? '' : ' (View only)'), isAdmin() ? '<button class="btn" data-act="add-fac">' + ic('plus') + ' Add Facility</button>' : '', body);
}
function pageUsers() {
  var rows = D.users.map(function (u) {
    return '<tr><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.email) + '</td><td>' + pill(u.role) + '</td><td>' + '<span class="pill ' + (u.active ? 'Available' : 'Inactive') + '">' + (u.active ? 'Active' : 'Inactive') + '</span>' + '</td>' +
      '<td><div class="acts"><button class="btn w sm" data-act="edit-user" data-id="' + u.id + '">Edit</button>' + (u.id === S.user.id ? '' : '<button class="btn r sm" data-act="del-user" data-id="' + u.id + '">Delete</button>') + '</div></td></tr>';
  }).join('');
  return shell('users', 'Users', 'Accounts that can sign in to the system.', '<button class="btn" data-act="add-user">' + ic('plus') + ' Add User</button>',
    '<div class="tw"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
}
function pageSettings() {
  var body = '<div class="two"><section class="panel"><h2>Account details</h2><form data-form="acct"><label for="sn">Full name</label><input id="sn" name="name" required value="' + esc(S.user.name) + '"><label for="se">Email</label><input id="se" name="email" type="email" required value="' + esc(S.user.email) + '"><div class="acts end"><button class="btn">Save</button></div></form></section>' +
    '<section class="panel"><h2>Change password</h2><form data-form="pw"><label for="p1">Current password</label><input id="p1" type="password" required><label for="p2">New password</label><input id="p2" type="password" required minlength="8"><div class="acts end"><button class="btn">Update</button></div></form></section>' +
    '<section class="panel"><h2>Appearance</h2><label class="switch"><input type="checkbox" id="theme"' + (D.theme === 'dark' ? ' checked' : '') + '> Dark Theme</label><p class="mute">Saved in this browser for the prototype.</p><div class="acts end"><button class="btn w" data-act="reset">Reset demo data</button></div></section></div>';
  return shell('settings', 'Settings', 'Manage your account and appearance.', '', body);
}

/* ---------- router ---------- */
function render() {
  document.documentElement.setAttribute('data-theme', D.theme);
  var h = (location.hash || '').replace(/^#\/?/, ''), p = h.split('?')[0].split('/'), out = '';
  if (!S.user) { S.signup = (p[0] === 'signup'); out = pageAuth(); }
  else if (p[0] === '' || p[0] === 'login') { return go('#/dashboard'); }
  else if (p[0] === 'dashboard') out = pageDash();
  else if (p[0] === 'records') {
    if (h.indexOf('?') > -1 && S._f !== h) { S.status = h.split('?')[1]; S.page = 1; S._f = h; }
    if (p[1] === 'new') out = pageForm(null);
    else if (p[1] && p[2] === 'edit') out = pageForm(+p[1]);
    else if (p[1]) out = pageShow(+p[1]);
    else out = pageRecords();
  } else if (p[0] === 'facilities') out = pageFac();
  else if (p[0] === 'users') { if (!isAdmin()) return go('#/dashboard'); out = pageUsers(); }
  else if (p[0] === 'settings') out = pageSettings();
  else return go('#/dashboard');
  var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart;
  document.getElementById('app').innerHTML = out;
  if (id) { var el = document.getElementById(id); if (el && /^(q)$/.test(id)) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) {} } }
}
var lastHash = null;
window.addEventListener('hashchange', function () { if (S.keep) { S.keep = false; } else { S.flash = ''; } if (location.hash === '#/records') { S.status = ''; S.q = ''; S.page = 1; S._f = null; } S.err = {}; S.draft = null; S.modal = null; S.loginErr = ''; window.scrollTo(0, 0); render(); });

/* ---------- actions ---------- */
function flash(m) { S.flash = m; }
document.addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-act]'); if (!t) return;
  var act = t.dataset.act, id = +t.dataset.id;
  if (act === 'ovclose') { if (ev.target !== t) return; S.modal = null; }
  else if (act === 'close') S.modal = null;
  else if (act === 'logout') { ev.preventDefault(); S.user = null; S.flash = ''; location.hash = '#/login'; }
    else if (act === 'forgot') { S.loginErr = 'Prototype: password reset is not wired up.'; }
  else if (act === 'prev') S.page = Math.max(1, S.page - 1);
  else if (act === 'next') S.page++;
  else if (act === 'del-rec') S.modal = { type: 'confirm', title: 'Delete this record?', label: 'Delete Record', text: 'This permanently removes the borrowing record. You can\u2019t undo this.', run: function () { D.rec = D.rec.filter(function (r) { return r.id !== id; }); flash('Record deleted.'); } };
  else if (act === 'del-fac') S.modal = { type: 'confirm', title: 'Delete this facility?', label: 'Delete Facility', text: 'This permanently removes the facility and its records. You can\u2019t undo this.', run: function () { D.fac = D.fac.filter(function (f) { return f.id !== id; }); D.rec = D.rec.filter(function (r) { return r.fid !== id; }); flash('Facility deleted.'); } };
  else if (act === 'del-user') S.modal = { type: 'confirm', title: 'Delete this user?', label: 'Delete User', text: 'This account will no longer be able to sign in. You can\u2019t undo this.', run: function () { D.users = D.users.filter(function (u) { return u.id !== id; }); flash('User deleted.'); } };
  else if (act === 'confirm') { if (S.modal && S.modal.run) { S.modal.run(); save(); } S.modal = null; }
  else if (act === 'add-fac') S.modal = { type: 'fac' };
  else if (act === 'edit-fac') S.modal = { type: 'fac', id: id };
  else if (act === 'add-user') S.modal = { type: 'user' };
  else if (act === 'edit-user') S.modal = { type: 'user', id: id };
  else if (act === 'return') { recOf(id).ret = now().toISOString(); save(); flash('Key marked as returned.'); }
  else if (act === 'reset') { var th = D.theme; D = seed(); D.theme = th; save(); flash('Demo data reset.'); }
  else return;
  render();
});
document.addEventListener('input', function (ev) { if (ev.target.id === 'q') { S.q = ev.target.value; S.page = 1; render(); } });
document.addEventListener('change', function (ev) {
  var t = ev.target;
  if (t.id === 'st') { S.status = t.value; S.page = 1; render(); }
  else if (t.id === 'theme') { D.theme = t.checked ? 'dark' : 'light'; save(); render(); }
  else if (t.id === 'keySel' || t.id === 'roomSel') {
    var other = document.getElementById(t.id === 'keySel' ? 'roomSel' : 'keySel'); other.value = t.value;
    var o = t.options[t.selectedIndex]; document.getElementById('code').value = (o && o.dataset.code) || 'KH-001';
  }
});
document.addEventListener('submit', function (ev) {
  var f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
  var kind = f.dataset.form, id = f.dataset.id ? +f.dataset.id : null, v = {};
  new FormData(f).forEach(function (val, k) { v[k] = typeof val === 'string' ? val.trim() : val; });
  if (kind === 'login' || kind === 'signup') {
    var email = (v.email || '').toLowerCase();
    if (kind === 'signup') {
      if (v.password.length < 8) { S.loginErr = 'Password must be at least 8 characters.'; return render(); }
      if (v.password !== v.confirm) { S.loginErr = 'Passwords do not match.'; return render(); }
      if (D.users.some(function (u) { return u.email === email; })) { S.loginErr = 'That email is already registered.'; return render(); }
      var nu = { id: Date.now(), name: v.name, email: email, role: 'Staff', active: true }; D.users.push(nu); save(); S.user = nu; S.flash = 'Welcome, ' + nu.name + '!'; S.keep = true; location.hash = '#/dashboard'; return render();
    }
    var u = D.users.filter(function (x) { return x.email === email; })[0];
    if (!u || v.password !== 'password') { S.loginErr = 'These credentials do not match our records.'; return render(); }
    if (!u.active) { S.loginErr = 'This account is inactive. Please contact an administrator.'; return render(); }
    S.user = u; S.loginErr = ''; location.hash = '#/dashboard'; return render();
  }
  if (kind === 'fac') {
    if (id) { var fc = facOf(id); fc.name = v.name; fc.description = v.description; flash('Facility updated.'); }
    else { var max = D.fac.reduce(function (m, x) { return Math.max(m, parseInt(x.code.slice(3), 10)); }, 0); D.fac.push({ id: Date.now(), name: v.name, description: v.description, code: 'KH-' + ('00' + (max + 1)).slice(-3) }); flash('Facility added.'); }
    S.modal = null; save(); return render();
  }
  if (kind === 'user') {
    var data = { name: v.name, email: v.email, role: v.role, active: !!v.active };
    if (id) Object.assign(D.users.filter(function (x) { return x.id === id; })[0], data); else D.users.push(Object.assign({ id: Date.now() }, data));
    if (id && S.user.id === id) S.user = D.users.filter(function (x) { return x.id === id; })[0];
    flash(id ? 'User updated.' : 'User added.'); S.modal = null; save(); return render();
  }
  if (kind === 'acct') { S.user.name = v.name; S.user.email = v.email; save(); flash('Account updated.'); return render(); }
  if (kind === 'pw') { flash('Password updated (prototype only).'); return render(); }
  if (kind === 'rec') {
    var err = {}, d = { fid: v.fid, who: v.who, sid: v.sid, out: v.out, due: v.due, ret: v.ret || '', notes: v.notes };
    if (!v.fid) err.fid = 'Please select a key.';
    if (!v.who) err.who = 'Enter the borrower\'s name.';
    if (!v.out) err.out = 'Enter the borrowed date and time.';
    if (!v.due) err.due = 'Enter the expected return date and time.';
    else if (v.out && new Date(v.due) <= new Date(v.out)) err.due = 'Expected return must be after the borrowed time.';
    if (v.ret && v.out && new Date(v.ret) < new Date(v.out)) err.ret = 'Return cannot be before the borrowed time.';
    if (!err.fid && !v.ret && openRec(+v.fid, id)) err.fid = 'This key is still borrowed and has not been returned yet.';
    if (Object.keys(err).length) { S.err = err; S.draft = d; return render(); }
    var obj = { fid: +v.fid, who: v.who, sid: v.sid, out: new Date(v.out).toISOString(), due: new Date(v.due).toISOString(), ret: v.ret ? new Date(v.ret).toISOString() : null, notes: v.notes };
    if (id) Object.assign(recOf(id), obj); else D.rec.push(Object.assign({ id: D.rec.reduce(function (m, r) { return Math.max(m, r.id); }, 0) + 1 }, obj));
    save(); S.err = {}; S.draft = null; S.flash = id ? 'Record updated.' : 'Record added.'; S.keep = true; S.page = 1; location.hash = '#/records'; return render();
  }
});
render();
})();
