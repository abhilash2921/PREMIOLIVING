/* js/app.js - Premio Living OS App Bootstrapper & Router */

window.AppRouter = {
  navigate(pageId, projectId = null) {
    window.AppStore.activePage = pageId;
    try {
      localStorage.setItem("premio_active_page", pageId);
    } catch(e){}
    
    if (projectId) {
      window.AppStore.activeProjectId = projectId;
      try {
        localStorage.setItem("premio_active_project_id", projectId);
      } catch(e){}
    } else {
      if (["today", "dashboard", "pos", "rfqs", "procurement", "vendors", "intelligence", "payouts"].includes(pageId)) {
        window.AppStore.activeProjectId = null;
        try {
          localStorage.removeItem("premio_active_project_id");
        } catch(e){}
      }
    }
    
    // Smooth scroll page back to top on navigation
    const mainContent = document.getElementById("main-content-container");
    if (mainContent) mainContent.scrollTop = 0;
    
    this.refresh();
  },

  refresh() {
    this.renderNavigation();
    this.renderCurrentPage();
    window.Utils.setupAllDateMasks();
  },

  renderNavigation() {
    window.NavbarComponent.renderSidebar();
    window.NavbarComponent.renderMobileNavbar();
    if (window.lucide) lucide.createIcons();
  },

  renderCurrentPage() {
    const container = document.getElementById("main-content-container");
    if (!container) return;
    
    const store = window.AppStore;
    const page = store.activePage;
    
    // Clear search dropdown if navigated
    const dropdown = document.getElementById("search-dropdown");
    if (dropdown) dropdown.classList.add("hidden");
    
    // Route matching with security access blocks
    const role = store.activeRole;
    if (page === "today") {
      window.TodayPage.render(container);
    } else if (page === "dashboard") {
      window.DashboardPage.render(container);
    } else if (page === "payouts") {
      window.PayoutsPage.render(container);
    } else if (page === "intelligence") {
      window.IntelligencePage.render(container);
    } else if (page === "vendors") {
      if (!['admin', 'architect', 'designer'].includes(role)) {
        container.innerHTML = `<div class="p-10 text-center text-xs text-muted border border-border-color rounded-lg bg-secondary/50 max-w-md mx-auto mt-20">Access restricted to Admin, Architect, and Designer roles.</div>`;
      } else {
        window.VendorsPage.render(container);
      }
    } else if (page === "pos") {
      if (role !== 'admin') {
        container.innerHTML = `<div class="p-10 text-center text-xs text-muted border border-border-color rounded-lg bg-secondary/50 max-w-md mx-auto mt-20">Access restricted to Admin only.</div>`;
      } else {
        window.POPage.render(container);
      }
    } else if (page === "rfqs") {
      if (role !== 'admin') {
        container.innerHTML = `<div class="p-10 text-center text-xs text-muted border border-border-color rounded-lg bg-secondary/50 max-w-md mx-auto mt-20">Access restricted to Admin only.</div>`;
      } else {
        window.RFQPage.render(container);
      }
    } else if (page === "procurement") {
      if (role !== 'admin') {
        container.innerHTML = `<div class="p-10 text-center text-xs text-muted border border-border-color rounded-lg bg-secondary/50 max-w-md mx-auto mt-20">Access restricted to Admin only.</div>`;
      } else {
        window.ProcurementPage.render(container);
      }
    } else if (page === "deliveries") {
      if (!['admin', 'architect', 'designer'].includes(role)) {
        container.innerHTML = `<div class="p-10 text-center text-xs text-muted border border-border-color rounded-lg bg-secondary/50 max-w-md mx-auto mt-20">Access restricted to Admin, Architect, and Designer roles.</div>`;
      } else {
        window.DeliveryPage.render(container);
      }
    } else if (page === "project-details") {
      window.ProjectPage.render(container, store.activeProjectId);
    } else if (page === "admin-users") {
      this.renderAdminUsersPage(container);
    } else {
      // Default fallback
      window.TodayPage.render(container);
    }
    
    // Update Header titles
    this.updateHeaderTitles();
  },

  updateHeaderTitles() {
    const store = window.AppStore;
    const page = store.activePage;
    const activeProj = store.state.projects.find(p => p.id === store.activeProjectId);
    
    let title = "Premio Living OS";
    let subtitle = "Workspace Command";
    
    if (page === "today") {
      title = "Today";
      subtitle = "Command Center & Actions";
    } else if (page === "dashboard") {
      title = "Dashboard";
      subtitle = "All Workspace Units";
    } else if (page === "payouts") {
      title = "Payout Center";
      subtitle = "Centralized Payment Request approvals & Contractor summaries";
    } else if (page === "intelligence") {
      title = "Smart Project Intelligence";
      subtitle = "Centralized 360° Sourcing, Timelines, & Relationship Engine";
    } else if (page === "vendors") {
      title = "Vendors";
      subtitle = "Verified Contractor Network";
    } else if (page === "pos") {
      title = "Purchase Orders";
      subtitle = "Purchase Order Management & Tracking";
    } else if (page === "rfqs") {
      title = "Request for Quotation";
      subtitle = "Source Material Quotes & Compare Vendors";
    } else if (page === "procurement") {
      title = "Procurement OS";
      subtitle = "Project Sourcing, Comparisons, Orders & Payments";
    } else if (page === "deliveries") {
      title = "Delivery Tracking";
      subtitle = "Centralized cross-project supply logs & arrival offset statistics";
    } else if (page === "admin-users") {
      title = "Team Directory";
      subtitle = "Workspace Users & Project Assignments";
    } else if (page === "project-details" && activeProj) {
      title = activeProj.name.split(" (")[0];
      subtitle = `Project Stage: ${activeProj.stage}`;
    }
    
    // Update desktop titles
    const deskTitle = document.getElementById("desk-page-title");
    const deskSubtitle = document.getElementById("desk-page-subtitle");
    if (deskTitle) deskTitle.textContent = title;
    if (deskSubtitle) deskSubtitle.textContent = subtitle;
    
    // Update mobile titles
    const mobTitle = document.getElementById("page-title");
    const mobSubtitle = document.getElementById("page-subtitle");
    if (mobTitle) mobTitle.textContent = title;
    if (mobSubtitle) mobSubtitle.textContent = subtitle;
  },

  renderAdminUsersPage(container) {
    const store = window.AppStore;
    if (store.activeRole !== 'admin') {
      container.innerHTML = `<div class="p-10 text-center text-xs text-muted">Access restricted to Admin only.</div>`;
      return;
    }
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex items-center justify-between border-b border-border-color pb-5">
          <div>
            <h1 class="text-base font-bold text-white font-display flex items-center gap-2">
              <i data-lucide="users-2" class="w-5 h-5 text-amber-500"></i>
              Workspace Team Directory
            </h1>
            <p class="text-xs text-secondary mt-0.5">All registered users — assign to projects, manage roles, full visibility</p>
          </div>
          <span id="admin-users-count" class="text-[10px] text-muted font-mono bg-hover px-2 py-1 rounded border border-border-color">Loading...</span>
        </div>
        <div class="card overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border-color text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                <th class="px-4 py-3 bg-primary/50">User</th>
                <th class="px-4 py-3 bg-primary/50">Role</th>
                <th class="px-4 py-3 bg-primary/50">Assigned Projects</th>
                <th class="px-4 py-3 bg-primary/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-users-table-body">
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-xs text-muted">
                  <i data-lucide="loader-2" class="w-5 h-5 animate-spin inline mr-2 text-amber-500"></i>
                  Loading workspace users from database...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    this.loadAdminUsersData();
  },

  async loadAdminUsersData() {
    const db = window.dbService;
    const store = window.AppStore;
    const tableBody = document.getElementById('admin-users-table-body');
    const countSpan = document.getElementById('admin-users-count');
    if (!tableBody) return;

    let users = [];
    if (db.isCloudActive()) {
      try {
        const { data, error } = await db.client.from('profiles').select('id, name, role, email').order('name');
        if (!error && data) users = data;
      } catch (err) { console.error('Error fetching users', err); }
    }

    if (countSpan) countSpan.textContent = `${users.length} Users Registered`;
    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-xs text-muted">No registered users found. Users must sign up via the login page first.</td></tr>`;
      return;
    }

    const roleLabels = { admin: 'Admin', architect: 'Architect', designer: 'Designer', site_engineer: 'Site Engineer' };
    const roleColors = {
      admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      architect: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      designer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      site_engineer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    const projectsList = store.state.projects || [];

    tableBody.innerHTML = users.map(u => {
      const assignments = projectsList.filter(p =>
        (p.teamMembers || []).some(m => m.email?.toLowerCase() === u.email?.toLowerCase())
      );
      const assignmentsHTML = assignments.length > 0
        ? assignments.map(p => `<span class="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium text-[9px] mr-1 mb-1">${p.name.split(' (')[0]}</span>`).join('')
        : `<span class="text-muted italic text-[10px]">Unassigned</span>`;

      const transferHTML = `
        <select onchange="window.AppRouter.adminAssignUser('${u.id}','${(u.name||'').replace(/'/g,"\\'") }','${(u.email||'').replace(/'/g,"\\'")}','${u.role}',this.value)"
          class="text-[10px] p-1 bg-hover border border-border-color/60 rounded text-white focus:outline-none w-36 mr-1">
          <option value="">Assign to project...</option>
          ${projectsList.map(p => `<option value="${p.id}">${p.name.split(' (')[0]}</option>`).join('')}
        </select>
      `;
      const deleteBtn = u.role === 'admin' ? '' : `
        <button onclick="window.AppRouter.adminDeleteUser('${u.id}','${(u.name||'').replace(/'/g,"\\'")}')"
          class="p-1.5 bg-hover hover:bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded" title="Remove user">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;

      return `
        <tr class="border-b border-border-color/20 hover:bg-hover/30 transition-colors text-xs">
          <td class="px-4 py-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm flex-shrink-0">
                ${(u.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <span class="font-semibold text-white block">${u.name}</span>
                <span class="text-[9px] text-muted font-mono block">${u.email || 'no email'}</span>
              </div>
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${roleColors[u.role] || 'bg-zinc-800 text-muted border-zinc-700'}">
              ${roleLabels[u.role] || u.role}
            </span>
          </td>
          <td class="px-4 py-3">${assignmentsHTML}</td>
          <td class="px-4 py-3">
            <div class="flex items-center justify-end gap-1">${transferHTML}${deleteBtn}</div>
          </td>
        </tr>
      `;
    }).join('');
    if (window.lucide) lucide.createIcons();
  },

  async adminAssignUser(userId, name, email, role, projectId) {
    if (!projectId) return;
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    if (!confirm(`Assign ${name} to project "${proj.name.split(' (')[0]}"?`)) {
      this.loadAdminUsersData(); return;
    }
    if (!proj.teamMembers) proj.teamMembers = [];
    const exists = proj.teamMembers.some(m => m.email?.toLowerCase() === email?.toLowerCase());
    if (!exists) proj.teamMembers.push({ name, email, role });
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${name} assigned to ${proj.name.split(' (')[0]}!`);
    this.loadAdminUsersData();
  },

  async adminDeleteUser(userId, name) {
    if (!confirm(`Remove "${name}" from the workspace? They will not be able to log in.`)) return;
    const db = window.dbService;
    if (db.isCloudActive()) {
      try {
        await db.client.from('profiles').delete().eq('id', userId);
      } catch (err) { console.error('Error deleting user', err); }
    }
    window.ModalComponent.showToast(`User "${name}" removed.`);
    this.loadAdminUsersData();
  }
};

// --- LIGHT/DARK THEME INITIALIZATION ---
window.toggleTheme = () => {
  const body = document.body;
  const iconDesk = document.getElementById("theme-toggle-icon");
  const iconMob = document.getElementById("theme-toggle-icon-mob");
  
  const isDark = body.classList.contains("dark-mode");
  
  if (isDark) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    localStorage.setItem("premio_theme", "light");
    if (iconDesk) iconDesk.setAttribute("data-lucide", "sun");
    if (iconMob) iconMob.setAttribute("data-lucide", "sun");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    localStorage.setItem("premio_theme", "dark");
    if (iconDesk) iconDesk.setAttribute("data-lucide", "moon");
    if (iconMob) iconMob.setAttribute("data-lucide", "moon");
  }
  
  if (window.lucide) lucide.createIcons();
};

const initTheme = () => {
  const saved = localStorage.getItem("premio_theme") || "dark";
  const body = document.body;
  
  if (saved === "light") {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    const iconDesk = document.getElementById("theme-toggle-icon");
    const iconMob = document.getElementById("theme-toggle-icon-mob");
    if (iconDesk) iconDesk.setAttribute("data-lucide", "sun");
    if (iconMob) iconMob.setAttribute("data-lucide", "sun");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
  }
  if (window.lucide) lucide.createIcons();
};

// --- MOBILE SIDEBAR DRAWER TOGGLE ---
window.toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar) return;
  
  const isHidden = sidebar.classList.contains("-translate-x-full");
  if (isHidden) {
    sidebar.classList.remove("-translate-x-full");
    if (backdrop) backdrop.classList.remove("hidden");
  } else {
    sidebar.classList.add("-translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
  }
};

// Close sidebar on navigate (mobile-friendly)
const originalNavigate = window.AppRouter.navigate.bind(window.AppRouter);
window.AppRouter.navigate = (pageId, projectId = null) => {
  originalNavigate(pageId, projectId);
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar && window.innerWidth < 768) {
    sidebar.classList.add("-translate-x-full");
  }
  if (backdrop) {
    backdrop.classList.add("hidden");
  }
};

// --- SEARCH ENGINE TRIGGER ---
window.handleGlobalSearch = (query) => {
  const dropdown = document.getElementById("search-dropdown");
  if (!dropdown) return;
  
  if (!query || query.trim().length < 2) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
    return;
  }
  
  const q = query.toLowerCase().trim();
  const store = window.AppStore;
  
  let matches = [];
  
  store.state.projects.forEach(p => {
    // 1. Search in drawings
    const drawings = p.vault.drawings || [];
    drawings.forEach(d => {
      if (d.name.toLowerCase().includes(q)) {
        matches.push({
          type: "Drawing Layout",
          icon: "drafting-compass",
          name: d.name,
          projName: p.name.split(" (")[0],
          action: () => {
            window.AppRouter.navigate("project-details", p.id);
            setTimeout(() => window.ProjectPage.setTab("design"), 100);
          }
        });
      }
    });
    
    // 2. Search in materials
    p.materials.forEach(m => {
      if (m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.finishCode.toLowerCase().includes(q)) {
        matches.push({
          type: "Material Spec",
          icon: "trello",
          name: `${m.name} (${m.brand} - ${m.finishCode})`,
          projName: p.name.split(" (")[0],
          action: () => {
            window.AppRouter.navigate("project-details", p.id);
            setTimeout(() => window.ProjectPage.setTab("materials"), 100);
          }
        });
      }
    });
    
    // 3. Search in snags
    p.snags.forEach(s => {
      if (s.issue.toLowerCase().includes(q) || s.area.toLowerCase().includes(q)) {
        matches.push({
          type: "Defect Card",
          icon: "alert-circle",
          name: `${s.area} — ${s.issue}`,
          projName: p.name.split(" (")[0],
          action: () => {
            window.AppRouter.navigate("project-details", p.id);
            setTimeout(() => window.ProjectPage.setTab("snags"), 100);
          }
        });
      }
    });
  });
  
  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-center text-xs text-muted">No results found for "${query}"</div>`;
  } else {
    dropdown.innerHTML = matches.map((m, idx) => `
      <div onclick="window.handleSearchClick(${idx})" class="p-2 text-xs hover:bg-hover rounded cursor-pointer flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <i data-lucide="${m.icon}" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"></i>
          <div class="truncate">
            <span class="font-bold text-white block">${m.name}</span>
            <span class="text-[9px] text-muted block font-mono">${m.projName} • ${m.type}</span>
          </div>
        </div>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-muted"></i>
      </div>
    `).join("");
    
    // Bind click actions
    window.searchMatches = matches;
  }
  
  dropdown.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
};

window.handleSearchClick = (idx) => {
  const match = window.searchMatches && window.searchMatches[idx];
  if (match) {
    match.action();
    document.getElementById("global-search").value = "";
    document.getElementById("search-dropdown").classList.add("hidden");
  }
};

// Close search dropdown on click outside
document.addEventListener("click", (e) => {
  const searchInput = document.getElementById("global-search");
  const dropdown = document.getElementById("search-dropdown");
  if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
    dropdown.classList.add("hidden");
  }
});

// --- INTERACTIVE COPILOT DRAWER & AI SIMULATIONS ---
window.toggleAIDrawer = () => {
  const drawer = document.getElementById("ai-drawer");
  if (!drawer) return;
  if (drawer.classList.contains("translate-x-full")) {
    drawer.classList.remove("translate-x-full");
  } else {
    drawer.classList.add("translate-x-full");
  }
};

window.appendAIChatMessage = (sender, text) => {
  const msgContainer = document.getElementById("ai-messages");
  if (!msgContainer) return;
  
  const msg = document.createElement("div");
  if (sender === "user") {
    msg.className = "bg-primary border border-border-color p-3 rounded leading-relaxed text-white text-right ml-8 my-2";
    msg.innerHTML = `<span class="text-[9px] text-muted block text-right font-semibold">Abhilash Reddy</span><p class="mt-1">${text}</p>`;
  } else {
    msg.className = "bg-primary border border-border-color p-3 rounded leading-relaxed text-secondary mr-8 my-2";
    msg.innerHTML = `<span class="text-[9px] text-amber-500 block font-semibold">ArchAI Copilot</span><p class="mt-1">${text}</p>`;
  }
  msgContainer.appendChild(msg);
  msgContainer.scrollTop = msgContainer.scrollHeight;
};

window.submitAIChat = () => {
  const input = document.getElementById("ai-input");
  if (!input || !input.value.trim()) return;
  
  const text = input.value.trim();
  input.value = "";
  
  window.appendAIChatMessage("user", text);
  
  setTimeout(() => {
    let reply = "I've logged your query. As your site assistant, I recommend checking the carpentry alignment or contacting vendor 'Wood Crafts'.";
    const q = text.toLowerCase();
    if (q.includes("snag") || q.includes("defect") || q.includes("issue")) {
      reply = "Currently there are open snags in the Kitchen and Master Bedroom. Let me know if you would like me to draft a WhatsApp escalation message.";
    } else if (q.includes("delay") || q.includes("timeline") || q.includes("delivery")) {
      reply = "Checking project stages: Carpentry framing is at 65% for Nishada and Dyna Italian Marble flooring installation is pending delivery at Botanika. Delay risk is low for Nishada, medium for Botanika.";
    } else if (q.includes("budget") || q.includes("cost") || q.includes("money")) {
      reply = "Your total portfolio budget under management is ₹1.37 Cr. Collected milestone payments stand at ₹54.4 Lakhs.";
    }
    window.appendAIChatMessage("assistant", reply);
  }, 600);
};

window.triggerAICopilotAction = (action) => {
  if (action === "daily-report") {
    window.appendAIChatMessage("user", "Generate Client Daily Report summary");
    setTimeout(() => {
      const proj = window.AppStore.state.projects[0];
      const latest = proj.updates[0];
      const text = `Here is the drafted client summary report for *${proj.name}*:<br><br><b>Progress:</b> ${proj.progress}%<br><b>Today's Work:</b> ${latest.completed}<br><b>Tomorrow's Plan:</b> ${latest.tomorrowPlan}<br><br>You can dispatch updates via the WhatsApp share buttons.`;
      window.appendAIChatMessage("assistant", text);
    }, 500);
  } else if (action === "delay-predict") {
    window.appendAIChatMessage("user", "Predict delivery delay risks");
    setTimeout(() => {
      window.appendAIChatMessage("assistant", "Analyzing active supply orders...<br><br>⚠️ <b>Warning:</b> Caesarstone Quartz Countertop delivery (Botanika Villa) has a high delay risk due to the vendor 'Stone & Marble Galleria' history. Recommended action: coordinate alternative quartz slabs or contact vendor via phone link.");
    }, 500);
  }
};

window.handleVoiceTaskParse = async () => {
  const trans = document.getElementById("voice-transcription").value;
  if (!trans) return;
  
  const store = window.AppStore;
  const projId = store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
  const proj = store.state.projects.find(p => p.id === projId);
  if (!proj) return;
  
  let area = "Site Area";
  let priority = "Medium";
  let assignedTo = "Wood Crafts";
  let deadline = new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0];
  
  const t = trans.toLowerCase();
  if (t.includes("kitchen")) area = "Kitchen";
  else if (t.includes("lobby")) area = "Lobby";
  else if (t.includes("corridor")) area = "Corridor";
  
  if (t.includes("high")) priority = "High";
  else if (t.includes("low")) priority = "Low";
  
  if (t.includes("philips")) assignedTo = "Philips Light Studio";
  
  const newSnag = {
    id: `snag-${Date.now()}`,
    area,
    issue: trans,
    priority,
    assignedTo,
    status: "Open",
    deadline
  };
  
  proj.snags.unshift(newSnag);
  await window.dbService.saveProject(proj);
  
  window.closeModal("voice-task-modal");
  window.ModalComponent.showToast("Voice Note parsed successfully into a Snag Card!");
  window.AppRouter.refresh();
  
  window.ModalComponent.promptWhatsAppShare("snag", proj.id, newSnag.id);
};

window.selectAIPhotoSample = (type) => {
  const preview = document.getElementById("ai-photo-preview");
  const scanBtn = document.getElementById("ai-scan-btn");
  if (!preview) return;
  
  let url = "";
  let desc = "";
  if (type === "kitchen") {
    url = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400";
    desc = "Kitchen Shutter cabinet alignment rubbing detected (offset: 6mm). Recommended action: adjust clip-on hinge alignment.";
  } else if (type === "paint") {
    url = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400";
    desc = "Minor hair-line paint cracking observed on gypsum board false ceiling joint section. Recommended action: apply joint tape putty before second coat.";
  } else if (type === "tile") {
    url = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400";
    desc = "Tile spacing inconsistency detected on master bath shower floor screed section (spacing: 5mm vs standard 3mm).";
  }
  
  preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
  preview.dataset.desc = desc;
  preview.dataset.url = url;
  preview.dataset.type = type;
  
  if (scanBtn) {
    scanBtn.removeAttribute("disabled");
  }
};

window.runAISitePhotoScan = async () => {
  const preview = document.getElementById("ai-photo-preview");
  const resultsDiv = document.getElementById("ai-detection-results");
  
  if (!preview || !preview.dataset.desc) return;
  
  const scanOverlay = document.createElement("div");
  scanOverlay.className = "absolute inset-0 bg-amber-500/10 flex items-center justify-center";
  scanOverlay.innerHTML = `<div class="w-full h-0.5 bg-amber-500 animate-bounce"></div>`;
  preview.appendChild(scanOverlay);
  
  setTimeout(() => {
    scanOverlay.remove();
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <span class="text-[10px] text-amber-500 font-semibold block uppercase">AI Detections (98% Confidence):</span>
        <p class="text-secondary leading-relaxed">${preview.dataset.desc}</p>
        <button onclick="window.createSnagFromAIDetection()" class="mt-2 w-full py-1.5 bg-amber-500 text-black text-[10px] font-bold rounded">Log AI Snag Card</button>
      `;
      resultsDiv.classList.remove("hidden");
    }
  }, 800);
};

window.createSnagFromAIDetection = async () => {
  const preview = document.getElementById("ai-photo-preview");
  if (!preview || !preview.dataset.desc) return;
  
  const store = window.AppStore;
  const projId = store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
  const proj = store.state.projects.find(p => p.id === projId);
  if (!proj) return;
  
  let area = "Site Area";
  if (preview.dataset.type === "kitchen") area = "Kitchen";
  else if (preview.dataset.type === "paint") area = "False Ceiling";
  else if (preview.dataset.type === "tile") area = "Bathroom Tiling";
  
  const newSnag = {
    id: `snag-${Date.now()}`,
    area,
    issue: preview.dataset.desc,
    priority: "Medium",
    assignedTo: "Wood Crafts",
    status: "Open",
    deadline: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]
  };
  
  proj.snags.unshift(newSnag);
  await window.dbService.saveProject(proj);
  
  window.closeModal("ai-photo-defect-modal");
  window.ModalComponent.showToast("Snag card logged from AI Computer Vision inspection!");
  window.AppRouter.refresh();
};


// --- MOBILE FLOATING ACTION MENU ---
window.toggleFABMenu = () => {
  const menu = document.getElementById("mobile-fab-menu");
  const icon = document.getElementById("fab-icon");
  if (!menu) return;
  
  if (menu.classList.contains("hidden")) {
    menu.classList.remove("hidden");
    if (icon) icon.setAttribute("data-lucide", "x");
  } else {
    menu.classList.add("hidden");
    if (icon) icon.setAttribute("data-lucide", "plus");
  }
  if (window.lucide) lucide.createIcons();
};

window.triggerFABAction = (action) => {
  // Close FAB Menu
  window.toggleFABMenu();
  
  if (action === "add-snag") {
    window.openModal("add-snag-modal");
  } else if (action === "add-update") {
    window.openModal("add-update-modal");
  } else if (action === "add-material") {
    window.openModal("add-material-modal");
  } else if (action === "add-boq") {
    window.openModal("add-boq-modal");
  } else if (action === "add-invoice") {
    window.openModal("add-invoice-modal");
  }
};

// Close FAB menu on outside click
document.addEventListener("click", (e) => {
  const fab = document.getElementById("mobile-fab");
  const menu = document.getElementById("mobile-fab-menu");
  if (menu && !menu.contains(e.target) && fab && !fab.contains(e.target)) {
    menu.classList.add("hidden");
    const icon = document.getElementById("fab-icon");
    if (icon) icon.setAttribute("data-lucide", "plus");
    if (window.lucide) lucide.createIcons();
  }
});

// --- OPERATIONAL MODE SWITCHER CALLBACK ---
window.setMode = (mode) => {
  window.AppStore.setMode(mode);
  if (mode === "site") {
    window.AppRouter.navigate("today");
  } else if (mode === "management") {
    window.AppRouter.navigate("dashboard");
  }
};

// --- APP BOOTSTRAP INITIALIZATION ---
window.addEventListener("DOMContentLoaded", async () => {
  window.AppStore.loadState();
  window.dbService.init();
  await window.FileCache.init();
  window.AuthService.init();
  window.ModalComponent.init();
  window.QuickActionCenter.init();

  initTheme();
  window.Utils.setupAllDateMasks();

  // Restore previous active page and project on reload, defaulting to "today"
  let startPage = "today";
  let startProj = null;
  try {
    startPage = localStorage.getItem("premio_active_page") || "today";
    startProj = localStorage.getItem("premio_active_project_id") || null;
  } catch(e){}

  window.AppRouter.navigate(startPage, startProj);
  console.log("Premio Living OS bootstrapped instantly, restored page:", startPage);

  // Run cloud synchronization in the background asynchronously
  (async () => {
    try {
      const profile = await window.AuthService.checkSession();

      if (profile) {
        // Authenticated — sync role to store (overrides demo role switcher)
        window.AppStore.activeRole = profile.role;

        // Fetch all database records concurrently in the background instead of blocking sequentially
        const [cloudProjects, cloudVendors, cloudRFQs, cloudPOs, cloudPayouts] = await Promise.all([
          window.dbService.fetchProjects(),
          window.dbService.fetchVendors(),
          window.dbService.fetchRFQs(),
          window.dbService.fetchPOs(),
          window.dbService.fetchPayouts()
        ]);

        const stateBefore = JSON.stringify(window.AppStore.state);

        if (cloudProjects && cloudProjects.length > 0) {
          window.AppStore.state.projects = cloudProjects;
        }
        if (cloudVendors && cloudVendors.length > 0) {
          window.AppStore.state.vendors = cloudVendors;
        }
        if (cloudRFQs) {
          window.AppStore.state.rfqs = cloudRFQs;
        }
        if (cloudPOs) {
          window.AppStore.state.purchaseOrders = cloudPOs;
        }
        if (cloudPayouts) {
          window.AppStore.state.payouts = cloudPayouts;
        }

        // Apply fallback guards and deduplicate
        window.AppStore.sanitizeState();
        window.AppStore.deduplicateAll();

        const stateAfter = JSON.stringify(window.AppStore.state);
        if (stateBefore !== stateAfter) {
          window.AppStore.saveState();
          window.AppRouter.refresh();
          console.log("Premio Living OS data synced, saved, and refreshed from Supabase.");
        }
      }
    } catch (err) {
      console.warn("Supabase background synchronization skipped or offline:", err);
    }
  })();
});
