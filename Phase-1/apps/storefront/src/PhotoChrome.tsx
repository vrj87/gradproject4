import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fullSrc, type LibraryPhoto } from "./data/library";
import { photoLabel } from "./data/labels";
import { Icon } from "./Icon";

const PHOTO_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="#e8eaed" width="400" height="400"/><text x="50%" y="54%" text-anchor="middle" fill="#80868b" font-family="Arial,sans-serif" font-size="22">Photo</text></svg>'
  );

export function PhotoImg({ src, alt }: { src: string; alt: string }) {
  const [uri, setUri] = useState(src);
  useEffect(() => {
    setUri(src);
  }, [src]);
  return <img src={uri} alt={alt} referrerPolicy="no-referrer" onError={() => setUri(PHOTO_FALLBACK)} />;
}

export function RememberPromo({
  coverSrc,
  onOpen,
  compact = false
}: {
  coverSrc: string;
  onOpen: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <aside className="remember-banner">
        <span className="feature-badge">New</span>
        <div>
          <b>Remember</b>
          <p>Find a photo from a vibe, a trip, or a thing — even if you forgot the date.</p>
        </div>
        <button type="button" className="primary" onClick={onOpen}>
          <Icon name="auto_awesome" size={18} />
          Remember
        </button>
      </aside>
    );
  }
  return (
    <section className="memory-hero remember-hero" onClick={onOpen}>
      <PhotoImg src={coverSrc} alt="" />
      <div>
        <span className="feature-badge">New</span>
        <h2>Remember a photo</h2>
        <p>
          Say what you still recall — a small café on a trip, medicine from when you were sick, purple
          lights at a gig. Photos will group what matches. No date or album needed.
        </p>
        <button
          type="button"
          className="primary"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <Icon name="auto_awesome" size={18} />
          Remember
        </button>
      </div>
    </section>
  );
}

export const TRY_CAFE_CLUE = "small cafe on that trip";

export function TryThisCard({
  onSearch,
  onRemember
}: {
  onSearch: () => void;
  onRemember: () => void;
}) {
  return (
    <aside className="try-this">
      <span className="feature-badge">Try this</span>
      <div>
        <b>Find the small café from that trip</b>
        <p>You remember the vibe. You don’t have the date or the town. Try keywords first, then Remember.</p>
      </div>
      <div className="try-this-actions">
        <button type="button" className="text-btn" onClick={onSearch}>
          <Icon name="search" size={18} />
          Search
        </button>
        <button type="button" className="primary" onClick={onRemember}>
          <Icon name="auto_awesome" size={18} />
          Remember
        </button>
      </div>
    </aside>
  );
}

export function PhotoTile({
  photo,
  starred,
  selected,
  selectMode,
  onOpen,
  onToggleStar,
  onToggleSelect
}: {
  photo: LibraryPhoto;
  starred: boolean;
  selected: boolean;
  selectMode: boolean;
  onOpen: (photo: LibraryPhoto) => void;
  onToggleStar: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className={`tile-card ${selected ? "selected" : ""}`}>
      <button
        className="tile"
        type="button"
        aria-label={photoLabel(photo)}
        title={photoLabel(photo)}
        onClick={() => (selectMode ? onToggleSelect(photo.id) : onOpen(photo))}
      >
        <PhotoImg src={photo.src} alt="" />
      </button>
      <button
        type="button"
        className={`tile-check ${selected || selectMode ? "show" : ""}`}
        aria-label={selected ? "Deselect" : "Select"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleSelect(photo.id);
        }}
      >
        {selected ? <Icon name="check" size={18} filled /> : null}
      </button>
      <button
        type="button"
        className={`tile-star ${starred ? "on" : ""}`}
        aria-label={starred ? "Unstar" : "Star"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleStar(photo.id);
        }}
      >
        <Icon name="star" size={18} filled={starred} />
      </button>
    </div>
  );
}

export function PhotoGrid({
  photos,
  starred,
  selected,
  onOpen,
  onToggleStar,
  onToggleSelect
}: {
  photos: LibraryPhoto[];
  starred: Set<string>;
  selected: Set<string>;
  onOpen: (photo: LibraryPhoto) => void;
  onToggleStar: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  const selectMode = selected.size > 0;
  return (
    <div className="mosaic">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          starred={starred.has(photo.id)}
          selected={selected.has(photo.id)}
          selectMode={selectMode}
          onOpen={onOpen}
          onToggleStar={onToggleStar}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

export function SelectBar({
  count,
  onClear,
  onShare,
  onStar,
  onRemember
}: {
  count: number;
  onClear: () => void;
  onShare: () => void;
  onStar?: () => void;
  onRemember?: () => void;
}) {
  if (!count) return null;
  return (
    <div className="select-bar" role="toolbar" aria-label="Selection">
      <button type="button" className="icon-btn" onClick={onClear} aria-label="Clear selection">
        <Icon name="close" />
      </button>
      <b>{count} selected</b>
      <span className="select-spacer" />
      {onStar && (
        <button type="button" className="text-btn" onClick={onStar}>
          <Icon name="star" size={20} />
          Star
        </button>
      )}
      {onRemember && (
        <button type="button" className="text-btn" onClick={onRemember}>
          <Icon name="image_search" size={20} />
          Photos like this
        </button>
      )}
      <button type="button" className="text-btn" onClick={onShare}>
        <Icon name="ios_share" size={20} />
        Share
      </button>
    </div>
  );
}

export function Lightbox({
  photo,
  sequence,
  starred,
  onClose,
  onChange,
  onToggleStar,
  extraActions
}: {
  photo: LibraryPhoto;
  sequence: LibraryPhoto[];
  starred: boolean;
  onClose: () => void;
  onChange: (photo: LibraryPhoto) => void;
  onToggleStar: (id: string) => void;
  extraActions?: ReactNode;
}) {
  const [info, setInfo] = useState(false);
  const [toast, setToast] = useState("");
  const index = Math.max(0, sequence.findIndex((item) => item.id === photo.id));
  const prev = sequence[index - 1];
  const next = sequence[index + 1];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && prev) onChange(prev);
      if (event.key === "ArrowRight" && next) onChange(next);
      if (event.key === "f" || event.key === "F") onToggleStar(photo.id);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [photo.id, prev, next, onClose, onChange, onToggleStar]);

  function share() {
    const text = `${photo.caption} · ${photo.dateLabel}`;
    void navigator.clipboard?.writeText(text);
    setToast("Link copied");
    window.setTimeout(() => setToast(""), 1600);
  }

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.caption} onClick={onClose}>
      <div className="lightbox-shell" onClick={(event) => event.stopPropagation()}>
        <header className="lightbox-bar">
          <button type="button" className="icon-btn light" onClick={onClose} aria-label="Close">
            <Icon name="arrow_back" />
          </button>
          <span>
            {index + 1} / {sequence.length || 1}
          </span>
          <div className="lightbox-bar-actions">
            <button type="button" className={`icon-btn light ${starred ? "on" : ""}`} onClick={() => onToggleStar(photo.id)} aria-label={starred ? "Unstar" : "Star"}>
              <Icon name="star" filled={starred} />
            </button>
            <button type="button" className="icon-btn light" onClick={() => setInfo((value) => !value)} aria-label="Info">
              <Icon name="info" />
            </button>
            <button type="button" className="icon-btn light" onClick={share} aria-label="Share">
              <Icon name="ios_share" />
            </button>
            {extraActions}
          </div>
        </header>
        <div className="lightbox-stage">
          {prev && (
            <button type="button" className="nav-arrow left" aria-label="Previous photo" onClick={() => onChange(prev)}>
              <Icon name="chevron_left" size={28} />
            </button>
          )}
          <PhotoImg src={fullSrc(photo.src)} alt={photo.alt} />
          {next && (
            <button type="button" className="nav-arrow right" aria-label="Next photo" onClick={() => onChange(next)}>
              <Icon name="chevron_right" size={28} />
            </button>
          )}
        </div>
        <div className="lightbox-caption">
          <b>{photo.caption}</b>
          <span>
            {photo.dateLabel} · {photo.album}
            {photo.locationLabel ? ` · ${photo.locationLabel}` : ""}
          </span>
        </div>
        {info && (
          <aside className="photo-info">
            <p>
              <b>Album</b> {photo.album}
            </p>
            <p>
              <b>Taken</b> {photo.takenAt}
            </p>
            {photo.people?.length ? (
              <p>
                <b>People</b> {photo.people.join(", ")}
              </p>
            ) : null}
            {photo.locationLabel ? (
              <p>
                <b>Place</b> {photo.locationLabel}
              </p>
            ) : null}
          </aside>
        )}
        {toast && <p className="toast">{toast}</p>}
      </div>
    </div>
  );
}

export function MemoriesRow({
  photos,
  onOpen
}: {
  photos: LibraryPhoto[];
  onOpen: (photo: LibraryPhoto) => void;
}) {
  const highlights = useMemo(
    () => photos.filter((photo) => photo.album === "Goa trip" || photo.album === "Wedding dinner").slice(0, 6),
    [photos]
  );
  if (!highlights.length) return null;
  return (
    <section className="memories">
      <h2>Memories</h2>
      <div className="memory-row">
        {highlights.map((photo) => (
          <button key={photo.id} className="memory-card" type="button" onClick={() => onOpen(photo)}>
            <PhotoImg src={photo.src} alt={photo.alt} />
            <span>{photo.album}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
