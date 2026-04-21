# Implementation Plan: MongoDB Auth and Features

## Overview

Incrementally add authentication (NextAuth.js v4), MongoDB persistence (Mongoose), a user dashboard, form publishing, public form submission, multi-step rendering, and a submissions view to the existing Next.js Form Builder. The existing builder, Zustand store, and auto-save behaviour are preserved throughout.

## Tasks

- [x] 1. Install dependencies and configure environment
  - Install `next-auth@4`, `mongoose`, `bcryptjs`, `@types/bcryptjs` with exact versions
  - Confirm `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are documented in `.env.local` (values already present per context)
  - _Requirements: 5.4, 5.5_

- [x] 2. Create MongoDB connection singleton and Mongoose models
  - [x] 2.1 Create `lib/mongodb.ts` with the `connectDB()` global-cache singleton
    - _Requirements: 5.4, 5.5_
  - [x] 2.2 Create `lib/models/User.ts` with the `IUser` interface and `UserSchema`
    - Fields: `name`, `email` (unique, indexed), `passwordHash` (optional), `provider`, timestamps
    - _Requirements: 5.1_
  - [x] 2.3 Create `lib/models/Form.ts` with the `IForm` interface and `FormSchema`
    - Fields: `ownerId` (ref User), `name`, `description`, `fields`, `settings`, `isPublished` (default false), timestamps
    - _Requirements: 5.2_
  - [x] 2.4 Create `lib/models/Submission.ts` with the `ISubmission` interface and `SubmissionSchema`
    - Fields: `formId` (ref Form, indexed), `data`, `submittedAt`, `ipAddress`, `userAgent`
    - _Requirements: 5.3_

- [x] 3. Set up NextAuth configuration and session type extension
  - [x] 3.1 Create `lib/auth.ts` with `authOptions` (CredentialsProvider + GoogleProvider, JWT strategy, `signIn`/`jwt`/`session` callbacks, custom pages)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 Create `types/next-auth.d.ts` to extend `Session` with `user.id` and `JWT` with `id`
    - _Requirements: 2.2_
  - [x] 3.3 Create `app/api/auth/[...nextauth]/route.ts` exporting the NextAuth handler
    - _Requirements: 2.1_

- [x] 4. Add route protection middleware
  - Create `middleware.ts` at the project root using `withAuth` from `next-auth/middleware`
  - Matcher covers `/` and `/dashboard/:path*`; all other routes remain public
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement authentication pages
  - [x] 5.1 Create `app/auth/signup/page.tsx` — client component with name, email, password fields
    - On submit: POST to a `/api/auth/register` route; on success redirect to `/dashboard`; display inline errors for duplicate email (req 1.3) and short password (req 1.4)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 5.2 Create `app/api/auth/register/route.ts` — POST handler that validates input, hashes password with bcrypt, creates User document
    - Return 409 for duplicate email; return 400 for password < 8 chars
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 5.3 Create `app/auth/signin/page.tsx` — client component with email/password fields, "Sign in with Google" button, and link to signup
    - Use `signIn()` from `next-auth/react`; display generic error on failure (req 2.3)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Add logout control to navigation header
  - Update the existing layout/header component to show a logout button when a session is active
  - Call `signOut({ callbackUrl: '/auth/signin' })` on click
  - _Requirements: 3.1, 3.2_

- [x] 7. Implement Forms API routes
  - [x] 7.1 Create `app/api/forms/route.ts` — `GET` (list user's forms) and `POST` (create form)
    - GET: require session, return all forms where `ownerId === session.user.id`
    - POST: require session, create Form document, return 201
    - _Requirements: 6.1, 6.2_
  - [x] 7.2 Create `app/api/forms/[id]/route.ts` — `GET`, `PUT`, `DELETE`
    - GET: no auth required; return 404 if not found
    - PUT/DELETE: require session, verify ownership (403), return 404 if not found; DELETE also removes all Submission documents for the form
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 7.3 Create `app/api/forms/[id]/publish/route.ts` — `PATCH` to toggle `isPublished`
    - Require session, verify ownership (403), return 404 if not found
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 7.4 Create `app/api/forms/[id]/submit/route.ts` — `POST` to create a Submission
    - No auth required; return 403 if `isPublished === false`; return 404 if form not found; create Submission document, return 201
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 7.5 Create `app/api/forms/[id]/submissions/route.ts` — `GET` to list submissions
    - Require session, verify ownership (403), return 404 if form not found
    - _Requirements: 13.1, 13.5_

- [x] 8. Checkpoint — Ensure all API routes compile and return correct status codes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extend builder auto-save to sync with MongoDB
  - Update `hooks/use-form-builder.ts` (`useFormAutoSave`) to check `useSession()`
  - When session exists and `formId` is a valid ObjectId: debounce 2 s then call `PUT /api/forms/[formId]`; expose `saveStatus` (`idle | saving | saved | error`)
  - When no session: fall back to localStorage only (existing behaviour unchanged)
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 10. Update builder page to load/create form from MongoDB
  - Update `app/page.tsx` (Builder) to:
    - On mount with active session: call `GET /api/forms/[id]`; if found, hydrate Zustand store; if not found, call `POST /api/forms` to create a new document
    - Pass `saveStatus` and publish state to `BuilderHeader`
    - _Requirements: 7.3, 7.4_

- [x] 11. Extend `BuilderHeader` with save status and publish toggle
  - Add `saveStatus`, `isPublished`, and `onPublishToggle` props to the existing `BuilderHeader` component
  - Display save status indicator; add publish/unpublish button that calls `PATCH /api/forms/[id]/publish`
  - Update Preview button to open `/form/[id]` in a new tab (using the MongoDB form id)
  - _Requirements: 7.5, 8.1, 9.6_

- [x] 12. Implement `splitIntoSteps` utility
  - Add `splitIntoSteps(fields: FormField[], formName: string): FormStep[]` to `lib/utils.ts`
  - Algorithm: scan fields left-to-right; `section-header` fields become step title boundaries and are excluded from `fields`; if no section-headers, return one step with all fields
  - _Requirements: 11.1, 11.2_

- [x] 13. Implement public form renderer at `/form/[id]`
  - Replace the existing hardcoded demo at `app/form/page.tsx` with a dynamic route `app/form/[id]/page.tsx`
  - Fetch form via `GET /api/forms/[id]`; display "Form not found" if 404
  - If `isPublished === false` and user is not the owner, display "This form is not available" (403 guard)
  - Render using the existing `FormRenderer` component
  - Wire submission to `POST /api/forms/[id]/submit`; on success show `settings.successMessage`; on failure show `settings.errorMessage`
  - _Requirements: 8.2, 8.3, 8.4, 10.1, 10.5, 10.6_

- [x] 14. Add multi-step rendering to the form renderer
  - Use `splitIntoSteps` when `settings.multiStepEnabled === true`
  - Show only current step's fields; render "Next" / "Back" / submit buttons per step position
  - Validate required fields in current step before advancing; display inline errors without advancing
  - Show progress bar when `settings.progressBarEnabled === true`
  - When `multiStepEnabled === false`, render all fields on a single page (existing behaviour)
  - _Requirements: 11.1–11.8_

- [x] 15. Checkpoint — Ensure form renderer and multi-step logic work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement the user dashboard
  - Create `app/dashboard/page.tsx` as a server component (protected by middleware)
  - Fetch all forms owned by the authenticated user directly via Mongoose (or `GET /api/forms`)
  - Display each form's name, published/unpublished status badge, submission count, and last-updated date
  - Provide Edit (navigate to builder), Preview (open `/form/[id]` in new tab), View Submissions, Delete (with confirmation), and New Form actions
  - On delete: call `DELETE /api/forms/[id]`; on New Form: call `POST /api/forms` then navigate to builder
  - Display empty-state message when user has no forms
  - _Requirements: 12.1–12.9_

- [x] 17. Implement the submissions view
  - Create `app/dashboard/[formId]/submissions/page.tsx` as a server component
  - Fetch submissions via `GET /api/forms/[formId]/submissions`
  - Display each submission's submitted date and field values
  - Display empty-state message when no submissions exist
  - _Requirements: 13.2, 13.3, 13.4_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (none in this list — all optional test tasks were excluded per user request)
- Each task references specific requirements for traceability
- The existing builder, Zustand store, drag-drop, undo/redo, and localStorage auto-save are never modified — only extended
- All API routes use the existing `ApiResponse<T>` envelope from `lib/types.ts`
