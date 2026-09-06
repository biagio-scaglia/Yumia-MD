# Migration Guide: YumiaMD to Native Yumia

Yumia maintains 100% backward compatibility with existing Markdown presentations (`.yumia.md`) while providing an automated migration path to the cleaner Native Yumia format (`.yumia`).

---

## 1. Automated Migration via Code

You can migrate any Markdown deck to Native Yumia using the `@yumiamd/parser` package:

```typescript
import { readFileSync, writeFileSync } from 'node:fs';
import { migrateMarkdownToNative } from '@yumiamd/parser';

const markdownContent = readFileSync('./deck.yumia.md', 'utf-8');
const nativeContent = migrateMarkdownToNative(markdownContent);

writeFileSync('./deck.yumia', nativeContent, 'utf-8');
console.log('Successfully migrated to Native Yumia syntax!');
```

---

## 2. Syntax Translation Comparison

| Legacy Markdown (`.yumia.md`)                                                                    | Native Yumia (`.yumia`)                                                                |
| :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `---`<br>`title: My Deck`<br>`theme: cyberpunk`<br>`---`                                         | `document "My Deck"`<br>`  theme "cyberpunk"`                                          |
| `---`<br>`# Slide Title`                                                                         | `slide "Slide Title"`                                                                  |
| `:::badge text="v1.0" variant="success" :::`                                                     | `badge "v1.0" variant="success"`                                                       |
| `:::card Title="Card" variant="primary"`<br>`Content`<br>`:::`                                   | `card title="Card" variant="primary"`<br>`  text "Content"`                            |
| `:::metric value="99%" label="Uptime" change="+1%" :::`                                          | `metric "99%" label="Uptime" diff="+1%"`                                               |
| `:::columns 50:50`<br>`:::column`<br>`Left`<br>`:::`<br>`:::column`<br>`Right`<br>`:::`<br>`:::` | `columns 50:50`<br>`  column`<br>`    text "Left"`<br>`  column`<br>`    text "Right"` |
| `:::notes`<br>`Presenter notes`<br>`:::`                                                         | `notes`<br>`  Presenter notes`                                                         |

---

## 3. Backward Compatibility

Both `.yumia` and `.yumia.md` files can be passed interchangeably to the compiler, dev server, and CLI tools:

```bash
# Compile native file
yumia build presentation.yumia --format pptx

# Compile legacy markdown file
yumia build presentation.yumia.md --format pptx
```
