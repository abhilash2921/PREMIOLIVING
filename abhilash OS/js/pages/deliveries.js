/* js/pages/deliveries.js - Premio Living OS Delivery Tracking Page */

window.DeliveryPage = {
  activeProjectFilter: "all",

  render(container) {
    const store = window.AppStore;
    const projects = store.state.projects || [];
    
    // Aggregate deliveries from all projects
    let allDeliveries = [];
    projects.forEach(p => {
      (p.deliveries || []).forEach(d => {
        allDeliveries.push({
          projectId: p.id,
          projectName: p.name.split(" (")[0],
          responsibleParty: d.responsibleParty || p.team.engineer.split(" (")[0] || "Procurement Manager",
          ...d
        });
      });
    });

    // Project filter selector
    if (this.activeProjectFilter !== "all") {
      allDeliveries = allDeliveries.filter(d => d.projectId === this.activeProjectFilter);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute stats
    const totalDeliveries = allDeliveries.length;
    const pendingDeliveries = allDeliveries.filter(d => d.status === "Pending").length;
    const dispatchedDeliveries = allDeliveries.filter(d => d.status === "Dispatched").length;
    const deliveredCount = allDeliveries.filter(d => d.status === "Delivered" || d.status === "Installed").length;
    
    // Calculate delays
    allDeliveries.forEach(d => {
      let delayDays = 0;
      if (d.status === "Pending") {
        if (d.date < todayStr) {
          const expected = new Date(d.date);
          const today = new Date();
          delayDays = Math.ceil((today - expected) / (1000 * 60 * 60 * 24));
        }
      } else if (d.status === "Delivered" || d.status === "Installed") {
        if (d.arrivalDate && d.date && d.arrivalDate > d.date) {
          const expected = new Date(d.date);
          const arrival = new Date(d.arrivalDate);
          delayDays = Math.ceil((arrival - expected) / (1000 * 60 * 60 * 24));
        }
      }
      d.delayDays = delayDays > 0 ? delayDays : 0;
    });

    const activeDelaysCount = allDeliveries.filter(d => d.delayDays > 0).length;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Metrics Bar -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card p-4 border-l-4 border-amber-500 bg-primary/10">
            <span class="text-[9px] text-secondary uppercase font-mono font-bold tracking-wider">Total Orders Logged</span>
            <h3 class="text-xl font-extrabold text-white font-mono mt-1">${totalDeliveries} Items</h3>
            <span class="text-[8px] text-muted">Awaiting delivery & install logs</span>
          </div>
          
          <div class="card p-4 border-l-4 border-blue-400 bg-primary/10">
            <span class="text-[9px] text-blue-400 uppercase font-mono font-bold tracking-wider">In Transit / Dispatched</span>
            <h3 class="text-xl font-extrabold text-white font-mono mt-1">${dispatchedDeliveries} Items</h3>
            <span class="text-[8px] text-muted">Active dispatch tracks</span>
          </div>
          
          <div class="card p-4 border-l-4 border-emerald-400 bg-primary/10">
            <span class="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider">Delivered / Installed</span>
            <h3 class="text-xl font-extrabold text-white font-mono mt-1">${deliveredCount} Items</h3>
            <span class="text-[8px] text-muted">Completed site placements</span>
          </div>
          
          <div class="card p-4 border-l-4 border-rose-500 bg-rose-950/15">
            <span class="text-[9px] text-rose-400 uppercase font-mono font-bold tracking-wider">Timeline Slip Risks</span>
            <h3 class="text-xl font-extrabold text-rose-400 font-mono mt-1">${activeDelaysCount} Delays</h3>
            <span class="text-[8px] text-rose-300">Deliveries past estimated schedule</span>
          </div>
        </div>

        <!-- Filter Sub-Header -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-border-color pb-3">
          <div class="flex items-center gap-2">
            <label class="text-xs text-secondary font-medium">Filter by Project:</label>
            <select onchange="window.DeliveryPage.setProjectFilter(this.value)" class="bg-secondary border border-border-color/60 text-xs rounded px-2.5 py-1 text-white focus:outline-none focus:border-amber-500">
              <option value="all" ${this.activeProjectFilter === 'all' ? 'selected' : ''}>All Active Sites</option>
              ${projects.map(p => `<option value="${p.id}" ${this.activeProjectFilter === p.id ? 'selected' : ''}>${p.name.split(" (")[0]}</option>`).join("")}
            </select>
          </div>
          <button onclick="window.openModal('add-delivery-modal')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Expected Delivery
          </button>
        </div>

        <!-- Delivery Table -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-border-color bg-primary/20 flex justify-between items-center">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Cross-Project Sourcing & Delivery Pipeline</h4>
            <span class="text-[9px] text-muted font-mono">Real-time status sync</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border-color text-[9px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-3 py-3 bg-primary/40">Project Site</th>
                  <th class="px-3 py-3 bg-primary/40">Material Description</th>
                  <th class="px-3 py-3 bg-primary/40 text-center font-mono">Qty</th>
                  <th class="px-3 py-3 bg-primary/40 font-mono">Expected Arrival</th>
                  <th class="px-3 py-3 bg-primary/40 font-mono">Dispatch Date</th>
                  <th class="px-3 py-3 bg-primary/40 font-mono">Actual Arrival</th>
                  <th class="px-3 py-3 bg-primary/40 font-mono text-center">Delay (Days)</th>
                  <th class="px-3 py-3 bg-primary/40">Responsible Partner</th>
                  <th class="px-3 py-3 bg-primary/40 text-center">Pipeline Status</th>
                  <th class="px-3 py-3 bg-primary/40 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-color/10 text-white font-sans">
                ${allDeliveries.map(d => {
                  let statusBadge = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  if (d.status === "Dispatched") statusBadge = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  else if (d.status === "Delivered") statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  else if (d.status === "Installed") statusBadge = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                  
                  const isDelayed = d.delayDays > 0;
                  const delayText = isDelayed ? `+${d.delayDays} Days` : "-";
                  const delayClass = isDelayed ? "text-rose-400 font-bold font-mono" : "text-secondary font-mono";

                  const expectedDate = window.Utils.formatDate(d.date);
                  const dispatchDate = d.dispatchDate ? window.Utils.formatDate(d.dispatchDate) : "-";
                  const arrivalDate = d.arrivalDate ? window.Utils.formatDate(d.arrivalDate) : "-";

                  // Define action dropdown
                  let actionHTML = "";
                  if (d.status === "Pending") {
                    actionHTML = `<button onclick="window.DeliveryPage.updateStatus('${d.projectId}', '${d.id}', 'Dispatched')" class="px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-black text-[9px] font-bold">Dispatch</button>`;
                  } else if (d.status === "Dispatched") {
                    actionHTML = `<button onclick="window.DeliveryPage.updateStatus('${d.projectId}', '${d.id}', 'Delivered')" class="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-black text-[9px] font-bold">Deliver</button>`;
                  } else if (d.status === "Delivered") {
                    actionHTML = `<button onclick="window.DeliveryPage.updateStatus('${d.projectId}', '${d.id}', 'Installed')" class="px-2 py-0.5 rounded bg-purple-500 hover:bg-purple-600 text-white text-[9px] font-bold">Install</button>`;
                  } else {
                    actionHTML = `<span class="text-[9px] text-muted italic">Complete</span>`;
                  }

                  return `
                    <tr class="hover:bg-hover/10 transition-colors">
                      <td class="px-3 py-3 font-semibold text-white truncate max-w-[110px]" title="${d.projectName}">${d.projectName}</td>
                      <td class="px-3 py-3 font-medium text-white truncate max-w-[150px]" title="${d.item}">${d.item}</td>
                      <td class="px-3 py-3 text-center font-mono font-semibold text-secondary">${d.qty}</td>
                      <td class="px-3 py-3 font-mono text-secondary">${expectedDate}</td>
                      <td class="px-3 py-3 font-mono text-secondary">${dispatchDate}</td>
                      <td class="px-3 py-3 font-mono text-secondary">${arrivalDate}</td>
                      <td class="px-3 py-3 text-center ${delayClass}">${delayText}</td>
                      <td class="px-3 py-3 text-secondary font-medium truncate max-w-[110px]" title="${d.responsibleParty}">${d.responsibleParty}</td>
                      <td class="px-3 py-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold ${statusBadge}">${d.status.toUpperCase()}</span>
                      </td>
                      <td class="px-3 py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          ${actionHTML}
                          <button onclick="window.openModal('add-delivery-modal', { projectId: '${d.projectId}', delivery: ${JSON.stringify(d).replace(/"/g, '&quot;')}, isEdit: true })" class="p-1 bg-hover hover:bg-border-color border border-border-color/30 rounded text-amber-500" title="Edit Delivery"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
                          <button onclick="window.DeliveryPage.deleteDelivery('${d.projectId}', '${d.id}')" class="p-1 bg-hover hover:bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded" title="Delete Delivery"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")}
                
                ${allDeliveries.length === 0 ? `
                  <tr>
                    <td colspan="10" class="p-8 text-center text-secondary italic">No active delivery items logged.</td>
                  </tr>
                ` : ""}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    if (window.lucide) lucide.createIcons();
  },

  setProjectFilter(projId) {
    this.activeProjectFilter = projId;
    const container = document.getElementById("main-content-container");
    this.render(container);
  },

  async updateStatus(projId, deliveryId, newStatus) {
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === projId);
    if (!proj) return;
    
    const delivery = proj.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    delivery.status = newStatus;
    const today = new Date().toISOString().split('T')[0];
    
    if (newStatus === "Dispatched") {
      delivery.dispatchDate = today;
    } else if (newStatus === "Delivered") {
      delivery.arrivalDate = today;
    } else if (newStatus === "Installed") {
      delivery.installationDate = today;
    }

    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Delivery status updated to ${newStatus}!`);
    const container = document.getElementById("main-content-container");
    this.render(container);
  },

  async deleteDelivery(projId, deliveryId) {
    if (!confirm("Are you sure you want to delete this delivery log?")) return;
    
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === projId);
    if (!proj) return;

    proj.deliveries = proj.deliveries.filter(d => d.id !== deliveryId);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Delivery log deleted successfully!");
    
    const container = document.getElementById("main-content-container");
    this.render(container);
  }
};
