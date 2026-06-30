// ============================================================
// Farmers To Mart — Admin Dashboard Logic
// Handles session validation, dynamic content rendering, CRUD
// operations for stores/farmers, user management, query resolution,
// and custom HTML5 Canvas drawing for statistics/reports.
// ============================================================

(function () {
  'use strict';

  // ── Session Check & Authentication ──────────────────────────
  const session = getSession();
  if (!session || session.role !== 'admin') {
    // Unauthorized access — redirect to login
    window.location.replace('../auth.html?role=admin');
    return;
  }

  // Current active section state
  let currentSection = 'dashboard';
  let activeStoreFilter = 'all';
  let activeFarmerFilter = 'all';

  // ── Toast Notifications ──────────────────────────────────────
  function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    toast.appendChild(icon);
    icon.textContent = icons[type] || 'ℹ️';

    const text = document.createElement('span');
    text.textContent = msg; // textContent — safe, no XSS
    toast.appendChild(text);

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── Section Toggling ─────────────────────────────────────────
  window.showSection = async function (sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.remove('active'));

    const targetSec = document.getElementById(`section-${sectionId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Update sidebar links
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => item.classList.remove('active'));

    const activeBtn = document.getElementById(`nav-${sectionId}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Update page header title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace('-', ' ');
    }

    currentSection = sectionId;

    // Trigger section-specific load actions
    if (sectionId === 'dashboard') {
      await renderDashboard();
    } else if (sectionId === 'stores') {
      renderStores();
    } else if (sectionId === 'farmers') {
      renderFarmers();
    } else if (sectionId === 'users') {
      renderUsers();
    } else if (sectionId === 'demands') {
      await renderDemands();
    } else if (sectionId === 'deliveries') {
      await renderDeliveriesSection();
    } else if (sectionId === 'assign') {
      await renderAssignSection();
    } else if (sectionId === 'inbox') {
      await renderInboxSection();
    } else if (sectionId === 'reports') {
      renderReports();
    } else if (sectionId === 'queries') {
      renderQueries();
    }

    // Close sidebar on mobile after clicking
    closeSidebar();
  };

  // ── Mobile Sidebar Control ───────────────────────────────────
  window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  };

  window.closeSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  };

  // ── Modal Handlers ───────────────────────────────────────────
  window.openAddStoreModal = function () {
    const modal = document.getElementById('add-store-modal');
    if (modal) modal.classList.remove('hidden');
  };

  window.openAddFarmerModal = function () {
    const modal = document.getElementById('add-farmer-modal');
    if (modal) modal.classList.remove('hidden');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  };

  // ── Log out ──────────────────────────────────────────────────
  window.handleLogout = function () {
    clearSession();
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
      window.location.replace('../auth.html?role=admin');
    }, 800);
  };

  // ── Render Dashboard (Overview) ──────────────────────────────
  async function renderDashboard() {
    // 1. Calculate & Render Stats Cards
    const stats = getDashboardStats();
    let taskStats = { totalPendingDeliveries: 0, totalPendingPayments: 0 };
    try {
      taskStats = await getTaskStats();
    } catch (e) {
      console.error("Failed to load task stats for dashboard overview:", e);
    }
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.replaceChildren();

      const cardsData = [
        { label: 'Total Stores', val: stats.stores, ico: '🏪', color: 'green', trend: '↑ 2 new this month', section: 'stores' },
        { label: 'Registered Farmers', val: stats.farmers, ico: '👨‍🌾', color: 'gold', trend: '↑ 14 active', section: 'farmers' },
        { label: 'Active Consumers', val: stats.users, ico: '👥', color: 'blue', trend: '↑ 5% increase', section: 'users' },
        { label: 'Pending Queries', val: stats.pendingQueries, ico: '💬', color: 'red', trend: stats.pendingQueries > 0 ? '⚠️ Action needed' : '✓ All clean', section: 'queries' },
        { label: 'Pending Deliveries', val: taskStats.totalPendingDeliveries, ico: '📦', color: 'gold', trend: taskStats.totalPendingDeliveries > 0 ? 'Dispatch required' : '✓ All clear', section: 'deliveries' },
        { label: 'Pending Payments', val: taskStats.totalPendingPayments, ico: '💳', color: 'red', trend: taskStats.totalPendingPayments > 0 ? 'Unpaid clearance' : '✓ All paid', section: 'deliveries' }
      ];

      cardsData.forEach(card => {
        const div = document.createElement('div');
        div.className = 'stat-card';
        div.onclick = () => showSection(card.section);
        div.style.cursor = 'pointer';

        const icoDiv = document.createElement('div');
        icoDiv.className = `stat-ico ${card.color}`;
        icoDiv.textContent = card.ico;
        div.appendChild(icoDiv);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'stat-info';

        const lbl = document.createElement('div');
        lbl.className = 'stat-lbl';
        lbl.textContent = card.label;
        infoDiv.appendChild(lbl);

        const val = document.createElement('div');
        val.className = 'stat-val';
        val.textContent = card.val;
        infoDiv.appendChild(val);

        const trend = document.createElement('div');
        trend.className = `stat-trend ${card.color === 'red' && card.val > 0 ? 'down' : 'up'}`;
        trend.textContent = card.trend;
        infoDiv.appendChild(trend);

        div.appendChild(infoDiv);
        statsGrid.appendChild(div);
      });
    }

    // 2. Update Sidebar Badge count
    const badge = document.getElementById('query-badge');
    if (badge) {
      if (stats.pendingQueries > 0) {
        badge.textContent = stats.pendingQueries;
        badge.classList.remove('hidden');
      } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
      }
    }

    // 3. Render recent unresolved user queries
    const recentQueriesList = document.getElementById('recent-queries-list');
    if (recentQueriesList) {
      recentQueriesList.replaceChildren();
      const queries = getAllQueries().filter(q => q.status === 'pending').slice(0, 3);

      if (!queries.length) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:30px; text-align:center; color:rgba(134,239,172,.3); font-size:.9rem';
        empty.textContent = '🎉 No pending queries escalated to Admin!';
        recentQueriesList.appendChild(empty);
      } else {
        queries.forEach(q => {
          const card = createQueryCard(q);
          recentQueriesList.appendChild(card);
        });
      }
    }

    // 4. Render small preview charts
    const reportsData = getReports();
    drawSalesLineChart('sales-chart', reportsData.months, reportsData.monthly_sales);
    drawOrdersBarChart('orders-chart', reportsData.months, reportsData.monthly_orders);
  }

  // Helper to create a query card DOM element safely (XSS proof)
  function createQueryCard(q) {
    const div = document.createElement('div');
    div.className = `query-card ${q.status}`;

    const info = document.createElement('div');
    info.className = 'query-info';

    const user = document.createElement('div');
    user.className = 'query-user';
    
    const userRoleIco = document.createElement('span');
    userRoleIco.textContent = '👤';
    user.appendChild(userRoleIco);

    const userNameSpan = document.createElement('span');
    userNameSpan.textContent = q.userName;
    user.appendChild(userNameSpan);

    const userMail = document.createElement('span');
    userMail.style.cssText = 'font-size:.78rem; font-weight:normal; color:rgba(134,239,172,.4)';
    userMail.textContent = `(${q.userEmail})`;
    user.appendChild(userMail);
    info.appendChild(user);

    const text = document.createElement('div');
    text.className = 'query-text';
    text.textContent = q.query;
    info.appendChild(text);

    const meta = document.createElement('div');
    meta.className = 'query-meta';
    
    const timeSpan = document.createElement('span');
    const date = new Date(q.timestamp);
    timeSpan.textContent = `Escalated: ${date.toLocaleString()}`;
    meta.appendChild(timeSpan);

    const statusSpan = document.createElement('span');
    statusSpan.className = `cat-pill ${q.status === 'pending' ? 'fruits' : 'vegetables'}`;
    statusSpan.style.padding = '1px 8px';
    statusSpan.textContent = q.status.toUpperCase();
    meta.appendChild(statusSpan);

    if (q.mailed) {
      const mailSpan = document.createElement('span');
      mailSpan.className = 'cat-pill pulses';
      mailSpan.style.padding = '1px 8px';
      mailSpan.textContent = `📧 Emailed to ${q.adminEmail || 'admin@gmail.'}`;
      meta.appendChild(mailSpan);
    }

    info.appendChild(meta);
    div.appendChild(info);

    // If pending, show Resolve button
    if (q.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'query-actions';

      const btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-sm';
      btn.textContent = 'Resolve';
      btn.onclick = () => {
        window.resolveQueryImmediately(q.id);
      };
      actions.appendChild(btn);
      div.appendChild(actions);
    }

    return div;
  }

  // ── Render Stores Section ────────────────────────────────────
  window.filterStores = function (category, btn) {
    activeStoreFilter = category;
    const filterTabs = document.querySelectorAll('#section-stores .filter-tab');
    filterTabs.forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderStores();
  };

  function renderStores() {
    const grid = document.getElementById('stores-grid');
    if (!grid) return;
    grid.replaceChildren();

    let stores = getAllStores();
    if (activeStoreFilter !== 'all') {
      stores = stores.filter(s => s.category === activeStoreFilter);
    }

    if (!stores.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1; padding:60px; text-align:center; color:rgba(134,239,172,.3)';
      empty.textContent = 'No stores found in this category.';
      grid.appendChild(empty);
      return;
    }

    stores.forEach(s => {
      const card = document.createElement('div');
      card.className = 'store-card';

      const hdr = document.createElement('div');
      hdr.className = 'store-card-hdr';

      const logo = document.createElement('div');
      // Set simple logo classes
      const initials = s.logo || s.name.substring(0, 2).toUpperCase();
      logo.className = `store-logo ${initials.toLowerCase().substring(0, 2)}`;
      logo.textContent = initials;
      hdr.appendChild(logo);

      const info = document.createElement('div');
      info.className = 'store-info';
      const name = document.createElement('h4');
      name.className = 'store-name';
      name.textContent = s.name;
      info.appendChild(name);

      const loc = document.createElement('div');
      loc.className = 'store-loc';
      loc.textContent = `📍 ${s.location}`;
      info.appendChild(loc);
      hdr.appendChild(info);
      card.appendChild(hdr);

      const body = document.createElement('div');
      body.className = 'store-card-body';
      const about = document.createElement('p');
      about.className = 'store-about';
      about.textContent = s.about || 'A registered partner retail chain.';
      body.appendChild(about);

      const tags = document.createElement('div');
      tags.className = 'store-tags';
      const prodList = s.products || ['Fresh Vegetables', 'Seasonal Fruits'];
      prodList.forEach(p => {
        const tag = document.createElement('span');
        tag.className = 'store-tag';
        tag.textContent = p;
        tags.appendChild(tag);
      });
      body.appendChild(tags);
      card.appendChild(body);

      const ftr = document.createElement('div');
      ftr.className = 'store-card-ftr';

      const stars = document.createElement('div');
      stars.className = 'stars';
      const rating = s.rating || 4.5;
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i > Math.round(rating) ? 'star-empty' : ''}`;
        star.textContent = '★';
        stars.appendChild(star);
      }
      ftr.appendChild(stars);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-outline btn-sm';
      delBtn.style.color = 'var(--danger)';
      delBtn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => {
        if (confirm(`Are you sure you want to delete ${s.name}?`)) {
          deleteStore(s.id);
          showToast('Store deleted successfully.', 'success');
          renderStores();
        }
      };
      actions.appendChild(delBtn);
      ftr.appendChild(actions);

      card.appendChild(ftr);
      grid.appendChild(card);
    });
  }

  window.submitAddStore = function (e) {
    e.preventDefault();
    const nameEl = document.getElementById('store-name-input');
    const catEl = document.getElementById('store-cat-input');
    const locEl = document.getElementById('store-loc-input');
    const aboutEl = document.getElementById('store-about-input');

    if (!nameEl || !locEl) return;

    const name = nameEl.value.trim();
    const category = catEl.value;
    const location = locEl.value.trim();
    const about = aboutEl ? aboutEl.value.trim() : '';

    if (!name || !location) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    addStore({
      name,
      category,
      location,
      about,
      logo: initials,
      rating: 4.5,
      products: category === 'supermarket' ? ['Vegetables', 'Fruits', 'Pulses'] : ['Premium Produce', 'Dairy']
    });

    showToast('New store added successfully!', 'success');
    closeModal('add-store-modal');
    e.target.reset();
    renderStores();
  };

  // ── Render Farmers Section ───────────────────────────────────
  function renderFarmers() {
    // Render categories filter first
    const catGrid = document.getElementById('farmer-cat-grid');
    if (catGrid && !catGrid.children.length) {
      catGrid.replaceChildren();
      const categories = [
        { id: 'all', name: 'All Farmers', ico: '🌾' },
        { id: 'fruits', name: 'Fruit Growers', ico: '🍎' },
        { id: 'vegetables', name: 'Vegetable Growers', ico: '🥦' },
        { id: 'flowers', name: 'Flower Growers', ico: '🌸' },
        { id: 'pulses', name: 'Pulses Growers', ico: '🌾' }
      ];

      categories.forEach(c => {
        const card = document.createElement('div');
        card.className = `fcat-card ${activeFarmerFilter === c.id ? 'active' : ''}`;
        card.onclick = () => {
          activeFarmerFilter = c.id;
          document.querySelectorAll('.fcat-card').forEach(x => x.classList.remove('active'));
          card.classList.add('active');
          renderFarmersList();
        };

        const ico = document.createElement('div');
        ico.className = 'fcat-ico';
        ico.textContent = c.ico;
        card.appendChild(ico);

        const name = document.createElement('div');
        name.className = 'fcat-name';
        name.textContent = c.name;
        card.appendChild(name);

        catGrid.appendChild(card);
      });
    }

    renderFarmersList();
  }

  function renderFarmersList() {
    const grid = document.getElementById('farmers-grid');
    if (!grid) return;
    grid.replaceChildren();

    let farmers = getAllFarmers();
    if (activeFarmerFilter !== 'all') {
      farmers = farmers.filter(f => f.category === activeFarmerFilter);
    }

    if (!farmers.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1; padding:60px; text-align:center; color:rgba(134,239,172,.3)';
      empty.textContent = 'No farmers registered in this category.';
      grid.appendChild(empty);
      return;
    }

    farmers.forEach(f => {
      const card = document.createElement('div');
      card.className = 'farmer-card';

      const hdr = document.createElement('div');
      hdr.className = 'farmer-card-hdr';

      const av = document.createElement('div');
      av.className = 'avatar avatar-sm avatar-gold';
      av.textContent = f.avatar || f.name.substring(0, 2).toUpperCase();
      hdr.appendChild(av);

      const info = document.createElement('div');
      info.className = 'farmer-info';
      
      const titleWrap = document.createElement('div');
      titleWrap.style.cssText = 'display:flex; justify-content:space-between; align-items:center';

      const name = document.createElement('h4');
      name.className = 'farmer-name';
      name.textContent = f.name;
      titleWrap.appendChild(name);

      const pill = document.createElement('span');
      pill.className = `cat-pill ${f.category}`;
      pill.textContent = f.category;
      titleWrap.appendChild(pill);
      info.appendChild(titleWrap);

      const loc = document.createElement('div');
      loc.className = 'farmer-loc';
      loc.textContent = `📍 ${f.location}`;
      info.appendChild(loc);

      hdr.appendChild(info);
      card.appendChild(hdr);

      // Crops
      const crops = document.createElement('div');
      crops.className = 'farmer-crops';
      const cropList = f.crops || [];
      cropList.forEach(c => {
        const crop = document.createElement('span');
        crop.className = 'crop-tag';
        crop.textContent = c;
        crops.appendChild(crop);
      });
      card.appendChild(crops);

      // Metadata footer
      const ftr = document.createElement('div');
      ftr.className = 'farmer-card-ftr';

      const meta = document.createElement('div');
      meta.className = 'farmer-meta';

      const exp = document.createElement('div');
      exp.className = 'farmer-meta-item';
      exp.textContent = `⭐ ${f.experience || '5 years'}`;
      meta.appendChild(exp);

      const land = document.createElement('div');
      land.className = 'farmer-meta-item';
      land.textContent = `🚜 ${f.landArea || '2 acres'}`;
      meta.appendChild(land);
      ftr.appendChild(meta);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-outline btn-sm';
      delBtn.style.color = 'var(--danger)';
      delBtn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => {
        if (confirm(`Are you sure you want to delete ${f.name}?`)) {
          deleteFarmer(f.id);
          showToast('Farmer profile deleted.', 'success');
          // Refresh list
          renderFarmersList();
          // Update count inside category filters
          const catCards = document.querySelectorAll('.fcat-card');
          catCards.forEach(cc => cc.classList.remove('active'));
          catGrid.replaceChildren(); // Forces recreation
          renderFarmers();
        }
      };
      ftr.appendChild(delBtn);

      card.appendChild(ftr);
      grid.appendChild(card);
    });
  }

  window.submitAddFarmer = function (e) {
    e.preventDefault();
    const nameEl = document.getElementById('farmer-name-input');
    const catEl = document.getElementById('farmer-cat-input');
    const locEl = document.getElementById('farmer-loc-input');
    const phoneEl = document.getElementById('farmer-phone-input');
    const cropsEl = document.getElementById('farmer-crops-input');
    const expEl = document.getElementById('farmer-exp-input');
    const landEl = document.getElementById('farmer-land-input');

    if (!nameEl || !locEl) return;

    const name = nameEl.value.trim();
    const category = catEl.value;
    const location = locEl.value.trim();
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const cropsRaw = cropsEl ? cropsEl.value : '';
    const experience = expEl ? expEl.value.trim() : '';
    const landArea = landEl ? landEl.value.trim() : '';

    if (!name || !location) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const crops = cropsRaw ? cropsRaw.split(',').map(c => c.trim()).filter(Boolean) : ['Organic Produce'];

    addFarmer({
      name,
      category,
      location,
      phone,
      crops,
      experience,
      landArea
    });

    showToast('Farmer profile registered successfully!', 'success');
    closeModal('add-farmer-modal');
    e.target.reset();
    
    // Refresh
    const catGrid = document.getElementById('farmer-cat-grid');
    if (catGrid) catGrid.replaceChildren(); // Reset filters
    renderFarmers();
  };

  // ── Render Users Section ─────────────────────────────────────
  function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.replaceChildren();

    const users = getAllUsers().filter(u => u.role === 'user');

    if (!users.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.textAlign = 'center';
      td.style.padding = '30px';
      td.style.color = 'rgba(134,239,172,.3)';
      td.textContent = 'No consumers registered on the platform.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') {
          openUserDetail(u.id);
        }
      };

      // User photograph & name & ID
      const tdUser = document.createElement('td');
      const flex = document.createElement('div');
      flex.style.display = 'flex';
      flex.style.alignItems = 'center';
      flex.style.gap = '12px';

      const img = document.createElement('img');
      img.src = u.photo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
      img.style.width = '38px';
      img.style.height = '38px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      img.style.border = '2px solid rgba(34, 197, 94, 0.2)';
      flex.appendChild(img);

      const nameIdWrapper = document.createElement('div');
      nameIdWrapper.style.display = 'flex';
      nameIdWrapper.style.flexDirection = 'column';

      const name = document.createElement('span');
      name.style.fontWeight = '700';
      name.textContent = u.name;
      nameIdWrapper.appendChild(name);

      const idSpan = document.createElement('span');
      idSpan.style.fontSize = '0.72rem';
      idSpan.style.color = 'rgba(134,239,172,.4)';
      idSpan.textContent = u.id;
      nameIdWrapper.appendChild(idSpan);

      flex.appendChild(nameIdWrapper);
      tdUser.appendChild(flex);
      tr.appendChild(tdUser);

      // Email
      const tdEmail = document.createElement('td');
      tdEmail.textContent = u.email;
      tr.appendChild(tdEmail);

      // Presence
      const tdPresence = document.createElement('td');
      const presenceBadge = document.createElement('span');
      presenceBadge.className = `cat-pill ${u.online ? 'vegetables' : 'pulses'}`;
      presenceBadge.style.padding = '2px 10px';
      presenceBadge.style.fontSize = '0.72rem';
      presenceBadge.innerHTML = u.online ? '● Online' : '○ Offline';
      tdPresence.appendChild(presenceBadge);
      tr.appendChild(tdPresence);

      // Status
      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `cat-pill ${u.status === 'active' ? 'vegetables' : 'fruits'}`;
      badge.style.padding = '2px 10px';
      badge.textContent = u.status.toUpperCase();
      tdStatus.appendChild(badge);
      tr.appendChild(tdStatus);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.style.display = 'flex';
      tdActions.style.gap = '8px';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = `btn btn-sm ${u.status === 'active' ? 'btn-outline' : 'btn-primary'}`;
      toggleBtn.textContent = u.status === 'active' ? 'Deactivate' : 'Activate';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        toggleUserStatus(u.id);
        showToast(`User account ${u.status === 'active' ? 'deactivated' : 'activated'}`, 'info');
        renderUsers();
      };
      tdActions.appendChild(toggleBtn);

      const detailsBtn = document.createElement('button');
      detailsBtn.className = 'btn btn-outline btn-sm';
      detailsBtn.textContent = 'Details';
      detailsBtn.onclick = (e) => {
        e.stopPropagation();
        openUserDetail(u.id);
      };
      tdActions.appendChild(detailsBtn);

      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  // ── Open User Detail Modal ──────────────────────────────────
  window.openUserDetail = function (userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Open the modal
    const modal = document.getElementById('user-detail-modal');
    if (modal) modal.classList.remove('hidden');

    // Populate profile details
    document.getElementById('user-detail-photo').src = user.photo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
    document.getElementById('user-detail-name').textContent = user.name;
    document.getElementById('user-detail-id-text').textContent = user.id;
    document.getElementById('user-detail-email').textContent = user.email;
    document.getElementById('user-detail-phone').textContent = user.phone || 'N/A';
    document.getElementById('user-detail-gender').textContent = user.gender || 'N/A';
    document.getElementById('user-detail-age').textContent = user.age || 'N/A';
    document.getElementById('user-detail-joined').textContent = user.joinDate || 'N/A';

    // Presence & Status badge
    const badge = document.getElementById('user-detail-status-badge');
    if (badge) {
      badge.className = `cat-pill ${user.online ? 'vegetables' : 'pulses'}`;
      badge.textContent = user.online ? 'ONLINE' : 'OFFLINE';
    }

    // Queries list for this user
    const queries = getAllQueries().filter(q => q.userId === userId);
    const resolvedCount = queries.filter(q => q.status === 'resolved').length;
    const pendingCount = queries.filter(q => q.status === 'pending').length;
    const totalCount = queries.length;

    // Percentiles
    const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
    const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;

    document.getElementById('user-stat-resolved-percent').textContent = `${resolvedPercent}%`;
    document.getElementById('user-stat-resolved-count').textContent = resolvedCount;
    document.getElementById('user-stat-pending-percent').textContent = `${pendingPercent}%`;
    document.getElementById('user-stat-pending-count').textContent = pendingCount;
    document.getElementById('user-stat-total').textContent = totalCount;

    // Render list of queries
    const listContainer = document.getElementById('user-queries-list-container');
    if (listContainer) {
      listContainer.replaceChildren();
      if (!queries.length) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:15px 0; text-align:center; color:rgba(134,239,172,.3); font-size:.85rem';
        empty.textContent = 'No queries submitted by this user.';
        listContainer.appendChild(empty);
      } else {
        queries.forEach(q => {
          const item = document.createElement('div');
          item.className = 'user-query-item';
          item.style.cssText = 'border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding: 10px 0; display: flex; justify-content: space-between; align-items: center; gap: 10px;';

          const textCol = document.createElement('div');
          textCol.style.cssText = 'flex: 1; min-width: 0;';
          
          const queryText = document.createElement('div');
          queryText.style.cssText = 'font-size: 0.85rem; color: #e8f4ee; margin-bottom: 2px;';
          queryText.textContent = q.query;
          textCol.appendChild(queryText);

          const timeSpan = document.createElement('span');
          timeSpan.style.cssText = 'font-size: 0.72rem; color: rgba(134,239,172,.3);';
          timeSpan.textContent = new Date(q.timestamp).toLocaleString();
          textCol.appendChild(timeSpan);

          item.appendChild(textCol);

          const statusCol = document.createElement('div');
          statusCol.style.cssText = 'display:flex; align-items:center; gap:8px;';

          const pill = document.createElement('span');
          pill.className = `cat-pill ${q.status === 'pending' ? 'fruits' : 'vegetables'}`;
          pill.style.cssText = 'font-size: 0.65rem; padding: 2px 8px;';
          pill.textContent = q.status.toUpperCase();
          statusCol.appendChild(pill);

          if (q.status === 'pending') {
            const resBtn = document.createElement('button');
            resBtn.className = 'btn btn-primary btn-sm';
            resBtn.style.padding = '2px 8px';
            resBtn.style.fontSize = '0.65rem';
            resBtn.textContent = 'Resolve';
            resBtn.onclick = (e) => {
              e.stopPropagation();
              closeModal('user-detail-modal');
              window.openAIResolveModal(q.id);
            };
            statusCol.appendChild(resBtn);
          }

          item.appendChild(statusCol);
          listContainer.appendChild(item);
        });
      }
    }

    // Draw the custom Canvas donut chart
    drawUserDonutChart(resolvedPercent, pendingPercent, totalCount);
  };

  function drawUserDonutChart(resolvedPercent, pendingPercent, totalCount) {
    const canvas = document.getElementById('user-percentile-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 160 * dpr;
    canvas.height = 160 * dpr;
    canvas.style.width = '160px';
    canvas.style.height = '160px';
    ctx.scale(dpr, dpr);

    const w = 160;
    const h = 160;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 55;
    const thickness = 14;

    if (totalCount === 0) {
      // Draw empty gray ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = '#2d3748';
      ctx.stroke();

      ctx.fillStyle = 'rgba(134,239,172,0.4)';
      ctx.font = '11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Reports', centerX, centerY + 4);
      return;
    }

    // Draw background tracks
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Slices angles
    const resolvedAngle = (resolvedPercent / 100) * Math.PI * 2;
    const pendingAngle = (pendingPercent / 100) * Math.PI * 2;

    // Draw resolved slice (green)
    if (resolvedPercent > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + resolvedAngle);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = '#22c55e';
      ctx.stroke();
    }

    // Draw pending slice (red)
    if (pendingPercent > 0) {
      const startAngle = -Math.PI / 2 + resolvedAngle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + pendingAngle);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
    }

    // Text in the center
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${resolvedPercent}%`, centerX, centerY - 6);

    ctx.fillStyle = 'rgba(134,239,172,0.6)';
    ctx.font = '9px Outfit, sans-serif';
    ctx.fillText('Cleared', centerX, centerY + 12);
  }

  // ── AI RESOLUTION MAIL COMPOSER LOGIC ────────────────────────
  function generateAIResolution(queryText, userName) {
    const txt = (queryText || '').toLowerCase();
    let subject = `Resolution: Farmers To Mart Support`;
    const name = userName || 'User';
    let body = `Dear ${name},\n\nThank you for reaching out to Farmers To Mart support regarding your inquiry.\n\n`;

    if (txt.includes('pricing') || txt.includes('price') || txt.includes('cost')) {
      subject = `Resolution: Information on Produce Pricing`;
      body += `We understand you are seeking information about produce pricing. On Farmers To Mart, prices are negotiated directly between platform users and registered farmers based on market rates, transport costs, and bulk sizes. \n\nTo view pricing lists, please navigate to the "Fresh Produce" section in your user panel where you can inspect active farmer offerings.`;
    } else if (txt.includes('dispatch') || txt.includes('deliver') || txt.includes('transport') || txt.includes('mart')) {
      subject = `Resolution: Supply Dispatch and Logistics Support`;
      body += `Regarding your question about dispatches and store deliveries, please note that all supply orders must be delivered following the payment clearance constraint. \n\nYou can track and initiate dispatches under the "Deliveries & Payments" tab. Remember that payments for individual procurements must be marked as paid before the item can be dispatched.`;
    } else if (txt.includes('organic') || txt.includes('certif') || txt.includes('document')) {
      subject = `Resolution: Farmer Certifications and Documentation`;
      body += `We hear your inquiry regarding quality certifications. Farmers To Mart works closely with local agricultural officers to verify farm practices. \n\nOrganic certificates and land details are uploaded under the farmer profiles. You can browse specific farmer credentials directly under the "Browse Farmers" tab.`;
    } else if (txt.includes('number') || txt.includes('phone') || txt.includes('contact') || txt.includes('call')) {
      subject = `Resolution: Farmer Contact Verification`;
      body += `Regarding contact details for registered suppliers, all verified phone numbers and location maps are published in the "Browse Farmers" panel for active platform users. \n\nIf a supplier is unreachable, please try calling our helpdesk or message our AI assistant to look up alternative contact logs.`;
    } else {
      subject = `Resolution: Support Inquiry Response`;
      body += `Regarding your query: "${queryText || ''}"\n\nOur operations team has reviewed the ticket. The platform allows full procurement workflow management (posting store demands, sourcing from farmers, and completing payment/delivery logs). \n\nIf you need further assistance with your account, please consult the chatbot or respond directly to this support email.`;
    }

    body += `\n\nHope this resolves your issue. If you have any additional questions, please feel free to ask.\n\nBest regards,\nFarmers To Mart Support Team\n(AI Assistant Resolution)`;
    
    return { subject, body };
  }

  window.resolveQueryImmediately = async function (queryId) {
    const queries = getAllQueries();
    const q = queries.find(query => query.id === queryId);
    if (!q) return;

    const resolution = generateAIResolution(q.query, q.userName);
    resolveQueryWithEmail(queryId, resolution.subject, resolution.body);

    showToast('Query successfully resolved and resolution email sent!', 'success');

    // Rerender active context
    if (currentSection === 'dashboard') {
      await renderDashboard();
    } else if (currentSection === 'queries') {
      renderQueries();
    }
  };

  window.openAIResolveModal = function (queryId) {
    const queries = getAllQueries();
    const q = queries.find(query => query.id === queryId);
    if (!q) return;

    document.getElementById('resolve-query-id').value = q.id;
    document.getElementById('resolve-query-text').textContent = q.query;

    const resolution = generateAIResolution(q.query, q.userName);
    document.getElementById('resolve-email-subject').value = resolution.subject;
    document.getElementById('resolve-email-body').value = resolution.body;

    const modal = document.getElementById('ai-resolve-modal');
    if (modal) modal.classList.remove('hidden');
  };

  window.submitAIResolutionMail = async function () {
    const queryId = document.getElementById('resolve-query-id').value;
    const subject = document.getElementById('resolve-email-subject').value.trim();
    const body = document.getElementById('resolve-email-body').value.trim();

    if (!subject || !body) {
      showToast('Please fill out the email subject and body.', 'error');
      return;
    }

    resolveQueryWithEmail(queryId, subject, body);

    showToast('Resolution email successfully generated and sent!', 'success');
    closeModal('ai-resolve-modal');

    // Rerender active context
    if (currentSection === 'dashboard') {
      await renderDashboard();
    } else if (currentSection === 'queries') {
      renderQueries();
    }
  };

  // ── Render Pending Queries Section ───────────────────────────
  window.renderQueries = function () {
    const list = document.getElementById('queries-list');
    if (!list) return;
    list.replaceChildren();

    const queries = getAllQueries();

    if (!queries.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:60px; text-align:center; color:rgba(134,239,172,.3)';
      empty.textContent = '🎉 No inquiries escalated from the AI Chatbot!';
      list.appendChild(empty);
      return;
    }

    queries.forEach(q => {
      const card = createQueryCard(q);
      list.appendChild(card);
    });
  };

  // ── Render Reports Section ───────────────────────────────────
  function renderReports() {
    const reportsData = getReports();
    
    // Populate report stats grid
    const reportStats = document.getElementById('report-stats');
    if (reportStats) {
      reportStats.replaceChildren();
      
      const stats = getDashboardStats();
      const totalSales = reportsData.monthly_sales.reduce((a, b) => a + b, 0);
      const totalOrders = reportsData.monthly_orders.reduce((a, b) => a + b, 0);

      const cards = [
        { label: 'Annual Platform Sales', val: `₹${totalSales.toLocaleString()}`, ico: '📈', color: 'green' },
        { label: 'Annual Orders Logged', val: totalOrders.toLocaleString(), ico: '📦', color: 'blue' },
        { label: 'Average Order Value', val: `₹${Math.round(totalSales / totalOrders)}`, ico: '💰', color: 'gold' },
        { label: 'Unresolved AI Escapes', val: stats.pendingQueries, ico: '🆘', color: 'red' }
      ];

      cards.forEach(c => {
        const div = document.createElement('div');
        div.className = 'stat-card';

        const icoDiv = document.createElement('div');
        icoDiv.className = `stat-ico ${c.color}`;
        icoDiv.textContent = c.ico;
        div.appendChild(icoDiv);

        const info = document.createElement('div');
        info.className = 'stat-info';
        const lbl = document.createElement('div');
        lbl.className = 'stat-lbl';
        lbl.textContent = c.label;
        info.appendChild(lbl);

        const val = document.createElement('div');
        val.className = 'stat-val';
        val.textContent = c.val;
        info.appendChild(val);

        div.appendChild(info);
        reportStats.appendChild(div);
      });
    }

    // Draw Report Charts
    drawSalesLineChart('report-sales-chart', reportsData.months, reportsData.monthly_sales);
    drawUsersBarChart('report-users-chart', reportsData.months, reportsData.monthly_users);
    drawCategoryPieChart('report-category-chart', reportsData.categories);
  }

  // ── Custom HTML5 Canvas Drawing Engine ───────────────────────
  // Premium, customized UI drawing rules

  function drawSalesLineChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Handle High DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    // Grid details
    const padding = { left: 45, right: 15, top: 15, bottom: 25 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data) * 1.1;

    // Draw grid background lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Draw grid text values
      ctx.fillStyle = 'rgba(134,239,172,0.3)';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'right';
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillText(val >= 1000 ? `${(val/1000).toFixed(1)}k` : val, padding.left - 8, y + 3);
    }

    // Plot Line points & fill gradient
    ctx.beginPath();
    labels.forEach((lbl, idx) => {
      const x = padding.left + (chartW / (labels.length - 1)) * idx;
      const y = padding.top + chartH - (data[idx] / maxVal) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Stroke the line
    ctx.strokeStyle = '#22c55e'; // Green primary
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Fill under the line gradient
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw dots and Label Months
    labels.forEach((lbl, idx) => {
      const x = padding.left + (chartW / (labels.length - 1)) * idx;
      const y = padding.top + chartH - (data[idx] / maxVal) * chartH;

      // Outer dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#15803d';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();

      // Labels on X-axis (only show alternate to save space)
      if (idx % 2 === 0 || labels.length <= 6) {
        ctx.fillStyle = 'rgba(134,239,172,0.4)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x, h - 8);
      }
    });
  }

  function drawOrdersBarChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 35, right: 15, top: 15, bottom: 25 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data) * 1.1;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(134,239,172,0.3)';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padding.left - 6, y + 3);
    }

    // Render Bars
    const barSpacing = chartW / labels.length;
    const barW = barSpacing * 0.65;

    labels.forEach((lbl, idx) => {
      const x = padding.left + barSpacing * idx + (barSpacing - barW) / 2;
      const barH = (data[idx] / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);

      // Set gradient fill
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, '#eab308'); // Gold
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.fill();

      // Label
      if (idx % 2 === 0 || labels.length <= 6) {
        ctx.fillStyle = 'rgba(134,239,172,0.4)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x + barW / 2, h - 8);
      }
    });
  }

  function drawUsersBarChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 35, right: 15, top: 15, bottom: 25 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data) * 1.1;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(134,239,172,0.3)';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padding.left - 6, y + 3);
    }

    // Render Bars
    const barSpacing = chartW / labels.length;
    const barW = barSpacing * 0.65;

    labels.forEach((lbl, idx) => {
      const x = padding.left + barSpacing * idx + (barSpacing - barW) / 2;
      const barH = (data[idx] / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);

      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, '#60a5fa'); // Blue
      grad.addColorStop(1, '#2563eb');
      ctx.fillStyle = grad;
      ctx.fill();

      if (idx % 2 === 0 || labels.length <= 6) {
        ctx.fillStyle = 'rgba(134,239,172,0.4)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x + barW / 2, h - 8);
      }
    });
  }

  function drawCategoryPieChart(canvasId, categoryObj) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const keys = Object.keys(categoryObj);
    const values = Object.values(categoryObj);
    const total = values.reduce((a, b) => a + b, 0);

    const colors = ['#22c55e', '#fb923c', '#f59e0b', '#f472b6', '#3b82f6'];
    let startAngle = 0;

    const centerX = w * 0.35;
    const centerY = h * 0.5;
    const radius = Math.min(centerX, centerY) * 0.8;

    // Draw slices
    keys.forEach((key, idx) => {
      const sliceAngle = (values[idx] / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Draw donut hole (premium style)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#162e20'; // matches dark surface background
    ctx.fill();

    // Draw Legend on the right side
    const legendX = w * 0.68;
    const legendYStart = h * 0.25;
    keys.forEach((key, idx) => {
      const y = legendYStart + idx * 22;

      // Color Box
      ctx.fillStyle = colors[idx % colors.length];
      ctx.beginPath();
      ctx.roundRect(legendX, y - 8, 12, 12, 3);
      ctx.fill();

      // Label Text
      ctx.fillStyle = '#e8f4ee';
      ctx.font = '11px Outfit, sans-serif';
      ctx.textAlign = 'left';
      const capKey = key.charAt(0).toUpperCase() + key.slice(1);
      ctx.fillText(`${capKey} (${categoryObj[key]}%)`, legendX + 20, y + 2);
    });
  }

  // ── Marts Demands Section ────────────────────────────────────
  async function populateStoresDropdown() {
    const storeSelect = document.getElementById('admin-demand-store');
    if (!storeSelect) return;
    storeSelect.replaceChildren();

    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = '-- Select Store --';
    storeSelect.appendChild(defOpt);

    const stores = getAllStores();
    stores.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.textContent = s.name;
      storeSelect.appendChild(opt);
    });
  }

  async function renderDemands() {
    const tableBody = document.getElementById('admin-demands-tbody');
    const consolidatedDiv = document.getElementById('admin-consolidated-demands');
    if (!tableBody) return;

    tableBody.replaceChildren();
    if (consolidatedDiv) consolidatedDiv.replaceChildren();

    await populateStoresDropdown();

    const demands = await getDemands();

    // 1. Render Consolidated Demands
    const pendingDemands = demands.filter(d => d.status === 'pending');
    if (consolidatedDiv) {
      const consolidated = {};
      pendingDemands.forEach(d => {
        consolidated[d.itemName] = (consolidated[d.itemName] || 0) + d.quantity;
      });

      const keys = Object.keys(consolidated);
      if (keys.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.88rem;';
        emptyMsg.textContent = 'No pending store demands at the moment.';
        consolidatedDiv.appendChild(emptyMsg);
      } else {
        keys.forEach(itemName => {
          const row = document.createElement('div');
          row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid var(--border);';

          const nameSpan = document.createElement('span');
          nameSpan.style.fontWeight = '500';
          nameSpan.style.color = 'var(--text)';
          nameSpan.textContent = itemName;
          row.appendChild(nameSpan);

          const qtySpan = document.createElement('span');
          qtySpan.style.cssText = 'font-weight: 700; color: var(--primary-light);';
          qtySpan.textContent = `${consolidated[itemName]} units`;
          row.appendChild(qtySpan);

          consolidatedDiv.appendChild(row);
        });
      }
    }

    // 2. Render Demands Log Table
    if (demands.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      td.textContent = 'No demands posted yet.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    demands.forEach(d => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';

      const tdStore = document.createElement('td');
      tdStore.style.padding = '12px 16px; color: var(--text); font-weight: 500;';
      tdStore.textContent = d.storeName;
      tr.appendChild(tdStore);

      const tdItem = document.createElement('td');
      tdItem.style.padding = '12px 16px; color: var(--text);';
      tdItem.textContent = d.itemName;
      tr.appendChild(tdItem);

      const tdQty = document.createElement('td');
      tdQty.style.padding = '12px 16px; color: var(--text);';
      tdQty.textContent = `${d.quantity} units`;
      tr.appendChild(tdQty);

      const tdStatus = document.createElement('td');
      tdStatus.style.padding = '12px 16px;';
      const badge = document.createElement('span');
      badge.style.cssText = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;';
      if (d.status === 'pending') {
        badge.style.background = 'rgba(234, 179, 8, 0.1)';
        badge.style.color = '#eab308';
        badge.textContent = 'PENDING';
      } else if (d.status === 'assigned') {
        badge.style.background = 'rgba(59, 130, 246, 0.1)';
        badge.style.color = '#3b82f6';
        badge.textContent = 'ASSIGNED';
      } else {
        badge.style.background = 'rgba(34, 197, 94, 0.1)';
        badge.style.color = '#22c55e';
        badge.textContent = 'COMPLETED';
      }
      tdStatus.appendChild(badge);
      tr.appendChild(tdStatus);

      const tdDate = document.createElement('td');
      tdDate.style.padding = '12px 16px; color: var(--text-muted);';
      tdDate.textContent = new Date(d.createdAt).toLocaleDateString();
      tr.appendChild(tdDate);

      const tdActions = document.createElement('td');
      tdActions.style.cssText = 'padding: 12px 16px; text-align: right;';
      if (d.status === 'pending') {
        const assignBtn = document.createElement('button');
        assignBtn.className = 'btn btn-primary btn-sm';
        assignBtn.textContent = 'Assign Task';
        assignBtn.onclick = () => window.routeToAssign(d.id || d._id);
        tdActions.appendChild(assignBtn);
      } else {
        const text = document.createElement('span');
        text.style.cssText = 'font-size: 0.85rem; color: var(--text-muted);';
        text.textContent = 'In progress';
        tdActions.appendChild(text);
      }
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  window.handleCreateDemand = async function (e) {
    if (e) e.preventDefault();
    const store = document.getElementById('admin-demand-store').value;
    const item = document.getElementById('admin-demand-item').value.trim();
    const qty = parseFloat(document.getElementById('admin-demand-qty').value);

    if (!store || !item || isNaN(qty) || qty <= 0) {
      showToast('Please fill in store, item name, and a valid quantity.', 'error');
      return;
    }

    const res = await createDemand(store, item, qty);
    if (res.success) {
      showToast(`Successfully posted demand request for ${qty} ${item}!`, 'success');
      document.getElementById('admin-demand-form').reset();
      await renderDemands();
    } else {
      showToast(res.message || 'Failed to post store demand.', 'error');
    }
  };

  window.routeToAssign = function (demandId) {
    showSection('assign');
    renderAssignSection(demandId);
  };

  // ── Deliveries & Payments Master Log ──────────────────────────
  async function renderDeliveriesSection() {
    const tableBody = document.getElementById('admin-tasks-tbody');
    if (!tableBody) return;
    tableBody.replaceChildren();

    const tasks = await getTasks();

    if (tasks.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      td.textContent = 'No tasks or deliveries registered yet.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    const users = getAllUsers();

    tasks.forEach(t => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';

      // Store
      const tdStore = document.createElement('td');
      tdStore.style.padding = '12px 16px; font-weight: 500; color: var(--text);';
      tdStore.textContent = t.storeName;
      tr.appendChild(tdStore);

      // Item
      const tdItem = document.createElement('td');
      tdItem.style.padding = '12px 16px; color: var(--text);';
      tdItem.textContent = t.itemName;
      tr.appendChild(tdItem);

      // Qty
      const tdQty = document.createElement('td');
      tdQty.style.padding = '12px 16px; color: var(--text);';
      tdQty.textContent = `${t.quantity} units`;
      tr.appendChild(tdQty);

      // Assigned User
      const tdUser = document.createElement('td');
      tdUser.style.padding = '12px 16px; color: var(--text-muted);';
      const uId = (t.assignedUser && typeof t.assignedUser === 'object') ? t.assignedUser.id || t.assignedUser._id : t.assignedUser;
      const userObj = users.find(u => u.id === uId);
      tdUser.textContent = userObj ? userObj.name : 'Unknown User';
      tr.appendChild(tdUser);

      // Farmer
      const tdFarmer = document.createElement('td');
      tdFarmer.style.padding = '12px 16px; color: var(--text-muted);';
      tdFarmer.textContent = t.farmer && t.farmer.name ? t.farmer.name : 'Unassigned';
      tr.appendChild(tdFarmer);

      // Pricing
      const tdPrice = document.createElement('td');
      tdPrice.style.padding = '12px 16px; color: var(--text-muted);';
      tdPrice.textContent = `₹${t.purchasePrice} / ₹${t.deliveryPrice} (+₹${t.deliveryCharges})`;
      tr.appendChild(tdPrice);

      // Payment Status
      const tdPayment = document.createElement('td');
      tdPayment.style.padding = '12px 16px;';
      const payPill = document.createElement('span');
      payPill.style.cssText = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;';
      if (t.paymentStatus === 'paid') {
        payPill.style.background = 'rgba(34, 197, 94, 0.1)';
        payPill.style.color = '#22c55e';
        payPill.textContent = 'PAID';
      } else {
        payPill.style.background = 'rgba(239, 68, 68, 0.1)';
        payPill.style.color = '#ef4444';
        payPill.textContent = 'PENDING';
      }
      tdPayment.appendChild(payPill);
      tr.appendChild(tdPayment);

      // Delivery Status
      const tdDelivery = document.createElement('td');
      tdDelivery.style.padding = '12px 16px;';
      const delPill = document.createElement('span');
      delPill.style.cssText = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;';
      if (t.deliveryStatus === 'delivered') {
        delPill.style.background = 'rgba(34, 197, 94, 0.1)';
        delPill.style.color = '#22c55e';
        delPill.textContent = 'DELIVERED';
      } else {
        delPill.style.background = 'rgba(245, 158, 11, 0.1)';
        delPill.style.color = '#f59e0b';
        delPill.textContent = 'PENDING';
      }
      tdDelivery.appendChild(delPill);
      tr.appendChild(tdDelivery);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.style.cssText = 'padding: 12px 16px; text-align: right;';

      const tId = t.id || t._id;
      if (t.paymentStatus === 'pending') {
        const payBtn = document.createElement('button');
        payBtn.className = 'btn btn-sm btn-outline';
        payBtn.textContent = 'Clear Payment';
        payBtn.onclick = () => window.payTaskAdmin(tId);
        tdActions.appendChild(payBtn);
      } else if (t.deliveryStatus === 'pending') {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-primary';
        delBtn.textContent = 'Mark Delivery';
        delBtn.onclick = () => window.deliverTaskAdmin(tId);
        tdActions.appendChild(delBtn);
      } else {
        const check = document.createElement('span');
        check.style.cssText = 'color: var(--primary-light); font-weight: 600; font-size: 0.85rem;';
        check.textContent = '✓ Completed';
        tdActions.appendChild(check);
      }
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  window.payTaskAdmin = async function (taskId) {
    const res = await updateTaskPayment(taskId);
    if (res.success) {
      showToast('Payment cleared successfully!', 'success');
      await renderDeliveriesSection();
    } else {
      showToast(res.message || 'Failed to clear payment.', 'error');
    }
  };

  window.deliverTaskAdmin = async function (taskId) {
    const res = await updateTaskDelivery(taskId);
    if (res.success) {
      showToast('Delivery completed successfully!', 'success');
      await renderDeliveriesSection();
    } else {
      showToast(res.message || 'Failed to complete delivery.', 'error');
    }
  };

  // ── Assign Tasks Section ──────────────────────────────────────
  async function renderAssignSection(preselectedDemandId = '') {
    const userSelect = document.getElementById('assign-user-select');
    const demandSelect = document.getElementById('assign-demand-select');
    const deadlineInput = document.getElementById('assign-deadline');

    if (!userSelect || !demandSelect) return;

    // Reset values
    userSelect.replaceChildren();
    demandSelect.replaceChildren();
    if (deadlineInput) deadlineInput.value = '';

    // Populate active platform users
    const usersDef = document.createElement('option');
    usersDef.value = '';
    usersDef.textContent = '-- Choose User --';
    userSelect.appendChild(usersDef);

    const users = getAllUsers().filter(u => u.role === 'user' && u.status === 'active');
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.email})`;
      userSelect.appendChild(opt);
    });

    // Populate active store demands
    const demandsDef = document.createElement('option');
    demandsDef.value = '';
    demandsDef.textContent = '-- Choose Demand --';
    demandSelect.appendChild(demandsDef);

    const demands = await getDemands();
    const pendingDemands = demands.filter(d => d.status === 'pending');
    pendingDemands.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id || d._id;
      opt.textContent = `${d.storeName} - ${d.itemName} (${d.quantity} units)`;
      demandSelect.appendChild(opt);
    });

    if (preselectedDemandId) {
      demandSelect.value = preselectedDemandId;
    }

    await renderUserMeters();
  }

  async function renderUserMeters() {
    const grid = document.getElementById('user-meters-grid');
    if (!grid) return;
    grid.replaceChildren();

    const users = getAllUsers().filter(u => u.role === 'user');
    const tasks = await getTasks();

    if (users.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);';
      empty.textContent = 'No platform users registered yet.';
      grid.appendChild(empty);
      return;
    }

    tasks.forEach(t => {
      // Clean/sanitize user ids
      if (t.assignedUser && typeof t.assignedUser === 'object') {
        t.userIdStr = t.assignedUser.id || t.assignedUser._id;
      } else {
        t.userIdStr = t.assignedUser;
      }
    });

    users.forEach(u => {
      const uTasks = tasks.filter(t => t.userIdStr === u.id);
      const total = uTasks.length;
      const completed = uTasks.filter(t => t.deliveryStatus === 'delivered' && t.paymentStatus === 'paid').length;
      const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const pendingDeliv = uTasks.filter(t => t.deliveryStatus === 'pending').length;
      const pendingPay = uTasks.filter(t => t.paymentStatus === 'pending').length;

      const card = document.createElement('div');
      card.className = 'store-card';
      card.style.cssText = 'padding: 20px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;';

      const userHeader = document.createElement('div');
      userHeader.style.cssText = 'display: flex; align-items: center; gap: 12px;';

      const photo = document.createElement('img');
      photo.src = u.photo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
      photo.style.cssText = 'width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(34, 197, 94, 0.2);';
      userHeader.appendChild(photo);

      const userInfo = document.createElement('div');
      const name = document.createElement('div');
      name.style.cssText = 'font-weight: 700; color: var(--text);';
      name.textContent = u.name;
      userInfo.appendChild(name);

      const email = document.createElement('div');
      email.style.cssText = 'font-size: 0.76rem; color: var(--text-muted);';
      email.textContent = u.email;
      userInfo.appendChild(email);
      userHeader.appendChild(userInfo);
      card.appendChild(userHeader);

      // Progress bar
      const progressWrap = document.createElement('div');
      const progLabel = document.createElement('div');
      progLabel.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;';
      progLabel.innerHTML = `<span>Task Completion</span><strong>${completionPercent}%</strong>`;
      progressWrap.appendChild(progLabel);

      const progBarBg = document.createElement('div');
      progBarBg.style.cssText = 'width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;';
      const progBarFill = document.createElement('div');
      progBarFill.style.cssText = `width: ${completionPercent}%; height: 100%; background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%); border-radius: 3px;`;
      progBarBg.appendChild(progBarFill);
      progressWrap.appendChild(progBarBg);
      card.appendChild(progressWrap);

      // Task Stats counts
      const stats = document.createElement('div');
      stats.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.78rem; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px;';
      stats.innerHTML = `
        <div>Total: <strong style="color: var(--text);">${total}</strong></div>
        <div>Pending Delv: <strong style="color: var(--gold-light);">${pendingDeliv}</strong></div>
        <div>Pending Pay: <strong style="color: var(--danger);">${pendingPay}</strong></div>
      `;
      card.appendChild(stats);

      grid.appendChild(card);
    });
  }

  window.handleAssignSubmit = async function (e) {
    if (e) e.preventDefault();
    const assignedUser = document.getElementById('assign-user-select').value;
    const demandId = document.getElementById('assign-demand-select').value;
    const deadline = document.getElementById('assign-deadline').value;

    if (!assignedUser || !demandId || !deadline) {
      showToast('Please select a user, demand, and deadline.', 'error');
      return;
    }

    const demands = await getDemands();
    const demand = demands.find(d => (d.id === demandId || d._id === demandId));
    if (!demand) {
      showToast('Selected demand request not found.', 'error');
      return;
    }

    const taskData = {
      assignedUser,
      demandId,
      storeName: demand.storeName,
      itemName: demand.itemName,
      quantity: demand.quantity,
      deadline,
      type: 'admin-assigned',
      farmer: { name: '', category: '' },
      purchasePrice: 0,
      deliveryPrice: 0,
      deliveryCharges: 0
    };

    const res = await createTask(taskData);
    if (res.success) {
      showToast(`Task assigned successfully to user!`, 'success');
      document.getElementById('admin-assign-form').reset();
      await renderAssignSection();
    } else {
      showToast(res.message || 'Failed to assign task.', 'error');
    }
  };

  // ── Reports Inbox ────────────────────────────────────────────
  async function renderInboxSection() {
    const list = document.getElementById('reports-inbox-list');
    if (!list) return;
    list.replaceChildren();

    const reports = getAllSubmittedReports();

    if (reports.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 50px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);';
      empty.textContent = '✉️ No performance reports submitted by users yet.';
      list.appendChild(empty);
      return;
    }

    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = 'store-card';
      card.style.cssText = 'padding: 24px; display: flex; flex-direction: column; gap: 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;';

      // Header row
      const hdr = document.createElement('div');
      hdr.className = 'reports-inbox-hdr-wrap';
      hdr.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 14px;';

      const userFlex = document.createElement('div');
      userFlex.style.cssText = 'display: flex; align-items: center; gap: 12px;';

      const avatarImg = document.createElement('img');
      avatarImg.src = r.user.photo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
      avatarImg.style.cssText = 'width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(34, 197, 94, 0.2);';
      userFlex.appendChild(avatarImg);

      const userInfo = document.createElement('div');
      const name = document.createElement('h4');
      name.style.cssText = 'margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text);';
      name.textContent = r.user.name;
      userInfo.appendChild(name);

      const meta = document.createElement('div');
      meta.style.cssText = 'font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;';
      meta.textContent = `📧 ${r.user.email} | 📞 ${r.user.phone} | Age: ${r.user.age} | ${r.user.gender}`;
      userInfo.appendChild(meta);

      userFlex.appendChild(userInfo);
      hdr.appendChild(userFlex);

      const badgeFlex = document.createElement('div');
      badgeFlex.className = 'reports-inbox-badge-flex';
      badgeFlex.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 6px;';

      const cyclePill = document.createElement('span');
      cyclePill.style.cssText = 'display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;';
      if (r.cycle === 'weekly') {
        cyclePill.style.background = 'rgba(59, 130, 246, 0.12)';
        cyclePill.style.color = '#60a5fa';
        cyclePill.textContent = '📅 WEEKLY REPORT';
      } else {
        cyclePill.style.background = 'rgba(34, 197, 94, 0.12)';
        cyclePill.style.color = '#4ade80';
        cyclePill.textContent = '📆 MONTHLY REPORT';
      }
      badgeFlex.appendChild(cyclePill);

      const timeText = document.createElement('span');
      timeText.style.cssText = 'font-size: 0.74rem; color: var(--text-muted);';
      timeText.textContent = `Submitted: ${new Date(r.timestamp).toLocaleString()}`;
      badgeFlex.appendChild(timeText);

      hdr.appendChild(badgeFlex);
      card.appendChild(hdr);

      // Tasks table
      const tableWrap = document.createElement('div');
      tableWrap.className = 'table-responsive';
      tableWrap.style.cssText = 'border: 1px solid var(--border); border-radius: 8px; overflow: hidden;';

      const table = document.createElement('table');
      table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;';
      
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background: rgba(255,255,255,0.01); border-bottom: 1px solid var(--border);">
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Store</th>
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Item</th>
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Qty</th>
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Farmer</th>
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Pricing</th>
          <th style="padding: 10px 12px; color: var(--text-muted); font-weight:600;">Status</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      if (!r.tasks || r.tasks.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">No task data found in this report.</td>
          </tr>
        `;
      } else {
        r.tasks.forEach(t => {
          const row = document.createElement('tr');
          row.style.borderBottom = '1px solid var(--border)';

          const farmerName = t.farmer && t.farmer.name ? t.farmer.name : 'Unassigned';
          const buyPrice = t.purchasePrice || 0;
          const sellPrice = t.deliveryPrice || 0;
          const delvChg = t.deliveryCharges || 0;
          const pricingText = `₹${buyPrice}/₹${sellPrice} (+₹${delvChg})`;

          let statusText = 'Pending';
          let statusColor = '#f59e0b';
          let statusBg = 'rgba(245, 158, 11, 0.1)';
          if (t.paymentStatus === 'paid' && t.deliveryStatus === 'delivered') {
            statusText = 'Completed';
            statusColor = '#22c55e';
            statusBg = 'rgba(34, 197, 94, 0.1)';
          } else if (t.paymentStatus === 'pending') {
            statusText = 'Unpaid';
            statusColor = '#ef4444';
            statusBg = 'rgba(239, 68, 68, 0.1)';
          } else if (t.deliveryStatus === 'pending') {
            statusText = 'Undelivered';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.1)';
          }

          row.innerHTML = `
            <td style="padding: 10px 12px; color: var(--text); font-weight:500;">${t.storeName}</td>
            <td style="padding: 10px 12px; color: var(--text);">${t.itemName}</td>
            <td style="padding: 10px 12px; color: var(--text);">${t.quantity}</td>
            <td style="padding: 10px 12px; color: var(--text-muted);">${farmerName}</td>
            <td style="padding: 10px 12px; color: var(--text-muted);">${pricingText}</td>
            <td style="padding: 10px 12px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                ${statusText.toUpperCase()}
              </span>
            </td>
          `;
          tbody.appendChild(row);
        });
      }
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      card.appendChild(tableWrap);

      list.appendChild(card);
    });
  }

  // ── User Add/Edit and Profile Management ─────────────────────
  window.openAddUserModal = function () {
    const modal = document.getElementById('add-user-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();
    // Clear errors
    ['add-user-name-err', 'add-user-email-err', 'add-user-pw-err', 'add-user-phone-err', 'add-user-age-err', 'add-user-photo-err'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });
  };

  // Helper to read file as Data URL
  function readPhotoFile(fileInput) {
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

  window.submitAddUser = async function (e) {
    e.preventDefault();
    ['add-user-name-err', 'add-user-email-err', 'add-user-pw-err', 'add-user-phone-err', 'add-user-age-err', 'add-user-photo-err'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });

    const nameEl  = document.getElementById('add-user-name');
    const emailEl = document.getElementById('add-user-email');
    const pwEl    = document.getElementById('add-user-pw');
    const phoneEl = document.getElementById('add-user-phone');
    const genderEl = document.getElementById('add-user-gender');
    const ageEl    = document.getElementById('add-user-age');
    const photoEl  = document.getElementById('add-user-photo');

    if (!nameEl || !emailEl || !pwEl || !phoneEl || !ageEl) return;

    const name   = nameEl.value.trim();
    const email  = emailEl.value.trim();
    const pw     = pwEl.value;
    const phone  = phoneEl.value.trim();
    const gender = genderEl.value;
    const age    = ageEl.value.trim();

    let ok = true;
    if (name.length < 2 || name.length > 80) {
      const el = document.getElementById('add-user-name-err');
      if (el) { el.textContent = 'Name must be 2–80 characters.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      const el = document.getElementById('add-user-email-err');
      if (el) { el.textContent = 'Enter a valid email address.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (pw.length < 3 || pw.length > 128) {
      const el = document.getElementById('add-user-pw-err');
      if (el) { el.textContent = 'Password must be 3–128 characters.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      const el = document.getElementById('add-user-phone-err');
      if (el) { el.textContent = 'Phone must be exactly 10 digits.'; el.classList.remove('hidden'); }
      ok = false;
    }
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      const el = document.getElementById('add-user-age-err');
      if (el) { el.textContent = 'Age must be between 18 and 100.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('add-user-btn');
    const txt = document.getElementById('add-user-btn-txt');
    const spin = document.getElementById('add-user-spin');
    if (txt) txt.classList.add('hidden');
    if (spin) spin.classList.remove('hidden');

    try {
      const photoDataUrl = await readPhotoFile(photoEl);
      const res = await createUser(name, email, pw, phone, gender, age, photoDataUrl);
      if (res.success) {
        showToast(`User account created successfully for ${name}! 🌾`, 'success');
        closeModal('add-user-modal');
        renderUsers();
      } else {
        const el = document.getElementById('add-user-email-err');
        if (el) { el.textContent = res.message; el.classList.remove('hidden'); }
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Failed to create user. Try again.', 'error');
    } finally {
      if (txt) txt.classList.remove('hidden');
      if (spin) spin.classList.add('hidden');
    }
  };

  window.openEditProfileModal = function () {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    // Clear error messages
    ['edit-profile-name-err', 'edit-profile-email-err', 'edit-profile-phone-err', 'edit-profile-age-err', 'edit-profile-photo-err', 'edit-profile-curpw-err', 'edit-profile-newpw-err', 'edit-profile-confpw-err'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });

    const users = getAllUsers();
    const currUser = users.find(u => u.id === session.id || u.email.toLowerCase() === session.email.toLowerCase()) || session;

    const nameEl = document.getElementById('edit-profile-name');
    const emailEl = document.getElementById('edit-profile-email');
    const phoneEl = document.getElementById('edit-profile-phone');
    const ageEl = document.getElementById('edit-profile-age');
    const genderEl = document.getElementById('edit-profile-gender');
    const photoEl = document.getElementById('edit-profile-photo');
    const changepwToggle = document.getElementById('edit-profile-changepw-toggle');
    const pwFields = document.getElementById('edit-profile-pw-fields');

    if (nameEl) nameEl.value = currUser.name || '';
    if (emailEl) emailEl.value = currUser.email || '';
    if (phoneEl) phoneEl.value = currUser.phone || '';
    if (ageEl) ageEl.value = currUser.age || '';
    if (genderEl) genderEl.value = currUser.gender || 'Male';
    if (photoEl) photoEl.value = '';
    if (changepwToggle) changepwToggle.checked = false;
    if (pwFields) pwFields.classList.add('hidden');

    // Reset password fields
    ['edit-profile-curpw', 'edit-profile-newpw', 'edit-profile-confpw'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  window.toggleChangePasswordFields = function () {
    const toggle = document.getElementById('edit-profile-changepw-toggle');
    const fields = document.getElementById('edit-profile-pw-fields');
    if (toggle && fields) {
      fields.classList.toggle('hidden', !toggle.checked);
    }
  };

  window.submitEditProfile = async function (e) {
    e.preventDefault();

    // Clear errors
    ['edit-profile-name-err', 'edit-profile-email-err', 'edit-profile-phone-err', 'edit-profile-age-err', 'edit-profile-photo-err', 'edit-profile-curpw-err', 'edit-profile-newpw-err', 'edit-profile-confpw-err'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });

    const nameEl = document.getElementById('edit-profile-name');
    const emailEl = document.getElementById('edit-profile-email');
    const phoneEl = document.getElementById('edit-profile-phone');
    const ageEl = document.getElementById('edit-profile-age');
    const genderEl = document.getElementById('edit-profile-gender');
    const photoEl = document.getElementById('edit-profile-photo');
    const changepwToggle = document.getElementById('edit-profile-changepw-toggle');

    if (!nameEl || !emailEl || !phoneEl || !ageEl) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    const age = ageEl.value.trim();
    const gender = genderEl.value;

    let ok = true;
    if (name.length < 2 || name.length > 80) {
      const el = document.getElementById('edit-profile-name-err');
      if (el) { el.textContent = 'Name must be 2–80 characters.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      const el = document.getElementById('edit-profile-email-err');
      if (el) { el.textContent = 'Enter a valid email address.'; el.classList.remove('hidden'); }
      ok = false;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      const el = document.getElementById('edit-profile-phone-err');
      if (el) { el.textContent = 'Phone must be exactly 10 digits.'; el.classList.remove('hidden'); }
      ok = false;
    }
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      const el = document.getElementById('edit-profile-age-err');
      if (el) { el.textContent = 'Age must be between 18 and 100.'; el.classList.remove('hidden'); }
      ok = false;
    }

    let curpw = '', newpw = '', confpw = '';
    const changingPw = changepwToggle && changepwToggle.checked;
    if (changingPw) {
      const curpwEl = document.getElementById('edit-profile-curpw');
      const newpwEl = document.getElementById('edit-profile-newpw');
      const confpwEl = document.getElementById('edit-profile-confpw');
      if (curpwEl && newpwEl && confpwEl) {
        curpw = curpwEl.value;
        newpw = newpwEl.value;
        confpw = confpwEl.value;
      }
      if (newpw.length < 3 || newpw.length > 128) {
        const el = document.getElementById('edit-profile-newpw-err');
        if (el) { el.textContent = 'New password must be 3–128 characters.'; el.classList.remove('hidden'); }
        ok = false;
      }
      if (newpw !== confpw) {
        const el = document.getElementById('edit-profile-confpw-err');
        if (el) { el.textContent = 'Passwords do not match.'; el.classList.remove('hidden'); }
        ok = false;
      }
      if (!curpw) {
        const el = document.getElementById('edit-profile-curpw-err');
        if (el) { el.textContent = 'Please enter your current password.'; el.classList.remove('hidden'); }
        ok = false;
      }
    }

    if (!ok) return;

    const btn = document.getElementById('edit-profile-btn');
    const txt = document.getElementById('edit-profile-btn-txt');
    const spin = document.getElementById('edit-profile-spin');
    if (txt) txt.classList.add('hidden');
    if (spin) spin.classList.remove('hidden');

    try {
      let photoDataUrl = undefined;
      if (photoEl && photoEl.files && photoEl.files[0]) {
        photoDataUrl = await readPhotoFile(photoEl);
      }

      // Update Profile Details
      const res = await updateUserProfile(session.id, name, email, phone, gender, age, photoDataUrl);
      if (!res.success) {
        const el = document.getElementById('edit-profile-email-err');
        if (el) { el.textContent = res.message; el.classList.remove('hidden'); }
        showToast(res.message, 'error');
        return;
      }

      // Update Password if requested
      if (changingPw) {
        const pwRes = await updateUserPassword(session.id, curpw, newpw);
        if (!pwRes.success) {
          const el = document.getElementById('edit-profile-curpw-err');
          if (el) { el.textContent = pwRes.message; el.classList.remove('hidden'); }
          showToast(pwRes.message, 'error');
          return;
        }
      }

      showToast('Profile updated successfully! 🎉', 'success');
      closeModal('edit-profile-modal');

      // Refresh sidebar user information and page header dynamically
      const updatedSession = getSession();
      if (updatedSession) {
        const usersList = getAllUsers();
        const dbUser = usersList.find(u => u.id === updatedSession.id || u.email.toLowerCase() === updatedSession.email.toLowerCase());
        const fullSession = dbUser ? { ...updatedSession, ...dbUser } : updatedSession;
        updateHeaderAndSidebarUserUI(fullSession);
      }

      // If we are in the users list, rerender it (since we might have edited our own user profile)
      if (currentSection === 'users') {
        renderUsers();
      }

    } catch (err) {
      console.error(err);
      showToast('An error occurred while updating profile.', 'error');
    } finally {
      if (txt) txt.classList.remove('hidden');
      if (spin) spin.classList.add('hidden');
    }
  };

  function updateHeaderAndSidebarUserUI(userSession) {
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    const headerAvatar = document.getElementById('header-avatar');
    const headerName = document.getElementById('header-name');

    if (sidebarName) sidebarName.textContent = userSession.name;
    if (headerName) headerName.textContent = userSession.name;

    const initials = userSession.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    [sidebarAvatar, headerAvatar].forEach(av => {
      if (!av) return;
      if (av.firstChild && av.firstChild.tagName === 'IMG') {
        av.removeChild(av.firstChild);
      }
      if (userSession.photo) {
        av.textContent = '';
        const img = document.createElement('img');
        img.src = userSession.photo;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        av.appendChild(img);
      } else {
        av.textContent = initials;
      }
    });
  }

  // ── Initialization on Page Load ──────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      if (typeof initializeData === 'function') {
        await initializeData();
      }
    } catch (e) {
      console.error("Data initialization failed:", e);
    }

    // Load admin profile in sidebar & header
    const users = getAllUsers();
    const dbUser = users.find(u => u.id === session.id || u.email.toLowerCase() === session.email.toLowerCase());
    const fullSession = dbUser ? { ...session, ...dbUser } : session;
    updateHeaderAndSidebarUserUI(fullSession);

    // Load initial section
    await showSection('dashboard');
  });

})();
