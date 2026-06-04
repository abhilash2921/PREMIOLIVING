window.formatShutterDims = window.formatShutterDims || function(item) {
  if (!item) return '';
  const parts = [];
  if (item.shutterWidthEnabled && item.shutterWidth) parts.push(`Width: ${item.shutterWidth} mm`);
  if (item.shutterHeightEnabled && item.shutterHeight) parts.push(`Height: ${item.shutterHeight} mm`);
  if (item.shutterDepthEnabled && item.shutterDepth) parts.push(`Depth: ${item.shutterDepth} mm`);
  if (item.shutterLengthEnabled && item.shutterLength) parts.push(`Length: ${item.shutterLength} mm`);
  
  if (parts.length === 0) return '';
  return `Size: ${parts.join(', ')} | Count: ${item.shutterCount || 0}`;
};

window.POPage = {
  activeFilter: 'all',
  activeSearch: '',
  activePOId: null,
  viewMode: 'list', // 'list' | 'detail'

  // ── PO Number Generator ───────────────────────────
  generatePONumber() {
    const state = window.AppStore.state;
    const pos = state.purchaseOrders || [];
    const year = new Date().getFullYear();
    const count = pos.filter(p => p.poNumber && p.poNumber.includes(String(year))).length + 1;
    return `PO-${year}-${String(count).padStart(3, '0')}`;
  },

  // ── Smart unit suggestion by category ────────────
  suggestUnit(category) {
    const unitMap = {
      'Modular Works (Carcase & Shutters)': 'SFT',
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
      'Hardware, Hinges & Tandem Boxes': 'PCS',
      'Kitchen Appliances & Sinks': 'PCS',
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

  // ── Status colors & icons ────────────────────────
  statusConfig(status) {
    const map = {
      'Draft':         { color: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',    icon: 'file',          dot: 'bg-zinc-400' },
      'Sent':          { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     icon: 'send',          dot: 'bg-blue-400' },
      'Confirmed':     { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',     icon: 'check-circle',  dot: 'bg-cyan-400' },
      'In Production': { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  icon: 'settings',      dot: 'bg-amber-400' },
      'Dispatched':    { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'truck',        dot: 'bg-purple-400' },
      'Delivered':     { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'package-check', dot: 'bg-emerald-400' },
      'Closed':        { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     icon: 'archive',       dot: 'bg-rose-400' }
    };
    return map[status] || map['Draft'];
  },

  // ── Render Main Page ─────────────────────────────
  render(container) {
    if (this.viewMode === 'detail' && this.activePOId) {
      return this.renderDetail(container);
    }
    this.renderList(container);
  },

  activeTab: 'orders',

  setTab(tab) {
    this.activeTab = tab;
    this.activeSearch = '';
    window.AppRouter.refresh();
  },

  renderList(container) {
    const store = window.AppStore;
    const role = store.activeRole;
    const pos = store.state.purchaseOrders || [];
    this.activeTab = this.activeTab || 'orders';

    // Metrics
    const totalValue  = pos.reduce((s, p) => s + (p.grandTotal || 0), 0);
    const openCount   = pos.filter(p => !['Closed', 'Delivered'].includes(p.status)).length;
    const thisMonth   = pos.filter(p => p.createdAt?.startsWith('2026-05')).length;
    const pendingConf = pos.filter(p => p.status === 'Sent').length;

    const statusFilters = ['all', 'Draft', 'Sent', 'Confirmed', 'In Production', 'Dispatched', 'Delivered', 'Closed'];

    // ── Build list container ──
    let pageContentHTML = '';

    if (this.activeTab === 'orders') {
      // Main PO List Tab
      let filtered = pos.filter(po => {
        const matchFilter = this.activeFilter === 'all' || po.status === this.activeFilter;
        const matchSearch = !this.activeSearch ||
          po.poNumber?.toLowerCase().includes(this.activeSearch) ||
          po.vendorName?.toLowerCase().includes(this.activeSearch) ||
          po.projectName?.toLowerCase().includes(this.activeSearch) ||
          po.items?.some(i => i.description?.toLowerCase().includes(this.activeSearch));
        return matchFilter && matchSearch;
      });
      filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      pageContentHTML = `
        <!-- Search + Filter Bar -->
        <div class="flex flex-col md:flex-row gap-2">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
            <input
              type="text"
              id="po-search"
              placeholder="Search PO number, vendor, project or material..."
              value="${this.activeSearch}"
              oninput="window.POPage.activeSearch = this.value.toLowerCase(); window.POPage.renderList(document.getElementById('main-content-container'))"
              class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
            >
          </div>
          <div class="flex gap-1 overflow-x-auto no-scrollbar">
            ${statusFilters.map(f => `
              <button onclick="window.POPage.activeFilter = '${f}'; window.POPage.renderList(document.getElementById('main-content-container'))"
                class="px-3 py-1.5 rounded text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${this.activeFilter === f ? 'bg-amber-500 text-black' : 'bg-hover text-secondary hover:text-white border border-border-color/40'}">
                ${f === 'all' ? 'All POs' : f}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- PO List -->
        ${filtered.length === 0 ? `
          <div class="card p-12 text-center animate-fade-in">
            <i data-lucide="clipboard-x" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No Purchase Orders Found</p>
            <p class="text-xs text-muted">
              ${pos.length === 0 ? 'Create your first PO using the button above.' : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ` : `
          <!-- Desktop Table -->
          <div class="hidden md:block card overflow-hidden animate-fade-in">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-4 py-3">PO Number</th>
                  <th class="px-4 py-3">Project</th>
                  <th class="px-4 py-3">Vendor</th>
                  <th class="px-4 py-3">Items</th>
                  <th class="px-4 py-3 text-right">Value</th>
                  <th class="px-4 py-3">Delivery</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(po => this.renderTableRow(po, role)).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-3 animate-fade-in">
            ${filtered.map(po => this.renderMobileCard(po, role)).join('')}
          </div>
        `}
      `;
    } else if (this.activeTab === 'rates') {
      // Previous Purchase Rates Tab
      let allItems = [];
      pos.forEach(po => {
        (po.items || []).forEach(item => {
          allItems.push({
            poId: po.id,
            poNumber: po.poNumber,
            projectName: po.projectName,
            vendorName: po.vendorName,
            date: po.createdAt,
            category: item.category,
            description: item.description,
            qty: item.qty,
            unit: item.unit,
            rate: item.rate
          });
        });
      });

      if (this.activeSearch) {
        allItems = allItems.filter(item => 
          item.description.toLowerCase().includes(this.activeSearch) ||
          item.category.toLowerCase().includes(this.activeSearch) ||
          item.vendorName.toLowerCase().includes(this.activeSearch) ||
          item.projectName.toLowerCase().includes(this.activeSearch)
        );
      }
      allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

      pageContentHTML = `
        <!-- Search Bar -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="po-search"
            placeholder="Search material description, category or vendor..."
            value="${this.activeSearch}"
            oninput="window.POPage.activeSearch = this.value.toLowerCase(); window.POPage.renderList(document.getElementById('main-content-container'))"
            class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
          >
        </div>

        <!-- Rates Table -->
        ${allItems.length === 0 ? `
          <div class="card p-12 text-center animate-fade-in">
            <i data-lucide="tag" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No Purchase Rates Found</p>
            <p class="text-xs text-muted">Try adjusting your search query.</p>
          </div>
        ` : `
          <!-- Desktop Table -->
          <div class="hidden md:block card overflow-hidden animate-fade-in">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-4 py-3">Material Description</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3 text-right">Previous Rate</th>
                  <th class="px-4 py-3">Vendor Used</th>
                  <th class="px-4 py-3">Project Linked</th>
                  <th class="px-4 py-3">Purchase Date</th>
                  <th class="px-4 py-3 text-right">PO Ref</th>
                </tr>
              </thead>
              <tbody>
                ${allItems.map(item => `
                  <tr class="border-b border-border-color hover:bg-hover/30 transition-colors text-xs cursor-pointer" onclick="window.POPage.openDetail('${item.poId}')">
                    <td class="px-4 py-3 font-medium text-white">${item.description}</td>
                    <td class="px-4 py-3"><span class="px-1.5 py-0.5 bg-primary/60 rounded text-[9px] font-mono text-secondary">${item.category}</span></td>
                    <td class="px-4 py-3 text-right font-mono font-bold text-amber-500">${window.Utils.formatCurrency(item.rate)} <span class="text-[9px] text-muted font-normal">/ ${item.unit}</span></td>
                    <td class="px-4 py-3 text-white">${item.vendorName}</td>
                    <td class="px-4 py-3 text-secondary">${item.projectName}</td>
                    <td class="px-4 py-3 text-secondary font-mono">${window.Utils.formatDate(item.date)}</td>
                    <td class="px-4 py-3 text-right font-mono font-semibold text-amber-500">${item.poNumber}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-3 animate-fade-in">
            ${allItems.map(item => `
              <div class="card p-4 space-y-2 cursor-pointer hover:border-amber-500/30 transition-all text-xs" onclick="window.POPage.openDetail('${item.poId}')">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-bold text-white block">${item.description}</span>
                    <span class="text-[9px] text-muted">${item.category}</span>
                  </div>
                  <span class="font-mono font-bold text-amber-500">${window.Utils.formatCurrency(item.rate)} / ${item.unit}</span>
                </div>
                <div class="border-t border-border-color/30 pt-2 grid grid-cols-2 gap-2 text-[10px] text-secondary">
                  <div>Vendor: <b class="text-white">${item.vendorName}</b></div>
                  <div>PO Ref: <b class="text-amber-500 font-mono">${item.poNumber}</b></div>
                  <div class="col-span-2">Project: <b class="text-white">${item.projectName}</b></div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (this.activeTab === 'vendors') {
      // Last Vendor Used Tab
      const lastVendorMap = {};
      pos.forEach(po => {
        (po.items || []).forEach(item => {
          const cat = item.category || 'Other';
          const existing = lastVendorMap[cat];
          if (!existing || new Date(po.createdAt) > new Date(existing.date)) {
            lastVendorMap[cat] = {
              category: cat,
              vendorName: po.vendorName,
              vendorPhone: po.vendorPhone,
              poNumber: po.poNumber,
              poId: po.id,
              date: po.createdAt,
              projectName: po.projectName,
              material: item.description,
              rate: item.rate,
              unit: item.unit
            };
          }
        });
      });
      let lastVendors = Object.values(lastVendorMap);

      if (this.activeSearch) {
        lastVendors = lastVendors.filter(lv => 
          lv.category.toLowerCase().includes(this.activeSearch) ||
          lv.vendorName.toLowerCase().includes(this.activeSearch) ||
          lv.material.toLowerCase().includes(this.activeSearch)
        );
      }
      lastVendors.sort((a, b) => a.category.localeCompare(b.category));

      pageContentHTML = `
        <!-- Search Bar -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="po-search"
            placeholder="Search material category, vendor or description..."
            value="${this.activeSearch}"
            oninput="window.POPage.activeSearch = this.value.toLowerCase(); window.POPage.renderList(document.getElementById('main-content-container'))"
            class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
          >
        </div>

        <!-- Vendor Last Used Table -->
        ${lastVendors.length === 0 ? `
          <div class="card p-12 text-center animate-fade-in">
            <i data-lucide="store" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No Sourcing History Found</p>
            <p class="text-xs text-muted">Try adjusting your search query.</p>
          </div>
        ` : `
          <!-- Desktop Table -->
          <div class="hidden md:block card overflow-hidden animate-fade-in">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-4 py-3">Material Category</th>
                  <th class="px-4 py-3">Last Vendor Used</th>
                  <th class="px-4 py-3">Last Material Sourced</th>
                  <th class="px-4 py-3 text-right">Last Rate Sourced</th>
                  <th class="px-4 py-3">Project Sourced For</th>
                  <th class="px-4 py-3">Last Sourced Date</th>
                  <th class="px-4 py-3 text-right">PO Ref</th>
                </tr>
              </thead>
              <tbody>
                ${lastVendors.map(lv => `
                  <tr class="border-b border-border-color hover:bg-hover/30 transition-colors text-xs cursor-pointer" onclick="window.POPage.openDetail('${lv.poId}')">
                    <td class="px-4 py-3"><span class="px-1.5 py-0.5 bg-primary/60 rounded text-[9px] font-mono text-white font-bold">${lv.category}</span></td>
                    <td class="px-4 py-3 font-semibold text-amber-500">${lv.vendorName}</td>
                    <td class="px-4 py-3 text-white">${lv.material}</td>
                    <td class="px-4 py-3 text-right font-mono text-secondary">${window.Utils.formatCurrency(lv.rate)} / ${lv.unit}</td>
                    <td class="px-4 py-3 text-secondary">${lv.projectName}</td>
                    <td class="px-4 py-3 text-secondary font-mono">${window.Utils.formatDate(lv.date)}</td>
                    <td class="px-4 py-3 text-right font-mono font-semibold text-amber-500">${lv.poNumber}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-3 animate-fade-in">
            ${lastVendors.map(lv => `
              <div class="card p-4 space-y-2 cursor-pointer hover:border-amber-500/30 transition-all text-xs" onclick="window.POPage.openDetail('${lv.poId}')">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-bold text-white block">${lv.category}</span>
                    <span class="text-[9px] text-amber-500 font-semibold">Last Vendor: ${lv.vendorName}</span>
                  </div>
                  <span class="font-mono text-muted">${window.Utils.formatDate(lv.date)}</span>
                </div>
                <div class="border-t border-border-color/30 pt-2 grid grid-cols-2 gap-2 text-[10px] text-secondary">
                  <div class="col-span-2">Material: <b class="text-white">${lv.material}</b></div>
                  <div>Last Rate: <b class="text-white">${window.Utils.formatCurrency(lv.rate)} / ${lv.unit}</b></div>
                  <div>PO Ref: <b class="text-amber-500 font-mono">${lv.poNumber}</b></div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (this.activeTab === 'history') {
      // PO Activity History (Audit Log) Tab
      let historyEvents = [];
      pos.forEach(po => {
        const pHistory = po.history && po.history.length > 0 ? po.history : [
          { date: po.createdAt, text: `Purchase Order ${po.poNumber} created (Value: ${window.Utils.formatCurrency(po.grandTotal)})` }
        ];
        pHistory.forEach(h => {
          historyEvents.push({
            date: h.date,
            text: h.text,
            poNumber: po.poNumber,
            poId: po.id,
            projectName: po.projectName
          });
        });
      });

      if (this.activeSearch) {
        historyEvents = historyEvents.filter(e => 
          e.text.toLowerCase().includes(this.activeSearch) ||
          e.poNumber.toLowerCase().includes(this.activeSearch) ||
          e.projectName.toLowerCase().includes(this.activeSearch)
        );
      }
      historyEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

      pageContentHTML = `
        <!-- Search Bar -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="po-search"
            placeholder="Search PO activity log text, PO number or project..."
            value="${this.activeSearch}"
            oninput="window.POPage.activeSearch = this.value.toLowerCase(); window.POPage.renderList(document.getElementById('main-content-container'))"
            class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
          >
        </div>

        <!-- Timeline Log -->
        ${historyEvents.length === 0 ? `
          <div class="card p-12 text-center animate-fade-in">
            <i data-lucide="history" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No Activity Logs Found</p>
            <p class="text-xs text-muted">Try adjusting your search query.</p>
          </div>
        ` : `
          <div class="card p-5 space-y-4 animate-fade-in">
            <div class="border-l-2 border-border-color pl-4 ml-2 space-y-5">
              ${historyEvents.map(e => `
                <div class="relative cursor-pointer hover:bg-hover/15 p-2 rounded transition-all" onclick="window.POPage.openDetail('${e.poId}')">
                  <div class="absolute -left-[22px] top-2 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-secondary/50"></div>
                  <div class="text-xs">
                    <span class="font-mono text-muted block mb-1">${window.Utils.formatDate(e.date)}</span>
                    <p class="text-white">${e.text}</p>
                    <span class="text-[10px] text-secondary block mt-0.5 font-mono">${e.poNumber} • ${e.projectName}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      `;
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-5 animate-fade-in">
          <div>
            <h1 class="text-base font-bold text-white font-display flex items-center gap-2">
              <i data-lucide="clipboard-signature" class="w-5 h-5 text-amber-500"></i>
              Purchase Order Management
            </h1>
            <p class="text-xs text-secondary mt-0.5">Create, track and share vendor purchase orders</p>
          </div>
          ${role === 'admin' ? `
            <button onclick="window.POPage.openCreateModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded flex items-center gap-1.5 shadow-md transition-all hover:scale-105">
              <i data-lucide="plus" class="w-4 h-4"></i> Create Purchase Order
            </button>
          ` : ''}
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Total PO Value</span>
            <span class="text-lg font-bold font-mono text-amber-500 block mt-1">${window.Utils.formatCurrency(totalValue)}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Active Orders</span>
            <span class="text-lg font-bold font-mono text-white block mt-1">${openCount}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">This Month</span>
            <span class="text-lg font-bold font-mono text-blue-400 block mt-1">${thisMonth}</span>
          </div>
          <div class="card p-4 text-center">
            <span class="text-[9px] text-muted uppercase font-semibold block">Awaiting Confirm</span>
            <span class="text-lg font-bold font-mono text-purple-400 block mt-1">${pendingConf}</span>
          </div>
        </div>

        <!-- Sub-Tabs Navigation -->
        <div class="flex border-b border-border-color/60 gap-4 text-xs pb-1 overflow-x-auto no-scrollbar">
          <button onclick="window.POPage.setTab('orders')" class="pb-2 font-bold px-1 transition-all flex-shrink-0 ${this.activeTab === 'orders' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            Active Orders
          </button>
          <button onclick="window.POPage.setTab('rates')" class="pb-2 font-bold px-1 transition-all flex-shrink-0 ${this.activeTab === 'rates' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            Previous Purchase Rates
          </button>
          <button onclick="window.POPage.setTab('vendors')" class="pb-2 font-bold px-1 transition-all flex-shrink-0 ${this.activeTab === 'vendors' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            Last Vendor Used
          </button>
          <button onclick="window.POPage.setTab('history')" class="pb-2 font-bold px-1 transition-all flex-shrink-0 ${this.activeTab === 'history' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            PO Activity History
          </button>
        </div>

        <!-- Tab Page Content -->
        <div class="space-y-4 animate-fade-in">
          ${pageContentHTML}
        </div>

      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  renderTableRow(po, role) {
    const cfg = this.statusConfig(po.status);
    const itemCount = po.items?.length || 0;
    const deliveryStr = po.deliveryDate ? window.Utils.formatDate(po.deliveryDate) : '—';
    return `
      <tr class="border-b border-border-color hover:bg-hover/30 transition-colors text-xs cursor-pointer" onclick="window.POPage.openDetail('${po.id}')">
        <td class="px-4 py-3">
          <span class="font-mono font-bold text-amber-500">${po.poNumber}</span>
          <span class="text-[9px] text-muted block">${window.Utils.formatDate(po.createdAt)}</span>
        </td>
        <td class="px-4 py-3">
          <span class="text-white font-medium">${po.projectName || '—'}</span>
        </td>
        <td class="px-4 py-3">
          <span class="text-white">${po.vendorName || '—'}</span>
          <span class="text-[9px] text-muted block">${po.vendorPhone || ''}</span>
        </td>
        <td class="px-4 py-3">
          <span class="font-mono text-white">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="font-mono font-bold text-white">${window.Utils.formatCurrency(po.grandTotal || 0)}</span>
        </td>
        <td class="px-4 py-3">
          <span class="text-secondary">${deliveryStr}</span>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold ${cfg.color}">${po.status}</span>
        </td>
        <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
          <div class="flex gap-1 justify-end">
            <button onclick="window.POPage.openDetail('${po.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="View PO"><i data-lucide="eye" class="w-3.5 h-3.5 text-amber-500"></i></button>
            ${role === 'admin' ? `
              <button onclick="window.POPage.duplicatePO('${po.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Duplicate PO"><i data-lucide="copy" class="w-3.5 h-3.5 text-blue-400"></i></button>
              <button onclick="window.POPage.shareWhatsApp('${po.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-emerald-500/20 rounded text-white" title="WhatsApp Share"><i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i></button>
              <button onclick="window.POPage.deletePO('${po.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete PO"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  renderMobileCard(po, role) {
    const cfg = this.statusConfig(po.status);
    const itemCount = po.items?.length || 0;
    return `
      <div class="card p-4 space-y-3 cursor-pointer hover:border-amber-500/30 transition-all" onclick="window.POPage.openDetail('${po.id}')">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="font-mono font-bold text-amber-500 text-sm">${po.poNumber}</span>
            <span class="text-[9px] text-muted block font-mono">${window.Utils.formatDate(po.createdAt)}</span>
          </div>
          <span class="px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold ${cfg.color}">${po.status}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs border-y border-border-color/30 py-2">
          <div>
            <span class="text-[9px] text-muted block">Vendor</span>
            <span class="text-white font-medium">${po.vendorName || '—'}</span>
          </div>
          <div>
            <span class="text-[9px] text-muted block">Project</span>
            <span class="text-white font-medium">${po.projectName || '—'}</span>
          </div>
          <div>
            <span class="text-[9px] text-muted block">Items</span>
            <span class="text-white">${itemCount} line item${itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div>
            <span class="text-[9px] text-muted block">Grand Total</span>
            <span class="font-mono font-bold text-amber-500">${window.Utils.formatCurrency(po.grandTotal || 0)}</span>
          </div>
        </div>
        ${role === 'admin' ? `
          <div class="flex gap-2" onclick="event.stopPropagation()">
            <button onclick="window.POPage.shareWhatsApp('${po.id}')" class="flex-1 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 flex items-center justify-center gap-1">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i> WhatsApp
            </button>
            <button onclick="window.POPage.printPO('${po.id}')" class="flex-1 py-1.5 bg-hover text-secondary text-[10px] font-bold rounded border border-border-color/25 flex items-center justify-center gap-1 hover:text-white">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i> Print PDF
            </button>
            <button onclick="window.POPage.duplicatePO('${po.id}')" class="px-3 py-1.5 bg-hover text-blue-400 text-[10px] rounded border border-blue-500/20 hover:bg-border-color">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.POPage.deletePO('${po.id}')" class="px-3 py-1.5 bg-hover text-rose-500 text-[10px] rounded border border-rose-500/20 hover:bg-border-color">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ── Detail View ──────────────────────────────────
  openDetail(poId) {
    this.activePOId = poId;
    this.viewMode = 'detail';
    window.AppRouter.refresh();
  },

  renderDetail(container) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === this.activePOId);
    if (!po) {
      this.viewMode = 'list';
      return this.renderList(container);
    }

    const role = window.AppStore.activeRole;
    const cfg = this.statusConfig(po.status);
    const statuses = ['Draft','Sent','Confirmed','In Production','Dispatched','Delivered','Closed'];

    // Totals
    const subtotal = po.items?.reduce((s, i) => s + (i.qty * i.rate || 0), 0) || 0;
    const gstAmt = subtotal * (po.gst || 0) / 100;
    const addlCharges = Number(po.additionalCharges) || 0;
    const grandTotal = subtotal + gstAmt + addlCharges;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-5">

        <!-- Back + Header -->
        <div class="flex items-center gap-3 border-b border-border-color pb-4">
          <button onclick="window.POPage.viewMode='list'; window.POPage.activePOId=null; window.AppRouter.refresh()" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Back">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div class="flex-1">
            <h1 class="text-base font-bold text-white font-display">${po.poNumber}</h1>
            <p class="text-xs text-secondary mt-0.5">${po.projectName} • ${po.vendorName}</p>
          </div>
          <span class="px-3 py-1 rounded border text-xs font-mono uppercase font-bold ${cfg.color}">${po.status}</span>
          <div class="flex gap-2">
            ${role === 'admin' ? `
              <button onclick="window.POPage.openEditModal('${po.id}')" class="p-2 bg-hover border border-border-color rounded text-white hover:border-amber-500/40" title="Edit PO">
                <i data-lucide="edit-2" class="w-4 h-4 text-amber-500"></i>
              </button>
              <button onclick="window.POPage.printPO('${po.id}')" class="p-2 bg-hover border border-border-color rounded text-white" title="Print PDF">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button onclick="window.POPage.shareWhatsApp('${po.id}')" class="p-2 bg-emerald-600/15 border border-emerald-500/20 rounded text-emerald-400" title="WhatsApp">
                <i data-lucide="phone" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Status Pipeline -->
        ${role === 'admin' ? `
          <div class="card p-4">
            <span class="text-[9px] text-muted uppercase font-semibold block mb-3">Update Status</span>
            <div class="flex gap-1 overflow-x-auto no-scrollbar">
              ${statuses.map(s => {
                const c = this.statusConfig(s);
                const isActive = po.status === s;
                return `<button onclick="window.POPage.updateStatus('${po.id}','${s}')"
                  class="px-2.5 py-1.5 rounded text-[10px] font-bold whitespace-nowrap flex-shrink-0 border transition-all ${isActive ? c.color + ' shadow-sm' : 'bg-hover text-secondary border-border-color/30 hover:text-white'}">
                  <span class="w-1.5 h-1.5 rounded-full ${c.dot} inline-block mr-1"></span>${s}
                </button>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4 space-y-2.5 text-xs md:col-span-2">
            <span class="text-[9px] text-muted uppercase font-semibold">PO Details</span>
            <div class="grid grid-cols-2 gap-3">
              <div><span class="text-secondary block">PO Number</span><span class="font-mono font-bold text-amber-500">${po.poNumber}</span></div>
              <div><span class="text-secondary block">Created</span><span class="text-white">${window.Utils.formatDate(po.createdAt)}</span></div>
              <div><span class="text-secondary block">Project</span><span class="text-white font-medium">${po.projectName}</span></div>
              <div><span class="text-secondary block">Delivery Date</span><span class="text-white">${po.deliveryDate ? window.Utils.formatDate(po.deliveryDate) : '—'}</span></div>
              <div><span class="text-secondary block">Vendor</span><span class="text-white font-medium">${po.vendorName}</span></div>
              <div><span class="text-secondary block">Vendor Phone</span><span class="font-mono text-white">${po.vendorPhone || '—'}</span></div>
            </div>
            ${po.notes ? `
              <div class="border-t border-border-color/30 pt-2">
                <span class="text-secondary block mb-1">Notes</span>
                <p class="text-white italic leading-relaxed">"${po.notes}"</p>
              </div>
            ` : ''}
          </div>

          <!-- Financial Summary -->
          <div class="card p-4 space-y-2 text-xs">
            <span class="text-[9px] text-muted uppercase font-semibold">Financial Summary</span>
            <div class="space-y-2 border-t border-border-color/30 pt-2">
              <div class="flex justify-between"><span class="text-secondary">Subtotal</span><span class="font-mono text-white">${window.Utils.formatCurrency(subtotal)}</span></div>
              <div class="flex justify-between"><span class="text-secondary">GST (${po.gst || 0}%)</span><span class="font-mono text-white">${window.Utils.formatCurrency(gstAmt)}</span></div>
              <div class="flex justify-between"><span class="text-secondary">Additional Charges</span><span class="font-mono text-white">${window.Utils.formatCurrency(addlCharges)}</span></div>
              <div class="flex justify-between border-t border-border-color pt-2 mt-1">
                <span class="font-bold text-white">Grand Total</span>
                <span class="font-mono font-bold text-amber-500 text-sm">${window.Utils.formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <div class="pt-2 border-t border-border-color/30">
              <div class="flex items-center gap-2">
                <span class="text-secondary">Vendor Confirmed</span>
                <span class="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold ${po.vendorConfirmed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}">${po.vendorConfirmed ? '✓ Yes' : 'Pending'}</span>
              </div>
            </div>

            <!-- Audit Trail / History Timeline -->
            <div class="pt-3 border-t border-border-color/30 space-y-2">
              <span class="text-[9px] text-muted uppercase font-semibold block">PO History Timeline</span>
              <div class="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                ${(po.history || [
                  { date: po.createdAt, text: 'Purchase Order created' }
                ]).map(h => `
                  <div class="border-l border-border-color/60 pl-2 ml-1 text-[10px]">
                    <span class="text-muted font-mono block">${window.Utils.formatDate(h.date)}</span>
                    <span class="text-secondary">${h.text}</span>
                  </div>
                `).reverse().join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="card p-5 space-y-4">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider border-b border-border-color pb-2">Material Line Items</h3>
          <!-- Desktop -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border-color text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-3 py-2 bg-primary">#</th>
                  <th class="px-3 py-2 bg-primary">Category</th>
                  <th class="px-3 py-2 bg-primary">Description</th>
                  <th class="px-3 py-2 bg-primary text-right">Qty</th>
                  <th class="px-3 py-2 bg-primary">Unit</th>
                  <th class="px-3 py-2 bg-primary text-right">Rate</th>
                  <th class="px-3 py-2 bg-primary text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(po.items || []).map((item, idx) => {
                  let desc = item.description;
                  const dimStr = window.formatShutterDims(item);
                  if (dimStr) {
                    desc += `<div class="text-[10px] text-amber-500 font-mono mt-0.5">${dimStr}</div>`;
                  }
                  return `
                    <tr class="border-b border-border-color/40 hover:bg-hover/20">
                      <td class="px-3 py-2.5 font-mono text-muted">${idx + 1}</td>
                      <td class="px-3 py-2.5"><span class="px-1.5 py-0.5 bg-primary/60 rounded text-[9px] font-mono text-secondary">${item.category}</span></td>
                      <td class="px-3 py-2.5 text-white font-medium">${desc}</td>
                      <td class="px-3 py-2.5 text-right font-mono">${item.qty}</td>
                      <td class="px-3 py-2.5 text-secondary font-mono">${item.unit}</td>
                      <td class="px-3 py-2.5 text-right font-mono">${window.Utils.formatCurrency(item.rate)}</td>
                      <td class="px-3 py-2.5 text-right font-mono font-bold text-amber-500">${window.Utils.formatCurrency(item.qty * item.rate)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-border-color">
                  <td colspan="6" class="px-3 py-2.5 text-right text-xs font-bold text-white">Grand Total</td>
                  <td class="px-3 py-2.5 text-right font-mono font-bold text-amber-500 text-sm">${window.Utils.formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <!-- Mobile line items -->
          <div class="block md:hidden space-y-2">
            ${(po.items || []).map((item, idx) => {
              let desc = item.description;
              const dimStr = window.formatShutterDims(item);
              if (dimStr) {
                desc += `<div class="text-[10px] text-amber-500 font-mono mt-0.5">${dimStr}</div>`;
              }
              return `
                <div class="bg-primary/40 rounded border border-border-color/30 p-3 text-xs">
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="font-bold text-white block">${desc}</span>
                      <span class="text-[9px] text-muted">${item.category}</span>
                    </div>
                    <span class="font-mono font-bold text-amber-500">${window.Utils.formatCurrency(item.qty * item.rate)}</span>
                  </div>
                  <div class="mt-2 flex gap-3 text-[10px] text-secondary border-t border-border-color/20 pt-2">
                    <span>Qty: <b class="text-white">${item.qty} ${item.unit}</b></span>
                    <span>Rate: <b class="text-white">${window.Utils.formatCurrency(item.rate)}</b></span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- WhatsApp Share -->
        ${role === 'admin' ? `
          <div class="card p-4 space-y-3">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="phone" class="w-4 h-4 text-emerald-400"></i> Share via WhatsApp
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button onclick="window.POPage.shareWhatsAppTo('${po.id}', 'vendor')" class="py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20 flex items-center justify-center gap-1.5">
                <i data-lucide="wrench" class="w-3.5 h-3.5"></i> Vendor
              </button>
              <button onclick="window.POPage.shareWhatsAppTo('${po.id}', 'site')" class="py-2 bg-hover hover:bg-border-color text-secondary text-xs font-bold rounded border border-border-color/30 flex items-center justify-center gap-1.5 hover:text-white">
                <i data-lucide="hard-hat" class="w-3.5 h-3.5"></i> Site Team
              </button>
              <button onclick="window.POPage.shareWhatsAppTo('${po.id}', 'client')" class="py-2 bg-hover hover:bg-border-color text-secondary text-xs font-bold rounded border border-border-color/30 flex items-center justify-center gap-1.5 hover:text-white">
                <i data-lucide="user" class="w-3.5 h-3.5"></i> Client
              </button>
              <button onclick="window.POPage.shareWhatsAppTo('${po.id}', 'md')" class="py-2 bg-hover hover:bg-border-color text-secondary text-xs font-bold rounded border border-border-color/30 flex items-center justify-center gap-1.5 hover:text-white">
                <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> MD Sir
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // ── Open Create Modal ────────────────────────────
  openCreateModal(prefill = null) {
    const store = window.AppStore;
    const projects = store.state.projects || [];
    const vendors = store.state.vendors || [];
    const poNumber = prefill?.poNumber || this.generatePONumber();

    const modal = document.getElementById('po-create-modal');
    if (!modal) return;

    // Prefill or reset form
    document.getElementById('po-number-field').value = poNumber;
    document.getElementById('po-project').value = prefill?.projectId || (projects[0]?.id || '');
    document.getElementById('po-vendor-name').value = prefill?.vendorName || (vendors[0]?.name || '');
    document.getElementById('po-vendor-phone').value = prefill?.vendorPhone || (vendors[0]?.phone || '');
    document.getElementById('po-delivery-date').value = window.Utils.toDisplayDate(prefill?.deliveryDate || '');
    document.getElementById('po-gst').value = prefill?.gst ?? 18;
    document.getElementById('po-additional-charges').value = prefill?.additionalCharges || 0;
    document.getElementById('po-notes').value = prefill?.notes || '';
    document.getElementById('po-vendor-confirmed').checked = prefill?.vendorConfirmed || false;
    document.getElementById('po-edit-id').value = prefill?.id || '';

    // Populate project dropdown
    const projSel = document.getElementById('po-project');
    projSel.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (prefill?.projectId) projSel.value = prefill.projectId;

    // Populate vendor dropdown
    const vendorSel = document.getElementById('po-vendor-select');
    vendorSel.innerHTML = `<option value="">-- Select from directory --</option>` + vendors.map(v => `<option value="${v.name}" data-phone="${v.phone}">${v.name}</option>`).join('');

    // Build items
    this.modalItems = prefill?.items ? JSON.parse(JSON.stringify(prefill.items)) : [
      { category: 'Hardware', description: '', qty: 1, unit: 'PCS', rate: 0 }
    ];
    this.renderModalItems();
    this.recalcModalTotals();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  openEditModal(poId) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;
    this.openCreateModal(po);
  },

  closeCreateModal() {
    const modal = document.getElementById('po-create-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  },

  // ── Modal Line Item Management ───────────────────
  modalItems: [],

  renderModalItems() {
    const container = document.getElementById('po-items-list');
    if (!container) return;

    const categories = [
      'Modular Works (Carcase & Shutters)',
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
      'Hardware, Hinges & Tandem Boxes',
      'Kitchen Appliances & Sinks',
      'Wallpaper, Cladding & PVC Panels',
      'Furnishings, Curtains & Upholstery',
      'Metal Works & Fabrication',
      'Other Interior Works'
    ];
    const units = ['SFT','Sheet','Roll','Meter','RFT','PCS','Set','KG','LTR','BOX','RFT'];

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

    container.innerHTML = this.modalItems.map((item, idx) => {
      const isDimensionCategory = dimensionCategories.includes(item.category);
      const keywords = ['shutter', 'glass', 'mirror', 'stone', 'plywood', 'laminate', 'veneer', 'quartz', 'marble', 'granite', 'board', 'hdhmr', 'mdf', 'ceiling', 'acrylic'];
      const hasKeyword = keywords.some(k => (item.description || '').toLowerCase().includes(k));
      const isDimensionItem = isDimensionCategory || hasKeyword || item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled || item.showDimensionsPanel;
      const sMode = item.shutterMode || 'w_h';

      return `
      <div class="bg-primary/40 border border-border-color/40 rounded-lg p-3 space-y-2 text-xs" id="po-item-${idx}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-white">Item ${idx + 1}</span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.POPage.toggleDimensionsPanel(${idx})" class="text-[10px] text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-0.5" title="Toggle Dimensions Input">
              <i data-lucide="ruler" class="w-3 h-3"></i> Dims
            </button>
            ${this.modalItems.length > 1 ? `
              <button type="button" onclick="window.POPage.removeItem(${idx})" class="text-rose-500 hover:text-rose-400 p-0.5">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Category</label>
            <select onchange="window.POPage.onCategoryChange(${idx}, this.value)" class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              ${categories.map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Description</label>
            <input type="text" value="${item.description}" oninput="window.POPage.modalItems[${idx}].description = this.value; window.POPage.checkShowShutter(${idx})"
              placeholder="e.g. Bronze Mirror 6mm" class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Qty</label>
            <input type="number" min="0" step="0.01" value="${item.qty}" id="po-qty-${idx}"
              oninput="window.POPage.modalItems[${idx}].qty = parseFloat(this.value)||0; window.POPage.recalcModalTotals()"
              class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Unit <span class="text-amber-500/70">(auto-suggested)</span></label>
            <select id="po-unit-${idx}" onchange="window.POPage.modalItems[${idx}].unit = this.value; window.POPage.onShutterDimChange(${idx});" class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
              ${units.map(u => `<option value="${u}" ${item.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Rate (₹)</label>
            <input type="number" min="0" step="0.01" value="${item.rate}" id="po-rate-${idx}"
              oninput="window.POPage.modalItems[${idx}].rate = parseFloat(this.value)||0; window.POPage.recalcModalTotals()"
              class="w-full text-xs p-1.5 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="text-[9px] text-muted uppercase font-semibold block mb-1">Amount</label>
            <div id="po-amount-${idx}" class="w-full text-xs p-1.5 rounded border border-border-color/30 bg-primary/30 text-amber-500 font-mono font-bold">
              ${window.Utils.formatCurrency(item.qty * item.rate)}
            </div>
          </div>
        </div>

        <!-- Shutter Measurements Sub-Panel -->
        <div id="shutter-inputs-${idx}" class="${isDimensionItem ? '' : 'hidden'} mt-2 p-2.5 bg-primary/20 border border-amber-500/20 rounded-md space-y-2">
          <div class="flex items-center justify-between border-b border-border-color/20 pb-1.5 mb-1.5">
            <span class="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Shutter Calculations</span>
            <div class="relative w-36">
              <button type="button" onclick="window.POPage.toggleDimDropdown(${idx})" class="w-full text-[10px] h-6 py-0 px-2 bg-secondary border border-border-color/60 rounded text-white flex items-center justify-between focus:outline-none">
                <span>Select Dims...</span>
                <i data-lucide="chevron-down" class="w-3 h-3 text-muted"></i>
              </button>
              <div id="po-dim-dropdown-${idx}" class="hidden absolute right-0 top-7 bg-secondary border border-border-color rounded shadow-2xl p-2 z-50 space-y-1.5 w-36 text-white text-[10px]">
                <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                  <input type="checkbox" onchange="window.POPage.onDimensionToggle(${idx}, 'width', this.checked)" ${item.shutterWidthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                  <span>Width</span>
                </label>
                <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                  <input type="checkbox" onchange="window.POPage.onDimensionToggle(${idx}, 'height', this.checked)" ${item.shutterHeightEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                  <span>Height</span>
                </label>
                <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                  <input type="checkbox" onchange="window.POPage.onDimensionToggle(${idx}, 'depth', this.checked)" ${item.shutterDepthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                  <span>Depth</span>
                </label>
                <label class="flex items-center gap-2 hover:bg-hover p-1 rounded cursor-pointer">
                  <input type="checkbox" onchange="window.POPage.onDimensionToggle(${idx}, 'length', this.checked)" ${item.shutterLengthEnabled ? 'checked' : ''} class="w-3.5 h-3.5">
                  <span>Length</span>
                </label>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div id="po-shutter-w-div-${idx}" class="${item.shutterWidthEnabled ? '' : 'hidden'}">
              <label class="text-[8px] text-muted uppercase block mb-0.5">Width (mm)</label>
              <input type="number" min="0" value="${item.shutterWidth || ''}" id="po-shutter-w-${idx}"
                oninput="window.POPage.onShutterDimChange(${idx})" placeholder="W mm"
                class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div id="po-shutter-h-div-${idx}" class="${item.shutterHeightEnabled ? '' : 'hidden'}">
              <label class="text-[8px] text-muted uppercase block mb-0.5">Height (mm)</label>
              <input type="number" min="0" value="${item.shutterHeight || ''}" id="po-shutter-h-${idx}"
                oninput="window.POPage.onShutterDimChange(${idx})" placeholder="H mm"
                class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div id="po-shutter-d-div-${idx}" class="${item.shutterDepthEnabled ? '' : 'hidden'}">
              <label class="text-[8px] text-muted uppercase block mb-0.5">Depth (mm)</label>
              <input type="number" min="0" value="${item.shutterDepth || ''}" id="po-shutter-d-${idx}"
                oninput="window.POPage.onShutterDimChange(${idx})" placeholder="D mm"
                class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div id="po-shutter-l-div-${idx}" class="${item.shutterLengthEnabled ? '' : 'hidden'}">
              <label class="text-[8px] text-muted uppercase block mb-0.5">Length (mm)</label>
              <input type="number" min="0" value="${item.shutterLength || ''}" id="po-shutter-l-${idx}"
                oninput="window.POPage.onShutterDimChange(${idx})" placeholder="L mm"
                class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div id="po-shutter-count-div-${idx}" class="${(item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled) ? '' : 'hidden'}">
              <label class="text-[8px] text-muted uppercase block mb-0.5">Count</label>
              <input type="number" min="0" value="${item.shutterCount || ''}" id="po-shutter-c-${idx}"
                oninput="window.POPage.onShutterDimChange(${idx})" placeholder="Count"
                class="w-full text-xs p-1 h-8 rounded border border-border-color bg-secondary text-white focus:outline-none focus:border-amber-500">
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');
    if (window.lucide) lucide.createIcons();
  },

  onCategoryChange(idx, category) {
    this.modalItems[idx].category = category;
    const suggestedUnit = this.suggestUnit(category);
    this.modalItems[idx].unit = suggestedUnit;
    const unitSel = document.getElementById(`po-unit-${idx}`);
    if (unitSel) unitSel.value = suggestedUnit;
    this.checkShowShutter(idx);
  },

  checkShowShutter(idx) {
    const item = this.modalItems[idx];
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
    const isDimensionCategory = dimensionCategories.includes(item.category);
    const keywords = ['shutter', 'glass', 'mirror', 'stone', 'plywood', 'laminate', 'veneer', 'quartz', 'marble', 'granite', 'board', 'hdhmr', 'mdf', 'ceiling', 'acrylic'];
    const hasKeyword = keywords.some(k => (item.description || '').toLowerCase().includes(k));
    const isDimensionItem = isDimensionCategory || hasKeyword || item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled || item.showDimensionsPanel;

    const div = document.getElementById(`shutter-inputs-${idx}`);
    if (div) {
      if (isDimensionItem) {
        div.classList.remove('hidden');
        if (item.shutterWidthEnabled === undefined && item.shutterHeightEnabled === undefined) {
          item.shutterWidthEnabled = true;
          item.shutterHeightEnabled = true;
          this.renderModalItems();
        }
      } else {
        div.classList.add('hidden');
      }
    }
  },

  toggleDimDropdown(idx) {
    const dropdown = document.getElementById(`po-dim-dropdown-${idx}`);
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  onDimensionToggle(idx, dimKey, isChecked) {
    const item = this.modalItems[idx];
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

    const wDiv = document.getElementById(`po-shutter-w-div-${idx}`);
    const hDiv = document.getElementById(`po-shutter-h-div-${idx}`);
    const dDiv = document.getElementById(`po-shutter-d-div-${idx}`);
    const lDiv = document.getElementById(`po-shutter-l-div-${idx}`);
    const countDiv = document.getElementById(`po-shutter-count-div-${idx}`);

    if (wDiv) item.shutterWidthEnabled ? wDiv.classList.remove('hidden') : wDiv.classList.add('hidden');
    if (hDiv) item.shutterHeightEnabled ? hDiv.classList.remove('hidden') : hDiv.classList.add('hidden');
    if (dDiv) item.shutterDepthEnabled ? dDiv.classList.remove('hidden') : dDiv.classList.add('hidden');
    if (lDiv) item.shutterLengthEnabled ? lDiv.classList.remove('hidden') : lDiv.classList.add('hidden');

    const anyEnabled = item.shutterWidthEnabled || item.shutterHeightEnabled || item.shutterDepthEnabled || item.shutterLengthEnabled;
    if (countDiv) anyEnabled ? countDiv.classList.remove('hidden') : countDiv.classList.add('hidden');

    this.onShutterDimChange(idx);
  },

  onShutterDimChange(idx) {
    const item = this.modalItems[idx];
    if (!item) return;

    const w = item.shutterWidthEnabled ? (parseFloat(document.getElementById(`po-shutter-w-${idx}`)?.value) || 0) : 0;
    const h = item.shutterHeightEnabled ? (parseFloat(document.getElementById(`po-shutter-h-${idx}`)?.value) || 0) : 0;
    const d = item.shutterDepthEnabled ? (parseFloat(document.getElementById(`po-shutter-d-${idx}`)?.value) || 0) : 0;
    const l = item.shutterLengthEnabled ? (parseFloat(document.getElementById(`po-shutter-l-${idx}`)?.value) || 0) : 0;
    const c = parseInt(document.getElementById(`po-shutter-c-${idx}`)?.value) || 0;

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
        const qtyEl = document.getElementById(`po-qty-${idx}`);
        if (qtyEl) qtyEl.value = qty;
        this.recalcModalTotals();
      }
    }
  },

  addItem() {
    this.modalItems.push({ category: 'Hardware', description: '', qty: 1, unit: 'PCS', rate: 0 });
    this.renderModalItems();
    this.recalcModalTotals();
  },

  removeItem(idx) {
    this.modalItems.splice(idx, 1);
    this.renderModalItems();
    this.recalcModalTotals();
  },

  recalcModalTotals() {
    const subtotal = this.modalItems.reduce((s, i) => s + ((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)), 0);
    const gst = parseFloat(document.getElementById('po-gst')?.value) || 0;
    const addl = parseFloat(document.getElementById('po-additional-charges')?.value) || 0;
    const gstAmt = subtotal * gst / 100;
    const grand = subtotal + gstAmt + addl;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('po-subtotal-display', window.Utils.formatCurrency(subtotal));
    setEl('po-gst-display', window.Utils.formatCurrency(gstAmt));
    setEl('po-addl-display', window.Utils.formatCurrency(addl));
    setEl('po-grand-display', window.Utils.formatCurrency(grand));

    // Update individual item amounts
    this.modalItems.forEach((item, idx) => {
      const el = document.getElementById(`po-amount-${idx}`);
      if (el) el.textContent = window.Utils.formatCurrency((item.qty || 0) * (item.rate || 0));
    });
  },

  // Vendor select auto-fill phone
  onVendorSelect(val) {
    const vendorSel = document.getElementById('po-vendor-select');
    const opt = vendorSel?.querySelector(`option[value="${val}"]`);
    if (opt) {
      const nameEl = document.getElementById('po-vendor-name');
      const phoneEl = document.getElementById('po-vendor-phone');
      if (nameEl) nameEl.value = val;
      if (phoneEl) phoneEl.value = opt.dataset.phone || '';
    }
  },

  // ── Save PO ──────────────────────────────────────
  async savePO() {
    const store = window.AppStore;
    const projects = store.state.projects || [];

    const projId = document.getElementById('po-project')?.value;
    const project = projects.find(p => p.id === projId);
    const vendorName = document.getElementById('po-vendor-name')?.value?.trim();

    if (!vendorName) { window.ModalComponent.showToast('Please enter a vendor name.'); return; }
    if (this.modalItems.length === 0) { window.ModalComponent.showToast('Add at least one line item.'); return; }

    const hasValid = this.modalItems.some(i => i.description && i.qty > 0 && i.rate > 0);
    if (!hasValid) { window.ModalComponent.showToast('Please fill in at least one complete line item.'); return; }

    const gst = parseFloat(document.getElementById('po-gst')?.value) || 0;
    const addl = parseFloat(document.getElementById('po-additional-charges')?.value) || 0;
    const subtotal = this.modalItems.reduce((s, i) => s + (i.qty * i.rate), 0);
    const grand = subtotal + (subtotal * gst / 100) + addl;

    const editId = document.getElementById('po-edit-id')?.value;
    const isEdit = !!editId;

    let history = [];
    if (isEdit) {
      const prevPo = (store.state.purchaseOrders || []).find(p => p.id === editId);
      history = prevPo?.history || [];
      history.push({ date: new Date().toISOString().split('T')[0], text: `Purchase Order details updated (Value: ${window.Utils.formatCurrency(grand)})` });
    } else {
      history.push({ date: new Date().toISOString().split('T')[0], text: `Purchase Order created as Draft (Value: ${window.Utils.formatCurrency(grand)})` });
    }

    const po = {
      id: isEdit ? editId : `po-${Date.now()}`,
      poNumber: document.getElementById('po-number-field')?.value,
      projectId: projId,
      projectName: project?.name || 'Unknown Project',
      vendorName,
      vendorPhone: document.getElementById('po-vendor-phone')?.value || '',
      deliveryDate: window.Utils.toISODate(document.getElementById('po-delivery-date')?.value || ''),
      gst,
      additionalCharges: addl,
      notes: document.getElementById('po-notes')?.value || '',
      vendorConfirmed: document.getElementById('po-vendor-confirmed')?.checked || false,
      status: isEdit ? ((store.state.purchaseOrders || []).find(p => p.id === editId)?.status || 'Draft') : 'Draft',
      items: this.modalItems.filter(i => i.description),
      subtotal,
      grandTotal: grand,
      createdAt: isEdit ? ((store.state.purchaseOrders || []).find(p => p.id === editId)?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      history: history
    };

    if (!store.state.purchaseOrders) store.state.purchaseOrders = [];

    if (isEdit) {
      const idx = store.state.purchaseOrders.findIndex(p => p.id === editId);
      if (idx !== -1) store.state.purchaseOrders[idx] = po;
    } else {
      store.state.purchaseOrders.unshift(po);
    }

    store.saveState();
    this.closeCreateModal();
    window.ModalComponent.showToast(`${isEdit ? 'Updated' : 'Created'} ${po.poNumber} successfully!`);

    // Open detail view
    this.activePOId = po.id;
    this.viewMode = 'detail';
    window.AppRouter.refresh();
  },

  // ── Status Update ─────────────────────────────────
  async updateStatus(poId, status) {
    const pos = window.AppStore.state.purchaseOrders || [];
    const po = pos.find(p => p.id === poId);
    if (!po) return;
    po.status = status;
    if (!po.history) po.history = [];
    po.history.push({ date: new Date().toISOString().split('T')[0], text: `Status updated to ${status}` });
    window.AppStore.saveState();
    window.ModalComponent.showToast(`PO status updated to "${status}"`);
    window.AppRouter.refresh();
  },

  // ── Duplicate PO ──────────────────────────────────
  duplicatePO(poId) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;
    const copy = JSON.parse(JSON.stringify(po));
    copy.id = '';
    copy.poNumber = this.generatePONumber();
    copy.status = 'Draft';
    copy.createdAt = new Date().toISOString().split('T')[0];
    copy.vendorConfirmed = false;
    copy.history = [
      { date: copy.createdAt, text: `Purchase Order duplicated from ${po.poNumber}` }
    ];
    this.viewMode = 'list';
    this.openCreateModal(copy);
  },

  // ── Delete PO ────────────────────────────────────
  async deletePO(poId) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;
    if (!confirm(`Permanently delete ${po.poNumber}? This cannot be undone.`)) return;
    await window.dbService.deletePO(poId);
    window.ModalComponent.showToast(`${po.poNumber} deleted.`);
    this.viewMode = 'list';
    this.activePOId = null;
    window.AppRouter.refresh();
  },

  // ── WhatsApp Sharing ──────────────────────────────
  buildWhatsAppText(po, recipient) {
    const companyPhone = localStorage.getItem("company_phone") || "+91 98480 00000";
    const items = (po.items || []).map(i => {
      let desc = i.description;
      const dimStr = window.formatShutterDims(i);
      if (dimStr) {
        desc += ` [${dimStr}]`;
      }
      return `• ${desc} — ${i.qty} ${i.unit} @ ₹${i.rate}/${i.unit} = ₹${(i.qty * i.rate).toLocaleString('en-IN')}`;
    }).join('\n');

    const showProject = recipient !== 'vendor';

    const textStr = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Purchase Order*\n\n• *PO Number:* ${po.poNumber}\n• *Date:* ${window.Utils.formatDate(po.createdAt)}\n• *Company Contact:* ${companyPhone}\n${showProject ? `• *Project:* ${po.projectName}\n` : ''}• *Vendor:* ${po.vendorName}\n\n■ *Materials Ordered*\n${items}\n\n■ *Financial Details*\n• *Subtotal:* ₹${(po.subtotal || 0).toLocaleString('en-IN')}\n• *GST (${po.gst || 0}%):* ₹${Math.round((po.subtotal || 0) * (po.gst || 0) / 100).toLocaleString('en-IN')}\n• *Grand Total:* ₹${(po.grandTotal || 0).toLocaleString('en-IN')}\n\n■ *Logistic Details*\n• *Delivery Date:* ${po.deliveryDate ? window.Utils.formatDate(po.deliveryDate) : 'To be confirmed'}\n${po.notes ? `• *Notes:* ${po.notes}\n` : ''}\nPlease confirm receipt and production timeline.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Sourcing & Sourcing OS_`;

    return encodeURIComponent(textStr);
  },

  shareWhatsApp(poId) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;
    this._pendingSharePoId = poId;
    const modal = document.getElementById('po-share-modal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
  },

  shareWhatsAppTo(poId, recipient) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === (poId || this._pendingSharePoId));
    if (!po) return;

    const text = this.buildWhatsAppText(po, recipient);

    let phone = '';
    if (recipient === 'vendor') phone = (po.vendorPhone || '').replace(/[^+\d]/g, '');

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(url, '_blank');

    const modal = document.getElementById('po-share-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  },

  // ── Print / PDF Generation ────────────────────────
  printPO(poId) {
    const po = (window.AppStore.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    const companyPhone = localStorage.getItem("company_phone") || "+91 98480 00000";
    const companyLogo = localStorage.getItem("company_logo");

    const subtotal = po.subtotal || 0;
    const gstAmt = subtotal * (po.gst || 0) / 100;
    const addlCharges = po.additionalCharges || 0;
    const grand = po.grandTotal || 0;

    const items = (po.items || []).map((item, idx) => {
      let desc = item.description;
      const dimStr = window.formatShutterDims(item);
      if (dimStr) {
        desc += `<br><small style="color: #c5a880; font-size: 9px; font-weight: bold;">${dimStr}</small>`;
      }
      return `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.category}</td>
        <td>${desc}</td>
        <td style="text-align:right">${item.qty}</td>
        <td>${item.unit}</td>
        <td style="text-align:right">₹${item.rate.toLocaleString('en-IN')}</td>
        <td style="text-align:right">₹${(item.qty * item.rate).toLocaleString('en-IN')}</td>
      </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Purchase Order ${po.poNumber}</title>
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
    thead th:last-child, thead th:nth-child(4) { text-align: right; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #eee; }
    tbody td:last-child, tbody td:nth-child(4) { text-align: right; font-weight: 600; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
    .total-row.grand { border-top: 2px solid #1a1a1a; margin-top: 5px; padding-top: 10px; font-size: 14px; font-weight: 900; }
    .total-row.grand span:last-child { color: #f59e0b; }
    .notes-box { border: 1px solid #eee; border-radius: 6px; padding: 14px; margin: 20px 0; background: #fffbf0; }
    .notes-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .sign-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .sign-box { border-top: 1px solid #ccc; padding-top: 10px; }
    .sign-label { font-size: 10px; color: #888; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 9px; color: #aaa; text-align: center; }
    .status-badge { display: inline-block; background: #f59e0b20; color: #d97706; border: 1px solid #f59e0b40; border-radius: 4px; padding: 2px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${companyLogo ? `<img src="${companyLogo}" alt="Premio Living Logo" style="height: 48px; display: block; margin-bottom: 8px;">` : `
      <div class="brand-name">Premio Living</div>
      <div class="brand-sub">Interior Design &amp; Execution</div>
      `}
      <div style="margin-top:8px; font-size:10px; color:#555;">Hyderabad, Telangana<br>Phone: ${companyPhone}</div>
    </div>
    <div class="po-meta">
      <div class="po-label">Purchase Order</div>
      <div class="po-number">${po.poNumber}</div>
      <div class="po-date">Date: ${window.Utils.formatDate(po.createdAt)}</div>
      <div style="margin-top:6px"><span class="status-badge">${po.status}</span></div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-title">Vendor / Supplier</div>
      <div class="info-val">${po.vendorName}</div>
      <div class="info-sub">${po.vendorPhone || ''}</div>
    </div>
    <div class="info-box">
      <div class="info-title">Project</div>
      <div class="info-val">${po.projectName}</div>
      ${po.deliveryDate ? `<div class="info-sub">Delivery by: ${window.Utils.formatDate(po.deliveryDate)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Category</th>
        <th>Description / Specification</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
      <div class="total-row"><span>GST (${po.gst || 0}%)</span><span>₹${Math.round(gstAmt).toLocaleString('en-IN')}</span></div>
      <div class="total-row"><span>Additional Charges</span><span>₹${addlCharges.toLocaleString('en-IN')}</span></div>
      <div class="total-row grand"><span>Grand Total</span><span>₹${Math.round(grand).toLocaleString('en-IN')}</span></div>
    </div>
  </div>

  ${po.notes ? `
    <div class="notes-box">
      <div class="notes-title">Notes &amp; Instructions</div>
      <div>${po.notes}</div>
    </div>
  ` : ''}

  <div class="sign-section">
    <div class="sign-box">
      <div style="height:50px"></div>
      <div class="sign-label">Authorized by (Premio Living)</div>
      <div style="font-weight:700; margin-top:4px">Abhilash Reddy</div>
    </div>
    <div class="sign-box">
      <div style="height:50px"></div>
      <div class="sign-label">Vendor Acknowledgment</div>
      <div style="font-weight:700; margin-top:4px">${po.vendorName}</div>
    </div>
  </div>

  <div class="footer">
    This is a computer-generated Purchase Order from Premio Living. For queries contact: info@premioliving.in<br>
    Generated on: ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  toggleDimensionsPanel(idx) {
    const item = this.modalItems[idx];
    if (!item) return;
    item.showDimensionsPanel = !item.showDimensionsPanel;
    if (item.showDimensionsPanel) {
      if (item.shutterWidthEnabled === undefined && item.shutterHeightEnabled === undefined) {
        item.shutterWidthEnabled = true;
        item.shutterHeightEnabled = true;
      }
    }
    this.renderModalItems();
  }
};
