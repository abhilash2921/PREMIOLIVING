/* js/components/modals.js - Premio Living OS Modal Controller & Forms Handler */

window.ModalComponent = {
  activeOptions: {},

  init() {
    this.setupFormListeners();
    this.populateSelectOptions();
  },

  openModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const store = window.AppStore;
    
    this.activeOptions[modalId] = options;
    
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    
    const isEdit = options.isEdit || false;
    const modalTitleEl = modal.querySelector(".p-4.border-b h3");
    const submitBtnEl = modal.querySelector("button[type='submit']");
    
    // Auto-populate context details if available
    if (modalId === "add-project-modal") {
      if (isEdit && options.project) {
        document.getElementById("new-proj-name").value = options.project.name;
        document.getElementById("new-proj-client").value = options.project.clientName;
        document.getElementById("new-proj-location").value = options.project.location;
        document.getElementById("new-proj-budget").value = options.project.budget;
        document.getElementById("new-proj-start").value = window.Utils.toDisplayDate(options.project.startDate);
        document.getElementById("new-proj-end").value = window.Utils.toDisplayDate(options.project.endDate);
        if (modalTitleEl) modalTitleEl.textContent = "Edit Project Details";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-proj-name").value = "";
        document.getElementById("new-proj-client").value = "";
        document.getElementById("new-proj-location").value = "";
        document.getElementById("new-proj-budget").value = "";
        document.getElementById("new-proj-start").value = "";
        document.getElementById("new-proj-end").value = "";
        if (modalTitleEl) modalTitleEl.textContent = "Create New Project Workspace";
        if (submitBtnEl) submitBtnEl.textContent = "Create Workspace";
      }
    }

    if (modalId === "add-update-modal") {
      const projId = options.projectId || window.AppStore.activeProjectId || (window.AppStore.state.projects[0] && window.AppStore.state.projects[0].id);
      const proj = window.AppStore.state.projects.find(p => p.id === projId);
      const titleEl = document.getElementById("update-project-title");
      if (titleEl && proj) {
        titleEl.textContent = `Project: ${proj.name}`;
      }
      
      const fileInput = document.getElementById("new-update-photo-file");
      if (fileInput) fileInput.value = "";
      const previewDiv = document.getElementById("new-update-photo-preview");
      const previewImg = document.getElementById("new-update-photo-img");
      if (previewDiv && previewImg) {
        previewImg.src = "";
        previewDiv.classList.add("hidden");
      }

      // Populate materials list with current status dropdowns
      const matContainer = document.getElementById("update-material-status-container");
      if (matContainer && proj) {
        if (!proj.materials || proj.materials.length === 0) {
          matContainer.innerHTML = `<span class="text-[10px] text-muted italic">No materials defined for this project</span>`;
        } else {
          matContainer.innerHTML = proj.materials.map(m => {
            let currentStatus = "Required";
            if (m.installed) currentStatus = "Installed";
            else if (m.delivered) currentStatus = "Received";
            else if (m.ordered) currentStatus = "Ordered";
            
            return `
              <div class="flex justify-between items-center text-xs border-b border-border-color/10 pb-1.5 last:border-0 last:pb-0">
                <span class="text-secondary font-medium truncate max-w-[140px]" title="${m.name}">${m.name}</span>
                <select data-mat-id="${m.id}" class="update-material-status-select bg-primary border border-border-color/60 text-[10px] rounded px-1 py-0.5 text-white focus:outline-none">
                  <option value="Required" ${currentStatus === 'Required' ? 'selected' : ''}>Required</option>
                  <option value="Ordered" ${currentStatus === 'Ordered' ? 'selected' : ''}>Ordered</option>
                  <option value="Received" ${currentStatus === 'Received' ? 'selected' : ''}>Received</option>
                  <option value="Installed" ${currentStatus === 'Installed' ? 'selected' : ''}>Installed</option>
                </select>
              </div>
            `;
          }).join("");
        }
      }
      
      if (isEdit && options.update) {
        const u = options.update;
        document.getElementById("new-update-date").value = window.Utils.toDisplayDate(u.date);
        document.getElementById("new-update-workers").value = u.workersCount;
        document.getElementById("new-update-completed").value = u.completed;
        document.getElementById("new-update-wip").value = u.wip || "";
        document.getElementById("new-update-tomorrow-plan").value = u.tomorrowPlanText || "";
        document.getElementById("update-mat-received").value = u.materialReceived || "";
        document.getElementById("update-mat-pending").value = u.materialPending || "";
        document.getElementById("update-supervisor").value = u.supervisor || "";
        if (modalTitleEl) modalTitleEl.textContent = "Edit Daily Site Update";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";

        // Labour Breakdown
        const lab = u.labour || {};
        document.getElementById("labour-carpenter").value = lab.carpenter || 0;
        document.getElementById("labour-helper").value = lab.helper || 0;
        document.getElementById("labour-painter").value = lab.painter || 0;
        document.getElementById("labour-electrician").value = lab.electrician || 0;
        document.getElementById("labour-plumber").value = lab.plumber || 0;

        // Trade progress
        const tp = u.tradeProgress || {};
        const trades = ['carpentry', 'electrical', 'painting', 'falseCeiling', 'stone', 'glass', 'modular'];
        trades.forEach(t => {
          const val = tp[t] || 0;
          const rangeEl = document.getElementById(`trade-${t}`);
          if (rangeEl) {
            rangeEl.value = val;
            rangeEl.nextElementSibling.innerText = val + "%";
          }
        });

        // Tomorrow checklist
        document.getElementById("new-update-tomorrow-checklist").value = (u.tomorrowChecklist || []).join(", ");

        // Delays
        const delObj = u.delay || {};
        document.getElementById("update-delay-type").value = delObj.type || "";
        document.getElementById("update-delay-owner").value = delObj.owner || "";
        document.getElementById("update-delay-reason").value = delObj.reason || "";
        document.getElementById("update-delay-res-date").value = delObj.expectedResolutionDate || "";

        // Snags (Reset on edit)
        document.getElementById("update-snag-issue").value = "";
        document.getElementById("update-snag-resp").value = "";
        document.getElementById("update-snag-target").value = "";

        // Photo info
        document.getElementById("update-photo-area").value = u.photoDetails ? (u.photoDetails.area || "") : "";
        document.getElementById("update-photo-remarks").value = u.photoDetails ? (u.photoDetails.remarks || "") : "";

        let initialPhoto = u.photo || "";
        if (initialPhoto && previewDiv && previewImg) {
          if (initialPhoto.startsWith("db://")) {
            const fileId = initialPhoto.substring(5);
            window.FileCache.get(fileId).then(base64 => {
              if (base64) {
                previewImg.src = base64;
                previewDiv.classList.remove("hidden");
              }
            });
          } else {
            previewImg.src = initialPhoto;
            previewDiv.classList.remove("hidden");
          }
        }
      } else {
        document.getElementById("new-update-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
        document.getElementById("new-update-workers").value = "6";
        document.getElementById("new-update-completed").value = "";
        document.getElementById("new-update-wip").value = "";
        document.getElementById("new-update-tomorrow-plan").value = "";
        document.getElementById("update-mat-received").value = "";
        document.getElementById("update-mat-pending").value = "";
        document.getElementById("update-supervisor").value = "";
        if (modalTitleEl) modalTitleEl.textContent = "Log Daily Site Update";
        if (submitBtnEl) submitBtnEl.textContent = "Save Update Log";

        // Reset inputs
        document.getElementById("labour-carpenter").value = 0;
        document.getElementById("labour-helper").value = 0;
        document.getElementById("labour-painter").value = 0;
        document.getElementById("labour-electrician").value = 0;
        document.getElementById("labour-plumber").value = 0;

        const trades = ['carpentry', 'electrical', 'painting', 'falseCeiling', 'stone', 'glass', 'modular'];
        trades.forEach(t => {
          const rangeEl = document.getElementById(`trade-${t}`);
          if (rangeEl) {
            rangeEl.value = 0;
            rangeEl.nextElementSibling.innerText = "0%";
          }
        });

        document.getElementById("new-update-tomorrow-checklist").value = "";
        document.getElementById("update-delay-type").value = "";
        document.getElementById("update-delay-owner").value = "";
        document.getElementById("update-delay-reason").value = "";
        document.getElementById("update-delay-res-date").value = "";
        document.getElementById("update-snag-issue").value = "";
        document.getElementById("update-snag-resp").value = "";
        document.getElementById("update-snag-target").value = "";
        document.getElementById("update-photo-area").value = "";
        document.getElementById("update-photo-remarks").value = "";

        let initialPhoto = options.photoUrl || "";
        if (initialPhoto && previewDiv && previewImg) {
          if (initialPhoto.startsWith("db://")) {
            const fileId = initialPhoto.substring(5);
            window.FileCache.get(fileId).then(base64 => {
              if (base64) {
                previewImg.src = base64;
                previewDiv.classList.remove("hidden");
              }
            });
          } else {
            previewImg.src = initialPhoto;
            previewDiv.classList.remove("hidden");
          }
        }
      }
    }
    
    if (modalId === "add-snag-modal") {
      if (isEdit && options.snag) {
        document.getElementById("new-snag-area").value = options.snag.area;
        document.getElementById("new-snag-desc").value = options.snag.issue;
        document.getElementById("new-snag-priority").value = options.snag.priority;
        document.getElementById("new-snag-assignee").value = options.snag.assignedTo;
        document.getElementById("new-snag-deadline").value = window.Utils.toDisplayDate(options.snag.deadline);
        if (modalTitleEl) modalTitleEl.textContent = "Edit Snag Card";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-snag-area").value = "";
        document.getElementById("new-snag-desc").value = "";
        document.getElementById("new-snag-priority").value = "Low";
        document.getElementById("new-snag-assignee").value = "Wood Crafts";
        document.getElementById("new-snag-deadline").value = window.Utils.toDisplayDate(new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]); // Default 3 days
        if (modalTitleEl) modalTitleEl.textContent = "Add Snag & Issue Card";
        if (submitBtnEl) submitBtnEl.textContent = "Create Snag Card";
      }
    }

    if (modalId === "add-material-modal") {
      if (isEdit && options.material) {
        document.getElementById("new-mat-name").value = options.material.name;
        document.getElementById("new-mat-brand").value = options.material.brand;
        document.getElementById("new-mat-code").value = options.material.finishCode;
        document.getElementById("new-mat-rate").value = options.material.rate;
        document.getElementById("new-mat-vendor").value = options.material.vendor;
        document.getElementById("new-mat-notes").value = options.material.notes;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Material Selection";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-mat-name").value = "";
        document.getElementById("new-mat-brand").value = "";
        document.getElementById("new-mat-code").value = "";
        document.getElementById("new-mat-rate").value = "";
        document.getElementById("new-mat-vendor").value = "Wood Crafts";
        document.getElementById("new-mat-notes").value = "";
        if (modalTitleEl) modalTitleEl.textContent = "Add Material Selection Row";
        if (submitBtnEl) submitBtnEl.textContent = "Add to Selection Tracker";
      }
    }

    if (modalId === "add-boq-modal") {
      if (isEdit && options.boq) {
        document.getElementById("new-boq-category").value = options.boq.category;
        document.getElementById("new-boq-desc").value = options.boq.description;
        document.getElementById("new-boq-qty").value = options.boq.qty;
        document.getElementById("new-boq-rate").value = options.boq.rate;
        document.getElementById("new-boq-margin").value = options.boq.margin;
        document.getElementById("new-boq-gst").value = options.boq.gst;
        if (modalTitleEl) modalTitleEl.textContent = "Edit BOQ Module Item";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-boq-category").value = "Civil";
        document.getElementById("new-boq-desc").value = "";
        document.getElementById("new-boq-qty").value = "";
        document.getElementById("new-boq-rate").value = "";
        document.getElementById("new-boq-margin").value = "15";
        document.getElementById("new-boq-gst").value = "18";
        if (modalTitleEl) modalTitleEl.textContent = "Add BOQ Module Item";
        if (submitBtnEl) submitBtnEl.textContent = "Add to BOQ";
      }
    }

    if (modalId === "add-invoice-modal") {
      if (isEdit && options.invoice) {
        document.getElementById("new-inv-milestone").value = options.invoice.type;
        document.getElementById("new-inv-amount").value = options.invoice.amount;
        document.getElementById("new-inv-date").value = window.Utils.toDisplayDate(options.invoice.date);
        if (modalTitleEl) modalTitleEl.textContent = "Edit Payment Milestone Invoice";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-inv-milestone").value = "";
        document.getElementById("new-inv-amount").value = "";
        document.getElementById("new-inv-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
        if (modalTitleEl) modalTitleEl.textContent = "Raise Payment Milestone Invoice";
        if (submitBtnEl) submitBtnEl.textContent = "Create Invoice";
      }
    }

    if (modalId === "add-vendor-modal") {
      if (isEdit && options.vendor) {
        document.getElementById("new-v-name").value = options.vendor.name;
        document.getElementById("new-v-category").value = options.vendor.category;
        document.getElementById("new-v-phone").value = options.vendor.phone;
        document.getElementById("new-v-delay").value = options.vendor.delayHistory;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Global Partner Vendor";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-v-name").value = "";
        document.getElementById("new-v-category").value = "Carpentry";
        document.getElementById("new-v-phone").value = "";
        document.getElementById("new-v-delay").value = "Low";
        if (modalTitleEl) modalTitleEl.textContent = "Register Global Partner Vendor";
        if (submitBtnEl) submitBtnEl.textContent = "Register Vendor";
      }
    }

    if (modalId === "add-document-modal") {
      const fileInput = document.getElementById("new-doc-file");
      if (fileInput) fileInput.value = "";

      const projectGroup = document.getElementById("doc-project-group");
      const projectSelect = document.getElementById("new-doc-project");
      
      if (projectGroup && projectSelect) {
        if (options.fromDashboard || !store.activeProjectId) {
          projectGroup.classList.remove("hidden");
          const projectsList = store.state.projects || [];
          projectSelect.innerHTML = projectsList.map(p => 
            `<option value="${p.id}" ${store.activeProjectId === p.id ? 'selected' : ''}>${p.name.split(' (')[0]}</option>`
          ).join('');
        } else {
          projectGroup.classList.add("hidden");
          projectSelect.innerHTML = `<option value="${store.activeProjectId || ''}">${store.activeProjectId || ''}</option>`;
          projectSelect.value = store.activeProjectId || "";
        }
      }

      if (isEdit && options.document) {
        document.getElementById("new-doc-folder").value = options.folder || "drawings";
        document.getElementById("new-doc-name").value = options.document.name;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Document Details";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-doc-folder").value = options.folder || "drawings";
        document.getElementById("new-doc-name").value = "";
        if (modalTitleEl) modalTitleEl.textContent = "Upload to Vault";
        if (submitBtnEl) submitBtnEl.textContent = "Upload Document";
      }
    }

    if (modalId === "edit-stage-modal") {
      if (options.stage) {
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        
        document.getElementById("edit-stage-original-name").value = options.stage.name;
        document.getElementById("edit-stage-project").value = proj ? proj.name : "N/A";
        document.getElementById("edit-stage-group").value = options.stage.stageGroup || "Execution";
        document.getElementById("edit-stage-name").value = options.stage.name;
        document.getElementById("edit-stage-owner").value = options.stage.owner || "";
        document.getElementById("edit-stage-status").value = options.stage.status || "Not Started";
        document.getElementById("edit-stage-progress").value = options.stage.progress || 0;
        document.getElementById("edit-stage-dependency").value = options.stage.dependency || "";
        document.getElementById("edit-stage-start").value = window.Utils.toDisplayDate(options.stage.startDate || "");
        document.getElementById("edit-stage-deadline").value = window.Utils.toDisplayDate(options.stage.deadline || "");
        document.getElementById("edit-stage-reason").value = options.stage.delayReason || "";
        document.getElementById("edit-stage-updated").value = options.stage.lastUpdated || "Never";
      }
    }

    if (modalId === "add-delivery-modal") {
      if (isEdit && options.delivery) {
        document.getElementById("new-del-item").value = options.delivery.item;
        document.getElementById("new-del-qty").value = options.delivery.qty;
        document.getElementById("new-del-date").value = window.Utils.toDisplayDate(options.delivery.date);
        document.getElementById("new-del-status").value = options.delivery.status;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Expected Delivery";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-del-item").value = "";
        document.getElementById("new-del-qty").value = "";
        document.getElementById("new-del-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
        document.getElementById("new-del-status").value = "Pending";
        if (modalTitleEl) modalTitleEl.textContent = "Add Expected Delivery";
        if (submitBtnEl) submitBtnEl.textContent = "Save Delivery Log";
      }
    }

    if (modalId === "add-visit-modal") {
      if (isEdit && options.visit) {
        document.getElementById("new-vis-visitor").value = options.visit.visitor;
        document.getElementById("new-vis-purpose").value = options.visit.purpose;
        document.getElementById("new-vis-date").value = window.Utils.toDisplayDate(options.visit.date);
        document.getElementById("new-vis-time").value = options.visit.time;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Site Visit";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";
      } else {
        document.getElementById("new-vis-visitor").value = "";
        document.getElementById("new-vis-purpose").value = "";
        document.getElementById("new-vis-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
        document.getElementById("new-vis-time").value = "11:00 AM";
        if (modalTitleEl) modalTitleEl.textContent = "Schedule Site Visit";
        if (submitBtnEl) submitBtnEl.textContent = "Save Site Visit";
      }
    }

    if (modalId === "connect-supabase-modal") {
      const urlInput = document.getElementById("supabase-connect-url");
      const keyInput = document.getElementById("supabase-connect-key");
      const phoneInput = document.getElementById("company-contact-phone");
      if (urlInput) urlInput.value = localStorage.getItem("supabase_url") || "";
      if (keyInput) keyInput.value = localStorage.getItem("supabase_key") || "";
      if (phoneInput) phoneInput.value = localStorage.getItem("company_phone") || "+91 98480 00000";

      const logoData = localStorage.getItem("company_logo");
      const previewContainer = document.getElementById("company-logo-preview-container");
      const previewImg = document.getElementById("company-logo-preview-img");
      const fileInput = document.getElementById("company-logo-file");
      if (fileInput) fileInput.value = "";
      if (logoData && previewContainer && previewImg) {
        previewImg.src = logoData;
        previewContainer.classList.remove("hidden");
      } else if (previewContainer) {
        previewContainer.classList.add("hidden");
      }
    }
    
    // --- 5 NEW DASHBOARD DRILL-DOWN MODALS ---
    if (modalId === "edit-dependency-modal") {
      const { projectId, dependencyId } = options;
      const p = store.state.projects.find(x => x.id === projectId);
      const d = p ? p.dependencies.find(x => x.id === dependencyId) : null;
      
      const titleEl = document.getElementById("edit-dep-project-title");
      if (titleEl && p) {
        titleEl.textContent = `Project: ${p.name}`;
      }
      
      if (p && d) {
        document.getElementById("edit-dep-name").value = d.description || "";
        document.getElementById("edit-dep-status").value = d.status || "Not Started";
        document.getElementById("edit-dep-blocked").value = d.blockedBy || "";
        document.getElementById("edit-dep-owner").value = d.owner || "";
        document.getElementById("edit-dep-target").value = d.targetDate || "";
        document.getElementById("edit-dep-resolution-date").value = d.resolutionDate || "";
        document.getElementById("edit-dep-remarks").value = d.remarks || d.completionNotes || "";

        // Highlight dependency flowchart node based on type
        const chainTypes = ['Design', 'Procurement', 'Production', 'Dispatch', 'Installation'];
        chainTypes.forEach(t => {
          const el = document.getElementById(`chain-node-${t.toLowerCase()}`);
          if (el) {
            const isMatch = d.type && d.type.toLowerCase().startsWith(t.toLowerCase().substring(0, 4));
            if (isMatch) {
              el.className = "px-1.5 py-0.5 rounded border border-amber-500 bg-amber-500/20 text-white font-bold";
            } else {
              el.className = "px-1.5 py-0.5 rounded border border-border-color/40 text-secondary";
            }
          }
        });
        
        // Time Impact
        const target = new Date(d.targetDate);
        const today = new Date();
        const elapsed = Math.ceil((today - target) / (1000 * 60 * 60 * 24));
        const days = (d.status !== 'Completed' && elapsed > 0) ? elapsed : 0;
        const timeImpactEl = document.getElementById("edit-dep-time-impact");
        if (timeImpactEl) {
          timeImpactEl.innerText = days > 0 ? `${days} Days Delayed` : "On Schedule";
          timeImpactEl.className = days > 0 ? "text-xs font-bold text-rose-500 font-mono block mt-0.5" : "text-xs font-bold text-emerald-400 font-mono block mt-0.5";
        }
        
        // Financial Impact
        let pendingBilling = 0;
        (p.billing || []).forEach(b => {
          if (b.status === "Pending") pendingBilling += b.amount;
        });
        const finImpactEl = document.getElementById("edit-dep-financial-impact");
        if (finImpactEl) {
          finImpactEl.innerText = window.Utils.formatCurrency(pendingBilling);
        }
        
        // Impact Analysis (Affected RFQs, POs, Materials, and Activities)
        const getKeywords = (str) => {
          return str.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        };
        const keywords = getKeywords(d.description).concat(getKeywords(d.type || ""));
        const matchesKeyword = (itemStr) => {
          if (!itemStr) return false;
          const lower = itemStr.toLowerCase();
          return keywords.some(k => lower.includes(k));
        };
        
        let impactList = [];
        const projectRFQs = (store.state.rfqs || []).filter(r => r.projectId === p.id && r.status !== 'Completed');
        projectRFQs.forEach(r => {
          if (matchesKeyword(r.itemDescription) || matchesKeyword(r.category)) {
            impactList.push(`RFQ: ${r.rfqNumber} - ${r.itemDescription} (${r.status})`);
          }
        });
        const projectPOs = (store.state.purchaseOrders || []).filter(po => po.projectId === p.id && po.status !== 'Delivered');
        projectPOs.forEach(po => {
          if (matchesKeyword(po.notes) || po.items.some(i => matchesKeyword(i.description) || matchesKeyword(i.category))) {
            impactList.push(`PO: ${po.poNumber} - Awaiting Delivery from ${po.vendorName}`);
          }
        });
        (p.materials || []).forEach(m => {
          if ((m.approved === 'Pending' || !m.ordered) && matchesKeyword(m.name)) {
            impactList.push(`Material Spec: ${m.name} (${m.approved === 'Pending' ? 'Awaiting Approval' : 'Awaiting Order'})`);
          }
        });
        (p.stages || []).forEach(st => {
          if (st.status !== 'Completed' && (matchesKeyword(st.name) || st.status === 'In Progress')) {
            impactList.push(`Site Stage: ${st.name} (${st.status} - ${st.progress}%)`);
          }
        });
        
        if (impactList.length === 0) {
          impactList.push(`General Blocker: Affects overall timeline of ${p.name.split(" (")[0]}`);
          const activeStage = p.stages.find(s => s.status === 'In Progress');
          if (activeStage) {
            impactList.push(`Site Stage: ${activeStage.name} is currently running`);
          }
        }
        
        const impactContainer = document.getElementById("edit-dep-impact-list");
        if (impactContainer) {
          impactContainer.innerHTML = impactList.map(imp => `
            <div class="flex items-center gap-1.5 py-1 text-secondary border-b border-border-color/10 last:border-0">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
              <span class="truncate" title="${imp}">${imp}</span>
            </div>
          `).join("");
        }
        
        const histList = document.getElementById("edit-dep-history-list");
        if (histList) {
          histList.innerHTML = (d.history || []).map(h => `
            <div class="border-b border-border-color/10 pb-1 last:border-0 last:pb-0">
              <span class="text-white font-mono font-semibold">${h.date} [${h.user}]</span>: ${h.text}
            </div>
          `).join("");
        }
      }
    }
    
    if (modalId === "health-details-modal") {
      const { projectId } = options;
      const p = store.state.projects.find(x => x.id === projectId);
      
      const titleEl = document.getElementById("health-details-project-title");
      if (titleEl && p) {
        titleEl.textContent = `Project: ${p.name}`;
      }
      
      if (p) {
        const score = store.getProjectHealthScore(p);
        const status = store.getProjectStatus(p);
        
        const scoreDisp = document.getElementById("health-details-score-display");
        if (scoreDisp) {
          scoreDisp.innerText = `${score}/100`;
          scoreDisp.className = `text-2xl font-black font-mono block mt-1 ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-blue-400' : score >= 40 ? 'text-amber-400' : 'text-rose-500'}`;
        }
        
        const statusBdg = document.getElementById("health-details-status-badge");
        if (statusBdg) {
          statusBdg.innerText = status.label;
          statusBdg.className = `px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${status.bg} ${status.color}`;
        }
        
        // Dynamic lists of activities
        const completedItems = [];
        const pendingItems = [];
        const blockedItems = [];
        const overdueItems = [];
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Check stages
        p.stages.forEach(s => {
          const clickAction = `window.openModal('edit-stage-modal', { projectId: '${p.id}', stage: ${JSON.stringify(s).replace(/"/g, '&quot;')} }); window.closeModal('health-details-modal');`;
          if (s.status === 'Completed') {
            completedItems.push({ text: `Milestone Completed: <b>${s.name}</b>`, clickAction });
          } else if (s.deadline < todayStr) {
            overdueItems.push({ text: `Timeline Overdue: <b>${s.name}</b> (Due: ${s.deadline})`, clickAction });
          } else {
            pendingItems.push({ text: `Stage Pending: <b>${s.name}</b> (Target: ${s.deadline || "TBD"})`, clickAction });
          }
        });
        
        // Check materials
        p.materials.forEach(m => {
          const clickAction = `window.openModal('add-material-modal', { projectId: '${p.id}', material: ${JSON.stringify(m).replace(/"/g, '&quot;')}, isEdit: true }); window.closeModal('health-details-modal');`;
          if (m.approved === 'Approved') {
            completedItems.push({ text: `Material Spec Approved: <b>${m.name}</b>`, clickAction });
          } else {
            pendingItems.push({ text: `Material Approval Pending: <b>${m.name}</b>`, clickAction });
          }
        });
        
        // Check dependencies
        p.dependencies.forEach(d => {
          const clickAction = `window.openModal('edit-dependency-modal', { projectId: '${p.id}', dependencyId: '${d.id}' }); window.closeModal('health-details-modal');`;
          if (d.status === 'Completed' || d.status === 'Resolved') {
            completedItems.push({ text: `Dependency Resolved: <b>${d.description}</b>`, clickAction });
          } else if (d.status === 'Blocked') {
            blockedItems.push({ text: `Dependency Blocked: <b>${d.description}</b> (Blocked by: ${d.blockedBy}, Owner: ${d.owner})`, clickAction });
          } else {
            pendingItems.push({ text: `Dependency Pending: <b>${d.description}</b> (Owner: ${d.owner})`, clickAction });
          }
        });

        // Check snags
        p.snags.forEach(s => {
          const clickAction = `window.openModal('add-snag-modal', { projectId: '${p.id}', snag: ${JSON.stringify(s).replace(/"/g, '&quot;')}, isEdit: true }); window.closeModal('health-details-modal');`;
          if (s.status === 'Open') {
            if (s.deadline < todayStr) {
              overdueItems.push({ text: `Overdue Snag: <b>${s.issue}</b> (Assigned: ${s.assignedTo})`, clickAction });
            } else {
              pendingItems.push({ text: `Open Snag: <b>${s.issue}</b> (Target: ${s.deadline})`, clickAction });
            }
          }
        });

        // Check deliveries
        p.deliveries.forEach(d => {
          const clickAction = `window.openModal('add-delivery-modal', { projectId: '${p.id}', delivery: ${JSON.stringify(d).replace(/"/g, '&quot;')}, isEdit: true }); window.closeModal('health-details-modal');`;
          if (d.status === 'Pending') {
            if (d.date < todayStr) {
              overdueItems.push({ text: `Overdue Delivery: <b>${d.item}</b> (Target: ${d.date})`, clickAction });
            } else {
              pendingItems.push({ text: `Delivery Expected: <b>${d.item}</b> (Date: ${d.date})`, clickAction });
            }
          }
        });
        
        document.getElementById("health-count-completed").innerText = completedItems.length;
        document.getElementById("health-count-pending").innerText = pendingItems.length;
        document.getElementById("health-count-blocked").innerText = blockedItems.length;
        document.getElementById("health-count-overdue").innerText = overdueItems.length;
        
        const renderBulletList = (list) => {
          if (list.length === 0) return `<div class="text-muted italic py-1">No items in this category</div>`;
          return list.map(item => `
            <div onclick="${item.clickAction || ''}" class="flex items-start gap-1.5 py-1 px-1.5 rounded text-secondary hover:bg-hover/30 hover:text-white cursor-pointer transition-all border border-transparent hover:border-amber-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <span>${item.text}</span>
            </div>
          `).join("");
        };
        
        document.getElementById("health-list-completed").innerHTML = renderBulletList(completedItems);
        document.getElementById("health-list-pending").innerHTML = renderBulletList(pendingItems);
        document.getElementById("health-list-blocked").innerHTML = renderBulletList(blockedItems);
        document.getElementById("health-list-overdue").innerHTML = renderBulletList(overdueItems);
        
        // Auto-apply pre-loaded filter if any
        setTimeout(() => {
          this.filterHealthLists(options.filter || 'all');
        }, 50);
      }
    }
    
    if (modalId === "progress-breakdown-modal") {
      const { projectId } = options;
      const p = store.state.projects.find(x => x.id === projectId);
      
      const titleEl = document.getElementById("progress-breakdown-project-title");
      if (titleEl && p) {
        titleEl.textContent = `Project: ${p.name}`;
      }
      
      if (p) {
        const latestUpdate = (p.updates || []).find(u => u.tradeProgress && Object.keys(u.tradeProgress).length > 0);
        const tp = latestUpdate ? latestUpdate.tradeProgress : {};
        const trades = ['carpentry', 'electrical', 'painting', 'falseCeiling', 'stone', 'glass', 'modular'];
        trades.forEach(t => {
          const val = tp[t] || 0;
          const input = document.getElementById(`breakdown-trade-${t}`);
          if (input) {
            input.value = val;
            input.nextElementSibling.innerText = val + "%";
          }
        });
        
        // List of site milestones
        const completedMilestones = p.stages.filter(s => s.status === 'Completed').map(s => s.name);
        const pendingMilestones = p.stages.filter(s => s.status === 'In Progress' && s.progress < 100).map(s => `${s.name} (${s.progress}%)`);
        const todayStr = new Date().toISOString().split('T')[0];
        const blockedMilestones = p.stages.filter(s => s.status !== 'Completed' && s.deadline < todayStr).map(s => `${s.name} (Overdue since ${s.deadline})`);
        
        const renderListHTML = (list) => {
          if (list.length === 0) return `<div class="text-muted italic py-0.5">None</div>`;
          return list.map(item => `<div class="py-0.5">• ${item}</div>`).join("");
        };
        
        document.getElementById("breakdown-list-completed").innerHTML = renderListHTML(completedMilestones);
        document.getElementById("breakdown-list-pending").innerHTML = renderListHTML(pendingMilestones);
        document.getElementById("breakdown-list-blocked").innerHTML = renderListHTML(blockedMilestones);
      }
    }
    
    if (modalId === "bottleneck-details-modal") {
      const { projectId, dependencyId } = options;
      const p = store.state.projects.find(x => x.id === projectId);
      const d = p ? p.dependencies.find(x => x.id === dependencyId) : null;
      
      const titleEl = document.getElementById("bottleneck-details-project");
      if (titleEl && p) {
        titleEl.textContent = `Project: ${p.name}`;
      }
      
      if (p && d) {
        document.getElementById("bottleneck-details-activity").textContent = d.description || "";
        
        const target = new Date(d.targetDate);
        const today = new Date();
        const elapsed = Math.ceil((today - target) / (1000 * 60 * 60 * 24));
        const days = (d.status !== 'Completed' && elapsed > 0) ? elapsed : 0;
        document.getElementById("bottleneck-details-days").textContent = days > 0 ? `${days} Days Delay` : "On Schedule";
        
        document.getElementById("bottleneck-details-blocked").textContent = d.blockedBy || "Client Approval";
        document.getElementById("bottleneck-details-owner").textContent = d.owner || "Client";
        document.getElementById("bottleneck-details-resolution").textContent = d.targetDate || "";
        document.getElementById("bottleneck-details-remarks").textContent = d.remarks || d.completionNotes || "No detailed remarks added yet.";
        
        // Resolve button action
        const resolveBtn = document.getElementById("bottleneck-action-resolve");
        if (resolveBtn) {
          resolveBtn.onclick = () => {
            closeModal("bottleneck-details-modal");
            openModal("edit-dependency-modal", { projectId: p.id, dependencyId: d.id });
          };
        }
        
        // Downstream impact assessment
        const getKeywords = (str) => {
          return str.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        };
        const keywords = getKeywords(d.description).concat(getKeywords(d.type || ""));
        const matchesKeyword = (itemStr) => {
          if (!itemStr) return false;
          const lower = itemStr.toLowerCase();
          return keywords.some(k => lower.includes(k));
        };
        
        let impactList = [];
        const projectRFQs = (store.state.rfqs || []).filter(r => r.projectId === p.id && r.status !== 'Completed');
        projectRFQs.forEach(r => {
          if (matchesKeyword(r.itemDescription) || matchesKeyword(r.category)) {
            impactList.push(`RFQ: ${r.rfqNumber} - ${r.itemDescription} (${r.status})`);
          }
        });
        const projectPOs = (store.state.purchaseOrders || []).filter(po => po.projectId === p.id && po.status !== 'Delivered');
        projectPOs.forEach(po => {
          if (matchesKeyword(po.notes) || po.items.some(i => matchesKeyword(i.description) || matchesKeyword(i.category))) {
            impactList.push(`PO: ${po.poNumber} - Awaiting Delivery from ${po.vendorName}`);
          }
        });
        (p.materials || []).forEach(m => {
          if ((m.approved === 'Pending' || !m.ordered) && matchesKeyword(m.name)) {
            impactList.push(`Procurement: ${m.name} (${m.approved === 'Pending' ? 'Approval Awaiting' : 'Pending Order'})`);
          }
        });
        (p.stages || []).forEach(st => {
          if (st.status !== 'Completed' && (matchesKeyword(st.name) || st.status === 'In Progress')) {
            impactList.push(`Site Activity: ${st.name} is currently ${st.status}`);
          }
        });
        
        if (impactList.length === 0) {
          impactList.push(`General Blocker: Delays project workspace timeline`);
          const activeStage = p.stages.find(s => s.status === 'In Progress');
          if (activeStage) {
            impactList.push(`Site Activity: ${activeStage.name} is currently running`);
          }
        }
        
        document.getElementById("bottleneck-impact-list").innerHTML = impactList.map(imp => `
          <div class="flex items-center gap-1.5 py-1 border-b border-border-color/10 last:border-0 text-secondary">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
            <span class="truncate" title="${imp}">${imp}</span>
          </div>
        `).join("");
        
        document.getElementById("bottleneck-history-list").innerHTML = (d.history || []).map(h => `
          <div class="border-b border-border-color/10 pb-1 last:border-0 last:pb-0 text-secondary">
            <span class="text-white font-mono">${h.date} [${h.user}]</span>: ${h.text}
          </div>
        `).join("");
      }
    }
    
    if (modalId === "waiting-details-modal") {
      const { projectId, dependencyId } = options;
      const p = store.state.projects.find(x => x.id === projectId);
      const d = p ? p.dependencies.find(x => x.id === dependencyId) : null;
      
      const titleEl = document.getElementById("waiting-project-title");
      if (titleEl && p) {
        titleEl.textContent = `Project: ${p.name}`;
      }
      
      if (p && d) {
        document.getElementById("waiting-title").textContent = d.description || "";
        document.getElementById("waiting-owner").textContent = d.owner || "";
        document.getElementById("waiting-since").textContent = d.targetDate || "";
        
        const target = new Date(d.targetDate);
        const today = new Date();
        const elapsed = Math.ceil((today - target) / (1000 * 60 * 60 * 24));
        const days = (d.status !== 'Completed' && elapsed > 0) ? elapsed : 0;
        document.getElementById("waiting-delay-est").textContent = days > 0 ? `${days} Days` : "0 Days";
        
        // Financial impact (sum of pending bills)
        let pendingBilling = 0;
        (p.billing || []).forEach(b => {
          if (b.status === "Pending") pendingBilling += b.amount;
        });
        document.getElementById("waiting-financial").textContent = window.Utils.formatCurrency(pendingBilling);
        
        // Affected activities
        const affected = p.stages.filter(s => s.status !== 'Completed').map(s => s.name);
        document.getElementById("waiting-affected-list").innerHTML = affected.map(act => `
          <div class="flex items-center gap-1.5 py-0.5 text-secondary">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
            <span class="truncate">${act}</span>
          </div>
        `).join("");
        
        // Remind button action
        const remindBtn = document.getElementById("waiting-action-remind");
        if (remindBtn) {
          remindBtn.onclick = () => {
            const message = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Urgent Action Required Reminder*\n\n• *Project Name:* ${p.name.split(" (")[0]}\n• *Pending Item:* ${d.description}\n• *Responsible Owner:* ${d.owner}\n• *Outstanding Invoice Collections:* ${window.Utils.formatCurrency(pendingBilling)}\n\nPlease assist in resolving this blocker at the earliest to prevent further site timeline delays.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Client & Vendor Sync_`;
            window.WhatsAppService.shareText(message);
            closeModal("waiting-details-modal");
          };
        }
      }
    }

    if (modalId === "add-decision-modal") {
      document.getElementById("new-decision-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
      document.getElementById("new-decision-requested-by").value = "";
      document.getElementById("new-decision-approved-by").value = "";
      document.getElementById("new-decision-description").value = "";
      document.getElementById("new-decision-impact").value = "Structural modification";
      document.getElementById("new-decision-cost-impact").value = "";
      document.getElementById("new-decision-time-impact").value = "";
      document.getElementById("new-decision-attachment-name").value = "";
      window.Utils.setupDateMask(document.getElementById("new-decision-date"));
    }

    if (modalId === "add-change-modal") {
      document.getElementById("new-change-date").value = window.Utils.toDisplayDate(new Date().toISOString().split('T')[0]);
      document.getElementById("new-change-reason").value = "";
      document.getElementById("new-change-original-scope").value = "";
      document.getElementById("new-change-revised-scope").value = "";
      document.getElementById("new-change-cost-diff").value = "";
      document.getElementById("new-change-time-diff").value = "";
      document.getElementById("new-change-status").value = "Pending";
      window.Utils.setupDateMask(document.getElementById("new-change-date"));
    }

    if (modalId === "daily-report-modal") {
      const { projectId, updateDate } = options;
      const proj = store.state.projects.find(p => p.id === projectId);
      const update = proj ? proj.updates.find(u => u.date === updateDate) : null;
      
      this.activeReportData = { project: proj, update: update };
      this.activeReportTab = "client";
      this.renderReportContent();
    }

    if (modalId === "cash-flow-drilldown-modal") {
      const category = options.category || "collections";
      const titleEl = document.getElementById("cash-flow-modal-title");
      const totalValEl = document.getElementById("cash-flow-total-val");
      const projectsCountEl = document.getElementById("cash-flow-projects-count");
      const pendingCountEl = document.getElementById("cash-flow-pending-count");
      const tbodyEl = document.getElementById("cash-flow-details-tbody");
      
      const thRef = document.getElementById("cf-th-ref");
      const thRecipient = document.getElementById("cf-th-recipient");
      
      let rowsHTML = "";
      let totalAmount = 0;
      let uniqueProjects = new Set();
      let pendingCount = 0;
      
      if (category === "collections") {
        titleEl.textContent = "Pending Client Collections Ledger";
        thRef.textContent = "Milestone Invoice Ref";
        thRecipient.textContent = "Client Name";
        
        store.state.projects.forEach(p => {
          (p.billing || []).forEach(b => {
            if (b.status === "Pending") {
              totalAmount += b.amount;
              uniqueProjects.add(p.id);
              pendingCount++;
              
              rowsHTML += `
                <tr class="hover:bg-hover/10 transition-colors border-b border-border-color/10">
                  <td class="p-2 font-semibold text-white">${p.name.split(" (")[0]}</td>
                  <td class="p-2">${b.type} (Inv: ${b.invoiceNo || 'N/A'})</td>
                  <td class="p-2 text-secondary">${p.clientName}</td>
                  <td class="p-2 text-right font-mono text-emerald-400 font-bold">₹${b.amount.toLocaleString('en-IN')}</td>
                  <td class="p-2 font-mono">${window.Utils.formatDate(b.date)}</td>
                  <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">PENDING</span></td>
                </tr>
              `;
            }
          });
        });
        
        pendingCountEl.textContent = `${pendingCount} Invoices`;
      } 
      else if (category === "payouts") {
        titleEl.textContent = "Vendor Payments Due Ledger";
        thRef.textContent = "Payout Category / Purpose";
        thRecipient.textContent = "Vendor / Contractor";
        
        const payouts = store.state.payouts || [];
        payouts.forEach(po => {
          if (po.status !== "Paid" && po.status !== "Rejected" && po.status !== "Closed") {
            totalAmount += po.amount;
            uniqueProjects.add(po.projectId);
            pendingCount++;
            
            const proj = store.state.projects.find(p => p.id === po.projectId) || { name: "Global" };
            rowsHTML += `
              <tr class="hover:bg-hover/10 transition-colors border-b border-border-color/10">
                <td class="p-2 font-semibold text-white">${proj.name.split(" (")[0]}</td>
                <td class="p-2">${po.notes || po.category || 'Vendor Payout'}</td>
                <td class="p-2 text-secondary">${po.vendorName || po.contractor || 'N/A'}</td>
                <td class="p-2 text-right font-mono text-rose-400 font-bold">₹${po.amount.toLocaleString('en-IN')}</td>
                <td class="p-2 font-mono">${window.Utils.formatDate(po.createdDate || po.date)}</td>
                <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">${po.status.toUpperCase()}</span></td>
              </tr>
            `;
          }
        });
        
        pendingCountEl.textContent = `${pendingCount} Payouts`;
      } 
      else if (category === "net_cash") {
        titleEl.textContent = "Net Cash Position Ledger (Collections vs. Payouts)";
        thRef.textContent = "Total Collections Received";
        thRecipient.textContent = "Total Vendor Payouts Paid";
        
        store.state.projects.forEach(p => {
          let projectCollections = 0;
          let projectPayouts = 0;
          
          (p.billing || []).forEach(b => {
            if (b.status === "Paid") projectCollections += b.amount;
          });
          
          const payouts = store.state.payouts || [];
          payouts.forEach(po => {
            if (po.projectId === p.id && po.status === "Paid") {
              projectPayouts += po.amount;
            }
          });
          
          const diff = projectCollections - projectPayouts;
          totalAmount += diff;
          uniqueProjects.add(p.id);
          
          rowsHTML += `
            <tr class="hover:bg-hover/10 transition-colors border-b border-border-color/10">
              <td class="p-2 font-semibold text-white">${p.name.split(" (")[0]}</td>
              <td class="p-2 font-mono text-emerald-400">₹${projectCollections.toLocaleString('en-IN')}</td>
              <td class="p-2 font-mono text-rose-400">₹${projectPayouts.toLocaleString('en-IN')}</td>
              <td class="p-2 text-right font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">₹${diff.toLocaleString('en-IN')}</td>
              <td class="p-2 font-mono">-</td>
              <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded text-[8px] ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} font-bold">${diff >= 0 ? 'SURPLUS' : 'DEFICIT'}</span></td>
            </tr>
          `;
        });
        
        pendingCountEl.textContent = `Net Cash Balance`;
      } 
      else if (category === "commitments") {
        titleEl.textContent = "Upcoming Payment Commitments Ledger";
        thRef.textContent = "PO Number & Description";
        thRecipient.textContent = "Vendor Partner";
        
        const pos = store.state.purchaseOrders || [];
        pos.forEach(po => {
          if (po.status !== 'Delivered' && po.status !== 'Rejected') {
            const amount = po.totalAmount || (po.items || []).reduce((sum, item) => sum + (item.qty * item.rate), 0);
            totalAmount += amount;
            uniqueProjects.add(po.projectId);
            pendingCount++;
            
            const proj = store.state.projects.find(p => p.id === po.projectId) || { name: "Global" };
            rowsHTML += `
              <tr class="hover:bg-hover/10 transition-colors border-b border-border-color/10">
                <td class="p-2 font-semibold text-white">${proj.name.split(" (")[0]}</td>
                <td class="p-2">${po.poNumber} - ${po.notes || 'Materials Release'}</td>
                <td class="p-2 text-secondary">${po.vendorName}</td>
                <td class="p-2 text-right font-mono text-cyan-400 font-bold">₹${amount.toLocaleString('en-IN')}</td>
                <td class="p-2 font-mono">${window.Utils.formatDate(po.deliveryDate || po.date)}</td>
                <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">${po.status.toUpperCase()}</span></td>
              </tr>
            `;
          }
        });
        
        pendingCountEl.textContent = `${pendingCount} POs Pending`;
      }
      
      totalValEl.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
      projectsCountEl.textContent = `${uniqueProjects.size} Projects`;
      tbodyEl.innerHTML = rowsHTML || `<tr><td colspan="6" class="p-8 text-center text-secondary italic">No details matching this ledger category found.</td></tr>`;
    }

    // Refresh icons & setup masks
    if (window.lucide) lucide.createIcons();
    window.Utils.setupAllDateMasks();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove("flex");
    modal.classList.add("hidden");
    
    delete this.activeOptions[modalId];
  },

  populateSelectOptions() {
    const store = window.AppStore;
    
    // Populate vendor dropdowns in snag & material modals
    const vendorSelects = [
      document.getElementById("new-snag-assignee"),
      document.getElementById("new-mat-vendor")
    ];
    
    vendorSelects.forEach(select => {
      if (!select) return;
      select.innerHTML = "";
      store.state.vendors.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.category})`;
        select.appendChild(opt);
      });
    });
  },

  setupFormListeners() {
    const store = window.AppStore;
    const db = window.dbService;
    
    // Auto-populate document file name field when a file is chosen
    const docFile = document.getElementById("new-doc-file");
    const docName = document.getElementById("new-doc-name");
    if (docFile && docName) {
      docFile.onchange = () => {
        if (docFile.files && docFile.files.length > 0) {
          docName.value = docFile.files[0].name;
        }
      };
    }

    // Handle company logo file selection preview
    const logoFile = document.getElementById("company-logo-file");
    if (logoFile) {
      logoFile.onchange = () => {
        const previewContainer = document.getElementById("company-logo-preview-container");
        const previewImg = document.getElementById("company-logo-preview-img");
        if (logoFile.files && logoFile.files[0] && previewContainer && previewImg) {
          const file = logoFile.files[0];
          if (file.size > 1.5 * 1024 * 1024) {
            alert(`Logo file "${file.name}" is too large. Max 1.5MB allowed.`);
            logoFile.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.classList.remove("hidden");
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // 1. Create/Edit Project Form
    const projForm = document.getElementById("create-project-form");
    if (projForm) {
      projForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["add-project-modal"] || {};
        
        const nameVal = document.getElementById("new-proj-name").value;
        const clientVal = document.getElementById("new-proj-client").value;
        const locationVal = document.getElementById("new-proj-location").value;
        const budgetVal = parseFloat(document.getElementById("new-proj-budget").value) || 0;
        const startVal = window.Utils.toISODate(document.getElementById("new-proj-start").value);
        const endVal = window.Utils.toISODate(document.getElementById("new-proj-end").value);
        
        if (options.isEdit && options.project) {
          const proj = store.state.projects.find(p => p.id === options.project.id);
          if (proj) {
            proj.name = nameVal;
            proj.clientName = clientVal;
            proj.location = locationVal;
            proj.budget = budgetVal;
            proj.startDate = startVal;
            proj.endDate = endVal;
            await db.saveProject(proj);
            this.showToast("Project details updated successfully!");
          }
        } else {
          const newProj = {
            id: `project-${Date.now()}`,
            name: nameVal,
            clientName: clientVal,
            location: locationVal,
            budget: budgetVal,
            stage: "Civil work",
            progress: 10,
            startDate: startVal,
            endDate: endVal,
            team: {
              designer: "S. Kumar (Principal Architect)",
              engineer: "Rajesh Nair (Site Lead)",
              pm: "Abhilash Reddy (Project Manager)"
            },
            notes: "New project workspace initialized.",
            drawings: [],
            vault: { drawings: [], agreements: [], quotations: [], invoices: [] },
            materials: [],
            stages: [
              { name: "Demolition", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Civil work", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Electrical roughing", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Plumbing", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Ceiling framing", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Carpentry framing", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Tile laying", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Painting", progress: 0, status: "Not Started", deadline: "", delayReason: "" },
              { name: "Handover", progress: 0, status: "Not Started", deadline: "", delayReason: "" }
            ],
            boq: [],
            updates: [],
            snags: [],
            billing: [],
            deliveries: [],
            visits: []
          };
          await db.saveProject(newProj);
          this.showToast("Project Workspace created successfully!");
          window.AppRouter.navigate("project-details", newProj.id);
        }
        
        projForm.reset();
        this.closeModal("add-project-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 2. Add/Edit Daily Update Form
    const updateForm = document.getElementById("create-update-form");
    if (updateForm) {
      // Add local preview onchange listener once
      const photoFileInput = document.getElementById("new-update-photo-file");
      if (photoFileInput) {
        photoFileInput.onchange = () => {
          const previewDiv = document.getElementById("new-update-photo-preview");
          const previewImg = document.getElementById("new-update-photo-img");
          if (photoFileInput.files && photoFileInput.files[0] && previewDiv && previewImg) {
            const file = photoFileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
              previewImg.src = e.target.result;
              previewDiv.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
          }
        };
      }

      updateForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-update-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const dateVal = window.Utils.toISODate(document.getElementById("new-update-date").value);
        const workers = parseInt(document.getElementById("new-update-workers").value) || 0;
        const completed = document.getElementById("new-update-completed").value;
        
        let photoUrl = options.photoUrl || (options.isEdit && options.update.photo) || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80";
        
        // Handle file upload
        const photoFile = photoFileInput ? photoFileInput.files[0] : null;
        if (photoFile) {
          if (photoFile.size > 15 * 1024 * 1024) {
            alert(`Photo "${photoFile.name}" is too large. Max 15MB allowed.`);
            return;
          }
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve("#");
            reader.readAsDataURL(photoFile);
          });
          if (base64 !== "#") {
            const fileId = "file-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
            await window.FileCache.set(fileId, base64);
            if (db.isCloudActive()) {
              try {
                await db.client.from('document_files').upsert({ id: fileId, file_data: base64, updated_at: new Date().toISOString() });
              } catch(err){}
            }
            photoUrl = "db://" + fileId;
          }
        } else if (photoUrl.startsWith("data:image/")) {
          const fileId = "file-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
          await window.FileCache.set(fileId, photoUrl);
          if (db.isCloudActive()) {
            try {
              await db.client.from('document_files').upsert({ id: fileId, file_data: photoUrl, updated_at: new Date().toISOString() });
            } catch(err){}
          }
          photoUrl = "db://" + fileId;
        }

        // Build upgraded update details
        const tomorrowChecklistVal = document.getElementById("new-update-tomorrow-checklist").value;
        const tomorrowChecklist = tomorrowChecklistVal
          ? tomorrowChecklistVal.split(",").map(s => s.trim()).filter(Boolean)
          : [];

        const updateObj = {
          date: dateVal,
          completed,
          wip: document.getElementById("new-update-wip").value || "",
          workersCount: workers,
          issues: document.getElementById("update-delay-type").value ? "Yes" : "None",
          tomorrowPlan: tomorrowChecklist.join(", "),
          tomorrowPlanText: document.getElementById("new-update-tomorrow-plan").value || "",
          materialReceived: document.getElementById("update-mat-received").value || "",
          materialPending: document.getElementById("update-mat-pending").value || "",
          supervisor: document.getElementById("update-supervisor").value || "",
          photo: photoUrl,
          labour: {
            carpenter: parseInt(document.getElementById("labour-carpenter").value) || 0,
            helper: parseInt(document.getElementById("labour-helper").value) || 0,
            painter: parseInt(document.getElementById("labour-painter").value) || 0,
            electrician: parseInt(document.getElementById("labour-electrician").value) || 0,
            plumber: parseInt(document.getElementById("labour-plumber").value) || 0
          },
          tradeProgress: {
            carpentry: parseInt(document.getElementById("trade-carpentry").value) || 0,
            electrical: parseInt(document.getElementById("trade-electrical").value) || 0,
            painting: parseInt(document.getElementById("trade-painting").value) || 0,
            falseCeiling: parseInt(document.getElementById("trade-falseCeiling").value) || 0,
            stone: parseInt(document.getElementById("trade-stone").value) || 0,
            glass: parseInt(document.getElementById("trade-glass").value) || 0,
            modular: parseInt(document.getElementById("trade-modular").value) || 0
          },
          tomorrowChecklist: tomorrowChecklist,
          photoDetails: {
            area: document.getElementById("update-photo-area").value || "",
            remarks: document.getElementById("update-photo-remarks").value || ""
          }
        };

        // Handle delay reporting
        const delayType = document.getElementById("update-delay-type").value;
        if (delayType) {
          updateObj.delay = {
            type: delayType,
            owner: document.getElementById("update-delay-owner").value || "Site PM",
            reason: document.getElementById("update-delay-reason").value || "Site issue",
            expectedResolutionDate: document.getElementById("update-delay-res-date").value || dateVal
          };

          // Add to project dependencies to log bottleneck
          if (!proj.dependencies) proj.dependencies = [];
          proj.dependencies.push({
            id: "dep-delay-" + Date.now(),
            type: delayType.split(" ")[0],
            description: updateObj.delay.reason,
            blockedBy: updateObj.delay.owner,
            owner: updateObj.delay.owner,
            targetDate: updateObj.delay.expectedResolutionDate,
            status: "Blocked",
            daysDelayed: 4
          });
          store.logActivity('project', `Delay reported: ${delayType} - ${updateObj.delay.reason}`, proj.name);
        }

        // Save material status selections
        const matSelects = document.querySelectorAll(".update-material-status-select");
        matSelects.forEach(sel => {
          const mId = sel.getAttribute("data-mat-id");
          const status = sel.value;
          const mat = proj.materials.find(m => m.id === mId);
          if (mat) {
            if (status === "Installed") {
              mat.installed = true;
              mat.delivered = true;
              mat.ordered = true;
            } else if (status === "Received") {
              mat.installed = false;
              mat.delivered = true;
              mat.ordered = true;
            } else if (status === "Ordered") {
              mat.installed = false;
              mat.delivered = false;
              mat.ordered = true;
            } else {
              mat.installed = false;
              mat.delivered = false;
              mat.ordered = false;
            }
          }
        });

        // Save snag
        const snagIssue = document.getElementById("update-snag-issue").value;
        if (snagIssue) {
          if (!proj.snags) proj.snags = [];
          const newSnag = {
            id: "snag-" + Date.now(),
            area: updateObj.photoDetails.area || "Site Area",
            issue: snagIssue,
            priority: "High",
            assignedTo: document.getElementById("update-snag-resp").value || "Wood Crafts",
            status: "Open",
            deadline: document.getElementById("update-snag-target").value || dateVal
          };
          proj.snags.push(newSnag);
          store.logActivity('snag', `New snag raised: ${snagIssue}`, proj.name);
        }

        if (options.isEdit && typeof options.updateIndex !== 'undefined') {
          proj.updates[options.updateIndex] = updateObj;
          this.showToast("Daily log updated successfully!");
        } else {
          proj.updates.unshift(updateObj);
          this.showToast("Daily site update logged!");
          setTimeout(() => this.promptWhatsAppShare("daily-log", proj.id, dateVal), 400);
        }
        
        await db.saveProject(proj);
        store.logActivity('update', `Daily site log logged: ${completed.substring(0, 30)}...`, proj.name);
        updateForm.reset();
        this.closeModal("add-update-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 3. Add/Edit Snag Form
    const snagForm = document.getElementById("create-snag-form");
    if (snagForm) {
      snagForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-snag-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const area = document.getElementById("new-snag-area").value;
        const issue = document.getElementById("new-snag-desc").value;
        const priority = document.getElementById("new-snag-priority").value;
        const assignedTo = document.getElementById("new-snag-assignee").value;
        const deadline = window.Utils.toISODate(document.getElementById("new-snag-deadline").value);
        
        if (options.isEdit && options.snag) {
          const s = proj.snags.find(x => x.id === options.snag.id);
          if (s) {
            s.area = area;
            s.issue = issue;
            s.priority = priority;
            s.assignedTo = assignedTo;
            s.deadline = deadline;
          }
          this.showToast("Snag card updated successfully!");
        } else {
          const newSnag = {
            id: `snag-${Date.now()}`,
            area,
            issue,
            priority,
            assignedTo,
            status: "Open",
            deadline
          };
          proj.snags.unshift(newSnag);
          this.showToast("New snag card added!");
          setTimeout(() => this.promptWhatsAppShare("snag", proj.id, newSnag.id), 400);
        }
        
        await db.saveProject(proj);
        snagForm.reset();
        this.closeModal("add-snag-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 4. Add/Edit Material Form
    const matForm = document.getElementById("create-material-form");
    if (matForm) {
      matForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-material-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const name = document.getElementById("new-mat-name").value;
        const brand = document.getElementById("new-mat-brand").value;
        const finishCode = document.getElementById("new-mat-code").value;
        const rate = parseFloat(document.getElementById("new-mat-rate").value) || 0;
        const vendor = document.getElementById("new-mat-vendor").value;
        const notes = document.getElementById("new-mat-notes").value || "";
        
        if (options.isEdit && options.material) {
          const m = proj.materials.find(x => x.id === options.material.id);
          if (m) {
            m.name = name;
            m.brand = brand;
            m.finishCode = finishCode;
            m.rate = rate;
            m.vendor = vendor;
            m.notes = notes;
          }
          this.showToast("Material specifications updated!");
        } else {
          const newMat = {
            id: `mat-${Date.now()}`,
            name,
            brand,
            finishCode,
            approved: "Pending",
            ordered: false,
            delivered: false,
            installed: false,
            vendor,
            rate,
            notes,
            approvalLog: []
          };
          proj.materials.push(newMat);
          this.showToast("Material selection added to tracker!");
          setTimeout(() => this.promptWhatsAppShare("material-approval", proj.id, newMat.id), 400);
        }
        
        await db.saveProject(proj);
        matForm.reset();
        this.closeModal("add-material-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 5. Add/Edit BOQ Form
    const boqForm = document.getElementById("create-boq-form");
    if (boqForm) {
      boqForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-boq-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const category = document.getElementById("new-boq-category").value;
        const description = document.getElementById("new-boq-desc").value;
        const qty = parseFloat(document.getElementById("new-boq-qty").value) || 0;
        const rate = parseFloat(document.getElementById("new-boq-rate").value) || 0;
        const margin = parseFloat(document.getElementById("new-boq-margin").value) || 0;
        const gst = parseFloat(document.getElementById("new-boq-gst").value) || 18;
        
        if (options.isEdit && options.boq) {
          const item = proj.boq.find(x => x.id === options.boq.id);
          if (item) {
            item.category = category;
            item.description = description;
            item.qty = qty;
            item.rate = rate;
            item.margin = margin;
            item.gst = gst;
          }
          this.showToast("BOQ module item updated!");
        } else {
          const newBOQ = {
            id: `boq-${Date.now()}`,
            category,
            description,
            qty,
            rate,
            margin,
            gst,
            actualCost: 0
          };
          proj.boq.push(newBOQ);
          this.showToast("Item added to project BOQ!");
        }
        
        await db.saveProject(proj);
        boqForm.reset();
        this.closeModal("add-boq-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 6. Add/Edit Invoice Form
    const invoiceForm = document.getElementById("create-invoice-form");
    if (invoiceForm) {
      invoiceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-invoice-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const type = document.getElementById("new-inv-milestone").value;
        const amount = parseFloat(document.getElementById("new-inv-amount").value) || 0;
        const date = window.Utils.toISODate(document.getElementById("new-inv-date").value);
        
        if (options.isEdit && options.invoice) {
          const bill = proj.billing.find(x => x.invoiceNo === options.invoice.invoiceNo);
          if (bill) {
            bill.type = type;
            bill.amount = amount;
            bill.date = date;
          }
          this.showToast("Invoice milestone updated!");
        } else {
          const newInvoice = {
            invoiceNo: `INV-NEW-${Math.floor(100 + Math.random()*900)}`,
            type,
            amount,
            date,
            status: "Pending"
          };
          proj.billing.push(newInvoice);
          this.showToast("Milestone invoice raised!");
          setTimeout(() => this.promptWhatsAppShare("payment-reminder", proj.id, newInvoice.invoiceNo), 400);
        }
        
        await db.saveProject(proj);
        invoiceForm.reset();
        this.closeModal("add-invoice-modal");
        window.AppRouter.refresh();
      });
    }
    
    // 7. Add/Edit Vendor Form
    const vendorForm = document.getElementById("create-vendor-form");
    if (vendorForm) {
      vendorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-vendor-modal"] || {};
        const name = document.getElementById("new-v-name").value;
        const category = document.getElementById("new-v-category").value;
        const phone = document.getElementById("new-v-phone").value;
        const delayHistory = document.getElementById("new-v-delay").value;
        
        if (options.isEdit && options.vendor) {
          const v = store.state.vendors.find(x => x.name === options.vendor.name);
          if (v) {
            v.name = name;
            v.category = category;
            v.phone = phone;
            v.delayHistory = delayHistory;
          }
          store.saveState();
          this.showToast("Vendor credentials updated!");
        } else {
          const newVendor = {
            name,
            category,
            phone,
            rating: 5.0,
            delayHistory,
            activeProjects: 0
          };
          await db.saveVendor(newVendor);
          this.showToast("Vendor agency registered!");
        }
        
        vendorForm.reset();
        this.closeModal("add-vendor-modal");
        this.populateSelectOptions();
        window.AppRouter.refresh();
      });
    }
    
    // 8. Add/Edit Vault Document Form
    const docForm = document.getElementById("create-document-form");
    if (docForm) {
      docForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const options = this.activeOptions["add-document-modal"] || {};
        
        let projId = store.activeProjectId;
        const projectSelect = document.getElementById("new-doc-project");
        const projectGroup = document.getElementById("doc-project-group");
        if (projectSelect && projectGroup && !projectGroup.classList.contains("hidden")) {
          projId = projectSelect.value;
        }
        if (!projId) {
          projId = store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        }
        
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const folder = document.getElementById("new-doc-folder").value;
        const name = document.getElementById("new-doc-name").value;
        
        // Read file if selected
        const fileInput = document.getElementById("new-doc-file");
        let fileDataUrl = options.isEdit ? options.document.file : "#";
        let fileSizeStr = "";
        
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          // Limit file size to 15MB
          if (file.size > 15 * 1024 * 1024) {
            alert(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload files smaller than 15MB.`);
            return;
          }
          
          fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
          
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve("#");
            reader.readAsDataURL(file);
          });

          if (base64 !== "#") {
            const fileId = "file-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
            
            // Cache locally in IndexedDB
            await window.FileCache.set(fileId, base64);
            
            // Sync to Supabase document_files
            if (db.isCloudActive()) {
              try {
                await db.client.from('document_files').upsert({ id: fileId, file_data: base64, updated_at: new Date().toISOString() });
              } catch(err) {
                console.error("Failed to sync file to Supabase:", err);
              }
            }
            
            // Delete old file cache if editing and it was a db:// pointer
            if (options.isEdit && options.document.file && options.document.file.startsWith("db://")) {
              const oldFileId = options.document.file.substring(5);
              await window.FileCache.remove(oldFileId);
              if (db.isCloudActive()) {
                try {
                  await db.client.from('document_files').delete().eq('id', oldFileId);
                } catch(e){}
              }
            }
            
            fileDataUrl = "db://" + fileId;
          }
        } else {
          fileSizeStr = options.isEdit ? options.document.size : `${(1 + Math.random() * 5).toFixed(1)} MB`;
        }
        
        if (options.isEdit && options.document) {
          const oldFolder = options.folder;
          const docs = proj.vault[oldFolder] || [];
          const idx = docs.findIndex(x => x.name === options.document.name);
          
          if (idx !== -1) {
            const docObj = docs[idx];
            docObj.name = name;
            docObj.file = fileDataUrl !== "#" ? fileDataUrl : (name.endsWith(".pdf") ? name : name + ".pdf");
            docObj.size = fileSizeStr;
            
            // Move category if changed
            if (oldFolder !== folder) {
              docs.splice(idx, 1);
              if (!proj.vault[folder]) proj.vault[folder] = [];
              proj.vault[folder].push(docObj);
            }
            
            // Sync drawing list
            if (oldFolder === "drawings" || folder === "drawings") {
              const drawIdx = proj.drawings.findIndex(x => x.name === options.document.name);
              if (drawIdx !== -1) {
                if (folder !== "drawings") {
                  proj.drawings.splice(drawIdx, 1);
                } else {
                  proj.drawings[drawIdx].name = docObj.name;
                  proj.drawings[drawIdx].file = docObj.file;
                }
              } else if (folder === "drawings") {
                proj.drawings.push({
                  name: docObj.name,
                  file: docObj.file,
                  type: "Custom Detail",
                  uploadedAt: docObj.date
                });
              }
            }
            this.showToast("Document details updated!");
          }
        } else {
          // Check if a document/drawing with the exact same name or file already exists
          const existingDocs = proj.vault[folder] || [];
          const fileName = name.endsWith(".pdf") ? name : name + ".pdf";
          const duplicateIdx = existingDocs.findIndex(d => d.name.toLowerCase() === name.toLowerCase() || d.file.toLowerCase() === fileName.toLowerCase());

          let newDocName = name;
          let newFileValue = fileDataUrl !== "#" ? fileDataUrl : fileName;

          if (duplicateIdx !== -1) {
            const replaceChoice = confirm(`A drawing/document named "${name}" already exists in project "${proj.name.split(' (')[0]}".\n\nClick "OK" to REPLACE the existing file.\nClick "Cancel" to KEEP BOTH files (the new file will be uploaded with a revision suffix).`);
            
            if (replaceChoice) {
              // Replace the existing document
              const oldDoc = existingDocs[duplicateIdx];
              oldDoc.date = new Date().toISOString().split('T')[0];
              oldDoc.size = fileSizeStr;
              oldDoc.file = newFileValue;
              
              // Also update the drawings tab array if applicable
              if (folder === "drawings") {
                const drawIdx = proj.drawings.findIndex(d => d.name.toLowerCase() === name.toLowerCase() || d.file.toLowerCase() === fileName.toLowerCase());
                if (drawIdx !== -1) {
                  proj.drawings[drawIdx].uploadedAt = oldDoc.date;
                  proj.drawings[drawIdx].file = oldDoc.file;
                }
              }
              this.showToast("Existing document replaced successfully!");
            } else {
              // Keep both: append revision suffix (e.g. " (Rev 1)")
              let rev = 1;
              let suffix = ` (Rev ${rev})`;
              let testName = name + suffix;
              let testFileName = (name + suffix).endsWith(".pdf") ? (name + suffix) : (name + suffix) + ".pdf";

              while (existingDocs.some(d => d.name.toLowerCase() === testName.toLowerCase() || d.file.toLowerCase() === testFileName.toLowerCase())) {
                rev++;
                suffix = ` (Rev ${rev})`;
                testName = name + suffix;
                testFileName = (name + suffix).endsWith(".pdf") ? (name + suffix) : (name + suffix) + ".pdf";
              }

              newDocName = testName;
              newFileValue = fileDataUrl !== "#" ? fileDataUrl : testFileName;

              const newDoc = {
                name: newDocName,
                file: newFileValue,
                size: fileSizeStr,
                date: new Date().toISOString().split('T')[0]
              };
              
              if (!proj.vault[folder]) proj.vault[folder] = [];
              proj.vault[folder].push(newDoc);
              
              if (folder === "drawings") {
                proj.drawings.push({
                  name: newDoc.name,
                  file: newDoc.file,
                  type: "Custom Detail",
                  uploadedAt: newDoc.date
                });
              }
              this.showToast(`Document uploaded as "${newDocName}"!`);
            }
          } else {
            // Standard new upload (no duplicate)
            const newDoc = {
              name: newDocName,
              file: newFileValue,
              size: fileSizeStr,
              date: new Date().toISOString().split('T')[0]
            };
            
            if (!proj.vault[folder]) {
              proj.vault[folder] = [];
            }
            proj.vault[folder].push(newDoc);
            
            if (folder === "drawings") {
              proj.drawings.push({
                name: newDoc.name,
                file: newDoc.file,
                type: "Custom Detail",
                uploadedAt: newDoc.date
              });
            }
            this.showToast("Document uploaded to vault!");
          }
        }
        
        await db.saveProject(proj);
        docForm.reset();
        this.closeModal("add-document-modal");
        window.AppRouter.refresh();
      });
    }

    // 9. Edit Timeline Stage Form
    const stageForm = document.getElementById("edit-stage-form");
    if (stageForm) {
      stageForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["edit-stage-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const originalName = document.getElementById("edit-stage-original-name").value || (options.stage && options.stage.name);
        const st = proj.stages.find(s => s.name === originalName);
        if (st) {
          st.name = document.getElementById("edit-stage-name").value;
          st.stageGroup = document.getElementById("edit-stage-group").value || "Execution";
          st.owner = document.getElementById("edit-stage-owner").value;
          st.status = document.getElementById("edit-stage-status").value;
          st.progress = parseInt(document.getElementById("edit-stage-progress").value) || 0;
          st.dependency = document.getElementById("edit-stage-dependency").value;
          st.startDate = window.Utils.toISODate(document.getElementById("edit-stage-start").value);
          st.deadline = window.Utils.toISODate(document.getElementById("edit-stage-deadline").value);
          st.delayReason = document.getElementById("edit-stage-reason").value;
          st.lastUpdated = new Date().toISOString().split('T')[0];
          
          if (st.progress === 100) st.status = "Completed";
          else if (st.progress > 0 && st.status === "Not Started") st.status = "In Progress";
          else if (st.status === "Completed" && st.progress < 100) st.progress = 90;

          // Re-calculate overall project progress
          if (proj.stages.length > 0) {
            const completedCount = proj.stages.filter(s => s.status === "Completed").length;
            proj.progress = Math.round((completedCount / proj.stages.length) * 100);
          }
          
          await db.saveProject(proj);
          store.saveState();
          this.showToast(`${st.name} activity updated successfully!`);
        }
        
        stageForm.reset();
        this.closeModal("edit-stage-modal");
        window.AppRouter.refresh();
      });
    }

    // 10. Add/Edit Delivery Form
    const deliveryForm = document.getElementById("create-delivery-form");
    if (deliveryForm) {
      deliveryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["add-delivery-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const item = document.getElementById("new-del-item").value;
        const qty = document.getElementById("new-del-qty").value;
        const date = window.Utils.toISODate(document.getElementById("new-del-date").value);
        const status = document.getElementById("new-del-status").value;
        
        if (options.isEdit && options.delivery) {
          const d = proj.deliveries.find(x => x.id === options.delivery.id);
          if (d) {
            d.item = item;
            d.qty = qty;
            d.date = date;
            d.status = status;
          }
          this.showToast("Delivery log updated!");
        } else {
          proj.deliveries.unshift({
            id: `del-${Date.now()}`,
            item,
            qty,
            date,
            status
          });
          this.showToast("Delivery expected added!");
        }
        
        await db.saveProject(proj);
        deliveryForm.reset();
        this.closeModal("add-delivery-modal");
        window.AppRouter.refresh();
      });
    }

    // 11. Add/Edit Site Visit Form
    const visitForm = document.getElementById("create-visit-form");
    if (visitForm) {
      visitForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["add-visit-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        const visitor = document.getElementById("new-vis-visitor").value;
        const purpose = document.getElementById("new-vis-purpose").value;
        const date = window.Utils.toISODate(document.getElementById("new-vis-date").value);
        const time = document.getElementById("new-vis-time").value;
        
        if (options.isEdit && options.visit) {
          const v = proj.visits.find(x => x.id === options.visit.id);
          if (v) {
            v.visitor = visitor;
            v.purpose = purpose;
            v.date = date;
            v.time = time;
          }
          this.showToast("Site visit log updated!");
        } else {
          proj.visits.unshift({
            id: `vis-${Date.now()}`,
            visitor,
            purpose,
            date,
            time
          });
          this.showToast("Site visit scheduled!");
        }
        
        await db.saveProject(proj);
        visitForm.reset();
        this.closeModal("add-visit-modal");
        window.AppRouter.refresh();
      });
    }

    // 12. Supabase Database Connection Form
    const sbForm = document.getElementById("connect-supabase-form");
    if (sbForm) {
      sbForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const url = document.getElementById("supabase-connect-url").value.trim();
        const key = document.getElementById("supabase-connect-key").value.trim();
        
        if ((url && !key) || (!url && key)) {
          this.showToast("Please enter both Project URL and Anon Key to connect to Supabase.");
          return;
        }
        
        const phone = document.getElementById("company-contact-phone") ? document.getElementById("company-contact-phone").value.trim() : "";
        
        if (url && key) {
          localStorage.setItem("supabase_url", url);
          localStorage.setItem("supabase_key", key);
        } else {
          localStorage.removeItem("supabase_url");
          localStorage.removeItem("supabase_key");
        }
        
        localStorage.setItem("company_phone", phone || "+91 98480 00000");
        
        // Save uploaded company logo if selected
        const previewImg = document.getElementById("company-logo-preview-img");
        if (previewImg && previewImg.src && previewImg.src.startsWith("data:image/")) {
          localStorage.setItem("company_logo", previewImg.src);
        }

        this.showToast("System settings saved! Reloading...");
        this.closeModal("connect-supabase-modal");
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      });
    }

    // 13. Edit Dependency Form submit
    const editDepForm = document.getElementById("edit-dep-form");
    if (editDepForm) {
      editDepForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["edit-dependency-modal"] || {};
        const { projectId, dependencyId } = options;
        if (!projectId || !dependencyId) return;

        const name = document.getElementById("edit-dep-name").value;
        const status = document.getElementById("edit-dep-status").value;
        const blockedBy = document.getElementById("edit-dep-blocked").value;
        const owner = document.getElementById("edit-dep-owner").value;
        const targetDate = document.getElementById("edit-dep-target").value;
        const resolutionDate = document.getElementById("edit-dep-resolution-date").value;
        const remarks = document.getElementById("edit-dep-remarks").value;

        const updates = {
          description: name,
          status,
          blockedBy,
          owner,
          targetDate,
          resolutionDate,
          remarks
        };

        const unblocked = await store.updateDependency(projectId, dependencyId, updates, store.activeRole);
        this.showToast("Dependency details updated!");
        this.closeModal("edit-dependency-modal");
        
        if (status === 'Completed' && unblocked && unblocked.length > 0) {
          setTimeout(() => {
            const listStr = unblocked.map(u => `"${u.description}"`).join(", ");
            alert(`Dependency resolved! This unblocks the following activities on the project:\n${listStr}`);
            window.AppRouter.refresh();
          }, 600);
        } else {
          window.AppRouter.refresh();
        }
      });
    }

    // 14. Progress Breakdown Form submit
    const progressBreakdownForm = document.getElementById("progress-breakdown-form");
    if (progressBreakdownForm) {
      progressBreakdownForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["progress-breakdown-modal"] || {};
        const { projectId } = options;
        if (!projectId) return;

        const newTrades = {
          carpentry: parseInt(document.getElementById("breakdown-trade-carpentry").value) || 0,
          electrical: parseInt(document.getElementById("breakdown-trade-electrical").value) || 0,
          painting: parseInt(document.getElementById("breakdown-trade-painting").value) || 0,
          falseCeiling: parseInt(document.getElementById("breakdown-trade-falseCeiling").value) || 0,
          stone: parseInt(document.getElementById("breakdown-trade-stone").value) || 0,
          glass: parseInt(document.getElementById("breakdown-trade-glass").value) || 0,
          modular: parseInt(document.getElementById("breakdown-trade-modular").value) || 0
        };

        await store.updateProjectTradeProgress(projectId, newTrades, store.activeRole);
        this.showToast("Project trade progress updated!");
        this.closeModal("progress-breakdown-modal");
        window.AppRouter.refresh();
      });
    }

    // Add Project Decision Submit Handler
    const decisionForm = document.getElementById("create-decision-form");
    if (decisionForm) {
      decisionForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["add-decision-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        if (!proj.decisions) proj.decisions = [];
        
        const dateVal = window.Utils.toISODate(document.getElementById("new-decision-date").value);
        const reqBy = document.getElementById("new-decision-requested-by").value;
        const appBy = document.getElementById("new-decision-approved-by").value;
        const desc = document.getElementById("new-decision-description").value;
        const impactCat = document.getElementById("new-decision-impact").value;
        const costImp = parseFloat(document.getElementById("new-decision-cost-impact").value) || 0;
        const timeImp = parseInt(document.getElementById("new-decision-time-impact").value) || 0;
        const attachName = document.getElementById("new-decision-attachment-name").value;
        
        const newDec = {
          id: `dec-${Date.now()}`,
          date: dateVal,
          requestedBy: reqBy,
          approvedBy: appBy,
          description: desc,
          impact: impactCat + (attachName ? ` | Att: ${attachName}` : ''),
          costImpact: costImp,
          timeImpact: timeImp
        };
        
        proj.decisions.push(newDec);
        await db.saveProject(proj);
        this.showToast("Decision logged successfully!");
        this.closeModal("add-decision-modal");
        window.AppRouter.refresh();
      });
    }

    // Add Project Scope Change Submit Handler
    const changeForm = document.getElementById("create-change-form");
    if (changeForm) {
      changeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const options = this.activeOptions["add-change-modal"] || {};
        const projId = options.projectId || store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj) return;
        
        if (!proj.changes) proj.changes = [];
        
        const dateVal = window.Utils.toISODate(document.getElementById("new-change-date").value);
        const reasonVal = document.getElementById("new-change-reason").value;
        const origScope = document.getElementById("new-change-original-scope").value;
        const revScope = document.getElementById("new-change-revised-scope").value;
        const costDiffVal = parseFloat(document.getElementById("new-change-cost-diff").value) || 0;
        const timeDiffVal = parseInt(document.getElementById("new-change-time-diff").value) || 0;
        const statusVal = document.getElementById("new-change-status").value;
        
        const newChg = {
          id: `chg-${Date.now()}`,
          date: dateVal,
          reason: reasonVal,
          originalScope: origScope,
          revisedScope: revScope,
          costDifference: costDiffVal,
          timelineDifference: timeDiffVal,
          approvalStatus: statusVal
        };
        
        proj.changes.push(newChg);
        
        if (statusVal === "Approved") {
          proj.budget += costDiffVal;
          if (timeDiffVal > 0 && proj.endDate) {
            const d = new Date(proj.endDate);
            d.setDate(d.getDate() + timeDiffVal);
            proj.endDate = d.toISOString().split('T')[0];
          }
        }
        
        await db.saveProject(proj);
        this.showToast("Scope change logged successfully!");
        this.closeModal("add-change-modal");
        window.AppRouter.refresh();
      });
    }
  },

  deleteCompanyLogo() {
    if (confirm("Are you sure you want to remove the custom company logo?")) {
      localStorage.removeItem("company_logo");
      const previewContainer = document.getElementById("company-logo-preview-container");
      const previewImg = document.getElementById("company-logo-preview-img");
      const fileInput = document.getElementById("company-logo-file");
      if (previewImg) previewImg.src = "";
      if (previewContainer) previewContainer.classList.add("hidden");
      if (fileInput) fileInput.value = "";
      this.showToast("Custom logo removed.");
    }
  },

  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-16 right-4 md:bottom-4 bg-zinc-900 border border-zinc-800 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-fade-in";
    toast.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-amber-500"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  },

  promptWhatsAppShare(type, projId, referenceId) {
    const dialog = document.createElement("div");
    dialog.className = "fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    dialog.innerHTML = `
      <div class="bg-secondary border border-border-color rounded-lg max-w-sm w-full p-5 shadow-2xl animate-scale-in text-center">
        <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="phone-call" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-semibold text-white mb-2">Share Update via WhatsApp?</h4>
        <p class="text-xs text-secondary mb-5 leading-relaxed">
          Generate structured operational summary text and dispatch to clients, managers, or vendors.
        </p>
        <div class="flex gap-2 justify-center">
          <button id="cancel-share-btn" class="px-4 py-2 bg-primary hover:bg-hover text-white text-xs rounded border border-border-color font-medium">No, Skip</button>
          <button id="confirm-share-btn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded font-medium flex items-center gap-1.5">
            <i data-lucide="send" class="w-3.5 h-3.5"></i> Dispatch Now
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    if (window.lucide) lucide.createIcons();
    
    document.getElementById("cancel-share-btn").onclick = () => dialog.remove();
    document.getElementById("confirm-share-btn").onclick = () => {
      dialog.remove();
      if (type === "daily-log") {
        window.WhatsAppService.shareDailyLog(projId, referenceId);
      } else if (type === "snag") {
        window.WhatsAppService.shareSnag(projId, referenceId);
      } else if (type === "material-approval") {
        window.WhatsAppService.shareMaterialApproval(projId, referenceId);
      } else if (type === "payment-reminder") {
        window.WhatsAppService.sharePaymentInvoice(projId, referenceId);
      }
    };
  },

  async runDataMigration() {
    const db = window.dbService;
    if (!db.isCloudActive()) {
      db.init();
      if (!db.isCloudActive()) {
        alert("Supabase database is not configured. Please fill in your Supabase Project URL and Anon API Key first, save settings, and then try again.");
        return;
      }
    }

    const store = window.AppStore;
    let rawData = localStorage.getItem("premio_living_state_v3");
    let keyUsed = "premio_living_state_v3";
    if (!rawData) {
      rawData = localStorage.getItem("pm_fn_final_v3");
      keyUsed = "pm_fn_final_v3";
    }

    if (!rawData) {
      alert("No local data found under the keys 'premio_living_state_v3' or 'pm_fn_final_v3' in this browser.");
      return;
    }

    let localState;
    try {
      localState = JSON.parse(rawData);
    } catch(err) {
      alert("Failed to parse local data: " + err.message);
      return;
    }

    const localProjs = localState.projects || [];
    const localVends = localState.vendors || [];
    const localRFQs = localState.rfqs || [];
    const localPOs = localState.purchaseOrders || localState.purchase_orders || [];
    const localPayouts = localState.payouts || [];

    if (!confirm(`Found local database (${keyUsed}) containing:\n- ${localProjs.length} Projects\n- ${localVends.length} Vendors\n- ${localRFQs.length} RFQs\n- ${localPOs.length} POs\n- ${localPayouts.length} Payouts\n\nDo you want to migrate and upload this data to your connected Supabase database? Existing duplicates will be skipped.`)) {
      return;
    }

    // Show Progress Overlay
    const progressOverlay = document.createElement("div");
    progressOverlay.className = "fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex flex-col items-center justify-center p-4 text-center text-white";
    progressOverlay.innerHTML = `
      <div class="space-y-4">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h4 class="text-sm font-bold font-display">Migrating Data to Supabase...</h4>
        <p id="migration-progress-text" class="text-xs text-secondary">Uploading records. Please do not close or refresh this tab.</p>
      </div>
    `;
    document.body.appendChild(progressOverlay);

    const updateProgress = (text) => {
      const el = document.getElementById("migration-progress-text");
      if (el) el.textContent = text;
    };

    try {
      const store = window.AppStore;

      // 1. Projects
      let projMigrated = 0, projSkipped = 0;
      const existingProjects = store.state.projects || [];
      for (let i = 0; i < localProjs.length; i++) {
        const p = localProjs[i];
        updateProgress(`Uploading projects (${i+1}/${localProjs.length})...`);
        const isDuplicate = existingProjects.some(x => x.id === p.id || x.name.toLowerCase().trim() === p.name.toLowerCase().trim());
        if (isDuplicate) {
          projSkipped++;
        } else {
          await db.saveProject(p);
          projMigrated++;
        }
      }

      // 2. Vendors
      let vendMigrated = 0, vendSkipped = 0;
      const existingVendors = store.state.vendors || [];
      for (let i = 0; i < localVends.length; i++) {
        const v = localVends[i];
        updateProgress(`Uploading vendors (${i+1}/${localVends.length})...`);
        const isDuplicate = existingVendors.some(x => x.name.toLowerCase().trim() === v.name.toLowerCase().trim());
        if (isDuplicate) {
          vendSkipped++;
        } else {
          await db.saveVendor(v);
          vendMigrated++;
        }
      }

      // 3. RFQs
      let rfqMigrated = 0, rfqSkipped = 0;
      const existingRFQs = store.state.rfqs || [];
      for (let i = 0; i < localRFQs.length; i++) {
        const r = localRFQs[i];
        updateProgress(`Uploading RFQs (${i+1}/${localRFQs.length})...`);
        const isDuplicate = existingRFQs.some(x => x.id === r.id || x.rfqNumber.toLowerCase().trim() === r.rfqNumber.toLowerCase().trim());
        if (isDuplicate) {
          rfqSkipped++;
        } else {
          await db.saveRFQ(r);
          rfqMigrated++;
        }
      }

      // 4. Purchase Orders
      let poMigrated = 0, poSkipped = 0;
      const existingPOs = store.state.purchaseOrders || [];
      for (let i = 0; i < localPOs.length; i++) {
        const po = localPOs[i];
        updateProgress(`Uploading POs (${i+1}/${localPOs.length})...`);
        const isDuplicate = existingPOs.some(x => x.id === po.id || x.poNumber.toLowerCase().trim() === po.poNumber.toLowerCase().trim());
        if (isDuplicate) {
          poSkipped++;
        } else {
          await db.savePO(po);
          poMigrated++;
        }
      }

      // 5. Payouts
      let payMigrated = 0, paySkipped = 0;
      const existingPayouts = store.state.payouts || [];
      for (let i = 0; i < localPayouts.length; i++) {
        const pay = localPayouts[i];
        updateProgress(`Uploading payouts (${i+1}/${localPayouts.length})...`);
        const isDuplicate = existingPayouts.some(x => x.id === pay.id);
        if (isDuplicate) {
          paySkipped++;
        } else {
          await db.savePayout(pay);
          payMigrated++;
        }
      }

      // 6. Documents (IndexedDB file-cache)
      let docsMigrated = 0;
      updateProgress("Accessing IndexedDB local file vault cache...");
      const files = await window.FileCache.getAllFiles();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        updateProgress(`Syncing vault document files (${i+1}/${files.length})...`);
        await db.client.from('document_files').upsert({ id: f.id, file_data: f.file_data || f.data, updated_at: new Date().toISOString() });
        docsMigrated++;
      }

      // 7. Settings
      updateProgress("Migrating custom settings...");
      if (localState.settings) {
        if (localState.settings.company_phone) localStorage.setItem("company_phone", localState.settings.company_phone);
        if (localState.settings.company_logo) localStorage.setItem("company_logo", localState.settings.company_logo);
      } else {
        const oldPhone = localStorage.getItem("company_phone");
        const oldLogo = localStorage.getItem("company_logo");
        if (oldPhone) localStorage.setItem("company_phone", oldPhone);
        if (oldLogo) localStorage.setItem("company_logo", oldLogo);
      }

      progressOverlay.remove();
      alert(`Migration Completed Successfully!\n\nSummary:\n- Projects: ${projMigrated} migrated, ${projSkipped} skipped (duplicates)\n- Vendors: ${vendMigrated} migrated, ${vendSkipped} skipped (duplicates)\n- RFQs: ${rfqMigrated} migrated, ${rfqSkipped} skipped (duplicates)\n- POs: ${poMigrated} migrated, ${poSkipped} skipped (duplicates)\n- Payouts: ${payMigrated} migrated, ${paySkipped} skipped (duplicates)\n- Vault Documents: ${docsMigrated} synced to Supabase.\n\nSettings successfully updated. Page will reload to refresh workspaces.`);
      
      store.loadState();
      window.AppRouter.refresh();
      window.location.reload();

    } catch (err) {
      if (progressOverlay) progressOverlay.remove();
      alert("Error migrating data: " + err.message);
      console.error(err);
    }
  },

  exportBackup() {
    const store = window.AppStore;
    const backupData = {
      version: "premio_backup_v1",
      timestamp: Date.now(),
      state: store.state,
      settings: {
        company_phone: localStorage.getItem("company_phone") || "",
        company_logo: localStorage.getItem("company_logo") || ""
      }
    };
    
    try {
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `premio_living_os_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast("Backup exported successfully!");
    } catch(err) {
      alert("Failed to export backup: " + err.message);
    }
  },

  importBackup(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version !== "premio_backup_v1" || !data.state) {
          alert("Invalid backup file format. Must be a JSON file generated by this app.");
          return;
        }
        
        if (!confirm("Are you sure you want to import this backup? This will overwrite your current active browser data. If you are connected to Supabase, it will sync these changes to the cloud.")) return;
        
        // Restore state
        window.AppStore.state = data.state;
        window.AppStore.saveState();
        
        // Restore settings
        if (data.settings) {
          if (data.settings.company_phone) localStorage.setItem("company_phone", data.settings.company_phone);
          if (data.settings.company_logo) localStorage.setItem("company_logo", data.settings.company_logo);
        }
        
        this.showToast("Backup imported successfully! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        alert("Failed to parse backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  },

  markStageComplete() {
    const progressInput = document.getElementById("edit-stage-progress");
    const statusSelect = document.getElementById("edit-stage-status");
    if (progressInput) progressInput.value = 100;
    if (statusSelect) statusSelect.value = "Completed";
    this.showToast("Progress set to 100% and status set to Completed. Click 'Save Details' to apply.");
  },

  reopenStage() {
    const progressInput = document.getElementById("edit-stage-progress");
    const statusSelect = document.getElementById("edit-stage-status");
    if (progressInput) progressInput.value = 50;
    if (statusSelect) statusSelect.value = "In Progress";
    this.showToast("Progress reset to 50% and status set to In Progress. Click 'Save Details' to apply.");
  },

  async deleteStageActivity() {
    const options = this.activeOptions["edit-stage-modal"] || {};
    const projId = options.projectId || window.AppStore.activeProjectId || (window.AppStore.state.projects[0] && window.AppStore.state.projects[0].id);
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj || !options.stage) return;
    
    if (!confirm(`Are you sure you want to delete the activity "${options.stage.name}"?`)) return;
    
    proj.stages = proj.stages.filter(s => s.name !== options.stage.name);
    
    // Re-calculate overall project progress
    if (proj.stages.length > 0) {
      const completedCount = proj.stages.filter(s => s.status === "Completed").length;
      proj.progress = Math.round((completedCount / proj.stages.length) * 100);
    } else {
      proj.progress = 0;
    }
    
    await window.dbService.saveProject(proj);
    window.AppStore.saveState();
    
    this.showToast(`Activity deleted successfully!`);
    this.closeModal("edit-stage-modal");
    window.AppRouter.refresh();
  },

  async deleteDependency() {
    const options = this.activeOptions["edit-dependency-modal"] || {};
    const { projectId, dependencyId } = options;
    if (!projectId || !dependencyId) return;
    
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    
    const dep = proj.dependencies.find(d => d.id === dependencyId);
    if (!dep) return;
    
    if (!confirm(`Are you sure you want to delete the dependency "${dep.description}"?`)) return;
    
    proj.dependencies = proj.dependencies.filter(d => d.id !== dependencyId);
    
    await window.dbService.saveProject(proj);
    window.AppStore.saveState();
    
    this.showToast(`Dependency deleted successfully!`);
    this.closeModal("edit-dependency-modal");
    window.AppRouter.refresh();
  },

  filterHealthLists(type) {
    const categories = ['completed', 'pending', 'blocked', 'overdue'];
    categories.forEach(c => {
      const listEl = document.getElementById(`health-list-${c}`);
      const parentHeading = listEl ? listEl.previousElementSibling : null;
      const cardEl = document.getElementById(`health-card-${c}`);
      
      if (type === 'all' || type === c) {
        if (listEl) listEl.classList.remove('hidden');
        if (parentHeading) parentHeading.classList.remove('hidden');
      } else {
        if (listEl) listEl.classList.add('hidden');
        if (parentHeading) parentHeading.classList.add('hidden');
      }
      
      // Toggle card styles:
      if (cardEl) {
        if (type === c) {
          cardEl.className = "border border-amber-500 bg-amber-500/10 p-2 rounded cursor-pointer hover:bg-hover/20 transition-all font-bold";
        } else {
          cardEl.className = "border border-border-color/40 bg-primary/20 p-2 rounded cursor-pointer hover:bg-hover hover:border-amber-500/35 transition-all";
        }
      }
    });
  },

  activeReportTab: "client",
  activeReportData: null,

  switchReportTab(tabId) {
    this.activeReportTab = tabId;
    document.querySelectorAll(".report-tab-btn").forEach(btn => {
      if (btn.id === `report-tab-${tabId}`) {
        btn.className = "report-tab-btn px-2.5 py-1 rounded text-xs transition-colors bg-amber-500 text-black font-semibold";
      } else {
        btn.className = "report-tab-btn px-2.5 py-1 rounded text-xs transition-colors text-secondary hover:text-white bg-hover";
      }
    });
    this.renderReportContent();
  },

  renderReportContent() {
    const textContentEl = document.getElementById("daily-report-text-content");
    if (!textContentEl || !this.activeReportData) return;
    
    const { project, update } = this.activeReportData;
    if (!project || !update) {
      textContentEl.textContent = "Error: Site update details not found.";
      return;
    }
    
    let reportText = "";
    const formattedDate = window.Utils.formatDate(update.date);
    
    if (this.activeReportTab === "client") {
      reportText = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Daily Progress Update*\n\n• *Project:* ${project.name.split(" (")[0]}\n• *Date:* ${formattedDate}\n• *Overall Progress:* ${project.progress}% Complete\n\n■ *Work Completed Today*\n• ${update.completed || "Standard site work executed."}\n\n■ *Site Labor Strength*\n• Workers on-site: ${update.workersCount || 0} Craftsmen\n${update.supervisor ? `• Site Supervisor: ${update.supervisor}\n` : ""}\n■ *Tomorrow's Scheduled Plan*\n• ${update.tomorrowPlanText || update.tomorrowPlan || "Continue work in progress"}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Client Progress Sync_`;
    } else if (this.activeReportTab === "management") {
      const activeStage = project.stages.find(s => s.status === 'In Progress') || { name: 'Execution', progress: project.progress };
      const budgetText = window.Utils.formatCurrency(project.budget);
      const openSnags = project.snags.filter(s => s.status === 'Open').length;
      const blockedDeps = project.dependencies.filter(d => d.status === 'Blocked').length;
      
      reportText = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO MANAGEMENT ✦\n━━━━━━━━━━━━━━━━━━━━\n*Executive Status Brief*\n\n• *Project:* ${project.name.split(" (")[0]}\n• *Date:* ${formattedDate}\n• *Total Project Budget:* ${budgetText}\n• *Current Stage:* ${activeStage.name} (${activeStage.progress}%)\n\n■ *Site Status Indicators*\n• Workers Strength: ${update.workersCount || 0} Craftsmen\n• Open Snags: ${openSnags} unresolved\n• Blocked Timeline Items: ${blockedDeps} blockers\n\n■ *Today's Brief*\n• Completed: ${update.completed || "N/A"}\n• Issues Reported: ${update.issues || "None"}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Operations Intelligence_`;
    } else if (this.activeReportTab === "site") {
      const l = update.labour || {};
      const tp = update.tradeProgress || {};
      const trades = [];
      Object.entries(tp).forEach(([trade, val]) => {
        if (val > 0) trades.push(`  - ${trade.charAt(0).toUpperCase() + trade.slice(1)}: ${val}%`);
      });
      
      reportText = `━━━━━━━━━━━━━━━━━━━━\n  ✦ SITE ENGINEER LOG ✦\n━━━━━━━━━━━━━━━━━━━━\n*Technical Execution Log*\n\n• *Project:* ${project.name.split(" (")[0]}\n• *Date:* ${formattedDate}\n• *Site Lead:* ${project.team.engineer}\n\n■ *Manpower & Labor Count*\n• Total Personnel: ${update.workersCount || 0}\n  - Carpenters: ${l.carpenter || 0}\n  - Helpers: ${l.helper || 0}\n  - Painters: ${l.painter || 0}\n  - Electricians: ${l.electrician || 0}\n  - Plumbers: ${l.plumber || 0}\n\n■ *Material Tracking*\n• Received Today: ${update.materialReceived || "None"}\n• Pending/Delayed: ${update.materialPending || "None"}\n\n■ *Trade Progression*:${trades.length > 0 ? "\n" + trades.join("\n") : " No updates today"}\n\n━━━━━━━━━━━━━━━━━━━━\n_Site OS System Logs_`;
    } else if (this.activeReportTab === "vendor") {
      const activePOs = (window.AppStore.state.purchaseOrders || []).filter(po => po.projectId === project.id && po.status !== 'Delivered');
      const poList = activePOs.map(po => `  - PO: ${po.poNumber} (${po.vendorName}) - ${po.status}`).slice(0, 3);
      
      reportText = `━━━━━━━━━━━━━━━━━━━━\n  ✦ VENDOR & SUPPLY SYNC ✦\n━━━━━━━━━━━━━━━━━━━━\n*Procurement Coordination Summary*\n\n• *Project:* ${project.name.split(" (")[0]}\n• *Date:* ${formattedDate}\n\n■ *Current Site Update Context*\n• Completed: ${update.completed || "Standard site work"}\n• Material Received: ${update.materialReceived || "None"}\n• Material Requested/Pending: ${update.materialPending || "None"}\n\n■ *Active Sourcing Pipeline*:\n${poList.length > 0 ? poList.join("\n") : "  - No outstanding active POs"}\n\n■ *Blockers / Vendor Focus*\n• Blocker Alert: ${update.issues || "None"}\n• Delay Category: ${update.delay && update.delay.type ? `${update.delay.type} (${update.delay.owner})` : "None"}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Procurement Sync_`;
    }
    
    textContentEl.textContent = reportText;
  },

  copyReportToClipboard() {
    const textContentEl = document.getElementById("daily-report-text-content");
    if (!textContentEl) return;
    navigator.clipboard.writeText(textContentEl.textContent).then(() => {
      this.showToast("Copied to clipboard!");
    }).catch(err => {
      alert("Failed to copy text: " + err);
    });
  },

  printReport() {
    const textContentEl = document.getElementById("daily-report-text-content");
    if (!textContentEl) return;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Premio Living Daily Report - ${this.activeReportTab}</title>
          <style>
            body { font-family: monospace; padding: 40px; white-space: pre-wrap; font-size: 14px; background: #fff; color: #000; line-height: 1.5; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${textContentEl.textContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  },

  shareReportWhatsApp() {
    const textContentEl = document.getElementById("daily-report-text-content");
    if (!textContentEl) return;
    const text = textContentEl.textContent;
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  }
};

// Global exports
window.openModal = (id, opts) => window.ModalComponent.openModal(id, opts);
window.closeModal = (id) => window.ModalComponent.closeModal(id);
