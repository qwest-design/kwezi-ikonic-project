# WordPress as the content source

The site reads Projects, Clients, Team members and the Proof numbers from a
headless WordPress install through WPGraphQL. Pages are statically generated and
cached until WordPress says something changed. Without `WORDPRESS_GRAPHQL_URL`
the site uses the typed files in `src/content`, so local development needs no CMS.

## 1. Plugins

- **WPGraphQL**
- **Advanced Custom Fields** (Pro, for the repeater, gallery and options page)
- **WPGraphQL for ACF**

## 2. Post types

Create three post types (ACF > Post Types), each with **Show in GraphQL** on and
**Page attributes** support so the Order field sets the order on the site.

| Post type key | GraphQL single / plural | Used for |
| --- | --- | --- |
| `project` | `project` / `projects` | Case studies and Home selected work |
| `client` | `client` / `clients` | Client logo wall (Home, Studio) |
| `teammember` | `teamMember` / `teamMembers` | Studio team grid |

The post **title** is the project title, client name and team member name. The
project **slug** becomes the URL: `/work/<slug>`.

## 3. Field groups

Turn on **Show in GraphQL** for each group and use these GraphQL field names
exactly, because the site's queries ask for them (`src/lib/content.ts`).

**projectFields** (on `project`)

| Field | Type | Notes |
| --- | --- | --- |
| `client` | Text | |
| `year` | Text | |
| `disciplines` | Checkbox | Choices exactly: Strategy, Identity, Digital, Motion |
| `summary` | Text | One line for cards and list rows |
| `hero` | Image | |
| `challenge` | Textarea | |
| `ideaLine` | Text | The idea, set large |
| `ideaBody` | Textarea | |
| `craftMedia` | Gallery | In order: lead image, spread back, spread middle, spread front, closing image |
| `craftCaption` | Text | |
| `results` | Repeater: `value` (Text), `label` (Text) | Two to four; value is short, e.g. +38% |
| `quote` | Group: `text` (Textarea), `name` (Text), `role` (Text) | Optional |
| `nextProject` | Relationship to `project`, max 1 | Optional; defaults to the next in order |

**clientFields** (on `client`): `logo` (Image, SVG or PNG), `caseStudy`
(Relationship to `project`, max 1, optional; makes the logo link to it).

**teamMemberFields** (on `teammember`): `role` (Text), `portrait` (Image, 4:5).

**Ikonic settings**: an ACF options page with GraphQL type name
`ikonicSettings`, holding the group **settingsFields** with a repeater `proof`:
`value` (Number), `prefix` (Text), `suffix` (Text), `label` (Text). Leave it
empty to hide the Proof section on Home.

## 4. Refresh on publish

1. Pick a long random secret (for example from a password manager).
2. In Vercel, set `WORDPRESS_GRAPHQL_URL` (e.g. `https://cms.example.com/graphql`)
   and `REVALIDATE_SECRET`, then redeploy.
3. Copy `ikonic-revalidate.php` into `wp-content/mu-plugins/` and add to
   `wp-config.php`:

   ```php
   define( 'IKONIC_SITE_URL', 'https://ikonicdesigns.co.za' );
   define( 'IKONIC_REVALIDATE_SECRET', 'the same secret' );
   ```

Saving, trashing or deleting a project, client or team member, or saving the
settings page, now refreshes the affected pages within seconds. To refresh by
hand:

```sh
curl -X POST https://ikonicdesigns.co.za/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H "content-type: application/json" -d '{"tags":["projects"]}'
```

## 5. Images

The image ripple on the work cards draws images in WebGL, which needs the media
host to send `Access-Control-Allow-Origin` for the site's domain. If WordPress
serves uploads from its own domain, add that header for `/wp-content/uploads/`
(most hosts and CDNs have a setting; on Apache, `Header set
Access-Control-Allow-Origin "https://ikonicdesigns.co.za"`). Without it the
images still show; only the ripple is skipped.
