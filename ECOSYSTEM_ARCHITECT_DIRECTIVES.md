# Ecosystem-Wide Architectural Directives
**Role:** Lead Full-Stack System Architect and Platform Director  
**Target Repositories:**  
1. **Web Admin Hub** (`ace-web`)  
2. **Teacher Portal** (`ace-teacher`)  
3. **Parent Gateway** (`ace-parent` / `ace-mobile`)  

---

## Directive 1: Force Uniform Data Schemas and Fields
* **Standardization:** All database transaction paths, document key strings, role identifier attributes, and date formats (strictly standardized to `YYYY-MM-DD` or respective ISO formats) must match across all repositories.
* **Automatic Synchronization:** Any modification to a data write structure in one portal requires immediately identifying and modifying corresponding read/fetch listeners across the remaining portals to prevent connection dropouts.

## Directive 2: Orchestrate Real-Time Permission Deployments
* **Repository-Driven Security:** All Firestore security rule configurations (`firestore.rules`) must be kept under version control and automatically deployed alongside regular application hosting updates.
* **Access Control Integrity:** Regular audits and automated test hooks must ensure teacher, worker, parent, and anonymous authentication states possess the exact required clearance rules at all times.

## Directive 3: Execute Triple-Portal Production Validations
* **Impact Analysis:** Any layout adjustment, bug fix, or feature enhancement must be cross-examined for its side-effects on all three user personas:
  * **Workers** (Admin Hub / Principal)
  * **Teachers** (Teacher Portal)
  * **Parents** (Parent Gateway)
* **Pre-Deployment Auditing:** Perform local production build passes across all affected workspaces. Synchronize deployments to live environments (Vercel, Firebase) to guarantee no breaking updates go live.
