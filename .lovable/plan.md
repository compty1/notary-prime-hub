

# Plan: Simplify KBA — SignNow Handles It

Since KBA is fully handled within SignNow's platform during the RON session, we need to remove the separate KBA provider configuration UI and the placeholder KBA verification component, and update references to clarify that KBA is managed through SignNow.

## Changes

### 1. `src/pages/admin/AdminSettings.tsx`
- Remove the "KBA Provider Configuration" collapsible section (the dropdown for IDology/Evident/LexisNexis and API key fields)
- Replace with a simple read-only note: "KBA is handled natively within SignNow during RON sessions. No additional configuration required."
- Keep the compliance checklist item but hardcode it as "SignNow built-in" with a green check

### 2. `src/pages/admin/AdminIntegrationTest.tsx`
- Remove `signnow_kba_provider` from the SignNow integration settings array
- Update the SignNow description to note KBA is included natively

### 3. `src/components/KBAVerification.tsx`
- Remove the placeholder warning banner ("Connect IDology or Evident API for production KBA")
- Update the component to show a message that KBA is conducted within the SignNow platform during the live session, not as a separate step in this app
- Keep the component for informational/UI purposes but remove the simulated question flow

### 4. `src/pages/RonInfo.tsx`
- Keep the KBA provider list as educational content but add a note that NotarDex uses SignNow's built-in KBA

## No database changes needed

