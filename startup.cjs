'use strict';

// iisnode's CommonJS loader enters here; the application itself remains an ES module.
import('./dist/server.js').catch(() => {
  console.error('Appraisal Desk could not start. Check the build, Node.js version, PORT, APPRAISAL_PUBLIC_ORIGIN and APPRAISAL_ACCESS_KEY settings.');
  process.exitCode = 1;
});
