/* js/pages/vendors.js - Premio Living OS Vendor Directory */

window.VendorsPage = {
  render(container) {
    const store = window.AppStore;
    const isAddingAllowed = store.activeRole === "admin" || store.activeRole === "designer";
    
    // Sort or filter vendors if needed
    const vendors = store.state.vendors;

    const vendorGridHTML = vendors.map(v => {
      let riskBadge = v.delayHistory === "Low" 
        ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase font-bold">Low Delay Risk</span>`
        : v.delayHistory === "Medium"
        ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase font-bold">Medium Risk</span>`
        : `<span class="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[9px] uppercase font-bold">High Risk</span>`;

      return `
        <div class="card p-5 flex flex-col justify-between hover:border-border-color transition-all">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-bold text-white">${v.name}</h3>
                <span class="text-[10px] text-muted block mt-0.5">${v.category}</span>
              </div>
              <div class="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i> ${v.rating.toFixed(1)}
              </div>
            </div>
            
            <div class="text-xs space-y-1.5 border-t border-border-color/30 pt-3 text-secondary">
              <div class="flex justify-between items-center">
                <span>Phone Link:</span>
                <a href="tel:${v.phone.replace(/\s+/g, '')}" class="text-white hover:underline font-mono">${v.phone}</a>
              </div>
              <div class="flex justify-between items-center">
                <span>Active Sites:</span>
                <span class="text-white font-semibold font-mono">${v.activeProjects} Units</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-border-color/30 pt-3 mt-4 gap-2">
            ${riskBadge}
            <div class="flex items-center gap-1.5">
              ${isAddingAllowed ? `
                <button onclick="window.VendorsPage.editVendor('${v.name}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/30 text-white rounded flex items-center gap-1 text-[10px] font-medium" title="Edit Vendor">
                  <i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i> Edit
                </button>
                <button onclick="window.VendorsPage.deleteVendor('${v.name}')" class="p-1.5 bg-hover hover:bg-border-color border border-border-color/30 text-white rounded flex items-center gap-1 text-[10px] font-medium" title="Delete Vendor">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i> Delete
                </button>
              ` : ""}
              <a href="https://api.whatsapp.com/send?phone=${v.phone.replace(/[^+\d]/g, '')}" target="_blank" class="p-1.5 bg-hover hover:bg-border-color rounded border border-border-color/30 text-white flex items-center gap-1 text-[10px] font-medium transition-colors">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i> WhatsApp
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Top bar -->
        <div class="flex items-center justify-between border-b border-border-color pb-5">
          <div>
            <h1 class="text-lg font-bold tracking-tight text-white font-display">Contractor & Vendor Directory</h1>
            <p class="text-xs text-secondary mt-1">Global verified supplier network, active contracts, and delay history risks.</p>
          </div>
          ${isAddingAllowed ? `
            <button onclick="openModal('add-vendor-modal')" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-all flex items-center gap-1.5 shadow-md">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Add Vendor
            </button>
          ` : ""}
        </div>

        <!-- Directory Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${vendorGridHTML}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  editVendor(vendorName) {
    const store = window.AppStore;
    const vendor = store.state.vendors.find(v => v.name === vendorName);
    if (!vendor) return;
    
    window.openModal("add-vendor-modal", {
      isEdit: true,
      vendor
    });
  },

  async deleteVendor(vendorName) {
    if (!confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) return;
    await window.dbService.deleteVendor(vendorName);
    window.ModalComponent.populateSelectOptions();
    window.ModalComponent.showToast(`Vendor "${vendorName}" deleted.`);
    window.AppRouter.refresh();
  }
};
