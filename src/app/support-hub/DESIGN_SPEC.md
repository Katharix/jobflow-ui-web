# Support Hub Redesign — Design Specification

## Overview
The Support Hub is an internal staff tool (Katharix employees) and a customer-facing live-chat surface for JobFlow clients. This redesign adds a real-time messaging layer on top of the existing ticket/session management system.

---

## 1. Layout Architecture

### Routing Structure
```
/support-hub/
├── auth/                          (existing – staff login/register)
│   ├── login
│   └── register
│
├── auth/customer/                 (NEW – customer identity validation)
│   └── login                     → CustomerLoginComponent
│
├── [Layout: SupportHubLayoutComponent]  (staff only, authGuard)
│   ├── dashboard                  → Enhanced with live queue panel
│   ├── queue                      → NEW: QueueComponent (rep queue view)
│   ├── live-chat/:sessionId       → NEW: LiveChatComponent (rep chat view)
│   ├── tickets
│   ├── sessions
│   ├── organizations
│   ├── billing
│   ├── content
│   ├── people
│   ├── audit-logs
│   └── settings
│
├── [Public: CustomerShellComponent]     (no auth guard – customer-facing)
│   ├── queue-status               → NEW: CustomerQueueStatusComponent
│   └── chat/:sessionId            → NEW: CustomerChatComponent
```

### Views Connected
```
Customer: CustomerLoginComponent
            ↓ (identity validated)
         CustomerQueueStatusComponent   ← polling / SignalR queue position
            ↓ (rep picks up)
         CustomerChatComponent          ← SignalR real-time chat

Rep:     Dashboard (queue snapshot)
            ↓ (via "Live Chat" nav)
         QueueComponent                 ← list of waiting customers
            ↓ (clicks "Pick Up")
         LiveChatComponent              ← full chat with customer sidebar
```

---

## 2. Component Breakdown

### Customer Views

#### `auth/customer-login/`
- Identity validation form (name + email + optional access code)
- Branded, public-facing, welcoming tone
- No sidebar / no staff chrome
- Submits to auth service, receives a customer token

#### `views/queue-status/`
- Full-page waiting screen
- Animated queue position badge
- Estimated wait time countdown
- List of what to expect while waiting
- Auto-redirects to chat when session opens

#### `views/chat/`
- Full-page chat interface (no sidebar nav)
- Uses `<app-chat-window>` shared component
- Header: agent name + status indicator + sound toggle
- File upload button + drag-and-drop overlay
- Mobile-first, occupies 100vh

### Staff/Rep Views

#### `views/dashboard/` (enhanced)
- **New panel**: Live Chat Queue — shows top 3 queued customers with wait time
- Existing metric cards remain unchanged
- "View full queue" link to `/support-hub/queue`

#### `views/queue/` (new)
- Full list of all queued customers
- Each row is a `<app-queue-card>`
- Toolbar: count badge, average wait time stat, filter/sort
- Empty state with illustration

#### `views/live-chat/` (new – rep chat session)
- Three-column layout:
  - Left (280px): queue mini-panel — other waiting customers
  - Center (flex): chat area using `<app-chat-window>`
  - Right (320px): customer info sidebar — name, org, session metadata

### Shared Components

#### `components/chat-window/`
- Inputs: `messages`, `isTyping`, `soundEnabled`, `canUpload`, `perspective` (`'customer'|'rep'`)
- Message bubbles: outbound right (primary blue), inbound left (gray)
- File attachment previews inline
- Drag-and-drop upload overlay
- Typing indicator (animated dots)
- Sound toggle button in header

#### `components/queue-card/`
- Inputs: `customer` (name, org, avatar), `waitMinutes`, `position`
- Shows: avatar circle, name + org, wait badge, "Pick Up" CTA button
- Compact variant for dashboard panel

### Live-Chat Sub-components

#### `chat-messages/` — message bubble list + skeleton loader
#### `chat-input/` — textarea + file upload button + send button
#### `chat-queue/` — mini queue panel (compact queue cards)
#### `chat-sidebar/` — customer/session info panel
#### `typing-indicator/` — animated "…" typing dots

---

## 3. Color Palette & Typography

### Colors (from design system `_variables.scss`)
| Token | Value | Usage |
|---|---|---|
| `--jf-accent` | `#3F67DA` | Primary actions, links, customer bubbles |
| `--jf-accent-soft` | `#8595D1` | Secondary, hover states |
| `--jf-success` | `#2D898B` | Online/available status |
| `--jf-warning` | `#FFA630` | Wait time badge, pending |
| `--jf-danger` | `#E03616` | Errors, disconnect |
| `--jf-ink` | `#000000` | Primary text |
| `--jf-muted` | `#6E7180` | Secondary/supporting text |
| Surface | `#FAFBFF` | Page background |
| Card | `#ffffff` | Cards, panels |
| Border | `rgba(188,191,204,0.2)` | Subtle separators |

### Typography
- **Font**: Manrope (Google Fonts, loaded globally)
- **Headings**: 700 weight (Bold)
- **Labels / nav / buttons**: 600 weight (SemiBold)
- **Body**: 400 weight (Regular)
- **Muted / timestamps**: 400–500 weight, `0.75rem`

### Sizing
- Card border-radius: `14px`
- Button border-radius: `12px`
- Input border-radius: `12px`
- Chat bubble border-radius: `18px 18px 4px 18px` (outbound) / `18px 18px 18px 4px` (inbound)
- Avatar circles: `36px` (queue cards), `34px` (sidebar)

---

## 4. UX Flows

### Customer: Join Queue → Wait → Chat
1. Customer opens invite link → `CustomerLoginComponent`
2. Fills name + email → click "Join Support Queue"
3. Redirected to `CustomerQueueStatusComponent` — sees position #N, ETA
4. When rep picks up → automatic redirect to `CustomerChatComponent`
5. Chat opens with agent greeting message
6. Customer can: type messages, attach files, toggle notification sound
7. Chat ends: session-ended state shown in chat window

### Rep: View Queue → Pick Customer → Chat
1. Rep sees "Live Chat Queue" panel on dashboard — "N waiting"
2. Clicks "View full queue" → `QueueComponent`
3. Sees all customers with wait times, oldest first
4. Clicks "Pick Up" on a card → navigated to `/support-hub/live-chat/:sessionId`
5. `LiveChatComponent` opens: customer info on right, chat center, queue on left
6. Rep types, sends files, sees typing indicator
7. Rep can click another customer in left queue panel to switch sessions

---

## 5. File Upload UX
- Chat input bar has a **paperclip icon button** (left of text input)
- Clicking opens OS file picker (images, PDFs, documents)
- Accepted types shown in tooltip: `image/*, .pdf, .doc, .docx`
- Max file size: 10 MB (shown in placeholder / tooltip)
- While uploading: progress bar replaces the file name in the bubble
- Drag-and-drop overlay appears when user drags file over the chat area:
  - Semi-transparent backdrop `rgba(63,103,218,0.08)` with dashed blue border
  - "Drop files here" centered text

---

## 6. Notification Sound UX
- Chat header shows a **bell icon button** (muted/unmuted states)
- Default: sound **enabled** (`ti-bell`)
- When muted: `ti-bell-off` with a line-through visual indicator
- On new inbound message (while enabled): plays a short tone via `new Audio()`
- State persists in `localStorage` key `jf_chat_sound`
- ARIA label: "Toggle message notifications" — announces current state

---

## 7. Skeleton Loaders
Used for async data loading states:
- `sh-skeleton` — animated shimmer bar (`@keyframes sh-shimmer`)
- Used in: queue list, message list, customer sidebar
- Widths vary (60%, 80%, 45%) to feel realistic

---

## 8. Accessibility
- [ ] All interactive elements have visible focus rings (`outline: 2px solid var(--jf-accent)`)
- [ ] Color contrast ≥ 4.5:1 for all text on backgrounds
- [ ] Icons paired with aria-labels or tooltip text
- [ ] Touch targets ≥ 44×44px (especially chat controls on mobile)
- [ ] Sound toggle has `aria-pressed` and `aria-label`
- [ ] File upload button has accessible label
- [ ] Typing indicator announced to screen readers via `aria-live="polite"`

---

## 9. Responsive Breakpoints
| Breakpoint | Layout Change |
|---|---|
| `< 576px` | Customer chat goes full viewport; queue hidden |
| `< 768px` | Rep live-chat: queue panel + sidebar collapse to icons |
| `< 992px` | Rep live-chat: sidebar hides; single column |
| `≥ 992px` | Full three-column live-chat layout |

---

## 10. Nav Update Required (Engineer Action)
Add to `SupportHubLayoutComponent.navGroups` (in `.ts` file):
```ts
// Under 'Operations' group:
{ label: 'Live Chat', route: '/support-hub/queue', icon: 'ti ti-messages' },
```
