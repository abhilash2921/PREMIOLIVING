/* js/pages/today.js - Premio Living OS Today Action Center */

window.TodayPage = {
  render(container) {
    const store = window.AppStore;
    const role = store.activeRole;
    const todayStr = "2026-05-29"; // Anchored date mapping for demo data

    // Ensure payouts array exists
    if (!store.state.payouts) {
      store.state.payouts = [];
    }

    let overdueSnags = [];
    let delayedDeliveries = [];
    let pendingClientApprovals = [];
    let pendingPaymentReleases = [];
    let escalatedIssues = [];

    let rfqsAwaitingQuotes = [];
    let posAwaitingConfirmation = [];
    let materialApprovalsPending = [];
    let delayedStages = [];

    let scheduledVisits = [];
    let scheduledDeliveries = [];
    let scheduledInstallations = [];
    let scheduledMeetings = [];

    // ────────────────────────────────────────────────────────
    // 1. DATA AGGREGATION & FILTERING
    // ────────────────────────────────────────────────────────
    
    // Ensure visible projects respects roles
    const visibleProjects = store.state.projects.filter(p => {
      if (role === "vendor") {
        return p.materials.some(m => m.vendor === "Wood Crafts");
      }
      if (role === "client") {
        return p.id === "project-1";
      }
      return true;
    });

    // Main loops over visible projects
    visibleProjects.forEach(p => {
      // Timeline Stages
      p.stages.forEach(st => {
        if (st.deadline) {
          if (st.deadline < todayStr && st.progress < 100) {
            delayedStages.push({ project: p, stage: st });
          } else if (st.deadline === todayStr && st.progress < 100) {
            scheduledInstallations.push({ project: p, stage: st });
          }
        }
      });

      // Material specs
      p.materials.forEach(m => {
        if (m.approved === "Pending") {
          materialApprovalsPending.push({ project: p, material: m });
          if (p.startDate && p.startDate < todayStr) {
            pendingClientApprovals.push({ project: p, material: m });
          }
        }
      });

      // Scheduled Visits
      p.visits.forEach(v => {
        if (v.date === todayStr) {
          scheduledVisits.push({ project: p, visit: v });
          if (v.purpose.toLowerCase().includes("meeting") || v.purpose.toLowerCase().includes("discuss")) {
            scheduledMeetings.push({ project: p, visit: v });
          }
        }
      });

      // Deliveries
      p.deliveries.forEach(d => {
        if (d.status === "Pending") {
          if (d.date < todayStr) {
            delayedDeliveries.push({ project: p, delivery: d });
          } else if (d.date === todayStr) {
            scheduledDeliveries.push({ project: p, delivery: d });
          }
        }
      });

      // Snags
      p.snags.forEach(s => {
        if (s.status === "Open") {
          if (s.priority === "High") {
            escalatedIssues.push({ project: p, snag: s });
          }
          if (s.deadline && s.deadline < todayStr) {
            overdueSnags.push({ project: p, snag: s });
          }
        }
      });
    });

    // Awaiting RFQs & PO follow-ups
    const rfqs = store.state.rfqs || [];
    rfqs.forEach(r => {
      if (r.status === "Sent" || r.status === "Quote Received") {
        const bidsCount = r.quotes?.length || 0;
        if (bidsCount === 0) {
          rfqsAwaitingQuotes.push(r);
        }
      }
    });

    const pos = store.state.purchaseOrders || [];
    pos.forEach(po => {
      if (po.status === "Sent" || !po.vendorConfirmed) {
        posAwaitingConfirmation.push(po);
      }
    });

    // Payouts transitions
    const payouts = store.state.payouts || [];
    payouts.forEach(pay => {
      if (['Approved', 'Sent To Accounts'].includes(pay.status)) {
        pendingPaymentReleases.push(pay);
      }
    });

    // Overdue items check counts
    const overdueCount = overdueSnags.length + delayedDeliveries.length + pendingClientApprovals.length + pendingPaymentReleases.length + delayedStages.length;

    // --- SITE HEALTH CENTER CALCULATIONS ---
    const totalActive = visibleProjects.length;
    const onTrack = visibleProjects.filter(p => store.getProjectStatus(p).label === 'On Track').length;
    const delayed = visibleProjects.filter(p => store.getProjectStatus(p).label === 'Delayed').length;
    const nearHandover = visibleProjects.filter(p => store.getProjectStatus(p).label === 'Near Handover').length;
    const critical = visibleProjects.filter(p => store.getProjectStatus(p).label === 'Critical').length;
    const overallHealth = totalActive > 0 ? Math.round(visibleProjects.reduce((acc, p) => acc + store.getProjectHealthScore(p), 0) / totalActive) : 100;

    const healthCardsHTML = visibleProjects.map(p => {
      const score = store.getProjectHealthScore(p);
      const status = store.getProjectStatus(p);
      return `
        <div onclick="openModal('health-details-modal', { projectId: '${p.id}' })" class="bg-primary/20 border border-border-color/60 rounded-lg p-3 space-y-2 hover:border-amber-500/30 transition-all duration-300 cursor-pointer hover:bg-hover/20 hover:scale-[1.01]">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[130px]" title="${p.name}">${p.name.split(" (")[0]}</h4>
              <p class="text-[9px] text-muted truncate max-w-[130px]">${p.location.split(",")[0]}</p>
            </div>
            <span class="px-2 py-0.5 text-[9px] font-bold rounded ${status.bg} ${status.color} border">
              ${status.label}
            </span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-secondary">Health Score</span>
              <span class="font-bold text-white font-mono">${score}/100</span>
            </div>
            <div class="w-full bg-hover rounded-full h-1.5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-blue-400' : score >= 40 ? 'bg-amber-400' : 'bg-rose-500'}" style="width: ${score}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // --- PROJECT PROGRESS SNAPSHOT CALCULATIONS ---
    const progressHTML = visibleProjects.map(p => {
      const calculatedProgress = store.getProjectProgress(p);
      return `
        <div onclick="openModal('progress-breakdown-modal', { projectId: '${p.id}' })" class="space-y-1 cursor-pointer hover:opacity-85 transition-all">
          <div class="flex justify-between items-center text-xs">
            <span class="font-semibold text-secondary truncate max-w-[200px]" title="${p.name}">${p.name.split(" (")[0]}</span>
            <span class="font-bold text-emerald-400 font-mono">${calculatedProgress}%</span>
          </div>
          <div class="w-full bg-hover rounded-full h-2 overflow-hidden">
            <div class="h-full bg-emerald-400 rounded-full transition-all duration-500" style="width: ${calculatedProgress}%"></div>
          </div>
        </div>
      `;
    }).join("");

    // --- TODAY'S ACTION CENTER ---
    const taListHTML = (store.state.todaysActions || []).map(action => `
      <div class="flex items-start gap-2 py-1.5 border-b border-border-color/10 last:border-0 last:pb-0 text-xs">
        <input type="checkbox" id="ta-chk-${action.id}" ${action.completed ? 'checked' : ''} 
          class="accent-amber-500 w-4 h-4 mt-0.5 cursor-pointer" 
          onclick="window.AppStore.toggleTodaysAction('${action.id}'); window.AppRouter.refresh();">
        <label for="ta-chk-${action.id}" class="text-secondary leading-normal flex-1 cursor-pointer hover:text-white ${action.completed ? 'line-through text-muted' : ''}">
          <span class="px-1.5 py-0.5 rounded text-[8px] mr-1.5 font-bold uppercase tracking-wider ${action.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : action.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'}">
            ${action.type || 'Action'}
          </span>
          ${action.text}
        </label>
      </div>
    `).join("");

    // --- WAITING FOR DASHBOARD ---
    const waitingDeps = [];
    visibleProjects.forEach(p => {
      (p.dependencies || []).forEach(d => {
        if (d.status === 'Waiting' || d.status === 'Blocked') {
          waitingDeps.push({
            projectId: p.id,
            dependencyId: d.id,
            project: p.name.split(" (")[0],
            description: d.description,
            blockedBy: d.blockedBy,
            owner: d.owner,
            daysDelayed: d.daysDelayed || 0,
            targetDate: d.targetDate
          });
        }
      });
    });

    const waitingHTML = waitingDeps.length === 0 ? `
      <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
        ✅ No pending items are waiting on external actions today.
      </div>
    ` : waitingDeps.map(w => `
      <div onclick="openModal('waiting-details-modal', { projectId: '${w.projectId}', dependencyId: '${w.dependencyId}' })" class="bg-primary/20 border border-border-color/40 rounded p-2.5 text-xs space-y-1 cursor-pointer hover:bg-hover/20 hover:scale-[1.01] transition-all">
        <div class="flex justify-between items-start">
          <span class="font-bold text-white truncate max-w-[220px]">${w.description}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 font-mono font-bold">${w.daysDelayed} Days</span>
        </div>
        <div class="grid grid-cols-2 gap-y-0.5 text-[9px] text-secondary mt-1">
          <div>Proj: <span class="text-white truncate max-w-[80px] inline-block align-bottom">${w.project}</span></div>
          <div>Blocked: <span class="text-white truncate max-w-[80px] inline-block align-bottom font-semibold">${w.blockedBy}</span></div>
          <div>Owner: <span class="text-white">${w.owner}</span></div>
          <div>Target: <span class="text-white font-mono">${w.targetDate}</span></div>
        </div>
      </div>
    `).join("");

    // --- OWNER RESPONSIBILITY DASHBOARD ---
    const groups = {
      Designer: [],
      Client: [],
      Vendor: [],
      "Site Team": [],
      Management: []
    };
    
    visibleProjects.forEach(p => {
      (p.dependencies || []).forEach(d => {
        if (d.status !== 'Completed' && d.status !== 'Cancelled') {
          const owner = (d.owner || "").toLowerCase();
          let grp = "Site Team";
          if (owner.includes("kumar") || owner.includes("designer") || owner.includes("architect")) {
            grp = "Designer";
          } else if (owner.includes("client") || owner.includes("vikram") || owner.includes("anil") || owner.includes("aparna")) {
            grp = "Client";
          } else if (owner.includes("wood") || owner.includes("stone") || owner.includes("philips") || owner.includes("advance") || owner.includes("royal") || owner.includes("vendor") || owner.includes("supplier") || owner.includes("marble") || owner.includes("galleria")) {
            grp = "Vendor";
          } else if (owner.includes("reddy") || owner.includes("pm") || owner.includes("management") || owner.includes("naveen") || owner.includes("accounts")) {
            grp = "Management";
          } else if (owner.includes("nair") || owner.includes("sharma") || owner.includes("lead") || owner.includes("engineer") || owner.includes("site")) {
            grp = "Site Team";
          }
          groups[grp].push({
            type: "Dependency",
            projectId: p.id,
            projectName: p.name.split(" (")[0],
            itemId: d.id,
            title: d.description,
            owner: d.owner,
            status: d.status,
            targetDate: d.targetDate
          });
        }
      });
      
      (p.snags || []).forEach(s => {
        if (s.status === 'Open') {
          const resp = (s.assignedTo || "").toLowerCase();
          let grp = "Vendor";
          if (resp.includes("kumar") || resp.includes("designer") || resp.includes("architect")) {
            grp = "Designer";
          } else if (resp.includes("client") || resp.includes("vikram") || resp.includes("anil") || resp.includes("aparna")) {
            grp = "Client";
          } else if (resp.includes("reddy") || resp.includes("pm") || resp.includes("management") || resp.includes("naveen") || resp.includes("accounts")) {
            grp = "Management";
          } else if (resp.includes("nair") || resp.includes("sharma") || resp.includes("lead") || resp.includes("engineer") || resp.includes("site")) {
            grp = "Site Team";
          }
          groups[grp].push({
            type: "Snag",
            projectId: p.id,
            projectName: p.name.split(" (")[0],
            itemId: s.id,
            title: s.issue,
            owner: s.assignedTo,
            status: s.priority + " Priority",
            targetDate: s.deadline
          });
        }
      });
    });

    const activeGroup = window.TodayPage.activeGroup || "Client";
    const ownerDashboardHTML = `
      <div class="card border-border-color bg-card p-4 space-y-4">
        <div class="border-b border-border-color/30 pb-2 flex justify-between items-center">
          <div>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <i data-lucide="users" class="w-4 h-4 text-amber-500"></i> Owner Responsibility Dashboard
            </h3>
            <p class="text-[9px] text-muted">Pending and blocked execution items grouped by department. Click cards to view details.</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          ${Object.entries(groups).map(([name, items]) => {
            const isActive = activeGroup === name;
            return `
              <div onclick="window.TodayPage.setActiveGroup('${name}')" class="p-3 rounded-lg border transition-all duration-300 cursor-pointer text-center ${isActive ? 'bg-amber-500/10 border-amber-500' : 'bg-primary/20 border-border-color/60 hover:border-amber-500/30'}">
                <span class="text-[9px] font-bold block uppercase tracking-wider ${isActive ? 'text-amber-400' : 'text-secondary'}">${name}</span>
                <span class="text-lg font-black font-mono block mt-1 ${items.length > 0 ? (isActive ? 'text-amber-400' : 'text-white') : 'text-muted'}">${items.length}</span>
              </div>
            `;
          }).join("")}
        </div>
        
        <!-- Collapsible task list -->
        <div class="bg-primary/20 border border-border-color/40 rounded-lg p-3 space-y-2">
          <span class="text-[10px] text-muted font-bold uppercase tracking-wider block">Pending Tasks: ${activeGroup}</span>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${(groups[activeGroup] || []).length === 0 ? `
              <div class="text-center text-muted py-4 text-xs italic">
                🎉 No pending items for ${activeGroup}.
              </div>
            ` : (groups[activeGroup] || []).map(t => {
              const isDep = t.type === "Dependency";
              return `
                <div class="flex justify-between items-center p-2 bg-hover/20 border border-border-color/20 rounded text-xs">
                  <div>
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mr-1.5 ${isDep ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'}">${t.type}</span>
                    <span class="font-bold text-white">${t.title}</span>
                    <span class="text-[9px] text-muted block mt-0.5">Project: ${t.projectName} • Owner: ${t.owner} • Status: ${t.status}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-mono text-muted mr-1.5">Target: ${t.targetDate || "TBD"}</span>
                    ${isDep ? `
                      <button onclick="event.stopPropagation(); window.TodayPage.quickCompleteDependency('${t.projectId}', '${t.itemId}')" class="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded border border-emerald-500/30 transition-all inline-flex items-center justify-center" title="Quick Complete">
                        <i data-lucide="check" class="w-3 h-3"></i>
                      </button>
                      <button onclick="event.stopPropagation(); openModal('edit-dependency-modal', { projectId: '${t.projectId}', dependencyId: '${t.itemId}' })" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500" title="Edit">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                      </button>
                    ` : `
                      <button onclick="event.stopPropagation(); openModal('add-snag-modal', { projectId: '${t.projectId}', snag: { id: '${t.itemId}', area: '', issue: t.title, priority: 'High', assignedTo: t.owner, deadline: t.targetDate }, isEdit: true })" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500" title="Edit Snag">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    // --- HANDOVER READINESS MODULE ---
    const handoverHTML = visibleProjects.map(p => {
      const readiness = store.getHandoverReadiness(p);
      const cl = p.handoverChecklist || {};
      const totalSnags = (p.snags || []).length;
      const closedSnags = (p.snags || []).filter(s => s.status === 'Closed').length;
      const totalInvoices = (p.billing || []).length;
      const paidInvoices = (p.billing || []).filter(b => b.status === 'Paid').length;
      const billingPercent = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 100;
      
      return `
        <div class="bg-primary/25 border border-border-color/60 rounded-lg p-3 space-y-3">
          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[160px]">${p.name.split(" (")[0]}</h4>
              <span class="text-[9px] text-muted">Handover Closure Tracker</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs font-bold text-emerald-400 font-mono">${readiness}%</span>
              <span class="text-[8px] text-muted">Readiness</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-[9px] bg-hover/20 p-1.5 rounded">
            <div>Snags: <span class="text-white font-mono">${closedSnags}/${totalSnags} Closed</span></div>
            <div>Billing: <span class="text-white font-mono">${billingPercent}% Paid</span></div>
          </div>

          <div class="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] pt-1 border-t border-border-color/20">
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.snagsClosed ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'snagsClosed')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Snags Closed
            </label>
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.deepCleaning ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'deepCleaning')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Deep Cleaned
            </label>
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.appliancesTested ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'appliancesTested')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Appliances OK
            </label>
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.finalPaymentReceived ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'finalPaymentReceived')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Final Payment
            </label>
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.keysHandedOver ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'keysHandedOver')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Keys Handed
            </label>
            <label class="flex items-center gap-1 text-secondary cursor-pointer hover:text-white truncate">
              <input type="checkbox" ${cl.warrantiesShared ? 'checked' : ''} 
                onclick="window.AppStore.toggleHandoverCheck('${p.id}', 'warrantiesShared')" class="accent-emerald-500 w-3 h-3 flex-shrink-0">
              Warranty Docs
            </label>
          </div>
        </div>
      `;
    }).join("");

    // --- RECENT ACTIVITY FEED ---
    const activityFeedHTML = (store.state.activityLog || []).slice(0, 15).map(act => {
      const timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(act.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' });
      return `
        <div class="flex gap-2 text-xs border-b border-border-color/10 pb-2 last:border-0 last:pb-0">
          <div class="mt-0.5 flex-shrink-0 w-6 h-6 rounded bg-hover flex items-center justify-center">
            <i data-lucide="${act.icon || 'activity'}" class="w-3.5 h-3.5 ${act.color || 'text-secondary'}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center text-[9px] text-muted">
              <span class="font-bold text-white/80">${act.project || 'Global'}</span>
              <span>${dateStr} • ${timeStr}</span>
            </div>
            <p class="text-secondary leading-snug mt-0.5">${act.message}</p>
          </div>
        </div>
      `;
    }).join("");

    // --- DEPENDENCY TRACKER TABLE ---
    const allDeps = [];
    visibleProjects.forEach(p => {
      (p.dependencies || []).forEach(d => {
        allDeps.push({
          project: p.name.split(" (")[0],
          projectId: p.id,
          ...d
        });
      });
    });

    const dependencyHTML = allDeps.length === 0 ? `
      <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
        No active project dependencies tracked currently.
      </div>
    ` : `
      <div class="overflow-x-auto border border-border-color/40 rounded-lg">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-border-color/60 text-secondary font-mono text-[9px] uppercase font-bold bg-primary/30">
              <th class="py-2 px-3">Project</th>
              <th class="py-2 px-3">Activity / Spec</th>
              <th class="py-2 px-3">Status</th>
              <th class="py-2 px-3">Blocked By</th>
              <th class="py-2 px-3">Owner</th>
              <th class="py-2 px-3 text-right">Target Date</th>
              <th class="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allDeps.map(d => {
              let statusBadge = '';
              if (d.status === 'Blocked') statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
              else if (d.status === 'Waiting') statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              else if (d.status === 'Overdue') statusBadge = 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse';
              else statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              return `
                <tr onclick="openModal('edit-dependency-modal', { projectId: '${d.projectId}', dependencyId: '${d.id}' })" class="border-b border-border-color/10 hover:bg-hover/10 last:border-b-0 cursor-pointer">
                  <td class="py-2 px-3 font-semibold text-white truncate max-w-[100px]" title="${d.project}">${d.project}</td>
                  <td class="py-2 px-3 text-secondary truncate max-w-[150px]" title="${d.description}">${d.description}</td>
                  <td class="py-2 px-3">
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-bold border ${statusBadge}">${d.status}</span>
                  </td>
                  <td class="py-2 px-3 text-secondary font-medium truncate max-w-[100px]" title="${d.blockedBy}">${d.blockedBy || '-'}</td>
                  <td class="py-2 px-3 text-secondary">${d.owner}</td>
                  <td class="py-2 px-3 text-right text-muted font-mono">${d.targetDate}</td>
                  <td class="py-2 px-3 text-center">
                    ${d.status !== 'Completed' ? `
                      <button onclick="event.stopPropagation(); window.TodayPage.quickCompleteDependency('${d.projectId}', '${d.id}')" class="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded border border-emerald-500/30 transition-all inline-flex items-center justify-center" title="Quick Complete">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : `
                      <span class="text-emerald-400 font-semibold font-mono text-[10px]">Done</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    const addDepFormHTML = `
      <form id="add-dep-form" onsubmit="window.TodayPage.addNewDependency(event)" class="grid grid-cols-1 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-border-color/20 bg-primary/10 p-2.5 rounded">
        <div>
          <label class="text-[8px] text-muted block mb-0.5 uppercase font-bold">Project</label>
          <select id="new-dep-project" class="bg-hover border border-border-color/60 text-[11px] rounded p-1 text-white w-full focus:outline-none focus:border-amber-500">
            ${visibleProjects.map(p => `<option value="${p.id}">${p.name.split(" (")[0]}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="text-[8px] text-muted block mb-0.5 uppercase font-bold">Activity</label>
          <input type="text" id="new-dep-desc" placeholder="e.g. Stone Procurement" required
            class="bg-hover border border-border-color/60 text-[11px] rounded p-1 text-white w-full focus:outline-none focus:border-amber-500">
        </div>
        <div>
          <label class="text-[8px] text-muted block mb-0.5 uppercase font-bold">Blocked By</label>
          <input type="text" id="new-dep-blocked" placeholder="e.g. Client Approval" required
            class="bg-hover border border-border-color/60 text-[11px] rounded p-1 text-white w-full focus:outline-none focus:border-amber-500">
        </div>
        <div>
          <label class="text-[8px] text-muted block mb-0.5 uppercase font-bold">Owner</label>
          <input type="text" id="new-dep-owner" placeholder="e.g. Client" required
            class="bg-hover border border-border-color/60 text-[11px] rounded p-1 text-white w-full focus:outline-none focus:border-amber-500">
        </div>
        <div>
          <label class="text-[8px] text-muted block mb-0.5 uppercase font-bold">Target Date</label>
          <input type="date" id="new-dep-date" required
            class="bg-hover border border-border-color/60 text-[11px] rounded p-1 text-white w-full focus:outline-none focus:border-amber-500">
        </div>
        <div class="flex items-end">
          <button type="submit" class="bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] rounded py-1.5 w-full transition-all">
            Add Dependency
          </button>
        </div>
      </form>
    `;

    const addActionFormHTML = `
      <form id="add-action-form" onsubmit="window.TodayPage.addNewAction(event)" class="flex gap-1.5 mt-2.5 pt-2.5 border-t border-border-color/20">
        <input type="text" id="new-action-text" placeholder="Add custom checklist action..." required
          class="bg-hover border border-border-color/60 text-[11px] rounded px-2 py-1 text-white flex-1 focus:outline-none focus:border-amber-500">
        <select id="new-action-type" class="bg-hover border border-border-color/60 text-[10px] rounded px-1.5 text-white focus:outline-none focus:border-amber-500">
          <option value="Call Vendor">Call Vendor</option>
          <option value="Approve Material">Approve Material</option>
          <option value="Raise Payment">Raise Payment</option>
          <option value="Site Visit">Site Visit</option>
          <option value="Follow-up RFQ">Follow-up RFQ</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-bold rounded flex items-center justify-center transition-all">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        </button>
      </form>
    `;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- 2.1 TITLE BANNER & QUICK ACTIONS -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-4">
          <div>
            <h1 class="text-lg font-bold tracking-tight text-white font-display">Command Center</h1>
            <p class="text-xs text-secondary mt-1">Daily Operations & Executions • Action list for ${new Date(todayStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.AppRouter.refresh()" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Refresh">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- 2.2 QUICK ACTION SHORTCUTS -->
        <div class="card p-3 border-border-color bg-card">
          <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-2">Quick Operations Shortcuts</span>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openCreateView(), 50);" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="file-question" class="w-3.5 h-3.5 text-amber-500"></i> Create RFQ
            </button>
            <button onclick="window.AppRouter.navigate('pos'); setTimeout(() => window.POPage.openCreateModal(), 50);" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="clipboard-signature" class="w-3.5 h-3.5 text-blue-400"></i> Create PO
            </button>
            <button onclick="window.AppRouter.navigate('payouts'); setTimeout(() => window.PayoutsPage.openCreateModal(), 50);" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="wallet" class="w-3.5 h-3.5 text-emerald-400"></i> Raise Payment
            </button>
            <button onclick="openModal('add-update-modal')" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-cyan-400"></i> Log Site Update
            </button>
            <button onclick="openModal('add-snag-modal')" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="alert-octagon" class="w-3.5 h-3.5 text-rose-500"></i> Add Snag
            </button>
            <button onclick="openModal('add-delivery-modal')" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="package" class="w-3.5 h-3.5 text-purple-400"></i> Add Delivery
            </button>
            <button onclick="openModal('add-visit-modal')" 
              class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-teal-400"></i> Schedule Visit
            </button>
          </div>
        </div>

        <!-- 1. SITE HEALTH CENTER -->
        <div class="card border-border-color bg-card p-4 space-y-4">
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border-color/30 pb-2">
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <i data-lucide="heart" class="w-4 h-4 text-emerald-400 animate-pulse"></i> Site Health Center
              </h3>
              <p class="text-[10px] text-secondary mt-0.5">Calculated automatically from snags, overdue stages, pending materials, and blocked dependencies</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-secondary">Overall Health:</span>
              <span class="text-sm font-extrabold text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">${overallHealth}/100</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-border-color/20 pb-3">
            <div onclick="openModal('health-details-modal', { projectId: '${visibleProjects[0] ? visibleProjects[0].id : ''}', filter: 'all' })" class="bg-primary/20 p-2.5 rounded border border-border-color/40 text-center cursor-pointer hover:bg-hover/20 transition-all">
              <span class="text-[10px] text-muted uppercase font-bold tracking-wider block">Active Projects</span>
              <span class="text-lg font-black text-white font-mono mt-1 block">${totalActive}</span>
            </div>
            <div onclick="openModal('health-details-modal', { projectId: '${visibleProjects[0] ? visibleProjects[0].id : ''}', filter: 'completed' })" class="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/20 text-center cursor-pointer hover:bg-emerald-500/10 transition-all">
              <span class="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">On Track</span>
              <span class="text-lg font-black text-emerald-400 font-mono mt-1 block">${onTrack}</span>
            </div>
            <div onclick="openModal('health-details-modal', { projectId: '${visibleProjects[0] ? visibleProjects[0].id : ''}', filter: 'pending' })" class="bg-blue-500/5 p-2.5 rounded border border-blue-500/20 text-center cursor-pointer hover:bg-blue-500/10 transition-all">
              <span class="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">Near Handover</span>
              <span class="text-lg font-black text-blue-400 font-mono mt-1 block">${nearHandover}</span>
            </div>
            <div onclick="openModal('health-details-modal', { projectId: '${visibleProjects[0] ? visibleProjects[0].id : ''}', filter: 'overdue' })" class="bg-amber-500/5 p-2.5 rounded border border-amber-500/20 text-center cursor-pointer hover:bg-amber-500/10 transition-all">
              <span class="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">Delayed</span>
              <span class="text-lg font-black text-amber-400 font-mono mt-1 block">${delayed}</span>
            </div>
            <div onclick="openModal('health-details-modal', { projectId: '${visibleProjects[0] ? visibleProjects[0].id : ''}', filter: 'blocked' })" class="bg-rose-500/5 p-2.5 rounded border border-rose-500/20 text-center col-span-2 sm:col-span-1 cursor-pointer hover:bg-rose-500/10 transition-all">
              <span class="text-[10px] text-rose-500 uppercase font-bold tracking-wider block">Critical</span>
              <span class="text-lg font-black text-rose-500 font-mono mt-1 block">${critical}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${healthCardsHTML}
          </div>
        </div>

        <!-- OWNER RESPONSIBILITY DASHBOARD -->
        ${ownerDashboardHTML}

        <!-- MID-LEVEL DASHBOARD GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- LEFT COLUMN: Progress & Actions -->
          <div class="space-y-6">
            <!-- 6. PROJECT PROGRESS SNAPSHOT -->
            <div class="card border-border-color bg-card p-4 space-y-3">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <i data-lucide="trending-up" class="w-4 h-4 text-cyan-400"></i> Project Progress Snapshot
              </h3>
              <p class="text-[9px] text-muted">Aggregated dynamically from Trade Progress %, Completed Tasks (dependencies & snags), and Milestones</p>
              <div class="space-y-3 mt-2">
                ${progressHTML}
              </div>
            </div>

            <!-- 7. TODAY'S ACTION CENTER -->
            <div class="card border-border-color bg-card p-4">
              <div class="flex justify-between items-center border-b border-border-color/30 pb-2 mb-2">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="check-square" class="w-4 h-4 text-amber-500"></i> Today's Actions Checklist
                </h3>
                <span class="text-[9px] text-muted">Mark complete instantly</span>
              </div>
              <div class="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                ${taListHTML}
              </div>
              ${addActionFormHTML}
            </div>

            <!-- 4. WAITING FOR DASHBOARD -->
            <div class="card border-border-color bg-card p-4 space-y-3">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <i data-lucide="hourglass" class="w-4 h-4 text-amber-400 animate-pulse"></i> Waiting For Dashboard
              </h3>
              <p class="text-[9px] text-muted">Items currently waiting on client review, design drawings, or approvals (aggregated from dependencies)</p>
              <div class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                ${waitingHTML}
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Handover & Feed -->
          <div class="space-y-6">
            <!-- 10. HANDOVER READINESS MODULE -->
            <div class="card border-border-color bg-card p-4 space-y-3">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <i data-lucide="folder-check" class="w-4 h-4 text-emerald-400"></i> Handover Readiness Module
              </h3>
              <p class="text-[9px] text-muted">Project Closure Tracker checklist. Toggling checkboxes calculates readiness dynamically.</p>
              <div class="space-y-3">
                ${handoverHTML}
              </div>
            </div>

            <!-- 8. RECENT ACTIVITY FEED -->
            <div class="card border-border-color bg-card p-4">
              <div class="border-b border-border-color/30 pb-2 mb-2">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i> Recent Activity Feed
                </h3>
                <p class="text-[9px] text-muted">Real-time system actions: RFQs, POs, Payments, Site Updates, Snags, and Deliveries</p>
              </div>
              <div class="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                ${activityFeedHTML}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. DEPENDENCY TRACKER -->
        <div class="card border-border-color bg-card p-4 space-y-3">
          <div class="border-b border-border-color/30 pb-2 flex justify-between items-center">
            <div>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <i data-lucide="git-branch" class="w-4 h-4 text-indigo-400"></i> Project Dependency Tracker
              </h3>
              <p class="text-[10px] text-secondary mt-0.5">Critical-path dependencies: Status, Activity, Blocked By, Owner, and Target Dates</p>
            </div>
          </div>
          ${dependencyHTML}
          ${addDepFormHTML}
        </div>

        <!-- 2.3 OPERATIONAL PRIORITIES SECTION -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- RED: High Priority -->
          <div class="card p-4 border-l-4 border-rose-500 bg-rose-950/5">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">High Priority Alerts</h3>
            </div>
            <div class="space-y-2 text-xs">
              ${this.renderPriorityItemsHTML([
                ...overdueSnags.map(o => `⚠️ Overdue Snag: ${o.snag.area} — ${o.snag.issue}`),
                ...delayedDeliveries.map(d => `🚚 Delayed Delivery: ${d.delivery.item} from ${d.project.name.split(" (")[0]}`),
                ...pendingClientApprovals.map(c => `✍️ Approvals: Client review for ${c.material.name}`),
                ...pendingPaymentReleases.map(p => `💰 Payment Release: ₹${p.amount.toLocaleString('en-IN')} for ${p.vendorName}`),
                ...escalatedIssues.map(e => `🚨 Escalated Snag: ${e.snag.issue}`)
              ], "No high priority alerts today")}
            </div>
          </div>

          <!-- YELLOW: Follow Up Required -->
          <div class="card p-4 border-l-4 border-amber-500 bg-amber-950/5">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Follow Up Required</h3>
            </div>
            <div class="space-y-2 text-xs">
              ${this.renderPriorityItemsHTML([
                ...rfqsAwaitingQuotes.map(r => `💬 RFQ Quote pending: ${r.rfqNumber} (${r.category})`),
                ...posAwaitingConfirmation.map(po => `🤝 PO Confirmation pending: ${po.poNumber} from ${po.vendorName}`),
                ...materialApprovalsPending.map(m => `🔬 Material Spec Approve: ${m.material.name}`),
                ...delayedStages.map(s => `⏳ Timeline Stage Delayed: ${s.stage.name}`)
              ], "No follow-up items pending")}
            </div>
          </div>

          <!-- GREEN: Scheduled Site Operations -->
          <div class="card p-4 border-l-4 border-emerald-500 bg-emerald-950/5">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Scheduled Site Ops</h3>
            </div>
            <div class="space-y-2 text-xs">
              ${this.renderPriorityItemsHTML([
                ...scheduledVisits.map(v => `🚶 Site Visit: ${v.visit.visitor} @ ${v.visit.time}`),
                ...scheduledDeliveries.map(d => `📦 Delivery: ${d.delivery.item} (${d.delivery.qty})`),
                ...scheduledInstallations.map(i => `🔨 Installation: ${i.stage.name}`),
                ...scheduledMeetings.map(m => `🤝 Meeting: ${m.visit.purpose}`)
              ], "No activities scheduled today")}
            </div>
          </div>
        </div>

        <!-- 2.4 MY PENDING ROLE ACTIONS CHECKLIST -->
        <div class="card border-border-color bg-card overflow-hidden">
          <div class="p-4 border-b border-border-color/60 bg-primary/20 flex justify-between items-center">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <i data-lucide="check-square" class="w-4 h-4 text-amber-500"></i> My Pending Actions (Role: ${role.toUpperCase()})
            </h3>
            <span class="text-[9px] text-muted">Click items to complete directly</span>
          </div>
          <div class="p-4 space-y-3">
            ${this.renderRoleActionsListHTML(role, todayStr)}
          </div>
        </div>

        <!-- 2.5 TWO-COLUMN OPERATIONAL DETAILED MODULES -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- LEFT COLUMN -->
          <div class="space-y-6">
            
            <!-- Vendor Follow-up Center -->
            <div class="card border-border-color bg-card">
              <div class="p-4 border-b border-border-color/60 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="wrench" class="w-4 h-4 text-amber-500"></i> Vendor Follow-Up Center
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${this.renderVendorFollowUpHTML(todayStr)}
              </div>
            </div>

            <!-- Payment Actions Ledger -->
            <div class="card border-border-color bg-card">
              <div class="p-4 border-b border-border-color/60 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="credit-card" class="w-4 h-4 text-purple-400"></i> Payout & Payment Actions
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${this.renderPaymentActionsHTML(todayStr)}
              </div>
            </div>

            <!-- Open High Priority Snags -->
            <div class="card border-border-color bg-card">
              <div class="p-4 border-b border-border-color/60 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-500"></i> Unresolved Critical Snags
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${this.renderHighPrioritySnagsHTML(escalatedIssues)}
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN -->
          <div class="space-y-6">
            
            <!-- Material Delivery Tracker -->
            <div class="card border-border-color bg-card">
              <div class="p-4 border-b border-border-color/60 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="truck" class="w-4 h-4 text-cyan-400"></i> Material Delivery Tracker
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${this.renderMaterialDeliveryTrackerHTML(scheduledDeliveries, delayedDeliveries)}
              </div>
            </div>

            <!-- Today's Site Activities Timeline -->
            <div class="card border-border-color bg-card">
              <div class="p-4 border-b border-border-color/60 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="calendar" class="w-4 h-4 text-emerald-400"></i> Today's Site Activities & Timeline
                </h3>
              </div>
              <div class="p-4 space-y-3">
                ${this.renderTodayActivitiesHTML(scheduledVisits, scheduledInstallations)}
              </div>
            </div>

            <!-- Overdue Items Panel -->
            <div class="card border-border-color bg-card border-t-4 border-t-rose-600">
              <div class="p-4 border-b border-border-color/60 bg-rose-950/10 flex justify-between items-center">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-500"></i> Overdue Operational Items (${overdueCount})
                </h3>
              </div>
              <div class="p-4 space-y-3.5">
                ${this.renderOverduePanelHTML(overdueSnags, delayedDeliveries, materialApprovalsPending, payouts, delayedStages)}
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // ────────────────────────────────────────────────────────
  // 3. SUB-RENDERING METHOD IMPLEMENTATIONS
  // ────────────────────────────────────────────────────────

  renderPriorityItemsHTML(items, emptyMsg) {
    if (items.length === 0) {
      return `<div class="text-muted italic text-[11px] py-1">${emptyMsg}</div>`;
    }
    return items.map(item => `
      <div class="flex items-center gap-1.5 py-0.5 border-b border-border-color/10 pb-1.5 last:border-0 last:pb-0 text-secondary">
        <span class="truncate block w-full" title="${item}">${item}</span>
      </div>
    `).join("");
  },

  renderRoleActionsListHTML(role, todayStr) {
    const store = window.AppStore;
    let actions = [];

    // ADMIN ACTIONS
    if (role === "admin") {
      // 1. Approvals on materials
      store.state.projects.forEach(p => {
        p.materials.forEach(m => {
          if (m.approved === "Pending") {
            actions.push({
              text: `Approve Material spec for: <b>${m.name}</b> (${p.name.split(" (")[0]})`,
              action: () => this.approveMaterial(p.id, m.id)
            });
          }
        });
      });

      // 2. RFQ quote decisions
      const rfqs = store.state.rfqs || [];
      rfqs.forEach(r => {
        if (r.status === "Quote Received" && !r.selectedVendor) {
          actions.push({
            text: `Select winning bid for RFQ: <b>${r.rfqNumber}</b> (${r.category})`,
            action: () => { window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openDetail(r.id), 100); }
          });
        }
        if (r.status === "Approved" && !r.convertedToPO) {
          actions.push({
            text: `Generate Purchase Order for winning bid on RFQ: <b>${r.rfqNumber}</b>`,
            action: () => { window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openDetail(r.id), 100); }
          });
        }
      });

      // 3. Payout approvals and releases
      const payouts = store.state.payouts || [];
      payouts.forEach(pay => {
        if (['Submitted', 'Awaiting Approval'].includes(pay.status)) {
          actions.push({
            text: `Approve Payout Request: ₹<b>${pay.amount.toLocaleString('en-IN')}</b> for ${pay.vendorName}`,
            action: () => { window.AppRouter.navigate('payouts'); setTimeout(() => window.PayoutsPage.viewDetails(pay.id), 100); }
          });
        }
        if (pay.status === "Sent To Accounts") {
          actions.push({
            text: `Release disbursement payment of ₹<b>${pay.amount.toLocaleString('en-IN')}</b> to ${pay.vendorName}`,
            action: () => { window.AppRouter.navigate('payouts'); setTimeout(() => window.PayoutsPage.viewDetails(pay.id), 100); }
          });
        }
      });
    }

    // DESIGNER / ARCHITECT ACTIONS
    if (role === "architect" || role === "designer") {
      store.state.projects.forEach(p => {
        // Material specs approvals
        p.materials.forEach(m => {
          if (m.approved === "Pending") {
            actions.push({
              text: `Verify & Approve Material specs: <b>${m.name}</b> (${m.brand})`,
              action: () => this.approveMaterial(p.id, m.id)
            });
          }
        });
      });

      const rfqs = store.state.rfqs || [];
      rfqs.forEach(r => {
        if (r.status === "Draft") {
          actions.push({
            text: `Review and dispatch RFQ Draft: <b>${r.rfqNumber}</b>`,
            action: () => { window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openEditView(r.id), 100); }
          });
        }
      });
    }

    // SITE ENGINEER ACTIONS
    if (role === "site_engineer") {
      store.state.projects.forEach(p => {
        // Daily logs check
        const hasTodayUpdate = p.updates.some(u => u.date === todayStr);
        if (!hasTodayUpdate) {
          actions.push({
            text: `Write today's progress log update for: <b>${p.name.split(" (")[0]}</b>`,
            action: () => openModal('add-update-modal')
          });
        }

        // Open snags resolution check
        p.snags.forEach(s => {
          if (s.status === "Open") {
            actions.push({
              text: `Resolve open snag: <b>${s.area} — ${s.issue}</b>`,
              action: () => this.closeSnag(p.id, s.id)
            });
          }
        });

        // Deliveries expected today
        p.deliveries.forEach(d => {
          if (d.date === todayStr && d.status === "Pending") {
            actions.push({
              text: `Log receipt of delivery: <b>${d.item}</b> from vendor`,
              action: () => this.receiveDelivery(p.id, d.id)
            });
          }
        });
      });
    }

    // Fallback if no actions
    if (actions.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          🎉 No pending actions assigned to your role today. Clear schedule!
        </div>
      `;
    }

    return actions.map((item, idx) => `
      <div class="flex items-start gap-3 py-2 border-b border-border-color/10 last:border-0 last:pb-0 text-xs">
        <input type="checkbox" id="action-chk-${idx}" class="accent-amber-500 w-4 h-4 mt-0.5 cursor-pointer" 
          onclick="setTimeout(() => { window.TodayPage.triggerAction(${idx}); }, 300)">
        <label for="action-chk-${idx}" class="text-secondary leading-normal flex-1 cursor-pointer hover:text-white">
          ${item.text}
        </label>
      </div>
    `).join("");

    // Store callbacks globally for checkbox events
    window._actionCallbacks = actions;
  },

  triggerAction(idx) {
    const action = window._actionCallbacks && window._actionCallbacks[idx];
    if (action && action.action) {
      action.action();
    }
  },

  renderVendorFollowUpHTML(todayStr) {
    const store = window.AppStore;
    let followups = [];

    // Get Awaiting RFQs
    const rfqs = store.state.rfqs || [];
    rfqs.forEach(rfq => {
      if (rfq.status === "Sent" || (rfq.status === "Quote Received" && (rfq.quotes || []).length === 0)) {
        const days = this.getDaysDifference(rfq.createdAt, todayStr);
        if (days >= 2) {
          followups.push({
            type: 'RFQ',
            ref: rfq.rfqNumber,
            vendor: rfq.vendors.join(", ") || "Assigned Vendors",
            status: 'No Quote Received',
            days,
            actionText: 'Request Quotation Nudge',
            whatsapp: () => this.dispatchWhatsAppNudge(rfq, 'rfq')
          });
        }
      }
    });

    // Get Confirmed POs
    const pos = store.state.purchaseOrders || [];
    pos.forEach(po => {
      if (po.status === "Sent" || !po.vendorConfirmed) {
        const days = this.getDaysDifference(po.createdAt, todayStr);
        if (days >= 2) {
          followups.push({
            type: 'PO',
            ref: po.poNumber,
            vendor: po.vendorName,
            status: 'Confirmation Pending',
            days,
            actionText: 'Request PO Confirm Nudge',
            whatsapp: () => this.dispatchWhatsAppNudge(po, 'po')
          });
        }
      }
    });

    if (followups.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          👍 No RFQs or POs awaiting follow-up today. All vendor pipelines active.
        </div>
      `;
    }

    return followups.map(f => `
      <div class="bg-primary/30 rounded border border-border-color/40 p-3.5 space-y-2 text-xs flex justify-between items-start gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-mono text-[9px] uppercase font-bold border border-amber-500/25">${f.type} Sent</span>
            <span class="font-bold text-white font-mono">${f.ref}</span>
          </div>
          <p class="text-secondary font-medium mt-1">Vendor: ${f.vendor}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-rose-400 font-bold">${f.status}</span>
            <span class="text-muted font-mono">• Pending ${f.days} Days</span>
          </div>
        </div>
        <button onclick="window.TodayPage.triggerNudgeCallback('${f.type}','${f.ref}')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1">
          <i data-lucide="phone" class="w-3.5 h-3.5"></i> Nudge
        </button>
      </div>
    `).join("");

    // Cache nudge callbacks
    window._nudgeMap = followups;
  },

  triggerNudgeCallback(type, ref) {
    const list = window._nudgeMap || [];
    const match = list.find(f => f.type === type && f.ref === ref);
    if (match) {
      match.whatsapp();
    }
  },

  dispatchWhatsAppNudge(item, type) {
    let text = "";
    let phone = "";

    if (type === 'rfq') {
      text = `*Premio Living — Quotation Reminder*\n\n` +
             `Hi, we sent you a Request for Quotation *${item.rfqNumber}* for *${item.category}* on ${window.Utils.formatDate(item.createdAt)}.\n\n` +
             `Please review and send us your quotation with unit rates, GST %, and extra charges as soon as possible.\n\n` +
             `Thank you.`;
      
      const vendorObj = window.AppStore.state.vendors.find(v => v.name === item.vendors[0]);
      phone = vendorObj ? vendorObj.phone.replace(/[^+\d]/g, '') : "";
    } else if (type === 'po') {
      text = `*Premio Living — PO Confirmation Reminder*\n\n` +
             `Hi, we sent you the Purchase Order *${item.poNumber}* on ${window.Utils.formatDate(item.createdAt)}.\n\n` +
             `Please verify specifications, confirm the order, and share the scheduled dispatch date.\n\n` +
             `Thank you.`;
      phone = item.vendorPhone ? item.vendorPhone.replace(/[^+\d]/g, '') : "";
    }

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  },

  renderPaymentActionsHTML(todayStr) {
    const payouts = window.AppStore.state.payouts || [];
    let list = [];

    payouts.forEach(p => {
      // Naveen Sir Approvals
      if (['Submitted', 'Awaiting Approval'].includes(p.status)) {
        list.push({
          payout: p,
          group: 'Awaiting Naveen Sir Approval',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        });
      }
      // Approved & Accounts
      if (['Approved', 'Sent To Accounts'].includes(p.status)) {
        list.push({
          payout: p,
          group: 'Approved & Pending Accounts',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        });
      }
      // Due Today
      if (p.targetDate === todayStr && !['Paid', 'Closed', 'Rejected'].includes(p.status)) {
        list.push({
          payout: p,
          group: 'Payment Due Today',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        });
      }
    });

    if (list.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          💳 No payouts awaiting approval or accounts clearance today.
        </div>
      `;
    }

    return list.map(item => `
      <div class="bg-primary/30 rounded border border-border-color/40 p-3 text-xs flex justify-between items-center gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${item.color} border">
              ${item.group}
            </span>
            <span class="text-muted font-mono font-medium">Ref: #${item.payout.id.slice(-4).toUpperCase()}</span>
          </div>
          <p class="font-bold text-white mt-1">${item.payout.vendorName}</p>
          <span class="text-[10px] text-secondary mt-0.5 block">${item.payout.projectName.split(" (")[0]} • Stage: ${item.payout.milestone}</span>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="font-bold text-amber-500 font-mono text-sm block">₹${Number(item.payout.amount).toLocaleString('en-IN')}</span>
          <button onclick="window.AppRouter.navigate('payouts'); setTimeout(() => window.PayoutsPage.viewDetails('${item.payout.id}'), 100);" 
            class="px-2 py-1 mt-1.5 bg-hover hover:bg-border-color border border-border-color/30 text-white rounded text-[10px] font-medium transition-all">
            Process
          </button>
        </div>
      </div>
    `).join("");
  },

  renderHighPrioritySnagsHTML(escalatedIssues) {
    if (escalatedIssues.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          🎉 No open high-priority snags. Site alignment correct!
        </div>
      `;
    }

    return escalatedIssues.map(item => `
      <div class="bg-red-950/10 rounded border border-red-500/20 p-3 text-xs flex justify-between items-start gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 font-mono text-[9px] uppercase font-bold border border-rose-500/30">HIGH</span>
            <span class="font-semibold text-white block">${item.project.name.split(" (")[0]} — ${item.snag.area}</span>
          </div>
          <p class="text-secondary font-medium mt-1 leading-normal">${item.snag.issue}</p>
          <span class="text-[10px] text-muted block mt-0.5">Assigned Vendor: <b>${item.snag.assignedTo}</b></span>
        </div>
        <div class="flex flex-col gap-1.5 flex-shrink-0 items-end">
          <button onclick="window.ProjectPage.editSnag('${item.project.id}', '${item.snag.id}')" class="px-2 py-1 bg-hover hover:bg-border-color border border-border-color/30 text-white text-[10px] font-semibold rounded">Edit</button>
          <button onclick="window.WhatsAppService.shareSnag('${item.project.id}', '${item.snag.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded flex items-center gap-0.5">
            <i data-lucide="phone" class="w-3 h-3"></i> Nudge
          </button>
        </div>
      </div>
    `).join("");
  },

  renderMaterialDeliveryTrackerHTML(scheduled, delayed) {
    if (scheduled.length === 0 && delayed.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          📦 No deliveries scheduled or overdue for today.
        </div>
      `;
    }

    let items = [];
    delayed.forEach(d => items.push({ ...d, group: 'Overdue Delivery', color: 'text-rose-500 bg-rose-500/10 border-rose-500/25' }));
    scheduled.forEach(s => items.push({ ...s, group: 'Expected Today', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25' }));

    return items.map(item => `
      <div class="bg-primary/30 rounded border border-border-color/40 p-3 text-xs flex justify-between items-center gap-3">
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${item.color} border">
              ${item.group}
            </span>
            <span class="font-mono text-muted text-[10px]">${item.delivery.date}</span>
          </div>
          <span class="font-bold text-white block mt-1">${item.delivery.item} (${item.delivery.qty})</span>
          <span class="text-[10px] text-secondary block">${item.project.name.split(" (")[0]} • Status: <b>${item.delivery.status}</b></span>
        </div>
        <button onclick="window.TodayPage.receiveDelivery('${item.project.id}', '${item.delivery.id}')" class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/30 text-white rounded text-[10px] font-bold flex-shrink-0 transition-all">
          Mark Received
        </button>
      </div>
    `).join("");
  },

  renderTodayActivitiesHTML(visits, installations) {
    if (visits.length === 0 && installations.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-border-color/20 rounded">
          📅 No active site installations or visits scheduled today.
        </div>
      `;
    }

    let list = [];
    visits.forEach(v => list.push({
      text: `Site Visit: <b>${v.visit.visitor}</b> for ${v.visit.purpose} (${v.visit.time})`,
      project: v.project,
      type: 'visit',
      id: v.visit.id
    }));
    installations.forEach(i => list.push({
      text: ` timeline Stage check: <b>${i.stage.name}</b> installation completion deadline`,
      project: i.project,
      type: 'timeline',
      id: i.stage.name
    }));

    return list.map((item, idx) => `
      <div class="flex items-start gap-3 py-2 border-b border-border-color/10 last:border-0 last:pb-0 text-xs">
        <input type="checkbox" id="site-chk-${idx}" class="accent-amber-500 w-4 h-4 mt-0.5 cursor-pointer" 
          onclick="setTimeout(() => { window.TodayPage.completeActivity('${item.type}', '${item.project.id}', '${item.id}'); }, 300)">
        <div class="flex-1 min-w-0">
          <label for="site-chk-${idx}" class="text-secondary leading-normal cursor-pointer hover:text-white block">
            ${item.text}
          </label>
          <span class="text-[9px] text-muted block mt-0.5 font-mono uppercase">${item.project.name.split(" (")[0]}</span>
        </div>
      </div>
    `).join("");
  },

  async completeActivity(type, projectId, itemId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;

    if (type === 'visit') {
      proj.visits = proj.visits.filter(v => v.id !== itemId);
      await window.dbService.saveProject(proj);
      window.ModalComponent.showToast("Site visit log updated / archived.");
    } else if (type === 'timeline') {
      const stage = proj.stages.find(s => s.name === itemId);
      if (stage) {
        stage.progress = 100;
        stage.status = "Completed";
        await window.dbService.saveProject(proj);
        window.ModalComponent.showToast(`Timeline Stage ${itemId} marked Completed!`);
      }
    }
    window.AppRouter.refresh();
  },

  renderOverduePanelHTML(overdueSnags, delayedDeliveries, approvals, payouts, stages) {
    let overdueItems = [];

    stages.forEach(st => overdueItems.push({
      text: `Milestone Overdue: <b>${st.stage.name}</b> (${st.project.name.split(" (")[0]})`,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      clickAction: `window.openModal('edit-stage-modal', { projectId: '${st.project.id}', stage: ${JSON.stringify(st.stage).replace(/"/g, '&quot;')} })`
    }));
    
    overdueSnags.forEach(sn => overdueItems.push({
      text: `Overdue Snag: <b>${sn.snag.area}</b> — ${sn.snag.issue}`,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      clickAction: `window.openModal('add-snag-modal', { projectId: '${sn.project.id}', snag: ${JSON.stringify(sn.snag).replace(/"/g, '&quot;')}, isEdit: true })`
    }));
    
    delayedDeliveries.forEach(del => overdueItems.push({
      text: `Overdue Delivery: <b>${del.delivery.item}</b> from vendor`,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      clickAction: `window.openModal('add-delivery-modal', { projectId: '${del.project.id}', delivery: ${JSON.stringify(del.delivery).replace(/"/g, '&quot;')}, isEdit: true })`
    }));
    
    // Approvals matching projects before context date
    approvals.forEach(app => {
      overdueItems.push({
        text: `Approvals lag: Client pending <b>${app.material.name}</b>`,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      });
    });

    // Payout target release date past
    payouts.forEach(pay => {
      const todayStr = "2026-05-29";
      if (pay.targetDate && pay.targetDate < todayStr && !['Paid', 'Closed', 'Rejected'].includes(pay.status)) {
        overdueItems.push({
          text: `Overdue Payout Release: ₹<b>${pay.amount.toLocaleString('en-IN')}</b> for ${pay.vendorName}`,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        });
      }
    });

    if (overdueItems.length === 0) {
      return `
        <div class="text-center text-muted py-6 text-xs border border-dashed border-rose-500/10 rounded">
          🎉 No overdue items logged. Timelines fully coordinated!
        </div>
      `;
    }

    return overdueItems.map(item => `
      <div onclick="${item.clickAction || ''}" class="bg-rose-950/5 rounded border border-rose-500/15 p-3 text-xs flex items-center justify-between gap-3 ${item.clickAction ? 'cursor-pointer hover:bg-hover/20 hover:border-amber-500/30' : ''} transition-all">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 ${item.clickAction ? 'animate-ping' : ''}"></span>
          <span class="text-secondary leading-normal">${item.text}</span>
        </div>
        <span class="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${item.color} border flex-shrink-0">Overdue</span>
      </div>
    `).join("");
  },

  // Helper date utility
  getDaysDifference(date1Str, date2Str) {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    if (isNaN(d1) || isNaN(d2)) return 0;
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Action methods linked to view triggers
  async approveMaterial(projId, matId) {
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const mat = proj.materials.find(m => m.id === matId);
    if (!mat) return;
    
    mat.approved = "Approved";
    if (!mat.approvalLog) mat.approvalLog = [];
    mat.approvalLog.push({
      user: `${store.activeRole.toUpperCase()} (OTP Verified)`,
      action: "Approved",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${mat.name} has been Approved!`);
    window.AppRouter.refresh();
  },

  async closeSnag(projId, snagId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const snag = proj.snags.find(s => s.id === snagId);
    if (!snag) return;
    
    snag.status = "Closed";
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Snag resolved!`);
    window.AppRouter.refresh();
  },

  async receiveDelivery(projId, delId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const del = proj.deliveries.find(d => d.id === delId);
    if (!del) return;
    
    del.status = "Delivered";
    
    // Also try to match a material
    const matchedMaterial = proj.materials.find(m => m.name.toLowerCase().includes(del.item.toLowerCase().split(" ")[0]));
    if (matchedMaterial) {
      matchedMaterial.delivered = true;
    }
    
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${del.item} logged as received!`);
    window.AppRouter.refresh();
  },

  addNewAction(e) {
    e.preventDefault();
    const text = document.getElementById("new-action-text").value;
    const type = document.getElementById("new-action-type").value;
    if (!text) return;
    const newAction = {
      id: "ta-" + Date.now(),
      text,
      type,
      completed: false,
      priority: "Medium"
    };
    if (!window.AppStore.state.todaysActions) window.AppStore.state.todaysActions = [];
    window.AppStore.state.todaysActions.push(newAction);
    window.AppStore.saveState();
    window.AppRouter.refresh();
  },

  async addNewDependency(e) {
    e.preventDefault();
    const projId = document.getElementById("new-dep-project").value;
    const desc = document.getElementById("new-dep-desc").value;
    const blockedBy = document.getElementById("new-dep-blocked").value;
    const owner = document.getElementById("new-dep-owner").value;
    const targetDate = document.getElementById("new-dep-date").value;
    
    if (!projId || !desc || !owner || !targetDate) return;
    
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (proj) {
      if (!proj.dependencies) proj.dependencies = [];
      const newDep = {
        id: "dep-" + Date.now(),
        type: "Activity",
        description: desc,
        blockedBy,
        owner,
        targetDate,
        status: "Waiting",
        daysDelayed: 0
      };
      proj.dependencies.push(newDep);
      window.AppStore.saveState();
      await window.dbService.saveProject(proj);
      window.ModalComponent.showToast(`Dependency "${desc}" added successfully!`);
      window.AppRouter.refresh();
    }
  },

  setActiveGroup(name) {
    window.TodayPage.activeGroup = name;
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
