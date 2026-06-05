/* js/pages/intelligence.js - Premio Living OS Smart Project Intelligence */

window.IntelligencePage = {
  activeQuery: '',
  activeResult: null, // { type: 'project'|'vendor'|'contractor'|'material'|'document', data: any }
  recentSearches: [],

  initRecentSearches() {
    this.recentSearches = JSON.parse(localStorage.getItem("premio_recent_searches") || "[]");
  },

  saveRecentSearch(item) {
    // item: { label: string, query: string, type: string, id: string }
    this.recentSearches = this.recentSearches.filter(s => s.id !== item.id || s.type !== item.type);
    this.recentSearches.unshift(item);
    if (this.recentSearches.length > 5) this.recentSearches.pop();
    localStorage.setItem("premio_recent_searches", JSON.stringify(this.recentSearches));
  },

  render(container) {
    this.initRecentSearches();
    const store = window.AppStore;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Banner Title -->
        <div class="border-b border-border-color pb-5">
          <h1 class="text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
            <i data-lucide="sparkles" class="w-5 h-5 text-amber-500 animate-pulse"></i>
            Smart Project Intelligence
          </h1>
          <p class="text-xs text-secondary mt-1">Cross-referencing ecosystem search. Instantly trace relations across projects, vendors, quotations, timeline milestones, and payouts.</p>
        </div>

        <!-- SEARCH WRAPPER -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <!-- Search Control Column -->
          <div class="space-y-4 lg:col-span-1">
            <div class="card p-4 border-border-color bg-card relative">
              <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-2 font-mono">Global Search</span>
              <div class="relative">
                <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
                <input type="text" id="intel-search-input" oninput="window.IntelligencePage.handleSearchInput(this.value)" placeholder="Search any PO, vendor, material..." class="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-border-color bg-primary text-white focus:outline-none">
              </div>

              <!-- Live Autocomplete Suggestions Panel -->
              <div id="intel-suggestions-panel" class="absolute left-4 right-4 mt-1 bg-secondary border border-border-color rounded shadow-2xl hidden z-30 max-h-80 overflow-y-auto divide-y divide-border-color/30"></div>
            </div>

            <!-- Recent Searches -->
            <div class="card p-4 border-border-color bg-card">
              <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-2.5 font-mono">Recent Enquiries</span>
              <div class="space-y-2" id="intel-recent-searches">
                ${this.recentSearches.length === 0 ? `
                  <div class="text-[11px] text-muted italic">No recent searches.</div>
                ` : this.recentSearches.map((s, idx) => `
                  <button onclick="window.IntelligencePage.selectRecentSearch(${idx})" class="w-full text-left px-2.5 py-1.5 bg-primary/20 hover:bg-hover rounded border border-border-color/30 hover:border-amber-500/20 text-xs text-secondary hover:text-white flex items-center justify-between transition-all font-mono">
                    <span class="truncate max-w-[120px]">${s.label}</span>
                    <span class="text-[8px] text-muted uppercase font-bold tracking-wider">${s.type}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Intelligence Display Viewport Column -->
          <div class="lg:col-span-3 min-w-0" id="intel-viewport">
            ${this.renderDefaultViewportHTML()}
          </div>

        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    
    // Auto-focus search input
    document.getElementById("intel-search-input")?.focus();
  },

  renderDefaultViewportHTML() {
    return `
      <div class="card p-8 text-center text-muted text-xs border border-dashed border-border-color flex flex-col items-center justify-center min-h-[300px]">
        <div class="w-12 h-12 rounded-full bg-hover flex items-center justify-center mb-3">
          <i data-lucide="sparkles" class="w-6 h-6 text-amber-500"></i>
        </div>
        <h3 class="text-white font-semibold text-sm mb-1">Premio Intelligence Layer</h3>
        <p class="max-w-md text-secondary leading-relaxed mt-1">
          Type in the search field to cross-examine connected entities. Type a project name, vendor, contractor, purchase order ref, quotation serial, or specific material item.
        </p>
      </div>
    `;
  },

  // ────────────────────────────────────────────────────────
  // 2. LIVE AUTOCOMPLETE SUGGESTIONS LOGIC
  // ────────────────────────────────────────────────────────

  handleSearchInput(val) {
    const panel = document.getElementById("intel-suggestions-panel");
    if (!panel) return;

    if (!val || val.trim().length < 2) {
      panel.innerHTML = "";
      panel.classList.add("hidden");
      return;
    }

    const q = val.toLowerCase().trim();
    const store = window.AppStore;
    const payouts = store.state.payouts || [];
    const rfqs = store.state.rfqs || [];
    const pos = store.state.purchaseOrders || [];

    // Grouped matches
    let matches = {
      projects: [],
      vendors: [],
      contractors: [],
      materials: [],
      rfqs: [],
      pos: [],
      invoices: [],
      payments: [],
      documents: []
    };

    // 1. Projects
    store.state.projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)) {
        matches.projects.push({ label: p.name, id: p.id, data: p });
      }

      // Inside Project: vault documents search
      const vault = p.vault || {};
      Object.keys(vault).forEach(folder => {
        (vault[folder] || []).forEach(doc => {
          if (doc.name.toLowerCase().includes(q) || (doc.file && doc.file.toLowerCase().includes(q))) {
            matches.documents.push({ label: doc.name, id: doc.file, project: p, data: doc });
          }
        });
      });

      // Inside Project: materials search
      p.materials.forEach(m => {
        if (m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.finishCode.toLowerCase().includes(q)) {
          // Prevent duplicates in materials matching by name
          if (!matches.materials.some(item => item.label.toLowerCase() === m.name.toLowerCase())) {
            matches.materials.push({ label: m.name, id: m.id, data: m });
          }
        }
      });

      // Inside Project: Invoices
      p.billing.forEach(b => {
        if (b.invoiceNo.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) {
          matches.invoices.push({ label: `${b.invoiceNo} (${b.type})`, id: b.invoiceNo, project: p, data: b });
        }
      });
    });

    // 2. Vendors
    store.state.vendors.forEach(v => {
      if (v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)) {
        matches.vendors.push({ label: v.name, id: v.name, data: v });
      }
    });

    // 3. Contractors (from payouts ledger)
    const contractorNames = new Set();
    payouts.forEach(p => contractorNames.add(p.vendorName));
    contractorNames.forEach(name => {
      if (name.toLowerCase().includes(q)) {
        matches.contractors.push({ label: name, id: name });
      }
    });

    // 4. RFQs
    rfqs.forEach(r => {
      if (r.rfqNumber.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) {
        matches.rfqs.push({ label: `${r.rfqNumber} (${r.category})`, id: r.id, data: r });
      }
    });

    // 5. POs
    pos.forEach(po => {
      if (po.poNumber.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q)) {
        matches.pos.push({ label: `${po.poNumber} — ${po.vendorName}`, id: po.id, data: po });
      }
    });

    // 6. Payments / UTR ref numbers
    payouts.forEach(p => {
      if (p.refNumber && p.refNumber.toLowerCase().includes(q)) {
        matches.payments.push({ label: `UTR: ${p.refNumber} (₹${p.amount.toLocaleString('en-IN')})`, id: p.id, data: p });
      }
    });

    // Render suggestions HTML
    let listHTML = "";
    let hasMatches = false;

    const categories = [
      { key: 'projects', title: 'Projects', icon: 'folder' },
      { key: 'vendors', title: 'Vendors', icon: 'users' },
      { key: 'contractors', title: 'Contractors', icon: 'hard-hat' },
      { key: 'materials', title: 'Materials', icon: 'trello' },
      { key: 'rfqs', title: 'RFQs', icon: 'file-question' },
      { key: 'pos', title: 'Purchase Orders', icon: 'clipboard-signature' },
      { key: 'invoices', title: 'Invoices', icon: 'credit-card' },
      { key: 'payments', title: 'Payments/UTR', icon: 'wallet' },
      { key: 'documents', title: 'Documents/Vault', icon: 'file' }
    ];

    categories.forEach(cat => {
      const items = matches[cat.key];
      if (items.length > 0) {
        hasMatches = true;
        listHTML += `
          <div class="bg-primary/20 py-1">
            <span class="text-[8px] text-muted font-bold font-mono tracking-wider px-3 block py-1 uppercase">${cat.title}</span>
            ${items.slice(0, 3).map(item => `
              <button onclick="window.IntelligencePage.selectResult('${cat.key}', '${item.id}')" class="w-full text-left px-3 py-1.5 hover:bg-hover flex items-center gap-2 text-xs transition-colors">
                <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-secondary flex-shrink-0"></i>
                <span class="truncate flex-1 text-white">${item.label}</span>
              </button>
            `).join("")}
          </div>
        `;
      }
    });

    if (!hasMatches) {
      panel.innerHTML = `<div class="p-3 text-center text-xs text-muted">No intelligence matches for "${val}"</div>`;
    } else {
      panel.innerHTML = listHTML;
    }

    panel.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
    
    // Store matches references
    this._currentMatches = matches;
  },

  selectResult(type, id) {
    const list = this._currentMatches && this._currentMatches[type === 'payments' ? 'payments' : type === 'documents' ? 'documents' : type];
    const match = list && list.find(item => item.id === id);
    if (!match) return;

    // Clear suggestions
    document.getElementById("intel-suggestions-panel")?.classList.add("hidden");
    document.getElementById("intel-search-input").value = "";

    // Save recent search
    this.saveRecentSearch({
      label: match.label.split(" (")[0],
      query: id,
      type,
      id
    });

    this.activeResult = { type, id, data: match.data, fullLabel: match.label };
    this.renderViewportResult();
  },

  selectRecentSearch(idx) {
    const item = this.recentSearches[idx];
    if (!item) return;

    // Re-aggregate and fetch matches dynamically
    this.activeResult = { type: item.type, id: item.id };
    
    // Fetch matched object details
    const store = window.AppStore;
    if (item.type === 'project') {
      this.activeResult.data = store.state.projects.find(p => p.id === item.id);
    } else if (item.type === 'vendor') {
      this.activeResult.data = store.state.vendors.find(v => v.name === item.id);
    } else if (item.type === 'rfqs') {
      this.activeResult.data = store.state.rfqs.find(r => r.id === item.id);
    } else if (item.type === 'pos') {
      this.activeResult.data = store.state.purchaseOrders.find(po => po.id === item.id);
    } else if (item.type === 'payouts' || item.type === 'payments') {
      this.activeResult.data = store.state.payouts.find(p => p.id === item.id);
    }

    this.renderViewportResult();
  },

  // ────────────────────────────────────────────────────────
  // 3. 360° INTELLIGENCE DISPLAY VIEWS RENDER
  // ────────────────────────────────────────────────────────

  renderViewportResult() {
    const viewport = document.getElementById("intel-viewport");
    if (!viewport) return;

    // Refresh Recent list in sidebar
    this.renderRecentSearchesList();

    const type = this.activeResult.type;
    const data = this.activeResult.data;

    let viewHTML = "";

    if (type === "projects" || type === "project") {
      viewHTML = this.renderProject360View(this.activeResult.id);
    } else if (type === "vendors" || type === "vendor") {
      viewHTML = this.renderVendor360View(this.activeResult.id);
    } else if (type === "contractors" || type === "contractor") {
      viewHTML = this.renderContractor360View(this.activeResult.id);
    } else if (type === "materials" || type === "material") {
      viewHTML = this.renderMaterial360View(this.activeResult.id);
    } else if (['rfqs', 'pos', 'invoices', 'payments', 'documents'].includes(type)) {
      viewHTML = this.renderLinkedDocument360View(type, this.activeResult.id);
    }

    viewport.innerHTML = viewHTML;
    if (window.lucide) lucide.createIcons();
  },

  renderRecentSearchesList() {
    const container = document.getElementById("intel-recent-searches");
    if (!container) return;

    container.innerHTML = this.recentSearches.length === 0 ? `
      <div class="text-[11px] text-muted italic">No recent searches.</div>
    ` : this.recentSearches.map((s, idx) => `
      <button onclick="window.IntelligencePage.selectRecentSearch(${idx})" class="w-full text-left px-2.5 py-1.5 bg-primary/20 hover:bg-hover rounded border border-border-color/30 hover:border-amber-500/20 text-xs text-secondary hover:text-white flex items-center justify-between transition-all font-mono">
        <span class="truncate max-w-[120px]">${s.label}</span>
        <span class="text-[8px] text-muted uppercase font-bold tracking-wider">${s.type}</span>
      </button>
    `).join("");
  },

  // ── 360° VIEW: PROJECT ─────────────────────────────────
  renderProject360View(projectId) {
    const store = window.AppStore;
    const p = store.state.projects.find(proj => proj.id === projectId);
    if (!p) return this.renderDefaultViewportHTML();

    const cleanName = p.name.split(" (")[0];
    const rfqs = (store.state.rfqs || []).filter(r => r.projectId === p.id);
    const pos = (store.state.purchaseOrders || []).filter(po => po.projectId === p.id);
    const payouts = (store.state.payouts || []).filter(pay => pay.projectId === p.id);
    const openSnags = p.snags.filter(s => s.status === "Open");

    const amountReleased = payouts.filter(pay => ['Paid', 'Closed'].includes(pay.status)).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const amountPending = payouts.filter(pay => !['Paid', 'Closed', 'Rejected'].includes(pay.status)).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

    return `
      <div class="space-y-6 animate-fade-in text-xs">
        
        <!-- Header Info Card -->
        <div class="card p-5 border-border-color bg-card relative">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">Project 360° View</span>
              <h2 class="text-base font-bold text-white font-display mt-1">${p.name}</h2>
              <span class="text-secondary block font-mono">Address: ${p.location}</span>
            </div>
            <button onclick="window.AppRouter.navigate('project-details', '${p.id}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1.5 flex-shrink-0">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Open Workspace
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-border-color/30 pt-4 text-secondary leading-normal">
            <div><span class="text-[9px] text-muted block uppercase">Budget Under Management</span><span class="text-white font-bold font-mono text-sm">₹${Number(p.budget).toLocaleString('en-IN')}</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Current Stage</span><span class="text-white font-semibold">${p.stage}</span></div>
            <div>
              <span class="text-[9px] text-muted block uppercase">Overall Progress</span>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-16 bg-primary rounded-full h-1.5 overflow-hidden border border-border-color/40"><div class="bg-emerald-500 h-1.5" style="width: ${p.progress}%"></div></div>
                <span class="font-mono text-[10px] font-bold text-white">${p.progress}%</span>
              </div>
            </div>
            <div><span class="text-[9px] text-muted block uppercase">Timeline Dates</span><span class="text-white font-mono text-[10px]">${p.startDate} to ${p.endDate}</span></div>
          </div>
        </div>

        <!-- 360° Operational Tabs -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- Sourcing & Commercial Ledger -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="shopping-bag" class="w-3.5 h-3.5 text-amber-500"></i> Sourcing & Purchase Orders</h3>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1.5 font-mono">Associated RFQs (${rfqs.length})</span>
                ${rfqs.length === 0 ? `<p class="text-muted italic text-[11px]">No RFQs raised for this project.</p>` : rfqs.map(r => `
                  <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                    <span>${r.rfqNumber} (${r.category})</span>
                    <span class="font-bold text-white">${r.status}</span>
                  </div>
                `).join("")}
              </div>
              <div class="border-t border-border-color/20 pt-3">
                <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1.5 font-mono">Released POs (${pos.length})</span>
                ${pos.length === 0 ? `<p class="text-muted italic text-[11px]">No POs issued.</p>` : pos.map(po => `
                  <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                    <span>PO Ref: ${po.poNumber} — <b>${po.vendorName}</b></span>
                    <span class="font-bold font-mono text-white">₹${Number(po.grandTotal).toLocaleString('en-IN')}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Contractor Payouts Summary -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="wallet" class="w-3.5 h-3.5 text-purple-400"></i> Payouts & Contractor Budgets</h3>
            </div>
            <div class="p-4 space-y-3 text-secondary">
              <div class="grid grid-cols-2 gap-2 mb-3 bg-primary/20 p-2.5 rounded border border-border-color/30 font-mono">
                <div><span class="text-[8px] text-muted block uppercase">Amount Released</span><span class="text-emerald-400 font-bold">₹${amountReleased.toLocaleString('en-IN')}</span></div>
                <div><span class="text-[8px] text-muted block uppercase">Pending Clearance</span><span class="text-amber-500 font-bold">₹${amountPending.toLocaleString('en-IN')}</span></div>
              </div>
              <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1.5 font-mono">Payout Logs (${payouts.length})</span>
              ${payouts.length === 0 ? `<p class="text-muted italic text-[11px]">No payouts records found.</p>` : payouts.slice(0, 5).map(pay => `
                <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0">
                  <span>${pay.vendorName} (${pay.milestone})</span>
                  <div class="text-right">
                    <span class="font-bold font-mono text-white block">₹${pay.amount.toLocaleString('en-IN')}</span>
                    <span class="text-[8px] px-1 bg-hover border border-border-color rounded uppercase font-bold text-[8px] text-muted">${pay.status}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Recent Document Files (Vault) -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="file" class="w-3.5 h-3.5 text-cyan-400"></i> Recent Vault Documents</h3>
            </div>
            <div class="p-4 space-y-2">
              ${['drawings', 'agreements', 'quotations', 'invoices'].map(folder => {
                const files = p.vault[folder] || [];
                if (files.length === 0) return '';
                return files.map(f => `
                  <div class="flex justify-between items-center py-1 border-b border-border-color/10 last:border-0 text-secondary">
                    <span>${f.name} <span class="text-[9px] text-muted font-mono uppercase">(${folder})</span></span>
                    <span class="text-[10px] text-muted font-mono">${f.date}</span>
                  </div>
                `).join('');
              }).join("") || `<p class="text-muted italic text-[11px] p-4 text-center">No vault documents uploaded.</p>`}
            </div>
          </div>

          <!-- Open Site Snags -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-500"></i> Open Snags & Timeline Checks</h3>
            </div>
            <div class="p-4 space-y-2.5">
              ${openSnags.length === 0 ? `<p class="text-muted italic text-[11px]">All clear! No open snags logged.</p>` : openSnags.map(s => `
                <div class="flex justify-between items-start py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                  <div>
                    <span class="font-semibold text-white">${s.area} — ${s.issue}</span>
                    <span class="text-[9px] text-muted block mt-0.5 font-mono">Assigned: ${s.assignedTo} • Due: ${s.deadline}</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${s.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-muted'}">${s.priority}</span>
                </div>
              `).join("")}
            </div>
          </div>

        </div>

        <!-- Unified Project Activity chronology timeline -->
        <div class="card border-border-color bg-card">
          <div class="p-4 border-b border-border-color/60 bg-primary/20">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i> Unified Activity Timeline</h3>
          </div>
          <div class="p-5 space-y-4">
            ${this.renderActivityTimelineHTML(p)}
          </div>
        </div>
      </div>
    `;
  },

  // ── 360° VIEW: VENDOR ──────────────────────────────────
  renderVendor360View(vendorName) {
    const store = window.AppStore;
    const v = store.state.vendors.find(vend => vend.name === vendorName);
    if (!v) return this.renderDefaultViewportHTML();

    const rfqs = (store.state.rfqs || []).filter(r => r.quotes && r.quotes.some(q => q.vendorName === v.name));
    const approvedQuotes = (store.state.rfqs || []).filter(r => r.selectedVendor === v.name);
    const pos = (store.state.purchaseOrders || []).filter(po => po.vendorName === v.name);
    const payouts = (store.state.payouts || []).filter(pay => pay.vendorName === v.name);

    const businessValue = pos.reduce((sum, po) => sum + (Number(po.grandTotal) || 0), 0);
    const amountReleased = payouts.filter(pay => ['Paid', 'Closed'].includes(pay.status)).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const amountPending = payouts.filter(pay => !['Paid', 'Closed', 'Rejected'].includes(pay.status)).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

    return `
      <div class="space-y-6 animate-fade-in text-xs">
        
        <!-- Header Info Card -->
        <div class="card p-5 border-border-color bg-card">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="space-y-1">
              <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">Vendor 360° View</span>
              <h2 class="text-base font-bold text-white font-display mt-1">${v.name}</h2>
              <span class="text-secondary block font-mono">Category: ${v.category} • Phone: ${v.phone}</span>
            </div>
            <a href="https://api.whatsapp.com/send?phone=${v.phone.replace(/[^+\d]/g, '')}" target="_blank" 
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded flex items-center gap-1.5 transition-all">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i> WhatsApp Vendor
            </a>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-border-color/30 pt-4 text-secondary leading-normal">
            <div><span class="text-[9px] text-muted block uppercase">Cumulative PO Business</span><span class="text-white font-bold font-mono text-sm">₹${businessValue.toLocaleString('en-IN')}</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Delay Risk Score</span><span class="text-white font-semibold font-mono">${v.delayHistory} Risk</span></div>
            <div>
              <span class="text-[9px] text-muted block uppercase">Quality Rating</span>
              <div class="flex items-center gap-1 font-bold text-amber-400 font-mono mt-1 text-xs">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i> ${v.rating.toFixed(1)} / 5.0
              </div>
            </div>
            <div><span class="text-[9px] text-muted block uppercase">Active Workspaces</span><span class="text-white font-semibold font-mono">${v.activeProjects} Active Sites</span></div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Bids & Quotations History -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="file-text" class="w-3.5 h-3.5 text-amber-500"></i> RFQ Bids & Quotations</h3>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1.5 font-mono">Bids Submitted (${rfqs.length})</span>
                ${rfqs.length === 0 ? `<p class="text-muted italic text-[11px]">No bids logged from this vendor.</p>` : rfqs.map(r => {
                  const quote = r.quotes.find(q => q.vendorName === v.name);
                  return `
                    <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                      <span>${r.rfqNumber} (${r.category})</span>
                      <span class="font-mono text-white">Rate: ₹${quote ? quote.rate.toLocaleString('en-IN') : 'N/A'}</span>
                    </div>
                  `;
                }).join("")}
              </div>
              <div class="border-t border-border-color/20 pt-3">
                <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1.5 font-mono">Approved Quotations (${approvedQuotes.length})</span>
                ${approvedQuotes.length === 0 ? `<p class="text-muted italic text-[11px]">No quotes approved.</p>` : approvedQuotes.map(r => `
                  <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                    <span>RFQ Ref: ${r.rfqNumber} (${r.itemDescription})</span>
                    <span class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[8px] uppercase font-bold border border-emerald-500/20">Approved Bid</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Purchase Orders History -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="clipboard-signature" class="w-3.5 h-3.5 text-blue-400"></i> Issued Purchase Orders</h3>
            </div>
            <div class="p-4 space-y-3">
              ${pos.length === 0 ? `<p class="text-muted italic text-[11px] p-4 text-center">No Purchase Orders issued to this vendor.</p>` : pos.map(po => `
                <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                  <div>
                    <span class="font-bold text-white font-mono block">${po.poNumber}</span>
                    <span class="text-[9px] text-muted block">${po.projectName.split(" (")[0]} • Qty: ${po.items[0]?.qty || 0}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold font-mono text-white block">₹${Number(po.grandTotal).toLocaleString('en-IN')}</span>
                    <span class="text-[8px] px-1 bg-hover border border-border-color rounded uppercase font-bold text-muted">${po.status}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── 360° VIEW: CONTRACTOR ──────────────────────────────
  renderContractor360View(contractorName) {
    const store = window.AppStore;
    const payouts = (store.state.payouts || []).filter(p => p.vendorName === contractorName);

    // Load contract values from localStorage
    const savedValues = JSON.parse(localStorage.getItem("premio_contractor_values") || "{}");
    const contractValue = savedValues[contractorName] || 0;

    let amountReleased = 0;
    let pendingAmount = 0;
    let currentMilestone = "N/A";
    let latestDate = "";
    let associatedProjects = new Set();

    payouts.forEach(p => {
      associatedProjects.add(p.projectName);
      const amt = Number(p.amount) || 0;
      if (['Paid', 'Closed'].includes(p.status)) {
        amountReleased += amt;
      } else if (p.status !== 'Rejected') {
        pendingAmount += amt;
      }

      const pDate = p.updatedAt || p.createdAt || "";
      if (pDate > latestDate) {
        latestDate = pDate;
        currentMilestone = p.milestone;
      }
    });

    const balanceAmount = Math.max(contractValue - amountReleased, 0);
    const paidPercent = contractValue > 0 ? (amountReleased / contractValue) * 100 : 0;

    return `
      <div class="space-y-6 animate-fade-in text-xs">
        <!-- Header Info Card -->
        <div class="card p-5 border-border-color bg-card">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">Contractor 360° View</span>
              <h2 class="text-base font-bold text-white font-display mt-1">${contractorName}</h2>
              <span class="text-secondary block font-mono">Linked Sites: ${Array.from(associatedProjects).join(", ") || 'No associated projects logged.'}</span>
            </div>
            <button onclick="window.AppRouter.navigate('payouts')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1.5 flex-shrink-0">
              <i data-lucide="wallet" class="w-3.5 h-3.5"></i> Open Payout Center
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-border-color/30 pt-4 text-secondary leading-normal">
            <div><span class="text-[9px] text-muted block uppercase">Aggregated Contract Value</span><span class="text-white font-bold font-mono text-sm">₹${contractValue.toLocaleString('en-IN')}</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Amount Released</span><span class="text-emerald-400 font-bold font-mono text-sm">₹${amountReleased.toLocaleString('en-IN')}</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Pending Clearance</span><span class="text-amber-500 font-bold font-mono text-sm">₹${pendingAmount.toLocaleString('en-IN')}</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Balance Contract</span><span class="text-secondary font-bold font-mono text-sm">₹${balanceAmount.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Milestones and Progress -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-500"></i> Contractor Progress & Milestones</h3>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1">Contract Milestone Progress</span>
                <div class="flex items-center gap-2 mt-1">
                  <div class="w-32 bg-primary rounded-full h-2 overflow-hidden border border-border-color/40"><div class="bg-emerald-500 h-2" style="width: ${Math.min(paidPercent, 100)}%"></div></div>
                  <span class="font-mono text-xs font-bold text-white">${paidPercent.toFixed(0)}% Paid</span>
                </div>
              </div>
              <div class="border-t border-border-color/20 pt-3">
                <span class="text-[9px] text-muted uppercase block">Current Active Milestone</span>
                <span class="text-white font-semibold text-xs mt-0.5 block">${currentMilestone}</span>
              </div>
            </div>
          </div>

          <!-- Payout Ledger List -->
          <div class="card border-border-color bg-card">
            <div class="p-4 border-b border-border-color/60 bg-primary/20">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="wallet" class="w-3.5 h-3.5 text-purple-400"></i> Payout Request History</h3>
            </div>
            <div class="p-4 space-y-3">
              ${payouts.length === 0 ? `<p class="text-muted italic text-[11px] p-4 text-center">No payment requests raised by this contractor.</p>` : payouts.map(pay => `
                <div class="flex justify-between items-center py-1.5 border-b border-border-color/10 last:border-0 text-secondary">
                  <div>
                    <span class="font-semibold text-white block">${pay.milestone}</span>
                    <span class="text-[9px] text-muted block">${pay.projectName.split(" (")[0]} • Target: ${pay.targetDate || 'N/A'}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold font-mono text-white block">₹${pay.amount.toLocaleString('en-IN')}</span>
                    <span class="text-[8px] px-1 bg-hover border border-border-color rounded uppercase font-bold text-muted">${pay.status}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── 360° VIEW: MATERIAL ───────────────────────────────
  renderMaterial360View(materialId) {
    const store = window.AppStore;
    
    // Find material matched in state projects
    let projectsUsed = [];
    let priceHistory = [];

    store.state.projects.forEach(p => {
      p.materials.forEach(m => {
        // Simple name matching
        if (m.name.toLowerCase().includes(materialId.toLowerCase()) || materialId.toLowerCase().includes(m.name.toLowerCase())) {
          projectsUsed.push(p);
          priceHistory.push({
            project: p,
            vendor: m.vendor,
            rate: m.rate,
            date: p.startDate,
            approved: m.approved
          });
        }
      });
    });

    const uniqueProjects = Array.from(new Set(projectsUsed.map(p => p.name)));
    const latestRate = priceHistory.length > 0 ? priceHistory.sort((a,b) => new Date(b.date) - new Date(a.date))[0].rate : 0;
    const lowestRate = priceHistory.length > 0 ? Math.min(...priceHistory.map(ph => ph.rate)) : 0;

    return `
      <div class="space-y-6 animate-fade-in text-xs">
        
        <!-- Header Info Card -->
        <div class="card p-5 border-border-color bg-card">
          <div class="space-y-1">
            <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">Material Intelligence</span>
            <h2 class="text-base font-bold text-white font-display mt-1">${materialId}</h2>
            <span class="text-secondary block font-mono">Linked Sites: ${uniqueProjects.join(", ") || 'No projects matched.'}</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 border-t border-border-color/30 pt-4 text-secondary leading-normal">
            <div><span class="text-[9px] text-muted block uppercase">Latest Purchase Rate</span><span class="text-white font-bold font-mono text-sm">₹${latestRate.toLocaleString('en-IN')}/SFT</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Historical Lowest Rate</span><span class="text-emerald-400 font-bold font-mono text-sm">₹${lowestRate.toLocaleString('en-IN')}/SFT</span></div>
            <div><span class="text-[9px] text-muted block uppercase">Linked Workspaces</span><span class="text-white font-semibold font-mono">${uniqueProjects.length} Units</span></div>
          </div>
        </div>

        <!-- Historical Rate Index -->
        <div class="card border-border-color bg-card">
          <div class="p-4 border-b border-border-color/60 bg-primary/20">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono"><i data-lucide="trending-up" class="w-3.5 h-3.5 text-amber-500"></i> Sourcing History & Purchase Rates</h3>
          </div>
          <div class="p-4">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color/60 text-[9px] text-secondary uppercase font-bold font-mono bg-primary/10">
                  <th class="px-3 py-2">Workspace Site</th>
                  <th class="px-3 py-2">Vendor Supplier</th>
                  <th class="px-3 py-2">Purchase Rate</th>
                  <th class="px-3 py-2">Approval Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-color/20 text-xs">
                ${priceHistory.length === 0 ? `
                  <tr><td colspan="4" class="px-3 py-4 text-center text-muted italic">No procurement rate records found.</td></tr>
                ` : priceHistory.map(ph => `
                  <tr>
                    <td class="px-3 py-2.5 text-white">${ph.project.name.split(" (")[0]}</td>
                    <td class="px-3 py-2.5 font-semibold">${ph.vendor}</td>
                    <td class="px-3 py-2.5 font-bold font-mono text-amber-500">₹${ph.rate.toLocaleString('en-IN')}</td>
                    <td class="px-3 py-2.5"><span class="px-1 bg-hover border border-border-color rounded uppercase font-bold text-[8px] text-muted">${ph.approved}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // ── 360° VIEW: LINKED DOCUMENT / SOURCING ENTITY ───────
  renderLinkedDocument360View(type, id) {
    const store = window.AppStore;
    const payouts = store.state.payouts || [];
    const rfqs = store.state.rfqs || [];
    const pos = store.state.purchaseOrders || [];

    let rfqObj = null;
    let poObj = null;
    let invoiceObj = null;
    let paymentObj = null;
    let projectObj = null;
    let vendorName = "";

    // Resolve entities based on input type
    if (type === 'rfqs') {
      rfqObj = rfqs.find(r => r.id === id);
      if (rfqObj) {
        projectObj = store.state.projects.find(p => p.id === rfqObj.projectId);
        vendorName = rfqObj.selectedVendor || rfqObj.vendors[0];
        // Heuristic connect RFQ -> PO
        poObj = pos.find(po => po.projectId === rfqObj.projectId && po.vendorName === vendorName);
      }
    } else if (type === 'pos') {
      poObj = pos.find(po => po.id === id);
      if (poObj) {
        projectObj = store.state.projects.find(p => p.id === poObj.projectId);
        vendorName = poObj.vendorName;
        // Heuristic connect PO -> RFQ
        rfqObj = rfqs.find(r => r.projectId === poObj.projectId && r.selectedVendor === vendorName);
      }
    } else if (type === 'invoices') {
      // Find invoice inside project billing
      store.state.projects.forEach(p => {
        const inv = p.billing.find(b => b.invoiceNo === id);
        if (inv) {
          invoiceObj = inv;
          projectObj = p;
          // Connect to payouts ledger
          paymentObj = payouts.find(pay => pay.projectId === p.id && pay.amount === inv.amount);
          vendorName = paymentObj ? paymentObj.vendorName : "";
          poObj = pos.find(po => po.projectId === p.id && po.vendorName === vendorName);
        }
      });
    } else if (type === 'payments') {
      paymentObj = payouts.find(p => p.id === id);
      if (paymentObj) {
        projectObj = store.state.projects.find(p => p.id === paymentObj.projectId);
        vendorName = paymentObj.vendorName;
        // Connect payout to invoice
        if (projectObj) {
          invoiceObj = projectObj.billing.find(b => b.amount === paymentObj.amount);
        }
        poObj = pos.find(po => po.projectId === paymentObj.projectId && po.vendorName === vendorName);
      }
    } else if (type === 'documents') {
      // Match document details
      store.state.projects.forEach(p => {
        ['drawings', 'agreements', 'quotations', 'invoices'].forEach(folder => {
          const doc = (p.vault[folder] || []).find(d => d.file === id);
          if (doc) {
            projectObj = p;
            invoiceObj = { invoiceNo: doc.name, type: folder, status: 'Vault File' };
          }
        });
      });
    }

    if (!projectObj) return this.renderDefaultViewportHTML();

    const cleanProjectName = projectObj.name.split(" (")[0];

    return `
      <div class="space-y-6 animate-fade-in text-xs">
        
        <!-- Header Entity Card -->
        <div class="card p-5 border-border-color bg-card">
          <div class="space-y-1">
            <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">Relationship Map View</span>
            <h2 class="text-base font-bold text-white font-display mt-1">Sourcing Node Intelligence</h2>
            <span class="text-secondary block font-mono">Linked Project: ${projectObj.name}</span>
          </div>
        </div>

        <!-- 360° SOURCING RELATIONSHIP TREE FLOW -->
        <div class="card p-5 border-border-color bg-card">
          <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-4 font-mono">Heuristic Smart Relationships Map</span>
          <div class="flex flex-col md:flex-row items-center justify-between gap-3 text-center text-xs">
            
            <!-- Project -->
            <div class="bg-primary/40 border border-border-color/60 rounded p-2.5 w-full md:w-32">
              <span class="text-[8px] text-muted block uppercase">Project</span>
              <span class="font-bold text-white mt-1 block truncate">${cleanProjectName}</span>
            </div>

            <i data-lucide="chevron-right" class="w-4 h-4 text-secondary hidden md:block flex-shrink-0"></i>

            <!-- RFQ -->
            <div class="rounded p-2.5 w-full md:w-32 border ${rfqObj ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-primary/10 border-border-color/30 text-muted opacity-50'}">
              <span class="text-[8px] block uppercase">RFQ Sourcing</span>
              <span class="font-bold mt-1 block truncate">${rfqObj ? rfqObj.rfqNumber : 'None'}</span>
            </div>

            <i data-lucide="chevron-right" class="w-4 h-4 text-secondary hidden md:block flex-shrink-0"></i>

            <!-- PO -->
            <div class="rounded p-2.5 w-full md:w-32 border ${poObj ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-primary/10 border-border-color/30 text-muted opacity-50'}">
              <span class="text-[8px] block uppercase">Purchase Order</span>
              <span class="font-bold mt-1 block truncate">${poObj ? poObj.poNumber : 'None'}</span>
            </div>

            <i data-lucide="chevron-right" class="w-4 h-4 text-secondary hidden md:block flex-shrink-0"></i>

            <!-- Invoice -->
            <div class="rounded p-2.5 w-full md:w-32 border ${invoiceObj ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-primary/10 border-border-color/30 text-muted opacity-50'}">
              <span class="text-[8px] block uppercase">Invoice Ledger</span>
              <span class="font-bold mt-1 block truncate">${invoiceObj ? invoiceObj.invoiceNo : 'None'}</span>
            </div>

            <i data-lucide="chevron-right" class="w-4 h-4 text-secondary hidden md:block flex-shrink-0"></i>

            <!-- Payout Release -->
            <div class="rounded p-2.5 w-full md:w-32 border ${paymentObj ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-primary/10 border-border-color/30 text-muted opacity-50'}">
              <span class="text-[8px] block uppercase">Disbursement</span>
              <span class="font-bold mt-1 block truncate">${paymentObj ? `₹${paymentObj.amount.toLocaleString('en-IN')}` : 'None'}</span>
            </div>

          </div>
        </div>

        <!-- Detailed Entities Parameters Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${rfqObj ? `
            <div class="card p-4 border-border-color bg-card space-y-2">
              <span class="text-[9px] text-muted block uppercase font-mono">RFQ Sourcing Details</span>
              <div class="flex justify-between"><span>RFQ Number:</span><span class="font-bold text-white font-mono">${rfqObj.rfqNumber}</span></div>
              <div class="flex justify-between"><span>Category & Specs:</span><span class="text-secondary">${rfqObj.category} — ${rfqObj.itemDescription}</span></div>
              <div class="flex justify-between"><span>Winner Vendor:</span><span class="text-emerald-400 font-semibold">${rfqObj.selectedVendor || 'TBD'}</span></div>
              <button onclick="window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openDetail('${rfqObj.id}'), 100);" class="w-full mt-2 py-1.5 bg-hover hover:bg-border-color text-xs text-white rounded border border-border-color/30 font-medium transition-all">Go to RFQ Comparator</button>
            </div>
          ` : ''}

          ${poObj ? `
            <div class="card p-4 border-border-color bg-card space-y-2">
              <span class="text-[9px] text-muted block uppercase font-mono">Purchase Order Details</span>
              <div class="flex justify-between"><span>PO Number:</span><span class="font-bold text-white font-mono">${poObj.poNumber}</span></div>
              <div class="flex justify-between"><span>Vendor Agency:</span><span class="text-secondary font-semibold">${poObj.vendorName}</span></div>
              <div class="flex justify-between"><span>Grand Total:</span><span class="text-amber-500 font-bold font-mono">₹${Number(poObj.grandTotal).toLocaleString('en-IN')}</span></div>
              <button onclick="window.AppRouter.navigate('pos');" class="w-full mt-2 py-1.5 bg-hover hover:bg-border-color text-xs text-white rounded border border-border-color/30 font-medium transition-all">Go to PO Manager</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ── RENDER METHOD: ACTIVITY CHRONOLOGY TIMELINE ────────
  renderActivityTimelineHTML(project) {
    let events = [];

    // Chronology Aggregators
    // 1. Project updates
    project.updates.forEach(u => {
      events.push({
        date: u.date,
        title: "Site Update Logged",
        description: u.completed,
        icon: "camera",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/25"
      });
    });

    // 2. Timeline Stages completions
    project.stages.forEach(st => {
      if (st.status === "Completed") {
        events.push({
          date: st.deadline || "2026-03-01",
          title: `Milestone Completed: ${st.name}`,
          description: ` timeline progress updated to 100% and successfully closed on site.`,
          icon: "check-circle",
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
        });
      }
    });

    // 3. Billing / Invoices clearances
    project.billing.forEach(b => {
      events.push({
        date: b.date || "2026-03-01",
        title: `Invoice Logged: ${b.invoiceNo}`,
        description: `Raised invoice milestone for <b>${b.type}</b> worth ₹${Number(b.amount).toLocaleString('en-IN')} (Status: ${b.status}).`,
        icon: "credit-card",
        color: b.status === "Paid" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-purple-400 bg-purple-500/10 border-purple-500/25"
      });
    });

    // Sort descending by date
    const sorted = events.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
      return `<div class="text-muted italic text-[11px]">No activity history logged.</div>`;
    }

    return sorted.slice(0, 8).map(e => `
      <div class="relative pl-6 pb-4 border-l border-border-color/40 last:border-0 last:pb-0 text-xs">
        <div class="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${e.color} border">
          <i data-lucide="${e.icon}" class="w-2.5 h-2.5"></i>
        </div>
        <div class="space-y-0.5 text-secondary">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-white">${e.title}</span>
            <span class="font-mono text-muted text-[10px]">${new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
          </div>
          <p class="mt-1 text-secondary leading-relaxed">${e.description}</p>
        </div>
      </div>
    `).join("");
  }
};
