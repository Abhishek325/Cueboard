let loading;
export function loadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google.accounts.oauth2);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => { if (window.google?.accounts?.oauth2) resolve(window.google.accounts.oauth2); else { loading = null; reject(Error('Google sign-in is unavailable.')); } };
    script.onerror = () => { script.remove(); loading = null; reject(Error('Could not load Google sign-in. Check your connection.')); };
    document.head.append(script);
  });
  return loading;
}
