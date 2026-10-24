const box = document.getElementById('enabled');
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => { box.checked = enabled; });
box.addEventListener('change', async () => {
  await chrome.storage.sync.set({ enabled: box.checked });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.reload(tab.id);
});
