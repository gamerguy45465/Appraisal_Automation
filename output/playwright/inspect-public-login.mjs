// Read-only, unauthenticated route checks; do not collect bodies, credentials, cookies, or header dumps.
const routes = ['https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F', 'https://clients.r3amc.com/', 'https://clients.r3amc.com/Account/Logon?ReturnUrl=%2F'];
const summarize = raw => { const url = new URL(raw); return { origin: url.origin, path: url.pathname, queryKeys: [...url.searchParams.keys()] }; };
for (const route of routes) {
  let current = route;
  for (let hop = 0; hop < 4; hop++) {
    try {
      const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const location = response.headers.get('location');
      const target = location ? new URL(location, current) : null;
      console.info(JSON.stringify({ source: summarize(current), status: response.status, destination: target ? summarize(target.href) : undefined }));
      await response.body?.cancel();
      if (!target || target.origin !== 'https://clients.r3amc.com' || !['/', '/Account/Logon', '/Login.aspx'].includes(target.pathname)) break;
      current = target.href;
    } catch (error) { console.info(JSON.stringify({ source: summarize(current), error: error.name })); break; }
  }
}
