# ShimmerLoader Components

This directory contains shimmer loading placeholders using the `react-loading-skeleton` library to provide better user experience during content loading.

## Components

- **OnlineUsers_Shimmer**: Complete shimmer for the entire OnlineUsers component
- **UserCard_Shimmer**: Shimmer for individual user cards
- **DashboardSectionContent_Shimmer**: Shimmer for the main dashboard content area
- **DashboardSidebar_Shimmer**: Shimmer for the dashboard sidebar
- **ProfileDetails_Shimmer**: Shimmer for user profile details sections
- **SearchUser_Shimmer**: Shimmer for the search user input
- **UserAvatar_Shimmer**: Shimmer for user avatar images with support for different sizes and status indicators

## Usage

```tsx
import { OnlineUsers_Shimmer, UserAvatar_Shimmer, ShimmerProvider } from './ShimmerLoader/exports';

// Wrap with ShimmerProvider for consistent theming
if (loading) {
  return (
    <ShimmerProvider>
      <OnlineUsers_Shimmer userCount={6} />
    </ShimmerProvider>
  );
}

// For individual avatar loading
if (isLoadingAvatar) {
  return (
    <ShimmerProvider>
      <UserAvatar_Shimmer size="lg" showStatus />
    </ShimmerProvider>
  );
}
```

## Theme

The shimmer components use a consistent theme with:

- Base color: `#f1f5f9` (zinc-100)
- Highlight color: `#e2e8f0` (zinc-200)

This matches the app's overall design system and provides smooth loading animations.
