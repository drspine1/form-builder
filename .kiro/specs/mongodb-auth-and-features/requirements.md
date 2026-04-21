# Requirements Document

## Introduction

This feature adds authentication, persistent MongoDB storage, a user dashboard, real form previews, multi-step form rendering, persistent submissions, and form publishing to the existing Next.js Form Builder application. The existing builder (undo/redo, drag-drop, auto-save, 16 field types) is preserved unchanged. All new server-side persistence uses MongoDB Atlas via Mongoose. Authentication is handled by NextAuth.js v4 with Email/Password credentials and Google OAuth.

## Glossary

- **App**: The Next.js 16 App Router application.
- **Builder**: The form-builder UI at `/` where authenticated users create and edit forms.
- **Dashboard**: The page at `/dashboard` listing all forms owned by the authenticated user.
- **Form_Renderer**: The component and route at `/form/[id]` that renders a published form for public submission.
- **Auth_Provider**: NextAuth.js v4, responsible for session management, credential validation, and OAuth.
- **MongoDB**: The MongoDB Atlas database accessed via Mongoose.
- **User**: A registered account stored in the `users` MongoDB collection.
- **Form**: A `FormSchema` document stored in the `forms` MongoDB collection, owned by a User.
- **Submission**: A `FormSubmission` document stored in the `submissions` MongoDB collection, linked to a Form.
- **Session**: An active NextAuth.js session identifying the currently logged-in User.
- **Zustand_Store**: The existing `lib/store/form-builder.ts` client-side state store.
- **Auto_Save**: The existing `useFormAutoSave` hook that persists builder state to localStorage and, when a Session exists, syncs to MongoDB.
- **Section_Header**: A `FormField` with `type === 'section-header'` used as a step boundary in multi-step forms.
- **Step**: A group of fields between two consecutive Section_Header fields (or from the start/end of the field list) when `settings.multiStepEnabled === true`.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account with my email and password, so that I can start building forms.

#### Acceptance Criteria

1. THE App SHALL provide a signup page at `/auth/signup` containing fields for name, email address, and password.
2. WHEN a user submits the signup form with a valid name, a valid email address, and a password of at least 8 characters, THE Auth_Provider SHALL create a new User document in MongoDB and redirect the user to `/dashboard`.
3. IF a user submits the signup form with an email address that already exists in MongoDB, THEN THE App SHALL display an error message stating that the email address is already registered.
4. IF a user submits the signup form with a password shorter than 8 characters, THEN THE App SHALL display an inline validation error before submission.
5. THE App SHALL store passwords as bcrypt hashes in MongoDB and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email/password or Google account, so that I can access my forms.

#### Acceptance Criteria

1. THE App SHALL provide a login page at `/auth/signin` containing fields for email address and password, a "Sign in with Google" button, and a link to the signup page.
2. WHEN a user submits valid credentials, THE Auth_Provider SHALL create a Session and redirect the user to `/dashboard`.
3. IF a user submits an unrecognised email address or incorrect password, THEN THE Auth_Provider SHALL display an error message without revealing which field is incorrect.
4. WHEN a user clicks "Sign in with Google", THE Auth_Provider SHALL initiate the Google OAuth flow and, upon success, create or retrieve the User document in MongoDB and redirect the user to `/dashboard`.
5. WHEN a user's Session expires or is absent, THE App SHALL redirect the user to `/auth/signin` when the user attempts to access a protected route.

---

### Requirement 3: User Logout

**User Story:** As a logged-in user, I want to log out, so that my account is secured on shared devices.

#### Acceptance Criteria

1. THE App SHALL display a logout control in the navigation header when a Session is active.
2. WHEN a user activates the logout control, THE Auth_Provider SHALL invalidate the Session and redirect the user to `/auth/signin`.

---

### Requirement 4: Protected Routes

**User Story:** As the application owner, I want the builder and dashboard to require login, so that only authenticated users can create and manage forms.

#### Acceptance Criteria

1. WHILE a Session is absent, THE App SHALL redirect any request to `/` (the Builder) to `/auth/signin`.
2. WHILE a Session is absent, THE App SHALL redirect any request to `/dashboard` to `/auth/signin`.
3. WHILE a Session is active, THE App SHALL allow access to `/` and `/dashboard`.
4. THE App SHALL allow unauthenticated access to `/form/[id]` for published forms.
5. THE App SHALL allow unauthenticated access to `/auth/signin` and `/auth/signup`.

---

### Requirement 5: MongoDB Data Models

**User Story:** As a developer, I want well-defined Mongoose models for users, forms, and submissions, so that data is consistently structured and validated at the database layer.

#### Acceptance Criteria

1. THE MongoDB SHALL contain a `users` collection with fields: `_id`, `name`, `email` (unique, indexed), `passwordHash` (optional for OAuth users), `provider` (`credentials` or `google`), `createdAt`, `updatedAt`.
2. THE MongoDB SHALL contain a `forms` collection with fields: `_id`, `ownerId` (reference to `users._id`), `name`, `description`, `fields` (array), `settings`, `isPublished` (boolean, default `false`), `createdAt`, `updatedAt`.
3. THE MongoDB SHALL contain a `submissions` collection with fields: `_id`, `formId` (reference to `forms._id`), `data` (object), `submittedAt`, `ipAddress`, `userAgent`.
4. THE App SHALL use a single shared Mongoose connection that is reused across serverless function invocations.
5. WHEN the Mongoose connection is not yet established, THE App SHALL establish the connection before executing any database operation.

---

### Requirement 6: Form Persistence via MongoDB API

**User Story:** As a logged-in user, I want my forms saved to MongoDB, so that they persist across devices and browser sessions.

#### Acceptance Criteria

1. THE App SHALL expose `POST /api/forms` to create a new Form document owned by the authenticated User.
2. THE App SHALL expose `GET /api/forms` to return all Form documents owned by the authenticated User.
3. THE App SHALL expose `GET /api/forms/[id]` to return a single Form document.
4. THE App SHALL expose `PUT /api/forms/[id]` to update a Form document owned by the authenticated User.
5. THE App SHALL expose `DELETE /api/forms/[id]` to delete a Form document and all associated Submission documents owned by the authenticated User.
6. IF a request to mutate or delete a Form is made by a User who is not the owner, THEN THE App SHALL return HTTP 403.
7. IF a request references a Form `id` that does not exist in MongoDB, THEN THE App SHALL return HTTP 404.

---

### Requirement 7: Builder Auto-Save to MongoDB

**User Story:** As a logged-in user, I want my form changes saved automatically to MongoDB while I build, so that I never lose work.

#### Acceptance Criteria

1. WHILE a Session is active and the builder form state changes, THE Auto_Save SHALL debounce writes and persist the current `FormSchema` to MongoDB via `PUT /api/forms/[id]` within 2 seconds of the last change.
2. WHILE a Session is absent, THE Auto_Save SHALL persist the current `FormSchema` to localStorage only, preserving existing behaviour.
3. WHEN a logged-in user opens the Builder and a Form document exists in MongoDB for the current form id, THE Builder SHALL load the Form from MongoDB and hydrate the Zustand_Store.
4. WHEN a logged-in user opens the Builder and no Form document exists in MongoDB for the current form id, THE Builder SHALL create a new Form document via `POST /api/forms` and continue.
5. THE App SHALL display the auto-save status (saving / saved / error) in the builder header.

---

### Requirement 8: Real Form Preview

**User Story:** As a form builder user, I want the Preview button to open my actual form, so that I can see exactly what respondents will see.

#### Acceptance Criteria

1. WHEN a logged-in user clicks the Preview button in the Builder, THE Builder SHALL open `/form/[id]` in a new browser tab, where `[id]` is the current form's MongoDB document id.
2. WHEN `/form/[id]` is loaded, THE Form_Renderer SHALL fetch the Form document from MongoDB and render it using the existing `FormRenderer` component.
3. IF the Form document does not exist in MongoDB, THEN THE Form_Renderer SHALL display a "Form not found" message.
4. WHEN the form owner previews an unpublished form while authenticated, THE Form_Renderer SHALL render the form without requiring it to be published.

---

### Requirement 9: Form Publishing

**User Story:** As a form owner, I want to publish or unpublish my form, so that I control when the public can access it.

#### Acceptance Criteria

1. THE App SHALL expose `PATCH /api/forms/[id]/publish` to toggle the `isPublished` flag on a Form document owned by the authenticated User.
2. WHEN a user sets `isPublished` to `true`, THE App SHALL set `isPublished: true` on the Form document in MongoDB.
3. WHEN a user sets `isPublished` to `false`, THE App SHALL set `isPublished: false` on the Form document in MongoDB.
4. WHILE a Form's `isPublished` flag is `false`, THE Form_Renderer SHALL deny access to unauthenticated users and return HTTP 403.
5. WHILE a Form's `isPublished` flag is `true`, THE Form_Renderer SHALL allow any user to access `/form/[id]` without authentication.
6. THE Dashboard SHALL display the published/unpublished status of each Form and provide a toggle control.

---

### Requirement 10: Public Form Submission

**User Story:** As a form respondent, I want to fill out and submit a published form without needing an account, so that I can respond easily.

#### Acceptance Criteria

1. WHEN a user submits a published form at `/form/[id]`, THE Form_Renderer SHALL send the submission data to `POST /api/forms/[id]/submit`.
2. WHEN `POST /api/forms/[id]/submit` receives a valid submission, THE App SHALL create a Submission document in MongoDB and return HTTP 201.
3. IF `POST /api/forms/[id]/submit` receives a submission for a Form with `isPublished: false`, THEN THE App SHALL return HTTP 403.
4. IF `POST /api/forms/[id]/submit` receives a submission for a Form that does not exist, THEN THE App SHALL return HTTP 404.
5. WHEN a submission is successfully stored, THE Form_Renderer SHALL display the Form's `settings.successMessage` to the user.
6. IF a submission fails to store, THEN THE Form_Renderer SHALL display the Form's `settings.errorMessage` to the user.

---

### Requirement 11: Multi-Step Form Rendering

**User Story:** As a form respondent, I want multi-step forms to guide me through sections one at a time, so that long forms feel manageable.

#### Acceptance Criteria

1. WHILE `settings.multiStepEnabled` is `true`, THE Form_Renderer SHALL split the form's fields into Steps using Section_Header fields as step boundaries.
2. WHILE `settings.multiStepEnabled` is `true`, THE Form_Renderer SHALL display only the fields belonging to the current Step.
3. WHILE `settings.multiStepEnabled` is `true` and the current Step is not the last Step, THE Form_Renderer SHALL display a "Next" button that advances to the next Step.
4. WHILE `settings.multiStepEnabled` is `true` and the current Step is not the first Step, THE Form_Renderer SHALL display a "Back" button that returns to the previous Step.
5. WHILE `settings.multiStepEnabled` is `true` and the current Step is the last Step, THE Form_Renderer SHALL display the submit button in place of the "Next" button.
6. WHEN a user clicks "Next", THE Form_Renderer SHALL validate all required fields in the current Step before advancing, and SHALL display inline errors for any invalid fields without advancing.
7. WHILE `settings.progressBarEnabled` is `true` and `settings.multiStepEnabled` is `true`, THE Form_Renderer SHALL display a progress bar indicating the current step number out of the total number of steps.
8. WHILE `settings.multiStepEnabled` is `false`, THE Form_Renderer SHALL render all fields on a single page, preserving existing behaviour.

---

### Requirement 12: User Dashboard

**User Story:** As a logged-in user, I want a dashboard showing all my forms, so that I can manage them from one place.

#### Acceptance Criteria

1. THE App SHALL provide a dashboard page at `/dashboard` accessible only to authenticated users.
2. WHEN a user navigates to `/dashboard`, THE Dashboard SHALL fetch and display all Form documents owned by the authenticated User from MongoDB.
3. THE Dashboard SHALL display for each Form: the form name, published/unpublished status, submission count, and the date last updated.
4. THE Dashboard SHALL provide an "Edit" action for each Form that navigates the user to the Builder loaded with that Form's data.
5. THE Dashboard SHALL provide a "Preview" action for each Form that opens `/form/[id]` in a new browser tab.
6. THE Dashboard SHALL provide a "View Submissions" action for each Form that navigates to a submissions view showing all Submission documents for that Form.
7. THE Dashboard SHALL provide a "Delete" action for each Form that, after user confirmation, deletes the Form and all associated Submissions from MongoDB.
8. THE Dashboard SHALL provide a "New Form" action that creates a new Form document in MongoDB and navigates the user to the Builder.
9. WHEN the authenticated user has no forms, THE Dashboard SHALL display an empty-state message and a prompt to create the first form.

---

### Requirement 13: Submissions View

**User Story:** As a form owner, I want to view all submissions for a form, so that I can review the responses.

#### Acceptance Criteria

1. THE App SHALL expose `GET /api/forms/[id]/submissions` to return all Submission documents for a Form owned by the authenticated User.
2. WHEN a user navigates to the submissions view for a Form, THE App SHALL fetch and display all Submission documents from MongoDB.
3. THE App SHALL display each Submission's submitted date and the submitted field values.
4. IF a Form has no Submission documents, THEN THE App SHALL display an empty-state message.
5. IF a request to `GET /api/forms/[id]/submissions` is made by a User who is not the Form owner, THEN THE App SHALL return HTTP 403.
