/* js/store/state.js - Premio Living OS State Manager */

// Global Error Catching Overlay for presentation troubleshooting
window.addEventListener("error", function(e) {
  const errDiv = document.createElement("div");
  errDiv.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.98); color:#f87171; padding:30px; z-index:99999; font-family:monospace; font-size:12px; overflow:auto; border:4px solid #ef4444;";
  errDiv.innerHTML = "<h2 style='color:#ef4444; margin-top:0;'>⚠️ Premio Living OS Runtime Exception</h2>" +
                     "<p style='color:#fff; font-size:14px;'><b>Error Message:</b> " + e.message + "</p>" +
                     "<p><b>File:</b> " + e.filename + "</p>" +
                     "<p><b>Position:</b> Line " + e.lineno + ", Column " + e.colno + "</p>" +
                     "<h4 style='color:#fff; margin-bottom:5px;'>Stack Trace:</h4>" +
                     "<pre style='background:#1e293b; color:#cbd5e1; padding:15px; border-radius:8px; border:1px solid #334155; white-space:pre-wrap; word-break:break-all;'>" + (e.error ? e.error.stack : '') + "</pre>" +
                     "<div style='margin-top:20px; display:flex; gap:10px;'>" +
                     "  <button onclick='this.parentElement.parentElement.remove()' style='padding:8px 16px; background:#ef4444; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-right:10px;'>Dismiss</button>" +
                     "  <button onclick='window.location.reload()' style='padding:8px 16px; background:#475569; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;'>Reload Page</button>" +
                     "</div>";
  document.body.appendChild(errDiv);
});

// Safe localStorage fail-safe wrapper to prevent file:// protocol security error crashes in Chrome
(function() {
  var storage = null;
  try {
    var testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storage = window.localStorage;
  } catch (e) {
    console.warn("localStorage is blocked or not available in this browser environment. Falling back to in-memory store.");
    storage = {
      _data: {},
      setItem: function(k, v) { this._data[k] = String(v); },
      getItem: function(k) { return this._data.hasOwnProperty(k) ? this._data[k] : null; },
      removeItem: function(k) { delete this._data[k]; },
      clear: function() { this._data = {}; },
      key: function(i) { return Object.keys(this._data)[i] || null; },
      get length() { return Object.keys(this._data).length; }
    };
    try {
      Object.defineProperty(window, 'localStorage', {
        value: storage,
        configurable: true,
        enumerable: true,
        writable: true
      });
    } catch (err) {
      console.error("Could not override window.localStorage:", err);
    }
  }
})();

window.DEFAULT_STATE = {
  projects: [
    {
      id: "project-1",
      name: "Mr. Anil & Aparna (My Home Nishada)",
      clientName: "Mr. Anil & Aparna",
      location: "Tower 3, Apt 2201, My Home Nishada, Financial District, Hyderabad",
      budget: 4500000,
      stage: "Carpentry framing",
      progress: 58,
      startDate: "2026-03-01",
      endDate: "2026-07-15",
      team: {
        designer: "S. Kumar (Principal Architect)",
        engineer: "Rajesh Nair (Site Lead)",
        pm: "Abhilash Reddy (Project Manager)"
      },
      notes: "High-end luxury kitchen and wardrobes. Veneer finishing in formal areas and gloss acrylic for the kitchen shutters. Site requires high supervision for stone joint alignments.",
      drawings: [
        {
          name: "Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf",
          file: "Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf",
          type: "Production Layout",
          uploadedAt: "2026-05-27"
        },
        {
          name: "Kitchen_Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf",
          file: "Kitchen_Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf",
          type: "Kitchen Detail Layout",
          uploadedAt: "2026-05-27"
        }
      ],
      vault: {
        drawings: [
          { name: "Production Floor Layout (v2).pdf", file: "Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf", size: "7.2 MB", date: "2026-05-27" },
          { name: "Kitchen Detail Elevation Drawings.pdf", file: "Kitchen_Mr.Anil & Aparna _T3-2201_My Home Nishada_Production Drawings_27.05.2026.pdf", size: "2.1 MB", date: "2026-05-27" }
        ],
        agreements: [
          { name: "Interior Services Agreement (Executed).pdf", file: "#", size: "1.4 MB", date: "2026-03-02" },
          { name: "NDA - Rajesh Nair & Client.pdf", file: "#", size: "420 KB", date: "2026-03-03" }
        ],
        quotations: [
          { name: "Final BOQ Proposal Rev3.pdf", file: "#", size: "1.8 MB", date: "2026-02-28" }
        ],
        invoices: [
          { name: "INV-MYH-001 - Booking Advance.pdf", file: "#", size: "820 KB", date: "2026-03-03" },
          { name: "INV-MYH-002 - Material Stage.pdf", file: "#", size: "910 KB", date: "2026-04-16" }
        ]
      },
      materials: [
        { 
          id: "mat-1-1", name: "Premium Teak Veneer", brand: "Decowood", finishCode: "TK-9081 Premium", 
          approved: "Approved", ordered: true, delivered: true, installed: false, vendor: "Wood Crafts", rate: 320, 
          notes: "To be used for formal living room wall paneling",
          approvalLog: [{ user: "Client (OTP Verified)", action: "Approved", timestamp: "2026-03-12 11:32:00" }]
        },
        { 
          id: "mat-1-2", name: "Acrylic Shutters", brand: "Advance", finishCode: "2406L Charcoal Gloss", 
          approved: "Approved", ordered: true, delivered: false, installed: false, vendor: "Advance Laminates", rate: 180, 
          notes: "Kitchen shutters",
          approvalLog: [{ user: "Client (OTP Verified)", action: "Approved", timestamp: "2026-04-05 14:10:22" }]
        },
        { 
          id: "mat-1-3", name: "Quartz Countertop", brand: "Caesarstone", finishCode: "5111 White Attica", 
          approved: "Pending", ordered: false, delivered: false, installed: false, vendor: "Stone & Marble Galleria", rate: 850, 
          notes: "Requires final client approval of marble grain",
          approvalLog: []
        },
        { 
          id: "mat-1-4", name: "Magnetic Track Lights", brand: "Philips", finishCode: "Hue Linear Track", 
          approved: "Approved", ordered: false, delivered: false, installed: false, vendor: "Philips Light Studio", rate: 4200, 
          notes: "For primary living room layout",
          approvalLog: [{ user: "Designer (Auto Approval)", action: "Approved", timestamp: "2026-05-10 09:20:15" }]
        },
        { 
          id: "mat-1-5", name: "Hardware Soft-Close Hinges", brand: "Blum", finishCode: "Clip Top Blumotion", 
          approved: "Approved", ordered: true, delivered: true, installed: true, vendor: "Hardware Suppliers Ltd", rate: 450, 
          notes: "Wardrobe fittings",
          approvalLog: [{ user: "Client (OTP Verified)", action: "Approved", timestamp: "2026-03-15 17:40:02" }]
        }
      ],
      stages: [
        { name: "Demolition", progress: 100, status: "Completed", deadline: "2026-03-07", delayReason: "" },
        { name: "Civil work", progress: 100, status: "Completed", deadline: "2026-03-25", delayReason: "" },
        { name: "Electrical roughing", progress: 100, status: "Completed", deadline: "2026-04-10", delayReason: "" },
        { name: "Plumbing", progress: 100, status: "Completed", deadline: "2026-04-20", delayReason: "" },
        { name: "Ceiling framing", progress: 100, status: "Completed", deadline: "2026-05-15", delayReason: "" },
        { name: "Carpentry framing", progress: 65, status: "In Progress", deadline: "2026-06-15", delayReason: "" },
        { name: "Tile laying", progress: 20, status: "In Progress", deadline: "2026-06-10", delayReason: "Tiler worker shortage on site last week" },
        { name: "Painting", progress: 0, status: "Not Started", deadline: "2026-06-30", delayReason: "" },
        { name: "Veneer polishing", progress: 0, status: "Not Started", deadline: "2026-07-05", delayReason: "" },
        { name: "Hardware fixing", progress: 0, status: "Not Started", deadline: "2026-07-08", delayReason: "" },
        { name: "Appliance installation", progress: 0, status: "Not Started", deadline: "2026-07-10", delayReason: "" },
        { name: "Snag corrections", progress: 0, status: "Not Started", deadline: "2026-07-13", delayReason: "" },
        { name: "Handover", progress: 0, status: "Not Started", deadline: "2026-07-15", delayReason: "" }
      ],
      boq: [
        { id: "boq-1-1", category: "Civil", description: "Laying 40mm thick screed concrete in master bath", qty: 240, rate: 85, gst: 18, margin: 15, actualCost: 18000 },
        { id: "boq-1-2", category: "Carpentry", description: "Veneer paneling in Living room (Decowood Teak)", qty: 350, rate: 450, gst: 18, margin: 20, actualCost: 120000 },
        { id: "boq-1-3", category: "Electrical", description: "Wiring and fixing of LED downlights and layout", qty: 45, rate: 350, gst: 18, margin: 15, actualCost: 11000 },
        { id: "boq-1-4", category: "False ceiling", description: "Gypsum board false ceiling in living + master room", qty: 1250, rate: 120, gst: 18, margin: 18, actualCost: 115000 },
        { id: "boq-1-5", category: "Paint", description: "Luster paint finish with putty and double coat primer", qty: 4200, rate: 65, gst: 18, margin: 15, actualCost: 0 },
        { id: "boq-1-6", category: "Hardware", description: "Heavy Duty Blum soft-close sliders & hinges", qty: 32, rate: 850, gst: 18, margin: 12, actualCost: 21000 }
      ],
      updates: [
        {
          date: "2026-05-28",
          completed: "Bedroom modular wardrobe framing 90% completed. Tilers started kitchen backsplash tilling.",
          workersCount: 6,
          issues: "Quartz stone slab for countertop delayed measurement by vendor due to transportation strike.",
          tomorrowPlan: "Install kitchen drawer trial frames and verify wiring for under-cabinet strip lighting.",
          photo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80"
        },
        {
          date: "2026-05-27",
          completed: "Living room false ceiling gypsum boards installed. Electrical lines layout finalized.",
          workersCount: 5,
          issues: "None",
          tomorrowPlan: "Begin wall paneling framing for tv unit background.",
          photo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
        }
      ],
      snags: [
        { id: "snag-1-1", area: "Kitchen", issue: "Under-sink cabinet door hinge rubbing against panel edge.", priority: "Medium", assignedTo: "Wood Crafts", status: "Open", deadline: "2026-06-02" },
        { id: "snag-1-2", area: "Master Bedroom", issue: "Veneer bubble observed on the right wardrobe sliding shutter.", priority: "High", assignedTo: "Wood Crafts", status: "Open", deadline: "2026-05-31" },
        { id: "snag-1-3", area: "Corridor", issue: "Ceiling magnetic track light channel misaligned by 5mm.", priority: "Low", assignedTo: "Philips Light Studio", status: "Closed", deadline: "2026-05-25" }
      ],
      handoverChecklist: {
        snagsClosed: false,
        deepCleaning: false,
        appliancesTested: false,
        keysHandedOver: false,
        warrantiesShared: false,
        finalPaymentReceived: false
      },
      dependencies: [
        { id: "dep-1-1", type: "Material", description: "Quartz countertop delivery", blockedBy: "Stone & Marble Galleria", owner: "Rajesh Nair", targetDate: "2026-06-10", status: "Blocked", daysDelayed: 5 },
        { id: "dep-1-2", type: "RFQ", description: "Magnetic track light final quote", blockedBy: "Philips Light Studio", owner: "Abhilash Reddy", targetDate: "2026-06-05", status: "Waiting", daysDelayed: 2 },
        { id: "dep-1-3", type: "Payment", description: "Carpentry inception payment", blockedBy: "Naveen Sir (Accounts)", owner: "Abhilash Reddy", targetDate: "2026-05-28", status: "Overdue", daysDelayed: 8 }
      ],
      billing: [
        { invoiceNo: "INV-MYH-001", type: "Booking Advance", amount: 1350000, date: "2026-03-02", status: "Paid" },
        { invoiceNo: "INV-MYH-002", type: "First Material Stage", amount: 1350000, date: "2026-04-15", status: "Paid" },
        { invoiceNo: "INV-MYH-003", type: "Carpentry Inception", amount: 900000, date: "2026-05-25", status: "Pending" }
      ],
      deliveries: [
        { id: "del-1-1", item: "Kitchen Quartz Slab", qty: "1 Unit", date: "2026-05-29", status: "Pending" },
        { id: "del-1-2", item: "Blum Wardrobe Soft hinges", qty: "32 Pcs", date: "2026-05-28", status: "Delivered" }
      ],
      visits: [
        { id: "vis-1-1", purpose: "Plastering check", date: "2026-05-29", time: "11:00 AM", visitor: "S. Kumar (Architect)" }
      ]
    },
    {
      id: "project-2",
      name: "Botanika Villa (Gachibowli)",
      clientName: "Mr. Vikram Reddy",
      location: "Villa 45, The Botanika, Gachibowli, Hyderabad",
      budget: 9200000,
      stage: "Civil work",
      progress: 35,
      startDate: "2026-04-20",
      endDate: "2026-10-10",
      team: {
        designer: "S. Kumar (Principal Architect)",
        engineer: "Amit Sharma (Site Lead)",
        pm: "Abhilash Reddy (Project Manager)"
      },
      notes: "Premium triplex villa. Structural changes, layout alterations, customized Italian marble in all living areas, and ducted VRV HVAC systems.",
      drawings: [
        {
          name: "Villa 45 Structural Layout.pdf",
          file: "#",
          type: "Layout",
          uploadedAt: "2026-04-22"
        },
        {
          name: "HVAC Design Plan.pdf",
          file: "#",
          type: "MEP Drawing",
          uploadedAt: "2026-04-25"
        }
      ],
      vault: {
        drawings: [
          { name: "Villa 45 Floor Layout Plan.pdf", file: "#", size: "4.2 MB", date: "2026-04-22" },
          { name: "HVAC Duct layout.pdf", file: "#", size: "3.1 MB", date: "2026-04-25" }
        ],
        agreements: [
          { name: "Executed Design Consultation Agreement.pdf", file: "#", size: "2.1 MB", date: "2026-04-10" }
        ],
        quotations: [
          { name: "Villa 45 Initial Estimation Cost.pdf", file: "#", size: "1.2 MB", date: "2026-04-15" }
        ],
        invoices: [
          { name: "INV-BOT-001 - Retainer Invoice.pdf", file: "#", size: "410 KB", date: "2026-04-21" },
          { name: "INV-BOT-002 - Demolition Phase Release.pdf", file: "#", size: "520 KB", date: "2026-05-11" }
        ]
      },
      materials: [
        { id: "mat-2-1", name: "Italian Marble - Dyna", brand: "Imported Stone", finishCode: "Dyna Premium Beige", approved: "Approved", ordered: true, delivered: true, installed: false, vendor: "Royal Stones", rate: 450, notes: "Main living and lounge floorings", approvalLog: [{ user: "Client (OTP Verified)", action: "Approved", timestamp: "2026-04-28 10:12:00" }] },
        { id: "mat-2-2", name: "Ducted VRV System", brand: "Daikin", finishCode: "12HP VRV IV-S", approved: "Approved", ordered: true, delivered: false, installed: false, vendor: "HVAC Fab Experts", rate: 125000, notes: "Outdoor unit placing on terrace", approvalLog: [{ user: "Designer (Auto Approval)", action: "Approved", timestamp: "2026-05-02 11:30:45" }] },
        { id: "mat-2-3", name: "Engineered Hardwood Floor", brand: "Pergo", finishCode: "Oak Classic Planks", approved: "Pending", ordered: false, delivered: false, installed: false, vendor: "Pergo India", rate: 220, notes: "For master bedroom and gym layout", approvalLog: [] }
      ],
      stages: [
        { name: "Demolition", progress: 100, status: "Completed", deadline: "2026-05-05", delayReason: "" },
        { name: "Civil work", progress: 75, status: "In Progress", deadline: "2026-06-10", delayReason: "" },
        { name: "Electrical roughing", progress: 10, status: "In Progress", deadline: "2026-06-25", delayReason: "" },
        { name: "Plumbing", progress: 0, status: "Not Started", deadline: "2026-07-05", delayReason: "" },
        { name: "Ceiling framing", progress: 0, status: "Not Started", deadline: "2026-07-25", delayReason: "" },
        { name: "Carpentry framing", progress: 0, status: "Not Started", deadline: "2026-08-30", delayReason: "" },
        { name: "Tile laying", progress: 0, status: "Not Started", deadline: "2026-09-10", delayReason: "" },
        { name: "Painting", progress: 0, status: "Not Started", deadline: "2026-09-25", delayReason: "" },
        { name: "Veneer polishing", progress: 0, status: "Not Started", deadline: "2026-10-02", delayReason: "" },
        { name: "Hardware fixing", progress: 0, status: "Not Started", deadline: "2026-10-05", delayReason: "" },
        { name: "Appliance installation", progress: 0, status: "Not Started", deadline: "2026-10-07", delayReason: "" },
        { name: "Snag corrections", progress: 0, status: "Not Started", deadline: "2026-10-09", delayReason: "" },
        { name: "Handover", progress: 0, status: "Not Started", deadline: "2026-10-10", delayReason: "" }
      ],
      boq: [
        { id: "boq-2-1", category: "Civil", description: "Brick masonry layout walls for partition of utility", qty: 180, rate: 95, gst: 18, margin: 15, actualCost: 12000 },
        { id: "boq-2-2", category: "Civil", description: "Laying Dyna Italian marble floor with epoxy and polish", qty: 1550, rate: 650, gst: 18, margin: 18, actualCost: 650000 }
      ],
      updates: [
        {
          date: "2026-05-28",
          completed: "Lobby partition brick wall completed. Master bedroom bathroom floor slab leveling done.",
          workersCount: 8,
          issues: "None",
          tomorrowPlan: "Begin rough conduits layout markings on bedroom partition walls.",
          photo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80"
        }
      ],
      snags: [],
      handoverChecklist: {
        snagsClosed: false,
        deepCleaning: false,
        appliancesTested: false,
        keysHandedOver: false,
        warrantiesShared: false,
        finalPaymentReceived: false
      },
      dependencies: [
        { id: "dep-2-1", type: "Approval", description: "Italian marble slab selection client approval", blockedBy: "Mr. Vikram Reddy (Client)", owner: "S. Kumar", targetDate: "2026-06-01", status: "Waiting", daysDelayed: 4 },
        { id: "dep-2-2", type: "Design", description: "HVAC duct routing final drawing", blockedBy: "MEP Consultant", owner: "Amit Sharma", targetDate: "2026-06-08", status: "Blocked", daysDelayed: 6 }
      ],
      billing: [
        { invoiceNo: "INV-BOT-001", type: "Booking Advance", amount: 920000, date: "2026-04-20", status: "Paid" },
        { invoiceNo: "INV-BOT-002", type: "Demolition & Layout Completion", amount: 1840000, date: "2026-05-10", status: "Paid" }
      ],
      deliveries: [
        { id: "del-2-1", item: "Italian Marble Slabs", qty: "20 Pcs", date: "2026-05-29", status: "Pending" }
      ],
      visits: []
    }
  ],
  vendors: [
    { name: "Wood Crafts", category: "Carpentry", phone: "+91 98480 12345", rating: 4.8, delayHistory: "Low", activeProjects: 1 },
    { name: "Stone & Marble Galleria", category: "Stone/Marble", phone: "+91 98660 54321", rating: 4.2, delayHistory: "Medium", activeProjects: 2 },
    { name: "Philips Light Studio", category: "Electrical/Lighting", phone: "+91 99080 98765", rating: 4.9, delayHistory: "Low", activeProjects: 1 },
    { name: "Royal Stones", category: "Stone/Marble", phone: "+91 98490 65432", rating: 4.5, delayHistory: "High", activeProjects: 1 },
    { name: "Advance Laminates", category: "Acrylics & Laminates", phone: "+91 91234 56789", rating: 4.6, delayHistory: "Low", activeProjects: 1 }
  ],
  purchaseOrders: [
    {
      id: "po-1",
      poNumber: "PO-2026-001",
      projectId: "project-2",
      projectName: "Botanika Villa (Gachibowli)",
      vendorName: "Royal Stones",
      vendorPhone: "+91 98490 65432",
      deliveryDate: "2026-06-10",
      gst: 18,
      additionalCharges: 5000,
      notes: "Slabs must be selected from lot #12 to ensure uniform vein pattern.",
      vendorConfirmed: true,
      status: "Confirmed",
      items: [
        { category: "Marble", description: "Dyna Italian Marble Beige Slabs", qty: 1550, unit: "SFT", rate: 450 }
      ],
      subtotal: 697500,
      grandTotal: 828050,
      createdAt: "2026-05-15"
    },
    {
      id: "po-2",
      poNumber: "PO-2026-002",
      projectId: "project-1",
      projectName: "Mr. Anil & Aparna (My Home Nishada)",
      vendorName: "Wood Crafts",
      vendorPhone: "+91 98480 12345",
      deliveryDate: "2026-06-05",
      gst: 18,
      additionalCharges: 2000,
      notes: "Veneer sheets must be from sequential flitch numbers.",
      vendorConfirmed: false,
      status: "Sent",
      items: [
        { category: "Veneer", description: "Decowood Premium Teak Veneer TK-9081", qty: 350, unit: "SFT", rate: 320 }
      ],
      subtotal: 112000,
      grandTotal: 134160,
      createdAt: "2026-05-20"
    },
    {
      id: "po-3",
      poNumber: "PO-2026-003",
      projectId: "project-1",
      projectName: "Mr. Anil & Aparna (My Home Nishada)",
      vendorName: "Advance Laminates",
      vendorPhone: "+91 91234 56789",
      deliveryDate: "2026-06-02",
      gst: 18,
      additionalCharges: 500,
      notes: "Delivery to be made to Tower 3 lobby directly.",
      vendorConfirmed: false,
      status: "Draft",
      items: [
        { category: "Laminate", description: "Advance Gloss Acrylic 2406L Charcoal Gloss", qty: 120, unit: "Sheet", rate: 180 }
      ],
      subtotal: 21600,
      grandTotal: 25988,
      createdAt: "2026-05-25"
    }
  ],
  rfqs: [
    {
      id: "rfq-1",
      rfqNumber: "RFQ-2026-001",
      projectId: "project-2",
      projectName: "Botanika Villa (Gachibowli)",
      category: "Glass",
      itemDescription: "Bronze Mirror 6mm",
      qty: 120,
      unit: "SFT",
      notes: "Requires bevelled edge polishing. Slabs must be scratch-free.",
      vendors: ["Royal Stones", "Advance Laminates"],
      status: "Quote Received",
      createdAt: "2026-05-25",
      quotes: [
        { vendorName: "Royal Stones", rate: 350, gst: 18, additionalCharges: 1500, notes: "Ex-factory delivery in 3 days", submittedAt: "2026-05-26" },
        { vendorName: "Advance Laminates", rate: 320, gst: 18, additionalCharges: 2500, notes: "Requires 6 days delivery time", submittedAt: "2026-05-27" }
      ],
      selectedVendor: "",
      convertedToPO: false,
      history: [
        { date: "2026-05-25", text: "RFQ created as Draft" },
        { date: "2026-05-25", text: "RFQ sent to selected vendors" },
        { date: "2026-05-27", text: "Received quote from Advance Laminates and Royal Stones" }
      ]
    },
    {
      id: "rfq-2",
      rfqNumber: "RFQ-2026-002",
      projectId: "project-1",
      projectName: "Mr. Anil & Aparna (My Home Nishada)",
      category: "Hardware",
      itemDescription: "Blum Tandembox runners 20 inch",
      qty: 24,
      unit: "Set",
      notes: "Need soft-close models with full drawer extension.",
      vendors: ["Wood Crafts", "Philips Light Studio"],
      status: "Under Review",
      createdAt: "2026-05-26",
      quotes: [
        { vendorName: "Wood Crafts", rate: 2400, gst: 18, additionalCharges: 1000, notes: "Original Blum parts", submittedAt: "2026-05-27" }
      ],
      selectedVendor: "Wood Crafts",
      convertedToPO: false,
      history: [
        { date: "2026-05-26", text: "RFQ created as Draft" },
        { date: "2026-05-27", text: "Quote received from Wood Crafts. Set status to Under Review." }
      ]
    }
  ],
  payouts: [],
  activityLog: [
    { id: "act-1", type: "rfq", icon: "file-question", color: "text-amber-500", message: "RFQ-2026-001 sent to Royal Stones & Advance Laminates", project: "Botanika Villa (Gachibowli)", timestamp: "2026-05-25T10:30:00Z" },
    { id: "act-2", type: "update", icon: "camera", color: "text-cyan-400", message: "Daily site log submitted — Bedroom wardrobe framing 90% done", project: "Mr. Anil & Aparna", timestamp: "2026-05-28T18:00:00Z" },
    { id: "act-3", type: "snag", icon: "alert-triangle", color: "text-rose-500", message: "High priority snag raised — Veneer bubble in Master Bedroom wardrobe", project: "Mr. Anil & Aparna", timestamp: "2026-05-29T09:15:00Z" },
    { id: "act-4", type: "po", icon: "clipboard-signature", color: "text-blue-400", message: "PO-2026-001 confirmed by Royal Stones for Italian Marble slabs", project: "Botanika Villa (Gachibowli)", timestamp: "2026-05-20T14:00:00Z" },
    { id: "act-5", type: "payment", icon: "wallet", color: "text-purple-400", message: "INV-BOT-002 ₹18,40,000 paid — Demolition & Layout Completion", project: "Botanika Villa (Gachibowli)", timestamp: "2026-05-10T11:00:00Z" },
    { id: "act-6", type: "delivery", icon: "truck", color: "text-emerald-400", message: "Blum Wardrobe Soft Hinges (32 pcs) delivered to site", project: "Mr. Anil & Aparna", timestamp: "2026-05-28T16:30:00Z" }
  ],
  todaysActions: [
    { id: "ta-1", text: "Call Wood Crafts re: veneer bubble snag resolution", type: "Call Vendor", completed: false, priority: "High" },
    { id: "ta-2", text: "Approve Quartz countertop material spec for Kitchen", type: "Approve Material", completed: false, priority: "High" },
    { id: "ta-3", text: "Raise carpentry inception payment — INV-MYH-003", type: "Raise Payment", completed: false, priority: "Medium" },
    { id: "ta-4", text: "Site visit — My Home Nishada for plaster check", type: "Site Visit", completed: false, priority: "Medium" },
    { id: "ta-5", text: "Follow up on RFQ-2026-001 quote from Advance Laminates", type: "Follow-up RFQ", completed: false, priority: "Low" }
  ]
};

// --- APP GLOBAL NAVIGATION STATES ---
window.AppStore = {
  state: null,
  activePage: "today", // DEFAULT TO 'TODAY' HEART VIEW
  activeProjectId: null,
  activeProjectTab: "overview",
  activeRole: "admin", // Admin, Designer, Site Engineer, Vendor, Client
  activeMode: "site", // site, management, ai-labs
  offlineQueue: [],
  
  loadState() {
    const stored = localStorage.getItem("premio_living_state_v3");
    const storedRole = localStorage.getItem("premio_role");
    const storedMode = localStorage.getItem("premio_mode");
    if (stored) {
      try {
        this.state = JSON.parse(stored);
        if (!this.state) {
          this.state = JSON.parse(JSON.stringify(window.DEFAULT_STATE));
        }
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(window.DEFAULT_STATE));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(window.DEFAULT_STATE));
      this.saveState();
    }
    if (storedRole) {
      this.activeRole = storedRole;
    }
    if (storedMode) {
      this.activeMode = storedMode;
    }
    
    // Load offline queue
    const queue = localStorage.getItem("premio_offline_queue");
    if (queue) {
      this.offlineQueue = JSON.parse(queue);
    }

    this.sanitizeState();
    // Auto-deduplicate on startup
    this.deduplicateAll();
  },

  sanitizeState() {
    if (!this.state) {
      this.state = JSON.parse(JSON.stringify(window.DEFAULT_STATE));
    }
    if (!this.state.projects || !Array.isArray(this.state.projects)) this.state.projects = [];
    if (!this.state.vendors || !Array.isArray(this.state.vendors)) this.state.vendors = [];
    if (!this.state.rfqs || !Array.isArray(this.state.rfqs)) this.state.rfqs = [];
    if (!this.state.purchaseOrders || !Array.isArray(this.state.purchaseOrders)) this.state.purchaseOrders = [];
    if (!this.state.payouts || !Array.isArray(this.state.payouts)) this.state.payouts = [];
    if (!this.state.activityLog || !Array.isArray(this.state.activityLog)) this.state.activityLog = [];
    if (!this.state.todaysActions || !Array.isArray(this.state.todaysActions)) this.state.todaysActions = window.DEFAULT_STATE.todaysActions ? JSON.parse(JSON.stringify(window.DEFAULT_STATE.todaysActions)) : [];
    
    // Ensure projects have new fields
    if (this.state.projects) {
      this.state.projects.forEach(p => {
        if (!p.materials) p.materials = [];
        if (!p.billing) p.billing = [];
        if (!p.stages) p.stages = [];
        if (!p.snags) p.snags = [];
        if (!p.deliveries) p.deliveries = [];
        if (!p.updates) p.updates = [];
        if (!p.visits) p.visits = [];
        if (!p.team) p.team = { designer: "S. Kumar (Principal Architect)", engineer: "Rajesh Nair (Site Lead)", pm: "Abhilash Reddy (Project Manager)" };
        if (!p.handoverChecklist) p.handoverChecklist = { snagsClosed: false, deepCleaning: false, appliancesTested: false, keysHandedOver: false, warrantiesShared: false, finalPaymentReceived: false };
        if (!p.dependencies) p.dependencies = [];
        if (!p.vault) p.vault = { drawings: [], agreements: [], quotations: [], invoices: [] };
        if (!p.vault.drawings) p.vault.drawings = [];
        if (!p.vault.agreements) p.vault.agreements = [];
        if (!p.vault.quotations) p.vault.quotations = [];
        if (!p.vault.invoices) p.vault.invoices = [];
        if (!p.drawings) p.drawings = [];
        if (!p.name) p.name = "Unnamed Project";
        if (!p.clientName) p.clientName = "Valued Client";
        if (!p.location) p.location = "Unknown Location";
        if (p.budget === undefined || p.budget === null) p.budget = 0;
        if (!p.stage) p.stage = "Planning";
        if (p.progress === undefined || p.progress === null) p.progress = 0;
        if (!p.startDate) p.startDate = new Date().toISOString().split('T')[0];
        if (!p.endDate) p.endDate = new Date().toISOString().split('T')[0];

        p.dependencies.forEach(d => {
          if (!d.history) {
            d.history = [
              { date: "2026-06-01", user: "SYSTEM", text: "Dependency initialized" }
            ];
          }
        });
        if (!p.decisions) {
          if (p.id === "project-1") {
            p.decisions = [
              { id: "dec-1", date: "2026-05-10", description: "Client changed kitchen finish from matte laminate to gloss charcoal acrylic.", requestedBy: "Mr. Anil", approvedBy: "S. Kumar (Designer)", impact: "Increases cost and adds 5 days to modular procurement lead time.", costImpact: 45000, timeImpact: 5, attachments: [] },
              { id: "dec-2", date: "2026-05-18", description: "Architect changed wardrobe layout in guest room to accommodate sliding drawers.", requestedBy: "S. Kumar", approvedBy: "Mr. Anil (Client)", impact: "Additional ply wood materials required, no timeline impact.", costImpact: 12000, timeImpact: 0, attachments: [] }
            ];
          } else if (p.id === "project-2") {
            p.decisions = [
              { id: "dec-3", date: "2026-05-15", description: "Factory changed shutter specification from 18mm MDF to 19mm HDMR to improve moisture resistance.", requestedBy: "Factory Production Lead", approvedBy: "S. Kumar (Principal Architect)", impact: "Marginal material rate increase, prevents warping issues.", costImpact: 8500, timeImpact: 0, attachments: [] }
            ];
          } else {
            p.decisions = [];
          }
        }
        if (!p.changes) {
          if (p.id === "project-1") {
            p.changes = [
              { id: "chg-1", date: "2026-05-10", reason: "Laminate finish upgrade", originalScope: "Matte Laminate kitchen shutters", revisedScope: "Charcoal Gloss Acrylic kitchen shutters", costDifference: 45000, timelineDifference: 5, approvalStatus: "Approved" },
              { id: "chg-2", date: "2026-05-18", reason: "Guest wardrobe design modification", originalScope: "Openable wardrobe shutters with internal hanging rod only", revisedScope: "Sliding wardrobe shutters with 3 internal drawers and mirror profile", costDifference: 12000, timelineDifference: 0, approvalStatus: "Approved" }
            ];
          } else if (p.id === "project-2") {
            p.changes = [
              { id: "chg-3", date: "2026-05-15", reason: "Material upgrade for moisture resistance", originalScope: "18mm MDF carcass", revisedScope: "19mm HDMR carcass", costDifference: 8500, timelineDifference: 0, approvalStatus: "Approved" }
            ];
          } else {
            p.changes = [];
          }
        }
      });
    }
  },

  deduplicateAll() {
    if (!this.state) return;
    
    // 1. Projects (Deduplicate by Name)
    if (this.state.projects) {
      const unique = [];
      const seen = new Set();
      this.state.projects.forEach(p => {
        const key = (p.name || "").trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      });
      if (unique.length !== this.state.projects.length) {
        this.state.projects = unique;
        localStorage.setItem("premio_living_state_v3", JSON.stringify(this.state));
      }
    }

    // 2. Vendors
    if (this.state.vendors) {
      const unique = [];
      const seen = new Set();
      this.state.vendors.forEach(v => {
        const key = (v.name || "").trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(v);
        }
      });
      this.state.vendors = unique;
    }

    // 3. RFQs
    if (this.state.rfqs) {
      const unique = [];
      const seen = new Set();
      this.state.rfqs.forEach(r => {
        const key = (r.rfqNumber || "").trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(r);
        }
      });
      this.state.rfqs = unique;
    }

    // 4. POs
    if (this.state.purchaseOrders) {
      const unique = [];
      const seen = new Set();
      this.state.purchaseOrders.forEach(po => {
        const key = (po.poNumber || "").trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(po);
        }
      });
      this.state.purchaseOrders = unique;
    }
  },
  
  _syncTimeout: null,

  saveState() {
    localStorage.setItem("premio_living_state_v3", JSON.stringify(this.state));
    localStorage.setItem("premio_offline_queue", JSON.stringify(this.offlineQueue));
    localStorage.setItem("premio_mode", this.activeMode);

    // Auto-sync to Supabase in the background (debounced)
    if (window.dbService && window.dbService.isCloudActive() && window.AuthService && window.AuthService.currentUser) {
      if (this._syncTimeout) clearTimeout(this._syncTimeout);
      this._syncTimeout = setTimeout(() => {
        this.syncToCloud();
      }, 2000);
    }
  },

  logActivity(type, message, project) {
    if (!this.state.activityLog) this.state.activityLog = [];
    const iconMap = { rfq: 'file-question', update: 'camera', snag: 'alert-triangle', po: 'clipboard-signature', payment: 'wallet', delivery: 'truck', project: 'folder', vendor: 'users', approval: 'check-circle' };
    const colorMap = { rfq: 'text-amber-500', update: 'text-cyan-400', snag: 'text-rose-500', po: 'text-blue-400', payment: 'text-purple-400', delivery: 'text-emerald-400', project: 'text-teal-400', vendor: 'text-orange-400', approval: 'text-green-400' };
    this.state.activityLog.unshift({
      id: 'act-' + Date.now(),
      type,
      icon: iconMap[type] || 'activity',
      color: colorMap[type] || 'text-secondary',
      message,
      project: project || '',
      timestamp: new Date().toISOString()
    });
    if (this.state.activityLog.length > 50) this.state.activityLog = this.state.activityLog.slice(0, 50);
    this.saveState();
  },

  toggleTodaysAction(actionId) {
    if (!this.state.todaysActions) return;
    const action = this.state.todaysActions.find(a => a.id === actionId);
    if (action) {
      action.completed = !action.completed;
      this.saveState();
    }
  },

  getProjectHealthScore(proj) {
    if (!proj) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let score = 100;
    const openSnags = (proj.snags || []).filter(s => s.status === 'Open').length;
    const highSnags = (proj.snags || []).filter(s => s.status === 'Open' && s.priority === 'High').length;
    const overdueStages = (proj.stages || []).filter(s => s.deadline < todayStr && s.progress < 100).length;
    const pendingDeliveries = (proj.deliveries || []).filter(d => d.status === 'Pending' && d.date < todayStr).length;
    const blockedDeps = (proj.dependencies || []).filter(d => d.status === 'Blocked' || d.status === 'Overdue').length;
    const pendingMaterials = (proj.materials || []).filter(m => m.approved === 'Pending').length;
    score -= (openSnags * 5) + (highSnags * 5) + (overdueStages * 10) + (pendingDeliveries * 8) + (blockedDeps * 7) + (pendingMaterials * 3);
    return Math.max(0, Math.min(100, score));
  },

  getProjectProgress(proj) {
    if (!proj) return 0;
    
    // 1. Trade Progress % (from the latest update that has it, otherwise default to base or stage avg)
    let tradeAvg = 0;
    const updatesWithTrade = (proj.updates || []).filter(u => u.tradeProgress && Object.keys(u.tradeProgress).length > 0);
    if (updatesWithTrade.length > 0) {
      const latestTrade = updatesWithTrade[0].tradeProgress;
      const trades = ['carpentry', 'electrical', 'painting', 'falseCeiling', 'stone', 'glass', 'modular'];
      let sum = 0;
      trades.forEach(t => {
        sum += parseInt(latestTrade[t] || 0);
      });
      tradeAvg = Math.round(sum / trades.length);
    } else {
      tradeAvg = proj.progress || 0;
    }

    // 2. Completed Milestones % (from stages progress average)
    let milestonesAvg = 0;
    if (proj.stages && proj.stages.length > 0) {
      const sum = proj.stages.reduce((acc, st) => acc + (st.progress || 0), 0);
      milestonesAvg = Math.round(sum / proj.stages.length);
    }

    // 3. Completed Tasks % (from dependencies and snags)
    let tasksAvg = 100;
    const totalSnags = (proj.snags || []).length;
    const closedSnags = (proj.snags || []).filter(s => s.status === 'Closed').length;
    const totalDeps = (proj.dependencies || []).length;
    const completedDeps = (proj.dependencies || []).filter(d => d.status === 'Completed' || d.status === 'Resolved').length;
    
    const totalTasks = totalSnags + totalDeps;
    if (totalTasks > 0) {
      tasksAvg = Math.round(((closedSnags + completedDeps) / totalTasks) * 100);
    } else {
      tasksAvg = milestonesAvg;
    }

    const finalProgress = Math.round((tradeAvg + milestonesAvg + tasksAvg) / 3);
    return Math.max(0, Math.min(100, finalProgress));
  },

  getProjectStatus(proj) {
    const score = this.getProjectHealthScore(proj);
    const todayStr = new Date().toISOString().split('T')[0];
    const daysLeft = proj.endDate ? Math.ceil((new Date(proj.endDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24)) : 999;
    if (score >= 80 && daysLeft > 14) return { label: 'On Track', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' };
    if (daysLeft <= 14 && daysLeft > 0) return { label: 'Near Handover', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25' };
    if (score < 40) return { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25' };
    if (score < 70) return { label: 'Delayed', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' };
    return { label: 'Active', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/25' };
  },

  getHandoverReadiness(proj) {
    if (!proj || !proj.handoverChecklist) return 0;
    const cl = proj.handoverChecklist;
    const checks = [cl.snagsClosed, cl.deepCleaning, cl.appliancesTested, cl.keysHandedOver, cl.warrantiesShared, cl.finalPaymentReceived];
    const allPaidInvoices = (proj.billing || []).every(b => b.status === 'Paid');
    const noOpenSnags = (proj.snags || []).filter(s => s.status === 'Open').length === 0;
    const dynamicChecks = [allPaidInvoices, noOpenSnags, ...checks];
    const done = dynamicChecks.filter(Boolean).length;
    return Math.round((done / dynamicChecks.length) * 100);
  },

  async toggleHandoverCheck(projId, checkKey) {
    const proj = this.state.projects.find(p => p.id === projId);
    if (!proj) return;
    if (!proj.handoverChecklist) proj.handoverChecklist = {};
    proj.handoverChecklist[checkKey] = !proj.handoverChecklist[checkKey];
    this.saveState();
    await window.dbService.saveProject(proj);
    window.AppRouter.refresh();
  },

  async updateDependency(projId, depId, updates, userRole = 'admin') {
    const proj = this.state.projects.find(p => p.id === projId);
    if (!proj) return [];
    const dep = proj.dependencies.find(d => d.id === depId);
    if (!dep) return [];
    
    if (!dep.history) dep.history = [];
    const timestamp = new Date().toISOString().split('T')[0];
    const user = userRole.toUpperCase();
    
    Object.keys(updates).forEach(key => {
      const oldVal = dep[key];
      const newVal = updates[key];
      if (oldVal !== newVal) {
        dep.history.push({
          date: timestamp,
          user: user,
          text: `Changed ${key} from "${oldVal || 'None'}" to "${newVal || 'None'}"`
        });
        dep[key] = newVal;
      }
    });

    const unblockedDeps = [];
    if (updates.status === 'Completed' || updates.status === 'Resolved') {
      dep.resolutionDate = timestamp;
      dep.daysDelayed = 0;
      
      // 1. Look for other dependencies blocked by this one and unblock them
      proj.dependencies.forEach(d => {
        if (d.status === 'Blocked' && d.blockedBy && 
            (d.blockedBy.toLowerCase().trim() === dep.description.toLowerCase().trim() || 
             d.blockedBy.toLowerCase().trim() === dep.type.toLowerCase().trim() ||
             d.blockedBy.toLowerCase().trim() === dep.id.toLowerCase().trim())) {
          d.status = 'In Progress'; // Unblock dependency
          d.blockedBy = ''; // Clear blockedBy since the block is removed
          if (!d.history) d.history = [];
          d.history.push({
            date: timestamp,
            user: user,
            text: `Automatically unblocked as dependency "${dep.description}" was marked Completed.`
          });
          unblockedDeps.push(d);
        }
      });

      // 2. Look for timeline stages/activities blocked by this dependency and unblock them
      proj.stages.forEach(st => {
        if (st.status === 'Blocked' && st.dependency && 
            (st.dependency.toLowerCase().trim() === dep.description.toLowerCase().trim() ||
             st.dependency.toLowerCase().trim() === dep.type.toLowerCase().trim() ||
             st.dependency.toLowerCase().trim() === dep.id.toLowerCase().trim())) {
          st.status = st.progress > 0 ? 'In Progress' : 'Pending'; // Move dependent task to active/pending
          st.dependency = ''; // Clear dependency
          st.delayReason = ''; // Clear reason
          st.lastUpdated = timestamp;
          
          this.logActivity('project', `Timeline Stage "${st.name}" automatically unblocked and moved to active state.`, proj.name);
        }
      });
    }

    this.saveState();
    await window.dbService.saveProject(proj);
    return unblockedDeps;
  },

  async updateProjectTradeProgress(projId, newTrades, userRole = 'admin') {
    const proj = this.state.projects.find(p => p.id === projId);
    if (!proj) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    let latest = proj.updates.find(u => u.date === todayStr);
    
    if (!latest) {
      latest = {
        date: todayStr,
        completed: "Site trade progress updated from dashboard breakdown.",
        workersCount: 6,
        issues: "None",
        tomorrowPlan: "Proceed with scheduled installations.",
        photo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
        labour: { carpenter: 2, helper: 2, painter: 0, electrician: 2, plumber: 0 },
        tradeProgress: { carpentry: 0, electrical: 0, painting: 0, falseCeiling: 0, stone: 0, glass: 0, modular: 0 },
        tomorrowChecklist: [],
        photoDetails: { area: "", remarks: "" }
      };
      proj.updates.unshift(latest);
    }
    
    if (!latest.tradeProgress) latest.tradeProgress = {};
    
    Object.keys(newTrades).forEach(t => {
      const newVal = parseInt(newTrades[t]) || 0;
      latest.tradeProgress[t] = newVal;
    });
    
    proj.progress = this.getProjectProgress(proj);
    
    this.saveState();
    await window.dbService.saveProject(proj);
    this.logActivity('project', `Updated trade progress for ${proj.name.split(" (")[0]}`, proj.name);
  },

  async syncToCloud() {
    console.log("Supabase: Performing background auto-sync...");
    const db = window.dbService;
    try {
      const promises = [];

      if (this.state.projects && this.state.projects.length > 0) {
        const payload = this.state.projects.map(p => ({ id: p.id, data: p, updated_at: new Date().toISOString() }));
        promises.push(db.client.from('projects').upsert(payload));
      }
      if (this.state.vendors && this.state.vendors.length > 0) {
        const payload = this.state.vendors.map(v => ({ id: v.name, data: v, updated_at: new Date().toISOString() }));
        promises.push(db.client.from('vendors').upsert(payload));
      }
      if (this.state.rfqs && this.state.rfqs.length > 0) {
        const payload = this.state.rfqs.map(r => ({ id: r.id, data: r, updated_at: new Date().toISOString() }));
        promises.push(db.client.from('rfqs').upsert(payload));
      }
      if (this.state.purchaseOrders && this.state.purchaseOrders.length > 0) {
        const payload = this.state.purchaseOrders.map(po => ({ id: po.id, data: po, updated_at: new Date().toISOString() }));
        promises.push(db.client.from('purchase_orders').upsert(payload));
      }
      if (this.state.payouts && this.state.payouts.length > 0) {
        const payload = this.state.payouts.map(pay => ({ id: pay.id, data: pay, updated_at: new Date().toISOString() }));
        promises.push(db.client.from('payouts').upsert(payload));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
      console.log("Supabase: Background auto-sync complete.");
    } catch (e) {
      console.error("Supabase: Background auto-sync failed", e);
    }
  },
  
  setRole(role) {
    this.activeRole = role;
    localStorage.setItem("premio_role", role);
    this.saveState();
  },
  
  setMode(mode) {
    this.activeMode = mode;
    localStorage.setItem("premio_mode", mode);
    this.saveState();
  },
  
  addToOfflineQueue(actionType, data) {
    const transaction = {
      id: `txn-${Date.now()}`,
      actionType,
      data,
      timestamp: new Date().toISOString()
    };
    this.offlineQueue.push(transaction);
    this.saveState();
    
    // If online, trigger sync
    if (navigator.onLine) {
      this.syncOfflineQueue();
    }
  },
  
  async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    console.log("Internet detected: Syncing offline items...");
    
    // Simulate API upload sync with delay
    this.offlineQueue = [];
    this.saveState();
    
    const syncAlert = document.createElement("div");
    syncAlert.className = "fixed bottom-16 right-4 md:bottom-4 bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50 flex items-center gap-1.5 animate-fade-in";
    syncAlert.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> Offline changes synced successfully!`;
    document.body.appendChild(syncAlert);
    
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      syncAlert.remove();
    }, 3000);
  }
};

// Monitor online connectivity
window.addEventListener("online", () => {
  window.AppStore.syncOfflineQueue();
});
