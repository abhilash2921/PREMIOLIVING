/* js/pages/project.js - Premio Living OS Project Workspace Manager */

window.ProjectPage = {
  activeTab: "overview", // Default sub-tab

  setTab(tabId) {
    this.activeTab = tabId;
    window.AppRouter.refresh();
  },

  render(container, projectId) {
    const store = window.AppStore;
    let proj = store.state.projects.find(p => p.id === projectId);
    if (!proj && store.state.projects.length > 0) {
      proj = store.state.projects[0];
      store.activeProjectId = proj.id;
      try {
        localStorage.setItem("premio_active_project_id", proj.id);
      } catch(e){}
    }
    if (!proj) {
      container.innerHTML = `<div class="p-10 text-center text-xs text-muted">Project workspace not found.</div>`;
      return;
    }
    
    // Core Role Checks
    const role = store.activeRole;
    const mode = store.activeMode;
    
    // Define tabs dynamically based on the active mode (Site vs Management) intersected with Role
    let allowedTabs = [];
    const isDesignRole = ['admin','designer','architect'].includes(role);
    const isSiteRole   = ['admin','engineer','site_engineer'].includes(role);

    if (mode === "site") {
      const siteTabs = [
        { id: "overview",   label: "Overview",         icon: "activity",        roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] },
        { id: "timeline",   label: "Visual Timeline",  icon: "clock",           roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] },
        { id: "execution",  label: "Timeline Stages",  icon: "milestone",       roles: ['admin','engineer','vendor','client','site_engineer','architect','designer'] },
        { id: "decisions",  label: "Decisions",        icon: "gavel",           roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] },
        { id: "snags",      label: "Site Snags",        icon: "clipboard-list",  roles: ['admin','engineer','vendor','client','site_engineer','architect','designer'] },
        { id: "closure",    label: "Closure",          icon: "check-circle",    roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] }
      ];
      allowedTabs = siteTabs.filter(t => t.roles.includes(role));
    } else if (mode === "management") {
      const manageTabs = [
        { id: "design",     label: "Design Drawings",  icon: "pen-tool",        roles: ['admin','designer','client','architect'] },
        { id: "boq",       label: "BOQ Costing",       icon: "calculator",   roles: ['admin','client'] },
        { id: "billing",   label: "Billing & Invoices", icon: "credit-card",  roles: ['admin','client'] },
        { id: "materials", label: "Material Tracker",  icon: "trello",        roles: ['admin','designer','client','architect'] },
        { id: "vendor",    label: "Assigned Vendors",  icon: "users",         roles: ['admin','designer','architect'] },
        { id: "decisions",  label: "Decisions",        icon: "gavel",           roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] },
        { id: "changes",    label: "Change Control",   icon: "git-commit",      roles: ['admin','designer','client','architect'] },
        { id: "documents", label: "Knowledge Vault",   icon: "archive",        roles: ['admin','designer','engineer','client','architect','site_engineer'] },
        { id: "closure",    label: "Closure & Handover", icon: "check-circle",  roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] },
        { id: "team",      label: "Team Access",        icon: "user-check",   roles: ['admin'] }
      ];
      allowedTabs = manageTabs.filter(t => t.roles.includes(role));
    } else {
      allowedTabs = [
        { id: "overview", label: "Overview", icon: "activity", roles: ['admin','designer','engineer','vendor','client','architect','site_engineer'] }
      ];
    }

    // Default to the first allowed tab if current active tab is restricted for this role
    if (!allowedTabs.some(t => t.id === this.activeTab)) {
      this.activeTab = allowedTabs[0] ? allowedTabs[0].id : "overview";
    }

    // Header Metadata
    const totalSnags = proj.snags.filter(s => s.status === "Open").length;
    const pendingApps = proj.materials.filter(m => m.approved === "Pending").length;
    
    // Tab Navigation HTML
    const tabsHTML = `
      <div class="border-b border-border-color bg-secondary/50 p-1 rounded-lg flex overflow-x-auto gap-1 no-scrollbar no-print">
        ${allowedTabs.map(t => {
          const activeClass = this.activeTab === t.id 
            ? "bg-amber-500 text-black font-semibold shadow-sm" 
            : "text-secondary hover:text-white hover:bg-hover";
          
          let badge = "";
          if (t.id === "snags" && totalSnags > 0) {
            badge = `<span class="ml-1 text-[9px] px-1 rounded-full ${this.activeTab === t.id ? 'bg-black text-amber-500' : 'bg-rose-500/20 text-rose-400 font-bold'}">${totalSnags}</span>`;
          }
          if (t.id === "materials" && pendingApps > 0) {
            badge = `<span class="ml-1 text-[9px] px-1 rounded-full ${this.activeTab === t.id ? 'bg-black text-amber-500' : 'bg-amber-500/20 text-amber-400 font-bold'}">${pendingApps}</span>`;
          }
          
          return `
            <button onclick="window.ProjectPage.setTab('${t.id}')" class="px-3.5 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${activeClass}">
              <i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i>
              <span>${t.label}</span>
              ${badge}
            </button>
          `;
        }).join("")}
      </div>
    `;

    // Render Sub-Views
    let subViewContent = "";
    if (this.activeTab === "overview") subViewContent = this.renderOverview(proj, role);
    else if (this.activeTab === "design") subViewContent = this.renderDesign(proj, role);
    else if (this.activeTab === "execution") subViewContent = this.renderExecution(proj, role);
    else if (this.activeTab === "materials") subViewContent = this.renderMaterials(proj, role);
    else if (this.activeTab === "boq") subViewContent = this.renderBOQ(proj, role);
    else if (this.activeTab === "vendor") subViewContent = this.renderVendor(proj, role);
    else if (this.activeTab === "timeline") subViewContent = this.renderTimeline(proj, role);
    else if (this.activeTab === "snags") subViewContent = this.renderSnags(proj, role);
    else if (this.activeTab === "billing") subViewContent = this.renderBilling(proj, role);
    else if (this.activeTab === "documents") subViewContent = this.renderDocuments(proj, role);
    else if (this.activeTab === "team") subViewContent = this.renderTeam(proj, role);
    else if (this.activeTab === "decisions") subViewContent = this.renderDecisions(proj, role);
    else if (this.activeTab === "changes") subViewContent = this.renderChanges(proj, role);
    else if (this.activeTab === "closure") subViewContent = this.renderClosure(proj, role);

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Top Project bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-5">
          <div class="flex items-center gap-3">
            <button onclick="window.AppRouter.navigate('dashboard')" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white md:hidden" title="Back to Dashboard">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div class="flex items-center gap-2">
              <div>
                <h1 class="text-base font-bold text-white font-display flex items-center gap-2">
                  <span>${proj.name}</span>
                  <span onclick="window.ProjectPage.copyProjectIdToClipboard('${proj.id}')" class="cursor-pointer px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[9px] font-mono select-none flex items-center gap-1 font-normal" title="Click to copy unique project code">
                    <i data-lucide="copy" class="w-2.5 h-2.5"></i>
                    Code: ${proj.id}
                  </span>
                  ${role === 'admin' ? `
                    <button onclick="window.ProjectPage.editProject('${proj.id}')" class="p-1 hover:bg-hover rounded border border-transparent hover:border-border-color transition-colors" title="Edit Project Details">
                      <i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i>
                    </button>
                    <button onclick="window.ProjectPage.deleteProject('${proj.id}')" class="p-1 hover:bg-hover rounded border border-transparent hover:border-rose-500/40 transition-colors" title="Delete Project">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i>
                    </button>
                  ` : ""}
                </h1>
                <p class="text-xs text-secondary mt-0.5"><i data-lucide="map-pin" class="w-3 h-3 inline align-text-bottom mr-0.5"></i> ${proj.location}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <div class="text-right hidden md:block">
              <span class="text-[9px] text-muted uppercase block font-semibold">Budget Managed</span>
              <span class="font-mono text-white font-bold">${window.Utils.formatCurrency(proj.budget)}</span>
            </div>
            <button onclick="window.print()" class="p-2 bg-hover hover:bg-border-color border border-border-color rounded text-white" title="Print/Export BOQ Report">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Tab Panel navigation -->
        ${tabsHTML}
        
        <!-- Tab Content Viewport -->
        <div class="mt-4">${subViewContent}</div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    
    // Resolve any local db:// image resources asynchronously
    this.resolveDbImages();
    
    // Post-render binding if timeline tab is open
    if (this.activeTab === "timeline") {
      this.bindDragAndDrop(proj.id);
    }
    // Post-render binding if documents tab is open
    if (this.activeTab === "documents") {
      this.bindVaultDragAndDrop(proj.id);
    }
    // Post-render: load global users directory when team tab is open
    if (this.activeTab === "team") {
      setTimeout(() => this.loadGlobalUsersDirectory(proj.id), 100);
    }
  },

  // ==================== SUB-VIEWS RENDERERS ====================

  renderOverview(proj, role) {
    // 1. Next Milestone Countdown
    const nextIncomplete = proj.stages.find(s => s.status !== "Completed");
    let countdownHTML = "";
    if (nextIncomplete) {
      const today = new Date("2026-05-29");
      const deadline = new Date(nextIncomplete.deadline);
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let badge = diffDays < 0 
        ? `<span class="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-semibold font-mono animate-pulse">Delayed by ${Math.abs(diffDays)} Days</span>`
        : `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold font-mono">${diffDays} Days Left</span>`;
        
      countdownHTML = `
        <div class="card p-4 flex items-center justify-between">
          <div>
            <span class="text-[9px] text-muted uppercase font-semibold block">Next Target Milestone</span>
            <span class="text-xs font-bold text-white block mt-0.5">${nextIncomplete.name}</span>
            <span class="text-[10px] text-secondary">Target Date: ${window.Utils.formatDate(nextIncomplete.deadline)}</span>
          </div>
          ${badge}
        </div>
      `;
    }

    // 2. Heatmap
    const totalGridSquares = 28;
    const sampleLogs = [2, 4, 7, 10, 11, 14, 15, 16, 18, 20, 22, 23, 26, 27];
    let heatmapSquaresHTML = "";
    for (let i = 0; i < totalGridSquares; i++) {
      let greenColor = "bg-zinc-800";
      if (sampleLogs.includes(i)) {
        if (i % 3 === 0) greenColor = "bg-amber-800/40 border border-amber-600/35";
        else if (i % 2 === 0) greenColor = "bg-amber-600/60";
        else greenColor = "bg-amber-500";
      }
      heatmapSquaresHTML += `<div class="w-3 h-3 rounded-sm ${greenColor}" title="Day ${i}: Progress log submitted"></div>`;
    }

    const heatmapHTML = `
      <div class="card p-4">
        <span class="text-[9px] text-muted uppercase font-semibold block mb-2">Site Activity Graph</span>
        <div class="flex items-center gap-1.5">
          <div class="grid grid-flow-col grid-rows-7 gap-1 flex-shrink-0">
            ${heatmapSquaresHTML}
          </div>
          <div class="text-[10px] text-secondary leading-tight pl-2">
            <span class="block text-white font-bold">Continuous logs</span>
            Log updates daily to maintain consistent project records.
          </div>
        </div>
      </div>
    `;

    // 3. Quick Action Buttons based on Role
    let quickActionsHTML = "";
    const isSiteRoleOverview = role === "site_engineer" || role === "engineer";
    const isDesignRoleOverview = role === "architect" || role === "designer";
    const isAdminRoleOverview = role === "admin";

    if (isAdminRoleOverview || isSiteRoleOverview || isDesignRoleOverview) {
      let buttons = "";
      if (isAdminRoleOverview) {
        buttons = `
          <button onclick="openModal('add-update-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="plus" class="w-4 h-4 text-amber-500"></i> Log Update
          </button>
          <button onclick="openModal('add-snag-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-500"></i> Add Snag
          </button>
          <button onclick="openModal('add-material-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="trello" class="w-4 h-4 text-blue-400"></i> Select Material
          </button>
          <button onclick="openModal('add-document-modal', { folder: 'drawings' })" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="pen-tool" class="w-4 h-4 text-amber-500"></i> Upload Design
          </button>
          <button onclick="openModal('add-document-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="upload" class="w-4 h-4 text-cyan-400"></i> Add Document
          </button>
        `;
      } else if (isSiteRoleOverview) {
        buttons = `
          <button onclick="openModal('add-update-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="plus" class="w-4 h-4 text-amber-500"></i> Log Update
          </button>
          <button onclick="openModal('add-snag-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-500"></i> Add Snag
          </button>
          <button onclick="openModal('add-document-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="upload" class="w-4 h-4 text-cyan-400"></i> Add Document
          </button>
        `;
      } else if (isDesignRoleOverview) {
        buttons = `
          <button onclick="openModal('add-material-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="trello" class="w-4 h-4 text-blue-400"></i> Select Material
          </button>
          <button onclick="openModal('add-document-modal', { folder: 'drawings' })" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="pen-tool" class="w-4 h-4 text-amber-500"></i> Upload Design
          </button>
          <button onclick="openModal('add-document-modal')" class="p-2 bg-hover hover:bg-border-color rounded text-xs text-white border border-border-color/30 flex items-center gap-1.5 justify-center">
            <i data-lucide="upload" class="w-4 h-4 text-cyan-400"></i> Add Document
          </button>
        `;
      }

      quickActionsHTML = `
        <div class="card p-4 space-y-2">
          <span class="text-[9px] text-muted uppercase font-semibold block">Quick Actions</span>
          <div class="grid grid-cols-2 gap-2">
            ${buttons}
          </div>
        </div>
      `;
    }

    // 4. Team Info Card — with inline edit/delete for admin
    const teamRows = [
      { key: 'pm',       label: 'Project Manager', icon: 'briefcase' },
      { key: 'designer', label: 'Lead Architect',   icon: 'pen-tool'  },
      { key: 'engineer', label: 'Site Engineer',     icon: 'hard-hat'  },
    ];

    const teamHTML = `
      <div class="card p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[9px] text-muted uppercase font-semibold block">Site Execution Directory</span>
          ${role === 'admin' ? `<span class="text-[9px] text-amber-500/70 font-mono">tap ✏️ to edit</span>` : ''}
        </div>
        <div class="space-y-2 text-xs">
          ${teamRows.map(tr => `
            <div class="flex items-center justify-between pb-1.5 border-b border-border-color/40 last:border-0 last:pb-0">
              <span class="text-secondary flex items-center gap-1.5">
                <i data-lucide="${tr.icon}" class="w-3 h-3 text-muted"></i>
                ${tr.label}:
              </span>
              <div class="flex items-center gap-1.5">
                <span id="team-display-${proj.id}-${tr.key}" class="font-medium text-white">${proj.team[tr.key] || '—'}</span>
                ${role === 'admin' ? `
                  <button onclick="window.ProjectPage.inlineEditTeam('${proj.id}','${tr.key}')" class="p-0.5 rounded hover:bg-hover text-amber-500 opacity-60 hover:opacity-100 transition-opacity" title="Edit ${tr.label}">
                    <i data-lucide="edit-2" class="w-3 h-3"></i>
                  </button>
                  <button onclick="window.ProjectPage.clearTeamMember('${proj.id}','${tr.key}')" class="p-0.5 rounded hover:bg-hover text-rose-500 opacity-60 hover:opacity-100 transition-opacity" title="Clear ${tr.label}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;


    // 5. Recent Activity Timeline
    const recentActivityHTML = `
      <div class="card p-5 space-y-4">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-secondary">Activity feed</h3>
        <div class="space-y-4 border-l border-border-color pl-4 ml-2">
          ${proj.updates.slice(0, 3).map(u => `
            <div class="relative text-xs">
              <span class="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-primary"></span>
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white">Daily Log Uploaded</span>
                <span class="text-[9px] text-muted font-mono">${window.Utils.formatDate(u.date)}</span>
              </div>
              <p class="text-secondary leading-relaxed">${u.completed}</p>
              ${u.issues !== "None" ? `<p class="text-rose-400 mt-1 text-[10px]"><b>Issue logged:</b> ${u.issues}</p>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `;

    return `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-5 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-secondary">Project Completion Profile</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center bg-primary/40 p-4 rounded border border-border-color/30">
                <span class="text-xs text-muted block">Work Done</span>
                <span class="text-xl font-bold font-mono text-white block mt-1">${proj.progress}%</span>
              </div>
              <div class="text-center bg-primary/40 p-4 rounded border border-border-color/30">
                <span class="text-xs text-muted block">Open Snags</span>
                <span class="text-xl font-bold font-mono text-rose-400 block mt-1">${proj.snags.filter(s => s.status === 'Open').length}</span>
              </div>
              <div class="text-center bg-primary/40 p-4 rounded border border-border-color/30">
                <span class="text-xs text-muted block">Awaiting Client</span>
                <span class="text-xl font-bold font-mono text-amber-400 block mt-1">${proj.materials.filter(m => m.approved === 'Pending').length}</span>
              </div>
            </div>
            
            <div class="space-y-1">
              <label class="text-[10px] text-muted font-semibold uppercase">Project Notes & Specifications</label>
              <p class="text-xs text-secondary leading-relaxed p-3 bg-primary/20 border border-border-color/30 rounded italic">
                "${proj.notes}"
              </p>
            </div>
          </div>

          ${recentActivityHTML}
        </div>
        
        <div class="space-y-6">
          ${countdownHTML}
          ${heatmapHTML}
          ${quickActionsHTML}
          ${teamHTML}
        </div>
      </div>
    `;
  },

  renderDesign(proj, role) {
    const drawings = proj.vault.drawings || [];
    const isUploadingAllowed = role === "admin" || role === "designer" || role === "architect";

    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Project Detail Drawings</h3>
            <p class="text-xs text-secondary mt-0.5">Access official CAD blueprints, elevations, and kitchen production layouts.</p>
          </div>
          ${isUploadingAllowed ? `
            <button onclick="openModal('add-document-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Drawing
            </button>
          ` : ""}
        </div>

        <div class="space-y-2">
          ${drawings.map(d => `
            <div class="flex items-center justify-between text-xs p-3 bg-primary/20 hover:bg-hover/30 rounded border border-border-color/10">
              <div class="flex items-center gap-2.5 min-w-0">
                <i data-lucide="pen-tool" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
                <span class="truncate text-white font-medium">${d.name}</span>
                <span class="text-[9px] text-muted font-mono">(${d.size})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] text-muted font-mono mr-1.5">${window.Utils.formatDate(d.date)}</span>
                ${isUploadingAllowed ? `
                  <button onclick="window.ProjectPage.editDocument('${proj.id}', 'drawings', '${d.name}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Edit Drawing Name"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
                  <button onclick="window.ProjectPage.deleteDocument('${proj.id}', 'drawings', '${d.name}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete Drawing"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
                ` : ""}
                <button onclick="window.ProjectPage.viewDrawing('${proj.id}', '${d.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-hover hover:bg-border-color rounded border border-border-color/25 text-white flex items-center gap-1 text-[10px] uppercase font-bold font-mono">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Open Blueprint
                </button>
              </div>
            </div>
          `).join("")}
          ${drawings.length === 0 ? `<div class="p-6 text-center text-xs text-muted">No drawings uploaded yet.</div>` : ""}
        </div>
      </div>
    `;
  },

  renderExecution(proj, role) {
    const isEditingAllowed = role === "admin" || role === "engineer" || role === "site_engineer";
    
    return `
      <div class="space-y-6">
        <!-- Stages timeline -->
        <div class="card p-5 space-y-5">
          <div class="flex items-center justify-between border-b border-border-color pb-3">
            <div>
              <h3 class="text-sm font-bold text-white">Execution Timeline & Stages</h3>
              <p class="text-xs text-secondary mt-0.5">Track target progress bars and record stage completions on site.</p>
            </div>
          </div>
          
          <div class="space-y-5">
            ${proj.stages.map(st => {
              const hasReason = st.delayReason ? "block" : "hidden";
              return `
                <div class="border-b border-border-color last:border-0 pb-4 last:pb-0 text-xs">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <span class="font-bold text-white text-xs block">${st.name}</span>
                      <span class="text-[10px] text-muted block mt-0.5">Deadline: ${st.deadline ? window.Utils.formatDate(st.deadline) : "Not Specified"}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      ${isEditingAllowed ? `
                        <button onclick="window.ProjectPage.editStage('${proj.id}', '${st.name}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white flex items-center justify-center" title="Edit Stage Details">
                          <i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i>
                        </button>
                      ` : ""}
                      <div class="text-right">
                        <span class="px-2 py-0.5 rounded ${st.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : st.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-muted'} text-[10px] uppercase font-mono font-medium">${st.status}</span>
                        <span class="text-[10px] text-muted font-mono font-bold block mt-1">${st.progress}% Complete</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-2 bg-primary rounded-full overflow-hidden relative">
                      <div class="h-full bg-amber-500 rounded-full" style="width: ${st.progress}%"></div>
                    </div>
                    ${isEditingAllowed ? `
                      <input type="range" min="0" max="100" value="${st.progress}" 
                        onchange="window.ProjectPage.updateStageProgress('${proj.id}', '${st.name}', this.value)" 
                        class="w-20 md:w-32 accent-amber-500">
                    ` : ""}
                  </div>

                  <div class="mt-2 text-[10px] text-amber-500 bg-amber-500/5 p-2 rounded ${hasReason} border border-amber-500/10">
                    <b>Delay Risk Reason:</b> ${st.delayReason}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Expected Deliveries Tracker -->
          <div class="card p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-border-color pb-2">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-white">Expected Deliveries Tracker</h3>
                <span class="text-[10px] text-muted">Supply orders and dispatch dates</span>
              </div>
              ${isEditingAllowed ? `
                <button onclick="window.ProjectPage.addDelivery('${proj.id}')" class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1">
                  <i data-lucide="plus" class="w-3 h-3"></i> Order Dispatch
                </button>
              ` : ""}
            </div>
            
            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${proj.deliveries.map(d => `
                <div class="p-2.5 rounded border border-border-color bg-primary/20 text-xs flex justify-between items-center">
                  <div>
                    <span class="font-bold text-white block">${d.item}</span>
                    <span class="text-[10px] text-secondary">Qty: ${d.qty} • Expected: ${window.Utils.formatDate(d.date)}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded font-mono text-[9px] ${d.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${d.status}</span>
                    ${isEditingAllowed ? `
                      <button onclick="window.ProjectPage.editDelivery('${proj.id}', '${d.id}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/20 rounded text-white" title="Edit Delivery"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
                      <button onclick="window.ProjectPage.deleteDelivery('${proj.id}', '${d.id}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete Delivery"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
                    ` : ""}
                  </div>
                </div>
              `).join("")}
              ${proj.deliveries.length === 0 ? `<div class="p-4 text-center text-xs text-muted">No deliveries logged.</div>` : ""}
            </div>
          </div>

          <!-- Site Visit Schedule -->
          <div class="card p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-border-color pb-2">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-white">Site Visit Schedule</h3>
                <span class="text-[10px] text-muted">Designer & management site checklist</span>
              </div>
              ${isEditingAllowed ? `
                <button onclick="window.ProjectPage.addVisit('${proj.id}')" class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1">
                  <i data-lucide="plus" class="w-3 h-3"></i> Schedule Visit
                </button>
              ` : ""}
            </div>
            
            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${proj.visits.map(v => `
                <div class="p-2.5 rounded border border-border-color bg-primary/20 text-xs flex justify-between items-center">
                  <div>
                    <span class="font-bold text-white block">${v.visitor}</span>
                    <span class="text-[10px] text-secondary">${v.purpose} • ${window.Utils.formatDate(v.date)} @ ${v.time}</span>
                  </div>
                  ${isEditingAllowed ? `
                    <button onclick="window.ProjectPage.editVisit('${proj.id}', '${v.id}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/20 rounded text-white" title="Edit Visit"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
                    <button onclick="window.ProjectPage.deleteVisit('${proj.id}', '${v.id}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete Visit"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
                  ` : ""}
                </div>
              `).join("")}
              ${proj.visits.length === 0 ? `<div class="p-4 text-center text-xs text-muted">No visits scheduled.</div>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderMaterials(proj, role) {
    const isAddingAllowed = role === "admin" || role === "designer" || role === "architect";
    const isApprovingAllowed = role === "admin" || role === "client" || role === "designer" || role === "architect";
    
    // Mobile Accordion Cards View
    const mobileCards = proj.materials.map(m => {
      const isApproved = m.approved === "Approved";
      const isPending = m.approved === "Pending";
      
      return `
        <div class="bg-primary/45 border border-border-color/60 rounded-lg p-3 text-xs space-y-2">
          <div class="flex items-start justify-between">
            <div>
              <span class="font-bold text-white block">${m.name}</span>
              <span class="text-[9px] text-muted block mt-0.5">${m.brand} • Finish: ${m.finishCode}</span>
            </div>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${m.approved}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-[10px] text-secondary border-y border-border-color/25 py-2 my-2">
            <div>Rate: <b class="text-white">₹${m.rate}</b></div>
            <div>Vendor: <b class="text-white">${m.vendor}</b></div>
            <div class="col-span-2">Notes: <b class="text-white italic">"${m.notes || "Standard specification"}"</b></div>
          </div>
          
          <div class="flex items-center justify-between text-[10px]">
            <div class="flex gap-2">
              <span class="flex items-center gap-0.5 ${m.ordered ? 'text-emerald-400' : 'text-muted'}"><i data-lucide="check" class="w-3.5 h-3.5"></i> Ordered</span>
              <span class="flex items-center gap-0.5 ${m.delivered ? 'text-emerald-400' : 'text-muted'}"><i data-lucide="check" class="w-3.5 h-3.5"></i> Delivered</span>
            </div>
            
            <div class="flex gap-1.5">
              <button onclick="window.ProjectPage.editMaterial('${proj.id}', '${m.id}')" class="p-1 bg-hover hover:bg-border-color rounded border border-border-color/25 text-white" title="Edit Spec"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
              <button onclick="window.ProjectPage.deleteMaterial('${proj.id}', '${m.id}')" class="p-1 bg-hover hover:bg-border-color rounded border border-rose-500/20 text-white" title="Delete Material"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
              <button onclick="window.WhatsAppService.shareMaterialApproval('${proj.id}', '${m.id}')" class="p-1 text-secondary hover:text-white" title="WhatsApp Link"><i data-lucide="send" class="w-3.5 h-3.5 text-emerald-400"></i></button>
              ${isPending && isApprovingAllowed ? `
                <button onclick="window.ProjectPage.approveMaterialInline('${proj.id}', '${m.id}')" class="px-2 py-0.5 bg-amber-500 text-black font-semibold text-[9px] rounded hover:bg-amber-600">Approve</button>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Desktop Table View
    const desktopRows = proj.materials.map(m => {
      const isApproved = m.approved === "Approved";
      const isPending = m.approved === "Pending";
      
      return `
        <tr class="border-b border-border-color hover:bg-hover/30 text-xs">
          <td class="px-4 py-3">
            <span class="font-semibold text-white block">${m.name}</span>
            <span class="text-[9px] text-muted block mt-0.5">${m.brand} • Spec: ${m.finishCode}</span>
          </td>
          <td class="px-4 py-3 font-mono">${m.rate}</td>
          <td class="px-4 py-3 text-muted">${m.vendor}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'} text-[9px] uppercase font-mono font-medium">${m.approved}</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-4 text-[10px]">
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" ${m.ordered ? 'checked' : ''} onchange="window.ProjectPage.toggleMaterialStatus('${proj.id}', '${m.id}', 'ordered', this.checked)" class="accent-amber-500 rounded">
                <span class="${m.ordered ? 'text-white' : 'text-muted'}">Ordered</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" ${m.delivered ? 'checked' : ''} onchange="window.ProjectPage.toggleMaterialStatus('${proj.id}', '${m.id}', 'delivered', this.checked)" class="accent-amber-500 rounded">
                <span class="${m.delivered ? 'text-white' : 'text-muted'}">Delivered</span>
              </label>
            </div>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex gap-1.5 justify-end items-center">
              <button onclick="window.ProjectPage.editMaterial('${proj.id}', '${m.id}')" class="p-1 bg-hover hover:bg-border-color rounded border border-border-color/25 text-white" title="Edit Spec"><i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i></button>
              <button onclick="window.ProjectPage.deleteMaterial('${proj.id}', '${m.id}')" class="p-1 bg-hover hover:bg-border-color rounded border border-rose-500/20 text-white" title="Delete Material"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
              <button onclick="window.WhatsAppService.shareMaterialApproval('${proj.id}', '${m.id}')" class="p-1 text-secondary hover:text-white" title="WhatsApp Link"><i data-lucide="send" class="w-4 h-4 text-emerald-400"></i></button>
              ${isPending && isApprovingAllowed ? `
                <button onclick="window.ProjectPage.approveMaterialInline('${proj.id}', '${m.id}')" class="px-2.5 py-1 bg-amber-500 text-black font-semibold text-[10px] rounded hover:bg-amber-600">Approve</button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Materials tracker & Client approval log</h3>
            <p class="text-xs text-secondary mt-0.5">Tracks wood veneer codes, acrylic boards, quartz countertops and hardware items.</p>
          </div>
          ${isAddingAllowed ? `
            <button onclick="openModal('add-material-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Material
            </button>
          ` : ""}
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border-color text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                <th class="px-4 py-2 bg-primary">Item Details</th>
                <th class="px-4 py-2 bg-primary">Est Rate</th>
                <th class="px-4 py-2 bg-primary">Vendor</th>
                <th class="px-4 py-2 bg-primary">Status</th>
                <th class="px-4 py-2 bg-primary">Supply Tracking</th>
                <th class="px-4 py-2 bg-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${desktopRows}
            </tbody>
          </table>
        </div>

        <!-- Mobile Accordion Cards View -->
        <div class="block md:hidden space-y-3">
          ${mobileCards}
        </div>
      </div>
    `;
  },

  renderBOQ(proj, role) {
    const isEditingAllowed = role === "admin";
    
    // Sum calculations
    let estimationSum = 0;
    let actualSum = 0;
    
    proj.boq.forEach(item => {
      const grossRate = item.rate * (1 + item.margin / 100) * (1 + item.gst / 100);
      estimationSum += item.qty * grossRate;
      actualSum += item.actualCost || 0;
    });

    // Mobile Accordion Items HTML
    const mobileCards = proj.boq.map(item => {
      const grossRate = item.rate * (1 + item.margin / 100) * (1 + item.gst / 100);
      const totalCost = item.qty * grossRate;
      
      return `
        <div class="bg-primary/45 border border-border-color/60 rounded-lg p-3 text-xs space-y-2">
          <div class="flex items-start justify-between">
            <span class="font-bold text-white truncate max-w-[200px]">${item.description}</span>
            <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono uppercase text-secondary">${item.category}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-secondary border-t border-border-color/30 pt-2">
            <div>Rate: <b class="text-white">${window.Utils.formatCurrency(item.rate)}</b></div>
            <div>Qty: <b class="text-white">${item.qty}</b></div>
            <div>Margin: <b class="text-white">${item.margin}%</b></div>
            <div>GST: <b class="text-white">${item.gst}%</b></div>
          </div>
          <div class="flex justify-between items-center bg-secondary/50 p-1.5 rounded border border-border-color/25 mt-1">
            <span class="text-[9px] text-muted uppercase">Gross Estimate</span>
            <div class="flex items-center gap-2">
              <span class="font-mono text-amber-500 font-bold">${window.Utils.formatCurrency(totalCost)}</span>
              <button onclick="window.ProjectPage.editBOQ('${proj.id}', '${item.id}')" class="p-1 bg-hover hover:bg-border-color border border-border-color/20 rounded text-white"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
              <button onclick="window.ProjectPage.deleteBOQ('${proj.id}', '${item.id}')" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Desktop Table View
    const desktopRows = proj.boq.map(item => {
      const grossRate = item.rate * (1 + item.margin / 100) * (1 + item.gst / 100);
      const totalCost = item.qty * grossRate;
      
      return `
        <tr class="border-b border-border-color hover:bg-hover/30 text-xs">
          <td class="px-4 py-3 font-semibold text-[10px] uppercase tracking-wider text-muted font-mono">${item.category}</td>
          <td class="px-4 py-3 text-white max-w-xs truncate">${item.description}</td>
          <td class="px-4 py-3 text-right font-mono">${item.qty}</td>
          <td class="px-4 py-3 text-right font-mono">${window.Utils.formatCurrency(item.rate)}</td>
          <td class="px-4 py-3 text-right font-mono">${item.margin}%</td>
          <td class="px-4 py-3 text-right font-mono">${item.gst}%</td>
          <td class="px-4 py-3 text-right font-mono font-bold text-amber-500">${window.Utils.formatCurrency(totalCost)}</td>
          <td class="px-4 py-3 text-right">
            <div class="flex gap-1.5 justify-end">
              <button onclick="window.ProjectPage.editBOQ('${proj.id}', '${item.id}')" class="p-1.5 bg-hover hover:bg-border-color rounded border border-border-color/25 text-white" title="Edit BOQ Item"><i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i></button>
              <button onclick="window.ProjectPage.deleteBOQ('${proj.id}', '${item.id}')" class="p-1.5 bg-hover hover:bg-border-color rounded border border-rose-500/20 text-white" title="Delete BOQ Item"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">BOQ module cost estimates</h3>
            <p class="text-xs text-secondary mt-0.5">Detailed material quantities, builder margins, and final estimates.</p>
          </div>
          ${isEditingAllowed ? `
            <button onclick="openModal('add-boq-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add BOQ Item
            </button>
          ` : ""}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-primary/40 rounded border border-border-color/30 text-xs">
            <span class="text-muted block text-[10px] uppercase font-semibold">Total BOQ Estimate</span>
            <span class="text-base font-bold font-mono text-amber-500 block mt-1">${window.Utils.formatCurrency(estimationSum)}</span>
          </div>
          <div class="p-3 bg-primary/40 rounded border border-border-color/30 text-xs">
            <span class="text-muted block text-[10px] uppercase font-semibold">Logged Material Cost</span>
            <span class="text-base font-bold font-mono text-white block mt-1">${window.Utils.formatCurrency(actualSum)}</span>
          </div>
        </div>

        <!-- RESPONSIVE LAYOUT -->
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border-color text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                <th class="px-4 py-2 bg-primary">Category</th>
                <th class="px-4 py-2 bg-primary">Description</th>
                <th class="px-4 py-2 bg-primary text-right">Qty</th>
                <th class="px-4 py-2 bg-primary text-right">Base Rate</th>
                <th class="px-4 py-2 bg-primary text-right">Margin</th>
                <th class="px-4 py-2 bg-primary text-right">GST</th>
                <th class="px-4 py-2 bg-primary text-right">Total Est</th>
                <th class="px-4 py-2 bg-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${desktopRows}
            </tbody>
          </table>
        </div>

        <!-- Mobile Accordion Cards View -->
        <div class="block md:hidden space-y-3">
          ${mobileCards}
        </div>
      </div>
    `;
  },

  renderVendor(proj, role) {
    const store = window.AppStore;
    
    // Find vendors who have materials or snags assigned in this project
    const activeVendorNames = new Set();
    proj.materials.forEach(m => activeVendorNames.add(m.vendor));
    proj.snags.forEach(s => activeVendorNames.add(s.assignedTo));
    
    const assignedVendors = store.state.vendors.filter(v => activeVendorNames.has(v.name));

    return `
      <div class="card p-5 space-y-5">
        <div>
          <h3 class="text-sm font-bold text-white">Assigned Project Vendors</h3>
          <p class="text-xs text-secondary mt-0.5">List of subcontractors and material providers working on this project unit.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${assignedVendors.map(v => `
            <div class="bg-primary/45 border border-border-color rounded-lg p-4 text-xs flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-start justify-between">
                  <div>
                    <h4 class="text-sm font-bold text-white">${v.name}</h4>
                    <span class="text-[10px] text-muted block mt-0.5">${v.category}</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-amber-500/10 text-amber-500">
                    <i data-lucide="star" class="w-3 h-3 inline align-middle mr-0.5 fill-current"></i> ${v.rating.toFixed(1)}
                  </span>
                </div>
                <div class="border-t border-border-color/30 pt-2 text-[10px] text-secondary">
                  <div>Phone: <b class="text-white font-mono">${v.phone}</b></div>
                  <div class="mt-1">Delay History: <b class="text-white">${v.delayHistory} Risk</b></div>
                </div>
              </div>
              <div class="flex gap-2 justify-end mt-4 border-t border-border-color/30 pt-3">
                <a href="tel:${v.phone.replace(/\s+/g, '')}" class="px-2 py-1 bg-hover text-white text-[10px] rounded border border-border-color/25 font-semibold">Call</a>
                <a href="https://api.whatsapp.com/send?phone=${v.phone.replace(/[^+\d]/g, '')}" target="_blank" class="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded flex items-center gap-1">
                  <i data-lucide="phone" class="w-3 h-3"></i> WhatsApp Chat
                </a>
              </div>
            </div>
          `).join("")}
          ${assignedVendors.length === 0 ? `<div class="p-6 text-center text-xs text-muted col-span-2">No vendors assigned to materials or snags in this project yet.</div>` : ""}
        </div>
      </div>
    `;
  },

  activeTimelineSubTab: "log",
  activeRoomFilter: "All",

  setTimelineSubTab(subTab) {
    this.activeTimelineSubTab = subTab;
    window.AppRouter.refresh();
  },

  setRoomFilter(room) {
    this.activeRoomFilter = room;
    window.AppRouter.refresh();
  },

  handleSliderMove(e) {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    let x = 0;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX - rect.left;
    } else {
      x = e.clientX - rect.left;
    }
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;
    
    const clipDiv = container.querySelector("#after-image-clip");
    const handle = container.querySelector("#slider-handle");
    if (clipDiv) clipDiv.style.width = `${percent}%`;
    if (handle) handle.style.left = `${percent}%`;
  },

  uploadComparisonImage(projId, type, input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      window.ModalComponent.showToast("Image is too large. Please upload an image under 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const store = window.AppStore;
      const proj = (store.state.projects || []).find(p => p.id === projId);
      if (proj) {
        if (type === '2D') {
          proj.comparison2D = base64;
        } else {
          proj.comparisonRender = base64;
        }
        store.saveState();
        window.ModalComponent.showToast(`Uploaded ${type} image successfully.`);
        window.AppRouter.refresh();
      }
    };
    reader.readAsDataURL(file);
  },

  resetComparisonImages(projId) {
    const store = window.AppStore;
    const proj = (store.state.projects || []).find(p => p.id === projId);
    if (proj) {
      delete proj.comparison2D;
      delete proj.comparisonRender;
      store.saveState();
      window.ModalComponent.showToast("Reset to default comparison images.");
      window.AppRouter.refresh();
    }
  },

  generateCollage() {
    const container = document.getElementById("collage-output-container");
    const grid = document.getElementById("collage-grid");
    if (!container || !grid) return;
    
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === store.activeProjectId);
    if (!proj) return;
    
    const photos = proj.updates.map(u => u.photo).slice(0, 4);
    if (photos.length === 0) {
      photos.push("https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400");
    }
    
    grid.innerHTML = `
      <div class="col-span-2 text-center border-b border-border-color/20 pb-2 mb-1">
        <span class="text-[10px] text-amber-500 font-bold font-display uppercase tracking-widest block">Premio Living OS</span>
        <span class="text-[9px] text-muted block mt-0.5">${proj.name.split(" (")[0]} • Progress Compilation</span>
      </div>
      ${photos.map(p => `
        <div class="aspect-video bg-cover bg-center rounded relative border border-border-color/20" style="background-image: url('${p}')">
          <span class="absolute bottom-1 right-1 px-1 bg-black/60 rounded text-[7px] text-secondary font-mono">${new Date().toISOString().split('T')[0]}</span>
        </div>
      `).join("")}
    `;
    container.classList.remove("hidden");
    window.ModalComponent.showToast("Collage Grid compiled successfully!");
    if (window.lucide) lucide.createIcons();
  },
  
  shareCollageWhatsApp() {
    const store = window.AppStore;
    const proj = store.state.projects.find(p => p.id === store.activeProjectId);
    if (!proj) return;
    const text = `*Premio Living — Project Collage Sharing*\n\nHere is a compiled progress photo collage for *${proj.name.split(" (")[0]}* showing our latest execution status. We have logged this in the OS Command Center.`;
    window.WhatsAppService.shareText(text);
  },

  promptSharePopup(type, projId, referenceId) {
    window.WhatsAppService.pendingShare = { type, projId, referenceId };
    window.openModal("whatsapp-share-modal");
  },

  renderTimeline(proj, role) {
    const isAddingAllowed = role === "admin" || role === "engineer" || role === "site_engineer";
    const timelineSubTab = this.activeTimelineSubTab || "log";
    
    const subTabHeader = `
      <div class="flex gap-2 border-b border-border-color pb-3 mb-5">
        <button onclick="window.ProjectPage.setTimelineSubTab('log')" class="px-3 py-1.5 rounded text-xs transition-colors ${timelineSubTab === 'log' ? 'bg-amber-500 text-black font-semibold' : 'text-secondary hover:text-white bg-hover'}">Chronological Log</button>
        <button onclick="window.ProjectPage.setTimelineSubTab('gallery')" class="px-3 py-1.5 rounded text-xs transition-colors ${timelineSubTab === 'gallery' ? 'bg-amber-500 text-black font-semibold' : 'text-secondary hover:text-white bg-hover'}">Visual Gallery & Slider</button>
      </div>
    `;

    if (timelineSubTab === "gallery") {
      const currentRoomFilter = this.activeRoomFilter || "All";
      const roomCategories = ["All", "Kitchen", "Living", "Master Bedroom", "Bathroom"];
      
      const staticGalleryItems = [
        { room: "Kitchen", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400", title: "Modular cabinet framing" },
        { room: "Living", url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400", title: "Ceiling light channel alignment" },
        { room: "Master Bedroom", url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400", title: "Wardrobe veneer placement" },
        { room: "Bathroom", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400", title: "Floor leveling & tiler screed" }
      ];
      
      const updateGalleryItems = proj.updates
        .filter(u => u.photo)
        .map(u => {
          let room = "Living";
          const text = u.completed.toLowerCase();
          if (text.includes("kitchen") || text.includes("sink")) room = "Kitchen";
          else if (text.includes("bedroom") || text.includes("wardrobe")) room = "Master Bedroom";
          else if (text.includes("bath") || text.includes("tile") || text.includes("tiler")) room = "Bathroom";
          
          return {
            room,
            url: u.photo,
            title: u.completed,
            date: u.date
          };
        });
        
      const allGalleryItems = [...staticGalleryItems, ...updateGalleryItems];
      const filteredGallery = currentRoomFilter === "All" 
        ? allGalleryItems 
        : allGalleryItems.filter(item => item.room === currentRoomFilter);
        
      const img2D = proj.comparison2D || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800";
      const imgRender = proj.comparisonRender || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800";

      return `
        ${subTabHeader}
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Before After Slider -->
            <div class="card p-5 space-y-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-white">2D Layout vs 3D Render Comparison</h3>
              <p class="text-xs text-secondary font-medium">Drag the slider across the space to compare the 2D architectural drawing vs the 3D visual render.</p>
              
              <div class="relative w-full aspect-video rounded-lg overflow-hidden border border-border-color select-none cursor-ew-resize" 
                   id="before-after-container"
                   onmousemove="window.ProjectPage.handleSliderMove(event)"
                   ontouchmove="window.ProjectPage.handleSliderMove(event)">
                <img src="${img2D}" class="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="2D Layout">
                
                <div class="absolute inset-y-0 left-0 overflow-hidden pointer-events-none" id="after-image-clip" style="width: 50%;">
                  <img src="${imgRender}" class="absolute inset-y-0 left-0 w-full h-full object-cover max-w-none pointer-events-none" style="width: 100%; height: 100%;" alt="3D Render">
                </div>
                
                <div class="absolute inset-y-0 left-[50%] w-1 bg-amber-500 pointer-events-none flex items-center justify-center -translate-x-1/2" id="slider-handle">
                  <div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center shadow-2xl">
                    <i data-lucide="chevrons-left-right" class="w-3.5 h-3.5 text-black"></i>
                  </div>
                </div>
              </div>

              <!-- Upload controls -->
              <div class="flex flex-wrap gap-2.5 pt-2 border-t border-border-color/20 mt-3">
                <label class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[10px] text-white font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                  <i data-lucide="upload" class="w-3.5 h-3.5 text-amber-500"></i> Upload 2D Layout
                  <input type="file" accept="image/*" class="hidden" onchange="window.ProjectPage.uploadComparisonImage('${proj.id}', '2D', this)">
                </label>
                
                <label class="px-2.5 py-1.5 bg-hover hover:bg-border-color border border-border-color/60 rounded text-[10px] text-white font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                  <i data-lucide="upload" class="w-3.5 h-3.5 text-amber-500"></i> Upload 3D Render
                  <input type="file" accept="image/*" class="hidden" onchange="window.ProjectPage.uploadComparisonImage('${proj.id}', 'Render', this)">
                </label>

                ${(proj.comparison2D || proj.comparisonRender) ? `
                  <button onclick="window.ProjectPage.resetComparisonImages('${proj.id}')" class="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold rounded flex items-center gap-1.5 transition-all ml-auto">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Reset to Default
                  </button>
                ` : ''}
              </div>
            </div>
            
            <!-- Gallery grids -->
            <div class="card p-5 space-y-4">
              <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-white">Room-wise Progress Gallery</h3>
                <div class="flex gap-1 overflow-x-auto no-scrollbar">
                  ${roomCategories.map(r => `
                    <button onclick="window.ProjectPage.setRoomFilter('${r}')" class="px-2 py-1 rounded text-[10px] font-semibold transition-colors ${currentRoomFilter === r ? 'bg-amber-500 text-black' : 'text-secondary hover:text-white bg-hover'}">${r}</button>
                  `).join("")}
                </div>
              </div>
              
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                ${filteredGallery.map(g => `
                  <div class="group relative rounded overflow-hidden aspect-video bg-primary border border-border-color cursor-pointer" onclick="window.open('${g.url}', '_blank')">
                    <img src="${g.url}" alt="${g.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2 text-[10px]">
                      <span class="px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-mono w-max font-bold mb-1 uppercase">${g.room}</span>
                      <span class="font-bold text-white block truncate">${g.title}</span>
                      ${g.date ? `<span class="text-muted block text-[8px] mt-0.5 font-mono">${window.Utils.formatDate(g.date)}</span>` : ""}
                    </div>
                  </div>
                `).join("")}
                ${filteredGallery.length === 0 ? `<div class="p-6 text-center text-xs text-muted col-span-3">No images match this filter.</div>` : ""}
              </div>
            </div>
            
          </div>
          
          <div class="space-y-6">
            <!-- Collage compiler widget -->
            <div class="card p-5 space-y-4">
              <div class="flex justify-between items-center border-b border-border-color/30 pb-2">
                <h3 class="text-xs font-bold uppercase tracking-wider text-white">Grid Compilation Collage</h3>
                <button onclick="window.ProjectPage.generateCollage()" class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold rounded flex items-center gap-1">
                  <i data-lucide="grid" class="w-3.5 h-3.5"></i> Compile Grid
                </button>
              </div>
              <p class="text-xs text-secondary leading-relaxed">Combine recent progress snapshots into a single layout graphic to verify spacing alignments with client panel.</p>
              
              <div id="collage-output-container" class="hidden space-y-3">
                <div class="bg-zinc-950 p-3 rounded border border-border-color/50" id="collage-grid"></div>
                <button onclick="window.ProjectPage.shareCollageWhatsApp()" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors">
                  <i data-lucide="send" class="w-4 h-4"></i> Share to WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const events = [];
    
    proj.updates.forEach((u, idx) => {
      events.push({
        date: u.date,
        type: "update",
        title: "Daily Site Log Submitted",
        content: u.completed,
        details: (() => {
          let html = `<div class="space-y-1.5 mt-2 text-[11px] bg-primary/20 border border-border-color/30 rounded p-2.5">`;
          
          if (u.supervisor) {
            html += `<div>Site Supervisor: <span class="text-white font-semibold">${u.supervisor}</span></div>`;
          }
          
          html += `<div>Workers on-site: <b>${u.workersCount}</b>`;
          if (u.labour && Object.values(u.labour).some(v => v > 0)) {
            const l = u.labour;
            html += ` <span class="text-muted font-mono text-[10px]">(`;
            const parts = [];
            if (l.carpenter) parts.push(`Carp: ${l.carpenter}`);
            if (l.helper) parts.push(`Help: ${l.helper}`);
            if (l.painter) parts.push(`Paint: ${l.painter}`);
            if (l.electrician) parts.push(`Elec: ${l.electrician}`);
            if (l.plumber) parts.push(`Plumb: ${l.plumber}`);
            html += parts.join(", ") + `)</span>`;
          }
          html += `</div>`;

          if (u.wip) {
            html += `<div class="mt-1">Work In Progress (WIP): <span class="text-white">${u.wip}</span></div>`;
          }

          if (u.materialReceived) {
            html += `<div>Material Received Today: <span class="text-emerald-400 font-medium">${u.materialReceived}</span></div>`;
          }
          if (u.materialPending) {
            html += `<div>Material Pending / Delayed: <span class="text-amber-500 font-medium">${u.materialPending}</span></div>`;
          }

          if (u.tradeProgress && Object.values(u.tradeProgress).some(v => v > 0)) {
            html += `<div class="bg-primary/30 p-1.5 rounded border border-border-color/30 text-[10px] mt-1">`;
            html += `<span class="text-secondary font-bold uppercase block mb-1">Trade Progress:</span>`;
            html += `<div class="grid grid-cols-2 gap-x-2 gap-y-0.5">`;
            Object.entries(u.tradeProgress).forEach(([trade, val]) => {
              if (val > 0) {
                html += `<div>${trade.charAt(0).toUpperCase() + trade.slice(1)}: <span class="font-bold text-white font-mono">${val}%</span></div>`;
              }
            });
            html += `</div></div>`;
          }

          if (u.delay && u.delay.type) {
            html += `<div class="bg-rose-950/15 border border-rose-500/20 p-1.5 rounded text-[10px] text-rose-300 mt-1">`;
            html += `⚠️ <b>${u.delay.type}</b> reported by ${u.delay.owner}: <i>${u.delay.reason}</i> (Resolution: ${u.delay.expectedResolutionDate})`;
            html += `</div>`;
          } else if (u.issues && u.issues !== 'None') {
            html += `<div class="text-rose-400">Issues faced: <b>${u.issues}</b></div>`;
          }

          if (u.tomorrowPlanText) {
            html += `<div class="mt-1"><span class="text-secondary font-bold">Tomorrow's Plan:</span> <span class="text-white">${u.tomorrowPlanText}</span></div>`;
          }
          if (u.tomorrowChecklist && u.tomorrowChecklist.length > 0) {
            html += `<div class="mt-1"><span class="text-secondary font-bold">Tomorrow Actions Checklist:</span>`;
            html += `<ul class="list-disc list-inside text-muted pl-1.5 mt-0.5">`;
            u.tomorrowChecklist.forEach(c => {
              html += `<li>${c}</li>`;
            });
            html += `</ul></div>`;
          } else if (u.tomorrowPlan && !u.tomorrowPlanText) {
            html += `<div>Target tomorrow: <i>${u.tomorrowPlan}</i></div>`;
          }

          if (u.photoDetails && (u.photoDetails.area || u.photoDetails.remarks)) {
            html += `<div class="text-[10px] text-muted italic mt-1 border-t border-border-color/10 pt-1">`;
            if (u.photoDetails.area) html += `Area: ${u.photoDetails.area}`;
            if (u.photoDetails.remarks) html += ` — ${u.photoDetails.remarks}`;
            html += `</div>`;
          }

          html += `</div>`;
          return html;
        })(),
        photo: u.photo,
        editAction: `window.ProjectPage.editUpdate('${proj.id}', ${idx})`,
        deleteAction: `window.ProjectPage.deleteUpdate('${proj.id}', ${idx})`,
        shareAction: `window.ProjectPage.promptSharePopup('daily-log', '${proj.id}', '${u.date}')`
      });
    });
    
    proj.snags.forEach(s => {
      events.push({
        date: s.deadline,
        type: "snag",
        title: `Defect Card Registered (${s.priority} Priority)`,
        content: `<b>[${s.area}]</b> ${s.issue}`,
        details: `Contractor: <b>${s.assignedTo}</b> • Status: <span class="${s.status === 'Closed' ? 'text-emerald-400' : 'text-rose-400'} font-bold">${s.status}</span>`,
        editAction: `window.ProjectPage.editSnag('${proj.id}', '${s.id}')`,
        deleteAction: `window.ProjectPage.deleteSnag('${proj.id}', '${s.id}')`,
        shareAction: `window.ProjectPage.promptSharePopup('snag', '${proj.id}', '${s.id}')`
      });
    });
    
    proj.materials.forEach(m => {
      m.approvalLog.forEach(log => {
        const approvalDate = log.timestamp.split(" ")[0];
        events.push({
          date: approvalDate,
          type: "approval",
          title: "Material Spec Approved",
          content: `Approved: <b>${m.name}</b> by ${log.user}`,
          details: `Brand: ${m.brand} • Finish Code: ${m.finishCode} • Rate: ${window.Utils.formatCurrency(m.rate)}`,
          editAction: `window.ProjectPage.editMaterial('${proj.id}', '${m.id}')`,
          shareAction: `window.ProjectPage.promptSharePopup('material-approval', '${proj.id}', '${m.id}')`
        });
      });
    });
    
    proj.billing.forEach(b => {
      events.push({
        date: b.date,
        type: "invoice",
        title: b.status === "Paid" ? "Payment Milestone Released" : "Invoice Raised",
        content: `Milestone: <b>${b.type}</b> (Inv: ${b.invoiceNo})`,
        details: `Amount: <b class="text-amber-500 font-mono">${window.Utils.formatCurrency(b.amount)}</b> • Status: <span class="font-bold uppercase">${b.status}</span>`,
        editAction: `window.ProjectPage.editInvoice('${proj.id}', '${b.invoiceNo}')`,
        deleteAction: `window.ProjectPage.deleteInvoice('${proj.id}', '${b.invoiceNo}')`,
        shareAction: `window.ProjectPage.promptSharePopup('payment-reminder', '${proj.id}', '${b.invoiceNo}')`
      });
    });
    
    proj.deliveries.forEach(d => {
      events.push({
        date: d.date,
        type: "delivery",
        title: d.status === "Delivered" ? "Supply Order Delivered" : "Expected Order Dispatch",
        content: `Item: <b>${d.item}</b> (Qty: ${d.qty})`,
        details: `Status: <span class="font-bold uppercase">${d.status}</span>`,
        editAction: `window.ProjectPage.editDelivery('${proj.id}', '${d.id}')`,
        deleteAction: `window.ProjectPage.deleteDelivery('${proj.id}', '${d.id}')`
      });
    });
    
    proj.visits.forEach(v => {
      events.push({
        date: v.date,
        type: "visit",
        title: "Site Coordinator Visit Scheduled",
        content: `Visitor: <b>${v.visitor}</b>`,
        details: `Purpose: ${v.purpose} @ ${v.time}`,
        editAction: `window.ProjectPage.editVisit('${proj.id}', '${v.id}')`,
        deleteAction: `window.ProjectPage.deleteVisit('${proj.id}', '${v.id}')`
      });
    });

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    const getTypeConfig = (type) => {
      switch(type) {
        case "update": return { icon: "camera", color: "text-amber-500 bg-amber-500/10 border-amber-500/25" };
        case "snag": return { icon: "alert-triangle", color: "text-rose-400 bg-rose-500/10 border-rose-500/25" };
        case "approval": return { icon: "check-circle", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" };
        case "invoice": return { icon: "receipt", color: "text-purple-400 bg-purple-500/10 border-purple-500/25" };
        case "delivery": return { icon: "truck", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" };
        case "visit": return { icon: "calendar", color: "text-blue-400 bg-blue-500/10 border-blue-500/25" };
        default: return { icon: "info", color: "text-muted bg-primary border-border-color" };
      }
    };

    return `
      ${subTabHeader}
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 card p-5 space-y-6">
          <div class="flex items-center justify-between border-b border-border-color/30 pb-3">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-white">Chronological visual project activity</h3>
              <span class="text-[10px] text-muted">Consolidated stream of client feedback, milestones, and site log updates</span>
            </div>
            ${isAddingAllowed ? `
              <button onclick="openModal('add-update-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Log Site Update
              </button>
            ` : ""}
          </div>
          
          <div class="space-y-6 border-l border-border-color/60 pl-5 ml-3 relative">
            ${events.map(ev => {
              const config = getTypeConfig(ev.type);
              
              return `
                <div class="relative text-xs">
                  <span class="absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border font-semibold ${config.color}">
                    <i data-lucide="${config.icon}" class="w-3.5 h-3.5"></i>
                  </span>
                  
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="font-bold text-white text-sm block">${ev.title}</span>
                      <span class="text-[9px] text-muted font-mono block mt-0.5">${window.Utils.formatDate(ev.date)}</span>
                    </div>
                    <div class="flex gap-1">
                      ${ev.editAction ? `
                        <button onclick="${ev.editAction}" class="p-1 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Edit Item"><i data-lucide="edit-2" class="w-3 h-3 text-amber-500"></i></button>
                      ` : ""}
                      ${ev.deleteAction ? `
                        <button onclick="${ev.deleteAction}" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-white" title="Delete Item"><i data-lucide="trash-2" class="w-3 h-3 text-rose-500"></i></button>
                      ` : ""}
                      ${ev.shareAction ? `
                        <button onclick="${ev.shareAction}" class="p-1 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Share via WhatsApp"><i data-lucide="send" class="w-3 h-3 text-emerald-400"></i></button>
                      ` : ""}
                      ${ev.type === 'update' ? `
                        <button onclick="openModal('daily-report-modal', { projectId: '${proj.id}', updateDate: '${ev.date}' })" class="p-1 bg-hover hover:bg-border-color border border-border-color/25 rounded text-white" title="Generate Daily Report"><i data-lucide="file-text" class="w-3 h-3 text-purple-400"></i></button>
                      ` : ""}
                    </div>
                  </div>
                  
                  <div class="mt-2 text-secondary bg-primary/20 border border-border-color/20 p-3 rounded-lg leading-relaxed space-y-1.5">
                    <p class="text-white font-medium">${ev.content}</p>
                    <p class="text-[10px] text-secondary leading-normal border-t border-border-color/10 pt-1.5">${ev.details}</p>
                    ${ev.photo ? `
                      <div class="mt-2 rounded overflow-hidden max-w-sm aspect-video border border-border-color/20 cursor-pointer" onclick="window.open('${ev.photo}', '_blank')">
                        <img src="${ev.photo}" class="w-full h-full object-cover">
                      </div>
                    ` : ""}
                  </div>
                </div>
              `;
            }).join("")}
            ${events.length === 0 ? `<div class="p-6 text-center text-xs text-muted">No chronological logs logged.</div>` : ""}
          </div>
        </div>
        
        <div class="space-y-6">
          ${isAddingAllowed ? `
            <div class="card p-5 space-y-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-white">Direct drag log submitter</h3>
              
              <div id="image-drag-drop" class="border-2 border-dashed border-border-color hover:border-amber-500 rounded-lg p-5 text-center cursor-pointer transition-colors relative">
                <input type="file" id="file-uploader" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer">
                <div class="flex flex-col items-center justify-center text-xs">
                  <i data-lucide="camera" class="w-8 h-8 text-muted mb-2"></i>
                  <span class="font-semibold text-white">Drag & drop photo or camera</span>
                  <span class="text-[10px] text-muted mt-1 block font-medium">Auto-compresses for quick bandwidth uploading</span>
                </div>
              </div>
              
              <div id="upload-progress-container" class="hidden text-xs space-y-1">
                <div class="flex justify-between items-center text-[10px] text-secondary">
                  <span>Compressing & uploading image...</span>
                  <span id="upload-percent" class="font-mono">0%</span>
                </div>
                <div class="w-full h-1 bg-primary rounded-full overflow-hidden">
                  <div id="upload-bar" class="h-full bg-amber-500 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
              
              <div id="attached-preview-gallery" class="grid grid-cols-3 gap-2 hidden"></div>
              
              <div class="space-y-3 text-xs">
                <div>
                  <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Labour Strength On Site</label>
                  <input type="number" id="update-side-workers" value="6" class="w-full p-2 bg-primary border border-border-color rounded text-white text-xs">
                </div>
                <div>
                  <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Work Completed Today</label>
                  <textarea id="update-side-completed" placeholder="Describe wood framing or tiling works completed..." rows="3" class="w-full p-2 bg-primary border border-border-color rounded text-white text-xs"></textarea>
                </div>
                <div>
                  <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Issues faced</label>
                  <input type="text" id="update-side-issues" placeholder="None" class="w-full p-2 bg-primary border border-border-color rounded text-white text-xs">
                </div>
                <div>
                  <label class="block text-[9px] text-muted uppercase font-semibold mb-1">Target for Tomorrow</label>
                  <input type="text" id="update-side-tomorrow" placeholder="What will be installed tomorrow?" class="w-full p-2 bg-primary border border-border-color rounded text-white text-xs">
                </div>
                
                <button onclick="window.ProjectPage.submitSideUpdateLog('${proj.id}')" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 mt-2">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i> Submit Site Update (30s)
                </button>
              </div>
            </div>
          ` : `<div class="p-5 text-xs italic text-muted card flex items-center justify-center">Log submission restricted to Site Engineers.</div>`}
        </div>
      </div>
    `;
  },

  renderSnags(proj, role) {
    const isVendor = role === "vendor";
    const snags = proj.snags.filter(s => {
      if (isVendor) return s.assignedTo === "Wood Crafts";
      return true;
    });

    const isAddingAllowed = role === "admin" || role === "engineer" || role === "site_engineer";
    const isEditingAllowed = role === "admin" || role === "engineer" || role === "site_engineer";

    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Active Site Snag & Defect list</h3>
            <p class="text-xs text-secondary mt-0.5">Listing minor architectural deviations and contractor defect correction cards.</p>
          </div>
          ${isAddingAllowed ? `
            <button onclick="openModal('add-snag-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Snag
            </button>
          ` : ""}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${snags.map(s => {
            const isClosed = s.status === "Closed";
            
            return `
              <div class="bg-primary/45 border ${s.priority === 'High' && !isClosed ? 'border-red-500/25' : 'border-border-color'} rounded-lg p-4 text-xs flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="px-1.5 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${s.priority === 'High' ? 'bg-red-500/10 text-red-400' : s.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-muted'}">${s.priority} Priority</span>
                      <h4 class="text-sm font-bold text-white mt-1.5">${s.area} — ${s.issue}</h4>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[9px] uppercase font-mono font-medium ${isClosed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${s.status}</span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-[10px] text-secondary mt-3 border-t border-border-color/30 pt-3">
                    <div>Contractor: <b class="text-white">${s.assignedTo}</b></div>
                    <div>Target Date: <b class="text-white">${window.Utils.formatDate(s.deadline)}</b></div>
                  </div>
                </div>

                <div class="flex justify-end gap-2 mt-4 border-t border-border-color/30 pt-3 flex-wrap">
                  ${isEditingAllowed ? `
                  <button onclick="window.ProjectPage.editSnag('${proj.id}', '${s.id}')" class="px-2.5 py-1.5 bg-hover text-white rounded border border-border-color/30 hover:bg-border-color flex items-center gap-1" title="Edit Snag Spec">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i> Edit
                  </button>
                  <button onclick="window.ProjectPage.deleteSnag('${proj.id}', '${s.id}')" class="px-2.5 py-1.5 bg-hover text-white rounded border border-rose-500/30 hover:bg-border-color flex items-center gap-1" title="Delete Snag">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i> Delete
                  </button>
                  ` : ""}
                  <button onclick="window.WhatsAppService.shareSnag('${proj.id}', '${s.id}')" class="px-2.5 py-1.5 bg-hover text-white rounded border border-border-color/30 hover:bg-border-color flex items-center gap-1">
                    <i data-lucide="send" class="w-3.5 h-3.5 text-emerald-400"></i> WhatsApp
                  </button>
                  ${!isClosed && isEditingAllowed ? `
                    <button onclick="window.ProjectPage.resolveSnag('${proj.id}', '${s.id}')" class="px-2.5 py-1.5 bg-amber-500 text-black font-semibold rounded hover:bg-amber-600">Resolve Defect</button>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
          ${snags.length === 0 ? `<div class="p-6 text-center text-xs text-muted col-span-2">No active snags found.</div>` : ""}
        </div>
      </div>
    `;
  },

  renderBilling(proj, role) {
    const isAddingAllowed = role === "admin";
    
    // Sum calculations
    let totalBilled = 0;
    let totalPending = 0;
    proj.billing.forEach(b => {
      if (b.status === "Paid") totalBilled += b.amount;
      else totalPending += b.amount;
    });

    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Payment milestone billing</h3>
            <p class="text-xs text-secondary mt-0.5">Raised client invoices, release status, and pending payment schedules.</p>
          </div>
          ${isAddingAllowed ? `
            <button onclick="openModal('add-invoice-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Raise Invoice
            </button>
          ` : ""}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-primary/40 rounded border border-border-color/30 text-xs">
            <span class="text-muted block text-[10px] uppercase font-semibold">Total Revenue Released</span>
            <span class="text-base font-bold font-mono text-emerald-400 block mt-1">${window.Utils.formatCurrency(totalBilled)}</span>
          </div>
          <div class="p-3 bg-primary/40 rounded border border-border-color/30 text-xs">
            <span class="text-muted block text-[10px] uppercase font-semibold">Pending Client Balance</span>
            <span class="text-base font-bold font-mono text-amber-500 block mt-1">${window.Utils.formatCurrency(totalPending)}</span>
          </div>
        </div>

        <div class="space-y-3">
          ${proj.billing.map(b => {
            const isPaid = b.status === "Paid";
            
            return `
              <div class="flex items-center justify-between text-xs p-3 bg-primary/30 rounded border border-border-color/30">
                <div>
                  <span class="font-bold text-white block text-sm">${window.Utils.formatCurrency(b.amount)}</span>
                  <span class="text-[9px] text-muted block mt-0.5">${b.invoiceNo} • ${b.type} • Date: ${window.Utils.formatDate(b.date)}</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-end">
                  <span class="px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${b.status}</span>
                  <button onclick="window.ProjectPage.editInvoice('${proj.id}', '${b.invoiceNo}')" class="p-1 bg-hover hover:bg-border-color rounded border border-border-color/30 text-white flex items-center gap-1" title="Edit Invoice Details"><i data-lucide="edit-2" class="w-3.5 h-3.5 text-amber-500"></i></button>
                  <button onclick="window.ProjectPage.deleteInvoice('${proj.id}', '${b.invoiceNo}')" class="p-1 bg-hover hover:bg-border-color rounded border border-rose-500/20 text-white flex items-center gap-1" title="Delete Invoice"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-500"></i></button>
                  <button onclick="window.WhatsAppService.sharePaymentInvoice('${proj.id}', '${b.invoiceNo}')" class="p-1.5 bg-hover hover:bg-border-color rounded border border-border-color/30 text-white flex items-center gap-1" title="Share reminder link">
                    <i data-lucide="send" class="w-3.5 h-3.5 text-emerald-400"></i>
                  </button>
                  ${!isPaid && (role === "admin" || role === "client") ? `
                    <button onclick="window.ProjectPage.releasePaymentInline('${proj.id}', '${b.invoiceNo}')" class="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-bold rounded hover:bg-amber-600 transition-colors">Release</button>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  renderDocuments(proj, role) {
    const isUploadingAllowed = ['admin', 'architect', 'designer', 'site_engineer', 'engineer'].includes(role);
    const store = window.AppStore;
    
    // Aggregates
    const drawings = proj.vault?.drawings || [];
    const agreements = proj.vault?.agreements || [];
    const approvedMaterials = (proj.materials || []).filter(m => m.approved === 'Approved');
    const projectRFQs = (store.state.rfqs || []).filter(r => r.projectId === proj.id);
    const projectPOs = (store.state.purchaseOrders || []).filter(po => po.projectId === proj.id);
    const billing = proj.billing || [];
    const photos = (proj.updates || []).filter(u => u.photo && u.photo !== '#');
    const decisions = proj.decisions || [];

    return `
      <div class="card p-5 space-y-6">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Knowledge Vault & Project Archive</h3>
            <p class="text-xs text-secondary mt-0.5">Centralized repository aggregating drawings, approvals, RFQs, POs, payments, photos, and decisions for ${proj.name.split(' (')[0]}.</p>
          </div>
          ${isUploadingAllowed ? `
            <button onclick="openModal('add-document-modal')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Document
            </button>
          ` : ""}
        </div>

        ${isUploadingAllowed ? `
          <div id="vault-drag-drop" class="border-2 border-dashed border-border-color/60 hover:border-amber-500 rounded-lg p-4 text-center cursor-pointer transition-colors relative bg-primary/20 hover:bg-hover/20">
            <input type="file" id="vault-file-uploader" class="absolute inset-0 opacity-0 cursor-pointer">
            <div class="flex flex-col items-center justify-center text-xs space-y-1">
              <i data-lucide="file-plus" class="w-6 h-6 text-amber-500"></i>
              <span class="font-semibold text-white">Drag & drop a file here, or click to browse</span>
              <span class="text-[9px] text-muted">Supports PDFs, blueprints, agreements, Excel sheets, and photos</span>
            </div>
          </div>
        ` : ""}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- 1. Drawings -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="pen-tool" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Design Drawings & Blueprints (${drawings.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${drawings.map(d => `
                  <div class="flex items-center justify-between text-xs p-2 bg-primary/20 rounded border border-border-color/10 hover:bg-hover/10">
                    <span class="truncate text-white font-medium max-w-[180px]">${d.name}</span>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <span class="text-[9px] text-muted font-mono font-semibold">${d.size}</span>
                      <button onclick="window.ProjectPage.viewDrawing('${proj.id}', '${d.name.replace(/'/g, "\\'")}')" class="p-1 bg-hover border border-border-color/20 rounded text-white text-[9px] font-mono hover:border-amber-500/30">OPEN</button>
                    </div>
                  </div>
                `).join('')}
                ${drawings.length === 0 ? `<span class="text-[9px] text-muted italic block">No drawings uploaded</span>` : ''}
              </div>
            </div>

            <!-- 2. Agreements -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="file-signature" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Contracts & Agreements (${agreements.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${agreements.map(a => `
                  <div class="flex items-center justify-between text-xs p-2 bg-primary/20 rounded border border-border-color/10 hover:bg-hover/10">
                    <span class="truncate text-white font-medium max-w-[180px]">${a.name}</span>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <span class="text-[9px] text-muted font-mono font-semibold">${a.size}</span>
                      <button onclick="window.ProjectPage.viewVaultDocument('${proj.id}', 'agreements', '${a.name.replace(/'/g, "\\'")}')" class="p-1 bg-hover border border-border-color/20 rounded text-white text-[9px] font-mono hover:border-amber-500/30">OPEN</button>
                    </div>
                  </div>
                `).join('')}
                ${agreements.length === 0 ? `<span class="text-[9px] text-muted italic block">No agreements uploaded</span>` : ''}
              </div>
            </div>

            <!-- 3. Approved Materials -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="trello" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Approved Materials & Specs (${approvedMaterials.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${approvedMaterials.map(m => `
                  <div class="p-2 bg-primary/25 border border-border-color/10 rounded flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-white block">${m.name}</span>
                      <span class="text-[9px] text-secondary font-mono">${m.brand} • Code: ${m.finishCode}</span>
                    </div>
                    <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">Approved</span>
                  </div>
                `).join('')}
                ${approvedMaterials.length === 0 ? `<span class="text-[9px] text-muted italic block">No approved materials found</span>` : ''}
              </div>
            </div>

            <!-- 4. RFQs Quotations -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="file-question" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Quotes & RFQs Associated (${projectRFQs.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${projectRFQs.map(r => `
                  <div onclick="window.AppRouter.navigate('rfqs')" class="p-2 bg-primary/20 border border-border-color/10 hover:border-amber-500/35 hover:bg-hover/10 cursor-pointer rounded flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-white block">${r.rfqNumber} — ${r.itemDescription}</span>
                      <span class="text-[9px] text-secondary font-mono">Quotes Recd: ${r.quotes?.length || 0} • Status: ${r.status}</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-muted"></i>
                  </div>
                `).join('')}
                ${projectRFQs.length === 0 ? `<span class="text-[9px] text-muted italic block">No RFQs created for this project</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- 5. Purchase Orders -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="clipboard-signature" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Purchase Orders Released (${projectPOs.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${projectPOs.map(po => `
                  <div onclick="window.AppRouter.navigate('pos')" class="p-2 bg-primary/20 border border-border-color/10 hover:border-amber-500/35 hover:bg-hover/10 cursor-pointer rounded flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-white block">${po.poNumber} — ${po.vendorName}</span>
                      <span class="text-[9px] text-secondary font-mono">Total: ${window.Utils.formatCurrency(po.grandTotal)} • Status: ${po.status}</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-muted"></i>
                  </div>
                `).join('')}
                ${projectPOs.length === 0 ? `<span class="text-[9px] text-muted italic block">No POs released for this project</span>` : ''}
              </div>
            </div>

            <!-- 6. Payments & Billing -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="credit-card" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Milestone Invoices & Collections (${billing.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${billing.map(b => `
                  <div class="p-2 bg-primary/20 border border-border-color/10 rounded flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-white block">${b.type} (${b.invoiceNo})</span>
                      <span class="text-[9px] text-secondary font-mono">Date: ${window.Utils.formatDate(b.date)} • Amt: ${window.Utils.formatCurrency(b.amount)}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${b.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${b.status}</span>
                  </div>
                `).join('')}
                ${billing.length === 0 ? `<span class="text-[9px] text-muted italic block">No milestone invoices raised</span>` : ''}
              </div>
            </div>

            <!-- 7. Progress Photos -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="camera" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Progress Photo Archives (${photos.length})</h4>
              </div>
              <div class="grid grid-cols-3 gap-2 pl-6">
                ${photos.map((u, pidx) => `
                  <div class="group relative rounded overflow-hidden border border-border-color/40 bg-primary/30 h-16 cursor-pointer hover:border-amber-500/50"
                    onclick="window.ProjectPage.viewDocument('${u.photo.replace(/'/g, "\\'")}', 'Progress Photo ${u.date}')">
                    <img src="${u.photo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <div class="absolute inset-x-0 bottom-0 bg-black/75 p-0.5 text-[8px] text-center text-white font-mono truncate">${window.Utils.formatDate(u.date)}</div>
                  </div>
                `).join('')}
                ${photos.length === 0 ? `<span class="text-[9px] text-muted italic col-span-3">No progress photos logged</span>` : ''}
              </div>
            </div>

            <!-- 8. Decisions Log -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-border-color/30 pb-1">
                <i data-lucide="gavel" class="w-4 h-4 text-amber-500"></i>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Decisions Log (${decisions.length})</h4>
              </div>
              <div class="space-y-1.5 pl-6">
                ${decisions.map(d => `
                  <div class="p-2 bg-primary/20 border border-border-color/10 rounded text-xs space-y-1">
                    <div class="flex justify-between items-start">
                      <span class="font-bold text-white">${d.description}</span>
                      <span class="text-[9px] text-muted font-mono font-semibold">${window.Utils.formatDate(d.date)}</span>
                    </div>
                    <p class="text-[10px] text-secondary leading-snug">Requested by: <b>${d.requestedBy}</b> • Approved: <b>${d.approvedBy}</b></p>
                  </div>
                `).join('')}
                ${decisions.length === 0 ? `<span class="text-[9px] text-muted italic block">No decisions recorded</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderDecisions(proj, role) {
    const isEditingAllowed = ['admin', 'architect', 'designer'].includes(role);
    const decisions = proj.decisions || [];
    
    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Project Decision Register</h3>
            <p class="text-xs text-secondary mt-0.5">Maintain a historical timeline of all structural, design, and budget decisions to prevent disputes.</p>
          </div>
          ${isEditingAllowed ? `
            <button onclick="openModal('add-decision-modal', { projectId: '${proj.id}' })" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Log Decision
            </button>
          ` : ""}
        </div>

        <div class="space-y-4">
          ${decisions.map(d => {
            const costImpactText = d.costImpact > 0 
              ? `<span class="text-rose-400 font-bold font-mono">+₹${d.costImpact.toLocaleString('en-IN')}</span>`
              : d.costImpact < 0
                ? `<span class="text-emerald-400 font-bold font-mono">-₹${Math.abs(d.costImpact).toLocaleString('en-IN')}</span>`
                : `<span class="text-muted font-mono">None</span>`;

            const timeImpactText = d.timeImpact > 0
              ? `<span class="text-rose-400 font-bold font-mono">+${d.timeImpact} Days</span>`
              : d.timeImpact < 0
                ? `<span class="text-emerald-400 font-bold font-mono">${d.timeImpact} Days</span>`
                : `<span class="text-muted font-mono">None</span>`;

            return `
              <div class="p-4 bg-primary/20 border border-border-color/45 hover:border-amber-500/25 transition-all rounded-lg space-y-3 text-xs">
                <div class="flex justify-between items-start border-b border-border-color/10 pb-2">
                  <div>
                    <span class="text-[9px] text-muted uppercase font-bold font-mono">Decision Date: ${window.Utils.formatDate(d.date)}</span>
                    <p class="text-white font-bold text-xs mt-0.5">${d.description}</p>
                  </div>
                  ${role === 'admin' ? `
                    <button onclick="window.ProjectPage.deleteDecision('${proj.id}', '${d.id}')" class="p-1 hover:bg-rose-500/10 rounded text-rose-500 border border-rose-500/20" title="Delete Decision"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                  ` : ""}
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-secondary">
                  <div>Requested By: <b class="text-white">${d.requestedBy}</b></div>
                  <div>Approved By: <b class="text-white">${d.approvedBy}</b></div>
                  <div>Cost Impact: ${costImpactText}</div>
                  <div>Timeline Impact: ${timeImpactText}</div>
                </div>

                <div class="bg-hover/10 p-2.5 rounded border border-border-color/20 leading-relaxed text-secondary text-[11px]">
                  <b>Scope/Operational Impact:</b> ${d.impact}
                </div>
              </div>
            `;
          }).join('')}
          
          ${decisions.length === 0 ? `
            <div class="p-8 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
              <i data-lucide="gavel" class="w-8 h-8 text-muted mx-auto mb-2"></i>
              No formal decisions logged in register yet. Use "Log Decision" to track client updates.
            </div>
          ` : ""}
        </div>
      </div>
    `;
  },

  async deleteDecision(projId, decId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj || !proj.decisions) return;
    if (!confirm("Are you sure you want to delete this decision log? This cannot be undone.")) return;
    proj.decisions = proj.decisions.filter(d => d.id !== decId);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Decision deleted successfully!");
    window.AppRouter.refresh();
  },

  renderChanges(proj, role) {
    const isEditingAllowed = ['admin', 'architect', 'designer'].includes(role);
    const changes = proj.changes || [];
    
    return `
      <div class="card p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Project Scope Change Control</h3>
            <p class="text-xs text-secondary mt-0.5">Track differences between original scope estimate and revised specs with approval milestones.</p>
          </div>
          ${isEditingAllowed ? `
            <button onclick="openModal('add-change-modal', { projectId: '${proj.id}' })" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Log Scope Change
            </button>
          ` : ""}
        </div>

        <div class="space-y-4">
          ${changes.map(ch => {
            const costDiffVal = parseFloat(ch.costDifference) || 0;
            const costDiffText = costDiffVal > 0 
              ? `<span class="text-rose-400 font-bold font-mono">+₹${costDiffVal.toLocaleString('en-IN')}</span>`
              : costDiffVal < 0
                ? `<span class="text-emerald-400 font-bold font-mono">-₹${Math.abs(costDiffVal).toLocaleString('en-IN')}</span>`
                : `<span class="text-muted font-mono">None</span>`;

            const timeDiffVal = parseInt(ch.timelineDifference) || 0;
            const timeDiffText = timeDiffVal > 0
              ? `<span class="text-rose-400 font-bold font-mono">+${timeDiffVal} Days</span>`
              : timeDiffVal < 0
                ? `<span class="text-emerald-400 font-bold font-mono">${timeDiffVal} Days</span>`
                : `<span class="text-muted font-mono">None</span>`;

            let badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/25";
            if (ch.approvalStatus === "Approved") badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
            else if (ch.approvalStatus === "Rejected") badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/25";

            return `
              <div class="p-4 bg-primary/20 border border-border-color/45 hover:border-amber-500/25 transition-all rounded-lg space-y-3 text-xs">
                <div class="flex justify-between items-start border-b border-border-color/10 pb-2">
                  <div>
                    <span class="text-[9px] text-muted uppercase font-bold font-mono">Logged: ${window.Utils.formatDate(ch.date)}</span>
                    <p class="text-white font-bold text-xs mt-0.5">Reason: ${ch.reason}</p>
                  </div>
                  <div class="flex items-center gap-1.5 font-sans">
                    <span class="px-2 py-0.5 text-[9px] font-bold rounded ${badgeClass}">${ch.approvalStatus}</span>
                    ${isEditingAllowed && ch.approvalStatus === "Pending" ? `
                      <button onclick="window.ProjectPage.setChangeStatus('${proj.id}', '${ch.id}', 'Approved')" class="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-[9px]">Approve</button>
                      <button onclick="window.ProjectPage.setChangeStatus('${proj.id}', '${ch.id}', 'Rejected')" class="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px]">Reject</button>
                    ` : ""}
                    ${isEditingAllowed ? `
                      <button onclick="window.ProjectPage.deleteChange('${proj.id}', '${ch.id}')" class="p-1 hover:bg-rose-500/10 rounded text-rose-500 border border-rose-500/20" title="Delete Scope Change"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    ` : ""}
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-primary/30 p-2.5 rounded border border-border-color/10 text-[11px] text-secondary font-sans">
                  <div>
                    <span class="text-muted block text-[8px] uppercase font-bold">Before Change (Original Scope)</span>
                    <span class="text-white font-medium">${ch.originalScope}</span>
                  </div>
                  <div>
                    <span class="text-muted block text-[8px] uppercase font-bold">After Change (Revised Scope)</span>
                    <span class="text-white font-medium">${ch.revisedScope}</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-secondary font-sans">
                  <div>Cost Difference: ${costDiffText}</div>
                  <div>Timeline Difference: ${timeDiffText}</div>
                </div>
              </div>
            `;
          }).join('')}
          
          ${changes.length === 0 ? `
            <div class="p-8 text-center text-secondary border border-dashed border-border-color/30 rounded-lg">
              <i data-lucide="git-commit" class="w-8 h-8 text-muted mx-auto mb-2"></i>
              No scope changes recorded yet. Sourcing changes are auto-logged.
            </div>
          ` : ""}
        </div>
      </div>
    `;
  },

  async deleteChange(projId, chgId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj || !proj.changes) return;
    if (!confirm("Are you sure you want to delete this scope change log? This cannot be undone.")) return;
    proj.changes = proj.changes.filter(c => c.id !== chgId);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Change log deleted successfully!");
    window.AppRouter.refresh();
  },

  async setChangeStatus(projId, chgId, status) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj || !proj.changes) return;
    const ch = proj.changes.find(c => c.id === chgId);
    if (!ch) return;
    
    ch.approvalStatus = status;
    
    if (status === "Approved") {
      const diffVal = parseFloat(ch.costDifference) || 0;
      proj.budget += diffVal;
      
      const timeDiffVal = parseInt(ch.timelineDifference) || 0;
      if (timeDiffVal > 0 && proj.endDate) {
        const d = new Date(proj.endDate);
        d.setDate(d.getDate() + timeDiffVal);
        proj.endDate = d.toISOString().split('T')[0];
      }
    }
    
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Scope change marked as ${status}!`);
    window.AppRouter.refresh();
  },

  renderClosure(proj, role) {
    const store = window.AppStore;
    const readiness = store.getHandoverReadiness(proj);
    const cl = proj.handoverChecklist || {};
    
    // Dynamically query actual metrics
    const openSnags = proj.snags.filter(s => s.status === 'Open').length;
    const unpaidBilling = proj.billing.filter(b => b.status === 'Pending').length;

    return `
      <div class="card p-5 space-y-6">
        <div class="flex items-center justify-between border-b border-border-color pb-3">
          <div>
            <h3 class="text-sm font-bold text-white">Project Handover & Closure</h3>
            <p class="text-xs text-secondary mt-0.5">Log site completion, test appliances, manage client sign-offs, and generate certificate.</p>
          </div>
          <button onclick="window.ProjectPage.generateCompletionCertificate('${proj.id}')"
            class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded flex items-center gap-1 shadow">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Completion Certificate
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <!-- Readiness details -->
          <div class="md:col-span-1 bg-primary/20 border border-border-color/45 rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div class="space-y-1.5 text-center">
              <span class="text-[10px] text-secondary uppercase font-bold tracking-widest font-mono block">Handover Readiness</span>
              <span class="text-4xl font-black text-emerald-400 font-mono block">${readiness}%</span>
              <div class="w-full bg-hover rounded-full h-2 overflow-hidden mt-2">
                <div class="h-full bg-emerald-400 rounded-full transition-all duration-500" style="width: ${readiness}%"></div>
              </div>
            </div>

            <div class="space-y-2 text-xs border-t border-border-color/15 pt-3">
              <div class="flex justify-between items-center">
                <span class="text-secondary">Open Site Snags:</span>
                <span class="font-bold ${openSnags > 0 ? 'text-rose-400' : 'text-emerald-400'} font-mono">${openSnags} Pending</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-secondary">Milestone Collections:</span>
                <span class="font-bold ${unpaidBilling > 0 ? 'text-amber-400' : 'text-emerald-400'} font-mono">${unpaidBilling} Unpaid</span>
              </div>
            </div>

            <p class="text-[10px] text-muted leading-relaxed text-center">
              Ensure all items are checked and all collections are completed to unlock the printable Project Completion Certificate.
            </p>
          </div>

          <!-- Interactive Handover Checklist -->
          <div class="md:col-span-2 space-y-3 bg-primary/10 border border-border-color/30 rounded-lg p-4">
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider block border-b border-border-color/20 pb-1.5 mb-2">Handover Requirements Checklist</span>
            
            <div class="space-y-2.5 text-xs">
              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.snagsClosed ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'snagsClosed')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">1. Snags Closed</span>
                    <span class="text-[9px] text-secondary">All open defects fixed and approved by site designer.</span>
                  </div>
                </div>
                <span class="text-[9px] font-mono font-semibold ${openSnags === 0 ? 'text-emerald-400' : 'text-secondary'}">${openSnags === 0 ? 'Auto Verified' : 'Awaiting Fixes'}</span>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.deepCleaning ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'deepCleaning')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">2. Deep Cleaning Completed</span>
                    <span class="text-[9px] text-secondary">Post-carpentry cleaning, vacuuming, and mirror polishing.</span>
                  </div>
                </div>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.appliancesTested ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'appliancesTested')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">3. Appliances Tested</span>
                    <span class="text-[9px] text-secondary">Hob, chimney, oven, and lighting layouts electrical checked.</span>
                  </div>
                </div>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.clientSignOff ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'clientSignOff')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">4. Client Formal Sign-Off</span>
                    <span class="text-[9px] text-secondary">Client signed handover document layout physical copy.</span>
                  </div>
                </div>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.finalPaymentReceived ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'finalPaymentReceived')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">5. Final Payment Received</span>
                    <span class="text-[9px] text-secondary">All billing stages paid, zero outstanding dues.</span>
                  </div>
                </div>
                <span class="text-[9px] font-mono font-semibold ${unpaidBilling === 0 ? 'text-emerald-400' : 'text-secondary'}">${unpaidBilling === 0 ? 'Auto Verified' : 'Awaiting Release'}</span>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.warrantiesShared ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'warrantiesShared')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">6. Warranty Documents Shared</span>
                    <span class="text-[9px] text-secondary">Hardware, appliance, and laminate warranty cards handed over.</span>
                  </div>
                </div>
              </label>

              <label class="flex items-center justify-between p-2 bg-primary/30 rounded hover:bg-hover/30 cursor-pointer border border-border-color/10">
                <div class="flex items-center gap-2">
                  <input type="checkbox" ${cl.keysHandedOver ? 'checked' : ''} onclick="window.AppStore.toggleHandoverCheck('${proj.id}', 'keysHandedOver')" class="accent-emerald-500 w-4 h-4">
                  <div>
                    <span class="font-bold text-white block">7. Keys Handed Over</span>
                    <span class="text-[9px] text-secondary">All wardrobe, cabinet, and main door keys labeled and handed over.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  generateCompletionCertificate(projId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;

    const readiness = window.AppStore.getHandoverReadiness(proj);
    if (readiness < 80) {
      alert(`Handover Readiness is currently at ${readiness}%. Please ensure at least 80% of checklist items are completed before generating the Project Completion Certificate.`);
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocker prevented opening the certificate. Please enable pop-ups.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Project Completion Certificate — ${proj.name.split(' (')[0]}</title>
          <style>
            body {
              font-family: sans-serif;
              background: #fff;
              color: #1a1a24;
              margin: 0;
              padding: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .certificate-container {
              border: 12px double #fbbf24;
              padding: 50px;
              max-width: 800px;
              width: 100%;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              border-radius: 4px;
              position: relative;
            }
            .certificate-container::after {
              content: '';
              position: absolute;
              top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 2px solid #fbbf24;
              pointer-events: none;
            }
            .logo {
              font-weight: 900;
              font-size: 24px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #000;
              margin-bottom: 20px;
            }
            .gold-seal {
              width: 80px;
              height: 80px;
              background: #fbbf24;
              border-radius: 50%;
              margin: 20px auto;
              position: relative;
              box-shadow: 0 4px 10px rgba(251,191,36,0.3);
            }
            h1 {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: 1px;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 40px;
            }
            .recipient {
              font-size: 20px;
              font-weight: 700;
              text-decoration: underline;
              margin: 20px 0;
            }
            .description {
              font-size: 15px;
              line-height: 1.8;
              color: #4b5563;
              margin: 30px auto;
              max-width: 600px;
            }
            .project-details {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 6px;
              margin: 30px auto;
              max-width: 500px;
              text-align: left;
              font-size: 13px;
            }
            .project-details div {
              margin-bottom: 6px;
            }
            .project-details div:last-child {
              margin-bottom: 0;
            }
            .project-details strong {
              color: #1f2937;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding: 0 40px;
            }
            .sig-block {
              border-top: 1px solid #9ca3af;
              width: 180px;
              padding-top: 8px;
              font-size: 12px;
              color: #4b5563;
              font-weight: 600;
            }
            .no-print-btn {
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: #fbbf24;
              color: black;
              border: 0;
              padding: 10px 20px;
              font-weight: 700;
              border-radius: 6px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              font-family: sans-serif;
            }
            @media print {
              .no-print-btn { display: none; }
              body { padding: 0; }
              .certificate-container { box-shadow: none; border-color: #000; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="logo">Premio Living</div>
            <h1>Certificate of Project Completion</h1>
            <div class="subtitle">Handover Sign-off Statement</div>
            
            <p class="description">
              This official document certifies that the execution and interior styling services for the project workspace listed below have been successfully completed in accordance with the signed agreements, design blueprints, and quality specifications of Premio Living.
            </p>
            
            <div class="recipient">${proj.clientName}</div>
            <p class="description" style="margin: 0; font-size: 13px; font-weight: 600;">Authorized Client Recipient</p>

            <div class="project-details">
              <div><strong>Project Name:</strong> ${proj.name.split(' (')[0]}</div>
              <div><strong>Site Address:</strong> ${proj.location}</div>
              <div><strong>Total Budget:</strong> ${window.Utils.formatCurrency(proj.budget)}</div>
              <div><strong>Handover Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div><strong>Readiness Score:</strong> ${readiness}% Checklist Items Verified</div>
            </div>

            <div class="gold-seal"></div>

            <div class="signatures">
              <div class="sig-block">
                S. Kumar<br>
                Principal Architect
              </div>
              <div class="sig-block">
                Abhilash Reddy<br>
                Project Manager
              </div>
            </div>
          </div>
          <button onclick="window.print()" class="no-print-btn">Print / Export PDF</button>
        </body>
      </html>
    `);
    win.document.close();
  },

  // ==================== INTERACTIVE CONTROLLER METHODS ====================

  editUpdate(projId, idx) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const update = proj.updates[idx];
    if (!update) return;
    
    window.openModal("add-update-modal", {
      isEdit: true,
      projectId: projId,
      updateIndex: idx,
      update
    });
  },

  editSnag(projId, snagId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const snag = proj.snags.find(s => s.id === snagId);
    if (!snag) return;
    
    window.openModal("add-snag-modal", {
      isEdit: true,
      snag
    });
  },

  editMaterial(projId, materialId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const material = proj.materials.find(m => m.id === materialId);
    if (!material) return;
    
    window.openModal("add-material-modal", {
      isEdit: true,
      material
    });
  },

  editBOQ(projId, boqId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const boq = proj.boq.find(b => b.id === boqId);
    if (!boq) return;
    
    window.openModal("add-boq-modal", {
      isEdit: true,
      boq
    });
  },

  editInvoice(projId, invoiceNo) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const invoice = proj.billing.find(b => b.invoiceNo === invoiceNo);
    if (!invoice) return;
    
    window.openModal("add-invoice-modal", {
      isEdit: true,
      invoice
    });
  },

  async updateStageProgress(projId, stageName, value) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const st = proj.stages.find(s => s.name === stageName);
    if (!st) return;
    
    st.progress = parseInt(value) || 0;
    if (st.progress === 100) st.status = "Completed";
    else if (st.progress > 0) st.status = "In Progress";
    else st.status = "Not Started";
    
    // Re-calculate overall project progress
    const completedCount = proj.stages.filter(s => s.status === "Completed").length;
    proj.progress = Math.round((completedCount / proj.stages.length) * 100);
    
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${stageName} progress set to ${value}%`);
    window.AppRouter.refresh();
  },

  async toggleMaterialStatus(projId, matId, key, value) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const mat = proj.materials.find(m => m.id === matId);
    if (!mat) return;
    
    mat[key] = value;
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${mat.name} ${key} status updated!`);
    window.AppRouter.refresh();
  },

  async approveMaterialInline(projId, matId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const mat = proj.materials.find(m => m.id === matId);
    if (!mat) return;
    
    mat.approved = "Approved";
    mat.approvalLog.push({
      user: `${window.AppStore.activeRole.toUpperCase()} (Manual)`,
      action: "Approved",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${mat.name} has been approved.`);
    window.AppRouter.refresh();
  },

  async resolveSnag(projId, snagId) {
    const proj = window.AppStore.state.projects.find(p => p.id === snagId); // Typo protection
    const realProj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!realProj) return;
    const snag = realProj.snags.find(s => s.id === snagId);
    if (!snag) return;
    
    snag.status = "Closed";
    await window.dbService.saveProject(realProj);
    window.ModalComponent.showToast("Snag resolved successfully!");
    window.AppRouter.refresh();
  },

  async releasePaymentInline(projId, invoiceNo) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const bill = proj.billing.find(b => b.invoiceNo === invoiceNo);
    if (!bill) return;
    
    bill.status = "Paid";
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Invoice ${invoiceNo} payment released!`);
    window.AppRouter.refresh();
  },

  bindDragAndDrop(projId) {
    const dragArea = document.getElementById("image-drag-drop");
    const uploader = document.getElementById("file-uploader");
    const gallery = document.getElementById("attached-preview-gallery");
    const progressCont = document.getElementById("upload-progress-container");
    const progressBar = document.getElementById("upload-bar");
    const progressPercent = document.getElementById("upload-percent");
    
    if (!dragArea || !uploader) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
      dragArea.addEventListener(evtName, (e) => e.preventDefault(), false);
    });
    
    dragArea.ondragover = () => { dragArea.classList.add("border-amber-500", "bg-hover/20"); };
    dragArea.ondragleave = () => { dragArea.classList.remove("border-amber-500", "bg-hover/20"); };
    
    const handleFiles = (files) => {
      if (files.length === 0) return;
      
      dragArea.classList.remove("border-amber-500", "bg-hover/20");
      progressCont.classList.remove("hidden");
      
      let pct = 0;
      const interval = setInterval(() => {
        pct += 25;
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        
        if (pct >= 100) {
          clearInterval(interval);
          progressCont.classList.add("hidden");
          progressBar.style.width = "0%";
          
          gallery.innerHTML = "";
          gallery.classList.remove("hidden");
          
          Array.from(files).forEach((f, idx) => {
            const preview = document.createElement("div");
            preview.className = "relative rounded overflow-hidden aspect-video border border-border-color bg-zinc-900";
            preview.innerHTML = `
              <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover">
              <span class="absolute top-1 right-1 p-0.5 bg-black/60 rounded cursor-pointer text-rose-500" onclick="this.parentElement.remove()"><i data-lucide="x" class="w-3 h-3"></i></span>
            `;
            gallery.appendChild(preview);
          });
          
          if (window.lucide) lucide.createIcons();
          window.ModalComponent.showToast("Progress image compressed (90% size saved) & queued!");
        }
      }, 200);
    };

    dragArea.ondrop = (e) => {
      handleFiles(e.dataTransfer.files);
    };
    
    uploader.onchange = () => {
      handleFiles(uploader.files);
    };
  },

  bindVaultDragAndDrop(projId) {
    const dragArea = document.getElementById("vault-drag-drop");
    const uploader = document.getElementById("vault-file-uploader");
    if (!dragArea || !uploader) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
      dragArea.addEventListener(evtName, (e) => e.preventDefault(), false);
    });

    dragArea.ondragover = () => { dragArea.classList.add("border-amber-500", "bg-hover/20"); };
    dragArea.ondragleave = () => { dragArea.classList.remove("border-amber-500", "bg-hover/20"); };

    const handleVaultFile = (file) => {
      if (!file) return;
      dragArea.classList.remove("border-amber-500", "bg-hover/20");

      // Open the document modal
      window.openModal("add-document-modal", { fromDashboard: false });

      // Put the file into the modal's file input
      const fileInput = document.getElementById("new-doc-file");
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger name update
        const docName = document.getElementById("new-doc-name");
        if (docName) {
          docName.value = file.name;
        }

        // Smart category detection based on filename
        const folderSelect = document.getElementById("new-doc-folder");
        if (folderSelect) {
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes("quote") || lowerName.includes("estimate") || lowerName.includes("boq") || lowerName.includes("rate") || lowerName.includes("quotation")) {
            folderSelect.value = "quotations";
          } else if (lowerName.includes("invoice") || lowerName.includes("bill") || lowerName.includes("receipt") || lowerName.includes("inv") || lowerName.includes("payment")) {
            folderSelect.value = "invoices";
          } else if (lowerName.includes("drawing") || lowerName.includes("layout") || lowerName.includes("plan") || lowerName.includes("elevation") || lowerName.includes("detail")) {
            folderSelect.value = "drawings";
          } else {
            folderSelect.value = "agreements";
          }
        }
      }
    };

    dragArea.ondrop = (e) => {
      const file = e.dataTransfer.files[0];
      handleVaultFile(file);
    };

    uploader.onchange = () => {
      const file = uploader.files[0];
      handleVaultFile(file);
    };
  },

  async submitSideUpdateLog(projId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    
    const workers = parseInt(document.getElementById("update-side-workers").value) || 0;
    const completed = document.getElementById("update-side-completed").value;
    const issues = document.getElementById("update-side-issues").value || "None";
    const tomorrow = document.getElementById("update-side-tomorrow").value;
    
    if (!completed || !tomorrow) {
      alert("Please fill out completed work details and tomorrow plans.");
      return;
    }
    
    const dateVal = new Date().toISOString().split('T')[0];
    const newUpdate = {
      date: dateVal,
      completed,
      workersCount: workers,
      issues,
      tomorrowPlan: tomorrow,
      photo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80"
    };
    
    proj.updates.unshift(newUpdate);
    await window.dbService.saveProject(proj);
    
    document.getElementById("update-side-completed").value = "";
    document.getElementById("update-side-issues").value = "";
    document.getElementById("update-side-tomorrow").value = "";
    const gallery = document.getElementById("attached-preview-gallery");
    if (gallery) {
      gallery.innerHTML = "";
      gallery.classList.add("hidden");
    }
    
    window.ModalComponent.showToast("Daily log submitted!");
    window.AppRouter.refresh();
    
    window.ModalComponent.promptWhatsAppShare("daily-log", proj.id, dateVal);
  },

  editProject(projId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    window.openModal("add-project-modal", { isEdit: true, project: proj });
  },

  // Inline edit for team member names in the Overview card
  inlineEditTeam(projId, key) {
    const displayEl = document.getElementById(`team-display-${projId}-${key}`);
    if (!displayEl) return;

    const currentVal = displayEl.textContent === '—' ? '' : displayEl.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentVal;
    input.className = 'text-xs bg-primary border border-amber-500/50 rounded px-2 py-0.5 text-white w-28 focus:outline-none focus:border-amber-500';
    input.placeholder = 'Enter name...';

    displayEl.replaceWith(input);
    input.focus();
    input.select();

    const save = async () => {
      const newVal = input.value.trim() || '—';
      const proj = window.AppStore.state.projects.find(p => p.id === projId);
      if (proj) {
        proj.team[key] = newVal === '—' ? '' : newVal;
        await window.dbService.saveProject(proj);
        window.ModalComponent.showToast('Team updated!');
      }
      window.AppRouter.refresh();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { window.AppRouter.refresh(); }
    });
  },

  async clearTeamMember(projId, key) {
    const labels = { pm: 'Project Manager', designer: 'Lead Architect', engineer: 'Site Engineer' };
    if (!confirm(`Clear ${labels[key] || key} from this project?`)) return;
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    proj.team[key] = '';
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`${labels[key] || key} cleared.`);
    window.AppRouter.refresh();
  },

  editStage(projId, stageName) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const stage = proj.stages.find(s => s.name === stageName);
    if (!stage) return;
    window.openModal("edit-stage-modal", { projectId: projId, stage });
  },

  renderTeam(proj, role) {
    if (role !== 'admin') return `<div class="p-10 text-center text-xs text-muted">Access restricted to Admin only.</div>`;

    const team = proj.teamMembers || [];

    const roleColors = {
      architect:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
      designer:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
      site_engineer:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    const roleLabels = {
      architect: 'Architect',
      designer: 'Designer',
      site_engineer: 'Site Engineer'
    };

    const memberRows = team.length > 0 ? team.map((m, idx) => `
      <div class="flex items-center justify-between p-3 bg-primary/40 border border-border-color/30 rounded-lg text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm flex-shrink-0">
            ${(m.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <span class="font-semibold text-white block">${m.name}</span>
            <span class="text-[9px] text-muted">${m.email || 'No email set'}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${roleColors[m.role] || 'bg-zinc-800 text-muted border-zinc-700'}">
            ${roleLabels[m.role] || m.role}
          </span>
          <button onclick="window.ProjectPage.removeTeamMember('${proj.id}', ${idx})" class="p-1 bg-hover hover:bg-border-color border border-rose-500/20 rounded text-rose-500" title="Remove from project">
            <i data-lucide="user-minus" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('') : `<div class="p-6 text-center text-xs text-muted">No team members assigned yet. Use the form below or select from the registered users directory.</div>`;

    return `
      <div class="space-y-6">
        <!-- Current Team -->
        <div class="card p-5 space-y-4">
          <div class="flex items-center gap-2 border-b border-border-color pb-3">
            <i data-lucide="users" class="w-4 h-4 text-amber-500"></i>
            <div>
              <h3 class="text-sm font-bold text-white">Project Team Members</h3>
              <p class="text-xs text-secondary mt-0.5">People assigned to this project workspace</p>
            </div>
          </div>
          <div class="space-y-2">${memberRows}</div>
        </div>

        <!-- Assign Member Form -->
        <div class="card p-5 space-y-4">
          <div class="flex items-center gap-2 border-b border-border-color pb-3">
            <i data-lucide="user-plus" class="w-4 h-4 text-amber-500"></i>
            <h3 class="text-sm font-bold text-white">Assign Team Member</h3>
          </div>

          <!-- Quick Select from Registered Users -->
          <div>
            <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Quick Select — Registered Workspace User</label>
            <select id="team-member-registered-select" onchange="window.ProjectPage.onRegisteredUserSelect(this)" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
              <option value="">-- Choose from registered users (loads automatically) --</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Role</label>
              <select id="new-team-role" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
                <option value="architect">Architect</option>
                <option value="designer">Designer</option>
                <option value="site_engineer">Site Engineer</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Full Name</label>
              <input type="text" id="new-team-name" placeholder="e.g. Ravi Kumar" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
            </div>
            <div>
              <label class="block text-[10px] text-muted uppercase font-semibold mb-1">Email (for login)</label>
              <input type="email" id="new-team-email" placeholder="ravi@premioliving.in" class="w-full text-xs p-2 rounded border border-border-color bg-primary text-white focus:outline-none focus:border-amber-500">
            </div>
          </div>
          <input type="hidden" id="new-team-userid">

          <div class="flex items-center justify-between border-t border-border-color pt-4">
            <p class="text-[10px] text-muted">
              <i data-lucide="info" class="w-3.5 h-3.5 inline mr-1 text-amber-500/70"></i>
              Select from dropdown above or enter manually. Click Assign to link to this project.
            </p>
            <button onclick="window.ProjectPage.addTeamMember('${proj.id}')" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Assign Member
            </button>
          </div>
        </div>

        <!-- Global Users Directory -->
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-border-color pb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="users-2" class="w-4 h-4 text-amber-500"></i>
              <div>
                <h3 class="text-sm font-bold text-white">Global Workspace Users Directory</h3>
                <p class="text-xs text-secondary mt-0.5">All registered users — who logged in, their role, their project</p>
              </div>
            </div>
            <span id="registered-users-count" class="text-[9px] text-muted font-mono bg-hover px-2 py-1 rounded border border-border-color">Loading...</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-border-color text-[10px] text-secondary uppercase font-semibold tracking-wider font-mono">
                  <th class="px-3 py-2">User</th>
                  <th class="px-3 py-2">Role</th>
                  <th class="px-3 py-2">Assigned Projects</th>
                  <th class="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="global-users-table-body">
                <tr>
                  <td colspan="4" class="px-3 py-5 text-center text-xs text-muted">
                    <i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1 text-amber-500"></i>
                    Loading users directory...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Access Matrix -->
        <div class="card p-5 space-y-3">
          <h3 class="text-xs font-bold text-white flex items-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-amber-500"></i> Role Access Matrix
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
            <div class="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
              <span class="font-bold text-blue-400 block mb-2 uppercase tracking-wider">🏛️ Architect</span>
              <ul class="space-y-1 text-secondary">
                <li>✅ Design Drawings (Upload/Edit)</li>
                <li>✅ Material Tracker (Add/Edit)</li>
                <li>✅ Vault Documents</li>
                <li>✅ Assigned Vendors (View)</li>
                <li>👁️ Timeline Stages (View only)</li>
                <li>👁️ Site Snags (View only)</li>
                <li>❌ BOQ / Billing</li>
              </ul>
            </div>
            <div class="p-3 bg-purple-500/5 border border-purple-500/15 rounded-lg">
              <span class="font-bold text-purple-400 block mb-2 uppercase tracking-wider">🎨 Designer</span>
              <ul class="space-y-1 text-secondary">
                <li>✅ Design Drawings (Upload/Edit)</li>
                <li>✅ Material Tracker (Add/Edit)</li>
                <li>✅ Vault Documents</li>
                <li>✅ Assigned Vendors (View)</li>
                <li>👁️ Timeline Stages (View only)</li>
                <li>👁️ Site Snags (View only)</li>
                <li>❌ BOQ / Billing</li>
              </ul>
            </div>
            <div class="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
              <span class="font-bold text-emerald-400 block mb-2 uppercase tracking-wider">🔧 Site Engineer</span>
              <ul class="space-y-1 text-secondary">
                <li>✅ Timeline Stages (Edit)</li>
                <li>✅ Site Snags (Add/Edit/Close)</li>
                <li>✅ Daily Site Logs (Add/Edit)</li>
                <li>✅ Vault Documents</li>
                <li>❌ Design Drawings</li>
                <li>❌ Materials / BOQ / Billing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async addTeamMember(projId) {
    const role  = document.getElementById('new-team-role')?.value;
    const name  = document.getElementById('new-team-name')?.value.trim();
    const email = document.getElementById('new-team-email')?.value.trim();
    const userId = document.getElementById('new-team-userid')?.value.trim();

    if (!name) { window.ModalComponent.showToast('Please enter a name.'); return; }

    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;

    if (!proj.teamMembers) proj.teamMembers = [];

    // Allow multiple roles per project (remove old one-per-role restriction)
    const existingIdx = proj.teamMembers.findIndex(m => m.role === role && m.email === email);
    if (existingIdx !== -1) {
      proj.teamMembers[existingIdx] = { role, name, email, userId };
    } else {
      proj.teamMembers.push({ role, name, email, userId });
    }

    await window.dbService.saveProject(proj);

    // Also save to Supabase project_members if we have a userId and cloud is active
    if (userId && window.dbService.isCloudActive()) {
      try {
        await window.dbService.client.from('project_members').upsert(
          { project_id: projId, user_id: userId, name, role },
          { onConflict: 'project_id,user_id' }
        );
      } catch (err) { console.error('Error saving to project_members', err); }
    }

    window.ModalComponent.showToast(`${name} (${role}) assigned to project!`);
    window.AppRouter.refresh();
  },

  async removeTeamMember(projId, idx) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj || !proj.teamMembers) return;
    const member = proj.teamMembers[idx];
    if (!confirm(`Remove ${member?.name || 'this member'} from the project?`)) return;
    proj.teamMembers.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast('Team member removed.');
    window.AppRouter.refresh();
  },

  onRegisteredUserSelect(selectEl) {
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    if (!selectedOpt || !selectedOpt.value) return;
    
    const name = selectedOpt.getAttribute('data-name');
    const email = selectedOpt.getAttribute('data-email');
    const role = selectedOpt.getAttribute('data-role');
    
    const nameInput = document.getElementById('new-team-name');
    const emailInput = document.getElementById('new-team-email');
    const useridInput = document.getElementById('new-team-userid');
    if (nameInput) nameInput.value = name || '';
    if (emailInput) emailInput.value = email || '';
    if (useridInput) useridInput.value = selectedOpt.value || '';
    
    const roleSelect = document.getElementById('new-team-role');
    if (roleSelect) {
      if (role === 'architect') roleSelect.value = 'architect';
      else if (role === 'designer') roleSelect.value = 'designer';
      else if (role === 'site_engineer' || role === 'engineer') roleSelect.value = 'site_engineer';
    }
  },

  async loadGlobalUsersDirectory(projId) {
    const dropdown = document.getElementById("team-member-registered-select");
    const tableBody = document.getElementById("global-users-table-body");
    const countSpan = document.getElementById("registered-users-count");
    
    if (!dropdown || !tableBody) return;
    
    const store = window.AppStore;
    const db = window.dbService;
    
    let registeredUsers = [];
    if (db.isCloudActive()) {
      try {
        const { data, error } = await db.client
          .from('profiles')
          .select('id, name, role, email')
          .order('name');
        if (!error && data) registeredUsers = data;
      } catch (err) {
        console.error("Error fetching profiles directory", err);
      }
    }
    
    // Fallback if offline
    if (registeredUsers.length === 0) {
      const uniqueUsers = new Map();
      store.state.projects.forEach(p => {
        (p.teamMembers || []).forEach(m => {
          uniqueUsers.set(m.email, { id: m.email, name: m.name, role: m.role, email: m.email });
        });
      });
      registeredUsers = Array.from(uniqueUsers.values());
    }
    
    if (countSpan) countSpan.textContent = `${registeredUsers.length} Users Registered`;
    
    const teamMembersOnly = registeredUsers.filter(u => u.role !== 'admin');
    if (teamMembersOnly.length > 0) {
      dropdown.innerHTML = '<option value="">-- Choose Registered User --</option>' + 
        teamMembersOnly.map(m => `<option value="${m.id}" data-name="${m.name}" data-email="${m.email || ''}" data-role="${m.role}">${m.name} (${m.role}) - ${m.email || 'no email'}</option>`).join('');
    } else {
      dropdown.innerHTML = '<option value="">No registered team members found</option>';
    }
    
    if (registeredUsers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-muted">No registered dashboard users found.</td></tr>`;
      return;
    }
    
    const roleLabels = {
      admin: 'Admin',
      architect: 'Architect',
      designer: 'Designer',
      site_engineer: 'Site Engineer'
    };
    
    const projectsList = store.state.projects || [];
    
    tableBody.innerHTML = registeredUsers.map(u => {
      const assignments = projectsList.filter(p => 
        (p.teamMembers || []).some(m => m.email?.toLowerCase() === u.email?.toLowerCase())
      );
      
      const assignmentsHTML = assignments.length > 0 
        ? assignments.map(p => `<span class="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium text-[9px] mr-1 mb-1">${p.name.split(' (')[0]}</span>`).join('') 
        : '<span class="text-muted italic text-[10px]">Unassigned</span>';
        
      const transferSelectHTML = `
        <select onchange="window.ProjectPage.globalTransferUser('${u.id}', '${u.name}', '${u.email || ''}', '${u.role}', this.value)" class="text-[10px] p-1 bg-hover hover:bg-border-color border border-border-color/60 rounded text-white focus:outline-none w-28">
          <option value="">Assign/Transfer...</option>
          ${projectsList.map(p => `<option value="${p.id}">${p.name.split(' (')[0]}</option>`).join('')}
        </select>
      `;
      
      const deleteBtnHTML = u.role === 'admin' ? '' : `
        <button onclick="window.ProjectPage.globalDeleteProfile('${u.id}', '${u.name}')" class="p-1 bg-hover hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 text-rose-500 rounded" title="Delete profile completely">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
      
      return `
        <tr class="border-b border-border-color/20 hover:bg-hover/30 transition-colors">
          <td class="px-3 py-2.5">
            <span class="font-bold text-white block">${u.name}</span>
            <span class="text-[9px] text-muted font-mono block">${u.email || 'no email'}</span>
          </td>
          <td class="px-3 py-2.5 uppercase font-mono font-bold text-[9px] text-secondary">
            ${roleLabels[u.role] || u.role}
          </td>
          <td class="px-3 py-2.5">
            ${assignmentsHTML}
          </td>
          <td class="px-3 py-2.5 text-right">
            <div class="flex items-center justify-end gap-2">
              ${transferSelectHTML}
              ${deleteBtnHTML}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
  },

  async globalTransferUser(userId, name, email, role, targetProjectId) {
    if (!targetProjectId) return;
    
    const store = window.AppStore;
    const db = window.dbService;
    
    const targetProj = store.state.projects.find(p => p.id === targetProjectId);
    if (!targetProj) return;
    
    if (!confirm(`Assign/Transfer ${name} (${role}) to Project "${targetProj.name.split(' (')[0]}"?`)) {
      window.AppRouter.refresh();
      return;
    }
    
    let projRole = role;
    if (role === 'designer') projRole = 'architect';
    else if (role === 'engineer') projRole = 'site_engineer';
    
    if (!targetProj.teamMembers) targetProj.teamMembers = [];
    const idx = targetProj.teamMembers.findIndex(m => m.email?.toLowerCase() === email.toLowerCase());
    if (idx === -1) {
      targetProj.teamMembers.push({ name, email, role: projRole });
    }
    
    await db.saveProject(targetProj);
    window.ModalComponent.showToast(`${name} assigned to project successfully!`);
    window.AppRouter.refresh();
  },

  async globalDeleteProfile(userId, userName) {
    if (!confirm(`Are you sure you want to delete profile for "${userName}"? This will block their dashboard login.`)) return;
    
    const db = window.dbService;
    if (db.isCloudActive()) {
      try {
        const { error } = await db.client.from('profiles').delete().eq('id', userId);
        if (error) {
          window.ModalComponent.showToast('Failed to delete profile: ' + error.message);
          return;
        }
      } catch (err) {
        console.error("Error deleting user profile", err);
      }
    }
    
    window.ModalComponent.showToast(`User profile "${userName}" deleted.`);
    window.AppRouter.refresh();
  },

  addDelivery(projId) {
    window.openModal("add-delivery-modal", { isEdit: false });
  },

  editDelivery(projId, deliveryId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const delivery = proj.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    window.openModal("add-delivery-modal", { isEdit: true, delivery });
  },

  addVisit(projId) {
    window.openModal("add-visit-modal", { isEdit: false });
  },

  editVisit(projId, visitId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const visit = proj.visits.find(v => v.id === visitId);
    if (!visit) return;
    window.openModal("add-visit-modal", { isEdit: true, visit });
  },

  editDocument(projId, folder, docName) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const docs = proj.vault[folder] || [];
    const docObj = docs.find(d => d.name === docName);
    if (!docObj) return;
    window.openModal("add-document-modal", { isEdit: true, document: docObj, folder });
  },

  async deleteProject(projId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    if (!confirm(`Permanently delete project "${proj.name}" and ALL its data (snags, BOQ, billing, materials)? This CANNOT be undone.`)) return;
    await window.dbService.deleteProject(projId);
    window.ModalComponent.showToast(`Project "${proj.name}" deleted.`);
    window.AppRouter.navigate('dashboard');
  },

  // ==================== DELETE HANDLERS ====================

  async deleteUpdate(projId, idx) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const u = proj.updates[idx];
    if (!u) return;
    if (!confirm(`Delete site log from ${u.date}? This cannot be undone.`)) return;
    proj.updates.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Site log deleted.");
    window.AppRouter.refresh();
  },

  async deleteSnag(projId, snagId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.snags.findIndex(s => s.id === snagId);
    if (idx === -1) return;
    if (!confirm(`Delete snag "${proj.snags[idx].issue}"? This cannot be undone.`)) return;
    proj.snags.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Snag deleted.");
    window.AppRouter.refresh();
  },

  async deleteMaterial(projId, matId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.materials.findIndex(m => m.id === matId);
    if (idx === -1) return;
    if (!confirm(`Delete material "${proj.materials[idx].name}"? This cannot be undone.`)) return;
    proj.materials.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Material deleted.");
    window.AppRouter.refresh();
  },

  async deleteBOQ(projId, boqId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.boq.findIndex(b => b.id === boqId);
    if (idx === -1) return;
    if (!confirm(`Delete BOQ item "${proj.boq[idx].description}"? This cannot be undone.`)) return;
    proj.boq.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("BOQ item deleted.");
    window.AppRouter.refresh();
  },

  async deleteInvoice(projId, invoiceNo) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.billing.findIndex(b => b.invoiceNo === invoiceNo);
    if (idx === -1) return;
    if (!confirm(`Delete invoice ${invoiceNo}? This cannot be undone.`)) return;
    proj.billing.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Invoice ${invoiceNo} deleted.`);
    window.AppRouter.refresh();
  },

  async deleteDelivery(projId, deliveryId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.deliveries.findIndex(d => d.id === deliveryId);
    if (idx === -1) return;
    if (!confirm(`Delete delivery "${proj.deliveries[idx].item}"? This cannot be undone.`)) return;
    proj.deliveries.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Delivery deleted.");
    window.AppRouter.refresh();
  },

  async deleteVisit(projId, visitId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const idx = proj.visits.findIndex(v => v.id === visitId);
    if (idx === -1) return;
    if (!confirm(`Delete visit by "${proj.visits[idx].visitor}"? This cannot be undone.`)) return;
    proj.visits.splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast("Visit deleted.");
    window.AppRouter.refresh();
  },

  async deleteDocument(projId, folder, docName) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    if (!proj.vault[folder]) return;
    const idx = proj.vault[folder].findIndex(d => d.name === docName);
    if (idx === -1) return;
    if (!confirm(`Delete document "${docName}"? This cannot be undone.`)) return;
    
    // Clean up cached/db binary files if any
    const docObj = proj.vault[folder][idx];
    if (docObj.file && docObj.file.startsWith("db://")) {
      const fileId = docObj.file.substring(5);
      await window.FileCache.remove(fileId);
      const db = window.dbService;
      if (db.isCloudActive()) {
        try {
          await db.client.from('document_files').delete().eq('id', fileId);
        } catch(err){}
      }
    }
    
    proj.vault[folder].splice(idx, 1);
    await window.dbService.saveProject(proj);
    window.ModalComponent.showToast(`Document "${docName}" deleted.`);
    window.AppRouter.refresh();
  },

  copyProjectIdToClipboard(id) {
    navigator.clipboard.writeText(id).then(() => {
      window.ModalComponent.showToast("Project ID Code copied to clipboard: " + id);
    }).catch(err => {
      console.error("Could not copy project ID", err);
    });
  },

  viewDrawing(projId, name) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const drawings = proj.vault.drawings || [];
    const d = drawings.find(x => x.name === name);
    if (!d) return;
    this.viewDocument(d.file, d.name);
  },

  viewVaultDocument(projId, folderId, name) {
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    const docs = proj.vault[folderId] || [];
    const docObj = docs.find(x => x.name === name);
    if (!docObj) return;
    this.viewDocument(docObj.file, docObj.name);
  },

  async viewDocument(file, name) {
    if (!file || file === "#") {
      alert("No file contents available for this document.");
      return;
    }

    // If it's a plain filename, URL, or relative path, open it directly in a new window/tab
    if (!file.startsWith("data:") && !file.startsWith("db://")) {
      window.open(file, "_blank");
      return;
    }

    // Synchronously open a loading window to bypass browser popup blocks on async tasks
    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocker prevented opening the document. Please enable pop-ups for this site.");
      return;
    }
    
    // Write loading state
    win.document.write(`
      <html>
        <head><title>Loading ${name || 'Document'}...</title></head>
        <body style="margin:0; background:#0a0a0f; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
          <div style="text-align:center;">
            <div style="border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #fbbf24; border-radius: 50%; width: 36px; height: 36px; animation: spin 1s linear infinite; margin: 0 auto 12px auto;"></div>
            <p style="font-size: 13px; color: #9ca3af; font-weight: 500;">Opening document...</p>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </body>
      </html>
    `);
    win.document.close();

    let fileData = file;

    // Resolve database pointer asynchronously
    if (file.startsWith("db://")) {
      const fileId = file.substring(5);
      
      // Try local IndexedDB cache first
      let cached = await window.FileCache.get(fileId);
      
      if (!cached) {
        // Fallback to Supabase sync
        const db = window.dbService;
        if (db.isCloudActive()) {
          try {
            const { data, error } = await db.client.from('document_files').select('file_data').eq('id', fileId).single();
            if (!error && data) {
              cached = data.file_data;
              // Cache it locally in IndexedDB
              await window.FileCache.set(fileId, cached);
            }
          } catch (err) {
            console.error("Error fetching file from cloud:", err);
          }
        }
      }
      
      if (cached) {
        fileData = cached;
      } else {
        win.document.body.innerHTML = `
          <div style="text-align:center; padding: 20px; max-width: 400px; color: white;">
            <p style="font-size: 14px; color: #ef4444; font-weight: bold; margin-bottom: 8px;">Document Unreachable</p>
            <p style="font-size: 12px; color: #9ca3af;">This document is not cached locally, and the database is unreachable or offline.</p>
          </div>
        `;
        return;
      }
    }

    if (fileData.startsWith("data:")) {
      try {
        const parts = fileData.split(',');
        const mime = parts[0].split(':')[1].split(';')[0];
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        const blob = new Blob([new Uint8Array(array)], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        win.location.replace(blobUrl);
      } catch (err) {
        console.error("Blob conversion failed, using fallback document.write:", err);
        
        win.document.open();
        win.document.title = name || "View Document";
        if (fileData.includes("image/")) {
          win.document.write(`
            <body style="margin:0; background:#0a0a0f; display:flex; align-items:center; justify-content:center; min-height:100vh;">
              <img src="${fileData}" style="max-width:95%; max-height:95vh; object-fit:contain; border:0; margin:auto; box-shadow:0 10px 30px rgba(0,0,0,0.5); border-radius:8px;">
            </body>
          `);
        } else if (fileData.includes("pdf")) {
          win.document.write(`
            <body style="margin:0; height:100vh; overflow:hidden;">
              <embed src="${fileData}" type="application/pdf" width="100%" height="100%">
            </body>
          `);
        } else {
          win.document.write(`
            <body style="margin:0; height:100vh; overflow:hidden;">
              <iframe src="${fileData}" frameborder="0" style="border:0; width:100%; height:100%;"></iframe>
            </body>
          `);
        }
        win.document.close();
      }
    } else {
      // Direct URL fallback
      win.location.replace(fileData);
    }
  },

  async resolveDbImages() {
    // 1. Resolve img tags
    const images = document.querySelectorAll("img[src^='db://']");
    for (let img of images) {
      const dbUrl = img.getAttribute("src");
      const fileId = dbUrl.substring(5);
      const base64 = await window.FileCache.get(fileId);
      if (base64) {
        img.src = base64;
      }
    }
    // 2. Resolve background images
    const bgEls = document.querySelectorAll("[style*='db://']");
    for (let el of bgEls) {
      const style = el.getAttribute("style");
      const match = style.match(/url\(['"]?db:\/\/([^'"]+)['"]?\)/);
      if (match) {
        const fileId = match[1];
        const base64 = await window.FileCache.get(fileId);
        if (base64) {
          el.style.backgroundImage = `url('${base64}')`;
        }
      }
    }
  }
};
