const DB_NAME = "SriAmmanTradersOfflineDB";
const DB_VERSION = 3;

// Initialize Database with stores for all billing modules
function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const stores = [
        "products", "customers", "suppliers", "categories", "brands", 
        "units", "godowns", "gstmasters", "bills", "purchases", 
        "adjustments", "expenses", "ledger", "employees", "settings", "stats",
        "accountsGroups", "accountsLedgers"
      ];
      
      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      });
      
      if (!db.objectStoreNames.contains("mutations_queue")) {
        db.createObjectStore("mutations_queue", { keyPath: "id", autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Generic Get All Data from Store
async function getOfflineData(storeName) {
  try {
    const db = await initOfflineDB();
    if (!db.objectStoreNames.contains(storeName)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error("getOfflineData error", err);
    return [];
  }
}

// Generic Save Data to Store (Handles single objects or arrays of objects)
async function saveOfflineData(storeName, data) {
  if (!data) return;
  try {
    const db = await initOfflineDB();
    if (!db.objectStoreNames.contains(storeName)) {
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      
      if (Array.isArray(data)) {
        // Clear before caching a complete table fetch
        store.clear();
        data.forEach(item => {
          if (item && typeof item === "object" && item.id) {
            store.put(item);
          }
        });
      } else if (typeof data === "object") {
        if (data.id) {
          store.put(data);
        } else {
          // Handle single non-keyed settings/stats objects by a static ID
          data.id = storeName === "settings" ? "company" : (data.id || "default");
          store.put(data);
        }
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("saveOfflineData error", err);
  }
}

// Generic Delete Key from Store
async function deleteOfflineData(storeName, id) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Generic Clear Store
async function clearOfflineData(storeName) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Mutation Queue Helpers
async function queueMutation(mutation) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations_queue", "readwrite");
    const store = tx.objectStore("mutations_queue");
    // Ensure mutation has a timestamp for sorting
    mutation.timestamp = Date.now();
    store.add(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getQueuedMutations() {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations_queue", "readonly");
    const store = tx.objectStore("mutations_queue");
    const req = store.getAll();
    req.onsuccess = () => {
      // Sort mutations by timestamp to maintain replay order
      const result = req.result || [];
      result.sort((a, b) => a.timestamp - b.timestamp);
      resolve(result);
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueuedMutation(id) {
  const db = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations_queue", "readwrite");
    const store = tx.objectStore("mutations_queue");
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Legacy Compatibility Wrappers for App.jsx
async function cacheProducts(products) { return saveOfflineData("products", products); }
async function getCachedProducts() { return getOfflineData("products"); }
async function cacheCustomers(customers) { return saveOfflineData("customers", customers); }
async function getCachedCustomers() { return getOfflineData("customers"); }
async function saveOfflineBill(bill) { return saveOfflineData("bills", bill); }
async function getOfflineBills() { return getOfflineData("bills"); }
async function clearOfflineBills() { return clearOfflineData("bills"); }
async function saveOfflineCustomer(cust) { return saveOfflineData("customers", cust); }
async function getOfflineCustomers() { return getOfflineData("customers"); }
async function clearOfflineCustomers() { return clearOfflineData("customers"); }

export {
  initOfflineDB,
  getOfflineData,
  saveOfflineData,
  deleteOfflineData,
  clearOfflineData,
  queueMutation,
  getQueuedMutations,
  deleteQueuedMutation,
  
  // Backward compatibility exports
  cacheCustomers,
  cacheProducts,
  clearOfflineBills,
  clearOfflineCustomers,
  getCachedCustomers,
  getCachedProducts,
  getOfflineBills,
  getOfflineCustomers,
  saveOfflineBill,
  saveOfflineCustomer
};
