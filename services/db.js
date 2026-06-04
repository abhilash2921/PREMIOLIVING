/* js/services/db.js - Premio Living OS Database Service (Dual Mode Supabase/LocalStorage) */

window.dbService = {
  supabaseUrl: localStorage.getItem("supabase_url") || "",
  supabaseAnonKey: localStorage.getItem("supabase_key") || "",
  client: null,
  
  init() {
    if (this.supabaseUrl && this.supabaseAnonKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
        console.log("Supabase Client successfully initialized.");
      } catch (e) {
        console.error("Failed to initialize Supabase, running fallback.", e);
        this.client = null;
      }
    }
  },
  
  isCloudActive() {
    return this.client !== null;
  },
  
  // --- DATABASE QUERIES & CRUD WRAPPERS ---
  
  // PROJECTS
  async fetchProjects() {
    if (this.isCloudActive()) {
      try {
        const { data, error } = await this.client.from('projects').select('*');
        if (!error && data) return data.map(r => r.data);
      } catch (err) {
        console.error("Error fetching projects from Supabase:", err);
      }
    }
    return window.AppStore.state.projects;
  },
  
  async saveProject(project) {
    if (this.isCloudActive()) {
      try {
        const { error } = await this.client.from('projects').upsert({ id: project.id, data: project, updated_at: new Date().toISOString() });
        if (error) console.error("Cloud save failed, queued locally.", error);
      } catch (err) {
        console.error("Error saving project to Supabase:", err);
      }
    }
    
    // Save locally
    const idx = window.AppStore.state.projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      window.AppStore.state.projects[idx] = project;
    } else {
      window.AppStore.state.projects.push(project);
    }
    window.AppStore.saveState();
    
    // If offline, add to transaction queue
    if (!navigator.onLine) {
      window.AppStore.addToOfflineQueue("save_project", project);
    }
  },

  async deleteProject(projectId) {
    if (this.isCloudActive()) {
      try {
        // Delete all dependent child records first to avoid foreign key constraint violations
        await this.client.from('rfqs').delete().eq('data->>projectId', projectId);
        await this.client.from('purchase_orders').delete().eq('data->>projectId', projectId);
        await this.client.from('payouts').delete().eq('data->>projectId', projectId);
        
        // Now delete the project itself
        const { error } = await this.client.from('projects').delete().eq('id', projectId);
        if (error) {
          console.error("Supabase error deleting project:", error);
        }
      } catch (err) {
        console.error("Cloud delete project failed", err);
      }
    }
    
    // Remove locally
    window.AppStore.state.projects = window.AppStore.state.projects.filter(p => p.id !== projectId);
    if (window.AppStore.state.rfqs) {
      window.AppStore.state.rfqs = window.AppStore.state.rfqs.filter(r => r.projectId !== projectId);
    }
    if (window.AppStore.state.purchaseOrders) {
      window.AppStore.state.purchaseOrders = window.AppStore.state.purchaseOrders.filter(po => po.projectId !== projectId);
    }
    if (window.AppStore.state.payouts) {
      window.AppStore.state.payouts = window.AppStore.state.payouts.filter(pay => pay.projectId !== projectId);
    }
    window.AppStore.saveState();
  },
  
  // VENDORS
  async fetchVendors() {
    if (this.isCloudActive()) {
      try {
        const { data, error } = await this.client.from('vendors').select('*');
        if (!error && data) return data.map(r => r.data);
      } catch (err) {
        console.error("Error fetching vendors from Supabase:", err);
      }
    }
    return window.AppStore.state.vendors;
  },
  
  async saveVendor(vendor) {
    if (this.isCloudActive()) {
      try {
        const { error } = await this.client.from('vendors').upsert({ id: vendor.name, data: vendor, updated_at: new Date().toISOString() });
        if (error) console.error("Cloud save vendor failed", error);
      } catch (err) {
        console.error("Error saving vendor to Supabase:", err);
      }
    }
    
    const idx = window.AppStore.state.vendors.findIndex(v => v.name === vendor.name);
    if (idx !== -1) {
      window.AppStore.state.vendors[idx] = vendor;
    } else {
      window.AppStore.state.vendors.push(vendor);
    }
    window.AppStore.saveState();
    
    if (!navigator.onLine) {
      window.AppStore.addToOfflineQueue("save_vendor", vendor);
    }
  },

  async deleteVendor(vendorName) {
    if (this.isCloudActive()) {
      try {
        await this.client.from('vendors').delete().eq('id', vendorName);
      } catch (err) {
        console.error("Cloud delete vendor failed", err);
      }
    }
    
    // Remove locally
    window.AppStore.state.vendors = window.AppStore.state.vendors.filter(v => v.name !== vendorName);
    window.AppStore.saveState();
  },

  // REQUEST FOR QUOTATIONS (RFQS)
  async fetchRFQs() {
    if (this.isCloudActive()) {
      try {
        const { data, error } = await this.client.from('rfqs').select('*');
        if (!error && data) return data.map(r => r.data);
      } catch (err) {
        console.error("Error fetching RFQs from Supabase:", err);
      }
    }
    return window.AppStore.state.rfqs || [];
  },

  async saveRFQ(rfq) {
    if (this.isCloudActive()) {
      try {
        const { error } = await this.client.from('rfqs').upsert({ id: rfq.id, data: rfq, updated_at: new Date().toISOString() });
        if (error) console.error("Cloud save RFQ failed", error);
      } catch (err) {
        console.error("Error saving RFQ to Supabase:", err);
      }
    }

    if (!window.AppStore.state.rfqs) window.AppStore.state.rfqs = [];
    const idx = window.AppStore.state.rfqs.findIndex(r => r.id === rfq.id);
    if (idx !== -1) {
      window.AppStore.state.rfqs[idx] = rfq;
    } else {
      window.AppStore.state.rfqs.push(rfq);
    }
    window.AppStore.saveState();
  },

  async deleteRFQ(rfqId) {
    if (this.isCloudActive()) {
      try {
        await this.client.from('rfqs').delete().eq('id', rfqId);
      } catch (err) {
        console.error("Cloud delete RFQ failed", err);
      }
    }
    
    // Remove locally
    if (window.AppStore.state.rfqs) {
      window.AppStore.state.rfqs = window.AppStore.state.rfqs.filter(r => r.id !== rfqId);
    }
    window.AppStore.saveState();
  },

  // PURCHASE ORDERS
  async fetchPOs() {
    if (this.isCloudActive()) {
      try {
        const { data, error } = await this.client.from('purchase_orders').select('*');
        if (!error && data) return data.map(r => r.data);
      } catch (err) {
        console.error("Error fetching POs from Supabase:", err);
      }
    }
    return window.AppStore.state.purchaseOrders || [];
  },

  async savePO(po) {
    if (this.isCloudActive()) {
      try {
        const { error } = await this.client.from('purchase_orders').upsert({ id: po.id, data: po, updated_at: new Date().toISOString() });
        if (error) console.error("Cloud save PO failed", error);
      } catch (err) {
        console.error("Error saving PO to Supabase:", err);
      }
    }

    if (!window.AppStore.state.purchaseOrders) window.AppStore.state.purchaseOrders = [];
    const idx = window.AppStore.state.purchaseOrders.findIndex(p => p.id === po.id);
    if (idx !== -1) {
      window.AppStore.state.purchaseOrders[idx] = po;
    } else {
      window.AppStore.state.purchaseOrders.push(po);
    }
    window.AppStore.saveState();
  },

  async deletePO(poId) {
    if (this.isCloudActive()) {
      try {
        await this.client.from('purchase_orders').delete().eq('id', poId);
      } catch (err) {
        console.error("Cloud delete PO failed", err);
      }
    }
    
    // Remove locally
    if (window.AppStore.state.purchaseOrders) {
      window.AppStore.state.purchaseOrders = window.AppStore.state.purchaseOrders.filter(p => p.id !== poId);
    }
    window.AppStore.saveState();
  },

  // PAYOUTS
  async fetchPayouts() {
    if (this.isCloudActive()) {
      try {
        const { data, error } = await this.client.from('payouts').select('*');
        if (!error && data) return data.map(r => r.data);
      } catch (err) {
        console.error("Error fetching payouts from Supabase:", err);
      }
    }
    return window.AppStore.state.payouts || [];
  },

  async savePayout(payout) {
    if (this.isCloudActive()) {
      try {
        const { error } = await this.client.from('payouts').upsert({ id: payout.id, data: payout, updated_at: new Date().toISOString() });
        if (error) console.error("Cloud save payout failed", error);
      } catch (err) {
        console.error("Error saving payout to Supabase:", err);
      }
    }

    if (!window.AppStore.state.payouts) window.AppStore.state.payouts = [];
    const idx = window.AppStore.state.payouts.findIndex(p => p.id === payout.id);
    if (idx !== -1) {
      window.AppStore.state.payouts[idx] = payout;
    } else {
      window.AppStore.state.payouts.push(payout);
    }
    window.AppStore.saveState();
  },

  async deletePayout(payoutId) {
    if (this.isCloudActive()) {
      try {
        await this.client.from('payouts').delete().eq('id', payoutId);
      } catch (err) {
        console.error("Cloud delete payout failed", err);
      }
    }

    if (window.AppStore.state.payouts) {
      window.AppStore.state.payouts = window.AppStore.state.payouts.filter(p => p.id !== payoutId);
    }
    window.AppStore.saveState();
  }
};
