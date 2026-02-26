<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  type EventItem = {
    id: string;
    title: string;
    performerText: string | null;
    startAt: string;
    city: string | null;
    venueText: string | null;
    genreTags: string[];
    vibeTags: string[];
  };

  const apiBase = '/api/v1';
  const pageSizeOptions = [5, 10, 20, 50];

  let q = '';
  let city = '';
  let from = '';
  let to = '';
  let genre = '';
  let vibe = '';
  let limit = 5;
  let offset = 0;
  let showAdvanced = false;

  let items: EventItem[] = [];
  let total = 0;
  let loading = false;
  let errorMessage = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  $: totalPages = Math.max(1, Math.ceil(total / limit));
  $: currentPage = Math.floor(offset / limit) + 1;
  $: pageButtons = buildPageList(totalPages, currentPage);
  $: activeFilterChips = [
    city ? { key: 'city', label: `City: ${city}` } : null,
    from ? { key: 'from', label: `${formatDateOnly(from)} ${formatTimeOnly(from)}` } : null,
    to ? { key: 'to', label: `${formatDateOnly(to)} ${formatTimeOnly(to)}` } : null,
    genre ? { key: 'genre', label: `Genres: ${genre}` } : null,
    vibe ? { key: 'vibe', label: `Vibes: ${vibe}` } : null
  ].filter((entry): entry is { key: 'city' | 'from' | 'to' | 'genre' | 'vibe'; label: string } => entry !== null);
  $: hasActiveFilters = activeFilterChips.length > 0;

  function parseCommaSeparated(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function toApiDateTime(localValue: string): string | undefined {
    if (!localValue) return undefined;
    const date = new Date(localValue);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  function toLocalDateTime(isoValue: string): string {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (value: number) => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function formatDateOnly(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  function formatTimeOnly(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function buildPageList(totalCount: number, current: number): Array<number | '...'> {
    if (totalCount <= 7) {
      return Array.from({ length: totalCount }, (_, idx) => idx + 1);
    }

    const pages: Array<number | '...'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(totalCount - 1, current + 1);

    if (start > 2) pages.push('...');
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    if (end < totalCount - 1) pages.push('...');

    pages.push(totalCount);
    return pages;
  }

  function syncUrl(): void {
    if (!browser) return;
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (city) params.set('city', city);
    const fromIso = toApiDateTime(from);
    const toIso = toApiDateTime(to);
    if (fromIso) params.set('from', fromIso);
    if (toIso) params.set('to', toIso);
    if (genre) params.set('genre', genre);
    if (vibe) params.set('vibe', vibe);
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }

  function loadFromUrl(): void {
    if (!browser) return;
    const params = new URLSearchParams(window.location.search);
    q = params.get('q') ?? '';
    city = params.get('city') ?? '';
    from = params.get('from') ? toLocalDateTime(params.get('from') as string) : '';
    to = params.get('to') ? toLocalDateTime(params.get('to') as string) : '';
    genre = params.get('genre') ?? '';
    vibe = params.get('vibe') ?? '';

    const nextLimit = Number(params.get('limit') ?? '5');
    limit = pageSizeOptions.includes(nextLimit) ? nextLimit : 5;

    const nextOffset = Number(params.get('offset') ?? '0');
    offset = Number.isFinite(nextOffset) && nextOffset >= 0 ? nextOffset : 0;
  }

  function scheduleSearch(resetOffset = true): void {
    if (resetOffset) {
      offset = 0;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      void search(false);
    }, 220);
  }

  function openAdvancedFilters(): void {
    showAdvanced = true;
  }

  function closeAdvancedFilters(): void {
    showAdvanced = false;
  }

  function clearAdvancedFilters(): void {
    city = '';
    from = '';
    to = '';
    genre = '';
    vibe = '';
    limit = 5;
    void search(true);
  }

  function removeAppliedFilter(key: 'city' | 'from' | 'to' | 'genre' | 'vibe'): void {
    if (key === 'city') city = '';
    if (key === 'from') from = '';
    if (key === 'to') to = '';
    if (key === 'genre') genre = '';
    if (key === 'vibe') vibe = '';
    void search(true);
  }

  async function search(resetOffset = true): Promise<void> {
    if (resetOffset) {
      offset = 0;
    }

    loading = true;
    errorMessage = '';

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      const fromIso = toApiDateTime(from);
      const toIso = toApiDateTime(to);
      if (fromIso) params.set('from', fromIso);
      if (toIso) params.set('to', toIso);

      for (const tag of parseCommaSeparated(genre)) {
        params.append('genre', tag);
      }
      for (const tag of parseCommaSeparated(vibe)) {
        params.append('vibe', tag);
      }

      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetch(`${apiBase}/search?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        errorMessage = payload?.error?.message ?? 'Search request failed';
        items = [];
        total = 0;
        return;
      }

      items = payload.items ?? [];
      total = Number(payload.total ?? 0);

      if (total > 0 && offset >= total) {
        offset = Math.max(0, (Math.ceil(total / limit) - 1) * limit);
        await search(false);
        return;
      }

      syncUrl();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Search request failed';
      items = [];
      total = 0;
    } finally {
      loading = false;
    }
  }

  function goToPage(page: number): void {
    if (page === currentPage) return;
    offset = (page - 1) * limit;
    void search(false);
  }

  function openEvent(id: string): void {
    void goto(`/events/${id}`);
  }

  function openEventFromKey(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEvent(id);
    }
  }

  onMount(() => {
    loadFromUrl();
    void search(false);
  });
</script>

<svelte:head>
  <title>vntq</title>
</svelte:head>

<main class="page">
  <section class="search-area">
    <h1>vntq</h1>

    <div class="search-input-wrap">
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79L20 21.5 21.5 20l-6-6zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
        />
      </svg>

      <input
        type="text"
        placeholder="Search events, artists, venues"
        bind:value={q}
        on:input={() => scheduleSearch(true)}
        aria-label="Search events"
      />

      <button
        type="button"
        class="filter-toggle"
        class:filter-toggle-active={hasActiveFilters}
        on:click={openAdvancedFilters}
        aria-label="Show advanced filters"
        title="Show advanced filters"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="9" cy="6" r="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="16" cy="12" r="2" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="11" cy="18" r="2" />
        </svg>
        {#if hasActiveFilters}
          <span class="filter-indicator" aria-hidden="true"></span>
        {/if}
      </button>
    </div>

    {#if hasActiveFilters}
      <div class="active-filters" aria-label="Active filters">
        {#each activeFilterChips as chip}
          <span class="filter-chip">
            <span>{chip.label}</span>
            <button
              type="button"
              class="filter-chip-remove"
              on:click={() => removeAppliedFilter(chip.key)}
              aria-label={`Remove filter ${chip.label}`}
            >
              &times;
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </section>

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}

  <section class="results-area">
    <div class="meta">
      <div class="meta-left">
        <span>{total} events</span>
        {#if loading}<span>Updating...</span>{/if}
      </div>

      {#if totalPages > 1}
        <nav class="pagination" aria-label="Pagination">
          {#each pageButtons as page}
            {#if page === '...'}
              <span class="ellipsis">...</span>
            {:else}
              <button
                type="button"
                class:active-page={page === currentPage}
                on:click={() => goToPage(page)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            {/if}
          {/each}
        </nav>
      {/if}
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>WHAT</th>
            <th>WHEN</th>
            <th>WHERE</th>
            <th>HOW</th>
          </tr>
        </thead>
        <tbody>
          {#if items.length === 0 && !loading}
            <tr>
              <td colspan="4" class="empty">No events found.</td>
            </tr>
          {:else}
            {#each items as item}
              <tr
                class="clickable-row"
                tabindex="0"
                role="button"
                aria-label={`Open event ${item.title}`}
                on:click={() => openEvent(item.id)}
                on:keydown={(event) => openEventFromKey(event, item.id)}
              >
                <td>
                  <div class="primary">{item.title}</div>
                  <div class="secondary">{item.performerText ?? 'Unknown artist'}</div>
                </td>
                <td>
                  <div class="primary">{formatDateOnly(item.startAt)}</div>
                  <div class="secondary">{formatTimeOnly(item.startAt)}</div>
                </td>
                <td>
                  <div class="primary">{item.venueText ?? '-'}</div>
                  <div class="secondary">{item.city ?? '-'}</div>
                </td>
                <td>
                  <div class="primary">{item.genreTags.join(', ') || '-'}</div>
                  <div class="secondary">{item.vibeTags.join(', ') || '-'}</div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>
</main>

{#if showAdvanced}
  <div class="filters-overlay">
    <button
      type="button"
      class="filters-backdrop"
      on:click={closeAdvancedFilters}
      aria-label="Close advanced filters"
    ></button>
    <section class="filters-panel" role="dialog" aria-modal="true" aria-label="Advanced filters">
      <header class="filters-header">
        <h2>Filters</h2>
        <button type="button" class="filters-close" on:click={closeAdvancedFilters} aria-label="Close filters">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </header>

      <div class="advanced-grid">
        <label>
          <span>City</span>
          <input type="text" placeholder="e.g. Munich" bind:value={city} on:input={() => scheduleSearch(true)} />
        </label>

        <label>
          <span>From</span>
          <input type="datetime-local" bind:value={from} on:change={() => scheduleSearch(true)} />
        </label>

        <label>
          <span>To</span>
          <input type="datetime-local" bind:value={to} on:change={() => scheduleSearch(true)} />
        </label>

        <label>
          <span>Genres</span>
          <input
            type="text"
            placeholder="rock, stand-up"
            bind:value={genre}
            on:input={() => scheduleSearch(true)}
          />
        </label>

        <label>
          <span>Vibes</span>
          <input
            type="text"
            placeholder="energetic, funny"
            bind:value={vibe}
            on:input={() => scheduleSearch(true)}
          />
        </label>

        <label>
          <span>Page size</span>
          <select bind:value={limit} on:change={() => scheduleSearch(true)}>
            {#each pageSizeOptions as size}
              <option value={size}>{size}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="filters-actions">
        <button type="button" class="ghost" on:click={clearAdvancedFilters}>Clear</button>
      </div>
    </section>
  </div>
{/if}

<style>
  .page {
    margin: 0 auto;
    max-width: 98rem;
    padding-bottom: 1rem;
    padding-inline: 1rem;
    padding-top: clamp(1rem, 3vh, 2rem);
  }

  .search-area {
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.9rem;
    font-weight: 700;
    margin: 0 0 0.9rem;
  }

  .search-input-wrap {
    position: relative;
    width: 100%;
  }

  .search-icon {
    fill: #4b5563;
    height: 1.4rem;
    left: 0.95rem;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 1.4rem;
  }

  .search-input-wrap input {
    font-size: 1.12rem;
    font-weight: 500;
    min-height: 3.2rem;
    padding: 0.55rem 3.5rem 0.55rem 2.85rem;
    width: 100%;
  }

  .filter-toggle {
    align-items: center;
    background: transparent;
    border: 0;
    display: inline-flex;
    height: 100%;
    justify-content: center;
    min-height: auto;
    min-width: 3rem;
    padding: 0;
    position: absolute;
    right: 0.2rem;
    top: 0;
  }

  .filter-toggle svg {
    fill: none;
    height: 1.4rem;
    stroke: #3f3f46;
    stroke-linecap: round;
    stroke-width: 1.8;
    width: 1.4rem;
  }

  .filter-toggle-active svg {
    stroke: #111111;
  }

  .filter-indicator {
    background: #f97316;
    border-radius: 999px;
    height: 0.42rem;
    position: absolute;
    right: 0.5rem;
    top: 0.8rem;
    width: 0.42rem;
  }

  .active-filters {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.7rem;
  }

  .filter-chip {
    align-items: center;
    border: 1px solid #d4d4d8;
    border-radius: 999px;
    color: #27272a;
    display: inline-flex;
    font-size: 0.9rem;
    font-weight: 500;
    min-height: 1.9rem;
    padding: 0.2rem 0.7rem;
  }

  .filter-chip-remove {
    background: transparent;
    border: 0;
    color: #71717a;
    font-size: 1rem;
    margin-left: 0.35rem;
    min-height: 0;
    min-width: 0;
    padding: 0;
  }

  .advanced-grid {
    display: grid;
    gap: 0.6rem;
  }

  label {
    display: grid;
    gap: 0.22rem;
  }

  label span {
    font-size: 0.95rem;
    font-weight: 700;
  }

  input,
  select,
  button {
    background: #ffffff;
    border: 1px solid #d4d4d8;
    border-radius: 8px;
    color: #121212;
    font: inherit;
    min-height: 2.75rem;
    padding: 0.5rem 0.65rem;
  }

  input[type='datetime-local'] {
    font-size: 1.02rem;
    min-height: 3rem;
  }

  button {
    cursor: pointer;
    font-weight: 700;
  }

  input:focus,
  select:focus,
  button:focus {
    border-color: #111111;
    outline: none;
  }

  .results-area {
    border-top: 1px solid #ececec;
    padding-top: 0.95rem;
  }

  .filters-overlay {
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.28);
    display: flex;
    inset: 0;
    justify-content: center;
    position: fixed;
    z-index: 30;
  }

  .filters-backdrop {
    background: transparent;
    border: 0;
    inset: 0;
    min-height: 0;
    min-width: 0;
    padding: 0;
    position: absolute;
    z-index: 0;
  }

  .filters-panel {
    background: #ffffff;
    border-radius: 16px 16px 0 0;
    max-height: 86vh;
    overflow: auto;
    padding: 1rem;
    position: relative;
    width: min(100%, 44rem);
    z-index: 1;
  }

  .filters-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }

  .filters-header h2 {
    font-size: 1.15rem;
    margin: 0;
  }

  .filters-close {
    align-items: center;
    background: transparent;
    border: 0;
    display: inline-flex;
    justify-content: center;
    min-height: 2rem;
    min-width: 2rem;
    padding: 0;
  }

  .filters-close svg {
    fill: none;
    height: 1.2rem;
    stroke: #3f3f46;
    stroke-linecap: round;
    stroke-width: 1.8;
    width: 1.2rem;
  }

  .filters-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
    margin-top: 0.85rem;
  }

  .filters-actions .ghost {
    background: #ffffff;
  }

  .meta {
    color: #3f3f46;
    display: flex;
    font-size: 1rem;
    justify-content: space-between;
    margin-bottom: 0.7rem;
    min-height: 2.45rem;
  }

  .meta-left {
    align-items: center;
    display: flex;
    gap: 0.9rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    table-layout: fixed;
    min-width: 64rem;
    width: 100%;
  }

  th:nth-child(1),
  td:nth-child(1) {
    width: 34%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 18%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 24%;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 24%;
  }

  th,
  td {
    border-bottom: 1px solid #e7e7e7;
    font-size: 1.02rem;
    padding: 0.78rem 0.45rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    color: #3f3f46;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .primary {
    color: #111111;
    font-weight: 700;
  }

  .secondary {
    color: #4b5563;
    font-size: 0.95rem;
    font-weight: 500;
    margin-top: 0.14rem;
  }

  .clickable-row {
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .clickable-row:hover,
  .clickable-row:focus {
    background: rgba(249, 115, 22, 0.12);
    outline: none;
  }

  .empty {
    color: #71717a;
    font-size: 1rem;
    padding: 1rem 0.4rem;
    text-align: center;
  }

  .pagination {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: flex-end;
  }

  .pagination button {
    min-height: 2.45rem;
    min-width: 2.45rem;
    padding: 0.35rem 0.5rem;
  }

  .active-page {
    background: #111111;
    border-color: #111111;
    color: #ffffff;
  }

  .ellipsis {
    color: #71717a;
    padding: 0 0.3rem;
  }

  .error {
    border: 1px solid #fda4af;
    border-radius: 8px;
    color: #be123c;
    margin: 0 0 0.85rem;
    padding: 0.55rem 0.7rem;
  }

  @media (min-width: 760px) {
    .page {
      padding-bottom: 1.3rem;
      padding-inline: 2rem;
      padding-top: clamp(1.25rem, 3vh, 2.4rem);
    }

    .advanced-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .filters-overlay {
      align-items: flex-start;
      padding-top: clamp(1.6rem, 6vh, 4rem);
    }

    .filters-panel {
      border-radius: 12px;
      padding: 1rem 1rem 1.1rem;
    }
  }

  @media (max-width: 759px) {
    .meta {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.55rem;
      min-height: 0;
    }
  }
</style>
