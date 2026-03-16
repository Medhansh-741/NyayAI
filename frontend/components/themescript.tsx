export function ThemeScript() {
  const code = `
(function() {
  try {
    var key = 'theme-preference';
    var stored = localStorage.getItem(key);
    var isValid = stored === 'light' || stored === 'dark' || stored === 'system';
    var pref = isValid ? stored : 'system';
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;

    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}