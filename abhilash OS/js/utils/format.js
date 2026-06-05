/* js/utils/format.js - Premio Living OS Format Utilities */

window.Utils = {
  formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  },
  
  formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  // --- WHATSAPP TEXT GENERATION SERVICE ---
  
  getDailyUpdateText(project, update) {
    return `*Premio Living — Daily Site Update*

*Project:* ${project.name}
*Date:* ${this.formatDate(update.date)}
*Overall Progress:* ${project.progress}% Complete

*Completed Today:*
• ${update.completed}

*Issues Encountered:*
• ${update.issues || "None"}

*Tomorrow Plan:*
• ${update.tomorrowPlan}

*Labor Strength:*
• Workers on-site: ${update.workersCount}

_Sent via Premio Living OS_`;
  },
  
  getSnagText(project, snag) {
    return `*Premio Living — Defect & Snag Escalation*

*Project:* ${project.name}
*Area:* ${snag.area}
*Defect:* ${snag.issue}
*Priority:* ${snag.priority}
*Assigned Contractor:* ${snag.assignedTo}
*Resolution Deadline:* ${this.formatDate(snag.deadline)}

Please ensure rectification is logged by the target date.

_Sent via Premio Living OS_`;
  },
  
  getPaymentText(project, invoice) {
    return `*Premio Living — Payment Milestone Reminder*

*Project:* ${project.name}
*Client:* ${project.clientName}
*Milestone:* ${invoice.type}
*Amount Due:* ${this.formatCurrency(invoice.amount)}
*Invoice No:* ${invoice.invoiceNo}
*Date Raised:* ${this.formatDate(invoice.date)}

Kindly process payment to proceed with scheduled materials dispatch.

_Sent via Premio Living OS_`;
  },
  
  getApprovalText(project, material) {
    return `*Premio Living — Material Approval Request*

*Project:* ${project.name}
*Material:* ${material.name}
*Brand:* ${material.brand}
*Finish/Color Code:* ${material.finishCode}
*Rate:* ${material.rate > 1000 ? this.formatCurrency(material.rate) : '₹' + material.rate + '/sqft'}
*Notes:* ${material.notes || "Standard placement"}

Please tap the approval link inside your client panel to verify.

_Sent via Premio Living OS_`
  },

  // Converts DD-MM-YYYY to YYYY-MM-DD for storage
  toISODate(ddmmyyyy) {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.trim().split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) return ddmmyyyy; // Already YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return ddmmyyyy;
  },

  // Converts YYYY-MM-DD to DD-MM-YYYY for user display/entry
  toDisplayDate(yyyymmdd) {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.trim().split("-");
    if (parts.length === 3) {
      if (parts[2].length === 4) return yyyymmdd; // Already DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return yyyymmdd;
  },

  // Setup text input mask for auto-inserting hyphens as user types DD-MM-YYYY
  setupDateMask(input) {
    if (!input) return;
    input.placeholder = "DD-MM-YYYY";
    input.maxLength = 10;
    
    // Remove inline onclick handler if type is changed to text
    input.removeAttribute("onclick");
    
    // Add typing listener for automatic formatting
    input.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 8) val = val.substring(0, 8);
      let formatted = "";
      if (val.length > 0) {
        formatted += val.substring(0, 2);
      }
      if (val.length > 2) {
        formatted += "-" + val.substring(2, 4);
      }
      if (val.length > 4) {
        formatted += "-" + val.substring(4, 8);
      }
      e.target.value = formatted;
    });
  },

  // Set up masks for all text-based date inputs currently in the DOM
  setupAllDateMasks() {
    const ids = [
      "new-proj-start", "new-proj-end", "new-update-date", "new-snag-deadline", 
      "new-inv-date", "edit-stage-deadline", "new-del-date", "new-vis-date", 
      "po-delivery-date", "payout-form-target-date", "ai-q-date"
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        this.setupDateMask(el);
      }
    });
  }
};
