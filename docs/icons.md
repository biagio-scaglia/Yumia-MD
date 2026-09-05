# Multi-Provider Icon System

Yumia provides a first-class icon abstraction layer managed by the `@yumiamd/renderer` package.

---

## 1. Syntax

Icons can be authored in Native Yumia (`.yumia`) or Markdown directives (`.yumia.md`):

### Native Syntax

```yumia
icon "lucide:rocket" size=32 color="#00F0FF"
icon "material:shield" size=28
icon "fa:github"
icon "tabler:activity"
icon "heroicons:sparkles"
```

### Markdown Syntax

```markdown
:::icon lucide:rocket size=32 color="#00F0FF" :::
:::icon material:shield size=28 :::
```

---

## 2. Supported Icon Providers

Yumia uses standard prefix namespacing:

| Prefix       | Provider          | Example                                                |
| :----------- | :---------------- | :----------------------------------------------------- |
| `lucide:`    | Lucide Icons      | `lucide:rocket`, `lucide:layers`, `lucide:cpu`         |
| `material:`  | Material Symbols  | `material:rocket`, `material:shield`, `material:home`  |
| `fa:`        | Font Awesome      | `fa:shield`, `fa:github`, `fa:code`                    |
| `tabler:`    | Tabler Icons      | `tabler:activity`, `tabler:terminal`, `tabler:palette` |
| `heroicons:` | Heroicons         | `heroicons:sparkles`, `heroicons:check`                |
| _(default)_  | Fallback / Custom | `rocket`, `database`, `custom-name`                    |

---

## 3. Resolution & Fallback Architecture

```text
Yumia Source (e.g. "lucide:rocket")
              │
              ▼
   defaultIconResolver.resolve(name, options)
              │
     ┌────────┴────────┐
     ▼                 ▼
Cache Hit?         Provider Registry Match?
 ├─ Yes: Return     ├─ Yes: Cache & Return
 └─ No: Continue    └─ No: Fallback Generator
                             │
                             ▼
                    Stylized Vector Glyph
```

- **Strict Mode**: `strict: true` throws a descriptive compilation error if an icon definition is not registered.
- **Lenient Mode (Default)**: Automatically generates a clean vector monogram glyph (e.g. circled initial character) preventing build failures when an icon name is misspelled or unavailable.

---

## 4. Programmatic Icon Resolver API

```typescript
import { defaultIconResolver, IconResolver } from '@yumiamd/renderer';

// Resolve an icon definition
const def = defaultIconResolver.resolve('lucide:rocket');
console.log(def.path); // SVG inner path string

// Render direct SVG markup
const svg = defaultIconResolver.toSvg('lucide:rocket', 32, '#00F0FF', 'my-icon-class');

// Register custom icons or custom providers
const customResolver = new IconResolver();
customResolver.register('custom:logo', {
  name: 'logo',
  provider: 'custom',
  viewBox: '0 0 100 100',
  path: '<circle cx="50" cy="50" r="40" fill="currentColor"/>',
});
```
