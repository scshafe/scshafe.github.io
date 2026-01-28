# Getting Started with This Blog

This post will walk you through how this blog works and how to customize it for your own use.

## Overview

This blog is built with Next.js and features a configurable Views system. Each page is a "view" that can contain various components like titles, markdown content, blog post lists, and more.

## Key Features

### Views System

Views are the building blocks of your site. Each view has:

- A URL path (like `/about` or `/blog`)
- A title and browser title
- A list of components that render on the page

### Components

Available component types include:

- **Title** - Displays the view's title
- **MarkdownEditor** - Editable markdown content
- **List** - Container for Experience, Information, View, MultiMedia, or BlogPost items
- **Experience** - Professional experience entries (used inside List)
- **BlogPost** - Individual blog post reference (used inside List)
- **Information** - Text blocks
- **Alert** - Highlighted info boxes

### Author Mode

Run `npm run author` to start the development server with editing capabilities. You can:

1. Edit page content inline
2. Add/remove/reorder components
3. Configure navigation
4. Customize themes

## Next Steps

1. Explore the Settings page at `/settings`
2. Create your first custom view
3. Write your first blog post
4. Customize your navigation

Happy blogging!
