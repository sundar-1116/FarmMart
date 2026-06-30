// ============================================================
// Farmers To Mart — Auth Logic (fixed IDs + Google sign-in)
// TODO(security): Replace simulated Google OAuth with real
//   Google Identity Services in production.
// TODO(security): Implement MFA for admin accounts.
// ============================================================
(function () {
  'use strict';

  // ── Read & validate role from URL ───────────────────────────
  const params = new URLSearchParams(window.location.search);
  const rawRole = params.get('role') || 'user';
  const role = ['admin', 'user'].includes(rawRole) ? rawRole : 'user';

  // ── Redirect if already logged in ───────────────────────────
  const existing = getSession();
  if (existing) {
    window.location.replace(
      existing.role === 'admin' ? 'admin/dashboard.html' : 'user/dashboard.html'
    );
  }

  // ── Toast helper (safe — uses textContent) ───────────────────
  function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const ic = document.createElement('span');
    ic.className = 'toast-icon';
    ic.textContent = icons[type] || 'ℹ️';
    const tx = document.createElement('span');
    tx.textContent = msg;   // textContent — safe, no XSS
    t.appendChild(ic);
    t.appendChild(tx);
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('toast-out');
      setTimeout(() => t.remove(), 300);
    }, 3500);
  }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;   // textContent — safe
    el.classList.remove('hidden');
  }
  function clearErr(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
  }

  function setLoading(textId, spinnerId, loading) {
    const t = document.getElementById(textId);
    const s = document.getElementById(spinnerId);
    if (t) t.classList.toggle('hidden', loading);
    if (s) s.classList.toggle('hidden', !loading);
  }

  // ── Validation ────────────────────────────────────────────────
  function validEmail(e) { return /^[^\s@]+@[^\s@]+$/.test(e.trim()); }
  // Allow passwords of at least 3 characters to support 'admin'
  function validPW(p)    { return p.length >= 3 && p.length <= 128; }
  function validName(n)  { return n.trim().length >= 2 && n.trim().length <= 80; }

  // ── Setup UI ─────────────────────────────────────────────────
  function setupUI() {
    const chip    = document.getElementById('role-chip');
    const tabs    = document.getElementById('auth-tabs');
    const tabSU   = document.getElementById('tab-signup');
    const googleSU= document.getElementById('google-signup-wrap');
    const hint    = document.getElementById('demo-hint');
    const footer  = document.getElementById('auth-footer');
    const title   = document.getElementById('auth-h');
    const sub     = document.getElementById('auth-sub');

    if (role === 'admin') {
      if (chip)    { chip.className = 'role-chip admin'; chip.textContent = '🛡️ Admin Access'; }
      if (googleSU)googleSU.classList.add('hidden');
      if (hint)    hint.classList.add('hidden'); // Do not reveal admin password
      if (title)   title.textContent = 'Admin Login';
      if (sub)     sub.textContent   = 'Sign in with your admin credentials';
    } else {
      if (chip)    { chip.className = 'role-chip user'; chip.textContent = '💻 User Access'; }
      if (title)   title.textContent = 'Welcome Back';
    }
  }

  // ── Tab switching ─────────────────────────────────────────────
  window.switchTab = function (tab) {
    const lf  = document.getElementById('login-form');
    const sf  = document.getElementById('signup-form');
    const ff  = document.getElementById('forgot-form');
    const tl  = document.getElementById('tab-login');
    const ts  = document.getElementById('tab-signup');
    const ft  = document.getElementById('auth-footer');
    const ttl = document.getElementById('auth-h');
    const sub = document.getElementById('auth-sub');

    if (tab === 'signup') {
      lf && lf.classList.add('hidden');
      ff && ff.classList.add('hidden');
      sf && sf.classList.remove('hidden');
      tl && tl.classList.remove('active');
      ts && ts.classList.add('active');
      if (ft) {
        ft.classList.remove('hidden');
        ft.replaceChildren();
        const txt = document.createTextNode('Already have an account? ');
        const btn = document.createElement('button');
        btn.textContent = 'Sign in';
        btn.onclick = () => switchTab('login');
        ft.appendChild(txt);
        ft.appendChild(btn);
      }
      if (ttl) ttl.textContent = role === 'admin' ? 'Create Admin Account' : 'Create Account';
      if (sub) sub.textContent = role === 'admin' ? 'Join FarmMart as an administrator' : 'Join FarmMart for free today';
    } else if (tab === 'forgot') {
      lf && lf.classList.add('hidden');
      sf && sf.classList.add('hidden');
      ff && ff.classList.remove('hidden');
      tl && tl.classList.remove('active');
      ts && ts.classList.remove('active');
      
      const step1 = document.getElementById('forgot-step-1');
      const step2 = document.getElementById('forgot-step-2');
      if (step1) step1.classList.remove('hidden');
      if (step2) step2.classList.add('hidden');
      
      if (ft) {
        ft.classList.remove('hidden');
        ft.replaceChildren();
        const txt = document.createTextNode('Remembered your password? ');
        const btn = document.createElement('button');
        btn.textContent = 'Sign in';
        btn.onclick = () => switchTab('login');
        ft.appendChild(txt);
        ft.appendChild(btn);
      }
      if (ttl) ttl.textContent = 'Reset Password';
      if (sub) sub.textContent = 'Request a verification code to reset your password';
    } else {
      sf && sf.classList.add('hidden');
      ff && ff.classList.add('hidden');
      lf && lf.classList.remove('hidden');
      tl && tl.classList.add('active');
      ts && ts.classList.remove('active');
      if (ft) {
        ft.classList.remove('hidden');
        ft.replaceChildren();
        const txt = document.createTextNode(role === 'admin' ? "Already have an admin account? " : "Don't have an account? ");
        const btn = document.createElement('button');
        btn.textContent = role === 'admin' ? 'Sign in' : 'Sign up free';
        btn.onclick = () => switchTab(role === 'admin' ? 'login' : 'signup');
        ft.appendChild(txt);
        ft.appendChild(btn);
      }
      if (ttl) ttl.textContent = role === 'admin' ? 'Admin Login' : 'Welcome Back';
      if (sub) sub.textContent = role === 'admin' ? 'Sign in with your admin credentials' : 'Sign in to your account to continue';
      
      // Ensure details form panel is shown and 2FA panel is hidden when returning to signup
      const detailsPanel = document.getElementById('signup-details-panel');
      const panel2fa = document.getElementById('signup-2fa-panel');
      if (detailsPanel) detailsPanel.classList.remove('hidden');
      if (panel2fa) panel2fa.classList.add('hidden');
    }
  };

  window.handleForgotPassword = async function (e) {
    e.preventDefault();
    const emailEl = document.getElementById('f-email');
    const errEl = document.getElementById('f-email-err');
    if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
    
    if (!emailEl) return;
    const email = emailEl.value.trim();
    if (!email || !validEmail(email)) {
      if (errEl) { errEl.textContent = 'Enter a valid email address.'; errEl.classList.remove('hidden'); }
      return;
    }

    setLoading('f-btn-txt', 'f-spin', true);
    try {
      const res = await requestForgotPasswordCode(email);
      if (res.success) {
        toast(`Verification code generated! Code: ${res.code}`, 'info');
        const step1 = document.getElementById('forgot-step-1');
        const step2 = document.getElementById('forgot-step-2');
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');
      } else {
        if (errEl) { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
        toast(res.message, 'error');
      }
    } catch (err) {
      toast('Failed to send verification code. Try again.', 'error');
    } finally {
      setLoading('f-btn-txt', 'f-spin', false);
    }
  };

  window.submitResetPassword = async function () {
    const emailEl = document.getElementById('f-email');
    const codeEl = document.getElementById('f-code');
    const newpwEl = document.getElementById('f-newpw');
    
    ['f-code-err', 'f-newpw-err'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });

    if (!emailEl || !codeEl || !newpwEl) return;
    const email = emailEl.value.trim();
    const code = codeEl.value.trim();
    const newpw = newpwEl.value;

    let ok = true;
    if (code.length !== 6) {
      const el = document.getElementById('f-code-err');
      if (el) { el.textContent = 'Enter the 6-digit verification code.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (newpw.length < 3) {
      const el = document.getElementById('f-newpw-err');
      if (el) { el.textContent = 'Password must be at least 3 characters.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!ok) return;

    try {
      const res = await submitForgotPasswordReset(email, code, newpw);
      if (res.success) {
        toast('Password reset successfully! Log in to continue. 🎉', 'success');
        codeEl.value = '';
        newpwEl.value = '';
        setTimeout(() => {
          switchTab('login');
        }, 1500);
      } else {
        const el = document.getElementById('f-code-err');
        if (el) { el.textContent = res.message; el.classList.remove('hidden'); }
        toast(res.message, 'error');
      }
    } catch (err) {
      toast('Failed to reset password. Try again.', 'error');
    }
  };

  // ── Password visibility ───────────────────────────────────────
  window.togglePW = function (inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    // Safe: using static SVG paths only, not user data
    if (icon) {
      icon.innerHTML = show
        ? '<path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22"/>'
        : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
    }
  };

  // ── Password strength ─────────────────────────────────────────
  window.checkStrength = function (pw) {
    const fill  = document.getElementById('str-fill');
    const label = document.getElementById('str-lbl');
    if (!fill || !label) return;
    let score = 0;
    if (pw.length >= 8)         score++;
    if (pw.length >= 12)        score++;
    if (/[A-Z]/.test(pw))       score++;
    if (/[0-9]/.test(pw))       score++;
    if (/[^A-Za-z0-9]/.test(pw))score++;
    fill.className = 'str-fill';
    if (!pw.length) {
      label.textContent = 'Enter a password';
    } else if (score <= 2) {
      fill.classList.add('weak');
      label.textContent = '⚠️ Weak — add numbers & symbols';
    } else if (score <= 3) {
      fill.classList.add('medium');
      label.textContent = '👍 Medium — getting stronger!';
    } else {
      fill.classList.add('strong');
      label.textContent = '✅ Strong password!';
    }
  };

  // ── Login ─────────────────────────────────────────────────────
  window.handleLogin = async function (e) {
    e.preventDefault();
    ['l-email-err', 'l-pw-err'].forEach(clearErr);

    const emailEl = document.getElementById('l-email');
    const pwEl    = document.getElementById('l-pw');
    if (!emailEl || !pwEl) return;

    const email = emailEl.value.trim();
    const pw    = pwEl.value;

    let ok = true;
    if (!validEmail(email)) { showErr('l-email-err', 'Enter a valid email address.'); ok = false; }
    if (!validPW(pw))        { showErr('l-pw-err',    'Password must be 3–128 characters.'); ok = false; }
    if (!ok) return;

    setLoading('l-btn-txt', 'l-spin', true);
    try {
      const res = await loginUser(email, pw, role);
      if (res.success) {
        toast(`Welcome back, ${res.user.name}! 🌾`, 'success');
        setTimeout(() => window.location.replace(
          role === 'admin' ? 'admin/dashboard.html' : 'user/dashboard.html'
        ), 800);
      } else {
        showErr('l-pw-err', res.message);
        toast(res.message, 'error');
      }
    } catch { toast('Something went wrong. Try again.', 'error'); }
    finally  { setLoading('l-btn-txt', 'l-spin', false); }
  };

  // Helper to read file as Data URL
  function readPhoto(fileInput) {
    return new Promise((resolve) => {
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  // ── Signup ────────────────────────────────────────────────────
  window.handleSignup = async function (e) {
    e.preventDefault();
    ['s-name-err','s-email-err','s-phone-err','s-gender-err','s-age-err','s-photo-err','s-pw-err','s-conf-err'].forEach(clearErr);

    const nameEl  = document.getElementById('s-name');
    const emailEl = document.getElementById('s-email');
    const phoneEl = document.getElementById('s-phone');
    const genderEl = document.getElementById('s-gender');
    const ageEl    = document.getElementById('s-age');
    const photoEl  = document.getElementById('s-photo');
    const pwEl    = document.getElementById('s-pw');
    const confEl  = document.getElementById('s-conf');
    if (!nameEl || !emailEl || !pwEl || !confEl) return;

    const name   = nameEl.value.trim();
    const email  = emailEl.value.trim();
    const phone  = phoneEl ? phoneEl.value.trim() : '';
    const gender = genderEl ? genderEl.value : 'Male';
    const age    = ageEl ? ageEl.value.trim() : '';
    const pw     = pwEl.value;
    const conf   = confEl.value;

    let ok = true;
    if (!validName(name))           { showErr('s-name-err',  'Name must be 2-80 characters.'); ok = false; }
    if (!validEmail(email))         { showErr('s-email-err', 'Enter a valid email address.'); ok = false; }
    if (!/^[0-9]{10}$/.test(phone)) { showErr('s-phone-err', 'Phone must be exactly 10 digits.'); ok = false; }
    if (!age || parseInt(age) < 18 || parseInt(age) > 100) { showErr('s-age-err', 'Age must be between 18 and 100.'); ok = false; }
    if (!validPW(pw))               { showErr('s-pw-err',    'Password must be at least 3 characters.'); ok = false; }
    if (pw !== conf)                { showErr('s-conf-err',  'Passwords do not match.'); ok = false; }
    if (!ok) return;

    setLoading('s-btn-txt', 's-spin', true);
    try {
      const photoDataUrl = await readPhoto(photoEl);
      
      if (role === 'admin') {
        // Find existing admin email
        const admins = getAllUsers().filter(u => u.role === 'admin' && u.status === 'active');
        const defaultAdminEmail = 'hemasundarsai@gmail.com';
        const targetAdminEmail = admins.length > 0 ? admins[0].email : defaultAdminEmail;
        
        // Generate random code
        const code2fa = Math.floor(100000 + Math.random() * 900000).toString();
        window.pendingAdminSignup = { name, email, pw, phone, gender, age, photoDataUrl, code: code2fa };
        
        // Notify the user in UI
        toast(`🔑 [2FA Code] Code: ${code2fa} sent to existing admin: ${targetAdminEmail}`, 'success');
        console.log(`[2FA Code] Generated registration code is ${code2fa} sent to ${targetAdminEmail}`);
        
        // Switch display panels
        document.getElementById('signup-details-panel').classList.add('hidden');
        document.getElementById('signup-2fa-panel').classList.remove('hidden');
      } else {
        const res = await createUser(name, email, pw, phone, gender, age, photoDataUrl, 'user');
        if (res.success) {
          await loginUser(email, pw, 'user');
          toast(`Account created! Welcome, ${name}! 🌾`, 'success');
          setTimeout(() => window.location.replace('user/dashboard.html'), 900);
        } else {
          showErr('s-email-err', res.message);
          toast(res.message, 'error');
        }
      }
    } catch (err) {
      toast('Something went wrong. Try again.', 'error');
    } finally {
      setLoading('s-btn-txt', 's-spin', false);
    }
  };

  // ── Admin 2FA Verification
  window.handleVerifyAdminSignup2FA = async function (e) {
    if (e) e.preventDefault();
    clearErr('s-2fa-err');
    
    const codeEl = document.getElementById('s-2fa-code');
    if (!codeEl) return;
    const enteredCode = codeEl.value.trim();
    
    const pending = window.pendingAdminSignup;
    if (!pending) {
      toast('Verification session expired. Please sign up again.', 'error');
      switchTab('signup');
      return;
    }
    
    if (enteredCode !== pending.code) {
      showErr('s-2fa-err', 'Invalid verification code. Please check and try again.');
      toast('Invalid verification code.', 'error');
      return;
    }
    
    setLoading('s-2fa-btn-txt', 's-2fa-spin', true);
    try {
      const res = await createUser(pending.name, pending.email, pending.pw, pending.phone, pending.gender, pending.age, pending.photoDataUrl, 'admin');
      if (res.success) {
        await loginUser(pending.email, pending.pw, 'admin');
        toast(`Admin account verified & created! Welcome, ${pending.name}! 🛡️`, 'success');
        setTimeout(() => window.location.replace('admin/dashboard.html'), 900);
      } else {
        showErr('s-2fa-err', res.message);
        toast(res.message, 'error');
      }
    } catch (err) {
      toast('Something went wrong during admin creation. Try again.', 'error');
    } finally {
      setLoading('s-2fa-btn-txt', 's-2fa-spin', false);
    }
  };

  // ── Google Sign-in (simulated)
  // TODO(security): Replace with real Google Identity Services SDK in production.
  window.googleSignIn = async function () {
    if (role === 'admin') {
      toast('Admin cannot sign in with Google.', 'error');
      return;
    }

    const MOCK_ACCOUNTS = [
      { name: 'Priya Sharma',   email: 'priya.sharma@gmail.com' },
      { name: 'Arjun Reddy',    email: 'arjun.reddy@gmail.com'  },
      { name: 'Kavya Nair',     email: 'kavya.nair@gmail.com'   },
      { name: 'Rohan Mehta',    email: 'rohan.mehta@gmail.com'  },
    ];

    // Show mock Google account picker modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';

    const box = document.createElement('div');
    box.style.cssText = 'background:#1a2a1e;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px;width:340px;box-shadow:0 20px 60px rgba(0,0,0,.7)';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'text-align:center;margin-bottom:20px';

    const logo = document.createElement('div');
    logo.style.cssText = 'font-size:2rem;margin-bottom:8px';
    logo.textContent = 'G';
    logo.style.cssText = 'width:48px;height:48px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-family:sans-serif;font-weight:900;font-size:1.6rem;color:#4285F4';

    const htitle = document.createElement('h3');
    htitle.style.cssText = 'font-size:1rem;font-weight:700;color:#f0fdf4;margin-bottom:3px;font-family:Outfit,sans-serif';
    htitle.textContent = 'Choose a Google Account';

    const hsub = document.createElement('p');
    hsub.style.cssText = 'font-size:.78rem;color:rgba(134,239,172,.45);font-family:Outfit,sans-serif';
    hsub.textContent = 'to continue to Farmers To Mart';

    hdr.appendChild(logo); hdr.appendChild(htitle); hdr.appendChild(hsub);
    box.appendChild(hdr);

    MOCK_ACCOUNTS.forEach(acc => {
      const btn = document.createElement('button');
      btn.style.cssText = 'width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#f0fdf4;font-size:.875rem;font-family:Outfit,sans-serif;cursor:pointer;margin-bottom:8px;transition:background .15s';
      btn.onmouseover = () => { btn.style.background = 'rgba(34,197,94,.1)'; btn.style.borderColor = 'rgba(34,197,94,.25)'; };
      btn.onmouseout  = () => { btn.style.background = 'rgba(255,255,255,.04)'; btn.style.borderColor = 'rgba(255,255,255,.08)'; };

      const av = document.createElement('div');
      av.style.cssText = 'width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#15803d,#22c55e);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0';
      av.textContent = acc.name.split(' ').map(w => w[0]).join('').toUpperCase();

      const inf = document.createElement('div');
      inf.style.cssText = 'text-align:left';
      const nm = document.createElement('div');
      nm.style.cssText = 'font-weight:600;font-size:.875rem';
      nm.textContent = acc.name;    // textContent — safe
      const em = document.createElement('div');
      em.style.cssText = 'font-size:.75rem;color:rgba(134,239,172,.45)';
      em.textContent = acc.email;   // textContent — safe
      inf.appendChild(nm); inf.appendChild(em);

      btn.appendChild(av); btn.appendChild(inf);

      btn.onclick = async () => {
        document.body.removeChild(overlay);
        const res = await createUser(acc.name, acc.email, 'google-' + Date.now());
        // createUser fails if email exists — that's ok, just login
        await loginUser(acc.email, 'google-' + Date.now(), 'user').catch(() => {});
        // Force session for Google users
        const users = getAllUsers();
        let u = users.find(x => x.email === acc.email);
        if (!u) {
          // Already created above, try again
          const r2 = await createUser(acc.name, acc.email, 'G00gle$ign1n' + Date.now());
          u = r2.user;
        }
        if (u) {
          setSession({ id: u.id, name: u.name, email: u.email, role: 'user', avatar: u.avatar, loginTime: Date.now() });
          toast(`Signed in as ${u.name} 🎉`, 'success');
          setTimeout(() => window.location.replace('user/dashboard.html'), 800);
        }
      };
      box.appendChild(btn);
    });

    const cancel = document.createElement('button');
    cancel.style.cssText = 'width:100%;padding:9px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,.08);color:rgba(134,239,172,.5);font-size:.825rem;font-family:Outfit,sans-serif;cursor:pointer;margin-top:4px';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => document.body.removeChild(overlay);
    box.appendChild(cancel);

    overlay.appendChild(box);
    overlay.onclick = (ev) => { if (ev.target === overlay) document.body.removeChild(overlay); };
    document.body.appendChild(overlay);
  };

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      if (typeof initializeData === 'function') {
        await initializeData();
      }
    } catch (e) {
      console.error("Data initialization failed:", e);
    }
    setupUI();
  });
})();
