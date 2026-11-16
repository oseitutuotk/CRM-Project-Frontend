// Native Fetch API client for MicroPhoenix CRM

// Allow dynamic API base URL so user can toggle between Dev Tunnel, local proxy, or localhost
export const getApiBaseUrl = () => {
  return localStorage.getItem('microphoenix_api_url') || '';
};

export const setApiBaseUrl = (url) => {
  localStorage.setItem('microphoenix_api_url', url);
};

export const getAuthToken = () => {
  return localStorage.getItem('microphoenix_token');
};

export const setAuthSession = (session) => {
  if (session && session.accessToken) {
    localStorage.setItem('microphoenix_token', session.accessToken);
    localStorage.setItem('microphoenix_user', JSON.stringify(session));
  } else {
    localStorage.removeItem('microphoenix_token');
    localStorage.removeItem('microphoenix_user');
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('microphoenix_user');
  return user ? JSON.parse(user) : null;
};

// Generic fetch wrapper using native fetch
async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Tunnel-Skip-Anti-Abuse-Page': 'true',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      let errorMessage = 'Request failed';
      if (responseData && typeof responseData === 'object') {
        errorMessage = responseData.message || responseData.title || JSON.stringify(responseData);
      } else if (typeof responseData === 'string' && responseData.trim()) {
        errorMessage = responseData;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return { ok: false, status: response.status, error: errorMessage, data: null };
    }

    return { ok: true, status: response.status, data: responseData, error: null };
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    return {
      ok: false,
      status: 0,
      error: `Could not connect to ${baseUrl}. Make sure your ASP.NET backend is running! (${err.message})`,
      data: null,
    };
  }
}

// Authentication Endpoints
export const authApi = {
  login: async (email, password) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async ({ lastName, otherNames, email, phoneNumber, password, role = 0 }) => {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        lastName,
        otherNames,
        email,
        phoneNumber,
        password,
        role: Number(role),
      }),
    });
  },
};

// Users Endpoints
export const usersApi = {
  getAll: async () => request('/api/users'),
  getById: async (id) => request(`/api/users/${id}`),
  getUserEnrollments: async (userId) => request(`/api/users/${userId}/enrollments`),
};

// Schemes Endpoints
export const schemesApi = {
  getAll: async () => request('/api/schemes'),
  getById: async (id) => request(`/api/schemes/${id}`),
  create: async ({ name, code, description, tier }) => {
    return request('/api/schemes', {
      method: 'POST',
      body: JSON.stringify({
        name,
        code,
        description,
        tier: Number(tier),
      }),
    });
  },
  getNavHistory: async (schemeId) => request(`/api/schemes/${schemeId}/nav`),
  createNav: async (schemeId, { unitPrice, effectiveDate }) => {
    return request(`/api/schemes/${schemeId}/nav`, {
      method: 'POST',
      body: JSON.stringify({
        unitPrice: Number(unitPrice),
        effectiveDate: effectiveDate || new Date().toISOString(),
      }),
    });
  },
};

// Enrollments & Transactions Endpoints
export const enrollmentsApi = {
  getAll: async () => request('/api/enrollments'),
  create: async ({ userId, schemeId }) => {
    return request('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        schemeId: Number(schemeId),
      }),
    });
  },
  getById: async (id) => request(`/api/enrollments/${id}`),
  addContribution: async (id, amount) => {
    return request(`/api/enrollments/${id}/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
      }),
    });
  },
  addRedemption: async (id, amount) => {
    return request(`/api/enrollments/${id}/redemptions`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
      }),
    });
  },
};
