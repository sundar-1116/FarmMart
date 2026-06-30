// ============================================================
// Farmers To Mart — User Dashboard Logic
// Handles session validation, dashboard calculations, browsing
// stores, farmers, crop products, filtering, search, and custom
// 2D HTML5 canvas chart rendering for user activity.
// ============================================================

(function () {
  'use strict';

  // ── Session Check & Authentication ──────────────────────────
  const session = getSession();
  if (!session || session.role !== 'user') {
    // Unauthorized access — redirect to login
    window.location.replace('../auth.html?role=user');
    return;
  }

  // Active section state
  let currentSection = 'dashboard';
  let activeStoreFilter = 'all';
  let activeFarmerFilter = 'all';
  let activeProductFilter = 'all';
  let productSearchQuery = '';
  let activeProcureTaskId = '';

  // ── Seed Produce Catalog ─────────────────────────────────────
  const HARVEST_PRODUCTS = [
    { name: 'Mangoes (Alphonso)', category: 'fruits', price: '₹120/kg', farmer: 'Lakshmi Devi', rating: 4.8, status: 'Available', ico: '🥭', location: 'Guntur, AP' },
    { name: 'Pomegranates (Red)', category: 'fruits', price: '₹150/kg', farmer: 'Savitri Bai', rating: 4.6, status: 'Available', ico: '🍎', location: 'Kurnool, AP' },
    { name: 'Sweet Lime (Mosambi)', category: 'fruits', price: '₹80/kg', farmer: 'Savitri Bai', rating: 4.6, status: 'Available', ico: '🍋', location: 'Kurnool, AP' },
    { name: 'Bananas (Yelakki)', category: 'fruits', price: '₹50/dozen', farmer: 'Lakshmi Devi', rating: 4.8, status: 'Available', ico: '🍌', location: 'Guntur, AP' },
    
    { name: 'Tomatoes (Organic)', category: 'vegetables', price: '₹30/kg', farmer: 'Raju Kumar', rating: 4.9, status: 'Available', ico: '🍅', location: 'Warangal, TS' },
    { name: 'Red Chillies (Guntur)', category: 'vegetables', price: '₹140/kg', farmer: 'Srinivas Reddy', rating: 4.5, status: 'Available', ico: '🌶️', location: 'Khammam, TS' },
    { name: 'Onions', category: 'vegetables', price: '₹28/kg', farmer: 'Raju Kumar', rating: 4.9, status: 'Available', ico: '🧅', location: 'Warangal, TS' },
    { name: 'Cucumbers', category: 'vegetables', price: '₹22/kg', farmer: 'Meena Kumari', rating: 4.6, status: 'Available', ico: '🥒', location: 'Nalgonda, TS' },
    
    { name: 'Red Roses', category: 'flowers', price: '₹180/bundle', farmer: 'Padmavathi', rating: 4.9, status: 'Available', ico: '🌹', location: 'Nellore, AP' },
    { name: 'Jasmine (Mogra)', category: 'flowers', price: '₹220/kg', farmer: 'Padmavathi', rating: 4.9, status: 'Available', ico: '🌸', location: 'Nellore, AP' },
    { name: 'Marigolds (Yellow)', category: 'flowers', price: '₹90/kg', farmer: 'Annapurna Devi', rating: 4.7, status: 'Available', ico: '🌼', location: 'Tirupati, AP' },
    
    { name: 'Basmati Rice', category: 'pulses', price: '₹95/kg', farmer: 'Venkat Rao', rating: 4.7, status: 'Available', ico: '🌾', location: 'Karimnagar, TS' },
    { name: 'Toor Dal (Premium)', category: 'pulses', price: '₹130/kg', farmer: 'Anitha Kumari', rating: 4.4, status: 'Available', ico: '🥣', location: 'Visakhapatnam, AP' },
    { name: 'Moong Dal', category: 'pulses', price: '₹115/kg', farmer: 'Anitha Kumari', rating: 4.4, status: 'Available', ico: '🥣', location: 'Visakhapatnam, AP' }
  ];

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
  window.showSection = function (sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.remove('active'));

    const targetSec = document.getElementById(`section-${sectionId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => item.classList.remove('active'));

    const activeBtn = document.getElementById(`nav-${sectionId}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace('-', ' ');
    }

    currentSection = sectionId;

    if (sectionId === 'dashboard') {
      renderDashboard();
    } else if (sectionId === 'stores') {
      renderStores();
    } else if (sectionId === 'farmers') {
      renderFarmers();
    } else if (sectionId === 'products') {
      renderProducts();
    } else if (sectionId === 'demands') {
      renderDemands();
    } else if (sectionId === 'procure') {
      activeProcureTaskId = '';
      renderProcureSection();
    } else if (sectionId === 'deliveries') {
      renderDeliveriesSection();
    }

    closeSidebar();
  };  // ── Mobile Sidebar Control ───────────────────────────────────
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

  // ── Log out ──────────────────────────────────────────────────
  window.handleLogout = function () {
    clearSession();
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
      window.location.replace('../auth.html?role=user');
    }, 800);
  };

  // ── Render Dashboard (Overview) ──────────────────────────────
  async function renderDashboard() {
    // 1. Calculate stats counts
    const farmers = getAllFarmers().length;
    const stores = getAllStores().length;

    let pendingPayments = 0;
    let pendingDeliveries = 0;
    try {
      const stats = await getTaskStats(session.id);
      pendingPayments = stats.totalPendingPayments;
      pendingDeliveries = stats.totalPendingDeliveries;
    } catch (e) {
      console.error("Failed to load task stats", e);
    }

    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.replaceChildren();

      const cardsData = [
        { label: 'Verified Stores Sourcing', val: stores, ico: '🏪', color: 'green', desc: 'Partner grocery chains', section: 'stores' },
        { label: 'Active Farm Profiles', val: farmers, ico: '👨‍🌾', color: 'gold', desc: 'Direct agricultural suppliers', section: 'farmers' },
        { label: 'Pending Deliveries', val: pendingDeliveries, ico: '🚚', color: 'blue', desc: 'Awaiting fulfillment', section: 'deliveries' },
        { label: 'Pending Payments', val: pendingPayments, ico: '💳', color: 'red', desc: 'Awaiting clearance', section: 'deliveries' }
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

        const desc = document.createElement('div');
        desc.className = 'stat-trend';
        desc.style.color = 'rgba(134,239,172,.35)';
        desc.textContent = card.desc;
        infoDiv.appendChild(desc);

        div.appendChild(infoDiv);
        statsGrid.appendChild(div);
      });
    }

    // 2. Draw user procurement line chart
    // Month-by-month order metric (simulated)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const procurementVolume = [12, 19, 15, 24, 28, 35, 42, 38, 48, 55, 62, 70];
    drawUserActivityLineChart('user-activity-chart', months, procurementVolume);

    // 3. Render support mailbox notifications
    renderUserInbox();
  }

  // ── Support Resolution Mailbox ───────────────────────────────
  function renderUserInbox() {
    const inboxArea = document.getElementById('user-inbox-area');
    if (!inboxArea) return;
    inboxArea.replaceChildren();

    const queries = getAllQueries();
    // Filter queries from this user that have been resolved and have an email response, and are not archived
    const myEmails = queries.filter(q => q.userEmail === session.email && q.status === 'resolved' && q.resolutionEmail && !q.emailArchived);

    if (myEmails.length === 0) {
      inboxArea.style.display = 'none';
      return;
    }

    inboxArea.style.display = 'block';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding: 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px;';
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.2rem;">📬</span>
        <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text);">Support Resolution Mailbox</h3>
      </div>
      <span class="cat-pill vegetables" style="font-size:0.7rem; font-weight:700; padding:2px 8px;">
        ${myEmails.filter(e => !e.emailRead).length} Unread
      </span>
    `;
    card.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;';

    myEmails.forEach(e => {
      const email = e.resolutionEmail;
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 8px; transition: background 0.15s;';
      
      const textWrapper = document.createElement('div');
      textWrapper.style.cssText = 'flex: 1; min-width: 0;';

      const subjectDiv = document.createElement('div');
      subjectDiv.style.cssText = `font-size:0.88rem; font-weight:${e.emailRead ? '500' : '700'}; color:var(--text); display:flex; align-items:center; gap:6px;`;
      
      if (!e.emailRead) {
        const dot = document.createElement('span');
        dot.style.cssText = 'width: 8px; height: 8px; background: var(--primary-light); border-radius: 50%; display: inline-block; box-shadow: 0 0 6px var(--primary-light);';
        subjectDiv.appendChild(dot);
      }

      const subjectSpan = document.createElement('span');
      subjectSpan.textContent = email.subject;
      subjectDiv.appendChild(subjectSpan);
      textWrapper.appendChild(subjectDiv);

      const dateDiv = document.createElement('div');
      dateDiv.style.cssText = 'font-size:0.74rem; color:var(--text-muted); margin-top:2px;';
      dateDiv.textContent = `Sent: ${new Date(email.sentAt).toLocaleString()}`;
      textWrapper.appendChild(dateDiv);

      row.appendChild(textWrapper);

      const actionWrapper = document.createElement('div');
      actionWrapper.style.cssText = 'display:flex; gap:8px;';

      const readBtn = document.createElement('button');
      readBtn.className = 'btn btn-primary btn-sm';
      readBtn.style.padding = '4px 10px';
      readBtn.style.fontSize = '0.76rem';
      readBtn.textContent = 'Read Mail';
      readBtn.onclick = () => window.openUserEmailModal(e.id);
      actionWrapper.appendChild(readBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-outline btn-sm';
      deleteBtn.style.cssText = 'padding: 4px 10px; font-size: 0.76rem; border-color: rgba(239,68,68,0.2); color: var(--danger);';
      deleteBtn.textContent = 'Archive';
      deleteBtn.onclick = () => window.archiveUserEmail(e.id);
      actionWrapper.appendChild(deleteBtn);

      row.appendChild(actionWrapper);
      list.appendChild(row);
    });

    card.appendChild(list);
    inboxArea.appendChild(card);
  }

  window.openUserEmailModal = function (queryId) {
    const queries = getAllQueries();
    const q = queries.find(query => query.id === queryId);
    if (!q || !q.resolutionEmail) return;

    // Mark as read
    q.emailRead = true;
    saveQueries(queries);

    // Populate modal fields
    const titleEl = document.getElementById('read-email-title');
    if (titleEl) titleEl.textContent = `✉️ ${q.resolutionEmail.subject}`;
    document.getElementById('read-email-date').textContent = new Date(q.resolutionEmail.sentAt).toLocaleString();
    document.getElementById('read-email-content').textContent = q.resolutionEmail.body;

    const modal = document.getElementById('read-email-modal');
    if (modal) modal.classList.remove('hidden');

    // Refresh inbox render
    renderUserInbox();
  };

  window.archiveUserEmail = function (queryId) {
    const queries = getAllQueries();
    const q = queries.find(query => query.id === queryId);
    if (q) {
      q.emailArchived = true;
      q.emailRead = true;
      saveQueries(queries);
      showToast('Support message archived.', 'info');
      renderUserInbox();
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  };

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
      empty.textContent = 'No retail stores found in this category.';
      grid.appendChild(empty);
      return;
    }

    stores.forEach(s => {
      const card = document.createElement('div');
      card.className = 'store-card';

      const hdr = document.createElement('div');
      hdr.className = 'store-card-hdr';

      const logo = document.createElement('div');
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
      about.textContent = s.about || 'Verified partner retail chain purchasing agricultural goods.';
      body.appendChild(about);

      const tags = document.createElement('div');
      tags.className = 'store-tags';
      const prodList = s.products || [];
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

      const action = document.createElement('span');
      action.style.cssText = 'font-size:.78rem; font-weight:700; color:var(--primary-light)';
      action.textContent = 'Sourcing Active ✓';
      ftr.appendChild(action);

      card.appendChild(ftr);
      grid.appendChild(card);
    });
  }

  // ── Render Farmers Section ───────────────────────────────────
  function renderFarmers() {
    // Categories filter
    const catGrid = document.getElementById('farmer-cat-grid');
    if (catGrid && !catGrid.children.length) {
      catGrid.replaceChildren();
      const categories = [
        { id: 'all', name: 'All Supplier Farms', ico: '🌾' },
        { id: 'fruits', name: 'Fruit Farms', ico: '🍎' },
        { id: 'vegetables', name: 'Vegetable Farms', ico: '🥦' },
        { id: 'flowers', name: 'Flower Growers', ico: '🌸' },
        { id: 'pulses', name: 'Dal & Pulses', ico: '🌾' }
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
      empty.textContent = 'No supplier farm profiles match this category.';
      grid.appendChild(empty);
      return;
    }

    farmers.forEach(f => {
      const card = document.createElement('div');
      card.className = 'farmer-card';

      const hdr = document.createElement('div');
      hdr.className = 'farmer-card-hdr';

      const av = document.createElement('div');
      av.className = 'avatar avatar-sm avatar-green';
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

      const chatBtn = document.createElement('button');
      chatBtn.className = 'btn btn-outline btn-sm';
      chatBtn.textContent = 'Contact';
      chatBtn.onclick = () => {
        toggleChatbot();
        // prefill chatbot
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = `Tell me about farmer ${f.name} in ${f.location}`;
          chatInput.focus();
        }
      };
      ftr.appendChild(chatBtn);

      card.appendChild(ftr);
      grid.appendChild(card);
    });
  }

  // ── Render Products Section ──────────────────────────────────
  window.filterProducts = function (category, btn) {
    activeProductFilter = category;
    const filterTabs = document.querySelectorAll('#products-filter-row .filter-tab');
    filterTabs.forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProducts();
  };

  window.searchProducts = function (query) {
    productSearchQuery = query.toLowerCase().trim();
    renderProducts();
  };

  function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.replaceChildren();

    let list = HARVEST_PRODUCTS;
    if (activeProductFilter !== 'all') {
      list = list.filter(p => p.category === activeProductFilter);
    }
    if (productSearchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(productSearchQuery) || p.farmer.toLowerCase().includes(productSearchQuery));
    }

    if (!list.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1; padding:60px; text-align:center; color:rgba(134,239,172,.3)';
      empty.textContent = 'No harvest items match your filter/search criteria.';
      grid.appendChild(empty);
      return;
    }

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'farmer-card'; // re-use card layout styling
      card.style.position = 'relative';

      const hdr = document.createElement('div');
      hdr.className = 'farmer-card-hdr';

      const iconBox = document.createElement('div');
      iconBox.className = 'avatar avatar-sm avatar-gold';
      iconBox.style.fontSize = '1.3rem';
      iconBox.textContent = p.ico;
      hdr.appendChild(iconBox);

      const info = document.createElement('div');
      info.className = 'farmer-info';
      
      const titleWrap = document.createElement('div');
      titleWrap.style.cssText = 'display:flex; justify-content:space-between; align-items:center';

      const name = document.createElement('h4');
      name.className = 'farmer-name';
      name.style.fontSize = '1rem';
      name.textContent = p.name;
      titleWrap.appendChild(name);

      const pill = document.createElement('span');
      pill.className = `cat-pill ${p.category}`;
      pill.textContent = p.category;
      titleWrap.appendChild(pill);
      info.appendChild(titleWrap);

      const frm = document.createElement('div');
      frm.className = 'farmer-loc';
      frm.style.marginTop = '2px';
      frm.textContent = `👨‍🌾 Farm: ${p.farmer} (${p.location})`;
      info.appendChild(frm);

      hdr.appendChild(info);
      card.appendChild(hdr);

      // Price Tag Row
      const priceRow = document.createElement('div');
      priceRow.style.cssText = 'margin:10px 0; display:flex; justify-content:space-between; align-items:center';

      const priceVal = document.createElement('div');
      priceVal.style.cssText = 'font-size:1.25rem; font-weight:800; color:var(--text)';
      priceVal.textContent = p.price;
      priceRow.appendChild(priceVal);

      const status = document.createElement('span');
      status.style.cssText = 'font-size:.74rem; font-weight:700; color:#3dba6e; display:flex; align-items:center; gap:4px';
      status.innerHTML = '<span style=\"width:6px;height:6px;background:#3dba6e;border-radius:50%\"></span> Available';
      priceRow.appendChild(status);
      card.appendChild(priceRow);

      // Card footer
      const ftr = document.createElement('div');
      ftr.className = 'farmer-card-ftr';
      ftr.style.marginTop = '0';
      ftr.style.paddingTop = '8px';

      const rating = document.createElement('span');
      rating.style.color = 'var(--gold)';
      rating.textContent = `★ ${p.rating} (Supplier Rating)`;
      ftr.appendChild(rating);

      const orderBtn = document.createElement('button');
      orderBtn.className = 'btn btn-primary btn-sm';
      orderBtn.textContent = 'Procure';
      orderBtn.onclick = () => {
        showToast(`Procurement request for ${p.name} sent to ${p.farmer}!`, 'success');
      };
      ftr.appendChild(orderBtn);

      card.appendChild(ftr);
      grid.appendChild(card);
    });
  }

  // ── Custom Line Chart Drawing ───────────────────────────────
  function drawUserActivityLineChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for high density displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const padding = { left: 45, right: 15, top: 15, bottom: 25 };
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
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillText(val + ' tons', padding.left - 8, y + 3);
    }

    // Plot Points
    ctx.beginPath();
    labels.forEach((lbl, idx) => {
      const x = padding.left + (chartW / (labels.length - 1)) * idx;
      const y = padding.top + chartH - (data[idx] / maxVal) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#22c55e'; // Green
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Fill under gradient
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Plot dots
    labels.forEach((lbl, idx) => {
      const x = padding.left + (chartW / (labels.length - 1)) * idx;
      const y = padding.top + chartH - (data[idx] / maxVal) * chartH;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#15803d';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();

      if (idx % 2 === 0 || labels.length <= 6) {
        ctx.fillStyle = 'rgba(134,239,172,0.4)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x, h - 8);
      }
    });
  }

  // ── Render Demands Section ──────────────────────────────────
  async function renderDemands() {
    const demandsGrid = document.getElementById('demands-grid');
    const consolidatedDiv = document.getElementById('consolidated-demands');
    if (!demandsGrid) return;

    demandsGrid.replaceChildren();
    if (consolidatedDiv) consolidatedDiv.replaceChildren();

    const demands = await getDemands();
    const pendingDemands = demands.filter(d => d.status === 'pending');

    // Render consolidated quantities
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

    // Render demands grid
    if (pendingDemands.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);';
      empty.textContent = 'No pending demands to procure and distribute.';
      demandsGrid.appendChild(empty);
      return;
    }

    pendingDemands.forEach(d => {
      const card = document.createElement('div');
      card.className = 'store-card';
      card.style.padding = '18px';

      const title = document.createElement('h4');
      title.style.cssText = 'color: var(--text); font-size: 1.1rem; margin-bottom: 6px;';
      title.textContent = `${d.itemName} Required`;
      card.appendChild(title);

      const store = document.createElement('div');
      store.style.cssText = 'color: var(--primary-light); font-size: 0.9rem; font-weight: 600; margin-bottom: 12px;';
      store.textContent = `🏪 Store: ${d.storeName}`;
      card.appendChild(store);

      const qty = document.createElement('div');
      qty.style.cssText = 'color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;';
      qty.textContent = `Demand Quantity: ${d.quantity} units`;
      card.appendChild(qty);

      const btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-sm';
      btn.style.width = '100%';
      btn.textContent = 'Procure & Distribute';
      btn.onclick = () => {
        window.routeToProcure(d.id || d._id);
      };
      card.appendChild(btn);

      demandsGrid.appendChild(card);
    });
  }

  // ── Procure & Distribute Routing & Handlers ─────────────────
  window.routeToProcure = function (demandId) {
    showSection('procure');
    renderProcureSection(demandId);
  };

  async function renderProcureSection(preselectedDemandId = '') {
    const demandSelect = document.getElementById('procure-demand-select');
    const farmerSelect = document.getElementById('procure-farmer-select');
    if (!demandSelect || !farmerSelect) return;

    // Reset fields
    document.getElementById('procure-demand-id').value = '';
    document.getElementById('procure-store-name').value = '';
    document.getElementById('procure-item-qty').value = '';
    document.getElementById('procure-purchase-price').value = '';
    document.getElementById('procure-delivery-price').value = '';
    document.getElementById('procure-delivery-charges').value = '';
    document.getElementById('procure-deadline').value = '';

    // Populate demands select
    demandSelect.replaceChildren();
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Choose an active demand --';
    demandSelect.appendChild(defaultOption);

    const demands = await getDemands();
    const pendingDemands = demands.filter(d => d.status === 'pending');
    
    pendingDemands.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id || d._id;
      opt.textContent = `${d.storeName} - ${d.itemName} (${d.quantity} units)`;
      demandSelect.appendChild(opt);
    });

    // Populate farmers select
    farmerSelect.replaceChildren();
    const defaultFarmer = document.createElement('option');
    defaultFarmer.value = '';
    defaultFarmer.textContent = '-- Select a registered farmer --';
    farmerSelect.appendChild(defaultFarmer);

    const farmers = getAllFarmers();
    farmers.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.name} (${f.category.toUpperCase()} - ${f.location})`;
      farmerSelect.appendChild(opt);
    });

    // Set preselected demand if provided
    if (preselectedDemandId) {
      demandSelect.value = preselectedDemandId;
      window.handleDemandSelectChange(preselectedDemandId);
    }
  }

  window.handleDemandSelectChange = async function (demandId) {
    const storeInput = document.getElementById('procure-store-name');
    const itemQtyInput = document.getElementById('procure-item-qty');
    const demandIdHidden = document.getElementById('procure-demand-id');

    if (!demandId) {
      storeInput.value = '';
      itemQtyInput.value = '';
      demandIdHidden.value = '';
      return;
    }

    const demands = await getDemands();
    const demand = demands.find(d => (d.id === demandId || d._id === demandId));
    if (demand) {
      demandIdHidden.value = demand.id || demand._id;
      storeInput.value = demand.storeName;
      itemQtyInput.value = `${demand.itemName} (${demand.quantity} units)`;
    }
  };

  window.routeToProcureFromTask = async function (taskId) {
    activeProcureTaskId = taskId;
    showSection('procure');

    const demandSelect = document.getElementById('procure-demand-select');
    const farmerSelect = document.getElementById('procure-farmer-select');
    if (!demandSelect || !farmerSelect) return;

    // Reset fields
    document.getElementById('procure-demand-id').value = '';
    document.getElementById('procure-store-name').value = '';
    document.getElementById('procure-item-qty').value = '';
    document.getElementById('procure-purchase-price').value = '';
    document.getElementById('procure-delivery-price').value = '';
    document.getElementById('procure-delivery-charges').value = '';
    document.getElementById('procure-deadline').value = '';

    // Populate demands select with a special placeholder for the admin task
    demandSelect.replaceChildren();
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- Admin Assigned Task --';
    demandSelect.appendChild(opt);
    demandSelect.value = '';

    // Populate farmers select
    farmerSelect.replaceChildren();
    const defaultFarmer = document.createElement('option');
    defaultFarmer.value = '';
    defaultFarmer.textContent = '-- Select a registered farmer --';
    farmerSelect.appendChild(defaultFarmer);

    const farmers = getAllFarmers();
    farmers.forEach(f => {
      const optOpt = document.createElement('option');
      optOpt.value = f.id;
      optOpt.textContent = `${f.name} (${f.category.toUpperCase()} - ${f.location})`;
      farmerSelect.appendChild(optOpt);
    });

    // Load task details to prefill
    const tasks = await getTasks(session.id);
    const task = tasks.find(t => (t.id === taskId || t._id === taskId));
    if (task) {
      document.getElementById('procure-store-name').value = task.storeName;
      document.getElementById('procure-item-qty').value = `${task.itemName} (${task.quantity} units)`;
      if (task.deadline) {
        document.getElementById('procure-deadline').value = new Date(task.deadline).toISOString().split('T')[0];
      }
    }
  };

  window.handleProcureSubmit = async function (event) {
    event.preventDefault();

    const demandId = document.getElementById('procure-demand-id').value;
    const farmerId = document.getElementById('procure-farmer-select').value;
    const purchasePrice = parseFloat(document.getElementById('procure-purchase-price').value);
    const deliveryPrice = parseFloat(document.getElementById('procure-delivery-price').value);
    const deliveryCharges = parseFloat(document.getElementById('procure-delivery-charges').value);
    const deadline = document.getElementById('procure-deadline').value;

    if (!farmerId || isNaN(purchasePrice) || isNaN(deliveryPrice) || isNaN(deliveryCharges) || !deadline) {
      showToast('Please fill out all distribution terms.', 'error');
      return;
    }

    const farmers = getAllFarmers();
    const farmerObj = farmers.find(f => f.id == farmerId);
    if (!farmerObj) {
      showToast('Selected farmer not found.', 'error');
      return;
    }

    if (activeProcureTaskId) {
      // Update existing admin-assigned task
      const updateData = {
        farmer: { name: farmerObj.name, category: farmerObj.category },
        purchasePrice,
        deliveryPrice,
        deliveryCharges,
        deadline,
        type: 'procurement'
      };

      const res = await updateTask(activeProcureTaskId, updateData);
      if (res.success) {
        showToast(`Procurement details saved successfully for ${res.data.itemName}!`, 'success');
        activeProcureTaskId = '';
        showSection('deliveries');
      } else {
        showToast(res.message || 'Failed to update procurement task.', 'error');
      }
      return;
    }

    // Resolve store name & item name/quantity from demand selection
    let storeName = '';
    let itemName = '';
    let quantity = 0;

    if (demandId) {
      const demands = await getDemands();
      const demand = demands.find(d => (d.id === demandId || d._id === demandId));
      if (demand) {
        storeName = demand.storeName;
        itemName = demand.itemName;
        quantity = demand.quantity;
      }
    } else {
      showToast('Please select a valid store demand.', 'error');
      return;
    }

    const taskData = {
      assignedUser: session.id,
      type: 'procurement',
      storeName,
      itemName,
      quantity,
      farmer: { name: farmerObj.name, category: farmerObj.category },
      purchasePrice,
      deliveryPrice,
      deliveryCharges,
      deadline,
      demandId
    };

    const res = await createTask(taskData);
    if (res.success) {
      showToast(`Procurement task for ${itemName} created successfully!`, 'success');
      showSection('deliveries');
    } else {
      showToast(res.message || 'Failed to create procurement task.', 'error');
    }
  };

  // ── Deliveries & Payments Handlers ─────────────────────────
  async function renderDeliveriesSection() {
    const tbody = document.getElementById('user-tasks-tbody');
    if (!tbody) return;
    tbody.replaceChildren();

    const tasks = await getTasks(session.id);

    if (tasks.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted);';
      td.textContent = 'No tasks or procurements tracked yet.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

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

      // Farmer
      const tdFarmer = document.createElement('td');
      tdFarmer.style.padding = '12px 16px; color: var(--text-muted);';
      tdFarmer.textContent = t.farmer && t.farmer.name ? t.farmer.name : 'Unassigned';
      tr.appendChild(tdFarmer);

      // Pricing
      const tdPrice = document.createElement('td');
      tdPrice.style.padding = '12px 16px; color: var(--text-muted);';
      const buyPrice = t.purchasePrice || 0;
      const sellPrice = t.deliveryPrice || 0;
      const delCharges = t.deliveryCharges || 0;
      tdPrice.textContent = `₹${buyPrice} / ₹${sellPrice} (+₹${delCharges})`;
      tr.appendChild(tdPrice);

      // Payment Status
      const tdPayment = document.createElement('td');
      tdPayment.style.padding = '12px 16px;';
      const payPill = document.createElement('span');
      payPill.style.cssText = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;';
      if (t.paymentStatus === 'paid') {
        payPill.style.background = 'rgba(59, 186, 110, 0.1)';
        payPill.style.color = '#3dba6e';
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
      delPill.style.cssText = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;';
      if (t.deliveryStatus === 'delivered') {
        delPill.style.background = 'rgba(59, 186, 110, 0.1)';
        delPill.style.color = '#3dba6e';
        delPill.textContent = 'DELIVERED';
      } else {
        delPill.style.background = 'rgba(245, 158, 11, 0.1)';
        delPill.style.color = '#f59e0b';
        delPill.textContent = 'PENDING';
      }
      tdDelivery.appendChild(delPill);
      tr.appendChild(tdDelivery);

      // Deadline
      const tdDeadline = document.createElement('td');
      tdDeadline.style.padding = '12px 16px; color: var(--text-muted);';
      const dl = new Date(t.deadline);
      tdDeadline.textContent = isNaN(dl.getTime()) ? 'N/A' : dl.toLocaleDateString();
      tr.appendChild(tdDeadline);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.style.cssText = 'padding: 12px 16px; text-align: right;';
      
      const tId = t.id || t._id;

      if (!t.farmer || !t.farmer.name) {
        const fillBtn = document.createElement('button');
        fillBtn.className = 'btn btn-sm btn-primary';
        fillBtn.textContent = 'Procure';
        fillBtn.onclick = () => window.routeToProcureFromTask(tId);
        tdActions.appendChild(fillBtn);
      } else {
        if (t.paymentStatus === 'pending') {
          const payBtn = document.createElement('button');
          payBtn.className = 'btn btn-sm btn-outline';
          payBtn.style.marginRight = '6px';
          payBtn.textContent = 'Clear Payment';
          payBtn.onclick = () => window.payTask(tId);
          tdActions.appendChild(payBtn);
        }

        if (t.deliveryStatus === 'pending') {
          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-sm btn-primary';
          delBtn.textContent = 'Deliver Item';
          delBtn.onclick = () => window.deliverTask(tId);
          tdActions.appendChild(delBtn);
        }

        if (t.paymentStatus === 'paid' && t.deliveryStatus === 'delivered') {
          const compSpan = document.createElement('span');
          compSpan.style.cssText = 'color: var(--text-muted); font-size: 0.8rem; font-weight:600;';
          compSpan.textContent = '✓ Completed';
          tdActions.appendChild(compSpan);
        }
      }

      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  window.payTask = async function (taskId) {
    const res = await updateTaskPayment(taskId);
    if (res.success) {
      showToast('Payment successfully cleared!', 'success');
      renderDeliveriesSection();
    } else {
      showToast(res.message || 'Failed to update payment status.', 'error');
    }
  };

  window.deliverTask = async function (taskId) {
    const res = await updateTaskDelivery(taskId);
    if (res.success) {
      showToast('Item marked as delivered!', 'success');
      renderDeliveriesSection();
    } else {
      showToast(res.message || 'Delivery validation failed.', 'error');
    }
  };

  // ── Send Report Handler ────────────────────────────────────
  window.handleSendReport = async function () {
    const reportType = document.getElementById('report-type').value;
    const userTasks = await getTasks(session.id);

    if (userTasks.length === 0) {
      showToast('No task data available to include in the report.', 'error');
      return;
    }

    const reportObj = {
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        phone: session.phone || '9876543211',
        avatar: session.avatar,
        gender: session.gender || 'Male',
        age: session.age || 28,
        photo: session.photo || ''
      },
      cycle: reportType,
      tasks: userTasks,
      timestamp: new Date().toISOString()
    };

    submitReport(reportObj);
    showToast(`Weekly/Monthly report successfully mailed to the Admin from ${session.email}!`, 'success');
  };

  // ── Edit Profile Modal Handlers ──────────────────────────────
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
        
        // Refresh welcome message
        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${fullSession.name.split(' ')[0]}! 🌾`;
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

    // Load user profile in sidebar & header
    const users = getAllUsers();
    const dbUser = users.find(u => u.id === session.id || u.email.toLowerCase() === session.email.toLowerCase());
    const fullSession = dbUser ? { ...session, ...dbUser } : session;
    updateHeaderAndSidebarUserUI(fullSession);

    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${fullSession.name.split(' ')[0]}! 🌾`;

    // Load initial section
    showSection('dashboard');
  });

})();
