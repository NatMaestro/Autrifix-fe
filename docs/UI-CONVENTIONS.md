# Autrifix Web UI Conventions

## States

Interactive screens should account for:

- initial loading;
- empty;
- success;
- validation failure;
- server error;
- unauthorized;
- forbidden;
- offline/network failure where relevant.

## Accessibility

Use semantic HTML, keyboard-accessible controls, labels, appropriate focus behavior, and meaningful error messages.

## Responsive behavior

The experience should work across the supported desktop/mobile web breakpoints established by the project.

## Design system

Use existing shared components before creating duplicates.

If a new primitive is required, document why.

## Navigation

Routes should map to meaningful user tasks rather than technical entities where possible.

## UX and backend state

Do not display a state as actionable when the backend would reject the action.

For example, a job that is already completed should not continue showing an "Accept" or "Start" action.
