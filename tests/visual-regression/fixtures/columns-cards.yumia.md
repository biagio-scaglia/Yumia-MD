document "Golden Fixture — Columns & Cards"
  theme "corporate"
  aspectRatio "16:9"

slide "Content"
  heading "Standard content with columns"
  columns ratios="50:50"
    column
      card title="Left Column" variant="primary"
        text "Short supporting paragraph with **bold** and *italic* emphasis."
        list
          Item one
          Item two with a slightly longer label
    column
      card title="Right Column" variant="accent"
        text "Second column content for balance and density checks."
        quote author="QA"
          Layout should remain aligned across formats.
