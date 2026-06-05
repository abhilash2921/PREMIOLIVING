/* js/pages/payouts.js - Premio Living OS Payout Center */

window.PayoutsPage = {
  render(container) {
    const store = window.AppStore;
    const role = store.activeRole;
    
    // Make sure state.payouts exists
    if (!store.state.payouts) {
      store.state.payouts = [];
    }

    // Get search query and status filter from DOM if already rendered, or default
    const searchVal = document.getElementById("payout-search")?.value || "";
    const filterStatus = document.getElementById("payout-status-filter")?.value || "ALL";

    // Perform calculations
    const stats = this.calculateStats();
    const contractorSummaries = this.getContractorSummaries();
    const filteredPayouts = this.getFilteredPayouts(searchVal, filterStatus);

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Top Title Bar -->
        <div class="flex items-center justify-between border-b border-border-color pb-5">
          <div>
            <h1 class="text-lg font-bold tracking-tight text-white font-display">Payout Center</h1>
            <p class="text-xs text-secondary mt-1">Track construction milestones, process contractor payments, and handle Accounts Team payouts.</p>
          </div>
          <button onclick="window.PayoutsPage.openCreateModal()" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1.5 shadow-md">
            <i data-lucide="plus" class="w-4 h-4"></i> Raise Payment Request
          </button>
        </div>

        <!-- 1. DASHBOARD STATS -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div class="card p-4 flex flex-col justify-between border-border-color bg-card">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider">Total Pending</span>
            <div class="mt-2">
              <span class="text-lg font-bold text-white font-mono">₹${Number(stats.totalPending).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="card p-4 flex flex-col justify-between border-border-color bg-card">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider">Total Approved</span>
            <div class="mt-2">
              <span class="text-lg font-bold text-amber-500 font-mono">₹${Number(stats.totalApproved).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="card p-4 flex flex-col justify-between border-border-color bg-card">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider">Total Released</span>
            <div class="mt-2">
              <span class="text-lg font-bold text-emerald-500 font-mono">₹${Number(stats.totalReleased).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="card p-4 flex flex-col justify-between border-border-color bg-card">
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider">Upcoming (7d)</span>
            <div class="mt-2">
              <span class="text-lg font-bold text-blue-400 font-mono">₹${Number(stats.upcoming).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="card p-4 flex flex-col justify-between border-border-color bg-card col-span-2 md:col-span-1">
            <span class="text-[9px] text-rose-400 uppercase font-bold tracking-wider">Overdue Payments</span>
            <div class="mt-2">
              <span class="text-lg font-bold text-rose-500 font-mono">₹${Number(stats.overdue).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- 2. CONTRACTOR SUMMARY TABLE -->
        <div class="card border-border-color bg-card overflow-hidden">
          <div class="p-4 border-b border-border-color/60 bg-primary/20 flex justify-between items-center">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="users" class="w-4 h-4 text-amber-500"></i> Contractor / Vendor Payout Summary
            </h3>
            <span class="text-[9px] text-muted font-mono">Double-click Contract Value to edit</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color/60 text-[9px] text-secondary uppercase font-bold tracking-wider font-mono bg-primary/10">
                  <th class="px-4 py-3">Contractor / Vendor</th>
                  <th class="px-4 py-3">Contract Value</th>
                  <th class="px-4 py-3">Amount Paid</th>
                  <th class="px-4 py-3">Pending Request</th>
                  <th class="px-4 py-3">Balance Amount</th>
                  <th class="px-4 py-3">Paid %</th>
                  <th class="px-4 py-3">Current Milestone</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-color/20 text-xs">
                ${contractorSummaries.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-muted text-xs">No active contractor contracts recorded. Raised payment requests will list here.</td>
                  </tr>
                ` : contractorSummaries.map(c => `
                  <tr class="hover:bg-hover/20 transition-colors">
                    <td class="px-4 py-3 font-semibold text-white">${c.name}</td>
                    <td class="px-4 py-3 font-mono">
                      <div class="flex items-center gap-1">
                        <span>₹</span>
                        <input type="number" value="${c.contractValue}" 
                          onblur="window.PayoutsPage.updateContractValue('${c.name}', this.value)" 
                          class="w-24 bg-transparent border-b border-transparent hover:border-border-color focus:border-amber-500 focus:outline-none font-mono text-white font-bold p-0.5" />
                      </div>
                    </td>
                    <td class="px-4 py-3 text-emerald-400 font-mono font-medium">₹${Number(c.amountReleased).toLocaleString('en-IN')}</td>
                    <td class="px-4 py-3 text-amber-500 font-mono">₹${Number(c.pendingAmount).toLocaleString('en-IN')}</td>
                    <td class="px-4 py-3 text-secondary font-mono">₹${Number(c.balanceAmount).toLocaleString('en-IN')}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-16 bg-primary rounded-full h-1.5 overflow-hidden border border-border-color/40">
                          <div class="bg-emerald-500 h-1.5" style="width: ${Math.min(c.paidPercent, 100)}%"></div>
                        </div>
                        <span class="font-mono text-[10px] font-bold text-white">${c.paidPercent.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-muted italic text-[11px] truncate max-w-[120px]">${c.currentMilestone}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. MAIN PAYMENT REQUESTS HISTORY -->
        <div class="space-y-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 class="text-sm font-bold text-white font-display">Payment Request Timeline & Logs</h3>
            
            <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <!-- Search -->
              <div class="relative flex-1 md:flex-initial">
                <i data-lucide="search" class="w-3.5 h-3.5 text-muted absolute left-2.5 top-2"></i>
                <input type="text" id="payout-search" value="${searchVal}" 
                  oninput="window.PayoutsPage.refreshList()" 
                  placeholder="Search contractor, project, stage..." 
                  class="w-full md:w-60 pl-8 pr-3 py-1.5 bg-secondary text-xs rounded border border-border-color focus:outline-none">
              </div>

              <!-- Filter -->
              <select id="payout-status-filter" onchange="window.PayoutsPage.refreshList()" 
                class="bg-secondary text-xs rounded border border-border-color p-1.5 text-white focus:outline-none">
                <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="Draft" ${filterStatus === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Submitted" ${filterStatus === 'Submitted' ? 'selected' : ''}>Submitted</option>
                <option value="Awaiting Approval" ${filterStatus === 'Awaiting Approval' ? 'selected' : ''}>Awaiting Approval</option>
                <option value="Approved" ${filterStatus === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Rejected" ${filterStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Sent To Accounts" ${filterStatus === 'Sent To Accounts' ? 'selected' : ''}>Sent To Accounts</option>
                <option value="Paid" ${filterStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Closed" ${filterStatus === 'Closed' ? 'selected' : ''}>Closed</option>
              </select>
            </div>
          </div>

          <!-- Requests Grid / Table -->
          <div class="grid grid-cols-1 gap-3.5">
            ${filteredPayouts.length === 0 ? `
              <div class="card p-8 text-center text-muted text-xs border border-dashed border-border-color">
                No matching payment requests found. Click "Raise Payment Request" to create a new one.
              </div>
            ` : filteredPayouts.map(p => {
              const cleanProjectName = p.projectName.split(" (")[0];
              const totalReleased = this.calculateVendorReleasedTotal(p.vendorName);
              const targetDateFormatted = p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A';
              const isOverdue = p.targetDate && new Date(p.targetDate) < new Date() && !['Paid', 'Closed', 'Rejected'].includes(p.status);

              return `
                <div class="card p-5 border-border-color bg-card hover:border-amber-500/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div class="space-y-2.5 flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-bold ${this.getStatusBadgeClass(p.status)} border">
                        ${p.status}
                      </span>
                      <span class="text-xs text-muted font-mono">Ref: #${p.id.slice(-6).toUpperCase()}</span>
                      ${isOverdue ? `<span class="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] uppercase font-bold border border-rose-500/20">Overdue</span>` : ''}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-6">
                      <div>
                        <span class="text-[9px] text-muted block uppercase">Project & Category</span>
                        <span class="font-semibold text-white text-xs truncate block">${cleanProjectName}</span>
                        <span class="text-[10px] text-secondary mt-0.5 block">${p.category}</span>
                      </div>
                      
                      <div>
                        <span class="text-[9px] text-muted block uppercase">Contractor / Vendor</span>
                        <span class="font-semibold text-white text-xs block">${p.vendorName}</span>
                        <span class="text-[10px] text-secondary mt-0.5 block">Milestone: ${p.milestone}</span>
                      </div>

                      <div>
                        <span class="text-[9px] text-muted block uppercase">Requested Amount & Target Date</span>
                        <span class="font-bold text-amber-500 font-mono text-sm block">₹${Number(p.amount).toLocaleString('en-IN')}</span>
                        <span class="text-[10px] text-secondary mt-0.5 block">Target Date: ${targetDateFormatted}</span>
                      </div>

                      <div>
                        <span class="text-[9px] text-muted block uppercase">Approval Status</span>
                        ${p.approvedBy ? `
                          <span class="font-semibold text-emerald-400 text-xs block">Approved by ${p.approvedBy}</span>
                          ${p.approvalComments ? `<span class="text-[10px] text-secondary mt-0.5 block italic truncate max-w-[150px]" title="${p.approvalComments}">"${p.approvalComments}"</span>` : ''}
                        ` : `
                          <span class="font-semibold text-zinc-500 text-[11px] block italic">Awaiting Approval</span>
                        `}
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-2 flex-wrap flex-shrink-0 w-full md:w-auto border-t border-border-color/20 md:border-t-0 pt-3.5 md:pt-0">
                    <button onclick="window.PayoutsPage.viewDetails('${p.id}')" class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/40 text-white rounded text-[11px] font-medium flex items-center gap-1">
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i> Details & Action
                    </button>
                    <button onclick="window.PayoutsPage.printReceipt('${p.id}')" class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/40 text-white rounded text-[11px] font-medium flex items-center gap-1" title="Print release confirm sheet">
                      <i data-lucide="printer" class="w-3.5 h-3.5"></i> PDF
                    </button>
                    
                    <!-- WhatsApp dropdown trigger -->
                    <div class="relative inline-block text-left">
                      <button onclick="window.PayoutsPage.toggleWhatsAppDropdown('${p.id}')" class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/40 text-emerald-400 hover:text-emerald-500 rounded text-[11px] font-medium flex items-center gap-1">
                        <i data-lucide="phone" class="w-3.5 h-3.5"></i> Share
                      </button>
                      <div id="wa-dropdown-${p.id}" class="hidden absolute right-0 mt-1 w-40 bg-secondary border border-border-color rounded shadow-2xl z-20 py-1 font-sans">
                        <button onclick="window.PayoutsPage.shareWhatsApp('${p.id}', 'contractor')" class="w-full text-left px-3 py-1.5 text-[11px] hover:bg-hover text-white flex items-center gap-1.5">
                          <i data-lucide="hard-hat" class="w-3.5 h-3.5 text-muted"></i> Contractor
                        </button>
                        <button onclick="window.PayoutsPage.shareWhatsApp('${p.id}', 'vendor')" class="w-full text-left px-3 py-1.5 text-[11px] hover:bg-hover text-white flex items-center gap-1.5">
                          <i data-lucide="wrench" class="w-3.5 h-3.5 text-muted"></i> Vendor
                        </button>
                        <button onclick="window.PayoutsPage.shareWhatsApp('${p.id}', 'accounts')" class="w-full text-left px-3 py-1.5 text-[11px] hover:bg-hover text-white flex items-center gap-1.5">
                          <i data-lucide="credit-card" class="w-3.5 h-3.5 text-muted"></i> Accounts Team
                        </button>
                        <button onclick="window.PayoutsPage.shareWhatsApp('${p.id}', 'management')" class="w-full text-left px-3 py-1.5 text-[11px] hover:bg-hover text-white flex items-center gap-1.5">
                          <i data-lucide="briefcase" class="w-3.5 h-3.5 text-muted"></i> Management
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // Calculate high-level totals
  calculateStats() {
    const payouts = window.AppStore.state.payouts || [];
    let totalPending = 0;
    let totalApproved = 0;
    let totalReleased = 0;
    let upcoming = 0;
    let overdue = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    payouts.forEach(p => {
      const amt = Number(p.amount) || 0;
      if (['Submitted', 'Awaiting Approval', 'Approved', 'Sent To Accounts'].includes(p.status)) {
        totalPending += amt;
      }
      if (p.status === 'Approved') {
        totalApproved += amt;
      }
      if (['Paid', 'Closed'].includes(p.status)) {
        totalReleased += amt;
      }

      // Check upcoming / overdue if targetDate exists and request is pending
      if (p.targetDate && !['Paid', 'Closed', 'Rejected'].includes(p.status)) {
        if (p.targetDate < todayStr) {
          overdue += amt;
        } else if (p.targetDate <= sevenDaysLater) {
          upcoming += amt;
        }
      }
    });

    return { totalPending, totalApproved, totalReleased, upcoming, overdue };
  },

  // Compute Contractor summaries and inline values
  getContractorSummaries() {
    const store = window.AppStore;
    const payouts = store.state.payouts || [];
    
    // Read contract values from localStorage
    const savedValues = JSON.parse(localStorage.getItem("premio_contractor_values") || "{}");

    // Gather unique contractor names
    const namesSet = new Set();
    store.state.vendors.forEach(v => namesSet.add(v.name));
    payouts.forEach(p => namesSet.add(p.vendorName));

    const summaries = Array.from(namesSet).map(name => {
      // Find contract value or fallback
      const contractValue = savedValues[name] || 0;

      // Filter payouts for this contractor
      const vendorPayouts = payouts.filter(p => p.vendorName === name);
      
      let amountReleased = 0;
      let pendingAmount = 0;
      let currentMilestone = "N/A";
      let latestDate = "";

      vendorPayouts.forEach(p => {
        const amt = Number(p.amount) || 0;
        if (['Paid', 'Closed'].includes(p.status)) {
          amountReleased += amt;
        } else if (p.status !== 'Rejected') {
          pendingAmount += amt;
        }

        // track latest milestone name
        const pDate = p.updatedAt || p.createdAt || "";
        if (pDate > latestDate) {
          latestDate = pDate;
          currentMilestone = p.milestone;
        }
      });

      const balanceAmount = Math.max(contractValue - amountReleased, 0);
      const paidPercent = contractValue > 0 ? (amountReleased / contractValue) * 100 : 0;

      return {
        name,
        contractValue,
        amountReleased,
        pendingAmount,
        balanceAmount,
        paidPercent,
        currentMilestone
      };
    });

    // Sort to show contractors with active payouts first
    return summaries.sort((a,b) => (b.amountReleased + b.pendingAmount) - (a.amountReleased + a.pendingAmount));
  },

  calculateVendorSummary(name) {
    const summaries = this.getContractorSummaries();
    return summaries.find(s => s.name === name) || { contractValue: 0, amountReleased: 0, pendingAmount: 0, balanceAmount: 0, paidPercent: 0, released: 0, balance: 0 };
  },

  calculateVendorReleasedTotal(name) {
    const payouts = window.AppStore.state.payouts || [];
    return payouts
      .filter(p => p.vendorName === name && ['Paid', 'Closed'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  },

  getFilteredPayouts(searchQuery, statusFilter) {
    const payouts = window.AppStore.state.payouts || [];
    const q = searchQuery.toLowerCase().trim();

    return payouts.filter(p => {
      // Status filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) {
        return false;
      }

      // Search match
      if (q) {
        const vendorMatch = p.vendorName.toLowerCase().includes(q);
        const projectMatch = p.projectName.toLowerCase().includes(q);
        const stageMatch = p.milestone.toLowerCase().includes(q);
        const categoryMatch = p.category.toLowerCase().includes(q);
        return vendorMatch || projectMatch || stageMatch || categoryMatch;
      }

      return true;
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  },

  getStatusBadgeClass(status) {
    const classes = {
      'Draft': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      'Submitted': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Awaiting Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      'Sent To Accounts': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Paid': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      'Closed': 'bg-zinc-600/10 text-zinc-500 border-zinc-600/20'
    };
    return classes[status] || 'bg-zinc-800 text-muted border-zinc-700';
  },

  refreshList() {
    const container = document.getElementById("main-content-container");
    this.render(container);
  },

  // Update Contract value saved in settings
  updateContractValue(vendorName, value) {
    const savedValues = JSON.parse(localStorage.getItem("premio_contractor_values") || "{}");
    savedValues[vendorName] = Number(value) || 0;
    localStorage.setItem("premio_contractor_values", JSON.stringify(savedValues));
    window.ModalComponent.showToast(`Updated contract value for ${vendorName}`);
    this.refreshList();
  },

  toggleWhatsAppDropdown(payoutId) {
    const dropdown = document.getElementById(`wa-dropdown-${payoutId}`);
    if (!dropdown) return;
    
    // Close other dropdowns
    document.querySelectorAll('[id^="wa-dropdown-"]').forEach(el => {
      if (el.id !== `wa-dropdown-${payoutId}`) el.classList.add("hidden");
    });

    dropdown.classList.toggle("hidden");
  },

  // PDF Confirm Sheet generator using popup-safe Blob url redirection
  printReceipt(payoutId) {
    const payout = window.AppStore.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    const cleanProjectName = payout.projectName.split(" (")[0];
    const summaries = this.getContractorSummaries();
    const vendorSum = summaries.find(s => s.name === payout.vendorName) || { amountReleased: 0, balanceAmount: 0 };
    const dateFormatted = new Date(payout.updatedAt || payout.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Release Confirmation - ${payout.vendorName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; margin: 0; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
          .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: bold; color: #d97706; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
          .details { margin-bottom: 20px; line-height: 1.6; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; }
          .row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; padding: 14px 0; color: #0f172a; margin-top: 10px; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; font-family: monospace; }
          .footer { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">Premio Living</div>
            <div class="title">Payment Release Confirmation</div>
          </div>
          <div class="details">
            <div class="row">
              <span class="label">Project</span>
              <span class="value">${cleanProjectName}</span>
            </div>
            <div class="row">
              <span class="label">Vendor / Contractor</span>
              <span class="value">${payout.vendorName}</span>
            </div>
            <div class="row">
              <span class="label">Work Category</span>
              <span class="value">${payout.category}</span>
            </div>
            <div class="row">
              <span class="label">Milestone</span>
              <span class="value">${payout.milestone}</span>
            </div>
            <div class="row total">
              <span class="label">Amount Released</span>
              <span class="value">₹${Number(payout.amount).toLocaleString('en-IN')}</span>
            </div>
            <div class="row">
              <span class="label">Total Released Till Date</span>
              <span class="value">₹${Number(vendorSum.amountReleased).toLocaleString('en-IN')}</span>
            </div>
            <div class="row">
              <span class="label">Pending Balance</span>
              <span class="value">₹${Number(vendorSum.balanceAmount).toLocaleString('en-IN')}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date</span>
              <span class="value">${dateFormatted}</span>
            </div>
            ${payout.refNumber ? `
            <div class="row">
              <span class="label">Reference / UTR</span>
              <span class="value">${payout.refNumber}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            This confirmation statement is computer-generated. Thank you.
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  // WhatsApp template router & dispatcher
  shareWhatsApp(payoutId, roleTarget) {
    const payout = window.AppStore.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    // Close WhatsApp dropdown
    document.getElementById(`wa-dropdown-${payoutId}`)?.classList.add("hidden");

    const cleanProjectName = payout.projectName.split(" (")[0];
    const summaries = this.getContractorSummaries();
    const vendorSum = summaries.find(s => s.name === payout.vendorName) || { amountReleased: 0, balanceAmount: 0 };
    
    let text = "";

    if (roleTarget === "contractor" || roleTarget === "vendor") {
      // Remove project site details for client privacy
      text = `*Premio Living*\n\n` +
             `*Payment Released*\n\n` +
             `*Project:*\n${cleanProjectName}\n\n` +
             `*Milestone:*\n${payout.milestone}\n\n` +
             `*Amount Released:*\n₹${Number(payout.amount).toLocaleString('en-IN')}\n\n` +
             `*Total Paid Till Date:*\n₹${Number(vendorSum.amountReleased).toLocaleString('en-IN')}\n\n` +
             `*Balance Pending:*\n₹${Number(vendorSum.balanceAmount).toLocaleString('en-IN')}\n\n` +
             `Thank You.`;
    } else if (roleTarget === "accounts") {
      text = `*Premio Living — Accounts Coordination*\n\n` +
             `*Payment Request Cleared*\n\n` +
             `• *Project:* ${cleanProjectName}\n` +
             `• *Contractor:* ${payout.vendorName}\n` +
             `• *Category:* ${payout.category}\n` +
             `• *Milestone:* ${payout.milestone}\n` +
             `• *Amount Released:* ₹${Number(payout.amount).toLocaleString('en-IN')}\n` +
             `• *Approved By:* ${payout.approvedBy || 'Naveen Sir'}\n` +
             `• *Release Ref/UTR:* ${payout.refNumber || 'N/A'}\n\n` +
             `Status: RELEASED. Please update logs.`;
    } else if (roleTarget === "management") {
      text = `*Premio Living — Payout Update*\n\n` +
             `• *Project:* ${cleanProjectName}\n` +
             `• *Vendor/Contractor:* ${payout.vendorName}\n` +
             `• *Category:* ${payout.category}\n` +
             `• *Milestone:* ${payout.milestone}\n` +
             `• *Amount:* ₹${Number(payout.amount).toLocaleString('en-IN')}\n` +
             `• *Workflow Status:* ${payout.status}\n` +
             `• *Approver Details:* ${payout.approvedBy || 'Pending Approval'}\n` +
             `• *Approval Comments:* ${payout.approvalComments || 'None'}`;
    }

    const encodedText = encodeURIComponent(text);
    // Find phone link if available
    const vendorObj = window.AppStore.state.vendors.find(v => v.name === payout.vendorName);
    const phoneNum = vendorObj ? vendorObj.phone.replace(/[^+\d]/g, '') : "";

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodedText}`;
    window.open(waUrl, "_blank");
  },

  // Dynamic Dialog creator for Request Form
  openCreateModal(prefillProjectId = null) {
    const store = window.AppStore;
    const projects = store.state.projects;
    const vendors = store.state.vendors;
    const targetProjId = prefillProjectId || store.activeProjectId || "";

    // Load custom categories saved
    const customCats = JSON.parse(localStorage.getItem("premio_custom_categories") || "[]");
    const standardCategories = [
      "Carpentry", "Painting", "Electrical", "Plumbing", 
      "False Ceiling", "Civil", "Glass", "Stone", "Hardware", "Cleaning"
    ];
    const allCategories = [...standardCategories, ...customCats];

    // Create Modal Element
    const modal = document.createElement("div");
    modal.id = "raise-payout-modal";
    modal.className = "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in";
    
    modal.innerHTML = `
      <div class="bg-secondary border border-border-color w-full max-w-lg rounded-lg overflow-hidden flex flex-col shadow-2xl animate-scale-in max-h-[90vh]">
        <div class="p-4 border-b border-border-color flex justify-between items-center bg-primary">
          <h3 class="text-sm font-semibold font-display text-white">Raise Payment Request</h3>
          <button onclick="document.getElementById('raise-payout-modal').remove()" class="text-secondary hover:text-white transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        
        <form id="raise-payout-form" class="p-5 space-y-4 overflow-y-auto">
          <!-- Project Link -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Select Project</label>
            <select id="payout-form-project" required class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
              <option value="">-- Choose Project --</option>
              ${projects.map(p => `<option value="${p.id}" ${targetProjId === p.id ? 'selected' : ''}>${p.name}</option>`).join("")}
            </select>
          </div>

          <!-- Vendor / Contractor Selection -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Contractor / Vendor</label>
            <div class="flex gap-2">
              <select id="payout-form-vendor-select" class="w-1/2 text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none" onchange="window.PayoutsPage.onFormVendorSelect(this.value)">
                <option value="">-- Select Existing --</option>
                ${vendors.map(v => `<option value="${v.name}">${v.name} (${v.category})</option>`).join("")}
                <option value="CUSTOM">-- Custom Vendor --</option>
              </select>
              <input type="text" id="payout-form-vendor-input" placeholder="Or enter new vendor name" class="w-1/2 text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
            </div>
          </div>

          <!-- Work Category -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Work Category</label>
            <select id="payout-form-category" required class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none" onchange="window.PayoutsPage.onFormCategorySelect(this.value)">
              <option value="">-- Choose Category --</option>
              ${allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
              <option value="OTHER">OTHER (Define custom category)</option>
            </select>
            <input type="text" id="payout-form-custom-category" placeholder="Enter custom category name" class="hidden w-full text-xs p-2 mt-2 rounded border border-border-color bg-primary text-white focus:outline-none">
          </div>

          <!-- Milestone selector & template tools -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-[10px] text-muted uppercase font-semibold">Payment Stage (Milestone)</label>
              <button type="button" onclick="window.PayoutsPage.openCustomMilestoneCreator()" class="text-[9px] text-amber-500 hover:underline">
                Create Milestone Template
              </button>
            </div>
            <select id="payout-form-milestone-select" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none" onchange="document.getElementById('payout-form-milestone-input').value = this.value">
              <option value="">-- Select Milestone --</option>
            </select>
            <input type="text" id="payout-form-milestone-input" placeholder="Or enter payment stage detail" required class="w-full text-xs p-2 mt-2 rounded border border-border-color bg-primary text-white focus:outline-none">
          </div>

          <!-- Requested Amount & Target Date -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Requested Amount (₹)</label>
              <input type="number" id="payout-form-amount" required placeholder="Amount in INR" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
            </div>
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Target Release Date</label>
              <input type="text" id="payout-form-target-date" required placeholder="DD-MM-YYYY" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Notes</label>
            <textarea id="payout-form-notes" rows="2" placeholder="Provide extra context, references, or details..." class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none resize-none"></textarea>
          </div>

          <!-- Supporting Document Checkbox checklist -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1.5">Supporting Checklist Checkboxes</label>
            <div class="grid grid-cols-2 gap-2 text-xs text-secondary border border-border-color/40 rounded p-3 bg-primary/20">
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-site-photos" class="accent-amber-500"> Site Photos
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-completion-photos" class="accent-amber-500"> Completion Photos
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-invoice" class="accent-amber-500"> Invoice
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-po" class="accent-amber-500"> Purchase Order (PO)
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-quotation" class="accent-amber-500"> Quotation
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" id="doc-any" class="accent-amber-500"> Any Supporting File
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-border-color pt-4 mt-6">
            <button type="button" onclick="document.getElementById('raise-payout-modal').remove()" class="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded border border-border-color transition-colors">Cancel</button>
            <button type="submit" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded transition-colors">Create Payout Request</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();

    // Bind form submit
    document.getElementById("raise-payout-form").onsubmit = async (e) => {
      e.preventDefault();
      await this.saveNewRequest();
    };
  },

  onFormVendorSelect(val) {
    const input = document.getElementById("payout-form-vendor-input");
    if (!input) return;

    if (val === "CUSTOM") {
      input.value = "";
      input.classList.remove("opacity-50");
      input.removeAttribute("readonly");
      input.focus();
    } else if (val) {
      input.value = val;
      input.classList.add("opacity-50");
      input.setAttribute("readonly", true);
    } else {
      input.value = "";
      input.classList.remove("opacity-50");
      input.removeAttribute("readonly");
    }
  },

  onFormCategorySelect(val) {
    const customInput = document.getElementById("payout-form-custom-category");
    if (!customInput) return;

    if (val === "OTHER") {
      customInput.classList.remove("hidden");
      customInput.setAttribute("required", true);
      customInput.focus();
    } else {
      customInput.classList.add("hidden");
      customInput.removeAttribute("required");
    }

    // Auto load milestones for selected category
    this.loadMilestoneOptions(val === "OTHER" ? "OTHER" : val);
  },

  // Populate milestone dropdown options based on templates
  loadMilestoneOptions(category) {
    const select = document.getElementById("payout-form-milestone-select");
    if (!select) return;

    // Reset options
    select.innerHTML = '<option value="">-- Choose Milestone --</option>';

    // Load templates
    const defaultTemplates = {
      'Carpentry': ["Material Unloading", "Carcass Completion", "Shutter Installation", "Final Alignment"],
      'Painting': ["Site Start", "Putty Completion", "First Coat", "Final Completion"]
    };

    const savedTemplates = JSON.parse(localStorage.getItem("premio_milestone_templates") || "{}");
    const milestones = savedTemplates[category] || defaultTemplates[category] || [];

    milestones.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      select.appendChild(opt);
    });
  },

  // Save new request submission
  async saveNewRequest() {
    const store = window.AppStore;
    const projId = document.getElementById("payout-form-project").value;
    const projectObj = store.state.projects.find(p => p.id === projId);

    const vendorName = document.getElementById("payout-form-vendor-input").value.trim();
    let category = document.getElementById("payout-form-category").value;
    if (category === "OTHER") {
      category = document.getElementById("payout-form-custom-category").value.trim();
      // Save new custom category for future use
      const customCats = JSON.parse(localStorage.getItem("premio_custom_categories") || "[]");
      if (!customCats.includes(category)) {
        customCats.push(category);
        localStorage.setItem("premio_custom_categories", JSON.stringify(customCats));
      }
    }

    const milestone = document.getElementById("payout-form-milestone-input").value.trim();
    const amount = Number(document.getElementById("payout-form-amount").value);
    const targetDate = window.Utils.toISODate(document.getElementById("payout-form-target-date").value);
    const notes = document.getElementById("payout-form-notes").value.trim();

    // Checkboxes
    const checklist = {
      sitePhotos: document.getElementById("doc-site-photos").checked,
      completionPhotos: document.getElementById("doc-completion-photos").checked,
      invoice: document.getElementById("doc-invoice").checked,
      po: document.getElementById("doc-po").checked,
      quotation: document.getElementById("doc-quotation").checked,
      anySupporting: document.getElementById("doc-any").checked
    };

    const newPayout = {
      id: `payout-${Date.now()}`,
      projectId: projId,
      projectName: projectObj ? projectObj.name : "Unknown Project",
      vendorName,
      category,
      milestone,
      amount,
      targetDate,
      notes,
      checklist,
      status: "Draft", // Initial status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: "",
      approvalDate: "",
      approvalComments: "",
      refNumber: "" // UTR ref
    };

    await window.dbService.savePayout(newPayout);
    
    // Auto-create/upsert custom vendor in profiles network if not exists
    const vendorExists = store.state.vendors.some(v => v.name.toLowerCase() === vendorName.toLowerCase());
    if (!vendorExists) {
      const newVendor = {
        name: vendorName,
        category: category,
        phone: "+91 90000 00000",
        rating: 4.5,
        delayHistory: "Low",
        activeProjects: 1
      };
      await window.dbService.saveVendor(newVendor);
    }

    window.ModalComponent.showToast("Payment request successfully raised!");
    document.getElementById("raise-payout-modal").remove();
    this.refreshList();
  },

  // Modal to create and save a new milestone structure template
  openCustomMilestoneCreator() {
    const customCats = JSON.parse(localStorage.getItem("premio_custom_categories") || "[]");
    const standardCategories = [
      "Carpentry", "Painting", "Electrical", "Plumbing", 
      "False Ceiling", "Civil", "Glass", "Stone", "Hardware", "Cleaning"
    ];
    const allCategories = [...standardCategories, ...customCats];

    const modal = document.createElement("div");
    modal.id = "custom-milestone-modal";
    modal.className = "fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in";
    
    modal.innerHTML = `
      <div class="bg-secondary border border-border-color w-full max-w-sm rounded-lg overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        <div class="p-4 border-b border-border-color flex justify-between items-center bg-primary">
          <h4 class="text-xs font-bold text-white uppercase">Define Milestone Template</h4>
          <button onclick="document.getElementById('custom-milestone-modal').remove()" class="text-secondary hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="p-5 space-y-4 text-xs">
          <div>
            <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Select Work Category</label>
            <select id="milestone-template-category" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none">
              ${allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Stages / Milestones (comma separated)</label>
            <textarea id="milestone-template-input" rows="3" placeholder="e.g. Layout, Carcass, Fitting, Alignment" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 border-t border-border-color pt-4">
            <button onclick="document.getElementById('custom-milestone-modal').remove()" class="px-2.5 py-1.5 bg-primary text-white rounded border border-border-color">Cancel</button>
            <button onclick="window.PayoutsPage.saveMilestoneTemplate()" class="px-2.5 py-1.5 bg-amber-500 text-black font-semibold rounded">Save Structure</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
  },

  saveMilestoneTemplate() {
    const cat = document.getElementById("milestone-template-category").value;
    const stagesText = document.getElementById("milestone-template-input").value;
    if (!stagesText.trim()) return;

    const stagesList = stagesText.split(",").map(s => s.trim()).filter(Boolean);

    const savedTemplates = JSON.parse(localStorage.getItem("premio_milestone_templates") || "{}");
    savedTemplates[cat] = stagesList;
    localStorage.setItem("premio_milestone_templates", JSON.stringify(savedTemplates));

    window.ModalComponent.showToast(`Saved custom milestone structure for ${cat}!`);
    document.getElementById("custom-milestone-modal").remove();

    // If currently rendering request form category, reload milestone selector
    const currentFormCat = document.getElementById("payout-form-category")?.value;
    if (currentFormCat === cat) {
      this.loadMilestoneOptions(cat);
    }
  },

  // Detail / Approval transitions view modal
  viewDetails(payoutId) {
    const store = window.AppStore;
    const payout = store.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    const isAdmin = store.activeRole === "admin";
    const dateFormatted = new Date(payout.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const modal = document.createElement("div");
    modal.id = "payout-detail-modal";
    modal.className = "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in";
    
    modal.innerHTML = `
      <div class="bg-secondary border border-border-color w-full max-w-xl rounded-lg overflow-hidden flex flex-col shadow-2xl animate-scale-in max-h-[90vh]">
        <!-- Header -->
        <div class="p-4 border-b border-border-color flex justify-between items-center bg-primary">
          <div>
            <h3 class="text-sm font-semibold font-display text-white">Payment Request Detail</h3>
            <span class="text-[9px] text-muted font-mono">ID: ${payout.id}</span>
          </div>
          <button onclick="document.getElementById('payout-detail-modal').remove()" class="text-secondary hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-5 space-y-4 overflow-y-auto text-xs">
          <!-- Timeline Progress Tracker -->
          <div>
            <span class="text-[9px] text-muted uppercase font-bold tracking-wider mb-2.5 block">Workflow Timeline</span>
            <div class="flex justify-between items-center gap-1 bg-primary/30 p-3 rounded border border-border-color/40 font-mono text-[9px]">
              ${this.renderTimelineWorkflow(payout.status)}
            </div>
          </div>

          <!-- Info Blocks -->
          <div class="grid grid-cols-2 gap-4 border-t border-border-color/30 pt-3">
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block">Linked Project</span>
              <span class="text-white font-medium text-xs mt-0.5 block">${payout.projectName}</span>
            </div>
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block">Contractor / Vendor</span>
              <span class="text-white font-medium text-xs mt-0.5 block">${payout.vendorName}</span>
            </div>
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block">Work Category & Stage</span>
              <span class="text-white font-medium text-xs mt-0.5 block">${payout.category} — ${payout.milestone}</span>
            </div>
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block">Requested Amount</span>
              <span class="text-amber-500 font-bold text-sm mt-0.5 block font-mono">₹${Number(payout.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Details & Supporting documents -->
          <div class="space-y-2 border-t border-border-color/30 pt-3">
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block">Description / Notes</span>
              <p class="text-secondary mt-1 bg-primary/20 p-2.5 rounded border border-border-color/30">${payout.notes || 'No description notes attached.'}</p>
            </div>

            <!-- Supporting Documents Checklist status -->
            <div>
              <span class="text-[9px] text-muted uppercase font-semibold block mb-1.5">Supporting Checklist Logs</span>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-primary/10 border border-border-color/30 rounded p-2.5">
                ${Object.entries(payout.checklist || {}).map(([key, val]) => `
                  <div class="flex items-center gap-1.5 text-secondary">
                    <i data-lucide="${val ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5 ${val ? 'text-emerald-400' : 'text-zinc-600'}"></i>
                    <span class="capitalize">${key.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Approval Details Section -->
          ${payout.approvedBy ? `
            <div class="bg-emerald-950/20 border border-emerald-500/25 rounded p-3 text-secondary space-y-1">
              <span class="text-[9px] text-emerald-400 uppercase font-bold tracking-wider block">Approval Validation Details</span>
              <div class="flex justify-between text-[11px]"><span class="label">Approved By:</span><span class="text-white font-semibold">${payout.approvedBy}</span></div>
              <div class="flex justify-between text-[11px]"><span class="label">Approval Date:</span><span class="text-white font-mono">${new Date(payout.approvalDate).toLocaleDateString('en-IN')}</span></div>
              <div class="flex justify-between text-[11px]"><span class="label">Comments:</span><span class="text-white italic">${payout.approvalComments || 'None'}</span></div>
              ${payout.refNumber ? `
                <div class="flex justify-between text-[11px] border-t border-emerald-500/10 pt-1 mt-1">
                  <span class="label">Reference / UTR:</span>
                  <span class="text-emerald-400 font-mono font-bold">${payout.refNumber}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Admin Workflow Decisions Form overlay -->
          <div class="border-t border-border-color/30 pt-4 mt-2">
            ${isAdmin ? this.renderAdminApprovalControls(payout) : `
              <div class="text-[10px] text-muted italic text-center p-2 bg-primary/25 rounded border border-border-color/20">
                Only Admin users (Naveen Sir / Accounts leads) can process status updates (Approve, release payment, or close).
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
  },

  renderTimelineWorkflow(status) {
    const list = ["Draft", "Submitted", "Awaiting Approval", "Approved", "Paid", "Closed"];
    const curIdx = list.indexOf(status === "Rejected" ? "Awaiting Approval" : status === "Sent To Accounts" ? "Approved" : status);

    return list.map((item, idx) => {
      let color = "text-muted";
      if (status === "Rejected" && item === "Awaiting Approval") {
        color = "text-rose-500 font-bold";
      } else if (idx < curIdx) {
        color = "text-emerald-400 font-medium";
      } else if (idx === curIdx) {
        color = "text-amber-400 font-bold";
      }
      return `<span class="${color}">${item}</span>`;
    }).join(`<i data-lucide="chevron-right" class="w-3 h-3 text-muted"></i>`);
  },

  renderAdminApprovalControls(payout) {
    const store = window.AppStore;
    let controls = "";

    // Add edit remarks / approved by input fields that are available across all statuses for admin
    const remarksSection = `
      <div class="space-y-3 bg-primary/20 p-3 rounded border border-border-color/40 mb-3">
        <span class="text-[9px] text-amber-500 uppercase font-bold tracking-wider block">Approval Remarks & Sign-off</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-[9px] text-muted mb-1">Approved By</label>
            <input type="text" id="admin-approved-by" value="${payout.approvedBy || store.currentUserName || 'Naveen Sir'}" placeholder="e.g. Naveen Sir" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none font-sans">
          </div>
          <div>
            <label class="block text-[9px] text-muted mb-1">Approval Comments / Remarks</label>
            <input type="text" id="admin-approval-comments" value="${payout.approvalComments || ''}" placeholder="e.g. Verified milestone complete on site" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none font-sans">
          </div>
        </div>
        ${['Approved', 'Sent To Accounts', 'Paid', 'Closed'].includes(payout.status) ? `
          <button onclick="window.PayoutsPage.updateRemarksOnly('${payout.id}')" class="w-full py-1 bg-hover hover:bg-border-color text-white text-[10px] rounded border border-border-color/40 font-medium transition-all">Update Remarks & Reflect</button>
        ` : ''}
      </div>
    `;

    if (['Draft', 'Submitted', 'Awaiting Approval', 'Rejected'].includes(payout.status)) {
      controls = `
        ${remarksSection}
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.PayoutsPage.processApproval('${payout.id}', 'Approved')" class="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition-all">Approve Request</button>
          <button onclick="window.PayoutsPage.processApproval('${payout.id}', 'Rejected')" class="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition-all">Reject Request</button>
        </div>
        ${payout.status === "Draft" ? `
          <button onclick="window.PayoutsPage.transitionStatus('${payout.id}', 'Submitted')" class="w-full py-1.5 mt-2 bg-hover hover:bg-border-color border border-border-color/30 text-white font-semibold rounded text-[11px] transition-all">Submit for Review (Without Approving)</button>
        ` : payout.status === "Submitted" ? `
          <button onclick="window.PayoutsPage.transitionStatus('${payout.id}', 'Awaiting Approval')" class="w-full py-1.5 mt-2 bg-hover hover:bg-border-color border border-border-color/30 text-white font-semibold rounded text-[11px] transition-all">Flag Awaiting Approval</button>
        ` : ''}
      `;
    } else if (payout.status === "Approved") {
      controls = `
        ${remarksSection}
        <button onclick="window.PayoutsPage.transitionStatus('${payout.id}', 'Sent To Accounts')" class="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition-all">Send to Accounts</button>
      `;
    } else if (payout.status === "Sent To Accounts") {
      controls = `
        ${remarksSection}
        <div class="space-y-3 pt-2 border-t border-border-color/20">
          <label class="block text-[10px] text-muted uppercase font-semibold mb-1">UTR Reference Number</label>
          <input type="text" id="admin-utr-ref" placeholder="Enter bank transfer UTR number" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none font-sans">
          <button onclick="window.PayoutsPage.releasePayment('${payout.id}')" class="w-full py-2 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded transition-all">Release Payment (Paid)</button>
        </div>
      `;
    } else if (payout.status === "Paid") {
      controls = `
        ${remarksSection}
        <button onclick="window.PayoutsPage.transitionStatus('${payout.id}', 'Closed')" class="w-full py-2 mt-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold rounded transition-all">Close Payout Request</button>
      `;
    } else {
      controls = `
        ${remarksSection}
        <div class="text-center text-muted italic py-1 mt-2">This payout request has been successfully closed.</div>
      `;
    }

    return `
      <div class="space-y-2">
        <span class="text-[9px] text-muted uppercase font-bold tracking-wider block">Admin Workflow Controls</span>
        ${controls}
      </div>
    `;
  },

  async transitionStatus(payoutId, newStatus) {
    const store = window.AppStore;
    const payout = store.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    payout.status = newStatus;
    payout.updatedAt = new Date().toISOString();

    await window.dbService.savePayout(payout);
    window.ModalComponent.showToast(`Request transitioned to status: ${newStatus}`);
    
    // Close modal & refresh lists
    document.getElementById("payout-detail-modal")?.remove();
    this.refreshList();
  },

  async processApproval(payoutId, status) {
    const store = window.AppStore;
    const payout = store.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    const comments = document.getElementById("admin-approval-comments")?.value.trim() || "";
    const approvedBy = document.getElementById("admin-approved-by")?.value.trim() || store.currentUserName || "Naveen Sir (Admin)";

    payout.status = status;
    payout.approvedBy = approvedBy;
    payout.approvalDate = new Date().toISOString();
    payout.approvalComments = comments;
    payout.updatedAt = new Date().toISOString();

    await window.dbService.savePayout(payout);
    window.ModalComponent.showToast(`Request was successfully ${status}!`);

    document.getElementById("payout-detail-modal")?.remove();
    this.refreshList();
  },

  async updateRemarksOnly(payoutId) {
    const store = window.AppStore;
    const payout = store.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    const comments = document.getElementById("admin-approval-comments")?.value.trim() || "";
    const approvedBy = document.getElementById("admin-approved-by")?.value.trim() || payout.approvedBy || "Naveen Sir (Admin)";

    payout.approvedBy = approvedBy;
    payout.approvalComments = comments;
    payout.updatedAt = new Date().toISOString();

    await window.dbService.savePayout(payout);
    window.ModalComponent.showToast("Remarks successfully updated and reflected!");

    document.getElementById("payout-detail-modal")?.remove();
    this.refreshList();
  },

  async releasePayment(payoutId) {
    const store = window.AppStore;
    const payout = store.state.payouts.find(p => p.id === payoutId);
    if (!payout) return;

    const ref = document.getElementById("admin-utr-ref")?.value.trim() || "";
    if (!ref) {
      alert("Please enter a bank UTR / reference number before releasing payout.");
      return;
    }

    payout.status = "Paid";
    payout.refNumber = ref;
    payout.updatedAt = new Date().toISOString();

    await window.dbService.savePayout(payout);
    window.ModalComponent.showToast("Payment release confirmed!");

    document.getElementById("payout-detail-modal")?.remove();
    this.refreshList();
  }
};
