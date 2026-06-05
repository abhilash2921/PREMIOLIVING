/* js/components/quick-actions.js - Premio Living OS Quick Action Center Controller */

window.QuickActionCenter = {
  recentActions: [],
  activeSearchQuery: '',

  init() {
    this.loadRecentActions();
  },

  loadRecentActions() {
    this.recentActions = JSON.parse(localStorage.getItem("premio_recent_actions") || "[]");
  },

  saveRecentAction(actionId) {
    const actionsMap = this.getActionsList();
    const action = actionsMap.find(a => a.id === actionId);
    if (!action) return;

    this.recentActions = this.recentActions.filter(id => id !== actionId);
    this.recentActions.unshift(actionId);
    if (this.recentActions.length > 3) this.recentActions.pop();
    localStorage.setItem("premio_recent_actions", JSON.stringify(this.recentActions));
  },

  getActionsList() {
    return [
      { id: 'create-rfq', label: 'Create RFQ', icon: 'file-text', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', desc: 'Initialize and dispatch sourcing specifications' },
      { id: 'upload-quote', label: 'Upload Vendor Quote', icon: 'scan', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Scan quote parameters with AI document parser' },
      { id: 'create-po', label: 'Create Purchase Order', icon: 'clipboard-signature', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Issue material orders and print confirmation PDFs' },
      { id: 'raise-payout', label: 'Raise Payment Request', icon: 'wallet', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Request contractor milestone payout approvals' },
      { id: 'upload-invoice', label: 'Upload Invoice', icon: 'credit-card', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', desc: 'Log billing files to the project vault invoices' },
      { id: 'add-update', label: 'Add Site Update', icon: 'camera', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', desc: 'Submit daily workers count and progress photos' },
      { id: 'add-snag', label: 'Add Snag', icon: 'alert-circle', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', desc: 'Flag defects and assign resolution deadlines' },
      { id: 'add-material', label: 'Add Material Request', icon: 'trello', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', desc: 'Add client selection request to materials checklist' },
      { id: 'schedule-visit', label: 'Schedule Site Visit', icon: 'calendar', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', desc: 'Schedule visitors, design, or client meetings' },
      { id: 'add-delivery', label: 'Add Delivery', icon: 'truck', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Log expected materials delivery status details' },
      { id: 'create-vendor', label: 'Create Vendor', icon: 'users', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', desc: 'Register global partner vendor in contacts' },
      { id: 'upload-document', label: 'Upload Document', icon: 'file', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', desc: 'Upload drawings or agreements to project vault' }
    ];
  },

  open() {
    this.loadRecentActions();
    this.activeSearchQuery = '';
    const store = window.AppStore;
    const projects = store.state.projects || [];
    const activeProjId = store.activeProjectId || '';
    
    // Check if the overlay exists, else create it
    let overlay = document.getElementById("quick-action-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "quick-action-modal";
      overlay.className = "fixed inset-0 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4 z-50 animate-fade-in no-print";
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          window.QuickActionCenter.close();
        }
      });
      document.body.appendChild(overlay);
    }

    this.renderModalContent(overlay, projects, activeProjId);

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    
    this.setupDragAndDrop();
    if (window.lucide) lucide.createIcons();
    
    // Auto-focus search input
    document.getElementById("qa-search-input")?.focus();
  },

  close() {
    const overlay = document.getElementById("quick-action-modal");
    if (overlay) {
      overlay.classList.remove("flex");
      overlay.classList.add("hidden");
    }
  },

  renderModalContent(overlay, projects, activeProjId) {
    const actions = this.getActionsList();
    const activeProjectObj = projects.find(p => p.id === activeProjId);

    // Filter actions based on search
    const filteredActions = actions.filter(a => 
      a.label.toLowerCase().includes(this.activeSearchQuery.toLowerCase()) ||
      a.desc.toLowerCase().includes(this.activeSearchQuery.toLowerCase())
    );

    // Resolve recently used action items details
    const recentActionItems = this.recentActions
      .map(id => actions.find(a => a.id === id))
      .filter(Boolean);

    overlay.innerHTML = `
      <div class="bg-secondary border border-border-color w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-scale-in max-h-[92vh]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border-color/60 bg-primary/20 flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold font-display text-white flex items-center gap-1.5">
              <i data-lucide="zap" class="w-4 h-4 text-amber-500 fill-current"></i> Quick Action Center
            </h3>
            <p class="text-[10px] text-secondary mt-0.5">Speed up daily operations. Instantiate workflows or drop files from anywhere.</p>
          </div>
          <button onclick="window.QuickActionCenter.close()" class="p-2 bg-hover border border-border-color rounded text-secondary hover:text-white transition-all">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-5 space-y-4 overflow-y-auto no-scrollbar">
          
          <!-- Smart Project Selection & Search Box -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Project Context -->
            <div class="space-y-1">
              <label class="text-[9px] text-muted uppercase font-bold tracking-wider font-mono block">Project Context Selector</label>
              <select id="qa-project-select" onchange="window.QuickActionCenter.updateProjectContext(this.value)" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
                ${projects.map(p => `
                  <option value="${p.id}" ${activeProjId === p.id ? 'selected' : ''}>
                    ${p.name.split(" (")[0]} ${activeProjId === p.id ? '• (Active Site Context)' : ''}
                  </option>
                `).join("")}
              </select>
            </div>

            <!-- Search Actions -->
            <div class="space-y-1">
              <label class="text-[9px] text-muted uppercase font-bold tracking-wider font-mono block">Filter Quick Actions</label>
              <div class="relative">
                <i data-lucide="search" class="w-3.5 h-3.5 text-muted absolute left-3 top-3"></i>
                <input type="text" id="qa-search-input" value="${this.activeSearchQuery}" oninput="window.QuickActionCenter.handleSearch(this.value)" placeholder="Type to filter action..." class="w-full text-xs pl-9 pr-3 py-2.5 rounded border border-border-color bg-primary text-white focus:outline-none">
              </div>
            </div>

          </div>

          <!-- Recent Actions Section -->
          ${recentActionItems.length > 0 ? `
            <div class="space-y-2">
              <span class="text-[9px] text-muted uppercase font-bold tracking-wider font-mono block">Recently Used Actions</span>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                ${recentActionItems.map(act => `
                  <button onclick="window.QuickActionCenter.triggerAction('${act.id}')" class="flex items-center gap-3 p-2.5 bg-primary/30 border border-border-color/60 hover:border-amber-500/30 rounded-xl text-left hover:bg-hover text-xs font-semibold text-white transition-all">
                    <span class="p-1.5 rounded-lg ${act.color}"><i data-lucide="${act.icon}" class="w-4 h-4"></i></span>
                    <span class="truncate">${act.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Actions Grid -->
          <div class="space-y-2">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider font-mono block">All Sourcing & Site Execution Workflows</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="qa-actions-grid">
              ${filteredActions.map(act => `
                <button onclick="window.QuickActionCenter.triggerAction('${act.id}')" class="flex items-start gap-3 p-3 bg-primary/45 hover:bg-hover rounded-xl border border-border-color/50 hover:border-gold-color/30 text-left transition-all">
                  <span class="p-2 rounded-xl mt-0.5 ${act.color}"><i data-lucide="${act.icon}" class="w-4.5 h-4.5"></i></span>
                  <div class="space-y-0.5 min-w-0">
                    <span class="text-xs font-bold text-white block">${act.label}</span>
                    <span class="text-[10px] text-secondary leading-normal block truncate">${act.desc}</span>
                  </div>
                </button>
              `).join("")}
              ${filteredActions.length === 0 ? `<div class="col-span-2 text-center py-6 text-xs text-muted italic">No matching actions.</div>` : ''}
            </div>
          </div>

          <!-- Smart File Upload Area -->
          <div class="space-y-2">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider font-mono block">Smart File Drop & Routing</span>
            <div id="qa-dropzone" class="border-2 border-dashed border-border-color hover:border-amber-500/40 bg-primary/20 hover:bg-amber-500/[0.02] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2">
              <input type="file" id="qa-file-input" class="hidden" onchange="window.QuickActionCenter.handleFileSelect(this.files)">
              <i data-lucide="upload-cloud" class="w-8 h-8 text-secondary"></i>
              <div class="text-xs">
                <span class="text-white font-bold block">Drop Sourced Files Here or Click to Browse</span>
                <span class="text-[10px] text-secondary block mt-1">Quotes, invoices, receipts, challans, or progress photos (Max 15MB)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  updateProjectContext(projId) {
    // Optionally trigger any global router state adjustments if necessary, but keep modal context
    window.AppStore.activeProjectId = projId;
  },

  handleSearch(val) {
    this.activeSearchQuery = val;
    const overlay = document.getElementById("quick-action-modal");
    if (!overlay) return;
    const store = window.AppStore;
    const projects = store.state.projects || [];
    const activeProjId = store.activeProjectId || '';
    
    // Repopulate grid content
    this.renderModalContent(overlay, projects, activeProjId);
    this.setupDragAndDrop();
    if (window.lucide) lucide.createIcons();
    // Re-focus search and restore cursor at end
    const input = document.getElementById("qa-search-input");
    if (input) {
      input.focus();
      input.setSelectionRange(val.length, val.length);
    }
  },

  triggerAction(actionId) {
    this.close();
    
    // Save to recent actions list
    this.saveRecentAction(actionId);

    const store = window.AppStore;
    const selectedProjectId = document.getElementById("qa-project-select")?.value || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
    const selectedProject = store.state.projects.find(p => p.id === selectedProjectId);
    const selectedProjectName = selectedProject ? selectedProject.name : "";

    // Perform specific page triggers
    if (actionId === 'create-rfq') {
      window.AppRouter.navigate('rfqs');
      setTimeout(() => {
        if (window.RFQPage) {
          window.RFQPage.openCreateViewFromProcurement(selectedProjectId, selectedProjectName);
        }
      }, 100);
    } else if (actionId === 'upload-quote') {
      window.AppRouter.navigate('procurement');
      setTimeout(() => {
        if (window.ProcurementPage) {
          window.ProcurementPage.setTab('rfqs');
        }
      }, 100);
    } else if (actionId === 'create-po') {
      if (window.POPage) {
        window.POPage.openCreateModal({ projectId: selectedProjectId });
      }
    } else if (actionId === 'raise-payout') {
      if (window.PayoutsPage) {
        window.PayoutsPage.openCreateModal(selectedProjectId);
      }
    } else if (actionId === 'upload-invoice') {
      window.ModalComponent.openModal('add-document-modal', { folder: 'invoices', projectId: selectedProjectId });
    } else if (actionId === 'add-update') {
      window.ModalComponent.openModal('add-update-modal', { projectId: selectedProjectId });
    } else if (actionId === 'add-snag') {
      window.ModalComponent.openModal('add-snag-modal', { projectId: selectedProjectId });
    } else if (actionId === 'add-material') {
      window.ModalComponent.openModal('add-material-modal', { projectId: selectedProjectId });
    } else if (actionId === 'schedule-visit') {
      window.ModalComponent.openModal('add-visit-modal', { projectId: selectedProjectId });
    } else if (actionId === 'add-delivery') {
      window.ModalComponent.openModal('add-delivery-modal', { projectId: selectedProjectId });
    } else if (actionId === 'create-vendor') {
      window.ModalComponent.openModal('add-vendor-modal');
    } else if (actionId === 'upload-document') {
      window.ModalComponent.openModal('add-document-modal', { folder: 'drawings', projectId: selectedProjectId });
    }
  },

  setupDragAndDrop() {
    const dropzone = document.getElementById("qa-dropzone");
    if (!dropzone) return;

    dropzone.addEventListener("click", () => {
      document.getElementById("qa-file-input")?.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add("border-amber-500", "bg-amber-500/[0.05]");
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-amber-500", "bg-amber-500/[0.05]");
      }, false);
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFileSelect(files);
    }, false);
  },

  handleFileSelect(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const store = window.AppStore;
    const selectedProjectId = document.getElementById("qa-project-select")?.value || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
    
    this.handleFileDrop(file, selectedProjectId);
  },

  handleFileDrop(file, projectId) {
    const store = window.AppStore;
    const name = file.name.toLowerCase();
    const type = file.type;
    const project = store.state.projects.find(p => p.id === projectId) || store.state.projects[0];
    if (!project) {
      window.ModalComponent.showToast("No active project context to route file to.");
      return;
    }

    // 1. Photo Drop -> Daily Site Update
    if (type.startsWith("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target.result;
        this.close();
        window.ModalComponent.openModal('add-update-modal', { projectId: project.id, photoUrl });
        window.ModalComponent.showToast("Routed photo to Daily Site Update!");
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Sourced Quotation -> AI Quote Scanner in Procurement
    if (name.includes("quote") || name.includes("quotation") || name.includes("bid")) {
      this.saveRecentAction("upload-quote");
      this.close();
      
      window.AppRouter.navigate('procurement');
      setTimeout(() => {
        if (window.ProcurementPage) {
          window.ProcurementPage.setTab('rfqs');
          // Prefill matching RFQ if available
          const rfqs = (store.state.rfqs || []).filter(r => r.projectId === project.id);
          if (rfqs.length > 0) {
            window.ProcurementPage.activeRFQId = rfqs[0].id;
          }
          window.AppRouter.refresh();
          
          setTimeout(() => {
            window.ProcurementPage.handleActualFileUpload([file]);
            window.ModalComponent.showToast(`Scanning quotation: "${file.name}"...`);
          }, 150);
        }
      }, 150);
      return;
    }

    // 3. Invoice -> Document Vault invoices folder
    if (name.includes("invoice") || name.includes("inv") || name.includes("bill")) {
      this.uploadFileToVault(file, project.id, 'invoices');
      return;
    }

    // 4. Delivery Challan -> Open Add Delivery Form
    if (name.includes("challan") || name.includes("delivery") || name.includes("receipt") || name.includes("lr")) {
      const itemName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      this.close();
      window.ModalComponent.openModal('add-delivery-modal', { 
        projectId: project.id, 
        delivery: { item: `Challan: ${itemName}`, qty: "1", date: new Date().toISOString().split('T')[0], status: "Delivered" } 
      });
      window.ModalComponent.showToast(`Routed to Delivery details for project: ${project.name}`);
      return;
    }

    // 5. Vendor Documents / Agreements -> Document Vault agreements folder
    if (name.includes("vendor") || name.includes("agreement") || name.includes("contract") || name.includes("po")) {
      this.uploadFileToVault(file, project.id, 'agreements');
      return;
    }

    // 6. Generic Document -> Drawings folder
    this.uploadFileToVault(file, project.id, 'drawings');
  },

  async uploadFileToVault(file, projectId, folder) {
    const store = window.AppStore;
    const db = window.dbService;
    const project = store.state.projects.find(p => p.id === projectId);
    if (!project) return;

    if (file.size > 15 * 1024 * 1024) {
      alert(`File "${file.name}" is too large. Max 15MB allowed.`);
      return;
    }

    this.close();
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    // Read file base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve("#");
      reader.readAsDataURL(file);
    });

    if (base64 === "#") {
      window.ModalComponent.showToast("Failed to read file.");
      return;
    }

    const fileId = "file-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    
    // Cache in File Cache IndexedDB
    await window.FileCache.set(fileId, base64);
    
    // Sync to Supabase
    if (db.isCloudActive()) {
      try {
        await db.client.from('document_files').upsert({ id: fileId, file_data: base64, updated_at: new Date().toISOString() });
      } catch(err) {
        console.error("Failed to sync file to Supabase:", err);
      }
    }

    const fileDataUrl = "db://" + fileId;
    const docObj = {
      name: file.name,
      file: fileDataUrl,
      size: fileSizeStr,
      date: new Date().toISOString().split('T')[0]
    };

    if (!project.vault[folder]) {
      project.vault[folder] = [];
    }
    project.vault[folder].unshift(docObj);

    if (folder === "drawings") {
      project.drawings.unshift({
        name: file.name,
        file: fileDataUrl,
        type: "Custom Detail",
        uploadedAt: docObj.date
      });
    }

    await db.saveProject(project);
    window.ModalComponent.showToast(`Uploaded "${file.name}" to Project Vault ➔ ${folder} folder!`);
    window.AppRouter.refresh();
  }
};
