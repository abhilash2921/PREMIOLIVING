/* js/pages/dashboard.js - Premio Living OS Workspaces Dashboard */

window.DashboardPage = {
  // Collapsed sections tracking
  collapsed: {
    metrics: false,
    projects: false,
    insights: false
  },

  toggleSection(sectionId) {
    this.collapsed[sectionId] = !this.collapsed[sectionId];
    window.AppRouter.refresh();
  },

  render(container) {
    const store = window.AppStore;
    const projects = store.state.projects.filter(p => {
      if (store.activeRole === "vendor") {
        return p.materials.some(m => m.vendor === "Wood Crafts");
      }
      if (store.activeRole === "client") {
        return p.id === "project-1";
      }
      return true;
    });

    // 1. Calculations for metrics
    let totalBudget = 0;
    let totalPaid = 0;
    let totalSnags = 0;
    let totalPendingApprovals = 0;
    
    projects.forEach(p => {
      totalBudget += p.budget;
      p.billing.forEach(b => {
        if (b.status === "Paid") totalPaid += b.amount;
      });
      totalSnags += p.snags.filter(s => s.status === "Open").length;
      totalPendingApprovals += p.materials.filter(m => m.approved === "Pending").length;
    });

    const overallProgress = projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
      : 0;

    // Metrics Cards HTML
    const metricsHTML = this.collapsed.metrics ? "" : `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div class="card p-4 flex flex-col justify-between">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Active Portfolio</span>
          <div>
            <h3 class="text-lg font-bold text-white font-mono mt-1">${projects.length} Projects</h3>
            <span class="text-[9px] text-emerald-400 font-medium">Avg Progress: ${overallProgress}%</span>
          </div>
        </div>
        <div class="card p-4 flex flex-col justify-between">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Value Under Management</span>
          <div>
            <h3 class="text-lg font-bold text-white font-mono mt-1">${window.Utils.formatCurrency(totalBudget)}</h3>
            <span class="text-[9px] text-muted">Paid: ${window.Utils.formatCurrency(totalPaid)}</span>
          </div>
        </div>
        <div class="card p-4 flex flex-col justify-between">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Active Snag Logs</span>
          <div>
            <h3 class="text-lg font-bold text-rose-400 font-mono mt-1">${totalSnags} Open</h3>
            <span class="text-[9px] text-rose-500/80 font-medium">Requires site engineering</span>
          </div>
        </div>
        <div class="card p-4 flex flex-col justify-between">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Pending Approvals</span>
          <div>
            <h3 class="text-lg font-bold text-amber-400 font-mono mt-1">${totalPendingApprovals} Awaiting</h3>
            <span class="text-[9px] text-amber-500/80 font-medium">Blocking orders</span>
          </div>
        </div>
      </div>
    `;

    // Projects Grid HTML
    let projectsHTML = "";
    if (!this.collapsed.projects) {
      if (projects.length === 0) {
        projectsHTML = `
          <div class="text-center py-10 bg-secondary/35 rounded-lg border border-border-color/30 text-xs text-secondary">
            No active project workspaces linked to your profile role.
          </div>
        `;
      } else {
        projectsHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            ${projects.map(p => {
              const openSnagsCount = p.snags.filter(s => s.status === "Open").length;
              const pendingAppsCount = p.materials.filter(m => m.approved === "Pending").length;
              
              return `
                <div onclick="window.AppRouter.navigate('project-details', '${p.id}')" class="card p-5 hover:border-amber-500/35 transition-all cursor-pointer flex flex-col justify-between group">
                  <div>
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h3 class="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">${p.name}</h3>
                        <span class="text-[10px] text-muted block mt-0.5">${p.location}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-mono font-medium">${p.stage}</span>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="mt-5">
                      <div class="flex justify-between items-center text-[10px] text-secondary mb-1">
                        <span>Work Completed</span>
                        <span class="font-mono font-bold text-white">${p.progress}%</span>
                      </div>
                      <div class="w-full h-1.5 bg-primary rounded-full overflow-hidden">
                        <div class="h-full bg-amber-500 rounded-full" style="width: ${p.progress}%"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between border-t border-border-color/40 pt-4 mt-5">
                    <div class="flex gap-4 text-[10px] text-muted">
                      <span class="flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-500"></i> ${openSnagsCount} Snags</span>
                      <span class="flex items-center gap-1"><i data-lucide="check-square" class="w-3.5 h-3.5 text-amber-500"></i> ${pendingAppsCount} Approvals</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      ${store.activeRole === 'admin' ? `
                        <button onclick="event.stopPropagation(); window.ProjectPage.editProject('${p.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/30 rounded text-white" title="Edit Project"><i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i></button>
                        <button onclick="event.stopPropagation(); window.ProjectPage.deleteProject('${p.id}')" class="p-1.5 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete Project"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
                      ` : `<span class="text-[10px] text-muted group-hover:text-white transition-colors flex items-center gap-1">Open workspace <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></span>`}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }
    }

    // Insights Panel HTML
    const insightsHTML = this.collapsed.insights ? "" : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <!-- Site Timeline Feed Preview -->
        <div class="card p-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">Recent Execution Logs</h4>
          <div class="space-y-3">
            ${projects.slice(0, 2).map(p => {
              const latestUpdate = p.updates[0];
              if (!latestUpdate) return "";
              return `
                <div class="text-xs border-b border-border-color last:border-0 pb-3 last:pb-0">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-white">${p.name.split(" (")[0]}</span>
                    <span class="text-[9px] text-muted font-mono">${window.Utils.formatDate(latestUpdate.date)}</span>
                  </div>
                  <p class="text-secondary leading-relaxed">${latestUpdate.completed}</p>
                  ${latestUpdate.issues !== "None" ? `<p class="text-rose-400 mt-1 text-[10px]"><b>Issue:</b> ${latestUpdate.issues}</p>` : ""}
                  <div class="flex justify-end gap-1 mt-2">
                    <button onclick="event.stopPropagation(); window.ProjectPage.editUpdate('${p.id}', 0)" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500 text-[9px] font-semibold flex items-center gap-1">
                      <i data-lucide="edit-2" class="w-3 h-3"></i> Edit Log
                    </button>
                    <button onclick="event.stopPropagation(); window.ProjectPage.deleteUpdate('${p.id}', 0)" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-rose-500 text-[9px] font-semibold flex items-center gap-1">
                      <i data-lucide="trash-2" class="w-3 h-3"></i> Delete Log
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- System Alerts / Upcoming Milestones -->
        <div class="card p-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">Upcoming Deliveries & Actions</h4>
          <div class="space-y-2.5">
            ${projects.flatMap(p => p.deliveries.filter(d => d.status === "Pending").map(d => ({ p, d }))).slice(0, 3).map(item => `
              <div class="flex items-center justify-between text-xs p-2 bg-primary/30 rounded border border-border-color/30 hover:border-amber-500/25 transition-all">
                <div class="min-w-0 flex-1">
                  <span class="font-semibold text-white block truncate">${item.d.item}</span>
                  <span class="text-[9px] text-muted block mt-0.5">${item.p.name.split(" (")[0]} • Qty: ${item.d.qty} • ${window.Utils.formatDate(item.d.date)}</span>
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <button onclick="event.stopPropagation(); window.ProjectPage.editDelivery('${item.p.id}', '${item.d.id}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500" title="Edit Delivery">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="event.stopPropagation(); window.ProjectPage.deleteDelivery('${item.p.id}', '${item.d.id}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-rose-500" title="Delete Delivery">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `).join("")}
            ${projects.flatMap(p => p.billing.filter(b => b.status === "Pending").map(b => ({ p, b }))).slice(0, 2).map(item => `
              <div class="flex items-center justify-between text-xs p-2 bg-purple-950/10 rounded border border-purple-500/20 hover:border-purple-500/40 transition-all">
                <div class="min-w-0 flex-1">
                  <span class="font-semibold text-white block truncate">${item.b.type}</span>
                  <span class="text-[9px] text-muted block mt-0.5">${item.p.name.split(" (")[0]} • ${window.Utils.formatCurrency(item.b.amount)} • Unpaid</span>
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <button onclick="event.stopPropagation(); window.ProjectPage.editInvoice('${item.p.id}', '${item.b.invoiceNo}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500" title="Edit Invoice">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="event.stopPropagation(); window.ProjectPage.deleteInvoice('${item.p.id}', '${item.b.invoiceNo}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-rose-500" title="Delete Invoice">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Dashboard Top Banner -->
        <div class="flex items-center justify-between border-b border-border-color pb-5">
          <div>
            <h1 class="text-lg font-bold tracking-tight text-white font-display">Workspaces Dashboard</h1>
            <p class="text-xs text-secondary mt-1">Multi-site Project Status & Operational Metrics</p>
          </div>
          <div class="flex items-center gap-2">
            ${['admin', 'architect', 'designer'].includes(store.activeRole) ? `
              <button onclick="openModal('add-document-modal', { folder: 'drawings', fromDashboard: true })" class="px-3.5 py-2 bg-hover hover:bg-border-color text-white font-semibold text-xs rounded border border-border-color/60 transition-all flex items-center gap-1.5 shadow-md">
                <i data-lucide="upload" class="w-4 h-4 text-amber-500"></i> Upload Drawing
              </button>
            ` : ""}
            ${store.activeRole === "admin" ? `
              <button onclick="openModal('add-project-modal')" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1.5 shadow-md">
                <i data-lucide="plus" class="w-4 h-4"></i> Create Project
              </button>
            ` : ""}
          </div>
        </div>

        <!-- Section 1: Portfolio Metrics -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono">Portfolio Health</span>
            <button onclick="DashboardPage.toggleSection('metrics')" class="text-secondary hover:text-white text-xs flex items-center gap-1">
              ${this.collapsed.metrics ? `Show <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>` : `Hide <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`}
            </button>
          </div>
          ${metricsHTML}
        </div>

        <!-- Section 2: Active Workspaces -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono">Linked Project Units</span>
            <button onclick="DashboardPage.toggleSection('projects')" class="text-secondary hover:text-white text-xs flex items-center gap-1">
              ${this.collapsed.projects ? `Show <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>` : `Hide <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`}
            </button>
          </div>
          ${projectsHTML}
        </div>

        <!-- Section 3: Summary Insights -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono">Site Insights & Operations</span>
            <button onclick="DashboardPage.toggleSection('insights')" class="text-secondary hover:text-white text-xs flex items-center gap-1">
              ${this.collapsed.insights ? `Show <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>` : `Hide <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`}
            </button>
          </div>
          ${insightsHTML}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  async deleteProject(projId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    if (!confirm(`Permanently delete project "${proj.name}" and ALL its data? This CANNOT be undone.`)) return;
    await window.dbService.deleteProject(projId);
    window.ModalComponent.showToast(`Project "${proj.name}" deleted.`);
    window.AppRouter.refresh();
  }
};
