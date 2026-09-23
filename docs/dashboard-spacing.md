# Dashboard spacing and layout

The user, trainer and admin dashboards share spacing tokens in `src/index.css` and the desktop navigation component `DashboardSidebar.tsx`.

| Token / utility suffix | Pixels | Use |
| --- | --- | --- |
| tiny | 4 | Icon/text detail |
| tight | 8 | Tight groups |
| small | 12 | Small groups and navigation padding |
| standard | 16 | Controls and mobile page gutters |
| card | 24 | Card padding |
| section | 32 | Section separation and desktop gutters |
| large | 40 | Large separation and page bottom padding |
| major | 48 | Major separation |
| page | 64 | Page-level separation |

Use utilities such as `p-card`, `space-y-section`, and `gap-standard`, or equivalent Tailwind numeric values on this scale. Do not introduce arbitrary spacing values for individual cards. Typography, icon sizes, borders and corner radii are separate from the spacing scale.

Desktop navigation is 256px wide, collapses to 80px, and scrolls independently on shorter screens. Collapsed links retain accessible names and hover titles. The sticky top navbar is 68px high. Page titles, KPIs, main content and activity live below it in the main content area.

Main content is centered with a 1440px maximum outer width. At the 1024px desktop breakpoint, padding is 28px top, 32px sides, and 40px bottom. The requested 28px top inset and 68px navbar are explicit layout exceptions. On smaller screens, the sidebar is replaced by the menu button and page padding is 24px top, 16px sides, and 40px bottom.

Browser checks cover all three roles on desktop/mobile, collapsed navigation, mobile menus, notification positioning, wide-screen centering and horizontal overflow down to 320px. Screenshots are saved in each layout test's output directory under `test-results/`.
