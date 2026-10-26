# Lessons
- Horizontal rows with 2+ items (icon + text, label + value, badge + meta) use align-items:center on the tallest item. Never align-items:flex-start/baseline with margin-top/padding-top nudges. Enforced in build by src/align_rows.py.
- Score ring colour follows the bands: red <=18, red->orange 19-24, orange 25-43, orange->yellow 44-49, yellow 50-68, yellow->green 69-74, green >=75.
