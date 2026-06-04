/* js/services/whatsapp.js - Premio Living OS WhatsApp Sharing Service */

window.WhatsAppService = {
  pendingShare: null,

  shareText(text) {
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  },
  
  shareDailyLog(projectId, date) {
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    const upd = proj.updates.find(u => u.date === date);
    if (!upd) return;
    
    const text = window.Utils.getDailyUpdateText(proj, upd);
    this.shareText(text);
  },
  
  shareSnag(projectId, snagId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    const snag = proj.snags.find(s => s.id === snagId);
    if (!snag) return;
    
    const text = window.Utils.getSnagText(proj, snag);
    this.shareText(text);
  },
  
  sharePaymentInvoice(projectId, invoiceNo) {
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    const inv = proj.billing.find(i => i.invoiceNo === invoiceNo);
    if (!inv) return;
    
    const text = window.Utils.getPaymentText(proj, inv);
    this.shareText(text);
  },
  
  shareMaterialApproval(projectId, materialId) {
    const proj = window.AppStore.state.projects.find(p => p.id === projectId);
    if (!proj) return;
    const mat = proj.materials.find(m => m.id === materialId);
    if (!mat) return;
    
    const text = window.Utils.getApprovalText(proj, mat);
    this.shareText(text);
  },

  dispatchToRole(role) {
    if (!this.pendingShare) return;
    const { type, projId, referenceId } = this.pendingShare;
    const proj = window.AppStore.state.projects.find(p => p.id === projId);
    if (!proj) return;
    
    let text = "";
    const formattedDate = (d) => window.Utils.formatDate(d);
    const formattedCurrency = (c) => window.Utils.formatCurrency(c);

    if (type === "daily-log") {
      const upd = proj.updates.find(u => u.date === referenceId);
      if (upd) {
        if (role === "client") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Daily Progress Update*\n\n• *Project:* ${proj.name.split(" (")[0]}\n• *Date:* ${formattedDate(upd.date)}\n• *Overall Progress:* ${proj.progress}% Complete\n\n■ *Work Completed Today*\n• ${upd.completed}\n\n■ *Issues/Blockers*\n• ${upd.issues || "None"}\n\n■ *Plan for Tomorrow*\n• ${upd.tomorrowPlan}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Client Progress Sync_`;
        } else if (role === "md") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Executive Progress Sync*\n\n• *Project Name:* ${proj.name.split(" (")[0]}\n• *Status Date:* ${formattedDate(upd.date)}\n• *Overall Progress:* ${proj.progress}%\n\n■ *Execution Brief*\n• *Work Done Today:* ${upd.completed}\n• *Urgent Site Issues:* ${upd.issues || "None"}\n• *Tomorrow Action:* ${upd.tomorrowPlan}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Executive Dashboard_`;
        } else if (role === "vendor") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Site Status Update*\n\n• *Date:* ${formattedDate(upd.date)}\n• *Site Status:* ${proj.stage} (${proj.progress}% Complete)\n\n■ *Execution Brief*\n• *Today's Work:* ${upd.completed}\n• *Issues to Address:* ${upd.issues || "None"}\n• *Tomorrow Plan:* ${upd.tomorrowPlan}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Site Execution Control_`;
        } else {
          // Team
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Internal Team Sync*\n\n• *Project:* ${proj.name.split(" (")[0]}\n• *Date:* ${formattedDate(upd.date)}\n• *Workers Count:* ${upd.workersCount} on site\n\n■ *Execution Logs*\n• *Completed Today:* ${upd.completed}\n• *Issues Logged:* ${upd.issues || "None"}\n• *Plan Tomorrow:* ${upd.tomorrowPlan}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Operations Team_`;
        }
      }
    } else if (type === "snag") {
      const snag = proj.snags.find(s => s.id === referenceId);
      if (snag) {
        if (role === "client") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Site Quality Inspection*\n\n• *Project:* ${proj.name.split(" (")[0]}\n• *Logged Date:* ${formattedDate(snag.deadline ? snag.deadline : new Date())}\n\n■ *Quality Rectification Item*\n• *Area/Location:* ${snag.area}\n• *Issue Details:* ${snag.issue}\n• *Target Completion:* ${formattedDate(snag.deadline)}\n\n*Status:* Under coordination with subcontractor ${snag.assignedTo} for resolution.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Quality Control_`;
        } else if (role === "md") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Quality Defect Alert*\n\n• *Project:* ${proj.name.split(" (")[0]}\n• *Status:* Open Snag\n\n■ *Snag Details*\n• *Area:* ${snag.area}\n• *Defect:* ${snag.issue}\n• *Assigned Contractor:* ${snag.assignedTo}\n• *Target Resolution:* ${formattedDate(snag.deadline)}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Management Dashboard_`;
        } else if (role === "vendor") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Rectification Request (Urgent)*\n\n• *Contractor:* ${snag.assignedTo}\n\n■ *Snag Details for Action*\n• *Area/Location:* ${snag.area}\n• *Defect Details:* ${snag.issue}\n• *Rectification Target Date:* ${formattedDate(snag.deadline)}\n\nPlease ensure this is addressed and sync with our site engineers upon completion.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Site Quality Control_`;
        } else {
          // Team
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Internal Snag Logged*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Defect Registry*\n• *Area:* ${snag.area}\n• *Issue:* ${snag.issue}\n• *Contractor:* ${snag.assignedTo}\n• *Target Resolution:* ${formattedDate(snag.deadline)}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Field Operations_`;
        }
      }
    } else if (type === "material-approval") {
      const mat = proj.materials.find(m => m.id === referenceId);
      if (mat) {
        if (role === "client") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Material Selection Approval Required*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Proposed Selection*\n• *Material Name:* ${mat.name}\n• *Brand/Supplier:* ${mat.brand}\n• *Finish/Color Code:* ${mat.finishCode}\n• *Remarks:* ${mat.notes || "Standard placement"}\n\nPlease review and confirm your approval at your earliest convenience.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Design & Finishes_`;
        } else if (role === "md") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Material Selection Logged*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Material Specifications*\n• *Item:* ${mat.name}\n• *Brand:* ${mat.brand}\n• *Sourced Vendor:* ${mat.vendor}\n• *Purchase Rate:* ${formattedCurrency(mat.rate)}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Procurement Sync_`;
        } else if (role === "vendor") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Supply Procurement Query*\n\n• *Vendor:* ${mat.vendor}\n\n■ *Material Sample Request*\n• *Specification:* ${mat.name}\n• *Brand Required:* ${mat.brand}\n• *Finish/Color Code:* ${mat.finishCode}\n\nPlease prepare the sample and dispatch details at your earliest convenience.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Materials Supply_`;
        } else {
          // Team
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Material Selection Tracked*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Finishes Log*\n• *Item:* ${mat.name}\n• *Vendor:* ${mat.vendor}\n• *Rate:* ${formattedCurrency(mat.rate)}\n• *Notes:* ${mat.notes || "None"}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Design Registry_`;
        }
      }
    } else if (type === "payment-reminder") {
      const inv = proj.billing.find(i => i.invoiceNo === referenceId);
      if (inv) {
        if (role === "client") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Payment Milestone Reminder*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Invoice Details*\n• *Milestone Stage:* ${inv.type}\n• *Invoice Number:* ${inv.invoiceNo}\n• *Amount Outstanding:* ${formattedCurrency(inv.amount)}\n\nKindly process the payment to ensure material dispatches proceed as scheduled.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Accounts & Billing_`;
        } else if (role === "md") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Billing Collection Sync*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Milestone Billing Status*\n• *Invoice Ref:* ${inv.invoiceNo}\n• *Milestone Type:* ${inv.type}\n• *Outstanding Amount:* ${formattedCurrency(inv.amount)}\n• *Current Status:* ${inv.status}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Accounts Dashboard_`;
        } else if (role === "vendor") {
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Order Dispatch Coordination*\n\n■ *Milestone Status*\n• *Stage Reference:* ${inv.type}\n• *Billing Status:* ${inv.status}\n\nWe are aligning loading and dispatch schedules upon clearance.\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Supply Chain Logistics_`;
        } else {
          // Team
          text = `━━━━━━━━━━━━━━━━━━━━\n  ✦ PREMIO LIVING ✦\n━━━━━━━━━━━━━━━━━━━━\n*Internal Accounts Alert*\n\n• *Project:* ${proj.name.split(" (")[0]}\n\n■ *Billing Collection Log*\n• *Invoice No:* ${inv.invoiceNo}\n• *Milestone:* ${inv.type}\n• *Amount:* ${formattedCurrency(inv.amount)}\n• *Status:* ${inv.status}\n\n━━━━━━━━━━━━━━━━━━━━\n_Premio Living | Operations Finance_`;
        }
      }
    }
    
    if (text) {
      this.shareText(text);
    }
    window.closeModal("whatsapp-share-modal");
  }
};
