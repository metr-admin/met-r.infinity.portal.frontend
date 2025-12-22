const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const documentationAPI = {
  // Get all HTML files for sidebar navigation
  getAllDocs: async () => {
    try {
      console.log('🔥 Fetching all docs from:', `${API_BASE}/github-html-files?pagination[limit]=-1`);
      const response = await fetch(`${API_BASE}/github-html-files?pagination[limit]=-1`);
      const data = await response.json();
      console.log('📄 All docs response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching all docs:', error);
      throw error;
    }
  },

  // Get specific document for main content
  getDocById: async (id) => {
    try {
      console.log('🔥 Fetching doc by ID:', `${API_BASE}/github-html-files/${id}?populate=*`);
      const response = await fetch(`${API_BASE}/github-html-files/${id}?populate=*`);
      const data = await response.json();
      console.log('📄 Doc by ID response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching doc by ID:', error);
      throw error;
    }
  },

  // Get all repositories/modules
  getAllRepositories: async () => {
    try {
      console.log('🔥 Fetching repositories from:', `${API_BASE}/github-repositories?pagination[limit]=-1`);
      const response = await fetch(`${API_BASE}/github-repositories?pagination[limit]=-1`);
      const data = await response.json();
      console.log('📄 Repositories response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  },

  // Get documents by repository/branch
  getDocsByRepository: async (branchName) => {
    try {
      console.log('🔥 Fetching docs by branch:', `${API_BASE}/github-html-files?filters[branch][$eq]=${branchName}&pagination[limit]=-1`);
      const response = await fetch(`${API_BASE}/github-html-files?filters[branch][$eq]=${branchName}&pagination[limit]=-1`);
      const data = await response.json();
      console.log('📄 Docs by branch response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching docs by repository:', error);
      throw error;
    }
  }
};