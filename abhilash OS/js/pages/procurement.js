/* js/pages/procurement.js - Premio Living OS Procurement Management OS */

window.ProcurementPage = {
  activeProjectId: null,
  activeTab: 'pipeline', // 'pipeline' | 'rfqs' | 'comparisons' | 'pos' | 'rates'
  activeSearch: '',
  activeRFQId: null,
  viewMode: 'list', // 'list' | 'rfq-detail'
  isScanning: false,
  scanningProgress: 0,
  extractedData: null,
  activePOId: null, // for detailed invoice/payment logging inside POs

  // Mock quotation files for the AI extraction simulation
  mockQuotations: {
    'stone_galleria_quote_attica.pdf': {
      vendorName: 'Stone & Marble Galleria',
      quoteNumber: 'SMG-261',
      quoteDate: '2026-05-28',
      materialDetails: 'Caesarstone Quartz Countertop White Attica',
      qty: 85,
      unit: 'SFT',
      rate: 820,
      gst: 18,
      deliveryTime: '7-9 Days',
      paymentTerms: '100% advance on confirmation',
      warranty: '5 Years Manufacturer Warranty',
      additionalCharges: 2500,
      notes: 'Price includes standard polishing. Excludes edge beveling.'
    },
    'whatsapp_screenshot_woodcrafts.jpg': {
      vendorName: 'Wood Crafts',
      quoteNumber: 'WC-552',
      quoteDate: '2026-05-29',
      materialDetails: 'Premium Teak Veneer TK-9081',
      qty: 350,
      unit: 'SFT',
      rate: 310,
      gst: 18,
      deliveryTime: '3-5 Days',
      paymentTerms: '50% Advance, 50% on Delivery',
      warranty: '1 Year Hinge & Carpentry Workmanship Warranty',
      additionalCharges: 1000,
      notes: 'Sourced from lot #22 sequential flitch.'
    },
    'grayzo_flooring_quote.xlsx': {
      vendorName: 'Royal Stones',
      quoteNumber: 'GI-2711',
      quoteDate: '2026-05-27',
      materialDetails: 'Italian Marble Dyna Beige',
      qty: 1550,
      unit: 'SFT',
      rate: 440,
      gst: 18,
      deliveryTime: '12-15 Days',
      paymentTerms: '50% advance, 40% on dispatch, 10% on installation',
      warranty: '2 Years Sealing & Alignment Warranty',
      additionalCharges: 5000,
      notes: 'Includes diamond polishing and custom grid sizing.'
    }
  },

  // ── Main Page Render ─────────────────────────────
  render(container) {
    // If no project selected, force Project-First Workflow
    if (!this.activeProjectId) {
      return this.renderProjectSelector(container);
    }
    
    // Check project exists
    const store = window.AppStore;
    const project = store.state.projects.find(p => p.id === this.activeProjectId);
    if (!project) {
      this.activeProjectId = null;
      return this.renderProjectSelector(container);
    }

    this.renderProcurementDashboard(container, project);
  },

  // ── Render Project-First Selector ─────────────────
  renderProjectSelector(container) {
    const store = window.AppStore;
    const projects = store.state.projects || [];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="border-b border-border-color pb-4 animate-fade-in">
          <h1 class="text-base font-bold text-white font-display flex items-center gap-2">
            <i data-lucide="shopping-bag" class="w-5 h-5 text-amber-500"></i>
            Procurement Command OS
          </h1>
          <p class="text-xs text-secondary mt-0.5">Please select a project workspace to manage quotations, RFQs, vendor selections, and payment dispatches.</p>
        </div>

        <!-- Project Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          ${projects.map(p => `
            <div onclick="window.ProcurementPage.selectProject('${p.id}')"
              class="card p-5 cursor-pointer hover:border-amber-500/40 hover:bg-hover/10 transition-all flex flex-col justify-between h-44 group">
              <div>
                <div class="flex items-start justify-between">
                  <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-primary text-secondary uppercase border border-border-color/30">${p.stage}</span>
                  <span class="text-[10px] font-mono text-amber-500 font-bold">${p.progress}% done</span>
                </div>
                <h3 class="text-sm font-bold font-display text-white mt-2 group-hover:text-amber-500 transition-colors">${p.name}</h3>
                <p class="text-xs text-secondary mt-1 line-clamp-2">${p.location}</p>
              </div>
              <div class="flex items-center justify-between border-t border-border-color/40 pt-3 text-xs">
                <div>
                  <span class="text-muted block text-[8px] uppercase font-bold">Project Manager</span>
                  <span class="text-white">${p.team.pm || 'Abhilash Reddy'}</span>
                </div>
                <button class="px-3 py-1.5 bg-amber-500 text-black font-bold text-[10px] rounded flex items-center gap-1 group-hover:scale-105 transition-transform">
                  Enter Procurement <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  selectProject(projId) {
    this.activeProjectId = projId;
    this.activeTab = 'rfqs';
    this.activeRFQId = null;
    this.viewMode = 'list';
    this.activePOId = null;
    window.AppRouter.refresh();
  },

  // ── Render Project Procurement Center ─────────────
  renderProcurementDashboard(container, project) {
    const store = window.AppStore;
    const role = store.activeRole;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Top Navigation / Project Title Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-4 animate-fade-in">
          <div class="flex items-center gap-3">
            <button onclick="window.ProcurementPage.activeProjectId = null; window.AppRouter.refresh()"
              class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Change Project">
              <i data-lucide="arrow-left" class="w-4 h-4 text-secondary hover:text-white"></i>
            </button>
            <div>
              <span class="text-[9px] text-amber-500 uppercase tracking-widest font-mono font-bold block">Active Procurement Workspace</span>
              <h1 class="text-base font-bold text-white font-display flex items-center gap-2 mt-0.5">
                <i data-lucide="shopping-bag" class="w-4.5 h-4.5 text-amber-500"></i>
                ${project.name}
              </h1>
            </div>
          </div>
          <!-- Quick Project Switcher Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-secondary hidden md:inline">Switch Workspace:</span>
            <select onchange="window.ProcurementPage.selectProject(this.value)"
              class="text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
              ${store.state.projects.map(p => `<option value="${p.id}" ${p.id === project.id ? 'selected' : ''}>${p.name.split(' (')[0]}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Procurement Progress Tabs -->
        <div class="flex border-b border-border-color/60 gap-4 text-xs pb-1 overflow-x-auto no-scrollbar animate-fade-in font-display font-semibold">
          <button onclick="window.ProcurementPage.setTab('pipeline')" class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeTab === 'pipeline' ? 'border-b-2 border-amber-500 text-white font-bold' : 'text-secondary hover:text-white'}">
            <i data-lucide="kanban" class="w-3.5 h-3.5"></i> Visual Sourcing Pipeline
          </button>
          <button onclick="window.ProcurementPage.setTab('rfqs')" class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeTab === 'rfqs' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            <i data-lucide="file-question" class="w-3.5 h-3.5"></i> 1. RFQ & Quote Upload
          </button>
          <button onclick="window.ProcurementPage.setTab('comparisons')" class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeTab === 'comparisons' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            <i data-lucide="trello" class="w-3.5 h-3.5"></i> 2. Compare & Select
          </button>
          <button onclick="window.ProcurementPage.setTab('pos')" class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeTab === 'pos' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            <i data-lucide="clipboard-signature" class="w-3.5 h-3.5"></i> 3. Orders & Payments
          </button>
          <button onclick="window.ProcurementPage.setTab('rates')" class="pb-2 font-bold px-1 transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeTab === 'rates' ? 'border-b-2 border-amber-500 text-white' : 'text-secondary hover:text-white'}">
            <i data-lucide="history" class="w-3.5 h-3.5"></i> 4. Sourcing Rate Index
          </button>
        </div>

        <!-- Tab Body Container -->
        <div class="space-y-4 animate-fade-in">
          ${this.renderTabContent(project, role)}
        </div>

      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  setTab(tab) {
    this.activeTab = tab;
    this.activeSearch = '';
    this.activePOId = null;
    this.viewMode = 'list';
    window.AppRouter.refresh();
  },

  // ── Router for Tabs Content ───────────────────────
  renderTabContent(project, role) {
    if (this.activeTab === 'pipeline') {
      return this.renderPipelineTab(project, role);
    }
    if (this.activeTab === 'rfqs') {
      return this.renderRFQsTab(project, role);
    }
    if (this.activeTab === 'comparisons') {
      return this.renderComparisonsTab(project, role);
    }
    if (this.activeTab === 'pos') {
      return this.renderPOsTab(project, role);
    }
    if (this.activeTab === 'rates') {
      return this.renderRatesTab();
    }
    return '';
  },

  // ===================================================
  // TAB 1: RFQ & QUOTE UPLOAD
  // ===================================================
  renderRFQsTab(project, role) {
    const store = window.AppStore;
    const rfqs = (store.state.rfqs || []).filter(r => r.projectId === project.id);

    if (this.viewMode === 'rfq-detail' && this.activeRFQId) {
      return this.renderRFQDetailView(project, role);
    }

    return `
      <div class="space-y-4">
        <!-- Dashboard Toolbar -->
        <div class="flex justify-between items-center bg-hover/20 p-3 rounded-lg border border-border-color/30">
          <span class="text-xs font-semibold text-white font-mono">${rfqs.length} Request${rfqs.length !== 1 ? 's' : ''} Issued</span>
          ${role === 'admin' ? `
            <button onclick="window.RFQPage.openCreateViewFromProcurement('${project.id}', '${project.name.replace(/'/g, "\\'")}')"
              class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[10px] rounded flex items-center gap-1.5 shadow-md">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Issue New RFQ
            </button>
          ` : ''}
        </div>

        <!-- RFQs List -->
        ${rfqs.length === 0 ? `
          <div class="card p-12 text-center">
            <i data-lucide="file-question" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1">No RFQs Issued for this Project</p>
            <p class="text-xs text-secondary mb-3">Begin sourcing by issuing a Request for Quotation (RFQ) directly to vendors.</p>
            <button onclick="window.RFQPage.openCreateViewFromProcurement('${project.id}', '${project.name.replace(/'/g, "\\'")}')"
              class="px-3 py-2 bg-amber-500 text-black font-bold text-xs rounded inline-flex items-center gap-1 hover:scale-105 transition-transform">
              <i data-lucide="plus" class="w-4 h-4"></i> Issue First RFQ
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${rfqs.map(r => {
              const cfg = window.RFQPage.statusConfig(r.status);
              const quotesCount = r.quotes?.length || 0;
              return `
                <div class="card p-4 space-y-3 cursor-pointer hover:border-amber-500/25 transition-all flex flex-col justify-between"
                  onclick="window.ProcurementPage.openRFQDetails('${r.id}')">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-amber-500 text-xs">${r.rfqNumber}</span>
                      <span class="px-2 py-0.5 rounded border text-[8px] font-mono uppercase font-bold ${cfg.color}">${r.status}</span>
                    </div>
                    <h4 class="text-xs font-bold text-white block truncate">${r.itemDescription}</h4>
                    <div class="flex gap-3 text-[10px] text-muted">
                      <span>Category: <b class="text-secondary font-mono">${r.category}</b></span>
                      <span>Volume: <b class="text-secondary font-mono">${r.qty} ${r.unit}</b></span>
                    </div>
                  </div>
                  <div class="border-t border-border-color/30 pt-2 flex items-center justify-between mt-2">
                    <div class="flex items-center gap-1.5 text-[9px] text-secondary">
                      <i data-lucide="trello" class="w-3.5 h-3.5 text-purple-400"></i>
                      <span>${quotesCount} Quotation${quotesCount !== 1 ? 's' : ''} Uploaded</span>
                    </div>
                    <button class="px-2.5 py-1 bg-hover hover:bg-border-color border border-border-color/30 text-white rounded font-bold text-[9px] flex items-center gap-1">
                      Upload/Review <i data-lucide="chevron-right" class="w-3 h-3"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  openRFQDetails(rfqId) {
    this.activeRFQId = rfqId;
    this.viewMode = 'rfq-detail';
    this.isScanning = false;
    this.extractedData = null;
    window.AppRouter.refresh();
  },

  // ── Render RFQ details with Drag/Drop Quote Uploader ────
  renderRFQDetailView(project, role) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === this.activeRFQId);
    if (!rfq) return '';

    const quotes = rfq.quotes || [];

    return `
      <div class="space-y-4">
        <!-- Back to list bar -->
        <div class="flex items-center justify-between border-b border-border-color/30 pb-2">
          <button onclick="window.ProcurementPage.viewMode='list'; window.AppRouter.refresh()"
            class="px-2.5 py-1.5 bg-hover border border-border-color rounded text-white text-xs font-bold flex items-center gap-1">
            <i data-lucide="chevron-left" class="w-4 h-4"></i> Back to RFQ List
          </button>
          <span class="font-mono text-xs font-bold text-amber-500">${rfq.rfqNumber} Detail Workspace</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Specs details -->
          <div class="card p-4 space-y-3 text-xs md:col-span-1">
            <span class="text-[9px] text-muted uppercase font-bold block">Material Specs</span>
            <div class="space-y-2 border-b border-border-color/30 pb-3">
              <div><span class="text-secondary block">Description</span><span class="text-white font-bold text-xs">${rfq.itemDescription}</span></div>
              <div><span class="text-secondary block">Category</span><span class="text-white font-semibold">${rfq.category}</span></div>
              <div><span class="text-secondary block">Quantity / Unit</span><span class="text-white font-mono font-bold">${rfq.qty} ${rfq.unit}</span></div>
            </div>
            <div>
              <span class="text-secondary block">Notified Vendors list</span>
              <div class="flex flex-wrap gap-1 mt-1">
                ${rfq.vendors.map(v => `<span class="px-1.5 py-0.5 bg-primary/40 rounded border border-border-color/30 text-[9px] text-secondary font-mono">${v}</span>`).join('')}
              </div>
            </div>
            <!-- Quick PDF / WhatsApp dispatches -->
            <div class="pt-2 flex gap-1">
              <button onclick="window.RFQPage.printRFQ('${rfq.id}')"
                class="flex-1 py-1.5 bg-hover hover:bg-border-color border border-border-color/30 rounded text-white font-bold text-[9px] flex items-center justify-center gap-1">
                <i data-lucide="printer" class="w-3 h-3"></i> Printable PDF
              </button>
              <button onclick="window.ProcurementPage.triggerRFQWhatsAppShare('${rfq.id}')"
                class="flex-1 py-1.5 bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 font-bold rounded text-[9px] flex items-center justify-center gap-1 hover:bg-emerald-600/25">
                <i data-lucide="phone" class="w-3 h-3"></i> WhatsApp Share
              </button>
            </div>
          </div>

          <!-- Document Upload & AI Extract Area -->
          <div class="card p-4 space-y-4 md:col-span-2 text-xs">
            <div class="border-b border-border-color/30 pb-2">
              <h3 class="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i> AI Document study & Quotation Capture
              </h3>
              <p class="text-[9px] text-secondary mt-0.5">Drag/Drop PDF, Excel quote spreadsheets, or images. Our AI engine extracts parameters instantly.</p>
            </div>

            <!-- Upload dropzone simulation -->
            ${!this.isScanning && !this.extractedData ? `
              <div onclick="document.getElementById('real-quote-file-input').click()"
                class="border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-400/50 transition-all rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer">
                <input type="file" id="real-quote-file-input" class="hidden" onclick="event.stopPropagation()" onchange="window.ProcurementPage.handleActualFileUpload(this.files)">
                <i data-lucide="upload-cloud" class="w-8 h-8 text-purple-400 animate-pulse"></i>
                <div>
                  <span class="text-white font-bold block">Click to Upload or Drop Sourced Quotation File Here</span>
                  <span class="text-[10px] text-muted block mt-1">Supports PDF, XLS, PNG, JPEG screenshots</span>
                </div>
                <div class="pt-2 border-t border-border-color/30 w-full max-w-xs mt-2" onclick="event.stopPropagation()">
                  <span class="text-[9px] text-purple-400 font-bold block uppercase mb-2">Simulate File Selection</span>
                  <div class="flex flex-col gap-1.5">
                    ${Object.keys(this.mockQuotations).map(fileName => {
                      const data = this.mockQuotations[fileName];
                      return `
                        <button onclick="window.ProcurementPage.simulateQuoteFileScan('${fileName}')"
                          class="py-1.5 px-3 bg-primary border border-border-color hover:border-purple-400 rounded text-left text-white text-[10px] flex items-center justify-between font-mono">
                          <span>📄 ${fileName}</span>
                          <span class="text-[8px] text-secondary font-sans font-bold">(${data.vendorName})</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Scanning Loading animation -->
            ${this.isScanning ? `
              <div class="p-8 text-center space-y-4 flex flex-col items-center justify-center">
                <div class="w-12 h-12 rounded-full border-2 border-t-purple-400 border-border-color animate-spin"></div>
                <div class="space-y-1">
                  <span class="text-white font-bold block">AI Reading Document...</span>
                  <span class="text-[10px] text-secondary block font-mono">Extracting rates, quantities, payment terms, and vendor warranties...</span>
                </div>
                <div class="w-full max-w-xs bg-primary rounded-full h-1.5 overflow-hidden">
                  <div class="bg-purple-500 h-1.5 transition-all duration-300" style="width: ${this.scanningProgress}%"></div>
                </div>
              </div>
            ` : ''}

            <!-- Review AI Extracted Parameters Form -->
            ${this.extractedData ? `
              <div class="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-4 animate-scale-in">
                <div class="flex items-center justify-between border-b border-purple-500/15 pb-2">
                  <span class="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Extracted Parameters Review (AI Confidence: 99%)
                  </span>
                  <button onclick="window.ProcurementPage.extractedData = null; window.AppRouter.refresh()"
                    class="text-[9px] text-secondary hover:text-white underline">Re-upload file</button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Vendor Name</label>
                    <input type="text" id="ai-q-vendor" value="${this.extractedData.vendorName}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Quote Reference #</label>
                    <input type="text" id="ai-q-ref" value="${this.extractedData.quoteNumber}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white font-mono focus:outline-none">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Quotation Date</label>
                    <input type="text" id="ai-q-date" value="${window.Utils.toDisplayDate(this.extractedData.quoteDate)}" placeholder="DD-MM-YYYY" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Material Details</label>
                    <input type="text" id="ai-q-desc" value="${this.extractedData.materialDetails}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Quantity</label>
                    <input type="number" id="ai-q-qty" value="${this.extractedData.qty}" oninput="window.ProcurementPage.recalcAITotal()" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Unit</label>
                    <input type="text" id="ai-q-unit" value="${this.extractedData.unit}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Unit Rate (₹)</label>
                    <input type="number" id="ai-q-rate" value="${this.extractedData.rate}" oninput="window.ProcurementPage.recalcAITotal()" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none font-mono">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">GST %</label>
                    <input type="number" id="ai-q-gst" value="${this.extractedData.gst}" oninput="window.ProcurementPage.recalcAITotal()" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none font-mono">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Extra Charges (₹)</label>
                    <input type="number" id="ai-q-charges" value="${this.extractedData.additionalCharges}" oninput="window.ProcurementPage.recalcAITotal()" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none font-mono">
                  </div>
                  <div>
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Delivery Lead Time</label>
                    <input type="text" id="ai-q-delivery" value="${this.extractedData.deliveryTime}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Warranty Details</label>
                    <input type="text" id="ai-q-warranty" value="${this.extractedData.warranty}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div class="col-span-3">
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Payment Terms</label>
                    <input type="text" id="ai-q-payment" value="${this.extractedData.paymentTerms}" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none">
                  </div>
                  <div class="col-span-3">
                    <label class="block text-[9px] text-muted uppercase font-bold mb-1">Vendor Remarks & Special Exclusions</label>
                    <textarea id="ai-q-notes" rows="2" class="w-full text-xs p-1.5 rounded border border-border-color bg-primary text-white focus:outline-none resize-none">${this.extractedData.notes}</textarea>
                  </div>
                </div>

                <!-- Summation Banner -->
                <div class="bg-primary/40 border border-border-color/30 rounded p-3 flex justify-between items-center text-xs">
                  <div>
                    <span class="text-secondary block">Total Extracted Sum (Inclusive of GST & Charges)</span>
                    <span class="text-muted block text-[10px]">Calculated: Qty * Rate + GST + Extra</span>
                  </div>
                  <span id="ai-q-sum" class="font-mono font-bold text-amber-500 text-sm">₹0</span>
                </div>

                <!-- Review Actions -->
                <div class="flex justify-end gap-2 pt-2 border-t border-purple-500/15">
                  <button onclick="window.ProcurementPage.extractedData = null; window.AppRouter.refresh()"
                    class="px-4 py-2 bg-primary border border-border-color text-white rounded">Cancel</button>
                  <button onclick="window.ProcurementPage.approveAndSaveExtractedQuote('${rfq.id}')"
                    class="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded flex items-center gap-1.5 transition-all hover:scale-105">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Approve, Save & Index
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Uploaded Quotations List -->
            <div class="space-y-2 mt-4 pt-3 border-t border-border-color/30">
              <span class="text-[9px] text-muted uppercase font-bold block">Smart Quotation Database Storage</span>
              ${quotes.length === 0 ? `
                <div class="p-4 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
                  No quotations stored for this RFQ yet. Use file simulations above to scan vendor proposals.
                </div>
              ` : `
                <div class="space-y-2">
                  ${quotes.map((q, qidx) => `
                    <div class="bg-primary/40 rounded-lg border border-border-color/30 p-3 flex items-center justify-between text-xs hover:border-purple-400/20 transition-all">
                      <div class="space-y-0.5">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-white">${q.vendorName}</span>
                          <span class="font-mono text-[9px] text-secondary">Quote Ref: ${q.quoteNumber || '—'}</span>
                        </div>
                        <div class="flex flex-wrap gap-x-3 text-[10px] text-secondary font-mono">
                          <span>Value: <b class="text-amber-500">${window.Utils.formatCurrency((q.rate * rfq.qty) + ((q.rate * rfq.qty) * (q.gst || 0) / 100) + (q.additionalCharges || 0))}</b></span>
                          <span>Lead Time: <b class="text-white">${q.deliveryTime || '—'}</b></span>
                          <span>Warranty: <b class="text-white">${q.warranty || '—'}</b></span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-[9px] font-mono">Structured JSON & PDF</span>
                        <button onclick="window.RFQPage.deleteQuote('${rfq.id}', ${qidx})"
                          class="p-1 hover:bg-rose-500/10 rounded text-rose-500" title="Delete Quote">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

          </div>
        </div>
      </div>
    `;
  },

  // ── Recalc AI Sum Inline ─────────────────────────
  recalcAITotal() {
    const qty = parseFloat(document.getElementById('ai-q-qty')?.value) || 0;
    const rate = parseFloat(document.getElementById('ai-q-rate')?.value) || 0;
    const gst = parseFloat(document.getElementById('ai-q-gst')?.value) || 0;
    const charges = parseFloat(document.getElementById('ai-q-charges')?.value) || 0;
    const sub = qty * rate;
    const total = sub + (sub * gst / 100) + charges;
    const sumEl = document.getElementById('ai-q-sum');
    if (sumEl) sumEl.textContent = window.Utils.formatCurrency(total);
  },

  // ── Actual File Upload Handler ───────────────────
  handleActualFileUpload(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.toLowerCase();

    // Determine matching mock key based on file name keywords
    let matchedKey = 'stone_galleria_quote_attica.pdf'; // default fallback
    if (name.includes('wood') || name.includes('craft') || name.includes('veneer') || name.includes('carpentry')) {
      matchedKey = 'whatsapp_screenshot_woodcrafts.jpg';
    } else if (name.includes('grayzo') || name.includes('dyna') || name.includes('floor') || name.includes('marble') || name.includes('royal')) {
      matchedKey = 'grayzo_flooring_quote.xlsx';
    }

    this.simulateQuoteFileScan(matchedKey);
  },

  // ── AI Scan Simulation Timer ─────────────────────
  simulateQuoteFileScan(fileName) {
    const quoteData = this.mockQuotations[fileName];
    if (!quoteData) return;

    this.isScanning = true;
    this.scanningProgress = 0;
    window.AppRouter.refresh();

    // Increment scanner bar progress
    const timer = setInterval(() => {
      this.scanningProgress += 20;
      const bar = document.querySelector('.bg-purple-500.h-1.5');
      if (bar) bar.style.width = `${this.scanningProgress}%`;

      if (this.scanningProgress >= 100) {
        clearInterval(timer);
        this.isScanning = false;
        this.extractedData = quoteData;
        window.AppRouter.refresh();
        // Calculate initial sum
        this.recalcAITotal();
      }
    }, 250);
  },

  // ── Save AI Reviewed quote ───────────────────────
  approveAndSaveExtractedQuote(rfqId) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    const vendorName = document.getElementById('ai-q-vendor').value.trim();
    const quoteNumber = document.getElementById('ai-q-ref').value.trim();
    const quoteDate = window.Utils.toISODate(document.getElementById('ai-q-date').value);
    const materialDetails = document.getElementById('ai-q-desc').value.trim();
    const qty = parseFloat(document.getElementById('ai-q-qty').value) || rfq.qty;
    const unit = document.getElementById('ai-q-unit').value.trim();
    const rate = parseFloat(document.getElementById('ai-q-rate').value) || 0;
    const gst = parseFloat(document.getElementById('ai-q-gst').value) || 0;
    const additionalCharges = parseFloat(document.getElementById('ai-q-charges').value) || 0;
    const deliveryTime = document.getElementById('ai-q-delivery').value.trim();
    const warranty = document.getElementById('ai-q-warranty').value.trim();
    const paymentTerms = document.getElementById('ai-q-payment').value.trim();
    const notes = document.getElementById('ai-q-notes').value.trim();

    if (!vendorName) { window.ModalComponent.showToast('Vendor Name is required.'); return; }
    if (rate <= 0) { window.ModalComponent.showToast('Unit Rate must be greater than zero.'); return; }

    const quote = {
      vendorName,
      quoteNumber,
      quoteDate,
      materialDetails,
      qty,
      unit,
      rate,
      gst,
      additionalCharges,
      deliveryTime,
      warranty,
      paymentTerms,
      notes,
      submittedAt: new Date().toISOString().split('T')[0]
    };

    if (!rfq.quotes) rfq.quotes = [];
    rfq.quotes.push(quote);

    // Update RFQ status automatically
    if (rfq.status === 'Draft' || rfq.status === 'Sent') {
      rfq.status = 'Quote Received';
    }

    if (!rfq.history) rfq.history = [];
    rfq.history.push({ date: new Date().toISOString().split('T')[0], text: `AI scanned and indexed quotation from ${vendorName} (Quote: ${quoteNumber})` });

    store.saveState();
    window.ModalComponent.showToast(`Quotation from ${vendorName} approved & saved to database!`);
    this.extractedData = null;
    window.AppRouter.refresh();
  },

  // ===================================================
  // TAB 2: SIDE-BY-SIDE COMPARE & SELECT
  // ===================================================
  renderComparisonsTab(project, role) {
    const store = window.AppStore;
    const rfqs = (store.state.rfqs || []).filter(r => r.projectId === project.id);

    if (rfqs.length === 0) {
      return `
        <div class="card p-12 text-center text-xs">
          <i data-lucide="trello" class="w-10 h-10 text-muted mx-auto mb-3"></i>
          <p class="text-sm font-semibold text-white mb-1 font-display">No Sourcing RFQs Exist</p>
          <p class="text-secondary">Please create an RFQ and log quotes under the first tab to configure comparisons.</p>
        </div>
      `;
    }

    // Set default selected RFQ if none chosen
    if (!this.activeRFQId) {
      const pendingCompare = rfqs.find(r => r.quotes && r.quotes.length > 0);
      this.activeRFQId = pendingCompare ? pendingCompare.id : rfqs[0].id;
    }

    const rfq = rfqs.find(r => r.id === this.activeRFQId);
    const quotes = rfq?.quotes || [];

    // Calculate overall lowest Grand Total
    const totalsList = quotes.map(q => {
      const sub = (q.rate || 0) * rfq.qty;
      const gstAmt = sub * (q.gst || 0) / 100;
      return sub + gstAmt + (q.additionalCharges || 0);
    });
    const lowestTotal = totalsList.length > 0 ? Math.min(...totalsList) : 0;

    return `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        
        <!-- Sidebar RFQ Selector List -->
        <div class="card p-3 space-y-2 md:col-span-1">
          <span class="text-[9px] text-muted uppercase font-bold block border-b border-border-color/30 pb-2">Material Sourcing RFQs</span>
          <div class="space-y-1.5 max-h-96 overflow-y-auto no-scrollbar">
            ${rfqs.map(r => {
              const count = r.quotes?.length || 0;
              const isSelected = r.id === this.activeRFQId;
              return `
                <div onclick="window.ProcurementPage.activeRFQId='${r.id}'; window.AppRouter.refresh()"
                  class="p-2 rounded cursor-pointer transition-all border ${isSelected ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-primary/25 border-border-color/40 text-secondary hover:text-white'}">
                  <span class="font-mono text-[9px] block font-bold text-amber-500">${r.rfqNumber}</span>
                  <span class="font-bold block truncate mt-0.5">${r.itemDescription}</span>
                  <span class="text-[8px] text-muted font-mono">${count} quote${count !== 1 ? 's' : ''} received</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Sourcing Comparison Grid Sheet -->
        <div class="card p-4 space-y-4 md:col-span-3">
          <div class="border-b border-border-color/30 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span class="font-mono text-[10px] text-amber-500 font-bold block">${rfq ? rfq.rfqNumber : ''} Sourcing Dashboard</span>
              <h3 class="font-bold text-white uppercase text-xs mt-0.5">${rfq ? rfq.itemDescription : 'No RFQ Selected'}</h3>
            </div>
            ${rfq && rfq.selectedVendor ? `
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded text-[9px]">Winner: ${rfq.selectedVendor}</span>
              </div>
            ` : ''}
          </div>

          ${quotes.length === 0 ? `
            <div class="p-12 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
              <i data-lucide="scale" class="w-8 h-8 text-muted mx-auto mb-2"></i>
              No vendor bids logged for this RFQ yet.<br>
              <button onclick="window.ProcurementPage.setTab('rfqs')" class="mt-3 px-3 py-1.5 bg-purple-500 text-white font-bold rounded">Go to Quote Upload & Scanner</button>
            </div>
          ` : `
            <!-- Sourcing Matrix Sheet -->
            <div class="overflow-x-auto border border-border-color/30 rounded-lg">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-border-color bg-primary/40 text-[9px] text-secondary uppercase font-semibold font-mono">
                    <th class="px-3 py-2 border-r border-border-color/20">Metric / Parameter</th>
                    ${quotes.map(q => `
                      <th class="px-3 py-2 text-center border-r border-border-color/20 ${rfq.selectedVendor === q.vendorName ? 'bg-amber-500/5' : ''}">
                        <div class="font-bold text-white text-xs">${q.vendorName}</div>
                        <div class="text-[8px] text-muted font-mono mt-0.5">Ref: ${q.quoteNumber || '—'}</div>
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">Material Spec</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center text-secondary font-medium">${q.materialDetails || rfq.itemDescription}</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">Sourcing Rate</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center font-mono font-bold text-white">${window.Utils.formatCurrency(q.rate)} / ${rfq.unit}</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">Lead Delivery Time</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center text-white font-medium">${q.deliveryTime || '—'}</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">Warranty Scope</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center text-secondary truncate max-w-[120px]" title="${q.warranty || ''}">${q.warranty || '—'}</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">Commercial Terms</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center text-secondary truncate max-w-[150px]" title="${q.paymentTerms || ''}">${q.paymentTerms || '—'}</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30">
                    <td class="px-3 py-2 font-semibold text-white border-r border-border-color/20 bg-primary/20">GST / Taxes</td>
                    ${quotes.map(q => `<td class="px-3 py-2 border-r border-border-color/20 text-center font-mono text-secondary">${q.gst || 0}%</td>`).join('')}
                  </tr>
                  <tr class="border-b border-border-color/30 bg-primary/10">
                    <td class="px-3 py-2 font-bold text-white border-r border-border-color/20">Grand Total Value</td>
                    ${quotes.map(q => {
                      const sub = (q.rate || 0) * rfq.qty;
                      const gstAmt = sub * (q.gst || 0) / 100;
                      const total = sub + gstAmt + (q.additionalCharges || 0);
                      const isBest = total === lowestTotal;
                      return `
                        <td class="px-3 py-2.5 border-r border-border-color/20 text-center font-mono font-bold text-amber-500 text-sm">
                          ${window.Utils.formatCurrency(total)}
                          ${isBest ? `<div class="text-[7px] text-emerald-400 uppercase font-extrabold block mt-0.5 tracking-wider">★ Best Value</div>` : ''}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                  <tr class="bg-primary/20">
                    <td class="px-3 py-3 font-semibold text-white border-r border-border-color/20">Sourcing Decision</td>
                    ${quotes.map(q => {
                      const isSelected = rfq.selectedVendor === q.vendorName;
                      return `
                        <td class="px-3 py-3 border-r border-border-color/20 text-center">
                          ${rfq.convertedToPO ? `
                            ${isSelected ? `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-sans">Winner Approved</span>` : `<span class="text-muted">—</span>`}
                          ` : `
                            <button onclick="window.ProcurementPage.promptSelectionReason('${rfq.id}', '${q.vendorName}')"
                              class="px-3 py-1.5 rounded font-bold border text-[10px] transition-all ${isSelected ? 'bg-amber-500 text-black border-amber-400' : 'bg-primary text-secondary border-border-color hover:text-white'}">
                              ${isSelected ? '✓ Selected' : 'Approve Vendor'}
                            </button>
                          `}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- RFQ PO conversions -->
            ${rfq.selectedVendor ? `
              <div class="card p-4 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">Decision Reason & Approval Details</span>
                  <p class="text-xs text-white">Winning Vendor: <b class="text-amber-400 font-bold">${rfq.selectedVendor}</b></p>
                  <p class="text-xs text-secondary mt-1 italic">"Reason: ${rfq.selectionReason || 'No special selection reason specified.'}"</p>
                </div>
                <div>
                  ${rfq.convertedToPO ? `
                    <button onclick="window.ProcurementPage.activePOId='${rfq.poId}'; window.ProcurementPage.setTab('pos')"
                      class="px-4 py-2 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-400 font-bold text-xs rounded border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
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
          `}
        </div>

      </div>
    `;
  },

  // ── Selection Reason Prompter (UI simulation) ─────
  promptSelectionReason(rfqId, vendorName) {
    const reason = prompt(`Specify the reason for selecting ${vendorName} as the approved vendor for this material sourcing order:`, 'Lowest quotation and immediate ex-factory dispatch schedule.');
    if (reason === null) return; // cancel click

    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    rfq.selectedVendor = vendorName;
    rfq.selectionReason = reason || 'Lowest rate and immediate shipment.';
    rfq.status = 'Approved';

    if (!rfq.history) rfq.history = [];
    rfq.history.push({ 
      date: new Date().toISOString().split('T')[0], 
      text: `Approved vendor ${vendorName}. Reason: ${rfq.selectionReason}` 
    });

    store.saveState();
    window.ModalComponent.showToast(`Approved ${vendorName} successfully!`);
    window.AppRouter.refresh();
  },

  // ===================================================
  // TAB 3: PURCHASE ORDERS & INVOICES / PAYMENTS TRACKING
  // ===================================================
  renderPOsTab(project, role) {
    const store = window.AppStore;
    const pos = (store.state.purchaseOrders || []).filter(p => p.projectId === project.id);

    if (pos.length === 0) {
      return `
        <div class="card p-12 text-center text-xs">
          <i data-lucide="clipboard-signature" class="w-10 h-10 text-muted mx-auto mb-3"></i>
          <p class="text-sm font-semibold text-white mb-1 font-display">No Purchase Orders Issued</p>
          <p class="text-secondary">Procurements undergo RFQ approvals first. Approve and convert RFQs to generate POs here.</p>
        </div>
      `;
    }

    if (this.activePOId) {
      return this.renderPODetailedTrackingView(role);
    }

    return `
      <div class="space-y-4 text-xs">
        <span class="text-xs font-semibold text-white block mb-1 font-mono">${pos.length} Purchase Order${pos.length !== 1 ? 's' : ''} Issued</span>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${pos.map(po => {
            const cfg = window.POPage.statusConfig(po.status);
            const itemsCount = po.items?.length || 0;
            const invoiceSum = (po.invoices || []).reduce((s, i) => s + (i.amount || 0), 0);
            const paymentSum = (po.payments || []).reduce((s, p) => s + (p.amount || 0), 0);

            return `
              <div onclick="window.ProcurementPage.activePOId='${po.id}'; window.AppRouter.refresh()"
                class="card p-4 space-y-3 cursor-pointer hover:border-amber-500/25 transition-all flex flex-col justify-between">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-amber-500 text-xs">${po.poNumber}</span>
                    <span class="px-2 py-0.5 rounded border text-[8px] font-mono uppercase font-bold ${cfg.color}">${po.status}</span>
                  </div>
                  <h4 class="font-bold text-white truncate text-xs">${po.vendorName}</h4>
                  <div class="flex gap-4 text-[10px] text-secondary font-mono mt-1">
                    <span>PO Value: <b class="text-white">${window.Utils.formatCurrency(po.grandTotal)}</b></span>
                    <span>Items: <b class="text-white">${itemsCount}</b></span>
                  </div>
                </div>

                <!-- Financial trackers -->
                <div class="bg-primary/20 border border-border-color/30 rounded p-2.5 grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div>
                    <span class="text-muted block text-[8px] uppercase font-sans">PO Total</span>
                    <span class="text-white font-bold">${window.Utils.formatCurrency(po.grandTotal)}</span>
                  </div>
                  <div>
                    <span class="text-muted block text-[8px] uppercase font-sans">Invoiced</span>
                    <span class="text-purple-400 font-bold">${window.Utils.formatCurrency(invoiceSum)}</span>
                  </div>
                  <div>
                    <span class="text-muted block text-[8px] uppercase font-sans">Paid</span>
                    <span class="text-emerald-400 font-bold">${window.Utils.formatCurrency(paymentSum)}</span>
                  </div>
                </div>

                <div class="border-t border-border-color/30 pt-2 flex justify-between items-center text-[10px] text-muted">
                  <span>Created: ${window.Utils.formatDate(po.createdAt)}</span>
                  <button class="px-2 py-1 bg-hover hover:bg-border-color rounded text-white font-bold text-[9px] flex items-center gap-0.5">
                    Log Payments/Invoices <i data-lucide="chevron-right" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ── Render invoice + payment tracking dashboard for selected PO ──
  renderPODetailedTrackingView(role) {
    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === this.activePOId);
    if (!po) return '';

    const invoices = po.invoices || [];
    const payments = po.payments || [];

    const invoiceSum = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paymentSum = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balance = po.grandTotal - paymentSum;

    const statuses = ['Draft', 'Sent', 'Confirmed', 'In Production', 'Dispatched', 'Delivered', 'Closed'];

    return `
      <div class="space-y-4 text-xs">
        
        <!-- Back to list bar -->
        <div class="flex items-center justify-between border-b border-border-color/30 pb-2">
          <button onclick="window.ProcurementPage.activePOId=null; window.AppRouter.refresh()"
            class="px-2.5 py-1.5 bg-hover border border-border-color rounded text-white text-xs font-bold flex items-center gap-1">
            <i data-lucide="chevron-left" class="w-4 h-4"></i> Back to Orders List
          </button>
          <span class="font-mono text-xs font-bold text-amber-500">${po.poNumber} Procurement Tracking Center</span>
        </div>

        <!-- Upper Info Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Summary card -->
          <div class="card p-4 space-y-2.5">
            <span class="text-[9px] text-muted uppercase font-bold block">Purchase Details</span>
            <div class="space-y-2 font-mono">
              <div class="flex justify-between"><span class="text-secondary font-sans">Vendor</span><span class="text-white font-bold font-sans">${po.vendorName}</span></div>
              <div class="flex justify-between"><span class="text-secondary font-sans">PO Number</span><span class="text-amber-500 font-bold">${po.poNumber}</span></div>
              <div class="flex justify-between"><span class="text-secondary font-sans">Order Date</span><span class="text-white">${window.Utils.formatDate(po.createdAt)}</span></div>
            </div>
            <!-- PO Print & share -->
            <div class="pt-2 flex gap-1 font-sans">
              <button onclick="window.POPage.printPO('${po.id}')"
                class="flex-1 py-1.5 bg-hover hover:bg-border-color border border-border-color/30 rounded text-white font-bold text-[9px] flex items-center justify-center gap-1">
                <i data-lucide="printer" class="w-3 h-3"></i> PO PDF
              </button>
              <button onclick="window.POPage.shareWhatsApp('${po.id}')"
                class="flex-1 py-1.5 bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 font-bold rounded text-[9px] flex items-center justify-center gap-1 hover:bg-emerald-600/25">
                <i data-lucide="phone" class="w-3 h-3"></i> WhatsApp PO
              </button>
            </div>
          </div>

          <!-- Status tracker -->
          <div class="card p-4 space-y-3">
            <span class="text-[9px] text-muted uppercase font-bold block">PO Dispatch Pipeline</span>
            <div class="flex flex-col gap-1">
              ${role === 'admin' ? statuses.map(s => {
                const isActive = po.status === s;
                const c = window.POPage.statusConfig(s);
                return `
                  <button onclick="window.ProcurementPage.updatePOStatus('${po.id}', '${s}')"
                    class="w-full px-2.5 py-1 rounded text-left font-bold border transition-all text-[10px] flex items-center justify-between ${isActive ? c.color : 'bg-hover text-secondary border-border-color/30 hover:text-white'}">
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full ${c.dot}"></span>${s}</span>
                    ${isActive ? '✓' : ''}
                  </button>
                `;
              }).join('') : `<p class="text-muted">Logged in as viewer. Status edits locked.</p>`}
            </div>
          </div>

          <!-- Finance tracker progress card -->
          <div class="card p-4 space-y-3 font-mono">
            <span class="text-[9px] text-muted uppercase font-bold block font-sans">Payment Ledger Progress</span>
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px]"><span class="text-secondary font-sans">PO Grand Total</span><span class="text-white font-bold">${window.Utils.formatCurrency(po.grandTotal)}</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-secondary font-sans">Invoiced Total</span><span class="text-purple-400 font-bold">${window.Utils.formatCurrency(invoiceSum)}</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-secondary font-sans">Cleared Payments</span><span class="text-emerald-400 font-bold">${window.Utils.formatCurrency(paymentSum)}</span></div>
              <div class="flex justify-between border-t border-border-color/40 pt-1.5 text-xs">
                <span class="font-bold text-white font-sans">Balance Payable</span>
                <span class="font-bold text-amber-500">${window.Utils.formatCurrency(balance)}</span>
              </div>
            </div>
            <!-- Progress indicator -->
            <div class="w-full bg-primary rounded-full h-1.5 overflow-hidden">
              <div class="bg-emerald-500 h-1.5" style="width: ${po.grandTotal > 0 ? (paymentSum / po.grandTotal * 100) : 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Invoices & Payment Ledger Log Forms -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Invoices Section -->
          <div class="card p-4 space-y-3">
            <div class="flex justify-between items-center border-b border-border-color/30 pb-2">
              <span class="text-[10px] text-purple-400 uppercase font-bold block tracking-wider">1. Vendor Invoices Log</span>
              ${role === 'admin' ? `
                <button onclick="window.ProcurementPage.promptAddInvoice('${po.id}')"
                  class="px-2 py-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded border border-purple-500/20">
                  + Add Invoice
                </button>
              ` : ''}
            </div>

            <!-- Invoices table list -->
            ${invoices.length === 0 ? `
              <div class="p-4 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
                No invoices logged against this PO yet.
              </div>
            ` : `
              <div class="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                ${invoices.map((inv, idx) => `
                  <div class="bg-primary/20 border border-border-color/30 p-2.5 rounded flex items-center justify-between font-mono">
                    <div>
                      <span class="text-white font-bold block text-xs font-sans">${inv.invoiceNo}</span>
                      <span class="text-[9px] text-secondary">Logged: ${window.Utils.formatDate(inv.date)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-purple-400 font-bold">${window.Utils.formatCurrency(inv.amount)}</span>
                      ${role === 'admin' ? `
                        <button onclick="window.ProcurementPage.deleteInvoice('${po.id}', ${idx})" class="p-0.5 text-rose-500 hover:text-rose-400"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Payments Section -->
          <div class="card p-4 space-y-3">
            <div class="flex justify-between items-center border-b border-border-color/30 pb-2">
              <span class="text-[10px] text-emerald-400 uppercase font-bold block tracking-wider">2. Payment Disbursements Log</span>
              ${role === 'admin' ? `
                <button onclick="window.ProcurementPage.promptAddPayment('${po.id}')"
                  class="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded border border-emerald-500/20">
                  + Log Payment
                </button>
              ` : ''}
            </div>

            <!-- Payments table list -->
            ${payments.length === 0 ? `
              <div class="p-4 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
                No payment transactions recorded for this order.
              </div>
            ` : `
              <div class="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                ${payments.map((pay, idx) => `
                  <div class="bg-primary/20 border border-border-color/30 p-2.5 rounded flex items-center justify-between font-mono">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-white font-bold text-xs font-sans">${pay.method} Transfer</span>
                        <span class="text-[8px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1 rounded">Cleared</span>
                      </div>
                      <span class="text-[9px] text-secondary font-sans block mt-0.5">Ref: ${pay.ref} • ${window.Utils.formatDate(pay.date)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-400 font-bold">${window.Utils.formatCurrency(pay.amount)}</span>
                      ${role === 'admin' ? `
                        <button onclick="window.ProcurementPage.deletePayment('${po.id}', ${idx})" class="p-0.5 text-rose-500 hover:text-rose-400"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

      </div>
    `;
  },

  updatePOStatus(poId, status) {
    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    po.status = status;
    if (!po.history) po.history = [];
    po.history.push({ date: new Date().toISOString().split('T')[0], text: `PO Status updated to ${status}` });

    store.saveState();
    window.ModalComponent.showToast(`Order status set to "${status}"`);
    window.AppRouter.refresh();
  },

  // ── Prompt for logging vendor invoices ────────────
  promptAddInvoice(poId) {
    const num = prompt('Enter Vendor Invoice Reference Number:', 'INV-2026-');
    if (!num) return;
    const amtStr = prompt('Enter Invoice Amount (₹):');
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) { window.ModalComponent.showToast('Invalid invoice amount.'); return; }

    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    if (!po.invoices) po.invoices = [];
    po.invoices.push({
      invoiceNo: num,
      amount: amt,
      date: new Date().toISOString().split('T')[0]
    });

    if (!po.history) po.history = [];
    po.history.push({ date: new Date().toISOString().split('T')[0], text: `Logged vendor invoice ${num} (Value: ${window.Utils.formatCurrency(amt)})` });

    store.saveState();
    window.ModalComponent.showToast(`Invoice ${num} logged.`);
    window.AppRouter.refresh();
  },

  deleteInvoice(poId, idx) {
    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    if (confirm('Delete this invoice record?')) {
      po.invoices.splice(idx, 1);
      store.saveState();
      window.ModalComponent.showToast('Invoice deleted.');
      window.AppRouter.refresh();
    }
  },

  // ── Prompt for logging payment receipts ────────────
  promptAddPayment(poId) {
    const amtStr = prompt('Enter Disbursement Amount Paid (₹):');
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) { window.ModalComponent.showToast('Invalid payment amount.'); return; }

    const method = prompt('Select Transfer Method (NEFT / UPI / Cheque / Cash):', 'NEFT');
    if (!method) return;

    const ref = prompt('Enter Transaction Reference / UTR Number:', 'TXN' + Math.floor(Math.random() * 10000000));
    if (!ref) return;

    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    if (!po.payments) po.payments = [];
    po.payments.push({
      amount: amt,
      method: method.toUpperCase(),
      ref: ref,
      date: new Date().toISOString().split('T')[0],
      status: 'Cleared'
    });

    if (!po.history) po.history = [];
    po.history.push({ date: new Date().toISOString().split('T')[0], text: `Logged payment of ${window.Utils.formatCurrency(amt)} via ${method} (UTR: ${ref})` });

    // Auto update status if paid off
    const paymentSum = po.payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paymentSum >= po.grandTotal) {
      po.status = 'Closed';
      po.history.push({ date: new Date().toISOString().split('T')[0], text: `PO cleared and status set to Closed automatically` });
    }

    store.saveState();
    window.ModalComponent.showToast(`Payment of ${window.Utils.formatCurrency(amt)} logged.`);
    window.AppRouter.refresh();
  },

  deletePayment(poId, idx) {
    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    if (confirm('Delete this payment transaction record?')) {
      po.payments.splice(idx, 1);
      store.saveState();
      window.ModalComponent.showToast('Payment transaction deleted.');
      window.AppRouter.refresh();
    }
  },

  // ===================================================
  // TAB 4: SOURCING RATE INDEX
  // ===================================================
  renderRatesTab() {
    const store = window.AppStore;
    const pos = store.state.purchaseOrders || [];

    // Extract all items for Sourcing History index
    let rates = [];
    pos.forEach(po => {
      (po.items || []).forEach(item => {
        rates.push({
          material: item.description,
          vendor: po.vendorName,
          rate: item.rate,
          unit: item.unit,
          date: po.createdAt,
          projectName: po.projectName,
          poNumber: po.poNumber
        });
      });
    });

    // Filtering rates
    if (this.activeSearch) {
      rates = rates.filter(r => 
        r.material.toLowerCase().includes(this.activeSearch) ||
        r.vendor.toLowerCase().includes(this.activeSearch) ||
        r.projectName.toLowerCase().includes(this.activeSearch)
      );
    }

    // Sort newest first
    rates.sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="space-y-4">
        <!-- Search bar -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-muted absolute left-3 top-2.5"></i>
          <input
            type="text"
            id="po-search"
            placeholder="Search material rate history (e.g. White Attica, Teak Veneer, Blum hinges)..."
            value="${this.activeSearch}"
            oninput="window.ProcurementPage.activeSearch = this.value.toLowerCase(); window.ProcurementPage.renderProcurementDashboard(document.getElementById('main-content-container'), window.AppStore.state.projects.find(p => p.id === window.ProcurementPage.activeProjectId))"
            class="w-full text-xs pl-9 pr-3 py-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500"
          >
        </div>

        <!-- Sourcing directory grid -->
        ${rates.length === 0 ? `
          <div class="card p-12 text-center text-xs">
            <i data-lucide="history" class="w-10 h-10 text-muted mx-auto mb-3"></i>
            <p class="text-sm font-semibold text-white mb-1 font-display">No Sourcing Rates Recorded</p>
            <p class="text-secondary">Execute a Purchase Order to start indexing material rate histories automatically.</p>
          </div>
        ` : `
          <!-- Desktop list -->
          <div class="hidden md:block card overflow-hidden">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border-color bg-primary/60 text-[10px] text-secondary uppercase font-semibold font-mono">
                  <th class="px-4 py-3">Material Specification</th>
                  <th class="px-4 py-3">Vendor</th>
                  <th class="px-4 py-3 text-right">Historical Rate</th>
                  <th class="px-4 py-3">Project Sourced</th>
                  <th class="px-4 py-3">Sourced Date</th>
                  <th class="px-4 py-3 text-right font-mono">PO Ref</th>
                </tr>
              </thead>
              <tbody>
                ${rates.map(r => `
                  <tr class="border-b border-border-color hover:bg-hover/30 transition-colors">
                    <td class="px-4 py-3 font-bold text-white">${r.material}</td>
                    <td class="px-4 py-3 text-white">${r.vendor}</td>
                    <td class="px-4 py-3 text-right font-mono font-bold text-amber-500">${window.Utils.formatCurrency(r.rate)} <span class="text-[9px] text-muted font-normal">/ ${r.unit}</span></td>
                    <td class="px-4 py-3 text-secondary truncate max-w-[150px]" title="${r.projectName}">${r.projectName}</td>
                    <td class="px-4 py-3 text-secondary font-mono">${window.Utils.formatDate(r.date)}</td>
                    <td class="px-4 py-3 text-right font-mono text-amber-500 font-bold">${r.poNumber}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="block md:hidden space-y-3">
            ${rates.map(r => `
              <div class="card p-3 space-y-1.5 text-xs">
                <div class="flex justify-between items-start">
                  <b class="text-white font-bold block">${r.material}</b>
                  <span class="font-mono text-amber-500 font-bold">${window.Utils.formatCurrency(r.rate)} / ${r.unit}</span>
                </div>
                <div class="text-[10px] text-secondary space-y-0.5">
                  <div>Vendor: <b class="text-white font-medium">${r.vendor}</b></div>
                  <div>Project: <b class="text-white font-medium">${r.projectName}</b></div>
                  <div class="flex justify-between font-mono text-[9px] text-muted mt-1 border-t border-border-color/20 pt-1">
                    <span>Date: ${window.Utils.formatDate(r.date)}</span>
                    <span>PO Ref: ${r.poNumber}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

      </div>
    `;
  },

  // ===================================================
  // WHATSAPP TEMPLATE INTEGRATION ENGINE
  // ===================================================
  triggerRFQWhatsAppShare(rfqId) {
    const rfq = (window.AppStore.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    // Show prompter choosing vendor to share to
    const vendorsStr = rfq.vendors.join(', ');
    const choice = prompt(`Sourced RFQ is linked to: ${vendorsStr}.\nType the EXACT vendor name to generate and send WhatsApp message:`, rfq.vendors[0]);
    if (!choice) return;

    if (!rfq.vendors.includes(choice)) {
      window.ModalComponent.showToast('Please pick a vendor name listed on this RFQ.');
      return;
    }

    this.shareWhatsAppToVendor(rfq.id, choice);
  },

  shareWhatsAppToVendor(rfqId, vendorName) {
    const store = window.AppStore;
    const rfq = (store.state.rfqs || []).find(r => r.id === rfqId);
    if (!rfq) return;

    const companyPhone = localStorage.getItem("company_phone") || "+91 98480 00000";

    const templateText = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Request For Quotation*\n\n• *RFQ Reference:* ${rfq.rfqNumber}\n• *Date:* ${window.Utils.formatDate(rfq.createdAt)}\n• *Company Contact:* ${companyPhone}\n• *Vendor:* ${vendorName}\n\n■ *Sourcing Specifications*\n• *Material Category:* ${rfq.category}\n• *Description/Specs:* ${rfq.itemDescription}\n• *Quantity Required:* ${rfq.qty} ${rfq.unit}${rfq.notes ? `\n\n■ *Notes/Instructions*\n• ${rfq.notes}` : ''}\n\nPlease verify specifications and send us your quotation with unit rate, GST percentage, and transport/extra charges.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Procurement Command OS_`;

    const vendorObj = (store.state.vendors || []).find(v => v.name === vendorName);
    const phone = (vendorObj?.phone || '').replace(/[^+\d]/g, '');

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(templateText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(templateText)}`;

    window.open(url, '_blank');
    window.ModalComponent.showToast(`Opening WhatsApp template for ${vendorName}...`);
  },

  renderPipelineTab(project, role) {
    const store = window.AppStore;
    const rfqs = (store.state.rfqs || []).filter(r => r.projectId === project.id);
    const pos = (store.state.purchaseOrders || []).filter(po => po.projectId === project.id);
    const deliveries = project.deliveries || [];

    const colRfqRaised = [];
    const colQuoteRecd = [];
    const colPoReleased = [];
    const colProduction = [];
    const colDispatch = [];
    const colDelivered = [];
    const colInstalled = [];

    rfqs.forEach(r => {
      const quotesCount = Object.keys(r.quotations || {}).length;
      if (quotesCount === 0) {
        colRfqRaised.push({ type: 'rfq', data: r });
      } else {
        colQuoteRecd.push({ type: 'rfq', data: r });
      }
    });

    pos.forEach(po => {
      if (po.status === 'Draft' || po.status === 'Sent' || po.status === 'Approved') {
        colPoReleased.push({ type: 'po', data: po });
      } else if (po.status === 'Production' || po.status === 'Production Started') {
        colProduction.push({ type: 'po', data: po });
      } else if (po.status === 'Dispatched' || po.status === 'Transit') {
        colDispatch.push({ type: 'po', data: po });
      } else if (po.status === 'Delivered') {
        colDelivered.push({ type: 'po', data: po });
      }
    });

    deliveries.forEach(del => {
      if (del.status === 'Delivered') {
        if (!colDelivered.some(x => x.type === 'delivery' && x.data.id === del.id)) {
          colDelivered.push({ type: 'delivery', data: del });
        }
      } else if (del.status === 'Installed') {
        colInstalled.push({ type: 'delivery', data: del });
      } else if (del.status === 'Dispatched') {
        if (!colDispatch.some(x => x.type === 'delivery' && x.data.id === del.id)) {
          colDispatch.push({ type: 'delivery', data: del });
        }
      }
    });

    const renderCardHTML = (card) => {
      if (card.type === 'rfq') {
        const r = card.data;
        const quotesCount = Object.keys(r.quotations || {}).length;
        return `
          <div class="bg-primary/30 border border-border-color/60 p-3 rounded-lg space-y-2 text-xs hover:border-amber-500/30 transition-all font-sans">
            <div class="flex justify-between items-start">
              <span class="px-1.5 py-0.5 rounded text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase font-mono">${r.rfqNumber}</span>
              <span class="text-[9px] text-muted font-mono">${window.Utils.formatDate(r.createdAt)}</span>
            </div>
            <div>
              <b class="text-white block truncate leading-tight">${r.itemDescription}</b>
              <span class="text-secondary block mt-0.5 text-[10px]">Category: ${r.category}</span>
            </div>
            <div class="grid grid-cols-2 text-[10px] text-muted border-t border-border-color/10 pt-1.5">
              <div>Qty: <b class="text-white font-mono">${r.qty} ${r.unit}</b></div>
              <div class="text-right">Quotes: <b class="text-white font-mono">${quotesCount}</b></div>
            </div>
            <div class="flex gap-1.5 pt-1.5 border-t border-border-color/10">
              <button onclick="window.ProcurementPage.activeRFQId = '${r.id}'; window.ProcurementPage.activeTab = 'rfqs'; window.ProcurementPage.viewMode = 'rfq-detail'; window.AppRouter.refresh();" 
                class="w-full py-1 bg-hover hover:bg-border-color text-[9px] font-bold text-white rounded border border-border-color/30 flex items-center justify-center gap-1">
                <i data-lucide="upload" class="w-2.5 h-2.5"></i> Add Quote
              </button>
              ${quotesCount > 0 ? `
                <button onclick="window.ProcurementPage.activeTab = 'comparisons'; window.AppRouter.refresh();" 
                  class="w-full py-1 bg-amber-500 hover:bg-amber-600 text-[9px] font-bold text-black rounded flex items-center justify-center gap-1">
                  Compare <i data-lucide="arrow-right" class="w-2.5 h-2.5"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      } 
      else if (card.type === 'po') {
        const po = card.data;
        const totalText = window.Utils.formatCurrency(po.totalAmount || (po.items || []).reduce((sum, item) => sum + (item.qty * item.rate), 0));
        return `
          <div class="bg-primary/30 border border-border-color/60 p-3 rounded-lg space-y-2 text-xs hover:border-amber-500/30 transition-all font-sans">
            <div class="flex justify-between items-start">
              <span class="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase font-mono">${po.poNumber}</span>
              <span class="text-[9px] text-muted font-mono">${window.Utils.formatDate(po.date)}</span>
            </div>
            <div>
              <b class="text-white block truncate leading-tight">${po.notes || 'Materials Sourcing'}</b>
              <span class="text-secondary block mt-0.5 text-[10px]">Vendor: ${po.vendorName}</span>
            </div>
            <div class="grid grid-cols-2 text-[10px] text-muted border-t border-border-color/10 pt-1.5">
              <div>Amount: <b class="text-amber-500 font-mono font-bold">${totalText}</b></div>
              <div></div>
            </div>
            <div class="pt-1.5 border-t border-border-color/10 flex gap-1">
              ${po.status === 'Draft' || po.status === 'Sent' || po.status === 'Approved' ? `
                <button onclick="window.ProcurementPage.updateKanbanPOStatus('${po.id}', 'Production')" 
                  class="w-full py-1 bg-purple-600 hover:bg-purple-700 text-[9px] font-bold text-white rounded flex items-center justify-center gap-1">
                  Start Production
                </button>
              ` : ''}
              ${po.status === 'Production' || po.status === 'Production Started' ? `
                <button onclick="window.ProcurementPage.updateKanbanPOStatus('${po.id}', 'Dispatched')" 
                  class="w-full py-1 bg-amber-500 hover:bg-amber-600 text-[9px] font-bold text-black rounded flex items-center justify-center gap-1">
                  Mark Dispatched
                </button>
              ` : ''}
              ${po.status === 'Dispatched' || po.status === 'Transit' ? `
                <button onclick="window.ProcurementPage.updateKanbanPOStatus('${po.id}', 'Delivered')" 
                  class="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-bold text-white rounded flex items-center justify-center gap-1">
                  Mark Arrived
                </button>
              ` : ''}
            </div>
          </div>
        `;
      } 
      else if (card.type === 'delivery') {
        const del = card.data;
        return `
          <div class="bg-primary/30 border border-border-color/60 p-3 rounded-lg space-y-2 text-xs hover:border-amber-500/30 transition-all font-sans">
            <div class="flex justify-between items-start">
              <span class="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase font-mono">DELIVERY</span>
              <span class="text-[9px] text-muted font-mono">${window.Utils.formatDate(del.date)}</span>
            </div>
            <div>
              <b class="text-white block truncate leading-tight">${del.item}</b>
              <span class="text-secondary block mt-0.5 text-[10px]">Responsible: ${del.responsibleParty || 'Site Lead'}</span>
            </div>
            <div class="grid grid-cols-2 text-[10px] text-muted border-t border-border-color/10 pt-1.5">
              <div>Qty: <b class="text-white font-mono">${del.qty}</b></div>
              <div class="text-right">Status: <b class="text-amber-500 font-mono">${del.status}</b></div>
            </div>
            <div class="pt-1.5 border-t border-border-color/10">
              ${del.status === 'Delivered' ? `
                <button onclick="window.DeliveryPage.updateStatus('${project.id}', '${del.id}', 'Installed')" 
                  class="w-full py-1 bg-purple-600 hover:bg-purple-700 text-[9px] font-bold text-white rounded flex items-center justify-center gap-1">
                  Mark Installed
                </button>
              ` : ''}
              ${del.status === 'Dispatched' ? `
                <button onclick="window.DeliveryPage.updateStatus('${project.id}', '${del.id}', 'Delivered')" 
                  class="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-bold text-white rounded flex items-center justify-center gap-1">
                  Mark Received
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }
      return '';
    };

    const columns = [
      { id: 'rfq-raised', title: '1. RFQ Raised', color: 'border-blue-500/40 bg-blue-500/5', cards: colRfqRaised },
      { id: 'quote-recd', title: '2. Quote Received', color: 'border-amber-500/40 bg-amber-500/5', cards: colQuoteRecd },
      { id: 'po-released', title: '3. PO Released', color: 'border-cyan-500/40 bg-cyan-500/5', cards: colPoReleased },
      { id: 'production', title: '4. Production Active', color: 'border-purple-500/40 bg-purple-500/5', cards: colProduction },
      { id: 'dispatch', title: '5. Dispatch Pending', color: 'border-orange-500/40 bg-orange-500/5', cards: colDispatch },
      { id: 'delivered', title: '6. Delivered (Site)', color: 'border-emerald-500/40 bg-emerald-500/5', cards: colDelivered },
      { id: 'installed', title: '7. Installed', color: 'border-indigo-500/40 bg-indigo-500/5', cards: colInstalled },
    ];

    return `
      <div class="space-y-4">
        <div class="card p-4 bg-primary/10 border border-border-color flex justify-between items-center animate-fade-in">
          <div>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Visual Sourcing Command Center</h3>
            <p class="text-[10px] text-secondary mt-0.5">Continuous visual tracking across all procurement stages — raise RFQs to complete site installation.</p>
          </div>
          <span class="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">Kanban Mode</span>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[480px] no-scrollbar">
          ${columns.map(col => `
            <div class="flex-shrink-0 w-[240px] flex flex-col h-[460px] rounded-lg border ${col.color} p-3 space-y-3">
              <div class="flex justify-between items-center border-b border-border-color/20 pb-2">
                <span class="text-[10px] font-extrabold text-white uppercase tracking-wide font-sans">${col.title}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/60 border border-border-color/30 text-secondary">${col.cards.length}</span>
              </div>
              <div class="flex-1 space-y-2.5 overflow-y-auto no-scrollbar pb-6">
                ${col.cards.map(card => renderCardHTML(card)).join('')}
                ${col.cards.length === 0 ? `
                  <div class="h-24 border border-dashed border-border-color/20 rounded-lg flex items-center justify-center text-[10px] text-muted italic">No items in stage</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async updateKanbanPOStatus(poId, newStatus) {
    const store = window.AppStore;
    const po = (store.state.purchaseOrders || []).find(p => p.id === poId);
    if (!po) return;

    po.status = newStatus;
    
    const proj = store.state.projects.find(p => p.id === po.projectId);
    if (proj && proj.deliveries) {
      const matchWord = po.notes ? po.notes.split(' ')[0].toLowerCase() : '';
      const del = proj.deliveries.find(d => d.item.toLowerCase().includes(matchWord) || d.date === po.deliveryDate);
      if (del) {
        if (newStatus === 'Production') del.status = 'Pending';
        else if (newStatus === 'Dispatched') {
          del.status = 'Dispatched';
          del.dispatchDate = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'Delivered') {
          del.status = 'Delivered';
          del.arrivalDate = new Date().toISOString().split('T')[0];
        }
      }
    }

    await window.dbService.savePO(po);
    if (proj) await window.dbService.saveProject(proj);
    
    window.ModalComponent.showToast(`Purchase order updated to ${newStatus}!`);
    window.AppRouter.refresh();
  }
};
