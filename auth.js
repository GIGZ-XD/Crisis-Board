// ===================== RESPONDER AUTH (in-memory, session-only) =====================
// NOTE: This simulates authentication for demo purposes. Passwords are kept in plain
// JS memory (not hashed, not persisted to a server) — fine for a hackathon prototype,
// not for a real deployment.

let responders = [
  { fullName: 'Demo Responder', email: 'responder1@example.com', username: 'responder1', password: 'demo123' }
];
let currentResponder = null;
let resetTargetUsername = null;

function findByUsername(username){
  return responders.find(r => r.username.toLowerCase() === username.toLowerCase());
}
function findByEmail(email){
  return responders.find(r => r.email.toLowerCase() === email.toLowerCase());
}

function setAuthMsg(id, text, isError){
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'auth-msg' + (text ? (isError ? ' error' : ' success') : '');
}

function showAuthView(view){
  document.querySelectorAll('.auth-view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  // Tabs only exist for login/register; forgot & reset hide the tab strip
  document.getElementById('authTabs').style.display = (view === 'login' || view === 'register') ? 'flex' : 'none';
  ['loginMsg','registerMsg','forgotEmailMsg','resetMsg'].forEach(id => setAuthMsg(id, ''));
}

document.getElementById('authTabs').addEventListener('click', (e)=>{
  const btn = e.target.closest('.auth-tab');
  if(!btn) return;
  showAuthView(btn.dataset.view);
});
document.querySelectorAll('.auth-link').forEach(link=>{
  link.addEventListener('click', ()=> showAuthView(link.dataset.view));
});

// ---- Register ----
document.getElementById('registerForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if(!fullName || !email || !username || !password){
    setAuthMsg('registerMsg', 'Please fill in every field.', true); return;
  }
  if(password.length < 6){
    setAuthMsg('registerMsg', 'Password must be at least 6 characters.', true); return;
  }
  if(password !== confirm){
    setAuthMsg('registerMsg', 'Passwords do not match.', true); return;
  }
  if(findByUsername(username)){
    setAuthMsg('registerMsg', 'That username is already taken.', true); return;
  }
  if(findByEmail(email)){
    setAuthMsg('registerMsg', 'An account with that email already exists.', true); return;
  }

  responders.push({ fullName, email, username, password });
  setAuthMsg('registerMsg', 'Account created. You can log in now.', false);
  e.target.reset();
  document.getElementById('loginUsername').value = username;
  setTimeout(()=> showAuthView('login'), 700);
});

// ---- Login ----
document.getElementById('loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const responder = findByUsername(username);
  if(!responder || responder.password !== password){
    setAuthMsg('loginMsg', 'Incorrect username or password.', true);
    return;
  }

  currentResponder = responder;
  document.getElementById('responderName').textContent = responder.fullName;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'block';
  e.target.reset();
  setAuthMsg('loginMsg', '');
});

// ---- Logout ----
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  currentResponder = null;
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  showAuthView('login');
});

// ---- Forgot password: step 1, find account by email ----
document.getElementById('forgotEmailForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  const responder = findByEmail(email);

  if(!responder){
    setAuthMsg('forgotEmailMsg', 'No responder account found with that email.', true);
    return;
  }

  resetTargetUsername = responder.username;
  document.getElementById('resetForUser').textContent =
    `Resetting password for ${responder.fullName} (@${responder.username})`;
  e.target.reset();
  setAuthMsg('forgotEmailMsg', '');
  showAuthView('reset');
});

// ---- Forgot password: step 2, set new password ----
document.getElementById('resetPasswordForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const password = document.getElementById('resetPassword').value;
  const confirm = document.getElementById('resetConfirm').value;

  if(password.length < 6){
    setAuthMsg('resetMsg', 'Password must be at least 6 characters.', true); return;
  }
  if(password !== confirm){
    setAuthMsg('resetMsg', 'Passwords do not match.', true); return;
  }

  const responder = findByUsername(resetTargetUsername);
  if(!responder){
    setAuthMsg('resetMsg', 'Something went wrong — please try again.', true); return;
  }

  responder.password = password;
  resetTargetUsername = null;
  e.target.reset();
  document.getElementById('loginUsername').value = responder.username;
  setAuthMsg('loginMsg', 'Password updated. Log in with your new password.', false);
  showAuthView('login');
});
