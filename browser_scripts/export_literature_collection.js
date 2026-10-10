(() => {
  try {
    const stored = localStorage.getItem('artvision-literatura-groups');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return null;
  }
})();
