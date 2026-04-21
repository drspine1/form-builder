# Implementation Plan: Codebase Refactor and Accessibility Overhaul

## Overview

Implement all bug fixes, code quality improvements, performance optimisations, responsive layout changes, and WCAG 2.1 AA accessibility additions described in the design document. No new user-visible functionality is introduced. All changes are backward-compatible.

Tasks are ordered so that foundational utilities and store fixes come first, followed by new shared components, then renderer changes, then builder changes, and finally the responsive layout and barrel export.

## Tasks

- [x] 1. Fix utility and API layer bugs
  - [x] 1.1 Upgrade `generateId()` to `crypto.randomUUID()` with fallback in `lib/utils.ts`
    - Replace the current `Date.now() + Math.random()` body with `crypto.randomUUID()` guarded by a feature-detect
    - Add the `Date.now() + Math.random()` path as the fallback for non-secure contexts
    - All existing callers (`lib/store/form-builder.ts`, `components/form-builder/field-config-panel.tsx`) continue to work without modification
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 1.2 Write unit tests for `generateId()` in `lib/utils.test.ts`
    - Test returns a non-empty string in a normal context
    - Test falls back gracefully when `crypto.randomUUID` is `undefined`
    - _Requirements: 7.1, 7.2_

  - [x] 1.3 Replace the broken `GET` handler in `app/api/forms/submit/route.ts` with a 405 response
    - Remove the existing `GET` function that destructures `params` from a non-dynamic route
    - Add a new `GET` handler that returns `NextResponse.json({ success: false, error: 'Method not allowed', timestamp: ... }, { status: 405, headers: { Allow: 'POST' } })`
    - Remove the `[v0]` prefix from the `console.log` in the `POST` handler; retain the log itself
    - Remove the `[v0]` prefix from the `console.error` in the `POST` handler; retain the log itself
    - _Requirements: 2.1, 2.2, 2.3, 14.1, 14.2_

  - [ ]* 1.4 Write unit tests for the API route in `app/api/forms/submit/route.test.ts`
    - Test `GET /api/forms/submit` returns 405 with the correct JSON body
    - Test `POST /api/forms/submit` with a valid body returns 201 and a submission record
    - Test `POST /api/forms/submit` without `formId` returns 400
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Fix the Zustand store
  - [x] 2.1 Fix lazy `DEFAULT_FORM` id generation in `lib/store/form-builder.ts`
    - Rename `DEFAULT_FORM` to `DEFAULT_FORM_TEMPLATE` and type it as `Omit<FormSchema, 'id'>`
    - Remove the `generateId()` call from the module-level constant
    - Inside the store factory `(set, get) => ({ form: { ...DEFAULT_FORM_TEMPLATE, id: generateId() }, ... })` so the id is generated only on the client
    - Update `resetForm` to use `{ ...DEFAULT_FORM_TEMPLATE, id: generateId() }` so each reset also gets a fresh id
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Inline `pushHistory` with `MAX_HISTORY_SIZE` cap in `lib/store/form-builder.ts`
    - Add `const MAX_HISTORY_SIZE = 50` at the top of the file
    - In every mutating action (`setForm`, `updateForm`, `addField`, `updateField`, `deleteField`, `reorderFields`, `duplicateField`, `updateSettings`): replace the `get().pushHistory(updatedForm)` call with an inline history update inside the same `set()` callback
    - Inline pattern: `const newPast = [...state.history.past, state.form]; if (newPast.length > MAX_HISTORY_SIZE) newPast.shift(); return { form: updatedForm, history: { past: newPast, future: [] } }`
    - Retain the `pushHistory` action signature in the store interface but make it a no-op (or remove external calls to it)
    - Remove all `[v0]` log prefixes from the store file
    - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.3, 14.1_

  - [ ]* 2.3 Write unit tests for the store in `lib/store/form-builder.test.ts`
    - Test `updateForm({ name })` updates `form.name` and leaves `form.settings` unchanged
    - Test `addField` appends to `form.fields` and increments `history.past.length` by exactly 1
    - Test `undo` after `addField` restores the previous field list
    - Test `redo` after `undo` re-applies the mutation
    - Test that history at `MAX_HISTORY_SIZE` discards the oldest entry on the next push
    - Test `resetForm` clears history and selection
    - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_

  - [ ]* 2.4 Write property tests for the store in `lib/store/form-builder.property.test.ts`
    - **Property 1: `updateForm` merges without clobbering settings** — for any `Partial<FormSchema>` update without a `settings` key, `form.settings` is identical before and after
    - **Validates: Requirements 1.2, 1.3**
    - **Property 2: Store persist round-trip** — serialising any `FormSchema` to JSON and deserialising produces a deeply equal schema
    - **Validates: Requirements 3.3, 18.3**
    - **Property 5: History grows by exactly one per mutation** — for any single store mutation, `history.past.length` increases by exactly 1
    - **Validates: Requirements 8.1, 8.2**
    - **Property 6: Undo/redo round-trip** — for any sequence of mutations followed by the same number of undos, `form` equals the pre-mutation state
    - **Validates: Requirements 8.3, 18.2**
    - **Property 7: History cap invariant** — for any sequence exceeding `MAX_HISTORY_SIZE` mutations, `history.past.length` never exceeds `MAX_HISTORY_SIZE`
    - **Validates: Requirements 10.1, 10.2**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix `useFormAutoSave` debounce memoisation in `hooks/use-form-builder.ts`
  - [x] 4.1 Replace `useCallback(debounce(...))` with a `useRef`-based stable debounce instance
    - Add `import { useRef } from 'react'`
    - Create `saveFormRef = useRef(saveForm)` and keep it current with `useEffect(() => { saveFormRef.current = saveForm }, [saveForm])`
    - Create `debouncedSaveRef = useRef(debounce((...args) => saveFormRef.current(...args), interval))` — initialised once, never recreated
    - Replace the `useEffect([form, debouncedSave])` call to use `debouncedSaveRef.current()`
    - Remove the `[v0]` prefix from the `console.error` call; retain the log
    - _Requirements: 9.1, 9.2, 9.3, 14.1, 14.2_

  - [ ]* 4.2 Write unit tests for `useFormAutoSave` in `hooks/use-form-builder.test.ts`
    - Test that the debounce function reference is stable across re-renders
    - Test that save is triggered after the debounce interval when `form` changes
    - _Requirements: 9.1, 9.2_

- [x] 5. Fix `app/form/page.tsx` server/client inconsistency
  - Add `'use client'` as the first line of `app/form/page.tsx`
  - Remove the `[v0]` prefix from all three `console.log` / `console.error` calls; retain the logs themselves
  - Verify `handleSubmit` remains an async function calling `fetch('/api/forms/submit', ...)`
  - _Requirements: 4.1, 4.2, 4.3, 14.1, 14.2_

- [x] 6. Fix the `updateSettings` name-field bug in `app/page.tsx`
  - Change `handleFormNameChange` to call `updateForm({ name })` instead of `updateSettings({ name } as any)`
  - Import `updateForm` from `useFormBuilder` in place of (or alongside) `updateSettings`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Create the `ColorPickerField` component
  - [x] 7.1 Create `components/form-builder/color-picker-field.tsx`
    - Define `ColorPickerFieldProps` interface with `id`, `label`, `value`, `onChange` props
    - Render a `<div className="space-y-2">` containing a `<Label htmlFor={id}>` and a flex row with `<input type="color">` and `<Input>`
    - The color swatch: `id={`${id}-swatch`}`, `aria-label={label}`, `value={value}`, `onChange={(e) => onChange(e.target.value)}`
    - The text input: `id={id}`, `value={value}`, `onChange={(e) => onChange(e.target.value)}`, `placeholder="#000000"`
    - Both inputs call the same `onChange` prop so they stay in sync
    - _Requirements: 5.1, 5.2, 5.4, 17.8_

  - [ ]* 7.2 Write unit tests for `ColorPickerField` in `components/form-builder/color-picker-field.test.tsx`
    - Test changing the color swatch calls `onChange` with the new hex value
    - Test changing the text input calls `onChange` with the new hex value
    - Test both inputs display the same `value` prop
    - _Requirements: 5.2, 5.4_

  - [ ]* 7.3 Write property tests for `ColorPickerField` in `components/form-builder/builder.property.test.ts`
    - **Property 3: `ColorPickerField` onChange parity** — for any valid hex string, changing either input calls `onChange` with that same hex string
    - **Validates: Requirements 5.2, 5.4**
    - **Property 17: ColorPickerField swatch aria-label matches label** — for any `label` string, the `<input type="color">` has `aria-label` equal to `label`
    - **Validates: Requirements 17.8**

- [x] 8. Update `FormSettingsPanel` to use `ColorPickerField`
  - In `components/form-builder/form-settings-panel.tsx`, import `ColorPickerField` from `./color-picker-field`
  - Replace the three inline color-picker blocks (primaryColor, secondaryColor, accentColor) with `<ColorPickerField>` instances as specified in the design
  - Remove the now-unused `<Label>` + `<input type="color">` + `<Input>` markup for each color field
  - _Requirements: 5.3, 18.6_

- [x] 9. Refactor `FormRenderer` — FIELD_RENDERER_MAP, stable callbacks, and WCAG attributes
  - [x] 9.1 Build `FIELD_RENDERER_MAP` and replace the chained `if` blocks in `components/form-renderer/form-renderer.tsx`
    - Define `FieldRendererFn` type: `(field, value, onChange, onBlur, hasError) => React.ReactNode`
    - Define `FIELD_RENDERER_MAP: Record<FieldType, FieldRendererFn>` covering all 16 field types
    - For `section-header`: render `<h2 aria-level={2}>{field.label}</h2>`
    - For `multiselect`: render `<fieldset><legend>{field.label}{required && <span aria-hidden="true"> *</span>}</legend>…</fieldset>`
    - For `rating`: render `<div role="group">` with buttons each having `aria-label={`Rate ${rating} out of 5`}`
    - Replace the `FormField` body's chained conditionals with a map lookup + fallback `console.warn` + `return null`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 16.6, 16.7, 16.8_

  - [x] 9.2 Add WCAG aria attributes to `FormField` in `components/form-renderer/form-renderer.tsx`
    - Compute `errorId = `${field.id}-error`` and `helpId = `${field.id}-help``
    - Compute `describedBy` from whichever of `errorId` / `helpId` are active; pass as `aria-describedby` on every input
    - Add `aria-invalid={hasError || undefined}` to every input
    - Render the error message as `<p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>`
    - Render help text as `<p id={helpId} className="text-xs text-muted-foreground">{field.helpText}</p>`
    - Add `role="alert"` to the form-level submission error `<Alert>` in `FormRenderer`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 9.3 Stabilise `FormRenderer` callbacks with `useCallback` and `useMemo`
    - Convert `handleChange` to `useCallback` with a functional updater (no deps)
    - Convert `handleBlur` to `useCallback` with `[schema.fields]` dep
    - Build `fieldCallbacks` with `useMemo` keyed by `field.id` so per-field `onChange`/`onBlur` references are stable
    - Pass `fieldCallbacks[field.id].onChange` and `fieldCallbacks[field.id].onBlur` to each `<FormField>`
    - Wrap `FormField` with `React.memo` (already done; verify it is still present)
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 9.4 Write unit tests for `FormRenderer` in `components/form-renderer/form-renderer.test.tsx`
    - Test all 16 field types render without throwing
    - Test submit button shows "Submitting…" when `isSubmitting=true`
    - Test form-level error `Alert` has `role="alert"`
    - Test `section-header` renders as `<h2>`
    - _Requirements: 6.1, 6.2, 16.5, 16.8_

  - [ ]* 9.5 Write property tests for `FormRenderer` in `components/form-renderer/form-renderer.property.test.ts`
    - **Property 4: `FIELD_RENDERER_MAP` completeness** — for any `FieldType` value, `FIELD_RENDERER_MAP[type]` is defined
    - **Validates: Requirements 6.1, 6.2**
    - **Property 8: `FormField` label association** — for any `FormField` (excluding `section-header`), rendered output contains a `<label>` whose `htmlFor` equals `field.id`
    - **Validates: Requirements 16.1**
    - **Property 9: `aria-invalid` and `aria-describedby` on error** — for any `FormField` with a non-empty `error`, the input has `aria-invalid="true"` and `aria-describedby` containing `${field.id}-error`
    - **Validates: Requirements 16.2**
    - **Property 10: `aria-describedby` includes help text id** — for any `FormField` with non-empty `helpText`, the input's `aria-describedby` contains `${field.id}-help`
    - **Validates: Requirements 16.3**
    - **Property 11: Rating button aria-labels** — for any rating `FormField`, each of the 5 buttons has `aria-label` equal to `"Rate N out of 5"`
    - **Validates: Requirements 16.6**
    - **Property 12: Multiselect fieldset/legend** — for any multiselect `FormField`, rendered output contains a `<fieldset>` with a `<legend>` whose text matches `field.label`
    - **Validates: Requirements 16.7**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Add WCAG attributes to Builder components
  - [x] 11.1 Add accessibility attributes to `FieldItem` and `FieldList` in `components/form-builder/field-list.tsx`
    - Drag handle `<GripVertical>` wrapper: add `role="button"`, `aria-label="Drag to reorder"`, `tabIndex={0}`, and keyboard handlers for `ArrowUp`/`ArrowDown` that call `reorderFields` to move the field up or down
    - Duplicate `<Button>`: add `aria-label={`Duplicate ${field.label} field`}`
    - Delete `<Button>`: add `aria-label={`Delete ${field.label} field`}`
    - _Requirements: 17.1, 17.2_

  - [x] 11.2 Add `aria-label` to each button in `components/form-builder/field-type-picker.tsx`
    - For each entry in `FIELD_TYPES`, add `aria-label={`Add ${label} field`}` to the `<Button>`
    - _Requirements: 17.3_

  - [x] 11.3 Remove the dead "Validation" placeholder section from `components/form-builder/field-config-panel.tsx`
    - Delete the `<div className="space-y-4">` block that contains only the "Validation" heading and the static `<p>` with no interactive controls
    - Prefix all control `id` attributes with `config-` (e.g., `id="label"` → `id="config-label"`, `id="placeholder"` → `id="config-placeholder"`, etc.) and update their corresponding `htmlFor` / `<Label htmlFor>` attributes to match
    - _Requirements: 13.1, 13.2, 13.3, 17.6_

  - [ ]* 11.4 Write property tests for Builder components in `components/form-builder/builder.property.test.ts`
    - **Property 13: FieldItem button aria-labels include field label** — for any `FormField`, the duplicate button's `aria-label` contains `field.label` and the delete button's `aria-label` contains `field.label`
    - **Validates: Requirements 17.2**
    - **Property 14: FieldTypePicker button aria-labels** — for any `FieldType`, the corresponding button has `aria-label` equal to `"Add ${getFieldTypeLabel(type)} field"`
    - **Validates: Requirements 17.3**
    - **Property 16: FieldConfigPanel control ids do not collide with field ids** — for any `FormField` with any `id`, the `FieldConfigPanel` control ids (prefixed `config-`) do not equal `field.id`
    - **Validates: Requirements 17.6**

- [x] 12. Create the `BuilderHeader` component
  - [x] 12.1 Create `components/form-builder/builder-header.tsx`
    - Define `BuilderHeaderProps` interface with `formName`, `onNameChange`, `onUndo`, `onRedo`, `canUndo`, `canRedo`, `onSave`, `onPreview`, `settingsContent` props
    - Move the header markup from `app/page.tsx` into this component
    - Form name `<Input>`: add `aria-label="Form name"` (or an associated `<Label>`)
    - Undo `<Button>`: add `aria-label="Undo"` and `aria-disabled={!canUndo}`
    - Redo `<Button>`: add `aria-label="Redo"` and `aria-disabled={!canRedo}`
    - Render `settingsContent` inside the `<SheetContent>` slot so `<FormSettingsPanel>` is passed in from the parent
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 17.4, 17.5_

  - [ ]* 12.2 Write property tests for `BuilderHeader` in `components/form-builder/builder.property.test.ts`
    - **Property 15: Undo/redo aria-disabled reflects state** — for any combination of `canUndo`/`canRedo`, the undo button's `aria-disabled` equals `String(!canUndo)` and the redo button's equals `String(!canRedo)`
    - **Validates: Requirements 17.5**

- [x] 13. Refactor `app/page.tsx` to use `BuilderHeader` and responsive layout
  - [x] 13.1 Wire `BuilderHeader` into `app/page.tsx`
    - Import `BuilderHeader` from `@/components/form-builder/builder-header`
    - Replace the inline `<header>` block with `<BuilderHeader>`, passing all required props
    - Change `updateSettings` import to `updateForm` (or add `updateForm`) from `useFormBuilder`
    - Remove the now-inlined header markup
    - _Requirements: 1.1, 12.1, 12.2, 12.3_

  - [x] 13.2 Implement responsive layout in `app/page.tsx`
    - Add a mobile section (`<div className="md:hidden">`) with `<Tabs>` containing "Fields" and "Config" tab triggers and content panels for `<FieldTypePicker>` and `<FieldConfigPanel>`
    - Add a desktop section (`<div className="hidden md:flex flex-1 overflow-hidden">`) with the existing 3-column layout using `<aside className="w-64 ...">`, `<main className="flex-1 overflow-y-auto overflow-x-hidden ...">`, and `<aside className="w-80 ...">`
    - Add `overflow-x-hidden` to the canvas `<main>` element
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 14. Create the barrel export for form-builder components
  - Create `components/form-builder/index.ts`
  - Export `BuilderHeader`, `ColorPickerField`, `FieldConfigPanel`, `FieldList`, `FieldTypePicker`, `FormPreviewPanel`, `FormSettingsPanel` using named re-exports
  - _Requirements: 12.4_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests use **fast-check** and validate universal correctness properties defined in the design document
- Unit tests validate specific examples, edge cases, and integration points
- Full WCAG 2.1 AA validation requires manual testing with assistive technologies (NVDA, VoiceOver, JAWS) beyond what automated tests can cover
