import api from '~/config/axios';

export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  district_code: number;
}

export interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number;
  wards?: Ward[];
}

export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
  districts?: District[];
}

interface ApiResponse<T> {
  success: boolean;
  status: string;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export const getLocationHierarchy = async (): Promise<Province[]> => {
  const response = await api.get<ApiResponse<Province[]>>('/api/locations/map');
  return response.data.data ?? [];
};

export const getProvinces = async (): Promise<Province[]> => {
  const response = await api.get<ApiResponse<Province[]>>('/api/locations/provinces');
  return response.data.data ?? [];
};

export const getDistrictsByProvince = async (provinceCode: number): Promise<District[]> => {
  const response = await api.get<ApiResponse<District[]>>(`/api/locations/districts/${provinceCode}`);
  return response.data.data ?? [];
};

export const getWardsByDistrict = async (districtCode: number): Promise<Ward[]> => {
  const response = await api.get<ApiResponse<Ward[]>>(`/api/locations/wards/${districtCode}`);
  return response.data.data ?? [];
};
