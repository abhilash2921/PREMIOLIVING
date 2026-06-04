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

    // ────────────────────────────────────────────────────────
    // 1. DATA AGGREGATION & FILTERING
    // ────────────────────────────────────────────────────────
    
    // High Priority, Follow-ups, and Scheduled
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

    // Main loops over projects
    store.state.projects.forEach(p => {
      // Role access validation
      if (role === "vendor") {
        const isAssigned = p.materials.some(m => m.vendor === "Wood Crafts");
        if (!isAssigned) return;
      }
      if (role === "client" && p.id !== "project-1") {
        return;
      }

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
          // If project already started, count as high priority pending client approval
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
      // Sent RFQs without complete bids
      if (r.status === "Sent" || r.status === "Quote Received") {
        const bidsCount = r.quotes?.length || 0;
        if (bidsCount === 0) {
          rfqsAwaitingQuotes.push(r);
        }
      }
    });

    const pos = store.state.purchaseOrders || [];
    pos.forEach(po => {
      // PO sent but not confirmed
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

    // ────────────────────────────────────────────────────────
    // 2. MAIN LAYOUT STRUCTURE RENDER
    // ────────────────────────────────────────────────────────
    
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- 2.1 TITLE BANNER & QUICK ACTIONS -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-5">
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

        <!-- 2.2 QUICK ACTION BUTTONS -->
        <div class="card p-4 border-border-color bg-card">
          <span class="text-[9px] text-muted uppercase font-bold tracking-wider block mb-2.5">Quick Actions Shortcuts</span>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.AppRouter.navigate('rfqs'); setTimeout(() => window.RFQPage.openCreateView(), 50);" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="file-question" class="w-3.5 h-3.5 text-amber-500"></i> Create RFQ
            </button>
            <button onclick="window.AppRouter.navigate('pos'); setTimeout(() => window.POPage.openCreateModal(), 50);" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="clipboard-signature" class="w-3.5 h-3.5 text-blue-400"></i> Create PO
            </button>
            <button onclick="window.AppRouter.navigate('payouts'); setTimeout(() => window.PayoutsPage.openCreateModal(), 50);" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="wallet" class="w-3.5 h-3.5 text-emerald-400"></i> Raise Payment
            </button>
            <button onclick="openModal('add-update-modal')" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-cyan-400"></i> Log Site Update
            </button>
            <button onclick="openModal('add-snag-modal')" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="alert-octagon" class="w-3.5 h-3.5 text-rose-500"></i> Add Snag
            </button>
            <button onclick="openModal('add-delivery-modal')" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="package" class="w-3.5 h-3.5 text-purple-400"></i> Add Delivery
            </button>
            <button onclick="openModal('add-visit-modal')" 
              class="px-3 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[11px] font-semibold text-white flex items-center gap-1 transition-all">
              <i data-lucide="user-check" class="w-3.5 h-3.5 text-teal-400"></i> Schedule Visit
            </button>
          </div>
        </div>

        <!-- 2.3 TODAY'S PRIORITIES SECTION -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- RED: High Priority -->
          <div class="card p-4 border-l-4 border-rose-500 bg-rose-950/5">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">High Priority</h3>
            </div>
            <div class="space-y-2 text-xs">
              ${this.renderPriorityItemsHTML([
                ...overdueSnags.map(o => `⚠️ Overdue Snag: ${o.snag.area} — ${o.snag.issue}`),
                ...delayedDeliveries.map(d => `🚚 Delayed Delivery: ${d.delivery.item} from ${d.project.name.split(" (")[0]}`),
                ...pendingClientApprovals.map(c => `✍️ Approvals: Client review for ${c.material.name}`),
                ...pendingPaymentReleases.map(p => `💰 Payment Release: ₹${p.amount.toLocaleString('en-IN')} for ${p.vendorName}`),
                ...escalatedIssues.map(e => `🚨 Escalated Snag: ${e.snag.issue}`)
              ], "No high priority items today")}
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

          <!-- GREEN: Scheduled Today -->
          <div class="card p-4 border-l-4 border-emerald-500 bg-emerald-950/5">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Scheduled Today</h3>
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

        <!-- 2.4 MY PENDING ACTIONS CHECKLIST -->
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

        <!-- 2.5 TWO-COLUMN ACTION MODULES -->
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

    stages.forEach(st => overdueItems.push({ text: `Milestone Overdue: <b>${st.stage.name}</b> (${st.project.name.split(" (")[0]})`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }));
    overdueSnags.forEach(sn => overdueItems.push({ text: `Overdue Snag: <b>${sn.snag.area}</b> — ${sn.snag.issue}`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }));
    delayedDeliveries.forEach(del => overdueItems.push({ text: `Overdue Delivery: <b>${del.delivery.item}</b> from vendor`, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }));
    
    // Approvals matching projects before context date
    approvals.forEach(app => {
      overdueItems.push({ text: `Approvals lag: Client pending <b>${app.material.name}</b>`, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' });
    });

    // Payout target release date past
    payouts.forEach(pay => {
      const todayStr = "2026-05-29";
      if (pay.targetDate && pay.targetDate < todayStr && !['Paid', 'Closed', 'Rejected'].includes(pay.status)) {
        overdueItems.push({ text: `Overdue Payout Release: ₹<b>${pay.amount.toLocaleString('en-IN')}</b> for ${pay.vendorName}`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' });
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
      <div class="bg-rose-950/5 rounded border border-rose-500/15 p-3 text-xs flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-ping"></span>
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
  }
};
