import {
  getLocalFavorites,
  setLocalFavorites,
  addLocalFavorite,
  removeLocalFavorite,
  markFavoriteSynced,
  getPendingSyncFavorites,
  getCurrentUserId
} from './localFavorites.js';

// Helper to get auth token
function getToken() {
  return localStorage.getItem('firebaseToken');
}

// Sync local pending favorites with DB
async function syncFavoritesWithDB() {
  const userId = getCurrentUserId();
  const pending = getPendingSyncFavorites(userId);
  if (!pending.length) return;
  const token = getToken();
  if (!token) return;

  for (const fav of pending) {
    try {
      // Try to add to DB
      const res = await fetch(`/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipe_id: fav.recipe_id })
      });
      if (res.ok) {
        markFavoriteSynced(fav.recipe_id, userId);
      }
      // else: leave as pending
    } catch (e) {
      // Network error, leave as pending
    }
  }
}

// Merge DB and local favorites, avoiding duplicates
function mergeFavorites(dbFavorites) {
  const userId = getCurrentUserId();
  const local = getLocalFavorites(userId);
  const merged = [...local];
  // Overwrite local with DB favorite if exists in both
  dbFavorites.forEach(dbFav => {
    const idx = merged.findIndex(fav => fav.recipe_id === dbFav.recipe_id);
    if (idx !== -1) {
      merged[idx] = {
        recipe_id: dbFav.recipe_id,
        title: dbFav.title,
        description: dbFav.description,
        favorited_at: dbFav.favorited_at || new Date().toISOString(),
        sync: true
      };
    } else {
      merged.push({
        recipe_id: dbFav.recipe_id,
        title: dbFav.title,
        description: dbFav.description,
        favorited_at: dbFav.favorited_at || new Date().toISOString(),
        sync: true
      });
    }
  });
  // Sort by favorited_at descending (newest first)
  merged.sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at));
  setLocalFavorites(merged, userId);
  return merged;
}

export { syncFavoritesWithDB, mergeFavorites }; 