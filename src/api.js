// Native Fetch API client for Petra Trust Pension CRM

// Allow dynamic API base URL so user can toggle between Dev Tunnel, local proxy, or localhost
export const getApiBaseUrl = () => {
  const custom = localStorage.getItem('microphoenix_api_url');
  if (custom && custom.includes('devtunnels.ms')) {
    localStorage.removeItem('microphoenix_api_url');
    return '';
  }
  return custom || '';
};

export const setApiBaseUrl = (url) => {
  if (!url || url.includes('devtunnels.ms')) {
    localStorage.removeItem('microphoenix_api_url');
  } else {
    localStorage.setItem('microphoenix_api_url', url);
  }
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
      error: `Unable to connect to the pension trustee service. Please verify network connectivity and try again.`,
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

// Corporate Clients (Employers / Companies) Endpoints
export const clientsApi = {
  getAll: async () => request('/api/clients'),
  getById: async (petraId) => request(`/api/clients/${encodeURIComponent(petraId)}`),
  create: async ({ name, phone, email, companyContact }) => {
    return request('/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, companyContact }),
    });
  },
  update: async (petraId, { name, phone, email, companyContact }) => {
    return request(`/api/clients/${encodeURIComponent(petraId)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, phone, email, companyContact }),
    });
  },
  delete: async (petraId) => {
    return request(`/api/clients/${encodeURIComponent(petraId)}`, {
      method: 'DELETE',
    });
  },
  getCustomers: async (petraId, includeInactive = false) => {
    const query = includeInactive ? '?includeInactive=true' : '';
    return request(`/api/clients/${encodeURIComponent(petraId)}/customers${query}`);
  },
  getSchemes: async (petraId) => request(`/api/clients/${encodeURIComponent(petraId)}/schemes`),
};

// Customers (Individual Contributors / Employees) Endpoints
export const customersApi = {
  getAll: async (clientPetraId) => {
    const query = clientPetraId ? `?clientPetraId=${encodeURIComponent(clientPetraId)}` : '';
    return request(`/api/customers${query}`);
  },
  getById: async (petraId) => request(`/api/customers/${encodeURIComponent(petraId)}`),
  getByPensionNumber: async (pensionNumber) => request(`/api/customers/by-pension-number/${encodeURIComponent(pensionNumber)}`),
  create: async ({ name, phone, email, address, clientPetraID }) => {
    return request('/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        phone,
        email,
        address: address || '',
        clientPetraID,
      }),
    });
  },
  update: async (petraId, { name, phone, email, address }) => {
    return request(`/api/customers/${encodeURIComponent(petraId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        phone,
        email,
        address: address || '',
      }),
    });
  },
  delete: async (petraId) => {
    return request(`/api/customers/${encodeURIComponent(petraId)}`, {
      method: 'DELETE',
    });
  },
  getEmployments: async (petraId) => request(`/api/customers/${encodeURIComponent(petraId)}/employments`),
  addEmployment: async (petraId, { clientPetraID, startDate }) => {
    return request(`/api/customers/${encodeURIComponent(petraId)}/employments`, {
      method: 'POST',
      body: JSON.stringify({
        clientPetraID,
        startDate: startDate || new Date().toISOString(),
      }),
    });
  },
  endEmployment: async (petraId, employmentId, { endDate } = {}) => {
    return request(`/api/customers/${encodeURIComponent(petraId)}/employments/${employmentId}/end`, {
      method: 'POST',
      body: JSON.stringify({
        endDate: endDate || new Date().toISOString(),
      }),
    });
  },
  getEnrollments: async (petraId) => request(`/api/customers/${encodeURIComponent(petraId)}/enrollments`),
  enroll: async (petraId, { schemeId }) => {
    return request(`/api/customers/${encodeURIComponent(petraId)}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({
        schemeId: Number(schemeId),
      }),
    });
  },
};

// Users / System Accounts Endpoints
export const usersApi = {
  getAll: async () => request('/api/users'),
  getById: async (id) => request(`/api/users/${id}`),
  getUserEnrollments: async (userId) => request(`/api/users/${userId}/enrollments`),
};

// Pension Schemes Endpoints
export const schemesApi = {
  getAll: async (clientPetraId) => {
    const query = clientPetraId ? `?clientPetraId=${encodeURIComponent(clientPetraId)}` : '';
    return request(`/api/schemes${query}`);
  },
  getById: async (id) => request(`/api/schemes/${id}`),
  create: async ({ name, code, description, tier, clientPetraID }) => {
    return request('/api/schemes', {
      method: 'POST',
      body: JSON.stringify({
        name,
        code,
        description,
        tier: Number(tier),
        clientPetraID: clientPetraID || null,
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
  delete: async (id) => {
    return request(`/api/schemes/${id}`, {
      method: 'DELETE',
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
