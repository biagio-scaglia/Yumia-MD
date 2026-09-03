---
title: HomuraJS
theme: default
---

# HomuraJS

Version Control for Application State.

:::notes
Introduce HomuraJS as an immutable, time-travel enabled state architecture.
:::

---

# The Problem

Application state can become difficult to understand and debug.

- Complex state transitions
- Difficult debugging
- Lost state history

---

# The Solution

:::columns ratios="50:50"

:::column
:::card Before

- Mutable state mutation
- Opaque transitions
  :::
  :::

:::column
:::card After

- Linear history graph
- Replayable actions
  :::
  :::

:::

:::notes
Highlight the difference between uncontrolled mutations and deterministic timeline replay.
:::
