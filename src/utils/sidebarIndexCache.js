/**
 * Sidebar Index Cache
 * Fetches and caches all sidebar structures from all modules
 * Maps domain/filename to document IDs for navigation
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL;

class SidebarIndexCache {
  constructor() {
    this.cache = null;
    this.filepathToIdMap = {};
    this.loading = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized || this.loading) return;
    
    this.loading = true;
    try {
      // Step 1: Get all repositories/modules
      const reposResponse = await fetch(`${API_BASE}/github-repositories?pagination[limit]=-1`);
      const reposData = await reposResponse.json();
      
      if (!reposData.data) {
        console.warn('No repositories found');
        this.loading = false;
        return;
      }

      // Step 2: Fetch all module docs in parallel
      const modulePromises = reposData.data.map(async (repo) => {
        const branch = repo.attributes?.branch;
        if (!branch) return null;

        try {
          const docsResponse = await fetch(
            `${API_BASE}/github-html-files?filters[branch][$eq]=${branch}&pagination[limit]=-1`
          );
          const docsData = await docsResponse.json();
          
          // Extract domain from branch (remove _output_1, _output_2, etc.)
          const domain = branch.replace(/_output_\d+$/i, '').toLowerCase();
          
          return {
            branch,
            domain,
            docs: docsData.data || []
          };
        } catch (error) {
          console.error(`Error fetching docs for branch ${branch}:`, error);
          return null;
        }
      });

      const moduleResults = await Promise.all(modulePromises);
      const validModules = moduleResults.filter(Boolean);

      // Step 3: Build filepath to ID mapping
      validModules.forEach(module => {
        const { domain, docs } = module;
        
        docs.forEach(doc => {
          const filename = doc.attributes?.fileName || doc.attributes?.filename;
          const title = doc.attributes?.title;
          
          if (filename && doc.id) {
            // Map: domain/filename -> docId
            const key = `${domain}/${filename}`.toLowerCase();
            this.filepathToIdMap[key] = doc.id;
            
            // Also map without .html extension
            const keyWithoutExt = key.replace('.html', '');
            this.filepathToIdMap[keyWithoutExt] = doc.id;
            
            // Map: domain/title -> docId (for title-based matching)
            if (title) {
              const titleKey = `${domain}/${title}`.toLowerCase();
              this.filepathToIdMap[titleKey] = doc.id;
            }
          }
        });
      });

      this.cache = validModules;
      this.initialized = true;
      
      const mappingEntries = Object.entries(this.filepathToIdMap);
      console.log('✅ Sidebar cache initialized:', {
        modules: validModules.length,
        mappings: mappingEntries.length
      });
      console.log('📋 First 100 mappings:', mappingEntries.slice(0, 100));
    } catch (error) {
      console.error('Error initializing sidebar cache:', error);
    } finally {
      this.loading = false;
    }
  }

  getDocIdByFilepath(filepath) {
    if (!filepath) return null;
    
    // Normalize: lowercase, forward slashes, trim, xml→html
    let normalized = filepath.replace(/\\/g, '/').toLowerCase().trim().replace('.xml', '.html');
    
    console.log('🔍 Lookup:', { original: filepath, normalized });
    
    // Direct match
    if (this.filepathToIdMap[normalized]) {
      console.log('✅ Direct match:', normalized, '→', this.filepathToIdMap[normalized]);
      return this.filepathToIdMap[normalized];
    }
    
    // Without extension
    const withoutExt = normalized.replace(/\.(html|xml)$/, '');
    if (this.filepathToIdMap[withoutExt]) {
      console.log('✅ Match without ext:', withoutExt, '→', this.filepathToIdMap[withoutExt]);
      return this.filepathToIdMap[withoutExt];
    }
    
    // Fuzzy: check if any mapping key ends with the filename
    const filename = normalized.split('/').pop();
    for (const [key, id] of Object.entries(this.filepathToIdMap)) {
      if (key.endsWith(filename) || key.endsWith(filename.replace(/\.(html|xml)$/, ''))) {
        console.log('✅ Fuzzy match:', key, '→', id);
        return id;
      }
    }
    
    console.warn('❌ No match. Tried:', { normalized, withoutExt, filename });
    return null;
  }

  getAllMappings() {
    return this.filepathToIdMap;
  }

  isReady() {
    return this.initialized;
  }
}

// Singleton instance
export const sidebarCache = new SidebarIndexCache();
