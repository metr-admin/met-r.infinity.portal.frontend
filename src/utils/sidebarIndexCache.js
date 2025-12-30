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

      // Step 3: Build filepath to ID mapping and store index content
      validModules.forEach(module => {
        const { domain, docs } = module;
        
        // Find and store index.html for this module
        const indexPatterns = ['index.html', 'index.htm', 'main.html', 'home.html'];
        for (const pattern of indexPatterns) {
          const indexDoc = docs.find(doc => 
            (doc.attributes?.fileName || '').toLowerCase().split('/').pop() === pattern
          );
          if (indexDoc) {
            module.indexDocId = indexDoc.id;
            break;
          }
        }
        
        docs.forEach(doc => {
          const filename = doc.attributes?.fileName || doc.attributes?.filename;
          const title = doc.attributes?.title;
          
          if (filename && doc.id) {
            // Extract just the filename from path (e.g., "213456304_1.xml" from "Power/folder/213456304_1.xml")
            const justFilename = filename.split('/').pop();
            
            // Map: domain/filename -> docId
            const key = `${domain}/${justFilename}`.toLowerCase();
            this.filepathToIdMap[key] = doc.id;
            
            // Also map without .html/.xml extension
            const keyWithoutExt = key.replace(/\.(html|xml)$/, '');
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
      
      console.log('✅ Sidebar cache initialized:', {
        modules: validModules.length,
        totalMappings: Object.keys(this.filepathToIdMap).length
      });
    } catch (error) {
      console.error('Error initializing sidebar cache:', error);
    } finally {
      this.loading = false;
    }
  }

  getDocIdByFilepath(filepath) {
    if (!filepath) return null;
    
    let normalized = filepath.replace(/\\/g, '/').toLowerCase().trim().replace('.xml', '.html');
    console.log('🔍 Lookup:', { original: filepath, normalized });
    
    // Direct match
    if (this.filepathToIdMap[normalized]) {
      console.log('✅ Direct match:', normalized, '→', this.filepathToIdMap[normalized]);
      return this.filepathToIdMap[normalized];
    }
    
    const withoutExt = normalized.replace(/\.(html|xml)$/, '');
    if (this.filepathToIdMap[withoutExt]) {
      console.log('✅ Match without ext:', withoutExt, '→', this.filepathToIdMap[withoutExt]);
      return this.filepathToIdMap[withoutExt];
    }
    
    const parts = normalized.split('/');
    const domain = parts[0];
    const filename = parts[parts.length - 1].replace(/\.(html|xml)$/, '');
    
    // Extract all numbers from the entire filepath
    const pathNumbers = normalized.match(/\d+/g) || [];
    
    // Get all keys for this domain
    const domainKeys = Object.keys(this.filepathToIdMap).filter(k => k.startsWith(`${domain}/`));
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const key of domainKeys) {
      const keyFilename = key.split('/').pop().replace(/\.(html|xml)$/, '');
      const keyNumbers = key.match(/\d+/g) || [];
      
      let score = 0;
      
      // Exact filename match
      if (keyFilename === filename) {
        score = 1000;
      }
      // Check if any number from path matches key numbers
      else {
        for (const pathNum of pathNumbers) {
          for (const keyNum of keyNumbers) {
            if (pathNum === keyNum) {
              score += 500; // Each matching number adds score
            } else if (pathNum.includes(keyNum) || keyNum.includes(pathNum)) {
              score += 200;
            }
          }
        }
        
        // Bonus for filename text similarity
        const cleanFilename = filename.replace(/[^a-z]/g, '');
        const cleanKey = keyFilename.replace(/[^a-z]/g, '');
        if (cleanFilename && cleanKey) {
          const shorter = Math.min(cleanFilename.length, cleanKey.length);
          const longer = Math.max(cleanFilename.length, cleanKey.length);
          let matches = 0;
          for (let i = 0; i < shorter; i++) {
            if (cleanFilename[i] === cleanKey[i]) matches++;
          }
          score += (matches / longer) * 50;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    }
    
    if (bestMatch && bestScore > 100) {
      console.log(`✅ Fuzzy match (score: ${bestScore}):`, bestMatch, '→', this.filepathToIdMap[bestMatch]);
      return this.filepathToIdMap[bestMatch];
    }
    
    console.warn('❌ No match. Tried:', { normalized, filename, domain, pathNumbers });
    return null;
  }

  getBranchByFilepath(filepath) {
    if (!filepath || !this.cache) return null;
    
    const normalized = filepath.replace(/\\/g, '/').toLowerCase().trim().replace('.xml', '.html');
    const filename = normalized.split('/').pop();
    const domain = normalized.split('/')[0];
    
    // First try: match by domain prefix
    for (const module of this.cache) {
      if (module.domain === domain) {
        console.log(`📦 Found module by domain "${domain}":`, module.branch);
        const moduleMappings = this.getMappingsByBranch(module.branch);
        console.log(`📋 All mappings for "${module.branch}":`, moduleMappings);
        return module.branch;
      }
    }
    
    // Second try: find by filename match
    for (const module of this.cache) {
      for (const doc of module.docs) {
        const docFilename = (doc.attributes?.fileName || doc.attributes?.filename || '').toLowerCase().split('/').pop();
        if (docFilename === filename || docFilename === filename.replace(/\.(html|xml)$/, '')) {
          console.log(`📦 Found module by filename "${filename}":`, module.branch);
          const moduleMappings = this.getMappingsByBranch(module.branch);
          console.log(`📋 All mappings for "${module.branch}":`, moduleMappings);
          return module.branch;
        }
      }
    }
    
    return null;
  }

  getAllMappings() {
    return this.filepathToIdMap;
  }

  getMappingsByBranch(branch) {
    if (!branch || !this.cache) return {};
    
    const module = this.cache.find(m => m.branch === branch);
    if (!module) return {};
    
    const { domain } = module;
    const branchMappings = {};
    
    for (const [key, id] of Object.entries(this.filepathToIdMap)) {
      if (key.startsWith(`${domain}/`)) {
        branchMappings[key] = id;
      }
    }
    
    return branchMappings;
  }

  getModuleByBranch(branch) {
    if (!branch || !this.cache) return null;
    return this.cache.find(m => m.branch === branch);
  }

  isReady() {
    return this.initialized;
  }
}

// Singleton instance
export const sidebarCache = new SidebarIndexCache();
