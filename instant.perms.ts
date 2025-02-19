// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

// Note:
// For production apps you should use more restrictive permissions
// But for this quick start example we'll allow anyone to view, upload,
// and delete files
const rules = {
  "$files": {
    "allow": {
      "view": "true",
      "create": "true",
      "delete": "true",
    }
  }
} satisfies InstantRules;

export default rules;
