# Known Bugs

## Input Prompt Resets on Resize or Backspace

**Status:** Open  
**Affects:** All platforms  
**Introduced:** v1.1.0

### Description

While in the chat, two interactions cause the styled input prompt to reset
to the default terminal style:

- **Resizing the terminal window** - the prompt reverts from `[username]:`
  to the default `>` style and loses its magenta color
- **Pressing backspace** - the prompt briefly breaks layout and loses styling

### Root Cause

Node.js `readline` listens for terminal resize events and redraws its own
internal prompt independently, overwriting the custom styled prompt written
directly to stdout.
