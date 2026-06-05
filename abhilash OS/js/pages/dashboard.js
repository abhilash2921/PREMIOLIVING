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
        <div onclick="openModal('health-details-modal', { projectId: '${projects[0] ? projects[0].id : ''}', filter: 'all' })" class="card p-4 flex flex-col justify-between cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all hover:border-amber-500/25">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Active Portfolio</span>
          <div>
            <h3 class="text-lg font-bold text-white font-mono mt-1">${projects.length} Projects</h3>
            <span class="text-[9px] text-emerald-400 font-medium">Avg Progress: ${overallProgress}%</span>
          </div>
        </div>
        <div onclick="openModal('progress-breakdown-modal', { projectId: '${projects[0] ? projects[0].id : ''}' })" class="card p-4 flex flex-col justify-between cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all hover:border-amber-500/25">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Value Under Management</span>
          <div>
            <h3 class="text-lg font-bold text-white font-mono mt-1">${window.Utils.formatCurrency(totalBudget)}</h3>
            <span class="text-[9px] text-muted">Paid: ${window.Utils.formatCurrency(totalPaid)}</span>
          </div>
        </div>
        <div onclick="openModal('health-details-modal', { projectId: '${projects[0] ? projects[0].id : ''}', filter: 'overdue' })" class="card p-4 flex flex-col justify-between cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all hover:border-amber-500/25">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-wider">Active Snag Logs</span>
          <div>
            <h3 class="text-lg font-bold text-rose-400 font-mono mt-1">${totalSnags} Open</h3>
            <span class="text-[9px] text-rose-500/80 font-medium">Requires site engineering</span>
          </div>
        </div>
        <div onclick="openModal('health-details-modal', { projectId: '${projects[0] ? projects[0].id : ''}', filter: 'pending' })" class="card p-4 flex flex-col justify-between cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all hover:border-amber-500/25">
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
    // --- CASH FLOW & COLLECTIONS CALCULATIONS ---
    let pendingClientCollections = 0;
    let totalPaidCollections = 0;
    projects.forEach(p => {
      (p.billing || []).forEach(b => {
        if (b.status === "Pending") pendingClientCollections += b.amount;
        if (b.status === "Paid") totalPaidCollections += b.amount;
      });
    });

    let vendorPaymentsDue = 0;
    let vendorPaymentsPaid = 0;
    const allPayouts = store.state.payouts || [];
    allPayouts.forEach(p => {
      if (p.status === "Paid") {
        vendorPaymentsPaid += p.amount;
      } else if (p.status !== "Rejected" && p.status !== "Closed") {
        vendorPaymentsDue += p.amount;
      }
    });

    const netCashPosition = totalPaidCollections - vendorPaymentsPaid;
    const upcomingPaymentCommitments = vendorPaymentsDue;

    const cashFlowHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
        <div onclick="openModal('cash-flow-drilldown-modal', { category: 'collections' })" class="card p-4 border-l-4 border-emerald-400 bg-emerald-950/5 cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all">
          <span class="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider">Pending Client Collections</span>
          <h3 class="text-base font-extrabold text-white font-mono mt-1">₹${pendingClientCollections.toLocaleString('en-IN')}</h3>
          <span class="text-[8px] text-muted">Receivable from client invoices</span>
        </div>
        <div onclick="openModal('cash-flow-drilldown-modal', { category: 'payouts' })" class="card p-4 border-l-4 border-rose-500 bg-rose-950/5 cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all">
          <span class="text-[9px] text-rose-400 uppercase font-mono font-bold tracking-wider">Vendor Payments Due</span>
          <h3 class="text-base font-extrabold text-white font-mono mt-1">₹${vendorPaymentsDue.toLocaleString('en-IN')}</h3>
          <span class="text-[8px] text-muted">Awaiting accounts disbursement</span>
        </div>
        <div onclick="openModal('cash-flow-drilldown-modal', { category: 'net_cash' })" class="card p-4 border-l-4 border-cyan-400 bg-cyan-950/5 cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all">
          <span class="text-[9px] text-cyan-400 uppercase font-mono font-bold tracking-wider">Net Cash Position</span>
          <h3 class="text-base font-extrabold text-white font-mono mt-1">₹${netCashPosition.toLocaleString('en-IN')}</h3>
          <span class="text-[8px] text-muted">Paid Collections minus Paid Vendor Payouts</span>
        </div>
        <div onclick="openModal('cash-flow-drilldown-modal', { category: 'commitments' })" class="card p-4 border-l-4 border-purple-400 bg-purple-950/5 cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all">
          <span class="text-[9px] text-purple-400 uppercase font-mono font-bold tracking-wider">Upcoming Commitments</span>
          <h3 class="text-base font-extrabold text-white font-mono mt-1">₹${upcomingPaymentCommitments.toLocaleString('en-IN')}</h3>
          <span class="text-[8px] text-muted">Projected payout pipeline</span>
        </div>
      </div>
    `;

    // --- PROJECT BOTTLENECK CENTER ---
    const bottlenecks = [];
    projects.forEach(p => {
      (p.dependencies || []).forEach(d => {
        if (d.status === 'Blocked' || d.status === 'Overdue') {
          bottlenecks.push({
            projectId: p.id,
            dependencyId: d.id,
            project: p.name.split(" (")[0],
            activity: d.description,
            blockedBy: d.blockedBy,
            owner: d.owner,
            daysDelayed: d.daysDelayed || 0,
            expectedResolution: d.targetDate
          });
        }
      });
    });

    const bottlenecksHTML = bottlenecks.length === 0 ? `
      <div class="text-center py-6 bg-secondary/35 rounded-lg border border-dashed border-border-color/30 text-xs text-secondary">
        ✅ Zero bottlenecks detected. Project dependencies aligned.
      </div>
    ` : `
      <div class="overflow-x-auto border border-border-color/40 rounded-lg">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-border-color/60 text-secondary font-mono text-[9px] uppercase font-bold bg-primary/30">
              <th class="py-2.5 px-3">Project</th>
              <th class="py-2.5 px-3">Activity</th>
              <th class="py-2.5 px-3">Blocked By</th>
              <th class="py-2.5 px-3">Owner</th>
              <th class="py-2.5 px-3">Days Delayed</th>
              <th class="py-2.5 px-3">Expected Resolution</th>
              <th class="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bottlenecks.map(b => `
              <tr onclick="openModal('bottleneck-details-modal', { projectId: '${b.projectId}', dependencyId: '${b.dependencyId}' })" class="border-b border-border-color/10 hover:bg-hover/10 last:border-b-0 cursor-pointer">
                <td class="py-2.5 px-3 font-semibold text-white">${b.project}</td>
                <td class="py-2.5 px-3 text-secondary">${b.activity}</td>
                <td class="py-2.5 px-3 text-rose-400 font-semibold">${b.blockedBy}</td>
                <td class="py-2.5 px-3 text-secondary font-medium">${b.owner}</td>
                <td class="py-2.5 px-3">
                  <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono font-bold">${b.daysDelayed} Days</span>
                </td>
                <td class="py-2.5 px-3 text-muted font-mono">${b.expectedResolution}</td>
                <td class="py-2.5 px-3 text-center">
                  <button onclick="event.stopPropagation(); window.DashboardPage.quickCompleteDependency('${b.projectId}', '${b.dependencyId}')" class="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded border border-emerald-500/30 transition-all inline-flex items-center justify-center font-bold" title="Quick Complete">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    // --- ROOT CAUSE DELAY ANALYTICS ---
    const delayCounts = {
      'Design': 0,
      'Client': 0,
      'Vendor': 0,
      'Material': 0,
      'Labour': 0,
      'Approval': 0,
      'Payment': 0
    };
    let totalDelays = 0;

    projects.forEach(p => {
      (p.dependencies || []).forEach(d => {
        if (d.status === 'Blocked' || d.status === 'Overdue') {
          const type = d.type || 'Other';
          if (delayCounts.hasOwnProperty(type)) {
            delayCounts[type]++;
            totalDelays++;
          } else if (type.toLowerCase().includes('design')) {
            delayCounts['Design']++; totalDelays++;
          } else if (type.toLowerCase().includes('client')) {
            delayCounts['Client']++; totalDelays++;
          } else if (type.toLowerCase().includes('vendor')) {
            delayCounts['Vendor']++; totalDelays++;
          } else if (type.toLowerCase().includes('material') || type.toLowerCase().includes('procurement')) {
            delayCounts['Material']++; totalDelays++;
          } else if (type.toLowerCase().includes('labour') || type.toLowerCase().includes('worker')) {
            delayCounts['Labour']++; totalDelays++;
          } else if (type.toLowerCase().includes('approval')) {
            delayCounts['Approval']++; totalDelays++;
          } else if (type.toLowerCase().includes('payment') || type.toLowerCase().includes('pay')) {
            delayCounts['Payment']++; totalDelays++;
          }
        }
      });

      (p.updates || []).forEach(u => {
        if (u.delay && u.delay.type) {
          const type = u.delay.type;
          const match = type.split(" ")[0];
          if (delayCounts.hasOwnProperty(match)) {
            delayCounts[match]++;
            totalDelays++;
          }
        }
      });
    });

    const delayBreakdownHTML = Object.entries(delayCounts).map(([cat, count]) => {
      const pct = totalDelays > 0 ? Math.round((count / totalDelays) * 100) : 0;
      let color = 'bg-amber-500';
      if (cat === 'Design') color = 'bg-blue-400';
      else if (cat === 'Client') color = 'bg-indigo-400';
      else if (cat === 'Vendor') color = 'bg-orange-400';
      else if (cat === 'Material') color = 'bg-purple-400';
      else if (cat === 'Labour') color = 'bg-pink-400';
      else if (cat === 'Approval') color = 'bg-emerald-400';
      else if (cat === 'Payment') color = 'bg-rose-500';
      
      return `
        <div class="space-y-1">
          <div class="flex justify-between items-center text-xs">
            <span class="text-secondary font-medium">${cat} Delays</span>
            <span class="text-white font-bold font-mono">${pct}% <span class="text-[10px] text-muted font-normal">(${count})</span></span>
          </div>
          <div class="w-full bg-hover rounded-full h-1.5 overflow-hidden">
            <div class="h-full ${color} rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Dashboard Top Banner -->
        <div class="flex items-center justify-between border-b border-border-color pb-4">
          <div>
            <h1 class="text-lg font-bold tracking-tight text-white font-display">Workspaces Dashboard</h1>
            <p class="text-xs text-secondary mt-1">Multi-site Project Status & Financial Execution Command</p>
          </div>
          <div class="flex items-center gap-2">
            ${['admin', 'architect', 'designer'].includes(store.activeRole) ? `
              <button onclick="openModal('add-document-modal', { folder: 'drawings', fromDashboard: true })" class="px-3 py-1.5 bg-hover hover:bg-border-color text-white font-semibold text-xs rounded border border-border-color/60 transition-all flex items-center gap-1 shadow">
                <i data-lucide="upload" class="w-4 h-4 text-amber-500"></i> Upload Drawing
              </button>
            ` : ""}
            ${store.activeRole === "admin" ? `
              <button onclick="openModal('add-project-modal')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1 shadow">
                <i data-lucide="plus" class="w-4 h-4"></i> Create Project
              </button>
            ` : ""}
          </div>
        </div>

        <!-- Section 1: Portfolio Metrics -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono">Portfolio Health Overview</span>
            <button onclick="DashboardPage.toggleSection('metrics')" class="text-secondary hover:text-white text-xs flex items-center gap-1">
              ${this.collapsed.metrics ? `Show <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>` : `Hide <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`}
            </button>
          </div>
          ${metricsHTML}
        </div>

        <!-- PENDING COLLECTIONS & CASH FLOW -->
        <div class="space-y-3">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono block">Cash Flow Ledger</span>
          ${cashFlowHTML}
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

        <!-- PROJECT BOTTLENECK CENTER -->
        <div class="space-y-3">
          <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono block">Project Bottleneck Center</span>
          ${bottlenecksHTML}
        </div>

        <!-- Section 3: Analytics & Site Operations -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Delay Root Cause Analytics -->
          <div class="card p-4 space-y-4 lg:col-span-1">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1">
                <i data-lucide="bar-chart-3" class="w-4 h-4 text-amber-500"></i> Root Cause Analytics
              </h4>
              <p class="text-[9px] text-muted mt-0.5">Delay contribution percentage by block category</p>
            </div>
            <div class="space-y-3">
              ${delayBreakdownHTML}
            </div>
          </div>

          <!-- Execution logs & Alerts (Col span 2) -->
          <div class="lg:col-span-2 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted uppercase font-semibold tracking-widest font-mono">Site Insights & Operations</span>
              <button onclick="DashboardPage.toggleSection('insights')" class="text-secondary hover:text-white text-xs flex items-center gap-1">
                ${this.collapsed.insights ? `Show <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>` : `Hide <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>`}
              </button>
            </div>
            ${insightsHTML}
          </div>
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
  },

  async quickCompleteDependency(projId, depId) {
    const unblocked = await window.AppStore.updateDependency(projId, depId, { status: 'Completed' }, window.AppStore.activeRole);
    window.ModalComponent.showToast("Dependency completed successfully!");
    
    if (unblocked && unblocked.length > 0) {
      setTimeout(() => {
        const listStr = unblocked.map(u => `"${u.description}"`).join(", ");
        alert(`Dependency resolved! This unblocks the following activities on the project:\n${listStr}`);
        window.AppRouter.refresh();
      }, 600);
    } else {
      window.AppRouter.refresh();
    }
  }
};
