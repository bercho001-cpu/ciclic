# 📖 Application Use Cases Guide — Ciclic

This document describes the design, data flow, input/output DTOs, and test specifications for the application layer of **Ciclic** (Phase 5). This serves as the single source of truth for the Next.js 15 UI and API routes (Phase 6).

---

## 1. Directory Structure

All use cases are located in `src/application/use-cases/`, with Zod DTO schemas located in `src/application/dtos/`.

---

## 2. Use Case Specifications

### 2.1. `AddModuleWithTasksUseCase`
Orchestrates the addition of a WBS Module and its estimated PERT tasks to an existing project.

* **Input DTO:** `AddModuleWithTasksInputDto` (Zod schema in `src/application/dtos/project.dto.ts`)
* **Output DTO:** `ProjectOutputDto`
* **Flow:**
  1. Retrieve `Project` via `IProjectRepository.findById(projectId)`.
  2. If project does not exist, throw an Error.
  3. Map the task inputs list to Domain Value Objects (`EstimationHours` and `Money` for the rate).
  4. Invoke `project.addModule({ name, description, tasks })`.
  5. Persist the updated aggregate using `IProjectRepository.save(project)`.
  6. Return `ProjectOutputDto`.

---

### 2.2. `CloneModuleTemplateToProjectUseCase`
Clones a standard reusable module template to an active project, adapting task hourly rates.

* **Input DTO:** `CloneModuleTemplateInputDto` (Zod schema in `src/application/dtos/module-template.dto.ts`)
* **Output DTO:** `ProjectOutputDto`
* **Flow:**
  1. Retrieve `ModuleTemplate` via `IModuleTemplateRepository.findById(templateId)`.
  2. Retrieve `Project` via `IProjectRepository.findById(projectId)`.
  3. If template or project do not exist, throw an Error.
  4. Invoke `template.cloneToProject(project, defaultHourlyRate)`.
  5. Persist the updated aggregate using `IProjectRepository.save(project)`.
  6. Return `ProjectOutputDto`.

---

### 2.3. `CalculateProjectBudgetUseCase`
Orchestrates the cascaded financial calculation on a project, shifting its status to `ESTIMATED`.

* **Input DTO:** `CalculateProjectBudgetInputDto` (Zod schema in `src/application/dtos/project.dto.ts`)
* **Output DTO:** `BudgetSummaryOutputDto`
* **Flow:**
  1. Retrieve `Project` via `IProjectRepository.findById(projectId)`.
  2. Update project margins, contingency, and tax percentages using Value Objects (`Percentage`).
  3. Delegate the budget calculation to `FinancialCalculationService.calculate({ laborCost, externalCosts, contingency, margin, tax })`.
  4. Shift the project's status to `ESTIMATED` (if it was `DRAFT`).
  5. Persist the updated aggregate using `IProjectRepository.save(project)`.
  6. Return `BudgetSummaryOutputDto`.

---

### 2.4. `GeneratePaymentPlanUseCase`
Franks a complete Payment Plan based on the estimated project budget, distributing any Penny Allocation residual.

* **Input DTO:** `GeneratePaymentPlanInputDto` (Zod schema in `src/application/dtos/payment-plan.dto.ts`)
* **Output DTO:** `PaymentPlanOutputDto`
* **Flow:**
  1. Retrieve `Project` via `IProjectRepository.findById(projectId)`.
  2. Verify that the project status is at least `ESTIMATED`.
  3. Instantiate a new `PaymentPlan` for the project.
  4. Generate installments based on `splitType` (EVEN, 30_40_30, or CUSTOM), resolving the Penny Allocation rounding.
  5. Persist the payment plan using `IPaymentPlanRepository.save(paymentPlan)`.
  6. Return `PaymentPlanOutputDto`.

---

### 2.5. `RecordPaymentReceiptUseCase`
Registers a concrete partial or full payment receipt on an installment, updating payment plan balances.

* **Input DTO:** `RecordPaymentInputDto` (Zod schema in `src/application/dtos/payment-plan.dto.ts`)
* **Output DTO:** `PaymentPlanOutputDto`
* **Flow:**
  1. Retrieve `PaymentPlan` via `IPaymentPlanRepository.findById(paymentPlanId)`.
  2. If the plan does not exist, throw an Error.
  3. Invoke `paymentPlan.recordPayment(installmentId, amount, date, method, receiptReference)`.
  4. Persist the updated payment plan aggregate using `IPaymentPlanRepository.save(paymentPlan)`.
  5. Return `PaymentPlanOutputDto`.

---

### 2.6. `GetFinancialHealthSummaryUseCase`
Consolidates total invoiced, collected, and outstanding pending amounts on a project.

* **Input DTO:** `{ projectId: string }`
* **Output DTO:** `FinancialHealthOutputDto` (Zod schema in `src/application/dtos/payment-plan.dto.ts`)
* **Flow:**
  1. Retrieve `PaymentPlan` via `IPaymentPlanRepository.findByProjectId(projectId)`.
  2. If no plan exists, return empty or zero financial values.
  3. Fetch totals from the payment plan: `plan.totalAmount`, `plan.getCollectedAmount()`, and `plan.getPendingAmount()`.
  4. Return `FinancialHealthOutputDto`.

---

### 2.7. `GetPublicProposalUseCase`
Retrieves a public quotation safely using its unique, secure share token, without revealing internal margins.

* **Input DTO:** `{ shareToken: string }`
* **Output DTO:** `{ project: ProjectOutputDto, budget: BudgetSummaryOutputDto, paymentPlan?: PaymentPlanOutputDto }`
* **Flow:**
  1. Retrieve `Project` via `IProjectRepository.findByShareToken(shareToken)`.
  2. Verify that the project exists and is marked as public. If not, throw an Error.
  3. Calculate the budget to generate the public output.
  4. Retrieve `PaymentPlan` via `IPaymentPlanRepository.findByProjectId(project.id)` if it exists.
  5. Return the public output.

---

### 2.8. `UpdateUserProfileUseCase`
Initializes or updates the profile, tax details, defaults, and branding information of a freelancer or software studio.

* **Input DTO:** `UpdateUserProfileInputDto` (Zod schema in `src/application/dtos/user-profile.dto.ts`)
* **Output DTO:** `UserProfileOutputDto`
* **Flow:**
  1. Retrieve `UserProfile` via `IUserProfileRepository.findById(userId)`.
  2. If it does not exist, initialize a new `UserProfile`.
  3. Update profile fields (displayName, taxId, contactEmail, etc.) via domain mutators.
  4. Persist using `IUserProfileRepository.save(profile)`.
  5. Return `UserProfileOutputDto`.
