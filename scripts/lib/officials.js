function sourceBackedId(person) {
  const value =
    person?.id || person?.biographyUrl?.match(/\/people\/(\d+)/)?.[1] || "";
  return /^\d+$/.test(String(value)) ? Number(value) : null;
}

function backfillStableIds(payload) {
  const people = Array.isArray(payload?.people) ? payload.people : [];
  return {
    ...payload,
    people: people.map((person) => {
      const id = sourceBackedId(person);
      if (!id) {
        throw new Error(
          `Official ${person.name || "unknown"} has no source-backed id`,
        );
      }
      return { ...person, id };
    }),
  };
}

module.exports = { backfillStableIds, sourceBackedId };
