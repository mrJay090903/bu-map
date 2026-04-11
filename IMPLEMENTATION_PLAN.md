# BU Map App - Implementation Plan

## 1) Goal

Build a responsive map app using OpenStreetMap where users can:

- Set a destination by typing where they want to go.
- View route from current location to destination.
- Follow clear step-by-step turn instructions.

Map default center (from provided URL):

- Latitude: 13.295708
- Longitude: 123.485985
- Zoom: 18

## 2) Core User Experience

Primary flow:

1. User opens app and sees map centered on the provided location.
2. User allows location access.
3. User enters destination in search input.
4. User picks one result from suggestions.
5. App draws route and opens step-by-step instructions panel.
6. User can start navigation mode and follow each step.
7. User can re-route anytime when destination changes.

UX priorities:

- Fast first interaction (search input visible immediately).
- High map readability (controls do not block map).
- Sticky bottom sheet for route steps on mobile.
- One-tap actions: Use my location, Clear route, Swap start/destination.
- Explicit states: loading, no results, route failure, location denied.

## 3) Technical Stack

Frontend:

- React + TypeScript (existing)
- Tailwind CSS (to be added)
- React Leaflet + Leaflet for OpenStreetMap rendering

Map/routing services:

- Geocoding: Nominatim (OpenStreetMap)
- Routing: OSRM public API (driving profile first), optional switch to foot profile if needed

Why this stack:

- Fully OSM-compatible
- No paid key needed for MVP
- Good compatibility with web map UI patterns

## 4) Architecture and Components

App structure:

- MapShell (root layout, mobile/desktop orchestration)
- TopSearchBar (destination input + suggestion list)
- MapCanvas (OSM tile layer, user marker, destination marker, route polyline)
- RoutePanel (distance, ETA, turn-by-turn instructions)
- FloatingControls (locate me, clear, recenter)
- StatusBanner (permission/API errors)

State model:

- userPosition: lat/lon
- destination: selected geocoded point
- suggestions: geocoder results
- route: geometry + summary + steps
- uiState: loading/error/idle per feature

## 5) API and Data Flow

Geocode destination:

- Trigger on debounced input (400-500ms).
- Request Nominatim search endpoint.
- Show top 5 results.
- On selection, store destination coordinates.

Route calculation:

- Input: start (userPosition) + destination.
- Request OSRM route endpoint with steps enabled.
- Parse:
  - polyline geometry for map
  - total distance and duration
  - each navigation step (maneuver, road name, distance)

Instruction formatting:

- Convert technical maneuver types to user-friendly text.
- Example: "Turn right onto Rizal Street in 120 m".

## 6) UI Design Direction (Tailwind)

Design language:

- Clean map-first layout
- Light mode default with strong contrast
- Rounded cards and subtle glass surface overlays
- Blue/cyan accents for active route and buttons

Key UI elements:

- Top search card with autocomplete dropdown
- Floating action cluster on right side
- Bottom route sheet with drag handle (mobile)
- Left side route panel (desktop)

Accessibility:

- Keyboard support in suggestions (arrow keys + Enter)
- Touch targets >= 44px
- ARIA labels on map controls and route actions
- Color contrast at WCAG AA minimum

## 7) Implementation Phases

Phase 1 - Foundation

- Install Tailwind and configure global styles.
- Add React Leaflet + Leaflet dependencies.
- Replace starter UI with map shell.

Phase 2 - Map and Location

- Render OSM map at provided center/zoom.
- Add user geolocation with permission handling.
- Add markers for user and selected destination.

Phase 3 - Search and Destination

- Build destination input with debounce.
- Connect Nominatim API and suggestion list.
- Handle empty/no-result/error states.

Phase 4 - Route and Steps

- Connect OSRM route API.
- Draw polyline route on map.
- Build turn-by-turn step list with distance + ETA summary.

Phase 5 - UX Polish

- Improve responsiveness and transitions.
- Add recenter, clear route, and loading skeletons.
- Add graceful fallbacks if geolocation fails.

Phase 6 - Validation

- Manual test on mobile + desktop.
- Verify route and instructions for nearby sample destinations.
- Check performance and accessibility.

## 8) Pencil MCP Design Plan (Optional but Recommended)

Design outputs to create in .pen:

- Screen A: Home map idle state
- Screen B: Destination typing + suggestion dropdown
- Screen C: Active route + expanded step-by-step panel
- Screen D: Error states (location denied, no route)

Pencil workflow:

1. Create a new .pen document for BU Map.
2. Build reusable components:
   - Search bar
   - Suggestion item
   - Route summary card
   - Step instruction row
   - Floating action button
3. Compose desktop and mobile variants.
4. Export screenshots for implementation reference.
5. Use screenshot parity checks during UI build.

## 9) Risks and Mitigations

Risk: Public endpoint limits/rate limits.
Mitigation: Add debounce + local cache for identical queries.

Risk: Inconsistent geocoding text quality.
Mitigation: Normalize labels and prioritize nearby/region-biased results.

Risk: Geolocation denied by user.
Mitigation: Allow manual start point fallback in future iteration.

## 10) Definition of Done

The app is done when:

- Map loads with the specified default center.
- User can search destination and select from suggestions.
- Route is drawn between current location and destination.
- Step-by-step instructions are visible and understandable.
- Layout works well on mobile and desktop.
- Built with Tailwind and integrated into the current Vite codebase.

## 11) Next Implementation Step

Start Phase 1 and Phase 2 in one coding pass:

- Setup Tailwind
- Add map shell and geolocation
- Commit first working map baseline
