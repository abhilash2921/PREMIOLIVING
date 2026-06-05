/* js/components/navbar.js - Premio Living OS Navigation Component */

window.NavbarComponent = {
  renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    
    const store = window.AppStore;
    const mode = store.activeMode;
    const activeClass = (page) => store.activePage === page ? "nav-btn-active" : "text-secondary hover:bg-hover hover:text-white";
    const companyLogo = localStorage.getItem("company_logo") || "logo.png";
    
    // Project Switcher List
    let projectItems = "";
    store.state.projects.forEach(p => {
      if (store.activeRole === "vendor") {
        const isAssigned = p.materials.some(m => m.vendor === "Wood Crafts");
        if (!isAssigned) return;
      }
      if (store.activeRole === "client" && p.id !== "project-1") {
        return;
      }
      
      const activeProjClass = (store.activePage === "project-details" && store.activeProjectId === p.id) 
        ? "bg-hover text-white font-semibold" 
        : "text-secondary hover:bg-hover hover:text-white";
        
      projectItems += `
        <li>
          <button onclick="window.AppRouter.navigate('project-details', '${p.id}')" class="w-full text-left px-3 py-2 rounded text-xs transition-all truncate flex items-center gap-2 ${activeProjClass}">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
            <span class="truncate">${p.name}</span>
          </button>
        </li>
      `;
    });

    // 2-Mode Segmented Selector
    const modeSelectorHTML = `
      <div class="px-4 py-2 border-b border-border-color/60 bg-primary/20">
        <div class="grid grid-cols-2 gap-1 bg-primary p-0.5 rounded-md border border-border-color">
          <button onclick="window.setMode('site')" class="py-1 text-[10px] font-bold rounded text-center transition-all ${mode === 'site' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:text-white'}">Site</button>
          <button onclick="window.setMode('management')" class="py-1 text-[10px] font-bold rounded text-center transition-all ${mode === 'management' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:text-white'}">Manage</button>
        </div>
      </div>
    `;

    // Dynamic nav links based on Mode
    let navLinksHTML = "";
    if (mode === "site") {
      navLinksHTML = `
        <div>
          <span class="text-[9px] text-muted uppercase tracking-widest font-semibold px-3 block mb-2">Site Command</span>
          <ul class="space-y-1">
            <li>
              <button onclick="window.AppRouter.navigate('today')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('today')}">
                <i data-lucide="calendar" class="w-4 h-4"></i> Today
              </button>
            </li>
          </ul>
        </div>
      `;
    } else if (mode === "management") {
      const role = store.activeRole;
      navLinksHTML = `
        <div>
          <span class="text-[9px] text-muted uppercase tracking-widest font-semibold px-3 block mb-2">Management OS</span>
          <ul class="space-y-1">
            <li>
              <button onclick="window.AppRouter.navigate('dashboard')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('dashboard')}">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Overview
              </button>
            </li>
            <li>
              <button onclick="window.AppRouter.navigate('deliveries')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('deliveries')}">
                <i data-lucide="truck" class="w-4 h-4"></i> Delivery Tracking
              </button>
            </li>
            <li>
              <button onclick="window.AppRouter.navigate('payouts')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('payouts')}">
                <i data-lucide="wallet" class="w-4 h-4"></i> Payout Center
              </button>
            </li>
            <!-- commented out Project Intelligence for presentation cleanups
            <li>
              <button onclick="window.AppRouter.navigate('intelligence')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('intelligence')}">
                <i data-lucide="sparkles" class="w-4 h-4"></i> Project Intelligence
              </button>
            </li>
            -->
            ${role === 'admin' ? `
            <li>
              <button onclick="window.AppRouter.navigate('procurement')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('procurement')}">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i> Procurement OS
              </button>
            </li>
            <li>
              <button onclick="window.AppRouter.navigate('rfqs')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('rfqs')}">
                <i data-lucide="file-question" class="w-4 h-4"></i> Request for Quote (RFQ)
              </button>
            </li>
            <li>
              <button onclick="window.AppRouter.navigate('pos')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('pos')}">
                <i data-lucide="clipboard-signature" class="w-4 h-4"></i> Purchase Orders
              </button>
            </li>
            <li>
              <button onclick="window.AppRouter.navigate('admin-users')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('admin-users')}">
                <i data-lucide="users-2" class="w-4 h-4 text-amber-500"></i> Team Directory
              </button>
            </li>
            ` : ''}
            ${['admin','architect','designer'].includes(role) ? `
            <li>
              <button onclick="window.AppRouter.navigate('vendors')" class="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeClass('vendors')}">
                <i data-lucide="users" class="w-4 h-4"></i> Vendor Directory
              </button>
            </li>
            ` : ''}
          </ul>
        </div>
      `;
    }

    sidebar.innerHTML = `
      <!-- Header -->
      <div class="p-5 border-b border-border-color">
        <div id="logo-image-wrapper" class="hidden w-full h-10 flex items-center justify-start overflow-hidden">
          <img id="sidebar-logo-full" src="${companyLogo}" alt="Premio Living" class="h-10 object-contain" onload="document.getElementById('logo-image-wrapper').classList.remove('hidden'); document.getElementById('logo-text-wrapper').classList.add('hidden')">
        </div>
        <div id="logo-text-wrapper" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold font-display text-sm tracking-tighter">
            <span class="font-bold">P</span>
          </div>
          <div>
            <h1 class="font-display font-semibold tracking-wide text-xs text-white uppercase">Premio Living</h1>
            <span class="text-[9px] text-muted tracking-widest font-mono uppercase block mt-0.5">Execution OS</span>
          </div>
        </div>
      </div>
      
      <!-- Mode Segmented Switcher -->
      ${modeSelectorHTML}
      
      <!-- Navigation List -->
      <nav class="p-4 flex-1 space-y-6 overflow-y-auto">
        ${navLinksHTML}
        
        <div>
          <span class="text-[9px] text-muted uppercase tracking-widest font-semibold px-3 block mb-2">Workspaces</span>
          <ul class="space-y-1">${projectItems}</ul>
        </div>
      </nav>
      
      <!-- Footer Profile / Auth Status -->
      <div class="p-4 border-t border-border-color bg-primary/40 space-y-2">
        ${store.state.supabase_session ? `
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs flex-shrink-0">
                ${(store.state.supabase_session.user.email || 'A').substring(0, 2).toUpperCase()}
              </div>
              <div class="min-w-0">
                <span class="font-semibold text-white block truncate text-[11px]">${store.state.supabase_session.user.email}</span>
                <span class="text-[9px] text-muted block uppercase font-semibold">${store.activeRole}</span>
              </div>
            </div>
            <button onclick="window.AuthService.signOut()" class="p-1.5 bg-hover hover:bg-rose-500/10 border border-border-color hover:border-rose-500/30 rounded text-secondary hover:text-rose-400 transition-colors" title="Sign Out">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="flex items-center gap-1 mt-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span class="text-[9px] text-muted">Signed in via Supabase</span>
          </div>
          ${store.activeRole === 'admin' ? `
            <button onclick="window.openModal('connect-supabase-modal')" class="w-full mt-2 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[10px] text-secondary hover:text-white transition-all font-semibold flex items-center justify-center gap-1">
              <i data-lucide="settings" class="w-3.5 h-3.5 text-amber-500"></i> System & DB Settings
            </button>
          ` : ''}
        ` : `
          <!-- Demo Mode Role Switcher -->
          <span class="text-[8px] text-amber-500/70 uppercase tracking-wider block font-semibold px-1">Demo Mode — Role Switcher</span>
          <select onchange="window.AppStore.setRole(this.value); window.AppRouter.refresh();" class="w-full text-xs p-1.5 bg-primary border border-border-color rounded text-white focus:outline-none mb-1">
            <option value="admin" ${store.activeRole === 'admin' ? 'selected' : ''}>Admin (Full Control)</option>
            <option value="architect" ${store.activeRole === 'architect' ? 'selected' : ''}>Architect</option>
            <option value="designer" ${store.activeRole === 'designer' ? 'selected' : ''}>Designer</option>
            <option value="site_engineer" ${store.activeRole === 'site_engineer' ? 'selected' : ''}>Site Engineer</option>
          </select>
          <div class="flex items-center justify-between text-xs text-secondary mt-1">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">AR</div>
              <div class="min-w-0">
                <span class="font-semibold text-white block truncate text-[11px]">Abhilash Reddy</span>
                <span class="text-[9px] text-muted block uppercase tracking-tight">${store.activeRole}</span>
              </div>
            </div>
            <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Demo Mode"></span>
          </div>
          <button onclick="window.openModal('connect-supabase-modal')" class="w-full mt-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded text-[10px] text-amber-500 font-semibold transition-all flex items-center justify-center gap-1.5">
            <i data-lucide="settings" class="w-3.5 h-3.5 text-amber-500"></i> System Settings & DB
          </button>
        `}
      </div>
    `;

    // Render mobile sub-header mode switcher as well
    this.renderMobileModeBar();
  },

  renderMobileModeBar() {
    const bar = document.getElementById("mobile-mode-bar");
    if (!bar) return;
    
    const store = window.AppStore;
    const mode = store.activeMode;
    
    bar.innerHTML = `
      <div class="grid grid-cols-2 gap-1 bg-primary p-0.5 rounded-md border border-border-color w-full max-w-sm">
        <button onclick="window.setMode('site')" class="py-1.5 text-xs font-bold rounded text-center transition-all ${mode === 'site' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:text-white'}">Site</button>
        <button onclick="window.setMode('management')" class="py-1.5 text-xs font-bold rounded text-center transition-all ${mode === 'management' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:text-white'}">Manage</button>
      </div>
    `;
  },
  
  renderMobileNavbar() {
    const mobContainer = document.getElementById("mobile-bottom-nav");
    if (!mobContainer) return;
    
    const store = window.AppStore;
    const activeClass = (page) => store.activePage === page ? "text-amber-500" : "text-secondary";
    
    mobContainer.innerHTML = `
      <div class="flex justify-around items-center h-14 bg-secondary border-t border-border-color z-30">
        <button onclick="window.AppRouter.navigate('today')" class="flex flex-col items-center justify-center w-16 h-full ${activeClass('today')}">
          <i data-lucide="calendar" class="w-5 h-5"></i>
          <span class="text-[9px] mt-0.5 font-medium">Today</span>
        </button>
        <button onclick="window.AppRouter.navigate('dashboard')" class="flex flex-col items-center justify-center w-16 h-full ${activeClass('dashboard')}">
          <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
          <span class="text-[9px] mt-0.5 font-medium">Workspaces</span>
        </button>
        <button onclick="window.AppRouter.navigate('vendors')" class="flex flex-col items-center justify-center w-16 h-full ${activeClass('vendors')}">
          <i data-lucide="users" class="w-5 h-5"></i>
          <span class="text-[9px] mt-0.5 font-medium">Vendors</span>
        </button>
      </div>
    `;
  }
};

