# Requirements Document

## Introduction

This spec covers a structural refactor and accessibility overhaul of the existing Next.js Form Builder application. The goal is to eliminate identified bugs, reduce code duplication, fix performance bottlenecks, improve maintainability, make every screen fully responsive, and bring the UI to WCAG 2.1 AA compliance — all without changing any user-visible functionality.

The application consists of two surfaces: a **Builder** (drag-and-drop form editor at `/`) and a **Renderer** (live form preview at `/form`). Both surfaces share a Zustand store, a set of custom hooks, and a library of React components.

---

## Glossary

- **Builder**: The form-editor page at `app/page.tsx` — the 3-column layout (toolbox | canvas | config panel).
- **Renderer**: The form-rendering page at `app/form/page.tsx` and `components/form-renderer/form-renderer.tsx`.
- **Store**: The Zustand store defined in `lib/store/form-builder.ts`.
- **FormSchema**: The top-level data object that describes a form (id, name, description, fields, settings).
- **FormSettings**: The nested settings object inside `FormSchema` (messages, button config, theme colors).
- **FormField**: A single field definition within a `FormSchema`.
- **FieldConfigPanel**: The right-panel component that edits a selected `FormField`.
- **FormSettingsPanel**: The sheet/drawer component that edits `FormSettings`.
- **FieldTypePicker**: The left-sidebar component listing all 16 addable field types.
- **FieldList**: The canvas component that renders the ordered list of `FormField` items.
- **ColorPickerField**: A reusable component pairing a native `<input type="color">` with a hex text `<Input>`.
- **FieldRenderer**: A lookup-map-based render function (or component) that maps a `FormField.type` to its input element.
- **AutoSave Hook**: `useFormAutoSave` in `hooks/use-form-builder.ts`.
- **History**: The undo/redo stack stored in the `Store` as `history.past` and `history.future`.
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines version 2.1, Level AA.
- **Screen Reader**: Assistive technology that reads UI content aloud (e.g., NVDA, VoiceOver).

---

## Requirements

### Requirement 1: Fix the `updateSettings` name-field bug

**User Story:** As a developer, I want the form name input in the Builder header to correctly update `FormSchema.name`, so that the displayed name and the stored schema stay in sync.

#### Acceptance Criteria

1. WHEN the user edits the form name input in the Builder header, THE Builder SHALL call `updateForm({ name })` (updating the top-level `FormSchema.name` field) instead of `updateSettings({ name })`.
2. THE Store SHALL expose an `updateForm` action that merges a `Partial<FormSchema>` into the current `FormSchema` and records a history snapshot.
3. WHEN `updateForm` is called with `{ name }`, THE Store SHALL NOT overwrite `FormSchema.settings`.

---

### Requirement 2: Fix the broken GET handler in the submissions API route

**User Story:** As a developer, I want the submissions API to be internally consistent, so that no dead or unreachable code misleads future maintainers.

#### Acceptance Criteria

1. THE `app/api/forms/submit/route.ts` file SHALL NOT contain a `GET` handler that destructures `params` from a non-dynamic route segment.
2. IF a `GET` request is made to `/api/forms/submit`, THEN THE API SHALL return a `405 Method Not Allowed` response with a JSON body `{ success: false, error: "Method not allowed" }`.
3. THE `POST` handler in `app/api/forms/submit/route.ts` SHALL remain functionally identical to the current implementation.

---

### Requirement 3: Fix the hydration mismatch from `DEFAULT_FORM`

**User Story:** As a developer, I want the Zustand store to initialise without causing React hydration mismatches, so that the Builder loads correctly on first render without console errors.

#### Acceptance Criteria

1. THE Store SHALL NOT call `generateId()` at module-load time to populate `DEFAULT_FORM.id`.
2. WHEN the Store is first initialised on the client, THE Store SHALL generate the default form id lazily (e.g., inside the store factory function or via a stable placeholder that is replaced on first client render).
3. THE Store SHALL continue to persist and rehydrate correctly via the existing `zustand/middleware` `persist` configuration.

---

### Requirement 4: Fix the `app/form/page.tsx` server/client inconsistency

**User Story:** As a developer, I want `app/form/page.tsx` to be an explicit Client Component, so that its use of async event handlers and `fetch` is unambiguous and consistent with Next.js App Router conventions.

#### Acceptance Criteria

1. THE `app/form/page.tsx` file SHALL include `'use client'` as its first line.
2. WHEN the page is rendered, THE Renderer SHALL continue to display the mock form and submit data to `/api/forms/submit` as before.
3. THE `handleSubmit` function in `app/form/page.tsx` SHALL remain an async function that calls `fetch('/api/forms/submit', ...)`.

---

### Requirement 5: Extract a reusable `ColorPickerField` component

**User Story:** As a developer, I want the color-picker pattern (native color swatch + hex text input) to live in one place, so that changes to its appearance or behaviour only need to be made once.

#### Acceptance Criteria

1. THE codebase SHALL contain a `ColorPickerField` component that accepts `id`, `label`, `value`, and `onChange` props.
2. THE `ColorPickerField` SHALL render a native `<input type="color">` and a text `<Input>` side-by-side, keeping both in sync.
3. THE `FormSettingsPanel` SHALL use `ColorPickerField` for all three theme color fields (primaryColor, secondaryColor, accentColor) instead of inline copy-pasted markup.
4. WHEN the user changes either the swatch or the text input, THE `ColorPickerField` SHALL call `onChange` with the new hex string.

---

### Requirement 6: Replace chained field-type conditionals with a `FieldRenderer` lookup map

**User Story:** As a developer, I want to add or modify a field type in one place, so that the form renderer does not require changes scattered across a 200-line conditional chain.

#### Acceptance Criteria

1. THE `FormField` component in `form-renderer.tsx` SHALL use a lookup map (or equivalent render function) to resolve the correct input element for a given `field.type`.
2. THE lookup map SHALL cover all 16 field types currently handled by the chained conditionals.
3. WHEN a `field.type` is not found in the lookup map, THE `FormField` component SHALL render nothing and log a warning to the console.
4. THE rendered output for every existing field type SHALL be functionally identical to the current implementation (same props, same behaviour).

---

### Requirement 7: Replace `generateId()` with `crypto.randomUUID()`

**User Story:** As a developer, I want ID generation to use a cryptographically sound UUID, so that generated IDs are globally unique and collision-resistant.

#### Acceptance Criteria

1. THE `generateId` function in `lib/utils.ts` SHALL use `crypto.randomUUID()` as its implementation.
2. WHEN `crypto.randomUUID()` is unavailable (e.g., non-secure context), THE `generateId` function SHALL fall back to the existing `Date.now() + Math.random()` pattern.
3. ALL callers of `generateId()` throughout the codebase SHALL continue to work without modification.

---

### Requirement 8: Fix the `pushHistory` stale-closure / double-render issue

**User Story:** As a developer, I want undo/redo history to be recorded correctly without stale state or extra renders, so that the undo stack always reflects the true sequence of changes.

#### Acceptance Criteria

1. THE `pushHistory` action in the Store SHALL be inlined into each mutating action's `set()` callback rather than calling `get().pushHistory(...)` from inside another `set()` callback.
2. WHEN any field or settings mutation occurs, THE Store SHALL record exactly one history snapshot per user action.
3. THE undo and redo actions SHALL continue to restore the correct previous and next `FormSchema` states.

---

### Requirement 9: Fix `useFormAutoSave` debounce memoisation

**User Story:** As a developer, I want the auto-save debounce function to be stable across renders, so that the save timer is not reset on every keystroke.

#### Acceptance Criteria

1. THE `useFormAutoSave` hook SHALL create the debounced save function using `useRef` to hold the debounce instance, ensuring the same function reference is used across renders.
2. WHEN the `form` state changes, THE AutoSave Hook SHALL trigger the debounced save without recreating the debounce wrapper.
3. THE debounce delay SHALL remain configurable via the `interval` parameter (default 2000 ms).

---

### Requirement 10: Cap the undo/redo history stack size

**User Story:** As a developer, I want the undo history to have a maximum size, so that the application does not consume unbounded memory for large or long-editing sessions.

#### Acceptance Criteria

1. THE Store SHALL define a `MAX_HISTORY_SIZE` constant (default value: 50).
2. WHEN `pushHistory` is called and `history.past.length` equals `MAX_HISTORY_SIZE`, THE Store SHALL discard the oldest entry before appending the new snapshot.
3. THE undo and redo behaviour SHALL remain correct after the history cap is applied.

---

### Requirement 11: Reduce `FormRenderer` re-renders on keystroke

**User Story:** As a user, I want the form renderer to remain responsive even on large forms, so that typing in one field does not cause visible lag in other fields.

#### Acceptance Criteria

1. THE `FormField` component in `form-renderer.tsx` SHALL be wrapped with `React.memo`.
2. THE `FormRenderer` component SHALL pass per-field `value`, `error`, and `onChange` callbacks as stable references (using `useCallback` or equivalent) so that sibling `FormField` instances do not re-render when one field's value changes.
3. WHEN a user types in one field, THE other `FormField` components in the same form SHALL NOT re-render (verifiable via React DevTools Profiler).

---

### Requirement 12: Split `app/page.tsx` into focused sub-components

**User Story:** As a developer, I want the Builder page to be composed of small, single-responsibility components, so that each piece is easy to read, test, and modify independently.

#### Acceptance Criteria

1. THE `app/page.tsx` file SHALL be reduced to a top-level layout orchestrator with no inline event-handler logic beyond wiring props.
2. THE Builder header (form name input + toolbar buttons) SHALL be extracted into a `BuilderHeader` component that accepts `formName`, `onNameChange`, `onUndo`, `onRedo`, `canUndo`, `canRedo` props.
3. THE Builder toolbar actions (Save, Settings sheet trigger, Preview button) SHALL be part of `BuilderHeader` or a sibling `BuilderToolbar` component.
4. EACH extracted component SHALL be placed in `components/form-builder/` and exported from an `index.ts` barrel file.

---

### Requirement 13: Remove the dead "Validation" placeholder in `FieldConfigPanel`

**User Story:** As a developer, I want the config panel to only show UI that is functional, so that placeholder sections do not mislead contributors into thinking validation rules are already wired up.

#### Acceptance Criteria

1. THE `FieldConfigPanel` SHALL NOT render a "Validation" section that contains only static placeholder text with no interactive controls.
2. IF a validation section is added in the future, THE `FieldConfigPanel` SHALL render actual validation-rule inputs (e.g., min/max length, pattern) connected to `field.validation`.
3. THE removal of the placeholder section SHALL NOT affect any other part of the `FieldConfigPanel`.

---

### Requirement 14: Remove `[v0]` debug log prefixes from production code

**User Story:** As a developer, I want the codebase to use clean, consistent logging, so that debug artifacts from the scaffolding tool do not appear in production logs.

#### Acceptance Criteria

1. THE codebase SHALL NOT contain any `console.log` or `console.error` calls prefixed with `[v0]`.
2. WHERE a log statement conveys useful runtime information (e.g., submission received, save failed), THE log SHALL be retained without the `[v0]` prefix.
3. WHERE a log statement is purely a debug trace with no operational value, THE log SHALL be removed entirely.

---

### Requirement 15: Make the Builder layout fully responsive

**User Story:** As a user on a mobile or tablet device, I want to be able to use the Form Builder, so that I am not locked out of the tool on smaller screens.

#### Acceptance Criteria

1. THE Builder layout SHALL use responsive Tailwind breakpoints (`sm`, `md`, `lg`) instead of fixed pixel-equivalent widths (`w-64`, `w-80`).
2. WHILE the viewport width is below the `md` breakpoint (768 px), THE Builder SHALL display a single-column layout with the toolbox and config panel accessible via tabs or a bottom sheet.
3. WHILE the viewport width is at or above the `md` breakpoint, THE Builder SHALL display the existing 3-column layout (toolbox | canvas | config).
4. THE canvas area SHALL be scrollable and SHALL NOT overflow the viewport horizontally on any screen size.
5. THE Builder header SHALL wrap its content gracefully on narrow viewports without truncating the form name input or hiding toolbar buttons.

---

### Requirement 16: Add full WCAG 2.1 AA accessibility to the Form Renderer

**User Story:** As a user who relies on a screen reader, I want every form field to be correctly announced and navigable, so that I can fill out and submit forms without a mouse.

#### Acceptance Criteria

1. EVERY `FormField` in the Renderer SHALL have a `<label>` element whose `htmlFor` attribute matches the field's `id`.
2. WHEN a field has a validation error, THE `FormField` SHALL set `aria-invalid="true"` on the input element and `aria-describedby` pointing to the error message element's `id`.
3. WHEN a field has help text, THE `FormField` SHALL set `aria-describedby` on the input element pointing to the help text element's `id` (combined with the error id when both are present).
4. THE submit button SHALL have an accessible label that reflects its current state (e.g., "Submitting…" when loading).
5. WHEN a form-level submission error is displayed, THE error `Alert` SHALL have `role="alert"` so that screen readers announce it immediately.
6. THE rating field buttons SHALL each have an `aria-label` of the form "Rate N out of 5".
7. THE multiselect checkboxes SHALL be grouped in a `<fieldset>` with a `<legend>` matching the field label.
8. THE section-header field SHALL render as an `<h2>` with an appropriate `aria-level` attribute.
9. EVERY interactive element in the Renderer SHALL be reachable and operable via keyboard alone (Tab, Shift+Tab, Enter, Space).

---

### Requirement 17: Add full WCAG 2.1 AA accessibility to the Form Builder

**User Story:** As a developer or form author who relies on a screen reader or keyboard navigation, I want the Builder UI to be fully accessible, so that I can create and configure forms without a mouse.

#### Acceptance Criteria

1. THE `FieldItem` drag handle SHALL have `aria-label="Drag to reorder"` and `role="button"` with keyboard-accessible reorder controls (e.g., arrow keys to move up/down).
2. THE duplicate and delete buttons in `FieldItem` SHALL each have an `aria-label` that includes the field's label (e.g., "Duplicate Full Name field", "Delete Full Name field").
3. THE `FieldTypePicker` buttons SHALL each have an `aria-label` of the form "Add [type] field".
4. THE form name `<Input>` in the Builder header SHALL have an associated `<label>` or `aria-label` of "Form name".
5. THE undo and redo buttons SHALL have `aria-label` attributes ("Undo", "Redo") and SHALL communicate their disabled state via `aria-disabled`.
6. THE `FieldConfigPanel` form controls SHALL each have a unique `id` that does not collide with field ids rendered in the canvas.
7. WHEN the `FormSettingsPanel` sheet opens, focus SHALL move to the first interactive element inside the sheet.
8. THE color swatch `<input type="color">` in `ColorPickerField` SHALL have an `aria-label` matching its label text.

---

### Requirement 18: Preserve all existing functionality

**User Story:** As a user, I want every existing feature to continue working after the refactor, so that the refactor introduces no regressions.

#### Acceptance Criteria

1. THE Builder SHALL continue to support adding, editing, duplicating, deleting, and reordering all 16 field types.
2. THE undo/redo stack SHALL continue to function correctly after all store refactors.
3. THE auto-save to `localStorage` SHALL continue to persist and restore the form schema across page reloads.
4. THE Form Schema JSON export (copy and download) in the `FormPreviewPanel` SHALL continue to produce valid JSON.
5. THE Renderer SHALL continue to validate all fields on blur and on submit, and SHALL display per-field error messages.
6. THE `FormSettingsPanel` SHALL continue to update all `FormSettings` fields (messages, button config, theme colors).
7. THE API routes (`POST /api/schemas`, `GET /api/schemas`, `POST /api/forms/submit`) SHALL continue to function as before.
