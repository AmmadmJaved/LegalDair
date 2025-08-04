const STORAGE_PREFIX = 'legaldiary_';

export const localStorage = {
  get: (key: string) => {
    try {
      const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string) => {
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      Object.keys(window.localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Cache management for offline functionality
export const cacheAPI = {
  set: async (key: string, data: any) => {
    localStorage.set(`cache_${key}`, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
  },
  
  get: async (key: string) => {
    const cached = localStorage.get(`cache_${key}`);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      localStorage.remove(`cache_${key}`);
      return null;
    }
    
    return cached.data;
  },
  
  invalidate: (key: string) => {
    localStorage.remove(`cache_${key}`);
  },
  
  clear: () => {
    Object.keys(window.localStorage)
      .filter(key => key.includes(`${STORAGE_PREFIX}cache_`))
      .forEach(key => window.localStorage.removeItem(key));
  }
};
