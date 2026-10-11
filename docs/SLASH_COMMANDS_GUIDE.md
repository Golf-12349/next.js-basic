# 🚀 ຄູ່ມືການໃຊ້ງານ Antigravity Slash Commands (ສະບັບສົມບູນ)

> ເອກະສານແນະນຳວິທີການໃຊ້ງານ Slash Commands ທັງໝົດ 15+ ຄຳສັ່ງ ພ້ອມຕົວຢ່າງການປະຍຸກໃຊ້ຮ່ວມກັບໜ້າວຽກອື່ນໆ (2-3 ຕົວຢ່າງຕໍ່ແຕ່ລະຄຳສັ່ງ)

---

## 📌 ຫຼັກການພື້ນຖານ: ການໃຊ້ Slash Command ຫຼາຍຢ່າງໃນ Prompt ດຽວ
* **ກົດຫຼັກ**: ໃນ 1 Prompt ສາມາດໃສ່ Slash Command ທີ່ຂຶ້ນຕົ້ນດ້ວຍ `/` ໄດ້ **ພຽງ 1 ຄຳສັ່ງເທົ່ານັ້ນ** ເພາະລະບົບຈະໃຊ້ຄຳສັ່ງທຳອິດເພື່ອກຳນົດ **Primary Mode** ຂອງ AI.
* **ເທັກນິກການໃຊ້ຮ່ວມກັນ**: ໃຫ້ເລືອກ **1 ຄຳສັ່ງຫຼັກ** ແລ້ວ **ພິມລະບຸໜ້າວຽກ ຫຼື ເຄື່ອງມືອື່ນໆ ຕໍ່ທ້າຍເປັນຂໍ້ຄວາມ** AI ຈະດຶງຄວາມສາມາດທັງໝົດມາເຮັດວຽກຮ່ວມກັນໂດຍອັດຕະໂນມັດ!

---

## 📂 ໝວດທີ 1: Core Agent Workflows (ຄຳສັ່ງຄວບຄຸມໂໝດການເຮັດວຽກຂອງ AI)

---

### 1. `/plan`
* **ຄວາມໝາຍ**: ວາງແຜນລະອຽດເປັນຂັ້ນເປັນຕອນ (Step-by-step) ກ່ອນເລີ່ມລົງມືຂຽນໂຄ້ດ
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອເປັນວຽກໃຫຍ່, ວຽກ refactor ທີ່ກະທົບຫຼາຍໄຟລ໌ ຫຼື ຢາກກວດສອບ logic ກ່ອນລົງມື
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/plan` + Browser Search + Database Migration**:
     ```text
     /plan ອອກແບບລະບົບ Realtime Notification ໂດຍໃຊ້ Browser ຄົ້ນຫາ Best Practices ຂອງ Supabase Realtime + Next.js 15 ແລະ ວາງແຜນ Database Schema
     ```
  2. **`/plan` + UI Redesign + Performance**:
     ```text
     /plan ວາງແຜນ Refactor ໜ້າ Documents Table ໃຫ້ຮອງຮັບ Virtual Scrolling ແລະ ປັບແຕ່ງ Tailwind CSS ໃຫ້ເປັນ Modern Clean UI
     ```
  3. **`/plan` + Security + Unit Testing**:
     ```text
     /plan ວາງແຜນປັບປຸງລະບົບ Role-based Access Control (RBAC) ພ້ອມກຳນົດ Test Cases ສຳລັບ Jest/Playwright
     ```

---

### 2. `/goal`
* **ความໝາຍ**: ສັ່ງເຮັດວຽກຍາວຕໍ່ເນື່ອງຈົນສຳເລັດ 100% ໂດຍບໍ່ຢຸດກາງຄັນ (Autonomous Long-running Task)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອມີວຽກທີ່ຊັດເຈນແຕ່ຕ້ອງໃຊ້ເວລາຫຼາຍ (ເຊັ່ນ: ຂຽນ Test ທຸກໄຟລ໌, ແກ້ Lint error ທົ່ວໂປຣເຈັກ)
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/goal` + Browser Testing + Fix Errors**:
     ```text
     /goal ແກ້ໄຂ Form Upload ເອກະສານໃຫ້ຮອງຮັບໄຟລ໌ໃຫຍ່ 50MB ພ້ອມເປີດ Browser ທົດສອບການອັບໂຫຼດຈິງ ແລະ ບໍ່ຢຸດຈົນກວ່າຈະຜ່ານທຸກ Cases
     ```
  2. **`/goal` + Refactor + Git Push**:
     ```text
     /goal ກວດສອບແລະແກ້ໄຂ TypeScript & Lint errors ທຸກໄຟລ໌ໃນ folder app/ ພ້ອມ Run build ໃຫ້ຜ່ານ 100% ແລ້ວ Commit & Push ຂຶ້ນ main
     ```
  3. **`/goal` + Database Seeding + Verify API**:
     ```text
     /goal ສ້າງ Mock Data ເອກະສານ 100 ລາຍການພ້ອມປະຫວັດການໂອນຍ້າຍໃນ Supabase ແລະ ທົດສອບ Query ຜ່ານ API ໃຫ້ຄົບຖ້ວນ
     ```

---

### 3. `/boost`
* **ຄວາມໝາຍ**: ເປີດໂໝດຄິດວິເຄາະຂັ້ນສູງ (Deep Reasoning & Multi-perspective Agent)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອເຈອບັກຍາກໆທີ່ແກ້ບໍ່ຕົກ, ບັນຫາສະຖາປັດຕະຍະກຳ (Architecture) ຫຼື ບັນຫາ Performance ທີ່ສັບສົນ
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/boost` + Root Cause Analysis + Fix Plan**:
     ```text
     /boost ວິເຄາະສາເຫດທີ່ເກີດ Memory Leak ເວລາເປີດໜ້າ Realtime Dashboard ດົນໆ ພ້ອມສະເໜີວິທີແກ້ໄຂແບບຍືນຍົງ
     ```
  2. **`/boost` + Architecture Design + Security**:
     ```text
     /boost ວິເຄາະແລະປຽບທຽບການເກັບເອກະສານລະຫວ່າງ MinIO (S3) ກັບ Supabase Storage ໃນດ້ານ Security, Cost ແລະ Latency
     ```
  3. **`/boost` + Code Review + Refactoring**:
     ```text
     /boost ກວດສອບໂຄງສ້າງລະຫັດໃນ documentService.ts ຢ່າງລະອຽດ ເພື່ອຊອກຫາ Anti-patterns ແລະ ແນະນຳການແຍກ Layer ໃຫ້ຖືກຕາມ Clean Architecture
     ```

---

### 4. `/grill-me`
* **ຄວາມໝາຍ**: ໃຫ້ AI ສວມບົດບາດເປັນຜູ້ສຳພາດ/ຕັ້ງຄຳຖາມເຈາະເລິກ ເພື່ອຊ່ວຍເຮົາຕັດສິນໃຈເລືອກ Design
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຍັງບໍ່ແນ່ໃຈໃນ Requirement ຫຼື ຕ້ອງການຄິດໃຫ້ຮອບດ້ານກ່ອນລົງມື
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/grill-me` + Data Model + Workflow**:
     ```text
     /grill-me ສັມພາດຂ້ອຍກ່ຽວກັບ Workflow ການອະນຸມັດເອກະສານຂ້າມພະແນກ (Approval Hierarchy) ເພື່ອໃຫ້ໄດ້ Database Schema ທີ່ສົມບູນ
     ```
  2. **`/grill-me` + Tech Stack Selection**:
     ```text
     /grill-me ຖາມຄຳຖາມເພື່ອຊ່ວຍຂ້ອຍຕັດສິນໃຈວ່າຄວນໃຊ້ Tailwind CSS v4 ຫຼືຍັງຄົງໃຊ້ v3 ໃນ Production
     ```
  3. **`/grill-me` + User Experience (UX)**:
     ```text
     /grill-me ສຳພາດຂ້ອຍກ່ຽວກັບ Flow ການຄົ້ນຫາເອກະສານ (Advanced Search vs Simple Search) ເພື່ອອອກແບບ UI ໃຫ້ໃຊ້ງານງ່າຍທີ່ສຸດ
     ```

---

### 5. `/browser`
* **ຄວາມໝາຍ**: ເປີດໃຊ້ Web Browser Agent ເພື່ອຄົ້ນຫາຂໍ້ມູນໃນເວັບ, ອ່ານ Documentation ລ່າສຸດ ຫຼື ທົດສອບ Web App
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຕ້ອງການຂໍ້ມູນໃໝ່ລ່າສຸດທີ່ບໍ່ມີໃນ Training Data ຫຼື ຕ້ອງການໃຫ້ AI ກວດ UI ຈິງ
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/browser` + Docs Lookup + Implementation**:
     ```text
     /browser ຄົ້ນຫາ Documentation ຂອງ Next.js 15 Server Actions ລ່າສຸດ ແລ້ວເອົາ Pattern ມານຳໃຊ້ໃນ authService.ts
     ```
  2. **`/browser` + UI Testing + Screenshot**:
     ```text
     /browser ເປີດ localhost:3000/documents ກວດສອບການສະແດງຜົນໃນຈໍມືຖື (Responsive) ແລະ ລາຍງານຈຸດທີ່ລົ້ນຂອບຈໍ
     ```
  3. **`/browser` + Research + Comparison**:
     ```text
     /browser ຄົ້ນຫາແລະປຽບທຽບ Library ສຳລັບ Export PDF ໃນ React (react-pdf vs jspdf) ພ້ອມຕົວຢ່າງ Code
     ```

---

### 6. `/btw`
* **ຄວາມໝາຍ**: ຖາມຄຳຖາມສັ້ນໆດ່ວນໆ ໂດຍບໍ່ລົບກວນ ຫຼື ບໍ່ປ່ຽນບໍລິບົດຫຼັກຂອງການສົນທະນາ (By The Way)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຢາກຖາມຄວາມໝາຍ, syntax ຫຼື command ສັ້ນໆ ໃນຂະນະທີ່ກຳລັງເຮັດວຽກໃຫຍ່ຢູ່
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/btw` + Syntax / Command**:
     ```text
     /btw ຄຳສັ່ງ git ສຳລັບ revert commit ລ່າສຸດແຕ່ເກັບ file changes ໄວ້ແມ່ນຫຍັງ?
     ```
  2. **`/btw` + Concept Explanation**:
     ```text
     /btw useMemo ກັບ useCallback ໃນ React ຕ່າງກັນແນວໃດ ຂໍຕົວຢ່າງ 2 ບັນທັດ
     ```
  3. **`/btw` + Package Recommendation**:
     ```text
     /btw library ໃດດີທີ່ສຸດສຳລັບຈັດການ Date formatting ໃນພາສາລາວ?
     ```

---

### 7. `/schedule`
* **ຄວາມໝາຍ**: ຕັ້ງເວລາເຮັດວຽກອັດຕະໂນມັດ ຫຼື ຕັ້ງໂມງເຕືອນ (One-time Timer ຫຼື Recurring Cron Job)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຢາກໃຫ້ AI ກວດສອບບາງຢ່າງເປັນໄລຍະໆ (ເຊັ່ນ: ກວດ build, ກວດ status server)
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/schedule` + Health Check + Alert**:
     ```text
     /schedule ທຸກໆ 15 ນາທີ ໃຫ້ curl ກວດສອບ endpoint /api/health ຖ້າ error ໃຫ້ແຈ້ງເຕືອນຂ້ອຍ
     ```
  2. **`/schedule` + Background Cleanup**:
     ```text
     /schedule ຕັ້ງ Timer ອີກ 30 ນາທີ ໃຫ້ມາເຕືອນຂ້ອຍ Run Database Backup ແລະ ກວດສອບ Trash Table
     ```
  3. **`/schedule` + Deployment Polling**:
     ```text
     /schedule ກວດສອບສະຖານະການ Deploy ເທິງ Vercel/Render ທຸກໆ 2 ນາທີ ຈົນກວ່າຈະ Successful
     ```

---

### 8. `/learn`
* **ຄວາມໝาย**: ສັ່ງໃຫ້ AI ບັນທຶກບົດຮຽນ, ກົດລະບຽບ ຫຼື ເທັກນິກໃໝ່ທີ່ເຮົາສອນ ໄວ້ໃນລະບົບຄວາມຈຳຖາວອນ (Memory/Rule)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອແກ້ໄຂ setup ສຳເລັດ ຫຼື ເມື່ອ AI ເຮັດຜິດແລ້ວເຮົາແນະນຳວິທີທີ່ຖືກຕ້ອງ
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/learn` + Coding Conventions + Language**:
     ```text
     /learn ຈື່ໄວ້ວ່າ UI ທັງໝົດຕ້ອງໃຊ້ພາສາລາວເປັນຫຼັກ, Font ຕ້ອງຮອງຮັບNoto Sans Lao, ແລະ ຫ້າມໃຊ້ Glassmorphism
     ```
  2. **`/learn` + Architecture Pattern**:
     ```text
     /learn ຈື່ໄວ້ວ່າ API Calls ທັງໝົດຕ້ອງຜ່ານ apiClient (Axios) ທີ່ຕັ້ງຄ່າ Interceptor ໄວ້ໃນ config/axiosClient.ts ເທົ່ານັ້ນ
     ```
  3. **`/learn` + Git Workflow**:
     ```text
     /learn ຈື່ໄວ້ວ່າທຸກໆຄັ້ງທີ່ Build ຜ່ານ ໃຫ້ສ້າງ commit message ຕາມຮູບແບບ Conventional Commits (feat, fix, refactor) ສະເໝີ
     ```

---

### 9. `/teamwork-preview`
* **ຄວາມໝາຍ**: ຈຳລອງທີມ AI Autonomous Agents ຫຼາຍຕົວແຍກກັນເຮັດວຽກຄົນລະພາກສ່ວນພ້ອມກັນ
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອມີໂປຣເຈັກໃຫຍ່ທີ່ຕ້ອງເຮັດທັງ Frontend, Backend, Database ແລະ Testing ພ້ອມໆກັນ
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/teamwork-preview` + Fullstack Feature**:
     ```text
     /teamwork-preview ແຍກທີມເຮັດລະບົບ Export PDF: Agent 1 ເຮັດ Backend API, Agent 2 ເຮັດ PDF Layout, Agent 3 ເຮັດ Frontend UI
     ```
  2. **`/teamwork-preview` + Refactoring + Testing**:
     ```text
     /teamwork-preview ແຍກທີມ: Agent A Refactor ລະບົບໂອນຍ້າຍເອກະສານ, Agent B ຂຽນ Unit Test, Agent C ກວດສອບ Type Safety
     ```
  3. **`/teamwork-preview` + Security Audit & Fix**:
     ```text
     /teamwork-preview ໃຫ້ Agent 1 ກວດສອບ OWASP Vulnerabilities, Agent 2 ແກ້ໄຂໂຄ້ດທີ່ມີຊ່ອງໂຫວ່, Agent 3 ຂຽນ Security Report
     ```

---

## 🧩 ໝວດທີ 2: Built-in Skills & System Tools (ຄຳສັ່ງທັກສະພິເສດຂອງລະບົບ)

---

### 10. `/generative_ui`
* **ຄວາມໝາຍ**: ສັ່ງໃຫ້ສ້າງ Rich Interactive HTML Widgets, Data Visualizations ຫຼື Dashboard ແບບໂต้ຕອບໄດ້
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຕ້ອງການເບິ່ງຜົນລັບແບບເຫັນພາບ (Charts, Workflow Diagrams, Interactive Mockups)
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/generative_ui` + Document Lifecycle Diagram**:
     ```text
     /generative_ui ສ້າງ Interactive Flowchart ສະແດງຂັ້ນຕອນການເດີນທາງຂອງເອກະສານ (Draft -> Approved -> Storage -> Expired) ທີ່ກົດເບິ່ງລາຍລະອຽດແຕ່ລະຂັ້ນຕອນໄດ້
     ```
  2. **`/generative_ui` + Storage Hierarchy Explorer**:
     ```text
     /generative_ui ສ້າງ Widget ແບບ Tree View ຈຳລອງລຳດັບຊັ້ນ: ຄັງເອກະສານ -> ຕູ້ -> ຊັ້ນວາງ -> ແຟ້ມ ແບບ Expand/Collapse ໄດ້
     ```
  3. **`/generative_ui` + Analytics Dashboard**:
     ```text
     /generative_ui ສ້າງ Interactive Bar/Pie Chart ສະແດງຈຳນວນເອກະສານແຍກຕາມພະແນກ ແລະ ສະຖານະການອະນຸມັດ
     ```

---

### 11. `/automation`
* **ຄວາມໝາຍ**: ຜູ້ຊ່ວຍອອກແບບ ແລະ ສ້າງລະບົບ Background Automation ແບບ Interactive Guide
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຕ້ອງການສ້າງ Cron job, Auto-archive ຫຼື Auto-report ທີ່ເຮັດວຽກເອງໃນ Background
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/automation` + Document Expiry Check**:
     ```text
     /automation ສ້າງ Background Script ກວດສອບເອກະສານທີ່ໝົດອາຍຸທຸກທ່ຽງຄືນ ແລ້ວປ່ຽນສະຖານະເປັນ expired ພ້ອມແຈ້ງເຕືອນ Admin
     ```
  2. **`/automation` + Daily Report Generation**:
     ```text
     /automation ສ້າງລະບົບສັງລວມສະຖິຕິເອກະສານປະຈຳວັນ ທຸກໆ 17:00 ໂມງ ແລ້ວບັນທຶກລົງໃນ reports table
     ```
  3. **`/automation` + Auto Backup**:
     ```text
     /automation ແນະນຳຂັ້ນຕອນການຕັ້ງຄ່າ Auto Export Supabase Database ເປັນໄຟລ໌ SQL ທຸກໆວັນອາທິດ
     ```

---

### 12. `/plugin`
* **ຄວາມໝາຍ**: ຄຸ້ມຄອງ, ຕິດຕັ້ງ, ເປີດ/ປິດ ຫຼື ສ້າງ Custom Plugin (ມັດລວມ Skills, Agents, MCP servers, Rules)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຕ້ອງການຂະຫຍາຍຄວາມສາມາດຂອງ Antigravity ຫຼື ແບ່ງປັນ Tools ໃຫ້ທີມງານ
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/plugin` + Create New Extension**:
     ```text
     /plugin ສ້າງ Plugin ໃໝ່ຊື່ dms-tools ທີ່ມັດລວມ Subagent ສຳລັບກວດສອບເອກະສານ ແລະ Custom Rules ຂອງ EDL
     ```
  2. **`/plugin` + Audit & Status**:
     ```text
     /plugin ກວດສອບລາຍຊື່ Plugin ທັງໝົດທີ່ຕິດຕັ້ງຢູ່ໃນປັດຈຸບັນ ແລະ ແນະນຳອັນທີ່ສາມາດ Update ໄດ້
     ```
  3. **`/plugin` + MCP Integration**:
     ```text
     /plugin ຕິດຕັ້ງ Plugin ທີ່ເຊື່ອມຕໍ່ກັບ Postgres MCP Server ເພື່ອໃຫ້ Agent query ຖານຂໍ້ມູນໄດ້ໂດຍກົງ
     ```

---

### 13. `/agy-customizations`
* **ความໝາຍ**: ຄູ່ມື ແລະ ເອກະສານອ້າງອີງກ່ຽວກັບລະບົບ Antigravity Customization (Priority, Rules, MCP, Hooks)
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຢາກເຂົ້າໃຈວິທີຂຽນ Custom Rules, ການຕັ້ງຄ່າ .agents/ folder ຫຼື ການຈັດລຳດັບ Priority
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/agy-customizations` + Workspace Rules**:
     ```text
     /agy-customizations ອະທິບາຍວິທີສ້າງ .agents/rules/ ປະຈຳ Project ນີ້ ເພື່ອກຳນົດໃຫ້ AI ໃຊ້ Tailwind CSS v4 ສະເໝີ
     ```
  2. **`/agy-customizations` + Git Hooks**:
     ```text
     /agy-customizations ແນະນຳວິທີຂຽນ Pre-commit Hook ໃຫ້ Antigravity ກວດສອບ TypeScript ກ່ອນ Commit
     ```
  3. **`/agy-customizations` + MCP Configuration**:
     ```text
     /agy-customizations ອະທິບາຍວິທີເຊື່ອມຕໍ່ Custom MCP Server ເຂົ້າກັບ Antigravity IDE
     ```

---

### 14. `/antigravity-guide`
* **ຄວາມໝາຍ**: ຄູ່ມືພາບລວມລະບົບ, Sitemap, Keyboard Shortcuts, CLI ແລະ IDE Features ທັງໝົດ
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອມີຄຳຖາມທົ່ວໄປກ່ຽວກັບການໃຊ້ Antigravity, ຄີລັດ (Shortcuts) ຫຼື CLI commands
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/antigravity-guide` + Shortcuts & Navigation**:
     ```text
     /antigravity-guide ສະຫຼຸບ Keyboard Shortcuts ທີ່ໃຊ້ເລື້ອຍໆໃນ Antigravity IDE (ເຊັ່ນ: Inline Edit, Agent Panel)
     ```
  2. **`/antigravity-guide` + CLI vs IDE**:
     ```text
     /antigravity-guide ອະທິບາຍຄວາມແຕກຕ່າງລະຫວ່າງການໃຊ້ງານຜ່ານ CLI (agy) ແລະ ການໃຊ້ງານຜ່ານ Antigravity IDE
     ```
  3. **`/antigravity-guide` + Troubleshooting**:
     ```text
     /antigravity-guide ຄົ້ນຫາວິທີແກ້ໄຂບັນຫາເມື່ອ Agent ບໍ່ສາມາດ Execute PowerShell Commands ໄດ້
     ```

---

### 15. `/migrate-workflows`
* **ຄວາມໝາຍ**: ລະບົບ Scan ແລະ ຍ້າຍ Workflow ຮູບແບບເກົ່າ (Legacy workflows) ມາເປັນ Modern Skills (.md) ໂດຍອັດຕະໂນມັດ
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອມີໂປຣເຈັກເກົ່າທີ່ເຄີຍຂຽນ Workflow ໄວ້ ແລ້ວຕ້ອງການອັບເກຣດໃຫ້ຮອງຮັບ Antigravity 2.0
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/migrate-workflows` + Global Configuration**:
     ```text
     /migrate-workflows ກວດສອບ Workflow ທັງໝົດໃນ Global config (~/.gemini/antigravity/) ແລະ ແປງເປັນ Skills ໃໝ່
     ```
  2. **`/migrate-workflows` + Workspace Migration**:
     ```text
     /migrate-workflows ສະແກນ folder .agents/ ໃນ workspace ນີ້ ແລ້ວຍ້າຍ Workflow ໃຫ້ເປັນ SKILL.md ທີ່ຖືກຕ້ອງຕາມມາດຕະຖານ
     ```
  3. **`/migrate-workflows` + Backup & Verification**:
     ```text
     /migrate-workflows ຊ່ວຍ Backup ໄຟລ໌ Workflow ເກົ່າໄວ້ກ່ອນ ແລ້ວທົດສອບວ່າ Skill ທີ່ແປງໃໝ່ສາມາດເອີ້ນໃຊ້ງານໄດ້ແທ້
     ```

---

### 16. *(ພິເສດ)* `/ui-plugin-navigation`
* **ຄວາມໝາຍ**: ຄົ້ນຫາ ແລະ ເປີດ/ປິດແຖບ UI Plugin Panels ທີ່ກ່ຽວຂ້ອງໃນ Side Pane ດ້ວຍ 1-Click
* **ເມື່ອໃດທີ່ຄວນໃຊ້**: ເມື່ອຕ້ອງການເປີດແຜງຄວບຄຸມ Plugin ຂ້າງໆໜ້າຕ່າງ Code
* **ຕົວຢ່າງການໃຊ້ງານແບບປະສົມປະສານ (Combined Examples)**:
  1. **`/ui-plugin-navigation` + Open Terminal/Logs Panel**:
     ```text
     /ui-plugin-navigation ສະແດງປຸ່ມ Shortcut ເພື່ອເປີດແຜງ Background Tasks ແລະ Process Monitor
     ```
  2. **`/ui-plugin-navigation` + Database Explorer**:
     ```text
     /ui-plugin-navigation ເປີດແຜງ Side Pane ສຳລັບ Database Viewer ຂອງ Supabase
     ```

---

## 🏆 ສະຫຼຸບ Cheat Sheet: ຄວນເລືອກໃຊ້ອັນໃດໃນສະຖານະການຕ່າງໆ?

| ສະຖານະການ | ຄຳສັ່ງທີ່ແນະນຳ |
| :--- | :--- |
| **ເລີ່ມຕົ້ນຂຽນ Feature ໃໝ່ / ວຽກໃຫຍ່** | `/plan` |
| **ຍັງບໍ່ແນ່ໃຈ Logic ຢາກໃຫ້ AI ຊ່ວຍຖາມເຈາະເລິກ** | `/grill-me` |
| **ເຈອບັກຍາກໆ / Performance Leak / ອອກແບບລະບົບຍາກ** | `/boost` |
| **ວຽກແກ້ໄຂໂຄ້ດຍາວໆ, ຂຽນ Test ຫຼາຍໄຟລ໌, ປ່ອຍໃຫ້ເຮັດຂ້າມຄືນ** | `/goal` |
| **ຄົ້ນຫາ Doc ລ່າສຸດ, ທົດສອບໜ້າເວັບ Responsive** | `/browser` |
| **ຖາມຄຳຖາມດ່ວນ ບໍ່ຢາກຂັດຈັງຫວະວຽກຫຼັກ** | `/btw` |
| **ຢາກໃຫ້ AI ຈື່ກົດລະບຽບ ຫຼື ເທັກນິກໃໝ່ໄວ້ຕະຫຼອດໄປ** | `/learn` |
| **ຢາກເບິ່ງ Flowchart ຫຼື Mockup UI ແບບງາມໆໃນແຊັດ** | `/generative_ui` |
| **ຕັ້ງເວລາ Schedule / Cron Job ເຮັດວຽກອັດຕະໂນມັດ** | `/schedule` |
