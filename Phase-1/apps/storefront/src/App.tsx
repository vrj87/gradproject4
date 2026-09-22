import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardView } from "./DashboardView";
import { DiscoveryView } from "./DiscoveryView";
import { FindView, type RememberActions } from "./FindView";
import { Icon } from "./Icon";
import { Phase2View } from "./Phase2View";
import { Phase3View } from "./Phase3View";
import { PlaygroundView } from "./PlaygroundView";
import { ProblemView } from "./ProblemView";
import { RisksView, SuccessView } from "./ShipViews";
import { Lightbox, MemoriesRow, PhotoGrid, PhotoImg, RememberPromo, SelectBar, TRY_CAFE_CLUE, TryThisCard } from "./PhotoChrome";
import { SearchView } from "./SearchView";
import { TestView } from "./TestView";
import { TASKS } from "./data/tasks";
import {
  LIBRARY,
  albumsInLibrary,
  groupByDate,
  loadFavorites,
  peopleInLibrary,
  photosInAlbum,
  saveFavorites,
  searchLibrary,
  type LibraryPhoto
} from "./data/library";
import { FEATURES } from "./lib/features";
import { rememberAllowed } from "./lib/segment";
import { track } from "./lib/events";

export type View =
  | "photos"
  | "search"
  | "library"
  | "discovery"
  | "metric"
  | "research"
  | "problem"
  | "playground"
  | "dashboard"
  | "test"
  | "success"
  | "risks";
type SearchMode = "keywords" | "remember";

const CHROME_NAV: Array<{ view: View; label: string; icon: string }> = [
  { view: "photos", label: "Photos", icon: "photo_library" },
  { view: "search", label: "Search", icon: "search" },
  { view: "library", label: "Library", icon: "grid_view" }
];

const RESEARCH_NAV: Array<{ view: View; label: string; icon: string }> = [
  { view: "discovery", label: "Discovery", icon: "travel_explore" },
  { view: "metric", label: "Metric", icon: "monitoring" },
  { view: "research", label: "Research", icon: "groups" },
  { view: "problem", label: "Problem", icon: "flag" },
  { view: "playground", label: "Playground", icon: "sports_esports" },
  { view: "test", label: "Test", icon: "science" },
  { view: "success", label: "Success", icon: "ssid_chart" },
  { view: "risks", label: "Risks", icon: "report" }
];

function viewFromUrl(): View {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/mvp" || path === "/find" || path.startsWith("/demo/task/")) return "search";
  if (path === "/playground") return "playground";
  if (path === "/dashboard") return "dashboard";
  if (path === "/test") return "test";
  const value = new URLSearchParams(window.location.search).get("view");
  if (value === "find" || value === "mvp" || value === "search") return "search";
  if (value === "library") return "library";
  if (value === "playground" || value === "tasks") return "playground";
  if (value === "dashboard") return "dashboard";
  if (value === "test" || value === "phase6") return "test";
  if (value === "success" || value === "metrics") return "success";
  if (value === "risks") return "risks";
  if (value === "research" || value === "phase3" || value === "interviews") return "research";
  if (value === "problem" || value === "phase4") return "problem";
  if (value === "discovery" || value === "listen" || value === "questions" || value === "ranking" || value === "collect") {
    return "discovery";
  }
  if (value === "metric" || value === "phase2" || value === "collections") return "metric";
  return "photos";
}

function modeFromUrl(): SearchMode {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (path === "/mvp" || path === "/find" || path.startsWith("/demo/task/")) return "remember";
  if (view === "find" || view === "mvp" || params.get("mode") === "remember") return "remember";
  return "keywords";
}

function taskFromUrl(): string | undefined {
  const fromQuery = new URLSearchParams(window.location.search).get("task");
  if (fromQuery) return fromQuery;
  const match = window.location.pathname.match(/\/demo\/task\/([^/]+)/);
  return match?.[1];
}

function queryFromUrl(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export function App() {
  const [view, setView] = useState<View>(viewFromUrl);
  const [searchMode, setSearchMode] = useState<SearchMode>(modeFromUrl);
  const [query, setQuery] = useState(queryFromUrl);
  const [open, setOpen] = useState<LibraryPhoto | null>(null);
  const [sequence, setSequence] = useState<LibraryPhoto[]>(LIBRARY);
  const [similarPick, setSimilarPick] = useState(false);
  const [similarPhotoId, setSimilarPhotoId] = useState<string | undefined>();
  const [similarNonce, setSimilarNonce] = useState(0);
  const [rememberNonce, setRememberNonce] = useState(0);
  const [findKey, setFindKey] = useState(0);
  const [rememberActions, setRememberActions] = useState<RememberActions | null>(null);
  const [similarFilter, setSimilarFilter] = useState("");
  const [taskId, setTaskId] = useState(taskFromUrl);
  const [confirmNote, setConfirmNote] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [selected, setSelected] = useState<string[]>([]);
  const [album, setAlbum] = useState<string | null>(null);
  const [homeTick, setHomeTick] = useState(0);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const starred = useMemo(() => new Set(favorites), [favorites]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const rememberCover = LIBRARY.find((photo) => photo.id === "p-cafe-1") ?? LIBRARY[0];

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1600);
  }

  function openPhoto(photo: LibraryPhoto, from: LibraryPhoto[] = LIBRARY) {
    setSequence(from);
    setOpen(photo);
  }

  function toggleStar(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      saveFavorites(next);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  useEffect(() => {
    if (view === "test") {
      window.history.replaceState({}, "", "/test");
      return;
    }
    const current = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    if (view === "search" && searchMode === "remember") params.set("view", "mvp");
    else params.set("view", view);
    if (view === "search" && searchMode === "keywords") params.set("mode", "keywords");
    if (view === "discovery") {
      const tab = current.get("tab");
      if (tab) params.set("tab", tab);
    }
    if (query) params.set("q", query);
    if (taskId && searchMode === "remember") params.set("task", taskId);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [view, searchMode, query, taskId]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function goPhotosHome() {
    setOpen(null);
    setSimilarPick(false);
    setSelected([]);
    setAlbum(null);
    setQuery("");
    setView("photos");
    setHomeTick((value) => value + 1);
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goView(next: View) {
    if (next === "photos") {
      goPhotosHome();
      return;
    }
    setOpen(null);
    setSimilarPick(false);
    setMenuOpen(false);
    if (next === "search") setSearchMode("keywords");
    setView(next);
  }

  function goDiscovery() {
    goView("discovery");
  }

  function goMetric() {
    goView("metric");
  }

  function goProblem() {
    goView("problem");
  }

  function goResearch() {
    goView("research");
  }

  function goRememberTask(nextTaskId: string) {
    const task = TASKS.find((item) => item.id === nextTaskId);
    setTaskId(nextTaskId);
    goRemember(task?.starterClue ?? task?.prompt);
  }

  function goKeywordSearch() {
    setOpen(null);
    setSearchMode("keywords");
    setView("search");
  }

  function goSearch(next: string) {
    setQuery(next);
    track("search_run", { taskId, surface: "keywords" });
    goKeywordSearch();
  }

  function goTestTask(nextTaskId: string) {
    setTaskId(nextTaskId);
    goView("test");
  }

  function goBaselineTask(nextTaskId: string) {
    const task = TASKS.find((item) => item.id === nextTaskId);
    setTaskId(nextTaskId);
    goSearch(task?.starterClue ?? task?.prompt ?? "");
  }

  function goRemember(clue?: string) {
    if (clue !== undefined) setQuery(clue);
    setSearchMode("remember");
    setView("search");
    if (clue?.trim()) setRememberNonce((value) => value + 1);
  }

  function clearMemory() {
    setQuery("");
    setSimilarPhotoId(undefined);
    setSimilarFilter("");
    setConfirmNote("");
    setSelected([]);
    setFindKey((value) => value + 1);
    setRememberNonce(0);
  }

  function applySimilar(photo: LibraryPhoto) {
    setSimilarPhotoId(photo.id);
    setSimilarNonce((value) => value + 1);
    setQuery((current) => current.trim() || `more like: ${photo.caption}`);
    goRemember();
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    goKeywordSearch();
  }

  return (
    <div className="photos-app">
      <p className="proto-bar">Prototype library — not your Google Photos account.</p>
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={goPhotosHome}
          aria-label="Photos home"
        >
          <span className="logo" aria-hidden>
            <i className="c1" />
            <i className="c2" />
            <i className="c3" />
            <i className="c4" />
          </span>
          <span>Photos</span>
        </button>
        {selected.length > 0 ? (
          <SelectBar
            count={selected.length}
            onClear={() => setSelected([])}
            onShare={() => {
              showToast(`${selected.length} photos shared`);
              setSelected([]);
            }}
            onStar={
              FEATURES.photosSelectShare
                ? () => {
                    setFavorites((current) => {
                      const next = [...current];
                      for (const id of selected) {
                        if (!next.includes(id)) next.push(id);
                      }
                      saveFavorites(next);
                      return next;
                    });
                    showToast(`${selected.length} starred`);
                  }
                : undefined
            }
            onRemember={
              FEATURES.similarPhoto && selected.length === 1
                ? () => {
                    const photo = LIBRARY.find((item) => item.id === selected[0]);
                    if (!photo) return;
                    setSelected([]);
                    applySimilar(photo);
                  }
                : undefined
            }
          />
        ) : (
          <form className="search-pill" onSubmit={onSearch}>
            <button type="submit" className="icon-btn search-submit" aria-label="Search photos">
              <Icon name="search" />
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                setSearchMode("keywords");
                setView("search");
              }}
              placeholder="Search your photos"
              aria-label="Search your photos"
            />
            {(query || searchMode === "remember") && (
              <button type="button" className="icon-btn" onClick={clearMemory} aria-label="Clear search and memory cues">
                <Icon name="close" />
              </button>
            )}
            <button
              type="button"
              className="remember-go"
              onClick={() => goRemember(query)}
              aria-label="Remember a photo"
            >
              <Icon name="auto_awesome" size={18} />
              Remember
            </button>
          </form>
        )}
        <div className="top-right">
          <div className="profile-wrap">
            <button
              type="button"
              className="avatar"
              aria-label="Google Account"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((openMenu) => !openMenu)}
            >
              P
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="menu-scrim"
                  aria-label="Close account menu"
                  onClick={closeMenu}
                />
                <div className="account-menu" role="dialog" aria-label="Google Account">
                  <button
                    type="button"
                    className="account-close"
                    aria-label="Close"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      closeMenu();
                    }}
                  >
                    <Icon name="close" />
                  </button>
                  <div className="account-card">
                    <span className="avatar large">
                      P
                      <span className="avatar-cam" aria-hidden>
                        <Icon name="photo_camera" size={14} filled />
                      </span>
                    </span>
                    <p className="account-hi">Hi, Priya!</p>
                    <p className="account-email">priya@gmail.com</p>
                    <button type="button" className="manage-btn" onClick={() => showToast("Google Account")}>
                      Manage your Google Account
                    </button>
                  </div>
                  <div className="account-split" />
                  <button type="button" className={`account-row ${view === "discovery" ? "on" : ""}`} onClick={goDiscovery}>
                    <Icon name="travel_explore" className="row-ico" />
                    Discovery engine
                  </button>
                  <button type="button" className={`account-row ${view === "metric" ? "on" : ""}`} onClick={goMetric}>
                    <Icon name="monitoring" className="row-ico" />
                    Metric breakdown
                  </button>
                  <button type="button" className={`account-row ${view === "research" ? "on" : ""}`} onClick={goResearch}>
                    <Icon name="groups" className="row-ico" />
                    Research
                  </button>
                  <button type="button" className={`account-row ${view === "problem" ? "on" : ""}`} onClick={goProblem}>
                    <Icon name="flag" className="row-ico" />
                    Problem
                  </button>
                  <button type="button" className={`account-row ${view === "playground" ? "on" : ""}`} onClick={() => goView("playground")}>
                    <Icon name="sports_esports" className="row-ico" />
                    Playground
                  </button>
                  <button type="button" className={`account-row ${view === "dashboard" ? "on" : ""}`} onClick={() => goView("dashboard")}>
                    <Icon name="monitoring" className="row-ico" />
                    Dashboard
                  </button>
                  <button type="button" className={`account-row ${view === "test" ? "on" : ""}`} onClick={() => goView("test")}>
                    <Icon name="science" className="row-ico" />
                    MVP test
                  </button>
                  <button type="button" className={`account-row ${view === "success" ? "on" : ""}`} onClick={() => goView("success")}>
                    <Icon name="ssid_chart" className="row-ico" />
                    Success metrics
                  </button>
                  <button type="button" className={`account-row ${view === "risks" ? "on" : ""}`} onClick={() => goView("risks")}>
                    <Icon name="report" className="row-ico" />
                    Risks
                  </button>
                  <div className="account-split" />
                  <button type="button" className="account-row" onClick={() => showToast("Add another account")}>
                    <Icon name="person_add" className="row-ico" />
                    Add another account
                  </button>
                  <button type="button" className="account-row" onClick={() => showToast("Signed out of this device")}>
                    <Icon name="logout" className="row-ico" />
                    Sign out
                  </button>
                  <div className="account-split" />
                  <p className="account-legal">
                    <button type="button" onClick={() => showToast("Privacy Policy")}>
                      Privacy Policy
                    </button>
                    <span>·</span>
                    <button type="button" onClick={() => showToast("Terms of Service")}>
                      Terms of Service
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="shell">
        <aside className="sidenav">
          {CHROME_NAV.map((item) => (
            <button
              key={item.view}
              className={view === item.view ? "on" : ""}
              onClick={() => goView(item.view)}
            >
              <Icon name={item.icon} filled={view === item.view} />
              {item.label}
            </button>
          ))}
          {FEATURES.dashboard && (
            <>
              <p className="nav-label">Research</p>
              {RESEARCH_NAV.map((item) => (
                <button
                  key={item.view}
                  className={view === item.view ? "on" : ""}
                  onClick={() => goView(item.view)}
                >
                  <Icon name={item.icon} filled={view === item.view} />
                  {item.label}
                </button>
              ))}
            </>
          )}
        </aside>

        <main className="main">
          {view === "search" &&
            (searchMode === "keywords" || !rememberAllowed() ? (
              <SearchView
                query={query}
                starred={starred}
                selected={selectedSet}
                coverSrc={rememberCover.src}
                onQuery={goSearch}
                onOpen={(photo, from) => openPhoto(photo, from)}
                onToggleStar={toggleStar}
                onToggleSelect={toggleSelect}
                onRemember={goRemember}
                onClear={clearMemory}
              />
            ) : (
              <FindView
                key={findKey}
                taskId={taskId}
                initialClue={query}
                similarPhotoId={similarPhotoId}
                similarNonce={similarNonce}
                autoNonce={rememberNonce}
                banner={confirmNote}
                onOpen={(photo, from) => openPhoto(photo, from ?? LIBRARY)}
                onNeedSimilar={() => setSimilarPick(true)}
                onClear={clearMemory}
                onActions={setRememberActions}
                onTryKeywords={(clue) => {
                  goSearch(clue.trim() ? clue : TRY_CAFE_CLUE);
                }}
              />
            ))}
          {view === "photos" && (
            <PhotosHome
              key={homeTick}
              starred={starred}
              selected={selectedSet}
              coverSrc={rememberCover.src}
              onOpen={(photo, from) => openPhoto(photo, from ?? LIBRARY)}
              onToggleStar={toggleStar}
              onToggleSelect={toggleSelect}
              onRemember={goRemember}
              onSearch={goSearch}
            />
          )}
          {view === "library" && (
            <LibraryHome
              album={album}
              favorites={favorites}
              starred={starred}
              selected={selectedSet}
              onAlbum={setAlbum}
              onOpen={(photo, from) => openPhoto(photo, from)}
              onToggleStar={toggleStar}
              onToggleSelect={toggleSelect}
            />
          )}
          {view === "discovery" && FEATURES.dashboard && (
            <DiscoveryView onOpenMetric={goMetric} onRemember={goRemember} />
          )}
          {view === "metric" && FEATURES.phase2Nomination && (
            <Phase2View onTryTask={goRememberTask} onRemember={() => goRemember()} onOpenDiscovery={goDiscovery} />
          )}
          {view === "research" && FEATURES.phase3Research && (
            <Phase3View onOpenProblem={goProblem} onOpenTest={() => goView("test")} />
          )}
          {view === "problem" && FEATURES.problemDefinition && (
            <ProblemView onOpenMvp={() => goRememberTask("task-goa-cafe")} onOpenMetric={goMetric} onOpenResearch={goResearch} />
          )}
          {view === "playground" && FEATURES.playgroundTasks && (
            <PlaygroundView onRememberTask={goRememberTask} onKeywordTask={goSearch} onTestTask={goTestTask} />
          )}
          {view === "dashboard" && FEATURES.dashboard && (
            <DashboardView onOpenMvp={() => goView("playground")} onOpenSuccess={() => goView("success")} />
          )}
          {view === "test" && FEATURES.mvpTest && (
            <TestView taskId={taskId} onBaseline={goBaselineTask} onRemember={goRememberTask} />
          )}
          {view === "success" && FEATURES.successMetrics && (
            <SuccessView onOpenTest={() => goView("test")} onOpenDashboard={() => goView("dashboard")} />
          )}
          {view === "risks" && FEATURES.risks && (
            <RisksView onOpenMvp={() => goRememberTask("task-goa-cafe")} />
          )}
        </main>
      </div>

      <nav className="bottomnav">
        {CHROME_NAV.map((item) => (
          <button
            key={item.view}
            className={view === item.view ? "on" : ""}
            onClick={() => goView(item.view)}
          >
            <Icon name={item.icon} filled={view === item.view} />
            {item.label}
          </button>
        ))}
      </nav>

      {toast && <p className="toast screen-toast" role="status">{toast}</p>}

      {similarPick && (
        <dialog className="picker" open onClick={() => setSimilarPick(false)}>
          <div className="picker-panel" onClick={(event) => event.stopPropagation()}>
            <div className="picker-head">
              <h2>Find photos like this</h2>
              <button type="button" className="icon-btn" onClick={() => setSimilarPick(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <p>Pick a photo that’s close to the one in your head. We’ll group the same trip, people, or vibe.</p>
            <input
              className="picker-search"
              value={similarFilter}
              onChange={(event) => setSimilarFilter(event.target.value)}
              placeholder="Filter — cafe, medicine, beach, people…"
              aria-label="Filter similar photos"
            />
            <div className="mosaic">
              {(similarFilter ? searchLibrary(similarFilter) : LIBRARY).map((photo) => (
                <button
                  key={photo.id}
                  className="tile"
                  type="button"
                  title={photo.caption}
                  onClick={() => {
                    setSimilarPick(false);
                    setSimilarFilter("");
                    applySimilar(photo);
                  }}
                >
                  <PhotoImg src={photo.src} alt={photo.alt} />
                </button>
              ))}
            </div>
            <button type="button" className="text-btn" onClick={() => setSimilarPick(false)}>
              Cancel
            </button>
          </div>
        </dialog>
      )}
      {open && (
        <Lightbox
          photo={open}
          sequence={sequence.length ? sequence : LIBRARY}
          starred={starred.has(open.id)}
          onClose={() => setOpen(null)}
          onChange={setOpen}
          onToggleStar={toggleStar}
          extraActions={
            <>
              {searchMode === "remember" && rememberActions ? (
                <>
                  {FEATURES.refineMoreLikeThis && (
                    <button
                      type="button"
                      onClick={() => {
                        rememberActions.moreLike(open);
                        setOpen(null);
                      }}
                    >
                      More like this
                    </button>
                  )}
                  {FEATURES.refineNotThisTrip && (
                    <button
                      type="button"
                      onClick={() => {
                        rememberActions.notThis(open);
                        setOpen(null);
                      }}
                    >
                      {rememberActions.excludeLabel(open)}
                    </button>
                  )}
                  {FEATURES.confirmThisIsIt && (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        rememberActions.confirm(open);
                        setOpen(null);
                      }}
                    >
                      That’s the one
                    </button>
                  )}
                </>
              ) : (
                FEATURES.similarPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(null);
                      applySimilar(open);
                    }}
                  >
                    I have something like it
                  </button>
                )
              )}
            </>
          }
        />
      )}
    </div>
  );
}

function PhotosHome({
  starred,
  selected,
  coverSrc,
  onOpen,
  onToggleStar,
  onToggleSelect,
  onRemember,
  onSearch
}: {
  starred: Set<string>;
  selected: Set<string>;
  coverSrc: string;
  onOpen: (photo: LibraryPhoto, from?: LibraryPhoto[]) => void;
  onToggleStar: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onRemember: (clue?: string) => void;
  onSearch: (query: string) => void;
}) {
  return (
    <>
      {FEATURES.memoryCueComposer && (
        <>
          <RememberPromo coverSrc={coverSrc} onOpen={() => onRemember()} />
          <TryThisCard onSearch={() => onSearch(TRY_CAFE_CLUE)} onRemember={() => onRemember(TRY_CAFE_CLUE)} />
        </>
      )}
      {FEATURES.photosMemories && (
        <MemoriesRow photos={LIBRARY} onOpen={(photo) => onOpen(photo, photosInAlbum(photo.album))} />
      )}
      {groupByDate(LIBRARY).map((group) => (
        <section key={group.dateLabel} className="day">
          <h2>{group.dateLabel}</h2>
          <PhotoGrid
            photos={group.photos}
            starred={starred}
            selected={selected}
            onOpen={(photo) => onOpen(photo, group.photos)}
            onToggleStar={onToggleStar}
            onToggleSelect={onToggleSelect}
          />
        </section>
      ))}
    </>
  );
}

function LibraryHome({
  album,
  favorites,
  starred,
  selected,
  onAlbum,
  onOpen,
  onToggleStar,
  onToggleSelect
}: {
  album: string | null;
  favorites: string[];
  starred: Set<string>;
  selected: Set<string>;
  onAlbum: (name: string | null) => void;
  onOpen: (photo: LibraryPhoto, from: LibraryPhoto[]) => void;
  onToggleStar: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  if (album) {
    const peopleAlbum = album.startsWith("People · ") ? album.slice("People · ".length) : null;
    const shown = peopleAlbum
      ? LIBRARY.filter((photo) => photo.people?.includes(peopleAlbum))
      : album === "Favorites"
        ? LIBRARY.filter((photo) => favorites.includes(photo.id))
        : photosInAlbum(album);
    return (
      <>
        <button type="button" className="back" onClick={() => onAlbum(null)}>
          <Icon name="arrow_back" size={20} />
          Library
        </button>
        <h1 className="page-title">{album}</h1>
        <p className="page-lede">{shown.length} items</p>
        <PhotoGrid
          photos={shown}
          starred={starred}
          selected={selected}
          onOpen={(photo) => onOpen(photo, shown)}
          onToggleStar={onToggleStar}
          onToggleSelect={onToggleSelect}
        />
      </>
    );
  }

  const albums = albumsInLibrary();
  const people = peopleInLibrary();
  return (
    <>
      <h1 className="page-title">Library</h1>
      <h2 className="day-title">Albums</h2>
      <div className="albums">
        <button className="album" type="button" onClick={() => onAlbum("Favorites")}>
          <div className="album-fav">
            <Icon name="star" size={40} filled />
          </div>
          <span>
            <b>Favorites</b>
            {favorites.length} items
          </span>
        </button>
        {albums.map((item) => (
          <button key={item.name} className="album" type="button" onClick={() => onAlbum(item.name)}>
            <PhotoImg src={item.cover.src} alt={item.cover.alt} />
            <span>
              <b>{item.name}</b>
              {item.count} items
            </span>
          </button>
        ))}
      </div>
      {people.length > 0 && (
        <>
          <h2 className="day-title">People</h2>
          <div className="people-row">
            {people.map((person) => (
              <button
                key={person.name}
                className="person"
                type="button"
                onClick={() => onAlbum(`People · ${person.name}`)}
              >
                <PhotoImg src={person.cover.src} alt={person.name} />
                <b>{person.name}</b>
                <span>{person.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

