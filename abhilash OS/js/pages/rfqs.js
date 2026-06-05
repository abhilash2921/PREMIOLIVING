/* js/pages/rfqs.js - Premio Living OS RFQ Management */

window.RFQPage = {
  activeSearch: '',
  activeFilter: 'all', // status filter ('Draft', 'Sent', etc.) or project-specific
  activeProjectFilter: 'all', // project filter
  activeRFQId: null,
  viewMode: 'list', // 'list' | 'detail' | 'create' | 'edit'
  activeRFQ: null,

  // ── RFQ Number Generator ───────────────────────────
  generateRFQNumber() {
    const state = window.AppStore.state;
    const rfqs = state.rfqs || [];
    const year = new Date().getFullYear();
    const count = rfqs.filter(r => r.rfqNumber && r.rfqNumber.includes(String(year))).length + 1;
    return `RFQ-${year}-${String(count).padStart(3, '0')}`;
  },

  // ── Smart unit suggestion by category ────────────
  suggestUnit(category) {
    if (window.POPage && window.POPage.suggestUnit) {
      return window.POPage.suggestUnit(category);
    }
    const unitMap = {
      'Modular Carcase Manufacturing': 'Set',
      'Modular Shutters (Acrylic/PU/Glass)': 'SFT',
      'Carpentry & Framing': 'SFT',
      'Stone, Marble & Granite': 'SFT',
      'Quartz & Countertops': 'RFT',
      'Civil & Brick Masonry': 'CFT',
      'False Ceiling (Gypsum/Grid)': 'SFT',
      'Electrical, Track Lights & Automation': 'PCS',
      'Plumbing & Sanitary Sourcing': 'PCS',
      'Glass & Mirror Works': 'SFT',
      'Painting & Putty': 'SFT',
      'Wood Polishing (PU/Melamine/Deco)': 'SFT',
      'Plywood, MDF & HDHMR Sourcing': 'Sheet',
      'Veneers & Fluted Panels': 'Sheet',
      'Laminates & Acrylic Slabs': 'Sheet',
      'Hardware, Hinges & Gola Profiles': 'PCS',
      'Modular Tandem Boxes & Channels': 'Set',
      'Modular Kitchen Sinks & Appliances': 'PCS',
      'Wallpaper, Cladding & PVC Panels': 'Roll',
      'Furnishings, Curtains & Upholstery': 'Meter',
      'Metal Works & Fabrication': 'KG',
      'Other Interior Works': 'PCS',
      'Glass': 'SFT', 'Mirror': 'SFT', 'Stone': 'SFT', 'Quartz': 'SFT',
      'Granite': 'SFT', 'Marble': 'SFT', 'Veneer': 'SFT', 'Fluted Panels': 'SFT',
      'Plywood': 'Sheet', 'MDF': 'Sheet', 'HDHMR': 'Sheet', 'Laminate': 'Sheet', 'Acrylic': 'Sheet',
      'Wallpaper': 'Roll', 'Fabric': 'Meter', 'Curtain Fabric': 'Meter',
      'Handle Profile': 'RFT', 'Edge Band': 'RFT', 'Aluminium Profile': 'RFT', 'Skirting': 'RFT',
      'Hardware': 'PCS', 'Hinges': 'PCS', 'Knobs': 'PCS', 'Locks': 'PCS',
      'Lights': 'PCS', 'Switches': 'PCS', 'Appliances': 'PCS',
      'Drawer Channels': 'Set', 'Tandem Boxes': 'Set'
    };
    return unitMap[category] || 'PCS';
  },

  // ── Status configurations ────────────────────────
  statusConfig(status) {
    const map = {
      'Draft':          { color: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',    icon: 'file',          dot: 'bg-zinc-400' },
      'Sent':           { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     icon: 'send',          dot: 'bg-blue-400' },
      'Quote Received': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'file-check',    dot: 'bg-purple-400' },
      'Under Review':   { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  icon: 'eye',           dot: 'bg-amber-400' },
      'Approved':       { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'check-circle',  dot: 'bg-emerald-400' },
      'Rejected':       { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     icon: 'x-circle',      dot: 'bg-rose-400' }
    };
    return map[status] || map['Draft'];
  },

  // ── Main Render ──────────────────────────────────
  render(container) {
    // Restore draft if any exists and we are not already viewing details or creating a new one
    if (this.viewMode === 'list' && this.activeRFQ === null) {
      const savedDraft = localStorage.getItem('premio_rfq_draft');
      if (savedDraft) {
        try {
          const draftObj = JSON.parse(savedDraft);
          this.viewMode = draftObj.viewMode || 'list';
          this.activeRFQ = draftObj.activeRFQ || null;
          this.activeRFQId = draftObj.activeRFQId || null;
          this.returnToProcurementProjectId = draftObj.returnToProcurementProjectId || null;
          setTimeout(() => {
            if (window.ModalComponent) {
              window.ModalComponent.showToast("Restored unsaved RFQ draft!");
            }
          }, 300);
        } catch (e) {
          console.error("Failed to restore RFQ draft", e);
        }
      }
    }

    // Migration: make sure all stored RFQs have the items and quotes.rates array
    const store = window.AppStore;
    if (store.state.rfqs) {
      store.state.rfqs.forEach(rfq => {
        if (!rfq.items) {
          rfq.items = [
            {
              category: rfq.category,
              description: rfq.itemDescription || '',
              qty: rfq.qty || 1,
              unit: rfq.unit || 'SFT',
              shutterWidthEnabled: rfq.shutterWidthEnabled || false,
              shutterHeightEnabled: rfq.shutterHeightEnabled || false,
              shutterDepthEnabled: rfq.shutterDepthEnabled || false,
              shutterLengthEnabled: rfq.shutterLengthEnabled || false,
              shutterWidth: rfq.shutterWidth || 0,
              shutterHeight: rfq.shutterHeight || 0,
              shutterDepth: rfq.shutterDepth || 0,
              shutterLength: rfq.shutterLength || 0,
              shutterCount: rfq.shutterCount || 0
            }
          ];
        }
        if (rfq.quotes) {
          rfq.quotes.forEach(q => {
            if (q.rate !== undefined && !q.rates) {
              q.rates = [q.rate];
            }
          });
        }
      });
    }

    // Fail-safe initialization of mock data
    if (!window.AppStore.state.rfqs) {
      window.AppStore.state.rfqs = [
        {
          id: "rfq-1",
          rfqNumber: "RFQ-2026-001",
          projectId: "project-2",
          projectName: "Botanika Villa (Gachibowli)",
          category: "Glass",
          notes: "Requires bevelled edge polishing. Slabs must be scratch-free.",
          vendors: ["Royal Stones", "Advance Laminates"],
          status: "Quote Received",
          createdAt: "2026-05-25",
          items: [
            {
              category: "Glass",
              description: "Bronze Mirror 6mm",
              qty: 120,
              unit: "SFT"
            }
          ],
          quotes: [
            { vendorName: "Royal Stones", rates: [350], gst: 18, additionalCharges: 1500, notes: "Ex-factory delivery in 3 days", submittedAt: "2026-05-26" },
            { vendorName: "Advance Laminates", rates: [320], gst: 18, additionalCharges: 2500, notes: "Requires 6 days delivery time", submittedAt: "2026-05-27" }
          ],
          selectedVendor: "",
          convertedToPO: false,
          history: [
            { date: "2026-05-25", text: "RFQ created as Draft" },
            { date: "2026-05-25", text: "RFQ sent to selected vendors" },
            { date: "2026-05-27", text: "Received quote from Advance Laminates and Royal Stones" }
          ]
        },
        {
          id: "rfq-2",
          rfqNumber: "RFQ-2026-002",
          projectId: "project-1",
          projectName: "Mr. Anil & Aparna (My Home Nishada)",
          category: "Hardware",
          notes: "Need soft-close models with full drawer extension.",
          vendors: ["Wood Crafts", "Philips Light Studio"],
          status: "Under Review",
          createdAt: "2026-05-26",
          items: [
            {
              category: "Hardware",
              description: "Blum Tandembox runners 20 inch",
              qty: 24,
              unit: "Set"
            }
          ],
          quotes: [
            { vendorName: "Wood Crafts", rates: [2400], gst: 18, additionalCharges: 1000, notes: "Original Blum parts", submittedAt: "2026-05-27" }
          ],
          selectedVendor: "Wood Crafts",
          convertedToPO: false,
          history: [
            { date: "2026-05-26", text: "RFQ created as Draft" },
            { date: "2026-05-27", text: "Quote received from Wood Crafts. Set status to Under Review." }
          ]
        }
      ];
      window.AppStore.saveState();
    }

    if (this.viewMode === 'create' || this.viewMode === 'edit') {
      return this.renderCreateOrEdit(container);
    }
    if (this.viewMode === 'detail' && this.activeRFQId) {
      return this.renderDetail(container);
    }
    this.renderList(container);
  },

  // ── Render List View ─────────────────────────────
  renderList(container) {
    const store = window.AppStore;
    const role = store.activeRole;
    const rfqs = store.state.rfqs || [];
    const projects = store.state.projects || [];

    // Filter Logic
    let filtered = rfqs.filter(r => {
      const matchStatus = this.activeFilter === 'all' || r.status === this.activeFilter;
      const matchProject = this.activeProjectFilter === 'all' || r.projectId === this.activeProjectFilter;
      const matchSearch = !this.activeSearch ||
        r.rfqNumber?.toLowerCase().includes(this.activeSearch) ||
        r.category?.toLowerCase().includes(this.activeSearch) ||
        r.projectName?.toLowerCase().includes(this.activeSearch) ||
        r.items?.some(i => i.description?.toLowerCase().includes(this.activeSearch)) ||
        r.vendors?.some(v => v.toLowerCase().includes(this.activeSearch));
      return matchStatus && matchProject && matchSearch;
    });

    // Sort newest first
    filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Dashboard metrics
    const totalCount = rfqs.length;
    const pendingQuotes = rfqs.filter(r => r.status === 'Sent').length;
    const underReview = rfqs.filter(r => r.status === 'Under Review').length;
    const converted = rfqs.filter(r => r.convertedToPO).length;

    const statusFilters = ['all', 'Draft', 'Sent', 'Quote Received', 'Under Review', 'Approved', 'Rejected'];

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-5 animate-fade-in">
          <div>
            <h1 class="text-base font-bold text-white font-display flex items-center gap-2">
              <i data-lucide="file-question" class="w-5 h-5 text-amber-500"></i>
              RFQ (Request For Quotation)
            </h1>
            <p class="text-xs text-secondary mt-0.5">Source materials, request quotes, compare bids, and select vendors</p>
          </div>
          ${role === 'admin' ? `
            <button onclick="window.RFQPage.openCreateView()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded flex items-center gap-1.5 shadow-md transition-all hover:scale-105">
              <i data-lucide="plus" class="w-4 h-4"></i> Create RFQ
            </button>
          ` : ''}
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Total RFQs Sourced</span>
            <span class="text-lg font-bold font-mono text-white block mt-1">${totalCount}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Awaiting Quotes</span>
            <span class="text-lg font-bold font-mono text-blue-400 block mt-1">${pendingQuotes}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Quotes Under Review</span>
            <span class="text-lg font-bold font-mono text-amber-500 block mt-1">${underReview}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Converted to PO</span>
            <span class="text-lg font-bold font-mono text-emerald-400 block mt-1">${converted}</span>
          </div>
        </div>

        <!-- Filter / Search Row -->
        <div class="flex flex-col md:flex-row gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
            <input
              type="text"
              id="rfq-search"
              placeholder="Search RFQ number, project, category, material description..."
              value="${this.activeSearch}"
              oninput="window.RFQPage.activeSearch = this.value.toLowerCase(); window.RFQPage.renderList(document.getElementById('main-content-container'))"
              class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
            >
          </div>
          <div class="w-full md:w-56">
            <select id="rfq-project-filter" onchange="window.RFQPage.activeProjectFilter = this.value; window.RFQPage.renderList(document.getElementById('main-content-container'))"
              class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
              <option value="all">All Projects (RFQ History)</option>
              ${projects.map(p => `<option value="${p.id}" ${this.activeProjectFilter === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="flex border-b border-border-color/60 gap-4 text-xs pb-1 overflow-x-auto no-scrollbar">
          ${statusFilters.map(f => `
            <button onclick="window.RFQPage.activeFilter = '${f}'; window.RFQPage.renderList(document.getElementById('main-content-container'))"
              class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex-shrink-0 ${this.activeFilter === f ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
              ${f === 'all' ? 'All RFQs' : f}
            </button>
          `).join('')}
        </div>

        <!-- RFQ List Data -->
        ${filtered.length === 0 ? `
          <div class="card p-12 text-center animate-fade-in">
            <i data-lucide="file-question" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No Requests For Quotations Found</p>
            <p class="text-xs text-muted">Create a new RFQ to start sourcing materials.</p>
          </div>
        ` : `
          <!-- Desktop Table -->
          <div class="hidden md:block card overflow-hidden animate-fade-in">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-4 py-3">RFQ Ref</th>
                  <th class="px-4 py-3">Project</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3">Item details / Specs</th>
                  <th class="px-4 py-3 text-right">Items count</th>
                  <th class="px-4 py-3">Quotes</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(rfq => this.renderTableRow(rfq, role)).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-3 animate-fade-in">
            ${filtered.map(rfq => this.renderMobileCard(rfq, role)).join('')}
          </div>
        `}

      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  renderTableRow(rfq, role) {
    const cfg = this.statusConfig(rfq.status);
    const quoteCount = rfq.quotes?.length || 0;
    const itemCount = rfq.items?.length || 0;
    const firstItemDesc = rfq.items?.[0]?.description || 'No items';
    const descDisplay = itemCount > 1 ? `${firstItemDesc} (+${itemCount - 1} more)` : firstItemDesc;

    return `
      <tr class="border-b border-border-color hover:bg-hover/30 transition-colors cursor-pointer" onclick="window.RFQPage.openDetail('${rfq.id}')">
        <td class="px-4 py-3 font-mono font-bold text-amber-500">${rfq.rfqNumber}</td>
        <td class="px-4 py-3 text-white truncate max-w-[150px]">${rfq.projectName}</td>
        <td class="px-4 py-3"><span class="px-1.5 py-0.5 bg-primary/60 rounded text-[9px] font-mono text-secondary">${rfq.category}</span></td>
        <td class="px-4 py-3 text-white font-medium truncate max-w-[200px]">${descDisplay}</td>
        <td class="px-4 py-3 text-right font-mono text-white">${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${quoteCount > 0 ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-700/50 text-zinc-400'}">
            ${quoteCount} bid${quoteCount !== 1 ? 's' : ''}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold ${cfg.color}">${rfq.status}</span>
        </td>
        <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
          <div class="flex gap-1 justify-end">
            <button onclick="window.RFQPage.openDetail('${rfq.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Compare Bids"><i data-lucide="eye" class="w-3.5 h-3.5 text-amber-500"></i></button>
            ${role === 'admin' ? `
              <button onclick="window.RFQPage.printRFQ('${rfq.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Print RFQ PDF"><i data-lucide="printer" class="w-3.5 h-3.5"></i></button>
              <button onclick="window.RFQPage.openEditView('${rfq.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Edit"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
              <button onclick="window.RFQPage.deleteRFQ('${rfq.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  renderMobileCard(rfq, role) {
    const cfg = this.statusConfig(rfq.status);
    const quoteCount = rfq.quotes?.length || 0;
    const itemCount = rfq.items?.length || 0;
    const firstItemDesc = rfq.items?.[0]?.description || 'No items';
    const descDisplay = itemCount > 1 ? `${firstItemDesc} (+${itemCount - 1} more)` : firstItemDesc;

    return `
      <div class="card p-4 space-y-3 cursor-pointer hover:border-amber-500/30 transition-all text-xs" onclick="window.RFQPage.openDetail('${rfq.id}')">
        <div class="flex justify-between items-start">
          <div>
            <span class="font-mono font-bold text-amber-500 block">${rfq.rfqNumber}</span>
            <span class="text-[9px] text-muted block font-mono">${window.Utils.formatDate(rfq.createdAt)}</span>
          </div>
          <span class="px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold ${cfg.color}">${rfq.status}</span>
        </div>
        <div class="border-y border-border-color/30 py-2 space-y-1">
          <div><span class="text-secondary">Project: </span><b class="text-white">${rfq.projectName}</b></div>
          <div><span class="text-secondary">Materials: </span><b class="text-white">${descDisplay}</b></div>
          <div class="flex justify-between text-[10px] text-muted mt-1">
            <span>Items: <b class="text-white">${itemCount}</b></span>
            <span>Bids: <b class="text-purple-400">${quoteCount} received</b></span>
          </div>
        </div>
        ${role === 'admin' ? `
          <div class="flex gap-2" onclick="event.stopPropagation()">
            <button onclick="window.RFQPage.openDetail('${rfq.id}')" class="flex-1 py-1.5 bg-hover border border-border-color text-amber-500 font-bold rounded text-[10px] flex items-center justify-center gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Compare Quotes
            </button>
            <button onclick="window.RFQPage.printRFQ('${rfq.id}')" class="px-3 py-1.5 bg-hover text-secondary border border-border-color rounded hover:text-white">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.RFQPage.deleteRFQ('${rfq.id}')" class="px-3 py-1.5 bg-hover text-rose-500 border border-rose-500/20 rounded">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ── Open Create / Edit View (Inline rendering) ────
  openCreateView() {
    this.viewMode = 'create';
    this.activeRFQ = {
      id: '',
      rfqNumber: this.generateRFQNumber(),
      entryMode: 'standard',
      projectId: '',
      projectName: '',
      category: 'Glass',
      itemDescription: '',
      qty: 1,
      unit: 'SFT',
      notes: '',
      vendors: [],
      quotes: [],
      selectedVendor: '',
      convertedToPO: false,
      shutterWidthEnabled: false,
      shutterHeightEnabled: false,
      shutterDepthEnabled: false,
      shutterLengthEnabled: false,
      shutterWidth: 0,
      shutterHeight: 0,
      shutterDepth: 0,
      shutterLength: 0,
      shutterCount: 0
    };
    this.saveDraft();
    window.AppRouter.refresh();
  },

  openCreateViewFromProcurement(projectId, projectName) {
    this.viewMode = 'create';
    this.returnToProcurementProjectId = projectId;
    this.activeProjectFilter = projectId;
    this.activeRFQ = {
      id: '',
      rfqNumber: this.generateRFQNumber(),
      entryMode: 'standard',
      projectId: projectId,
      projectName: projectName,
      category: 'Glass',
      itemDescription: '',
      qty: 1,
      unit: 'SFT',
      notes: '',
      vendors: [],
      quotes: [],
      selectedVendor: '',
      convertedToPO: false,
      shutterWidthEnabled: false,
      shutterHeightEnabled: false,
      shutterDepthEnabled: false,
      shutterLengthEnabled: false,
      shutterWidth: 0,
      shutterHeight: 0,
      shutterDepth: 0,
      shutterLength: 0,
      shutterCount: 0
    };
    this.saveDraft();
    window.AppRouter.navigate('rfqs');
  },

  addVendorToRFQ(vendorName) {
    if (!vendorName) return;
    if (vendorName === "__custom__") {
      const customName = prompt("Enter Custom Vendor Name to notify:");
      if (!customName || !customName.trim()) return;
      vendorName = customName.trim();
    }
    if (!this.activeRFQ.vendors) this.activeRFQ.vendors = [];
    if (!this.activeRFQ.vendors.includes(vendorName)) {
      this.activeRFQ.vendors.push(vendorName);
    }
    this.saveDraft();
    window.AppRouter.refresh();
  },

  removeVendorFromRFQ(vendorName) {
    if (!this.activeRFQ.vendors) return;
    this.activeRFQ.vendors = this.activeRFQ.vendors.filter(v => v !== vendorName);
    this.saveDraft();
    window.AppRouter.refresh();
  },

  cancelRFQForm() {
    const returnProjId = this.returnToProcurementProjectId;
    this.returnToProcurementProjectId = null;
    this.viewMode = 'list';
    this.activeRFQId = null;
    this.activeRFQ = null;
    this.clearDraft();
    if (returnProjId) {
      window.ProcurementPage.activeProjectId = returnProjId;
      window.ProcurementPage.activeTab = 'rfqs';
      window.AppRouter.navigate('procurement');
    } else {
      window.AppRouter.refresh();
    }
  },

  openEditView(rfqId) {
    const rfq = (window.AppStore.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;
    this.viewMode = 'edit';
    this.activeRFQ = JSON.parse(JSON.stringify(rfq));
    if (!this.activeRFQ.entryMode) {
      this.activeRFQ.entryMode = 'standard';
    }
    // Migration: make sure items list exists
    if (!this.activeRFQ.items) {
      this.activeRFQ.items = [
        {
          description: this.activeRFQ.itemDescription || '',
          qty: this.activeRFQ.qty || 1,
          unit: this.activeRFQ.unit || 'SFT',
          shutterWidthEnabled: this.activeRFQ.shutterWidthEnabled || false,
          shutterHeightEnabled: this.activeRFQ.shutterHeightEnabled || false,
          shutterDepthEnabled: this.activeRFQ.shutterDepthEnabled || false,
          shutterLengthEnabled: this.activeRFQ.shutterLengthEnabled || false,
          shutterWidth: this.activeRFQ.shutterWidth || 0,
          shutterHeight: this.activeRFQ.shutterHeight || 0,
          shutterDepth: this.activeRFQ.shutterDepth || 0,
          shutterLength: this.activeRFQ.shutterLength || 0,
          shutterCount: this.activeRFQ.shutterCount || 0
        }
      ];
    }
    this.saveDraft();
    window.AppRouter.refresh();
  },

  // ── Render Create / Edit Form ─────────────────────
  renderCreateOrEdit(container) {
    const isEdit = this.viewMode === 'edit';
    const store = window.AppStore;
    const projects = store.state.projects || [];
    const vendors = store.state.vendors || [];
    const rfq = this.activeRFQ;

    const categories = [
      'Modular Carcase Manufacturing',
      'Modular Shutters (Acrylic/PU/Glass)',
      'Carpentry & Framing',
      'Stone, Marble & Granite',
      'Quartz & Countertops',
      'Civil & Brick Masonry',
      'False Ceiling (Gypsum/Grid)',
      'Electrical, Track Lights & Automation',
      'Plumbing & Sanitary Sourcing',
      'Glass & Mirror Works',
      'Painting & Putty',
      'Wood Polishing (PU/Melamine/Deco)',
      'Plywood, MDF & HDHMR Sourcing',
      'Veneers & Fluted Panels',
      'Laminates & Acrylic Slabs',
      'Hardware, Hinges & Gola Profiles',
      'Modular Tandem Boxes & Channels',
      'Modular Kitchen Sinks & Appliances',
      'Wallpaper, Cladding & PVC Panels',
      'Furnishings, Curtains & Upholstery',
      'Metal Works & Fabrication',
      'Other Interior Works'
    ];
    const units = ['SFT','Sheet','Roll','Meter','RFT','PCS','Set','KG','LTR','BOX'];

    if (!rfq.projectId && projects.length > 0) {
      rfq.projectId = projects[0].id;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">

        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-border-color pb-4">
          <button onclick="window.RFQPage.viewMode='list'; window.AppRouter.refresh()" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Back">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h1 class="text-base font-bold text-white font-display">${isEdit ? 'Modify Request For Quotation' : 'Create RFQ'}</h1>
            <p class="text-xs text-secondary mt-0.5">${rfq.rfqNumber}</p>
          </div>
        </div>

        <!-- Mode Selector Switcher -->
        <div class="grid grid-cols-2 gap-2 bg-primary/20 p-1 rounded-lg border border-border-color/60">
          <button type="button" onclick="window.RFQPage.setEntryMode('standard')" class="py-2 text-xs font-bold rounded text-center transition-all flex items-center justify-center gap-1.5 ${rfq.entryMode !== 'production' ? 'bg-amber-500 text-black shadow-md' : 'text-secondary hover:text-white hover:bg-hover/20'}">
            <i data-lucide="list" class="w-4 h-4"></i> Standard RFQ Mode
          </button>
          <button type="button" onclick="window.RFQPage.setEntryMode('production')" class="py-2 text-xs font-bold rounded text-center transition-all flex items-center justify-center gap-1.5 ${rfq.entryMode === 'production' ? 'bg-amber-500 text-black shadow-md' : 'text-secondary hover:text-white hover:bg-hover/20'}">
            <i data-lucide="table-properties" class="w-4 h-4"></i> Production List Mode
          </button>
        </div>

        <!-- Form Body -->
        <div class="card p-5 space-y-4 text-xs" oninput="window.RFQPage.saveDraft()" onchange="window.RFQPage.saveDraft()">
          <!-- Main Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">RFQ Ref Number</label>
              <input type="text" value="${rfq.rfqNumber}" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-amber-500 font-mono font-bold focus:outline-none" readonly>
            </div>
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Link to Project</label>
              <select id="rfq-project" onchange="window.RFQPage.activeRFQ.projectId = this.value" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                ${projects.map(p => `<option value="${p.id}" ${rfq.projectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Material Category</label>
              <select id="rfq-category" onchange="window.RFQPage.onCategoryChange(this.value)" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                ${categories.map(c => `<option value="${c}" ${rfq.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Material Items List Section -->
          <div class="space-y-3">
            <div id="rfq-items-header-container"></div>
            <div id="rfq-items-list" class="space-y-3">
              <!-- Rendered dynamically by renderRFQItems() -->
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Notes / Special Instructions</label>
            <textarea id="rfq-notes" rows="3" placeholder="Specify polishing type, tolerance values, packing preferences..."
              oninput="window.RFQPage.activeRFQ.notes = this.value"
              class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500 resize-none">${rfq.notes}</textarea>
          </div>

          <!-- Vendor Selection Dropdown & Tags -->
          <div class="border border-border-color/40 rounded-lg p-3 space-y-2">
            <span class="block text-[10px] text-muted uppercase font-semibold mb-1">Notify Vendors Sourcing Category</span>
            <div class="flex flex-col md:flex-row gap-3">
              <select onchange="window.RFQPage.addVendorToRFQ(this.value); this.value = ''"
                class="w-full md:w-64 text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                <option value="">-- Choose Vendor to Notify --</option>
                ${vendors.map(v => `<option value="${v.name}">${v.name} (${v.category})</option>`).join('')}
                <option value="__custom__">-- Custom / Other Vendor --</option>
              </select>
              <!-- Selected Vendors Tags -->
              <div class="flex flex-wrap gap-1.5 items-center flex-1 min-h-[32px] p-2 bg-primary/20 border border-border-color/30 rounded-lg">
                ${(rfq.vendors || []).length === 0 ? `
                  <span class="text-[10px] text-muted italic">No vendors selected yet. Select from dropdown to notify.</span>
                ` : rfq.vendors.map(vName => `
                  <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    ${vName}
                    <button onclick="window.RFQPage.removeVendorFromRFQ('${vName}')" type="button" class="text-rose-500 hover:text-rose-400 font-extrabold text-xs" title="Remove">×</button>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 border-t border-border-color pt-4">
            <button onclick="window.RFQPage.cancelRFQForm()" class="px-4 py-2 bg-hover hover:bg-border-color border border-border-color text-white rounded">Cancel</button>
            <button onclick="window.RFQPage.saveRFQ()" class="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded flex items-center gap-1.5 transition-all hover:scale-105">
              <i data-lucide="save" class="w-3.5 h-3.5"></i> Save RFQ & Send
            </button>
          </div>
        </div>

      </div>
    `;
    this.renderRFQItems();
    if (window.lucide) lucide.createIcons();
  },

  onCategoryChange(val) {
    this.activeRFQ.category = val;
    const suggested = this.activeRFQ.entryMode === 'production' ? 'PCS' : this.suggestUnit(val);
    if (this.activeRFQ.items) {
      this.activeRFQ.items.forEach(item => {
        item.unit = suggested;
      });
    }
    this.saveDraft();
    this.renderRFQItems();
  },

  addItem() {
    if (!this.activeRFQ.items) this.activeRFQ.items = [];
    this.activeRFQ.items.push({
      description: '',
      qty: 1,
      unit: this.suggestUnit(this.activeRFQ.category),
      shutterWidthEnabled: false,
      shutterHeightEnabled: false,
      shutterDepthEnabled: false,
      shutterLengthEnabled: false,
      shutterWidth: 0,
      shutterHeight: 0,
      shutterDepth: 0,
      shutterLength: 0,
      shutterCount: 0
    });
    this.saveDraft();
    this.renderRFQItems();
  },

  removeItem(idx) {
    if (!this.activeRFQ.items) return;
    this.activeRFQ.items.splice(idx, 1);
    this.saveDraft();
    this.renderRFQItems();
  },

  renderRFQItems() {
    const container = document.getElementById('rfq-items-list');
    if (!container) return;

    const rfq = this.activeRFQ;
    const items = rfq.items || [];
    const units = ['SFT','Sheet','Roll','Meter','RFT','PCS','Set','KG','LTR','BOX'];

    if (rfq.entryMode === 'production') {
      // 1. Render dynamic items header
      const headerContainer = document.getElementById('rfq-items-header-container');
      if (headerContainer) {
        headerContainer.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-color/30 pb-2">
            <div>
              <span class="text-[10px] text-amber-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <i data-lucide="table-properties" class="w-4 h-4 text-amber-500"></i>
                Production Cutlist Items (${items.length})
              </span>
              <p class="text-[9px] text-secondary mt-0.5">Quickly manage factory production and shutter cutlists</p>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" onclick="window.RFQPage.toggleImportPanel()" class="px-2.5 py-1 bg-hover hover:bg-border-color border border-border-color/60 text-secondary hover:text-white text-[10px] font-bold rounded flex items-center gap-1.5 transition-all">
                <i data-lucide="clipboard-paste" class="w-3.5 h-3.5 text-amber-500"></i> Import / Paste
              </button>
              <button type="button" onclick="window.RFQPage.applyBulkRemarks()" class="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 text-purple-400 text-[10px] font-bold rounded flex items-center gap-1.5 transition-all">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Bulk Remarks
              </button>
              <button type="button" onclick="window.RFQPage.clearProductionList()" class="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-400 text-[10px] font-bold rounded flex items-center gap-1.5 transition-all">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Clear List
              </button>
              <button type="button" onclick="window.RFQPage.addProductionRow()" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1.5 transition-all hover:scale-105">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Row
              </button>
            </div>
          </div>
        `;
      }

      // 2. Render import panel if toggle is on
      const showImport = this.showImportPanel !== false;
      let importPanelHTML = '';
      if (showImport) {
        importPanelHTML = `
          <div class="bg-primary/30 border border-border-color/45 rounded-lg p-3.5 space-y-3.5 animate-fade-in text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="clipboard-paste" class="w-4 h-4 text-amber-400"></i> Bulk Paste / CSV Import
              </span>
              <button type="button" onclick="window.RFQPage.toggleImportPanel()" class="text-secondary hover:text-white" title="Hide Panel">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            
            <p class="text-[10px] text-secondary">
              Paste tabular lines from Excel/Sheets or comma/pipe separated text. Columns should be: <b class="text-white">Description | Width | Height | Qty | Remarks</b>
            </p>
            
            <textarea id="rfq-bulk-paste-input" rows="4" 
              placeholder="Tall Unit Shutter | 450 | 2093 | 1 | Remarks
Oven Top Shutter | 597 | 508 | 1
Drawer Facia | 794 | 333 | 2 | Soft close" 
              class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500 font-mono resize-none"></textarea>
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border-color/20 pt-2.5">
              <div class="flex items-center gap-2">
                <label class="px-2.5 py-1 bg-hover hover:bg-border-color border border-border-color rounded text-[10px] text-white font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload CSV File
                  <input type="file" id="rfq-csv-file-input" accept=".csv,.txt" class="hidden" onchange="window.RFQPage.importCSVFile(this)">
                </label>
                <span class="text-[9px] text-muted font-mono" id="csv-file-name"></span>
              </div>
              <div class="flex gap-2">
                <button type="button" onclick="window.RFQPage.importBulkText()" class="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1 shadow-md transition-all">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i> Parse & Populate
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // 3. Render dense Cutlist Table
      let tableHTML = `
        <div class="card overflow-hidden border border-border-color/40">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[9px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-3 py-2.5 w-10 text-center">#</th>
                  <th class="px-3 py-2.5">Description / Specification</th>
                  <th class="px-3 py-2.5 w-24">Width (mm)</th>
                  <th class="px-3 py-2.5 w-24">Height (mm)</th>
                  <th class="px-3 py-2.5 w-20">Qty (pcs)</th>
                  <th class="px-3 py-2.5">Remarks</th>
                  <th class="px-3 py-2.5 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-color/20">
                ${items.map((item, idx) => `
                  <tr class="hover:bg-hover/20 transition-colors">
                    <td class="px-3 py-2 font-mono text-muted text-center">${idx + 1}</td>
                    <td class="px-3 py-2">
                      <input type="text" value="${item.description || ''}" 
                        oninput="window.RFQPage.updateProductionRow(${idx}, 'description', this.value)"
                        placeholder="e.g. Shutter Description" 
                        class="w-full text-xs p-1 bg-transparent border border-transparent hover:border-border-color/30 focus:border-amber-500/80 rounded text-white focus:outline-none">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" value="${item.shutterWidth || ''}" 
                        oninput="window.RFQPage.updateProductionRow(${idx}, 'shutterWidth', this.value)"
                        placeholder="W" 
                        class="w-full text-xs p-1 bg-transparent border border-transparent hover:border-border-color/30 focus:border-amber-500/80 rounded text-white font-mono focus:outline-none">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" value="${item.shutterHeight || ''}" 
                        oninput="window.RFQPage.updateProductionRow(${idx}, 'shutterHeight', this.value)"
                        placeholder="H" 
                        class="w-full text-xs p-1 bg-transparent border border-transparent hover:border-border-color/30 focus:border-amber-500/80 rounded text-white font-mono focus:outline-none">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" value="${item.qty || ''}" 
                        oninput="window.RFQPage.updateProductionRow(${idx}, 'qty', this.value)"
                        placeholder="Qty" 
                        class="w-full text-xs p-1 bg-transparent border border-transparent hover:border-border-color/30 focus:border-amber-500/80 rounded text-white font-mono focus:outline-none">
                    </td>
                    <td class="px-3 py-2">
                      <input type="text" value="${item.remarks || item.notes || ''}" 
                        oninput="window.RFQPage.updateProductionRow(${idx}, 'remarks', this.value)"
                        placeholder="e.g. Edge polish" 
                        class="w-full text-xs p-1 bg-transparent border border-transparent hover:border-border-color/30 focus:border-amber-500/80 rounded text-white focus:outline-none">
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="flex gap-1 justify-end">
                        <button type="button" onclick="window.RFQPage.duplicateProductionRow(${idx})" class="p-1 hover:bg-hover border border-transparent hover:border-border-color/30 rounded text-secondary hover:text-white" title="Duplicate Row">
                          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                        <button type="button" onclick="window.RFQPage.deleteProductionRow(${idx})" class="p-1 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded text-rose-500" title="Delete Row">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = `
        <div class="space-y-4">
          ${importPanelHTML}
          ${tableHTML}
        </div>
      `;

    } else {
      // Standard RFQ Mode UI
      const headerContainer = document.getElementById('rfq-items-header-container');
      if (headerContainer) {
        headerContainer.innerHTML = `
          <div class="flex items-center justify-between border-b border-border-color/30 pb-2">
            <span class="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Material Items Sourced</span>
            <button type="button" onclick="window.RFQPage.addItem()" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1.5 transition-all hover:scale-105">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Item
            </button>
          </div>
        `;
      }

      const dimensionCategories = [
        'Modular Carcase Manufacturing',
        'Modular Shutters (Acrylic/PU/Glass)',
        'Modular Works (Carcase & Shutters)',
        'Carpentry & Framing',
        'Stone, Marble & Granite',
        'Quartz & Countertops',
        'Civil & Brick Masonry',
        'False Ceiling (Gypsum/Grid)',
        'Glass & Mirror Works',
        'Plywood, MDF & HDHMR Sourcing',
        'Veneers & Fluted Panels',
        'Laminates & Acrylic Slabs',
        'Glass', 'Mirror', 'Stone', 'Quartz', 'Granite', 'Marble', 'Veneer', 'Fluted Panels'
      ];
      const isDimensionCategory = dimensionCategories.includes(rfq.category);
      const keywords = ['shutter', 'glass', 'mirror', 'stone', 'plywood', 'laminate', 'veneer', 'quartz', 'marble', 'granite', 'board', 'hdhmr', 'mdf', 'ceiling', 'acrylic'];

      container.innerHTML = items.map((item, idx) => {
        const hasKeyword = keywords.some(k => (item.description || '').toLowerCase().includes(k));
        const isDimensionItem = isDimensionCategory || hasKeyword || item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled || item.showDimensionsPanel;
        
        return `
        <div class="bg-primary/40 border border-border-color/40 rounded-lg p-3 space-y-2 text-xs" id="rfq-item-${idx}">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-white">Item ${idx + 1}</span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="window.RFQPage.toggleDimensionsPanelForItem(${idx})" class="text-[10px] text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-0.5" title="Toggle Dimensions Input">
                <i data-lucide="ruler" class="w-3 h-3"></i> Dims
              </button>
              ${items.length > 1 ? `
                <button type="button" onclick="window.RFQPage.removeItem(${idx})" class="text-rose-500 hover:text-rose-400 p-0.5" title="Remove Item">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div class="col-span-1 md:col-span-2">
              <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Description / Specification</label>
              <input type="text" value="${item.description}" oninput="window.RFQPage.activeRFQ.items[${idx}].description = this.value; window.RFQPage.checkShowShutterForItem(${idx})"
                placeholder="e.g. Bronze Mirror 6mm" class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Qty</label>
                <input type="number" min="0" step="0.01" value="${item.qty}" id="rfq-qty-${idx}"
                  oninput="window.RFQPage.activeRFQ.items[${idx}].qty = parseFloat(this.value)||0;"
                  class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
              <div>
                <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Unit</label>
                <select onchange="window.RFQPage.activeRFQ.items[${idx}].unit = this.value; window.RFQPage.onShutterDimChangeForItem(${idx}); window.RFQPage.saveDraft();" class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
                  ${units.map(u => `<option value="${u}" ${item.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Shutter Calculations Sub-Panel for this item -->
          <div id="rfq-shutter-inputs-${idx}" class="${isDimensionItem ? '' : 'hidden'} mt-2 p-2.5 bg-primary/20 border border-amber-500/20 rounded-md space-y-2">
            <div class="flex items-center justify-between border-b border-border-color/20 pb-1.5 mb-1.5">
              <span class="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Shutter Calculations</span>
              <div class="relative w-36">
                <button type="button" onclick="window.RFQPage.toggleDimDropdownForItem(${idx})" class="w-full text-[10px] h-6 py-0 px-2 bg-secondary border border-border-color/60 rounded text-white flex items-center justify-between focus:outline-none">
                  <span>Select Dims...</span>
                  <i data-lucide="chevron-down" class="w-3 h-3 text-muted"></i>
                </button>
                <div id="rfq-dim-dropdown-${idx}" class="hidden absolute right-0 top-7 bg-secondary border border-border-color rounded shadow-2xl p-2 z-50 space-y-1.5 w-36 text-white text-[10px]">
                  <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                    <input type="checkbox" onchange="window.RFQPage.onDimensionToggleForItem(${idx}, 'width', this.checked)" ${item.shutterWidthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                    <span>Width</span>
                  </label>
                  <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                    <input type="checkbox" onchange="window.RFQPage.onDimensionToggleForItem(${idx}, 'height', this.checked)" ${item.shutterHeightEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                    <span>Height</span>
                  </label>
                  <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                    <input type="checkbox" onchange="window.RFQPage.onDimensionToggleForItem(${idx}, 'depth', this.checked)" ${item.shutterDepthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                    <span>Depth</span>
                  </label>
                  <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                    <input type="checkbox" onchange="window.RFQPage.onDimensionToggleForItem(${idx}, 'length', this.checked)" ${item.shutterLengthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                    <span>Length</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div id="rfq-shutter-w-div-${idx}" class="${item.shutterWidthEnabled ? '' : 'hidden'}">
                <label class="text-[8px] text-muted uppercase block mb-0.5">Width (mm)</label>
                <input type="number" min="0" value="${item.shutterWidth || ''}" id="rfq-shutter-w-${idx}"
                  oninput="window.RFQPage.onShutterDimChangeForItem(${idx})" placeholder="W mm"
                  class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
              <div id="rfq-shutter-h-div-${idx}" class="${item.shutterHeightEnabled ? '' : 'hidden'}">
                <label class="text-[8px] text-muted uppercase block mb-0.5">Height (mm)</label>
                <input type="number" min="0" value="${item.shutterHeight || ''}" id="rfq-shutter-h-${idx}"
                  oninput="window.RFQPage.onShutterDimChangeForItem(${idx})" placeholder="H mm"
                  class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
              <div id="rfq-shutter-d-div-${idx}" class="${item.shutterDepthEnabled ? '' : 'hidden'}">
                <label class="text-[8px] text-muted uppercase block mb-0.5">Depth (mm)</label>
                <input type="number" min="0" value="${item.shutterDepth || ''}" id="rfq-shutter-d-${idx}"
                  oninput="window.RFQPage.onShutterDimChangeForItem(${idx})" placeholder="D mm"
                  class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
              <div id="rfq-shutter-l-div-${idx}" class="${item.shutterLengthEnabled ? '' : 'hidden'}">
                <label class="text-[8px] text-muted uppercase block mb-0.5">Length (mm)</label>
                <input type="number" min="0" value="${item.shutterLength || ''}" id="rfq-shutter-l-${idx}"
                  oninput="window.RFQPage.onShutterDimChangeForItem(${idx})" placeholder="L mm"
                  class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
              <div id="rfq-shutter-count-div-${idx}" class="${(item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled) ? '' : 'hidden'}">
                <label class="text-[8px] text-muted uppercase block mb-0.5">Count</label>
                <input type="number" min="0" value="${item.shutterCount || ''}" id="rfq-shutter-c-${idx}"
                  oninput="window.RFQPage.onShutterDimChangeForItem(${idx})" placeholder="Count"
                  class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              </div>
            </div>
          </div>
        </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  },

  setEntryMode(mode) {
    if (!this.activeRFQ) return;
    this.activeRFQ.entryMode = mode;
    if (mode === 'production' && this.activeRFQ.items) {
      this.activeRFQ.items.forEach(item => {
        item.unit = 'PCS';
        item.shutterWidthEnabled = true;
        item.shutterHeightEnabled = true;
        item.shutterCount = item.qty;
      });
    }
    this.saveDraft();
    this.renderCreateOrEdit(document.getElementById('main-content-container'));
  },

  toggleImportPanel() {
    this.showImportPanel = this.showImportPanel === false ? true : false;
    this.renderRFQItems();
  },

  updateProductionRow(idx, field, val) {
    const item = this.activeRFQ.items[idx];
    if (!item) return;

    if (field === 'qty') {
      const num = parseFloat(val) || 0;
      item.qty = num;
      item.shutterCount = num;
    } else if (field === 'shutterWidth') {
      item.shutterWidth = parseFloat(val) || 0;
    } else if (field === 'shutterHeight') {
      item.shutterHeight = parseFloat(val) || 0;
    } else if (field === 'remarks') {
      item.remarks = val;
      item.notes = val;
    } else {
      item[field] = val;
    }
    this.saveDraft();
  },

  addProductionRow() {
    if (!this.activeRFQ.items) this.activeRFQ.items = [];
    this.activeRFQ.items.push({
      category: this.activeRFQ.category,
      description: '',
      qty: 1,
      unit: 'PCS',
      shutterWidthEnabled: true,
      shutterHeightEnabled: true,
      shutterWidth: 0,
      shutterHeight: 0,
      shutterCount: 1,
      remarks: '',
      notes: ''
    });
    this.saveDraft();
    this.renderRFQItems();
  },

  deleteProductionRow(idx) {
    if (!this.activeRFQ.items) return;
    if (this.activeRFQ.items.length <= 1) {
      this.activeRFQ.items = [{
        category: this.activeRFQ.category,
        description: '',
        qty: 1,
        unit: 'PCS',
        shutterWidthEnabled: true,
        shutterHeightEnabled: true,
        shutterWidth: 0,
        shutterHeight: 0,
        shutterCount: 1,
        remarks: '',
        notes: ''
      }];
    } else {
      this.activeRFQ.items.splice(idx, 1);
    }
    this.saveDraft();
    this.renderRFQItems();
  },

  duplicateProductionRow(idx) {
    if (!this.activeRFQ.items) return;
    const item = this.activeRFQ.items[idx];
    const copy = JSON.parse(JSON.stringify(item));
    this.activeRFQ.items.splice(idx + 1, 0, copy);
    this.saveDraft();
    this.renderRFQItems();
  },

  clearProductionList() {
    if (!confirm("Are you sure you want to clear all rows?")) return;
    this.activeRFQ.items = [{
      category: this.activeRFQ.category,
      description: '',
      qty: 1,
      unit: 'PCS',
      shutterWidthEnabled: true,
      shutterHeightEnabled: true,
      shutterWidth: 0,
      shutterHeight: 0,
      shutterCount: 1,
      remarks: '',
      notes: ''
    }];
    this.saveDraft();
    this.renderRFQItems();
  },

  applyBulkRemarks() {
    const val = prompt("Enter remarks to apply to all items:");
    if (val === null) return;
    if (this.activeRFQ.items) {
      this.activeRFQ.items.forEach(item => {
        item.remarks = val.trim();
        item.notes = val.trim();
      });
    }
    this.saveDraft();
    this.renderRFQItems();
  },

  splitCSVLine(text) {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry);
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry);
    return result;
  },

  importBulkText() {
    const textarea = document.getElementById('rfq-bulk-paste-input');
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) {
      window.ModalComponent.showToast("Please paste or type some data first.");
      return;
    }

    const lines = text.split('\n');
    const newItems = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      let parts = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('|')) {
        parts = line.split('|');
      } else {
        parts = line.split(',');
      }
      parts = parts.map(p => p.trim());

      const description = parts[0] || '';
      const width = parseFloat(parts[1]) || 0;
      const height = parseFloat(parts[2]) || 0;
      const qty = parseFloat(parts[3]) || 1;
      const remarks = parts[4] || '';

      if (description) {
        newItems.push({
          category: this.activeRFQ.category,
          description: description,
          qty: qty,
          unit: 'PCS',
          shutterWidthEnabled: true,
          shutterHeightEnabled: true,
          shutterWidth: width,
          shutterHeight: height,
          shutterCount: qty,
          remarks: remarks,
          notes: remarks
        });
      }
    });

    if (newItems.length > 0) {
      if (!this.activeRFQ.items) this.activeRFQ.items = [];
      if (this.activeRFQ.items.length === 1 && !this.activeRFQ.items[0].description && !this.activeRFQ.items[0].shutterWidth) {
        this.activeRFQ.items = newItems;
      } else {
        this.activeRFQ.items = this.activeRFQ.items.concat(newItems);
      }
      textarea.value = '';
      this.saveDraft();
      this.renderRFQItems();
      window.ModalComponent.showToast(`Successfully imported ${newItems.length} items.`);
    } else {
      window.ModalComponent.showToast("No items could be parsed. Check columns layout.");
    }
  },

  importCSVFile(input) {
    const file = input.files[0];
    if (!file) return;

    const fileNameEl = document.getElementById('csv-file-name');
    if (fileNameEl) fileNameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      const lines = contents.split(/\r?\n/);
      const newItems = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        if (idx === 0 && (line.toLowerCase().includes('description') || line.toLowerCase().includes('width') || line.toLowerCase().includes('height'))) {
          return;
        }

        let parts = [];
        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes('|')) {
          parts = line.split('|');
        } else {
          parts = this.splitCSVLine(line);
        }
        parts = parts.map(p => p.trim().replace(/^["']|["']$/g, '').trim());

        const description = parts[0] || '';
        const width = parseFloat(parts[1]) || 0;
        const height = parseFloat(parts[2]) || 0;
        const qty = parseFloat(parts[3]) || 1;
        const remarks = parts[4] || '';

        if (description) {
          newItems.push({
            category: this.activeRFQ.category,
            description: description,
            qty: qty,
            unit: 'PCS',
            shutterWidthEnabled: true,
            shutterHeightEnabled: true,
            shutterWidth: width,
            shutterHeight: height,
            shutterCount: qty,
            remarks: remarks,
            notes: remarks
          });
        }
      });

      if (newItems.length > 0) {
        if (!this.activeRFQ.items) this.activeRFQ.items = [];
        if (this.activeRFQ.items.length === 1 && !this.activeRFQ.items[0].description && !this.activeRFQ.items[0].shutterWidth) {
          this.activeRFQ.items = newItems;
        } else {
          this.activeRFQ.items = this.activeRFQ.items.concat(newItems);
        }
        this.saveDraft();
        this.renderRFQItems();
        window.ModalComponent.showToast(`Successfully imported ${newItems.length} items from file.`);
      } else {
        window.ModalComponent.showToast("Could not parse any rows from the file.");
      }
      input.value = '';
      if (fileNameEl) fileNameEl.textContent = '';
    };
    reader.readAsText(file);
  },

  toggleDimDropdownForItem(idx) {
    const dropdown = document.getElementById(`rfq-dim-dropdown-${idx}`);
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  onDimensionToggleForItem(idx, dimKey, isChecked) {
    const item = this.activeRFQ.items[idx];
    if (!item) return;

    if (dimKey === 'width') {
      item.shutterWidthEnabled = isChecked;
      if (!isChecked) item.shutterWidth = 0;
    } else if (dimKey === 'height') {
      item.shutterHeightEnabled = isChecked;
      if (!isChecked) item.shutterHeight = 0;
    } else if (dimKey === 'depth') {
      item.shutterDepthEnabled = isChecked;
      if (!isChecked) item.shutterDepth = 0;
    } else if (dimKey === 'length') {
      item.shutterLengthEnabled = isChecked;
      if (!isChecked) item.shutterLength = 0;
    }

    const wDiv = document.getElementById(`rfq-shutter-w-div-${idx}`);
    const hDiv = document.getElementById(`rfq-shutter-h-div-${idx}`);
    const dDiv = document.getElementById(`rfq-shutter-d-div-${idx}`);
    const lDiv = document.getElementById(`rfq-shutter-l-div-${idx}`);
    const countDiv = document.getElementById(`rfq-shutter-count-div-${idx}`);

    if (wDiv) item.shutterWidthEnabled ? wDiv.classList.remove('hidden') : wDiv.classList.add('hidden');
    if (hDiv) item.shutterHeightEnabled ? hDiv.classList.remove('hidden') : hDiv.classList.add('hidden');
    if (dDiv) item.shutterDepthEnabled ? dDiv.classList.remove('hidden') : dDiv.classList.add('hidden');
    if (lDiv) item.shutterLengthEnabled ? lDiv.classList.remove('hidden') : lDiv.classList.add('hidden');

    const anyEnabled = item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled;
    if (countDiv) anyEnabled ? countDiv.classList.remove('hidden') : countDiv.classList.add('hidden');

    this.onShutterDimChangeForItem(idx);
  },

  onShutterDimChangeForItem(idx) {
    const item = this.activeRFQ.items[idx];
    if (!item) return;

    const w = item.shutterWidthEnabled ? (parseFloat(document.getElementById(`rfq-shutter-w-${idx}`)?.value) || 0) : 0;
    const h = item.shutterHeightEnabled ? (parseFloat(document.getElementById(`rfq-shutter-h-${idx}`)?.value) || 0) : 0;
    const d = item.shutterDepthEnabled ? (parseFloat(document.getElementById(`rfq-shutter-d-${idx}`)?.value) || 0) : 0;
    const l = item.shutterLengthEnabled ? (parseFloat(document.getElementById(`rfq-shutter-l-${idx}`)?.value) || 0) : 0;
    const c = parseInt(document.getElementById(`rfq-shutter-c-${idx}`)?.value) || 0;

    item.shutterWidth = w;
    item.shutterHeight = h;
    item.shutterDepth = d;
    item.shutterLength = l;
    item.shutterCount = c;

    const activeValues = [];
    if (item.shutterWidthEnabled && w > 0) activeValues.push(w);
    if (item.shutterHeightEnabled && h > 0) activeValues.push(h);
    if (item.shutterDepthEnabled && d > 0) activeValues.push(d);
    if (item.shutterLengthEnabled && l > 0) activeValues.push(l);

    if (c > 0 && (activeValues.length > 0 || item.unit === 'PCS')) {
      let qty = 0;
      if (item.unit === 'PCS') {
        qty = c;
      } else {
        if (activeValues.length === 2) {
          qty = parseFloat(((activeValues[0] * activeValues[1] * c) / 92903.04).toFixed(2));
        } else if (activeValues.length === 1) {
          qty = parseFloat(((activeValues[0] * c) / 304.8).toFixed(2));
        } else if (activeValues.length === 3) {
          qty = parseFloat(((activeValues[0] * activeValues[1] * activeValues[2] * c) / 28316846.59).toFixed(2));
        }
      }
      if (qty > 0) {
        item.qty = qty;
        const qtyEl = document.getElementById(`rfq-qty-${idx}`);
        if (qtyEl) qtyEl.value = qty;
      }
    }

    this.saveDraft();
  },

  checkShowShutterForItem(idx) {
    const item = this.activeRFQ.items[idx];
    if (!item) return;
    const dimensionCategories = [
      'Modular Carcase Manufacturing',
      'Modular Shutters (Acrylic/PU/Glass)',
      'Modular Works (Carcase & Shutters)',
      'Carpentry & Framing',
      'Stone, Marble & Granite',
      'Quartz & Countertops',
      'Civil & Brick Masonry',
      'False Ceiling (Gypsum/Grid)',
      'Glass & Mirror Works',
      'Plywood, MDF & HDHMR Sourcing',
      'Veneers & Fluted Panels',
      'Laminates & Acrylic Slabs',
      'Glass', 'Mirror', 'Stone', 'Quartz', 'Granite', 'Marble', 'Veneer', 'Fluted Panels'
    ];
    const isDimensionCategory = dimensionCategories.includes(this.activeRFQ.category);
    const keywords = ['shutter', 'glass', 'mirror', 'stone', 'plywood', 'laminate', 'veneer', 'quartz', 'marble', 'granite', 'board', 'hdhmr', 'mdf', 'ceiling', 'acrylic'];
    const hasKeyword = keywords.some(k => (item.description || '').toLowerCase().includes(k));
    const isDimensionItem = isDimensionCategory || hasKeyword || item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled || item.showDimensionsPanel;

    const div = document.getElementById(`rfq-shutter-inputs-${idx}`);
    if (div) {
      if (isDimensionItem) {
        div.classList.remove('hidden');
        if (item.shutterWidthEnabled === undefined && item.shutterHeightEnabled === undefined) {
          item.shutterWidthEnabled = true;
          item.shutterHeightEnabled = true;
          this.renderRFQItems();
        }
      } else {
        div.classList.add('hidden');
      }
    }
  },

  toggleVendorSelection(vendorName, isChecked) {
    if (!this.activeRFQ.vendors) this.activeRFQ.vendors = [];
    if (isChecked) {
      if (!this.activeRFQ.vendors.includes(vendorName)) {
        this.activeRFQ.vendors.push(vendorName);
      }
    } else {
      this.activeRFQ.vendors = this.activeRFQ.vendors.filter(v => v !== vendorName);
    }
  },

  // ── Save RFQ ─────────────────────────────────────
  saveRFQ() {
    const store = window.AppStore;
    const projects = store.state.projects || [];
    const rfq = this.activeRFQ;

    if (!rfq.items || rfq.items.length === 0) { window.ModalComponent.showToast('Please add at least one line item.'); return; }
    const hasValid = rfq.items.some(i => i.description?.trim() && i.qty > 0);
    if (!hasValid) { window.ModalComponent.showToast('Please fill in at least one complete line item.'); return; }
    if (!rfq.vendors || rfq.vendors.length === 0) { window.ModalComponent.showToast('Please select at least one vendor to notify.'); return; }

    const isEdit = this.viewMode === 'edit';
    const project = projects.find(p => p.id === rfq.projectId);
    rfq.projectName = project?.name || 'Unknown Project';

    rfq.items.forEach(item => {
      item.category = rfq.category;
    });

    if (!rfq.history) rfq.history = [];

    if (isEdit) {
      rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `RFQ details updated with ${rfq.items.length} items. Vendors list: ${rfq.vendors.join(', ')}` });
      const idx = store.state.rfqs.findIndex(r => r.id === rfq.id);
      if (idx !== -1) store.state.rfqs[idx] = rfq;
    } else {
      rfq.id = `rfq-${Date.now()}`;
      rfq.createdAt = new Date().toISOString().split('T')[0];
      rfq.status = 'Sent'; // Automatically mark as Sent upon creation
      rfq.history.push({ date: rfq.createdAt, text: `RFQ initialized with ${rfq.items.length} items and dispatched to: ${rfq.vendors.join(', ')}` });
      store.state.rfqs.unshift(rfq);
    }

    store.saveState();
    window.ModalComponent.showToast(`RFQ ${rfq.rfqNumber} saved successfully.`);
    this.clearDraft();
    const returnProjId = this.returnToProcurementProjectId;
    this.returnToProcurementProjectId = null;
    this.viewMode = 'list';
    this.activeRFQId = null;
    this.activeRFQ = null;
    if (returnProjId) {
      window.ProcurementPage.activeProjectId = returnProjId;
      window.ProcurementPage.activeTab = 'rfqs';
      window.AppRouter.navigate('procurement');
    } else {
      window.AppRouter.refresh();
    }
  },

  // ── Delete RFQ ───────────────────────────────────
  async deleteRFQ(rfqId) {
    const rfq = (window.AppStore.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;
    if (!confirm(`Are you sure you want to permanently delete RFQ ${rfq.rfqNumber}?`)) return;

    await window.dbService.deleteRFQ(rfqId);
    window.ModalComponent.showToast(`RFQ deleted.`);
    window.AppRouter.refresh();
  },

  // ── Open Detail / Comparison View ────────────────
  openDetail(rfqId) {
    this.activeRFQId = rfqId;
    this.viewMode = 'detail';
    window.AppRouter.refresh();
  },

  // ── Render RFQ Detail / Vendor Comparison Matrix ──
  renderDetail(container) {
    const store = window.AppStore;
    const role = store.activeRole;
    const rfq = (store.state.rfqs || []).find(r => r.id === this.activeRFQId);
    if (!rfq) {
      this.viewMode = 'list';
      return this.renderList(container);
    }

    const cfg = this.statusConfig(rfq.status);
    const statuses = ['Draft', 'Sent', 'Quote Received', 'Under Review', 'Approved', 'Rejected'];
    const vendors = store.state.vendors || [];

    // Calculate best deals
    const validQuotes = rfq.quotes || [];
    const totalsList = validQuotes.map(q => {
      let sub = 0;
      if (q.rates && q.rates.length > 0) {
        sub = rfq.items.reduce((sum, item, itemIdx) => sum + ((q.rates[itemIdx] || 0) * (item.qty || 0)), 0);
      } else {
        sub = (q.rate || 0) * rfq.qty;
      }
      const gstAmt = sub * (q.gst || 0) / 100;
      return sub + gstAmt + (q.additionalCharges || 0);
    });
    const lowestTotal = totalsList.length > 0 ? Math.min(...totalsList) : 0;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-5 animate-fade-in">

        <!-- Back + Header -->
        <div class="flex flex-col md:flex-row md:items-center gap-3 border-b border-border-color pb-4">
          <div class="flex items-center gap-3 flex-1">
            <button onclick="window.RFQPage.viewMode='list'; window.RFQPage.activeRFQId=null; window.AppRouter.refresh()" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Back">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h1 class="text-base font-bold text-white font-display">${rfq.rfqNumber}</h1>
              <p class="text-xs text-secondary mt-0.5">${rfq.projectName}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded border text-xs font-mono uppercase font-bold ${cfg.color}">${rfq.status}</span>
            ${role === 'admin' ? `
              <button onclick="window.RFQPage.printRFQ('${rfq.id}')" class="p-2 bg-hover border border-border-color rounded text-white" title="Print RFQ PDF">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button onclick="window.RFQPage.openEditView('${rfq.id}')" class="p-2 bg-hover border border-border-color rounded text-white hover:border-amber-500/40" title="Edit">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- RFQ Details Card -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4 space-y-3 text-xs md:col-span-2">
            <span class="text-[9px] text-muted uppercase font-semibold">Material Specification details</span>
            <div class="grid grid-cols-2 gap-3 border-b border-border-color/30 pb-3">
              <div><span class="text-secondary block">Category</span><span class="text-white font-bold">${rfq.category}</span></div>
            </div>
            
            <!-- Materials List -->
            <div class="space-y-2 border-b border-border-color/30 pb-3">
              <span class="text-secondary block font-bold mb-1">Items in this RFQ:</span>
              <div class="space-y-2">
                ${(rfq.items || []).map((item, idx) => {
                  const dimStr = window.formatShutterDims(item);
                  return `
                    <div class="bg-primary/20 border border-border-color/30 p-2.5 rounded-md text-xs">
                      <div class="flex justify-between font-semibold text-white">
                        <span>${idx + 1}. ${item.description}</span>
                        <span class="font-mono text-amber-500">${item.qty} ${item.unit}</span>
                      </div>
                      ${dimStr ? `<div class="text-[10px] text-amber-500/80 font-mono mt-1">${dimStr}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div>
              <span class="text-secondary block">Requested Vendors</span>
              <div class="flex flex-wrap gap-1 mt-1">
                ${rfq.vendors.map(v => {
                  const hasSubmitted = rfq.quotes?.some(q => q.vendorName === v);
                  return `
                    <span class="px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5 ${hasSubmitted ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'}">
                       ${v}
                      <button onclick="window.RFQPage.shareWhatsAppToVendor('${rfq.id}', '${v}')" class="text-emerald-400 hover:text-emerald-300" title="Send RFQ Summary via WhatsApp">
                        <i data-lucide="phone" class="w-3 h-3 inline"></i>
                      </button>
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
            ${rfq.notes ? `
              <div>
                <span class="text-secondary block">Instructions</span>
                <p class="text-white italic leading-relaxed">"${rfq.notes}"</p>
              </div>
            ` : ''}
          </div>

          <!-- Status Progression (Admin Only) -->
          <div class="card p-4 space-y-3 text-xs">
            <span class="text-[9px] text-muted uppercase font-semibold">Update Status</span>
            <div class="flex flex-col gap-1.5">
              ${role === 'admin' ? statuses.map(s => {
                const isActive = rfq.status === s;
                const c = this.statusConfig(s);
                return `
                  <button onclick="window.RFQPage.updateStatus('${rfq.id}', '${s}')"
                    class="w-full px-3 py-1.5 rounded text-left font-bold border transition-all flex items-center justify-between ${isActive ? c.color : 'bg-hover text-secondary border-border-color/30 hover:text-white'}">
                    <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${c.dot}"></span>${s}</span>
                    ${isActive ? '✓' : ''}
                  </button>
                `;
              }).join('') : `<p class="text-muted">You are logged in as read-only. Status changes restricted.</p>`}
            </div>
          </div>
        </div>

        <!-- Quote Comparison & Vendor Selection -->
        <div class="card p-5 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-color/30 pb-3">
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="trello" class="w-4 h-4 text-purple-400"></i> Vendor Quote Comparison Table
              </h3>
              <p class="text-[9px] text-secondary mt-0.5">Compare pricing lists side-by-side</p>
            </div>
            ${role === 'admin' && !rfq.convertedToPO ? `
              <button onclick="document.getElementById('add-quote-section').classList.toggle('hidden')" class="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded border border-purple-500/20 flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Quote Received
              </button>
            ` : ''}
          </div>

          <!-- Add Quote Inline Form (Hidden by default) -->
          <div id="add-quote-section" class="hidden bg-primary/30 border border-border-color/40 rounded-lg p-4 space-y-3">
            <span class="text-[10px] text-purple-400 font-bold uppercase block">Log Sourced Quotation</span>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label class="text-[9px] text-muted block mb-0.5">Select Vendor</label>
                <select id="q-vendor" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  ${rfq.vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
                  <option value="other">-- Custom Vendor Name --</option>
                </select>
              </div>
              <div id="custom-vendor-div" class="hidden">
                <label class="text-[9px] text-muted block mb-0.5">Custom Vendor Name</label>
                <input type="text" id="q-vendor-custom" placeholder="XYZ Stores" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
              </div>
              <div>
                <label class="text-[9px] text-muted block mb-0.5">GST %</label>
                <input type="number" id="q-gst" value="18" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
              </div>
              <div>
                <label class="text-[9px] text-muted block mb-0.5">Additional Charges (₹)</label>
                <input type="number" id="q-charges" value="0" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
              </div>
            </div>
            <div class="border-t border-border-color/20 pt-2 space-y-2">
              <span class="text-[9px] text-muted uppercase block font-semibold mb-1">Rates Quoted per Item</span>
              <div class="space-y-2 bg-primary/20 p-2.5 rounded-lg border border-border-color/30">
                ${(rfq.items || []).map((item, idx) => `
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs py-1 border-b border-border-color/10 last:border-b-0">
                    <span class="font-semibold text-white flex-1">${idx + 1}. ${item.description} (${item.qty} ${item.unit})</span>
                    <div class="w-full md:w-32">
                      <input type="number" step="0.01" id="q-rate-${idx}" placeholder="Rate (₹)" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div>
              <label class="text-[9px] text-muted block mb-0.5">Remarks / Remarks from quotation</label>
              <input type="text" id="q-notes" placeholder="e.g. Price includes loading charges. Valid for 10 days." class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button onclick="document.getElementById('add-quote-section').classList.add('hidden')" class="px-3 py-1.5 bg-primary text-white border border-border-color rounded">Cancel</button>
              <button onclick="window.RFQPage.saveQuoteReceived('${rfq.id}')" class="px-4 py-1.5 bg-purple-500 text-white rounded font-bold">Save Quotation</button>
            </div>
          </div>

          <!-- Quotations List Table -->
          ${validQuotes.length === 0 ? `
            <div class="p-8 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
              <i data-lucide="table-properties" class="w-8 h-8 text-muted mx-auto mb-2"></i>
              No vendor quotations logged yet. Log quotation entries using the button above to generate a comparison chart.
            </div>
          ` : `
            <div class="overflow-x-auto border border-border-color/30 rounded-lg">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-border-color bg-primary/40 text-[9px] text-secondary uppercase font-semibold font-mono">
                    <th class="px-3 py-2">Vendor Name</th>
                    <th class="px-3 py-2 text-right">Unit Rate</th>
                    <th class="px-3 py-2 text-right">Subtotal</th>
                    <th class="px-3 py-2 text-right">GST %</th>
                    <th class="px-3 py-2 text-right">Extra Charges</th>
                    <th class="px-3 py-2 text-right font-bold">Grand Total</th>
                    <th class="px-3 py-2">Vendor Remarks</th>
                    <th class="px-3 py-2 text-center">Winning Bid</th>
                    ${role === 'admin' && !rfq.convertedToPO ? `<th class="px-3 py-2 text-right">Actions</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${validQuotes.map((q, idx) => {
                    let sub = 0;
                    if (q.rates && q.rates.length > 0) {
                      sub = rfq.items.reduce((sum, item, itemIdx) => sum + ((q.rates[itemIdx] || 0) * (item.qty || 0)), 0);
                    } else {
                      sub = (q.rate || 0) * (rfq.qty || 1);
                    }
                    const gstAmt = sub * (q.gst || 0) / 100;
                    const total = sub + gstAmt + (q.additionalCharges || 0);
                    const isLowest = total === lowestTotal;
                    const isSelected = rfq.selectedVendor === q.vendorName;

                    let rateDisplay = '';
                    if (rfq.items && rfq.items.length > 1) {
                      rateDisplay = `<div class="space-y-1 text-[10px]">` + 
                        rfq.items.map((item, itemIdx) => {
                          const r = q.rates ? (q.rates[itemIdx] || 0) : (q.rate || 0);
                          return `<div class="text-right font-mono">${window.Utils.formatCurrency(r)} <span class="text-muted">(${item.unit})</span></div>`;
                        }).join('') + `</div>`;
                    } else {
                      const r = q.rates ? (q.rates[0] || 0) : (q.rate || 0);
                      const u = rfq.items?.[0]?.unit || rfq.unit || 'PCS';
                      rateDisplay = `<span class="font-mono">${window.Utils.formatCurrency(r)}</span> <span class="text-muted">/ ${u}</span>`;
                    }

                    return `
                      <tr class="border-b border-border-color/30 hover:bg-hover/20 ${isSelected ? 'bg-amber-500/5' : ''}">
                        <td class="px-3 py-2.5 font-bold text-white flex items-center gap-1">
                          ${q.vendorName}
                          ${isLowest ? `<span class="px-1 text-[7px] bg-emerald-500/20 text-emerald-400 font-extrabold uppercase rounded" title="Lowest overall bid">Best Price</span>` : ''}
                        </td>
                        <td class="px-3 py-2.5 text-right font-mono text-white">${rateDisplay}</td>
                        <td class="px-3 py-2.5 text-right font-mono text-secondary">${window.Utils.formatCurrency(sub)}</td>
                        <td class="px-3 py-2.5 text-right font-mono text-secondary">${q.gst || 0}%</td>
                        <td class="px-3 py-2.5 text-right font-mono text-secondary">${window.Utils.formatCurrency(q.additionalCharges || 0)}</td>
                        <td class="px-3 py-2.5 text-right font-mono font-bold text-amber-500">${window.Utils.formatCurrency(total)}</td>
                        <td class="px-3 py-2.5 text-secondary truncate max-w-[150px]" title="${q.notes || ''}">${q.notes || '—'}</td>
                        <td class="px-3 py-2.5 text-center">
                          ${rfq.convertedToPO ? `
                            ${isSelected ? `<span class="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400">Selected Winner</span>` : `<span class="text-muted text-[10px]">—</span>`}
                          ` : `
                            <button onclick="window.RFQPage.selectWinnerVendor('${rfq.id}', '${q.vendorName}')"
                              class="px-2 py-1 text-[9px] font-bold rounded border transition-all ${isSelected ? 'bg-amber-500 text-black border-amber-400' : 'bg-primary text-secondary border-border-color hover:text-white'}">
                              ${isSelected ? '✓ Selected' : 'Choose Bid'}
                            </button>
                          `}
                        </td>
                        ${role === 'admin' && !rfq.convertedToPO ? `
                          <td class="px-3 py-2.5 text-right">
                            <button onclick="window.RFQPage.deleteQuote('${rfq.id}', ${idx})" class="p-1 hover:bg-rose-500/10 rounded text-rose-500" title="Delete Quote">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </td>
                        ` : ''}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- PO Conversion Section -->
        ${rfq.selectedVendor ? `
          <div class="card p-4 border border-amber-500/30 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">Vendor Selection Approved</span>
              <p class="text-xs text-white">Winning Bid: <b class="text-amber-400 font-bold">${rfq.selectedVendor}</b>. Ready for purchase execution.</p>
            </div>
            <div>
              ${rfq.convertedToPO ? `
                <button onclick="window.POPage.activePOId='${rfq.poId}'; window.POPage.viewMode='detail'; window.AppRouter.navigate('pos')"
                  class="px-4 py-2 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-400 font-bold text-xs rounded border border-emerald-500/30 flex items-center gap-1.5 shadow-sm transition-all hover:scale-105">
                  <i data-lucide="check-circle" class="w-4 h-4"></i> View Purchase Order
                </button>
              ` : `
                ${role === 'admin' ? `
                  <button onclick="window.RFQPage.convertToPO('${rfq.id}')"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded flex items-center gap-1.5 shadow-md transition-all hover:scale-105">
                    <i data-lucide="arrow-right-left" class="w-4 h-4"></i> Convert to Purchase Order
                  </button>
                ` : ''}
              `}
            </div>
          </div>
        ` : ''}

        <!-- RFQ History Logs -->
        <div class="card p-4 space-y-2">
          <span class="text-[9px] text-muted uppercase font-semibold block border-b border-border-color/30 pb-2">RFQ Activity Tracking History</span>
          <div class="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
            ${(rfq.history || [
              { date: rfq.createdAt, text: "RFQ created and logged." }
            ]).map(h => `
              <div class="border-l border-border-color/60 pl-2 ml-1 text-xs">
                <span class="text-muted text-[10px] font-mono block">${window.Utils.formatDate(h.date)}</span>
                <span class="text-secondary">${h.text}</span>
              </div>
            `).reverse().join('')}
          </div>
        </div>

      </div>
    `;

    // Watch custom vendor selector
    const vSel = document.getElementById('q-vendor');
    if (vSel) {
      vSel.addEventListener('change', (e) => {
        const div = document.getElementById('custom-vendor-div');
        if (e.target.value === 'other') {
          div.classList.remove('hidden');
        } else {
          div.classList.add('hidden');
        }
      });
    }

    if (window.lucide) lucide.createIcons();
  },

  // ── Sourcing Quotation Save Handler ───────────────
  saveQuoteReceived(rfqId) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    const vendorSel = document.getElementById('q-vendor').value;
    const vendorCustom = document.getElementById('q-vendor-custom').value.trim();
    const gst = parseFloat(document.getElementById('q-gst').value) || 0;
    const charges = parseFloat(document.getElementById('q-charges').value) || 0;
    const notes = document.getElementById('q-notes').value.trim();

    const vendorName = vendorSel === 'other' ? vendorCustom : vendorSel;

    if (!vendorName) { window.ModalComponent.showToast('Please specify a vendor name.'); return; }

    const rates = [];
    let hasInvalidRate = false;
    (rfq.items || []).forEach((item, idx) => {
      const inputEl = document.getElementById(`q-rate-${idx}`);
      const rateVal = parseFloat(inputEl ? inputEl.value : '');
      if (isNaN(rateVal) || rateVal < 0) {
        hasInvalidRate = true;
      }
      rates.push(rateVal || 0);
    });

    if (hasInvalidRate) {
      window.ModalComponent.showToast('Please enter a valid rate for all items.');
      return;
    }

    const quote = {
      vendorName,
      rates,
      rate: rates[0] || 0, // Fallback for legacy compatibility
      gst,
      additionalCharges: charges,
      notes: notes || 'No special remarks.',
      submittedAt: new Date().toISOString().split('T')[0]
    };

    if (!rfq.quotes) rfq.quotes = [];
    rfq.quotes.push(quote);

    // Automatically transition status to Quote Received
    if (rfq.status === 'Draft' || rfq.status === 'Sent') {
      rfq.status = 'Quote Received';
    }

    if (!rfq.history) rfq.history = [];
    rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `Logged bid from ${vendorName} with ${rates.length} item rates.` });

    store.saveState();
    window.ModalComponent.showToast(`Quotation from ${vendorName} logged successfully!`);
    window.AppRouter.refresh();
  },

  // ── Winner Selection Handler ──────────────────────
  selectWinnerVendor(rfqId, vendorName) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    rfq.selectedVendor = vendorName;
    rfq.status = 'Under Review'; // Update status to Under Review

    if (!rfq.history) rfq.history = [];
    rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `Selected winning vendor: ${vendorName}. Status changed to Under Review.` });

    store.saveState();
    window.ModalComponent.showToast(`Selected ${vendorName} as winner. Ready to convert!`);
    window.AppRouter.refresh();
  },

  // ── Delete Quote Handler ──────────────────────────
  deleteQuote(rfqId, idx) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    if (!confirm('Remove this quotation entry?')) return;
    const quote = rfq.quotes[idx];
    if (rfq.selectedVendor === quote.vendorName) {
      rfq.selectedVendor = '';
    }
    rfq.quotes.splice(idx, 1);

    if (rfq.quotes.length === 0) {
      rfq.status = 'Sent';
    }

    store.saveState();
    window.ModalComponent.showToast('Quotation removed.');
    window.AppRouter.refresh();
  },

  // ── Update Status Handler ─────────────────────────
  updateStatus(rfqId, status) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    rfq.status = status;
    if (!rfq.history) rfq.history = [];
    rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `RFQ status transitioned to "${status}"` });

    store.saveState();
    window.ModalComponent.showToast(`Status updated to ${status}`);
    window.AppRouter.refresh();
  },

  // ── RFQ to PO Conversion engine ───────────────────
  convertToPO(rfqId) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    if (!rfq.selectedVendor) {
      window.ModalComponent.showToast('Please select a winning vendor from the comparison list first.');
      return;
    }

    const quote = rfq.quotes.find(q => q.vendorName === rfq.selectedVendor);
    if (!quote) {
      window.ModalComponent.showToast('Winning bid quotation details not found.');
      return;
    }

    // Verify PO array exists
    if (!store.state.purchaseOrders) store.state.purchaseOrders = [];

    // Auto-generate PO Number
    const year = new Date().getFullYear();
    const count = store.state.purchaseOrders.filter(p => p.poNumber && p.poNumber.includes(String(year))).length + 1;
    const poNumber = `PO-${year}-${String(count).padStart(3, '0')}`;

    // Look up phone
    const vendorObj = (store.state.vendors || []).find(v => v.name === rfq.selectedVendor);
    const phone = vendorObj?.phone || '';

    // Calculate Financials
    const poItems = (rfq.items || []).map((item, idx) => {
      const rate = quote.rates ? (quote.rates[idx] || 0) : (quote.rate || 0);
      return {
        category: item.category || rfq.category,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        rate: rate,
        shutterWidthEnabled: item.shutterWidthEnabled || false,
        shutterHeightEnabled: item.shutterHeightEnabled || false,
        shutterDepthEnabled: item.shutterDepthEnabled || false,
        shutterLengthEnabled: item.shutterLengthEnabled || false,
        shutterWidth: item.shutterWidth || 0,
        shutterHeight: item.shutterHeight || 0,
        shutterDepth: item.shutterDepth || 0,
        shutterLength: item.shutterLength || 0,
        shutterCount: item.shutterCount || 0
      };
    });

    const subtotal = poItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const gstAmt = subtotal * (quote.gst || 0) / 100;
    const addl = quote.additionalCharges || 0;
    const grand = subtotal + gstAmt + addl;

    const po = {
      id: `po-${Date.now()}`,
      poNumber: poNumber,
      projectId: rfq.projectId,
      projectName: rfq.projectName,
      vendorName: rfq.selectedVendor,
      vendorPhone: phone,
      deliveryDate: '',
      gst: quote.gst || 0,
      additionalCharges: addl,
      notes: rfq.notes || '',
      vendorConfirmed: false,
      status: 'Draft',
      items: poItems,
      subtotal: subtotal,
      grandTotal: grand,
      createdAt: new Date().toISOString().split('T')[0],
      history: [
        { date: new Date().toISOString().split('T')[0], text: `Purchase Order created automatically from RFQ ${rfq.rfqNumber}` }
      ]
    };

    store.state.purchaseOrders.unshift(po);
    rfq.status = 'Approved';
    rfq.convertedToPO = true;
    rfq.poId = po.id;

    if (!rfq.history) rfq.history = [];
    rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `Approved and converted to Purchase Order ${poNumber}` });

    store.saveState();
    window.ModalComponent.showToast(`Purchase Order ${poNumber} created successfully!`);

    // Redirect to the new PO
    window.POPage.activePOId = po.id;
    window.POPage.viewMode = 'detail';
    window.AppRouter.navigate('pos');
  },


  shareWhatsAppToVendor(rfqId, vendorName) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    const companyPhone = localStorage.getItem("company_phone") || "+91 98480 00000";
    
    let itemsListStr = "";
    (rfq.items || []).forEach((item, idx) => {
      let itemLine = `• *Item ${idx + 1}:* ${item.description} - ${item.qty} ${item.unit}`;
      const itemDimStr = window.formatShutterDims(item);
      if (itemDimStr) {
        itemLine += ` [${itemDimStr}]`;
      }
      itemsListStr += itemLine + `\n`;
    });

    const textStr = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Request For Quotation*\n\n• *RFQ Reference:* ${rfq.rfqNumber}\n• *Date:* ${window.Utils.formatDate(rfq.createdAt)}\n• *Company Contact:* ${companyPhone}\n• *Vendor:* ${vendorName}\n\n■ *Sourcing Specifications*\n• *Material Category:* ${rfq.category}\n\n■ *Material Items List*\n${itemsListStr}${rfq.notes ? `\n■ *Notes/Instructions*\n• ${rfq.notes}` : ''}\n\nPlease verify specifications and send us your quotation with unit rate, GST percentage, and transport/extra charges.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Sourcing & Sourcing OS_`;

    const text = encodeURIComponent(textStr);

    const vendorObj = (store.state.vendors || []).find(v => v.name === vendorName);
    const phone = (vendorObj?.phone || '').replace(/[^+\d]/g, '');

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(url, '_blank');
  },

  // ── Print RFQ Template ────────────────────────────
  printRFQ(rfqId) {
    const rfq = (window.AppStore.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    const companyPhone = localStorage.getItem("company_phone") || "+91 98480 00000";
    const companyLogo = localStorage.getItem("company_logo") || "Logo.png";

    let tableHTML = "";
    if (rfq.entryMode === 'production') {
      tableHTML = `
      <table>
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>Item Description / Material Spec</th>
            <th style="width: 100px; text-align: right">Width (mm)</th>
            <th style="width: 100px; text-align: right">Height (mm)</th>
            <th style="width: 80px; text-align: right">Qty (pcs)</th>
            <th style="width: 200px">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${(rfq.items || []).map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><b>${item.description || 'Production Item'}</b></td>
              <td style="text-align: right; font-family: monospace;">${item.shutterWidth || '-'}</td>
              <td style="text-align: right; font-family: monospace;">${item.shutterHeight || '-'}</td>
              <td style="text-align: right; font-family: monospace;"><b>${item.qty || item.shutterCount || 1}</b></td>
              <td style="color: #666; font-size: 10px;">${item.remarks || item.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `;
    } else {
      tableHTML = `
      <table>
        <thead>
          <tr>
            <th style="width: 80px">Category</th>
            <th>Specification / Description</th>
            <th style="width: 100px; text-align: right">Quantity Sourced</th>
            <th style="width: 80px">Unit</th>
          </tr>
        </thead>
        <tbody>
          ${(rfq.items || []).map((item) => {
            let descText = item.description;
            const dimStr = window.formatShutterDims(item);
            if (dimStr) {
              descText += `<br><small style="color: #c5a880; font-size: 9px; font-weight: bold;">${dimStr}</small>`;
            }
            return `
              <tr>
                <td><b>${item.category || rfq.category}</b></td>
                <td>${descText}</td>
                <td style="text-align: right"><b>${item.qty}</b></td>
                <td>${item.unit}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      `;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RFQ ${rfq.rfqNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #000; text-transform: uppercase; }
    .brand-sub { font-size: 9px; color: #888; letter-spacing: 3px; text-transform: uppercase; margin-top: 3px; }
    .po-meta { text-align: right; }
    .po-number { font-size: 18px; font-weight: 900; color: #f59e0b; font-family: monospace; }
    .po-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .po-date { font-size: 11px; color: #555; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 14px; }
    .info-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .info-val { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .info-sub { font-size: 10px; color: #666; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1a1a1a; color: #fff; }
    thead th { padding: 9px 12px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
    tbody td { padding: 12px; border-bottom: 1px solid #eee; font-size: 11px; }
    .notes-box { border: 1px solid #eee; border-radius: 6px; padding: 14px; margin: 20px 0; background: #fffbf0; }
    .notes-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #eee; font-size: 9px; color: #aaa; text-align: center; }
    .status-badge { display: inline-block; background: #f59e0b20; color: #d97706; border: 1px solid #f59e0b40; border-radius: 4px; padding: 2px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${companyLogo}" alt="Premio Living Logo" style="height: 48px; display: block; margin-bottom: 8px;">
      <div style="font-size:9px; color:#666; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;">Furnishing Your Dreams</div>
      <div style="font-size:9px; color:#555; line-height:1.4;">
        Muppa's Marvel, Ground &amp; 1st Floor<br>
        Lanco Hills Road, Khajaguda<br>
        Hyderabad, Telangana, India<br>
        Phone: ${companyPhone}
      </div>
    </div>
    <div class="po-meta">
      <div class="po-label">Request For Quotation</div>
      <div class="po-number">${rfq.rfqNumber}</div>
      <div class="po-date">Date: ${window.Utils.formatDate(rfq.createdAt)}</div>
      <div style="margin-top:6px"><span class="status-badge">${rfq.status}</span></div>
    </div>
  </div>

  <div class="info-grid" style="display: block;">
    <div class="info-box">
      <div class="info-title">Material Category</div>
      <div class="info-val" style="color: #f59e0b;">${rfq.category}</div>
    </div>
  </div>

  ${tableHTML}

  ${rfq.notes ? `
    <div class="notes-box">
      <div class="notes-title">Instructions to Vendors</div>
      <div>${rfq.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    Generated on: ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  saveDraft() {
    if (this.viewMode === 'create' || this.viewMode === 'edit') {
      localStorage.setItem('premio_rfq_draft', JSON.stringify({
        viewMode: this.viewMode,
        activeRFQ: this.activeRFQ,
        activeRFQId: this.activeRFQId,
        returnToProcurementProjectId: this.returnToProcurementProjectId
      }));
    }
  },

  clearDraft() {
    localStorage.removeItem('premio_rfq_draft');
  },

  toggleDimensionsPanelForItem(idx) {
    const item = this.activeRFQ.items[idx];
    if (!item) return;
    item.showDimensionsPanel = !item.showDimensionsPanel;
    if (item.showDimensionsPanel) {
      if (item.shutterWidthEnabled === undefined && item.shutterHeightEnabled === undefined) {
        item.shutterWidthEnabled = true;
        item.shutterHeightEnabled = true;
      }
    }
    this.saveDraft();
    this.renderRFQItems();
  }
};
