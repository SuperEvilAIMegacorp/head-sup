# Source Folder Plan

This folder is reserved for the future React/TypeScript frontend.

Recommended structure:

- `app/`: app bootstrap, providers, routes, shell-level configuration.
- `api/`: backend API clients and request helpers.
- `assets/`: imported icons, images, and static source assets.
- `components/`: reusable UI and product components.
- `data/`: mock workflow data and fixtures for frontend-only demos.
- `hooks/`: React hooks.
- `lib/`: utility functions.
- `pages/`: route-level screens for auth, interviewee, and HR.
- `styles/`: Tailwind/global styles.
- `types/`: TypeScript domain models.

Keep role-shaped logic explicit: interviewee pages should not receive HR-only fields from the API adapter.

