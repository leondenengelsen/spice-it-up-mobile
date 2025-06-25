// Utility for managing local favorites in localStorage
// Only stores recipe ideas (not full recipes)

const LOCAL_FAVORITES_KEY = 'spiceItUp_favorites_v1';

function getCurrentUserId() {
  // Try to get user id from localStorage (set by authStateManager)
  return localStorage.getItem('dbUserId') || null;
}

function getAllLocalFavorites() {
  const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
  if (!raw) return { users: {} };
  try {
    return JSON.parse(raw);
  } catch {
    return { users: {} };
  }
}

function saveAllLocalFavorites(data) {
  localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(data));
}

function getLocalFavorites(userId = getCurrentUserId()) {
  const all = getAllLocalFavorites();
  return (all.users[userId] && all.users[userId].favorites) || [];
}

function setLocalFavorites(favorites, userId = getCurrentUserId()) {
  const all = getAllLocalFavorites();
  if (!all.users[userId]) all.users[userId] = { favorites: [], last_sync: null };
  all.users[userId].favorites = favorites;
  saveAllLocalFavorites(all);
}

function addLocalFavorite(idea, userId = getCurrentUserId()) {
  const favorites = getLocalFavorites(userId);
  if (favorites.some(fav => fav.recipe_id === idea.recipe_id)) return false;
  favorites.unshift({
    recipe_id: idea.recipe_id,
    title: idea.title,
    description: idea.description,
    favorited_at: new Date().toISOString(),
    sync: false
  });
  setLocalFavorites(favorites, userId);
  return true;
}

function removeLocalFavorite(recipe_id, userId = getCurrentUserId()) {
  let favorites = getLocalFavorites(userId);
  favorites = favorites.filter(fav => fav.recipe_id !== recipe_id);
  setLocalFavorites(favorites, userId);
}

function markFavoriteSynced(recipe_id, userId = getCurrentUserId()) {
  const favorites = getLocalFavorites(userId);
  const idx = favorites.findIndex(fav => fav.recipe_id === recipe_id);
  if (idx !== -1) {
    favorites[idx].sync = true;
    setLocalFavorites(favorites, userId);
  }
}

function getPendingSyncFavorites(userId = getCurrentUserId()) {
  return getLocalFavorites(userId).filter(fav => fav.sync === false);
}

export {
  getLocalFavorites,
  setLocalFavorites,
  addLocalFavorite,
  removeLocalFavorite,
  markFavoriteSynced,
  getPendingSyncFavorites,
  getCurrentUserId
}; 