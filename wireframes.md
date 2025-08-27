# RetroLens AI - Wireframes

## Navigation Structure
- **Feed** - Main timeline of colorized photos
- **Discover** - Explore and browse photos
- **My Collection** - User's personal photos and favorites

---

## 1. Feed Page

### Web View
```
┌─────────────────────────────────────────────────────────────────┐
│ [🎯 RetroLens AI]           [Discover] [My Collection] [Profile] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│ │                 │  │                 │  │                 │   │
│ │   Photo Card    │  │   Photo Card    │  │   Photo Card    │   │
│ │                 │  │                 │  │                 │   │
│ │ [B&W] [Color]   │  │ [B&W] [Color]   │  │ [B&W] [Color]   │   │
│ │ @username       │  │ @username       │  │ @username       │   │
│ │ ❤️ 👍 💬 📤      │  │ ❤️ 👍 💬 📤      │  │ ❤️ 👍 💬 📤      │   │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│ │                 │  │                 │  │                 │   │
│ │   Photo Card    │  │   Photo Card    │  │   Photo Card    │   │
│ │                 │  │                 │  │                 │   │
│ │ [B&W] [Color]   │  │ [B&W] [Color]   │  │ [B&W] [Color]   │   │
│ │ @username       │  │ @username       │  │ @username       │   │
│ │ ❤️ 👍 💬 📤      │  │ ❤️ 👍 💬 📤      │  │ ❤️ 👍 💬 📤      │   │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                 │
│                    [Load More]                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│ ☰ RetroLens AI    🔍 👤 │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │                     │ │
│ │    Photo Card       │ │
│ │                     │ │
│ │                     │ │
│ │ [B&W] [Color]       │ │
│ │ @username           │ │
│ │ ❤️ 👍 💬 📤          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │                     │ │
│ │    Photo Card       │ │
│ │                     │ │
│ │                     │ │
│ │ [B&W] [Color]       │ │
│ │ @username           │ │
│ │ ❤️ 👍 💬 📤          │ │
│ └─────────────────────┘ │
│                         │
│        [Load More]      │
│                         │
│ ┌─────────────────────┐ │
│ │ Feed | Discover | My│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 2. Discover Page

### Web View
```
┌─────────────────────────────────────────────────────────────────┐
│ [🎯 RetroLens AI]           [Discover] [My Collection] [Profile] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 [Search photos, users, tags...]              [Filter ⚙️] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Categories: [All] [Portraits] [Landscapes] [Street] [Vintage]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sort by: [Most Recent] [Most Popular] [Best Quality] [Random]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│ │       │ │       │ │       │ │       │ │       │ │       │   │
│ │ Photo │ │ Photo │ │ Photo │ │ Photo │ │ Photo │ │ Photo │   │
│ │  Grid │ │  Grid │ │  Grid │ │  Grid │ │  Grid │ │  Grid │   │
│ │       │ │       │ │       │ │       │ │       │ │       │   │
│ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │   │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│                                                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│ │       │ │       │ │       │ │       │ │       │ │       │   │
│ │ Photo │ │ Photo │ │ Photo │ │ Photo │ │ Photo │ │ Photo │   │
│ │  Grid │ │  Grid │ │  Grid │ │  Grid │ │  Grid │ │  Grid │   │
│ │       │ │       │ │       │ │       │ │       │ │       │   │
│ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │ │   ❤️   │   │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│                                                                 │
│                         [Load More]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│ ☰ Discover       🔍 👤  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🔍 Search...    ⚙️  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ [All] [Portraits]   │ │
│ │ [Landscapes][Street]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Sort: [Recent] [Pop]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────┬─────────┐   │
│ │         │         │   │
│ │  Photo  │  Photo  │   │
│ │   Grid  │   Grid  │   │
│ │         │         │   │
│ │    ❤️    │    ❤️    │   │
│ └─────────┴─────────┘   │
│                         │
│ ┌─────────┬─────────┐   │
│ │         │         │   │
│ │  Photo  │  Photo  │   │
│ │   Grid  │   Grid  │   │
│ │         │         │   │
│ │    ❤️    │    ❤️    │   │
│ └─────────┴─────────┘   │
│                         │
│        [Load More]      │
│                         │
│ ┌─────────────────────┐ │
│ │ Feed | Discover | My│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 3. My Collection Page

### Web View
```
┌─────────────────────────────────────────────────────────────────┐
│ [🎯 RetroLens AI]           [Discover] [My Collection] [Profile] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 My Collection                          [+ Upload Photo]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Tabs: [My Photos] [Favorites] [Processing] [Drafts]         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ View: [Grid] [List]    Sort: [Recent] [Oldest] [Name] [Size]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │           │ │           │ │           │ │           │       │
│ │   Photo   │ │   Photo   │ │   Photo   │ │   Photo   │       │
│ │  Thumb    │ │  Thumb    │ │  Thumb    │ │  Thumb    │       │
│ │           │ │           │ │           │ │           │       │
│ │ [Edit]    │ │ [Edit]    │ │ [Edit]    │ │ [Edit]    │       │
│ │ [Delete]  │ │ [Delete]  │ │ [Delete]  │ │ [Delete]  │       │
│ │ [Share]   │ │ [Share]   │ │ [Share]   │ │ [Share]   │       │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                 │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │           │ │           │ │           │ │           │       │
│ │   Photo   │ │   Photo   │ │   Photo   │ │   Photo   │       │
│ │  Thumb    │ │  Thumb    │ │  Thumb    │ │  Thumb    │       │
│ │           │ │           │ │           │ │           │       │
│ │ [Edit]    │ │ [Edit]    │ │ [Edit]    │ │ [Edit]    │       │
│ │ [Delete]  │ │ [Delete]  │ │ [Delete]  │ │ [Delete]  │       │
│ │ [Share]   │ │ [Share]   │ │ [Share]   │ │ [Share]   │       │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                 │
│                         [Load More]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│ ☰ My Collection    👤 + │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ [My Photos][Favs]   │ │
│ │ [Processing][Drafts]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ View: [Grid] [List] │ │
│ │ Sort: [Recent] [Old]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────┬─────────┐   │
│ │         │         │   │
│ │  Photo  │  Photo  │   │
│ │  Thumb  │  Thumb  │   │
│ │         │         │   │
│ │ ✏️ 🗑️ 📤  │ ✏️ 🗑️ 📤  │   │
│ └─────────┴─────────┘   │
│                         │
│ ┌─────────┬─────────┐   │
│ │         │         │   │
│ │  Photo  │  Photo  │   │
│ │  Thumb  │  Thumb  │   │
│ │         │         │   │
│ │ ✏️ 🗑️ 📤  │ ✏️ 🗑️ 📤  │   │
│ └─────────┴─────────┘   │
│                         │
│        [Load More]      │
│                         │
│ ┌─────────────────────┐ │
│ │ Feed | Discover | My│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## Component Details

### Photo Card Components
- **Before/After Toggle**: Switch between B&W and colorized versions
- **User Attribution**: Username and profile link
- **Interaction Bar**: Like, thumbs up, comment, share buttons
- **Metadata**: Upload date, processing status, tags

### Navigation Components
- **Top Navigation Bar**: Logo, main navigation links, user profile
- **Mobile Bottom Tab Bar**: Quick access to main sections
- **Search Bar**: Global search with filters
- **Filter Controls**: Category, sort, and view options

### Action Components
- **Upload Button**: Prominent call-to-action for new photos
- **Load More**: Infinite scroll trigger
- **Edit Controls**: Photo management actions
- **Share Options**: Social media and direct sharing

### Responsive Breakpoints
- **Desktop**: 1024px+ (3-column grid)
- **Tablet**: 768px-1023px (2-column grid)
- **Mobile**: 767px and below (1-column stack)

---

## Key Features by Page

### Feed
- Timeline of all colorized photos
- Social interactions (likes, comments)
- Before/after comparisons
- Infinite scroll loading

### Discover
- Search and filter functionality
- Category-based browsing
- Grid view for quick scanning
- Popular and trending content

### My Collection
- Personal photo management
- Upload and processing status
- Organization tools (tabs, sorting)
- Edit and sharing capabilities
