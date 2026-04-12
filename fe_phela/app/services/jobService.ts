import api from '~/config/axios';
import axios from 'axios';

// Get API base URL for public endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phela-backend-dyl7.onrender.com';

// Create a separate axios instance for public endpoints (no auth required)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface JobPosting {
  jobPostingId: string;
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salary?: string;
  workingHours?: string;
  experienceLevel: string;
  jobType?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  deadline?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingCreateDTO {
  title: string;
  description: string;
  requirements: string;
  benefits?: string;
  salary?: string;
  workingHours?: string;
  experienceLevel: string;
  jobType?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  deadline?: string;
}

export interface JobPostingUpdateDTO {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salary?: string;
  workingHours?: string;
  experienceLevel?: string;
  jobType?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  deadline?: string;
}

export interface Application {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  cvUrl?: string;
  status: string;
  appliedAt: string;
}

export interface ApplicationRequestDTO {
  fullName: string;
  email: string;
  phone: string;
  cvFile: File;
}

// PUBLIC ENDPOINTS - No authentication required
export const getPublicJobPostings = async () => {
  const response = await publicApi.get('/api/job-postings');
  return response.data;
};

export const getPublicJobPostingById = async (jobPostingId: string) => {
  const response = await publicApi.get(`/api/job-postings/${jobPostingId}`);
  return response.data;
};

export const getApplicationCount = async (jobPostingId: string) => {
  const response = await publicApi.get(`/api/job-postings/${jobPostingId}/applications/count`);
  return response.data;
};

export const searchPublicJobPostings = async (searchParams: {
  title?: string;
  location?: string;
  experienceLevel?: string;
  jobType?: string;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const response = await publicApi.get(`/api/job-postings/search?${params.toString()}`);
  return response.data;
};

// APPLICATION ENDPOINTS - Public for applying
export const applyForJob = async (jobPostingId: string, applicationData: ApplicationRequestDTO) => {
  const formData = new FormData();
  formData.append('fullName', applicationData.fullName);
  formData.append('email', applicationData.email);
  formData.append('phone', applicationData.phone);
  formData.append('cvFile', applicationData.cvFile);

  const response = await publicApi.post(`/api/applications/job-postings/${jobPostingId}/apply`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPublicApplicationsByJobPosting = async (jobPostingId: string) => {
  const response = await publicApi.get(`/api/applications/job-postings/${jobPostingId}`);
  return response.data;
};

// ADMIN ENDPOINTS - Require admin authentication
export const getAllJobPostingsAdmin = async (page: number = 0, size: number = 10, search?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await api.get(`/api/admin/job-postings?${params.toString()}`);
  return response.data;
};

export const createJobPosting = async (jobData: JobPostingCreateDTO) => {
  const response = await api.post('/api/admin/job-postings', jobData);
  return response.data;
};

export const updateJobPosting = async (jobPostingId: string, jobData: JobPostingUpdateDTO) => {
  const response = await api.put(`/api/admin/job-postings/${jobPostingId}`, jobData);
  return response.data;
};

export const updateJobPostingStatus = async (jobPostingId: string, status: string) => {
  const response = await api.patch(`/api/admin/job-postings/${jobPostingId}/status`, null, {
    params: { status }
  });
  return response.data;
};

export const deleteJobPosting = async (jobPostingId: string) => {
  const response = await api.delete(`/api/admin/job-postings/${jobPostingId}`);
  return response.data;
};

export const getApplicationDetails = async (jobPostingId: string, applicationId: string) => {
  const response = await api.get(`/api/admin/job-postings/${jobPostingId}/applications/${applicationId}`);
  return response.data;
};

export const updateApplicationStatus = async (jobPostingId: string, applicationId: string, status: string) => {
  const response = await api.patch(`/api/admin/job-postings/${jobPostingId}/applications/${applicationId}/status`, null, {
    params: { status }
  });
  return response.data;
};