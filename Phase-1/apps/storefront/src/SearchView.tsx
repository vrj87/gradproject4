import { useMemo } from "react";
import { Icon } from "./Icon";
import { MemoriesRow, PhotoGrid, PhotoImg, RememberPromo, TRY_CAFE_CLUE, TryThisCard } from "./PhotoChrome";
import { LIBRARY, peopleInLibrary, placesInLibrary, photosInAlbum, searchLibrary, type LibraryPhoto } from "./data/library";
import { FEATURES } from "./lib/features";

const CATEGORIES = [
  { label: "People", query: "people", icon: "group" },
  { label: "Places", query: "goa", icon: "location_on" },
  { label: "Things", query: "medicine", icon: "category" },
  { label: "Nights", query: "concert", icon: "nightlife" },
  { label: "Screenshots", query: "screenshot", icon: "screenshot_monitor" },
  { label: "Animals", query: "horse", icon: "pets" },
  { label: "Pets", query: "pets", icon: "pets" }
] as const;

export function SearchView({
  query,
  starred,
  selected,
  coverSrc,
  onQuery,
  onOpen,
  onToggleStar,
  onToggleSelect,
  onRemember,
  onClear
}: {
  query: string;
  starred: Set<string>;
  selected: Set<string>;
  coverSrc: string;
  onQuery: (query: string) => void;
  onOpen: (photo: LibraryPhoto, from: LibraryPhoto[]) => void;
  onToggleStar: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onRemember?: (clue?: string) => void;
  onClear?: () => void;
}) {
  const results = useMemo(() => searchLibrary(query), [query]);
  const people = useMemo(() => peopleInLibrary(), []);
  const places = useMemo(() => placesInLibrary(), []);
  const albums = useMemo(() => new Set(results.map((photo) => photo.album)).size, [results]);
  const vague = /cafe|café|vibe|sick|medicine|remember|small|trip|gig|concert|houseboat|firework|rooftop/i.test(query);

  return (
    <div className="search-hub">
      {!query && FEATURES.memoryCueComposer && (
        <>
          <RememberPromo compact coverSrc={coverSrc} onOpen={() => onRemember?.()} />
          <TryThisCard
            onSearch={() => onQuery(TRY_CAFE_CLUE)}
            onRemember={() => onRemember?.(TRY_CAFE_CLUE)}
          />
        </>
      )}
      {query && FEATURES.memoryCueComposer && (
        <aside className="remember-banner">
          <span className="feature-badge">Remember</span>
          <div>
            <b>{vague ? "This sounds like a memory" : "Not the photo?"}</b>
            <p>
              {vague
                ? "Keywords only match words. Remember reconstructs the photo from the vibe, trip, or thing you still recall."
                : "If you remember a vibe or trip instead of this word, open Remember."}
            </p>
          </div>
          <button type="button" className="primary" onClick={() => onRemember?.(query)}>
            <Icon name="auto_awesome" size={18} />
            Remember
          </button>
        </aside>
      )}
      <div className="chips">
        {CATEGORIES.map((item) => (
          <button
            key={item.label}
            type="button"
            className={query === item.query ? "on" : ""}
            onClick={() => onQuery(item.query)}
          >
            <Icon name={item.icon} size={18} filled={query === item.query} />
            {item.label}
          </button>
        ))}
      </div>
      {query && (
        <p className="hint">
          {results.length} word {results.length === 1 ? "match" : "matches"}
          {albums > 1 ? ` across ${albums} albums` : ""} for “{query}”
          {onClear && (
            <>
              {" · "}
              <button type="button" className="text-btn" onClick={onClear} aria-label="Clear search and memory cues">
                Clear
              </button>
            </>
          )}
        </p>
      )}
      {!query && (
        <>
          {FEATURES.photosMemories && (
            <MemoriesRow photos={LIBRARY} onOpen={(photo) => onOpen(photo, photosInAlbum(photo.album))} />
          )}
          {people.length > 0 && (
            <>
              <h2 className="day-title">People</h2>
              <div className="people-row">
                {people.map((person) => (
                  <button
                    key={person.name}
                    className="person"
                    type="button"
                    onClick={() => onQuery(person.name)}
                  >
                    <PhotoImg src={person.cover.src} alt={person.name} />
                    <b>{person.name}</b>
                    <span>{person.count}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {places.length > 0 && (
            <>
              <h2 className="day-title">Places</h2>
              <div className="people-row">
                {places.map((place) => (
                  <button key={place.name} className="person" type="button" onClick={() => onQuery(place.name)}>
                    <PhotoImg src={place.cover.src} alt={place.name} />
                    <b>{place.name}</b>
                    <span>{place.count}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {query && results.length === 0 && (
        <p className="empty-state">
          No word matches for “{query}”.{" "}
          <button type="button" className="chip-link" onClick={() => onRemember?.(query)}>
            Remember
          </button>{" "}
          from a vibe or trip instead.
        </p>
      )}
      {query && (
        <PhotoGrid
          photos={results}
          starred={starred}
          selected={selected}
          onOpen={(photo) => onOpen(photo, results)}
          onToggleStar={onToggleStar}
          onToggleSelect={onToggleSelect}
        />
      )}
    </div>
  );
}
