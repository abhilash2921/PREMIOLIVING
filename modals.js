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
      
      if (isEdit && options.update) {
        document.getElementById("new-update-date").value = window.Utils.toDisplayDate(options.update.date);
        document.getElementById("new-update-workers").value = options.update.workersCount;
        document.getElementById("new-update-completed").value = options.update.completed;
        document.getElementById("new-update-issues").value = options.update.issues;
        document.getElementById("new-update-tomorrow").value = options.update.tomorrowPlan;
        if (modalTitleEl) modalTitleEl.textContent = "Edit Daily Site Update";
        if (submitBtnEl) submitBtnEl.textContent = "Save Changes";

        let initialPhoto = options.update.photo || "";
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
        document.getElementById("new-update-issues").value = "";
        document.getElementById("new-update-tomorrow").value = "";
        if (modalTitleEl) modalTitleEl.textContent = "Log Daily Site Update";
        if (submitBtnEl) submitBtnEl.textContent = "Save Update Log";

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
        document.getElementById("edit-stage-name").value = options.stage.name;
        document.getElementById("edit-stage-progress").value = options.stage.progress;
        document.getElementById("edit-stage-deadline").value = window.Utils.toDisplayDate(options.stage.deadline || "");
        document.getElementById("edit-stage-reason").value = options.stage.delayReason || "";
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
        const issues = document.getElementById("new-update-issues").value || "None";
        const tomorrow = document.getElementById("new-update-tomorrow").value;
        
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
          // If it is a base64 Data URL (from quick actions image drop), cache it
          const fileId = "file-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
          await window.FileCache.set(fileId, photoUrl);
          if (db.isCloudActive()) {
            try {
              await db.client.from('document_files').upsert({ id: fileId, file_data: photoUrl, updated_at: new Date().toISOString() });
            } catch(err){}
          }
          photoUrl = "db://" + fileId;
        }

        if (options.isEdit && typeof options.updateIndex !== 'undefined') {
          proj.updates[options.updateIndex] = {
            date: dateVal,
            completed,
            workersCount: workers,
            issues,
            tomorrowPlan: tomorrow,
            photo: photoUrl
          };
          this.showToast("Daily log updated successfully!");
        } else {
          proj.updates.unshift({
            date: dateVal,
            completed,
            workersCount: workers,
            issues,
            tomorrowPlan: tomorrow,
            photo: photoUrl
          });
          this.showToast("Daily site update logged!");
          setTimeout(() => this.promptWhatsAppShare("daily-log", proj.id, dateVal), 400);
        }
        
        await db.saveProject(proj);
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
        const projId = store.activeProjectId || (store.state.projects[0] && store.state.projects[0].id);
        const proj = store.state.projects.find(p => p.id === projId);
        if (!proj || !options.stage) return;
        
        const st = proj.stages.find(s => s.name === options.stage.name);
        if (st) {
          st.progress = parseInt(document.getElementById("edit-stage-progress").value) || 0;
          st.deadline = window.Utils.toISODate(document.getElementById("edit-stage-deadline").value);
          st.delayReason = document.getElementById("edit-stage-reason").value;
          
          if (st.progress === 100) st.status = "Completed";
          else if (st.progress > 0) st.status = "In Progress";
          else st.status = "Not Started";
          
          // Re-calculate overall project progress
          const completedCount = proj.stages.filter(s => s.status === "Completed").length;
          proj.progress = Math.round((completedCount / proj.stages.length) * 100);
          
          await db.saveProject(proj);
          this.showToast(`${st.name} stage updated successfully!`);
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
  }
};

// Global exports
window.openModal = (id, opts) => window.ModalComponent.openModal(id, opts);
window.closeModal = (id) => window.ModalComponent.closeModal(id);
