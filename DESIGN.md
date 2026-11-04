---
name: PeerApply Nexus
colors:
  primary: "#0F172A"
  primaryHover: "#1E293B"
  secondary: "#475569"
  tertiary: "#2563EB"
  accent: "#10B981"
  accentHover: "#059669"
  surface: "#FFFFFF"
  surfaceSubtle: "#F8FAFC"
  surfaceDark: "#0B0F17"
  surfaceDarkCard: "#131B2E"
  neutralBorder: "#E2E8F0"
  neutralBorderDark: "#1E293B"
  textPrimary: "#0F172A"
  textSecondary: "#64748B"
  textPrimaryDark: "#F8FAFC"
  textSecondaryDark: "#94A3B8"
  danger: "#EF4444"
  warning: "#F59E0B"
typography:
  fontFamilySans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  fontFamilyMono: 'JetBrains Mono, "Fira Code", monospace'
  h1:
    fontSize: "2.25rem"
    fontWeight: "700"
    lineHeight: "1.2"
  h2:
    fontSize: "1.5rem"
    fontWeight: "600"
    lineHeight: "1.3"
  h3:
    fontSize: "1.25rem"
    fontWeight: "600"
    lineHeight: "1.4"
  body-md:
    fontSize: "0.9375rem"
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontSize: "0.8125rem"
    fontWeight: "400"
    lineHeight: "1.4"
  label-caps:
    fontSize: "0.75rem"
    fontWeight: "600"
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    border: "1px solid #E2E8F0"
    borderRadius: "16px"
    shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)"
    hoverShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.05)"
  button-primary:
    background: "#2563EB"
    color: "#FFFFFF"
    borderRadius: "10px"
    fontWeight: "600"
  button-applied:
    background: "#10B981"
    color: "#FFFFFF"
    borderRadius: "10px"
    fontWeight: "600"
---

# PeerApply Nexus Design System

A unified visual identity built for high-tempo student collaborative job discovery.

## Design Philosophy

Student job hunts are stressful and fragmented across WhatsApp messages, LinkedIn posts, and image flyers.
**PeerApply** transforms chaos into clarity through three visual design principles:

1. **Information Density with Breathing Room**:
   Job cards highlight critical information immediately: Company, Role, Stipend/Salary, Deadline, and Peer Applications.

2. **Immediate Proof of Action (No Ghost Clicks)**:
   When a student clicks "Apply", the UI delivers instantaneous positive reinforcement:
   - Green confirmation pulse (`#10B981`)
   - Badge transitions from "Apply Now →" to "✓ Applied"
   - Application timestamp is pinned directly on the card
   - Peer counter increments for all connected friends

3. **Multimodal Intelligence at First Glance**:
   Uploaded flyer images and WhatsApp job screenshots are surfaced with high fidelity, AI-extracted tags, and one-click smart autofill.

## Color Rationale

- **Primary Slate (`#0F172A`)**: Provides visual anchor, readability, and authority.
- **Electric Blue (`#2563EB`)**: Guides primary discovery actions and job outbound links.
- **Emerald Pulse (`#10B981`)**: Dedicated exclusively to successful applications and verified status.
- **Warm Subtle Canvas (`#F8FAFC`)**: Softer than stark white, minimizing eye fatigue during long search sessions.
