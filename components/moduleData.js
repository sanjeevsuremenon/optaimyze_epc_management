import {
  faBoxes,
  faProjectDiagram,
  faUsers,
  faShoppingCart,
  faCalendarAlt,
  faHeadset,
  faTag,
  faList,
  faUser,
  faChartLine,
  faGavel,
  faPlus,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

export const moduleDashboards = {
  projects: {
    key: "projects",
    label: "Projects",
    href: "/projectsdashboard",
    description: "Manage project planning, schedules and tracking.",
    icon: faProjectDiagram,
    uploadFields: [
      "project-wbs",
      "project-name",
      "project-incharge",
      "created-date",
      "changed-date",
      "start-date",
      "finished-date"
    ],
    sublinks: [
      { href: "/projects1", label: "Projects" },
      { href: "/projectdetails", label: "Project Details" },
      { href: "/openprojects", label: "Open Projects - Open PO's" },
      { href: "/projects/networks", label: "Networks" },
      { href: "/projects/wbs", label: "WBS Elements" },
      { href: "/tracking", label: "Tracking" },
      { href: "/lessons-learnt", label: "Lessons Learnt" },
      { href: "/longleadpackages", label: "Long Lead Material Packages" },
    ],
  },
  materials: {
    key: "materials",
    label: "Materials",
    href: "/materialsdashboard",
    description: "Track materials, documentation, and standardization.",
    icon: faBoxes,
    uploadFields: [
      "material-code", "material-industry", "material-group", "unit-measure", 
      "old-material-number", "material-description", "mat-description2", "created-by", "updated-by"
    ],
    sublinks: [
      { href: "/materials", label: "Materials" },
      { href: "/materials/materialgroups", label: "Material Groups List" },
      { href: "/materials/mattypes", label: "Material Types" },
      { href: "/materialdocuments", label: "Material Docs" },
      { href: "/material-groups", label: "Material Groups" },
      { href: "/material-standardization", label: "Standardize Materials" },
    ],
  },
  purchaseorders: {
    key: "purchaseorders",
    label: "Purchase Orders",
    href: "/purchaseordersdashboard",
    description: "Manage purchase order lifecycle, alerts and feedback.",
    icon: faShoppingCart,
    uploadFields: [
      "po-number", "po-line-item", "po-date", "vendorcode", "vendorname", 
      "material.matcode", "material.matdescription", "material.matgroup", "plant-code", 
      "po-quantity", "po-unit-of-measure", "po-unit-price", "currency", 
      "po-value-sar", "pending-qty", "pending-val-sar", "pending-inv-qty", "pending-inv-val", 
      "delivery-date", "account.wbs", "account.network"
    ],
    sublinks: [
      { href: "/openpurchaseorders1", label: "Open PO" },
      { href: "/purchaseordersearch", label: "PO Complete Details" },
      { href: "/po-alert-report", label: "PO Alerts" },
      { href: "/purchases-report", label: "Comprehensive Purchases Report" },
    ],
  },
  vendors: {
    key: "vendors",
    label: "Vendors",
    href: "/vendorsdashboard",
    description: "Manage vendors, evaluations, and supplier performance.",
    icon: faUsers,
    uploadFields: [
      "vendor-code", "vendor-name", "address.countrycode", "address.city", 
      "address.street", "address.district", "address.pobox", "address.zipcode", 
      "created_by", "contact.telelphone1", "contact.telephone2", "contact.fax", "vat-number"
    ],
    sublinks: [
      { href: "/vendors1", label: "Vendors" },
      { href: "/vendor-dashboard", label: "Vendor Dashboard" },
      { href: "/nonsapvendors", label: "Non SAP Vendors" },
      { href: "/vendor-feedback", label: "Vendor Feedback" },
      { href: "/vendorevaluation/webformat", label: "Vendor Evaluation" },
    ],
  },
  projectdocumentss: {
    key: "projectdocumentss",
    label: "Project Documents",
    href: "/projectdocumentsdashboard",
    description: "Capture Project Document actions, follow-up items, and reviews.",
    icon: faCalendarAlt,
    sublinks: [
      { href: "/projectdocuments", label: "Project Documents" },
    ],
  },
  assets: {
    key: "assets",
    label: "Asset Management",
    href: "/assetdashboard",
    description: "Track fixed assets and equipment custody, and calibrations.",
    icon: faHeadset,
    sublinks: [
      { href: "/assets/dashboard", label: "Assets Dashboard" },
      { href: "/assetmanagement/masters", label: "Asset Masters" },
      { href: "/assets/mme", label: "MME Equipment" },
      { href: "/assets/fixedassets", label: "Fixed Assets" },
      { href: "/assets/ppe-dashboard", label: "PPE Dashboard" },
      { href: "/assets/reports", label: "Reports" },
    ],
  },
  globalmasters: {
    key: "globalmasters",
    label: "Global Masters",
    href: "/globalmastersdashboard",
    description: "Manage global master data including employees, departments, and configurations.",
    icon: faGlobe,
    sublinks: [
      { href: "/global-masters", label: "Global Masters" },
      { href: "/data-load", label: "Data Load", adminOnly: true },
    ],
  },
  tracking: {
    key: "tracking",
    label: "Tracking",
    href: "/trackingdashboard",
    description: "Track PR, PO, Delivery and Post-Delivery forms and status.",
    icon: faChartLine,
    sublinks: [
      { href: "/tracking", label: "Tracking Home" },
      { href: "/tracking/forms/PRForm", label: "PR Form" },
      { href: "/tracking/forms/POForm", label: "PO Form" },
      { href: "/tracking/forms/DeliveryForm", label: "Delivery Form" },
      { href: "/tracking/forms/PostDeliveryForm", label: "Post Delivery Form" },
    ],
  },
  reports: {
    key: "reports",
    label: "Reports",
    href: "/reportsdashboard",
    description: "Generate and view project, purchase order, material, and vendor reports.",
    icon: faList,
    sublinks: [
      { href: "/purchases-report", label: "Purchases Report" },
      { href: "/vendor-reports/no-purchaseorders", label: "No PO Vendors" },
      { href: "/vendor-reports/with-po-no-docs", label: "With PO No Docs" },
      { href: "/vendor-reports/po-missing-docs", label: "PO Missing Docs" },
      { href: "/lessons-learnt", label: "Lessons Learnt" },
      { href: "/all-purchases-report", label: "All Purchases" },
      { href: "/import-purchases-report", label: "Import Purchases" },
      { href: "/domestic-purchases-report", label: "Domestic Purchases" },
    ],
  },
  networks: {
    key: "networks",
    label: "Networks",
    href: "/projects/networks",
    description: "Manage networks and map projects to their respective networks.",
    icon: faProjectDiagram,
    uploadFields: [
      "network-num",
      "project-wbs",
      "project-name",
      "created-date",
      "created-by"
    ],
    sublinks: [
      { href: "/projects/networks", label: "Networks List" },
    ]
  },
  wbs: {
    key: "wbs",
    label: "WBS Elements",
    href: "/projects/wbs",
    description: "Manage WBS Elements descriptions and structure.",
    icon: faBoxes,
    uploadFields: [
      "wbs-number",
      "wbs-description",
      "updated-at"
    ],
    sublinks: [
      { href: "/projects/wbs", label: "WBS List" },
    ]
  },
  materialgroups: {
    key: "materialgroups",
    label: "Material Groups",
    href: "/materials/materialgroups",
    description: "Manage material groups and categorize catalog items.",
    icon: faBoxes,
    uploadFields: [
      "name",
      "description",
      "isService"
    ],
    sublinks: [
      { href: "/materials/materialgroups", label: "Material Groups List" },
    ]
  },
  mattypes: {
    key: "mattypes",
    label: "Material Types",
    href: "/materials/mattypes",
    description: "Manage material types and link them to primary groups.",
    icon: faTag,
    uploadFields: [
      "materialtype",
      "materialcode",
      "mattypedescription",
      "matgroupprimary",
      "matgroupprimarydesc"
    ],
    sublinks: [
      { href: "/materials/mattypes", label: "Material Types List" },
    ]
  },
  stock: {
    key: "stock",
    label: "Stock Management",
    href: "/specialstock1",
    description: "Manage special stock and complete stock.",
    icon: faBoxes,
    sublinks: [
      { href: "/specialstock1", label: "Special Stock" },
      { href: "/completestock1", label: "Complete Stock" }
    ],
    uploadFields: {
      specialstock: [
        "material-code",
        "plant-code",
        "unit-of-measure",
        "stk-indicator",
        "sales-doc",
        "sales-doc-no",
        "wbs-element",
        "stock-qty",
        "stock-val",
        "stock-date"
      ],
      completestock: [
        "material-code",
        "plant-code",
        "unit-of-measure",
        "receipt-qty",
        "issue-qty",
        "current-stkqty",
        "receipt-val",
        "issue-val",
        "current-stkval",
        "stock-date"
      ]
    }
  },
};

export const moduleCards = [
  moduleDashboards.projects,
  moduleDashboards.materials,
  moduleDashboards.stock,
  moduleDashboards.purchaseorders,
  moduleDashboards.vendors,
  moduleDashboards.projectdocumentss,
  moduleDashboards.assets,
  moduleDashboards.globalmasters,
  moduleDashboards.tracking,
  moduleDashboards.reports,
  moduleDashboards.materialgroups,
  moduleDashboards.mattypes,
  {
    label: "Inventory Tags",
    href: "#",
    description: "Manage and track inventory tags.",
    icon: faTag,
    badge: "Coming Soon",
  },
  {
    label: "Material Classification",
    href: "#",
    description: "Organize and classify materials.",
    icon: faList,
    badge: "Coming Soon",
  },
  {
    label: "Vendor Registration",
    href: "#",
    description: "Onboard and register new vendors.",
    icon: faUser,
    badge: "Coming Soon",
  },
  {
    label: "Project Management",
    href: "#",
    description: "Advanced project planning and tracking.",
    icon: faChartLine,
    badge: "Coming Soon",
  },
  {
    label: "Scrap E-bid Marketplace",
    href: "#",
    description: "Marketplace for scrap and materials.",
    icon: faGavel,
    badge: "Coming Soon",
  },
  {
    label: "Future Module 1",
    href: "#",
    description: "Coming soon.",
    icon: faPlus,
  },
  {
    label: "Future Module 2",
    href: "#",
    description: "Coming soon.",
    icon: faPlus,
  },
  {
    label: "Future Module 3",
    href: "#",
    description: "Coming soon.",
    icon: faPlus,
  },
];
