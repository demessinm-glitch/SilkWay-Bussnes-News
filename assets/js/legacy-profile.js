(function exposeLegacyProfile(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LegacyProfile = api;
})(typeof window === "undefined" ? null : window, () => {
  function resolveLegacyPerson(people, selectedId, slugify) {
    if (!Array.isArray(people) || !selectedId) return null;
    const id = String(selectedId);
    return (
      people.find(
        (person) =>
          String(person.id ?? "") === id || slugify(person.name) === id,
      ) || null
    );
  }

  return { resolveLegacyPerson };
});
