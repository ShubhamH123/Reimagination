import { API_URL } from './config';
const BASE_URL = API_URL;

async function adminJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function adminLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return adminJson(res); // { token }
}

export async function createProgram(name, adminToken) {
  const res = await fetch(`${BASE_URL}/api/programs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ name }),
  });
  return adminJson(res);
}

export async function createMentor(data, adminToken) {
  const res = await fetch(`${BASE_URL}/api/mentors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify(data),
  });
  return adminJson(res);
}

export async function addMentorToProgram(programId, mentorId, adminToken) {
  const res = await fetch(`${BASE_URL}/api/programs/${programId}/add-mentor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ mentorId }),
  });
  return adminJson(res);
}

export async function getAllPrograms() {
    const res = await fetch(`${BASE_URL}/api/programs`);
    return res.json();
}
  
export async function getAllMentors(adminToken) {
    const res = await fetch(`${BASE_URL}/api/mentors`, { headers: { 'x-auth-token': adminToken } });
    return adminJson(res);
}
  
export async function mentorLogin(email, password) {
    const res = await fetch(`${BASE_URL}/api/mentors/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  
    if (!res.ok) throw new Error('Login failed');
    return res.json(); // returns { token }
}
  
export async function addMentee(token, { email, name, enrollmentNumber, programId }) {
    const res = await fetch(`${BASE_URL}/api/mentees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
         'x-auth-token': token
      },
      body: JSON.stringify({ email, name, enrollmentNumber, programId }),
    });
  
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add mentee');
    }
    return res.json(); // returns { mentee, tempPassword }
}

export async function addResource(token, resourceData, isQuiz = false) {
  const endpoint = isQuiz ? '/api/resources/quiz' : '/api/resources';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(resourceData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add resource');
  }

  return res.json(); // returns resource or quiz object
}

  
export async function getMentorDetails(token) {
    const res = await fetch(`${BASE_URL}/api/mentors/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  
    if (!res.ok) throw new Error('Failed to fetch mentor details');
    return res.json(); // returns mentor object
  }


  export async function getProgramMentees(programId, token) {
    const res = await fetch(`${BASE_URL}/api/${programId}/mentees`, {
      headers: {
      'x-auth-token': token
      }
    });
    if (!res.ok) throw new Error('Failed to fetch mentees');
    return res.json();
  }

  export async function getProgramResources(programId, token) {
    const res = await fetch(`${BASE_URL}/api/${programId}/resources`, {
      headers: {
        'x-auth-token': token
      }
    });
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  }
  