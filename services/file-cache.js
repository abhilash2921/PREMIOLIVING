/* js/services/file-cache.js - Premio Living OS IndexedDB File Cache Service */

window.FileCache = {
  db: null,

  init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn("IndexedDB not supported in this browser. File caching will run in-memory.");
        resolve();
        return;
      }
      
      const request = indexedDB.open("PremioLivingFileCache", 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log("IndexedDB File Cache initialized successfully.");
        resolve();
      };
      
      request.onerror = (e) => {
        console.error("Failed to open IndexedDB File Cache:", e);
        resolve();
      };
    });
  },

  async set(id, data) {
    if (!this.db) {
      // In-memory fallback
      if (!window._memFileCache) window._memFileCache = {};
      window._memFileCache[id] = data;
      return;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const request = store.put({ id, data, timestamp: Date.now() });
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (err) {
        console.error("IndexedDB set transaction error:", err);
        resolve(false);
      }
    });
  },

  async get(id) {
    if (!this.db) {
      if (window._memFileCache && window._memFileCache[id]) {
        return window._memFileCache[id];
      }
      return null;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(["files"], "readonly");
        const store = transaction.objectStore("files");
        const request = store.get(id);
        
        request.onsuccess = (e) => {
          resolve(e.target.result ? e.target.result.data : null);
        };
        request.onerror = () => resolve(null);
      } catch (err) {
        console.error("IndexedDB get transaction error:", err);
        resolve(null);
      }
    });
  },

  async remove(id) {
    if (!this.db) {
      if (window._memFileCache) delete window._memFileCache[id];
      return;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }
};
