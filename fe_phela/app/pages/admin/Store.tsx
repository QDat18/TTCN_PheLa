import React, { useState, useEffect, useMemo } from 'react';
import api from '~/config/axios';
import { toast } from 'react-toastify';
import { FiEdit, FiPlus, FiSearch, FiMapPin, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa';
import { useAuth } from '~/AuthContext';
import type { Province as ProvinceDTO, District as DistrictDTO } from '~/services/locationService';
import { getLocationHierarchy } from '~/services/locationService';

const useMapComponents = () => {
  const [mapComponents, setMapComponents] = useState<{
    MapContainer?: any;
    TileLayer?: any;
    Marker?: any;
    useMapEvents?: any;
    L?: any;
  }>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('react-leaflet'),
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ]).then(([{ MapContainer, TileLayer, Marker, useMapEvents }, L]) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });

        setMapComponents({
          MapContainer,
          TileLayer,
          Marker,
          useMapEvents,
          L,
        });
      });
    }
  }, []);

  return mapComponents;
};

interface Branch {
  branchCode: string;
  branchName: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  address: string;
  status: string;
}

interface GoongPrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

const Store = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentBranchCode, setCurrentBranchCode] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState({
    branchName: '',
    latitude: 0,
    longitude: 0,
    city: '',
    district: '',
    address: '',
    status: 'SHOW',
  });
  const [mapPosition, setMapPosition] = useState<[number, number]>([21.0278, 105.8342]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const goongApiKey = import.meta.env.VITE_GOONG_API_KEY;
  const [locationHierarchy, setLocationHierarchy] = useState<ProvinceDTO[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [goongSuggestions, setGoongSuggestions] = useState<GoongPrediction[]>([]);
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [goongError, setGoongError] = useState('');
  const { MapContainer, TileLayer, Marker, useMapEvents } = useMapComponents();
  const { user } = useAuth();

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationLoading(true);
        const data = await getLocationHierarchy();
        setLocationHierarchy(data);
        setLocationError('');
      } catch (err) {
        console.error('Error fetching location hierarchy:', err);
        setLocationError('Không thể tải dữ liệu tỉnh/thành phố. Vui lòng thử lại sau.');
      } finally {
        setLocationLoading(false);
      }
    };

    loadLocations();
  }, []);

  const canUseGoong = Boolean(goongApiKey);

  const selectedProvince: ProvinceDTO | null = useMemo(() => {
    if (selectedProvinceCode === null) return null;
    return locationHierarchy.find((province) => province.code === selectedProvinceCode) ?? null;
  }, [locationHierarchy, selectedProvinceCode]);

  const districtOptions: DistrictDTO[] = useMemo(() => {
    return selectedProvince?.districts ?? [];
  }, [selectedProvince]);

  const normalizeVietnamese = (value?: string) => {
    if (!value) return '';
    let normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    // Remove common prefixes and abbreviations
    const prefixes = [
      /^thanh pho\s+/, /^tp\.?\s+/,
      /^tinh\s+/,
      /^quan\s+/, /^q\.?\s+/,
      /^huyen\s+/, /^h\.?\s+/,
      /^phuong\s+/, /^p\.?\s+/,
      /^xa\s+/
    ];
    prefixes.forEach(regex => {
      normalized = normalized.replace(regex, '');
    });
    return normalized.trim();
  };

  const isNameMatch = (candidate?: string, expected?: string) => {
    if (!candidate || !expected) return false;
    const normalizedCandidate = normalizeVietnamese(candidate);
    const normalizedExpected = normalizeVietnamese(expected);
    return (
      normalizedCandidate === normalizedExpected ||
      normalizedCandidate.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedCandidate)
    );
  };

  const prefillLocationSelections = (city: string, district: string) => {
    if (locationHierarchy.length === 0) return;

    const matchedProvince = locationHierarchy.find((province) => isNameMatch(province.name, city));
    if (matchedProvince) {
      if (selectedProvinceCode !== matchedProvince.code) {
        setSelectedProvinceCode(matchedProvince.code);
      }

      const matchedDistrict = matchedProvince.districts?.find((item) => isNameMatch(item.name, district));
      if (matchedDistrict) {
        if (selectedDistrictCode !== matchedDistrict.code) {
          setSelectedDistrictCode(matchedDistrict.code);
        }
      } else {
        setSelectedDistrictCode(null);
      }
    } else {
      setSelectedProvinceCode(null);
      setSelectedDistrictCode(null);
    }
  };

  const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (!value) {
      setSelectedProvinceCode(null);
      setSelectedDistrictCode(null);
      setNewBranch((prev) => ({ ...prev, city: '', district: '' }));
      return;
    }

    const code = Number(value);
    const province = locationHierarchy.find((item) => item.code === code) ?? null;
    setSelectedProvinceCode(code);
    setSelectedDistrictCode(null);
    setNewBranch((prev) => ({
      ...prev,
      city: province?.name ?? '',
      district: '',
    }));
  };

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (!value) {
      setSelectedDistrictCode(null);
      setNewBranch((prev) => ({ ...prev, district: '' }));
      return;
    }

    const code = Number(value);
    const district = districtOptions.find((item) => item.code === code) ?? null;
    setSelectedDistrictCode(code);
    setNewBranch((prev) => ({
      ...prev,
      district: district?.name ?? '',
    }));
  };

  const handleSelectSuggestion = async (suggestion: GoongPrediction) => {
    if (!canUseGoong) return;

    setShowSuggestionList(false);
    setGoongSuggestions([]);
    setSearchQuery(suggestion.description);

    try {
      setIsSearchingLocation(true);
      setGoongError('');
      const response = await fetch(
        `https://rsapi.goong.io/place/details?place_id=${suggestion.place_id}&api_key=${goongApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Place detail request failed with status ${response.status}`);
      }

      const data = await response.json();
      const result = data?.result;
      if (!result) {
        throw new Error('No place detail found');
      }

      const geometry = result.geometry?.location;
      const compound = result.compound ?? {};

      const parsedLat = geometry?.lat !== undefined ? Number(geometry.lat) : undefined;
      const parsedLng = geometry?.lng !== undefined ? Number(geometry.lng) : undefined;

      const updatedBranch = {
        ...newBranch,
        city: compound.city || compound.province || newBranch.city,
        district: compound.district || newBranch.district,
        address: result.formatted_address || suggestion.description,
        latitude: parsedLat ?? newBranch.latitude,
        longitude: parsedLng ?? newBranch.longitude,
      };

      setNewBranch(updatedBranch);
      if (parsedLat !== undefined && parsedLng !== undefined) {
        setMapPosition([parsedLat, parsedLng]);
      }
      prefillLocationSelections(updatedBranch.city, updatedBranch.district);
      toast.success('Đã cập nhật địa chỉ từ bản đồ!');
    } catch (err) {
      console.error('Error fetching Goong place detail:', err);
      setGoongError('Không thể lấy chi tiết địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [user]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedProvinceCode(null);
      setSelectedDistrictCode(null);
      setGoongSuggestions([]);
      setShowSuggestionList(false);
      setGoongError('');
      return;
    }

    prefillLocationSelections(newBranch.city, newBranch.district);
  }, [isModalOpen, newBranch.city, newBranch.district, locationHierarchy]);

  useEffect(() => {
    if (!canUseGoong || !isModalOpen) {
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setGoongSuggestions([]);
      setShowSuggestionList(false);
      setGoongError('');
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        setGoongError('');
        const response = await fetch(
          `https://rsapi.goong.io/place/autocomplete?api_key=${goongApiKey}&input=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Autocomplete request failed with status ${response.status}`);
        }

        const data = await response.json();
        const predictions: GoongPrediction[] = data?.predictions ?? [];
        setGoongSuggestions(predictions);
        setShowSuggestionList(predictions.length > 0);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Error fetching Goong autocomplete:', err);
        setGoongSuggestions([]);
        setShowSuggestionList(false);
        setGoongError('Không thể gợi ý địa chỉ. Vui lòng thử lại.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      setIsLoadingSuggestions(false);
    };
  }, [searchQuery, canUseGoong, goongApiKey, isModalOpen]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/branch');
      const formattedBranches = Array.isArray(response.data)
        ? response.data.map((branch: any) => ({ ...branch, status: branch.status.toString() }))
        : response.data.content.map((branch: any) => ({ ...branch, status: branch.status.toString() }));
      setBranches(formattedBranches);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast.error('Không thể tải danh sách cửa hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (branchCode: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thay đổi trạng thái cửa hàng?')) return;
    setLoading(true);
    try {
      const response = await api.patch(`/api/admin/branch/${branchCode}/toggle-status`);
      setBranches((prev) =>
        prev.map((branch) =>
          branch.branchCode === branchCode ? {
            ...branch,
            status: response.data.status === 'SHOW' ? 'SHOW' : 'HIDE'
          } : branch
        )
      );
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    try {
      if (!newBranch.branchName || !newBranch.city || !newBranch.district || !newBranch.address) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }
      const payload = {
        branchName: newBranch.branchName,
        latitude: newBranch.latitude,
        longitude: newBranch.longitude,
        city: newBranch.city,
        district: newBranch.district,
        address: newBranch.address,
        status: newBranch.status,
      };
      const response = await api.post('/api/admin/branch/create', payload);
      setBranches((prev) => [
        {
          ...response.data,
          status: response.data.status?.toString() || 'SHOW',
        },
        ...prev,
      ]);
      setIsModalOpen(false);
      toast.success('Tạo cửa hàng thành công!');
      resetForm();
    } catch (error: any) {
      console.error('Error creating branch:', error);
      if (error.response?.status === 409) {
        toast.error('Cửa hàng đã tồn tại. Vui lòng kiểm tra lại.');
      } else {
        toast.error('Không thể tạo cửa hàng. Vui lòng thử lại.');
      }
    }
  };

  const handleUpdateBranch = async () => {
    if (!currentBranchCode) return;
    try {
      if (!newBranch.branchName || !newBranch.city || !newBranch.district || !newBranch.address) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }
      const payload = {
        branchName: newBranch.branchName,
        latitude: newBranch.latitude,
        longitude: newBranch.longitude,
        city: newBranch.city,
        district: newBranch.district,
        address: newBranch.address,
        status: newBranch.status,
      };
      const response = await api.put(`/api/admin/branch/${currentBranchCode}`, payload);
      setBranches((prev) =>
        prev.map((branch) =>
          branch.branchCode === currentBranchCode ? { ...branch, ...response.data } : branch
        )
      );
      setIsModalOpen(false);
      toast.success('Cập nhật cửa hàng thành công!');
      resetForm();
    } catch (error: any) {
      console.error('Error updating branch:', error);
      if (error.response?.status === 409) {
        toast.error('Tên cửa hàng đã tồn tại. Vui lòng chọn tên khác.');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy cửa hàng. Vui lòng thử lại.');
      } else {
        toast.error('Không thể cập nhật cửa hàng. Vui lòng thử lại.');
      }
    }
  };

  const openEditModal = (branch: Branch) => {
    setIsEditing(true);
    setCurrentBranchCode(branch.branchCode);
    setNewBranch({
      branchName: branch.branchName,
      latitude: branch.latitude,
      longitude: branch.longitude,
      city: branch.city,
      district: branch.district,
      address: branch.address,
      status: branch.status,
    });
    setMapPosition([branch.latitude, branch.longitude]);
    setSearchQuery(branch.address ?? '');
    setGoongSuggestions([]);
    setShowSuggestionList(false);
    setGoongError('');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewBranch({
      branchName: '',
      latitude: 0,
      longitude: 0,
      city: '',
      district: '',
      address: '',
      status: 'SHOW',
    });
    setMapPosition([21.0278, 105.8342]);
    setCurrentBranchCode(null);
    setIsEditing(false);
    setSearchQuery('');
    setSelectedProvinceCode(null);
    setSelectedDistrictCode(null);
    setGoongSuggestions([]);
    setShowSuggestionList(false);
    setGoongError('');
  };

  const searchLocation = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (canUseGoong) {
      if (goongSuggestions.length > 0) {
        await handleSelectSuggestion(goongSuggestions[0]);
        return;
      }
      try {
        setIsSearchingLocation(true);
        setGoongError('');
        const response = await fetch(
          `https://rsapi.goong.io/geocode?api_key=${goongApiKey}&address=${encodeURIComponent(trimmed)}`
        );
        if (!response.ok) throw new Error(`Goong geocode failed with status ${response.status}`);
        const data = await response.json();
        const firstResult = data?.results?.[0];
        if (firstResult) {
          const compound = firstResult.compound ?? {};
          const location = firstResult.geometry?.location;
          const parsedLat = location?.lat !== undefined ? Number(location.lat) : undefined;
          const parsedLng = location?.lng !== undefined ? Number(location.lng) : undefined;
          setNewBranch((prev) => {
            const updated = {
              ...prev,
              city: compound.city || compound.province || prev.city,
              district: compound.district || prev.district,
              address: firstResult.formatted_address || trimmed,
              latitude: parsedLat ?? prev.latitude,
              longitude: parsedLng ?? prev.longitude,
            };
            prefillLocationSelections(updated.city, updated.district);
            return updated;
          });
          if (parsedLat !== undefined && parsedLng !== undefined) setMapPosition([parsedLat, parsedLng]);
          toast.success('Đã tìm thấy vị trí!');
          setShowSuggestionList(false);
          setGoongSuggestions([]);
        } else {
          setGoongError('Không tìm thấy địa chỉ phù hợp. Vui lòng thử từ khóa khác.');
          toast.error('Không tìm thấy vị trí. Vui lòng thử lại!');
        }
      } catch (error) {
        console.error('Error searching location with Goong:', error);
        setGoongError('Có lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.');
        toast.error('Lỗi khi tìm kiếm vị trí. Vui lòng thử lại!');
      } finally {
        setIsSearchingLocation(false);
      }
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lon);
        setMapPosition([parsedLat, parsedLng]);
        setNewBranch((prev) => ({
          ...prev,
          latitude: parsedLat,
          longitude: parsedLng,
        }));
        toast.success('Đã tìm thấy vị trí!');
        setShowSuggestionList(false);
        setGoongSuggestions([]);
      } else {
        toast.error('Không tìm thấy vị trí. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Lỗi khi tìm kiếm vị trí. Vui lòng thử lại!');
    }
  };

  const LocationMarker = () => {
    if (!useMapEvents || !Marker) return null;
    const map = useMapEvents({
      click(e: any) {
        setMapPosition([e.latlng.lat, e.latlng.lng]);
        setNewBranch((prev) => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
      },
    });
    return <Marker position={mapPosition} />;
  };

  const renderMap = () => {
    if (!MapContainer || !TileLayer) {
      return (
        <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Đang tải bản đồ...</div>
        </div>
      );
    }
    return (
      <MapContainer
        center={mapPosition}
        zoom={13}
        style={{ height: '256px', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
    );
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesCity = cityFilter === '' || isNameMatch(branch.city, cityFilter);
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        branch.branchName.toLowerCase().includes(searchLower) ||
        branch.branchCode.toLowerCase().includes(searchLower) ||
        branch.address.toLowerCase().includes(searchLower);
      return matchesCity && matchesSearch;
    });
  }, [branches, cityFilter, searchTerm]);

  const cityList = useMemo(() => {
    if (locationHierarchy.length > 0) {
      return locationHierarchy.map(p => p.name).sort((a, b) => a.localeCompare(b, 'vi'));
    }
    const cities = branches.map(b => b.city);
    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [branches, locationHierarchy]);

  const filteredCityOptions = useMemo(() => {
    const search = citySearch.toLowerCase().trim();
    if (!search) return cityList;
    return cityList.filter(city => city.toLowerCase().includes(search));
  }, [cityList, citySearch]);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#2C1E16] uppercase tracking-widest">Quản lý cửa hàng</h1>
            <p className="text-[#8C5A35] text-base font-medium">Hệ thống {branches.length} điểm đến Phê La trên toàn quốc</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="text-[#8C5A35] group-focus-within:scale-110 transition-transform" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhanh..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all placeholder:text-gray-400 shadow-sm"
              />
            </div>
            <div className="relative w-full sm:w-56 group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiMapPin className="text-[#8C5A35] group-focus-within:scale-110 transition-transform" />
              </div>
              <button
                onClick={() => setIsCityModalOpen(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-medium text-left hover:border-[#d4a373] transition-all shadow-sm flex items-center justify-between"
              >
                <span className={`truncate ${cityFilter ? 'text-[#2C1E16]' : 'text-gray-400'}`}>
                  {cityFilter || 'Tất cả thành phố'}
                </span>
                <FaChevronDown size={12} className="absolute right-4 text-[#8C5A35]" />
              </button>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-[#2C1E16] text-[#FCF8F1] rounded-2xl hover:bg-[#8C5A35] transition-all text-sm font-black uppercase tracking-widest shadow-md shadow-[#2C1E16]/10"
              >
                <FiPlus className="mr-2" />
                Thêm cửa hàng
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C5A35]"></div>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#8C5A35] animate-pulse">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : filteredBranches.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-[#2C1E16]/5 border border-[#E5D5C5]/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5D5C5]/30">
                <thead>
                  <tr className="bg-[#FDF5E6]/50">
                    <th className="px-6 py-4 text-left text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Mã</th>
                    <th className="px-6 py-4 text-left text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Cửa hàng</th>
                    <th className="px-6 py-4 text-left text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Địa chỉ</th>
                    <th className="px-6 py-4 text-left text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Vị trí</th>
                    <th className="px-6 py-4 text-left text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-[12px] font-black text-[#8C5A35] uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D5C5]/20">
                  {filteredBranches.map((branch) => (
                    <tr key={branch.branchCode} className="hover:bg-[#FDF5E6]/20 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-[#2C1E16]">{branch.branchCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-[13px] font-black text-[#2C1E16] uppercase tracking-wider">{branch.branchName}</div></td>
                      <td className="px-6 py-4 text-[13px] text-[#8C5A35] max-w-xs truncate font-medium">{branch.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-[12px] font-bold text-[#2C1E16]">{branch.city}</div><div className="text-[11px] text-[#8C5A35] font-medium">{branch.district}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${branch.status === 'SHOW' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{branch.status === 'SHOW' ? 'Hoạt động' : 'Tạm nghỉ'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium space-x-2">
                        {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(branch)} className="p-2 text-[#8C5A35] hover:bg-white rounded-xl hover:shadow-sm transition-all" title="Chỉnh sửa"><FiEdit size={18} /></button>
                            <button onClick={() => toggleStatus(branch.branchCode)} className={`p-2 rounded-xl hover:shadow-sm transition-all ${branch.status === 'SHOW' ? 'text-red-400 hover:bg-red-50' : 'text-green-400 hover:bg-green-50'}`} title={branch.status === 'SHOW' ? 'Tắt hoạt động' : 'Bật hoạt động'}>{branch.status === 'SHOW' ? <FiToggleLeft size={22} /> : <FiToggleRight size={22} />}</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-[#E5D5C5]/50">
            <div className="bg-[#FDF5E6] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><FiMapPin className="h-10 w-10 text-[#8C5A35] opacity-50" /></div>
            <h3 className="text-lg font-black text-[#2C1E16] uppercase tracking-widest">Không tìm thấy cửa hàng</h3>
            <p className="mt-2 text-[#8C5A35] text-base font-medium italic">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc lọc.</p>
            {(searchTerm || cityFilter) && (<button onClick={() => { setSearchTerm(''); setCityFilter(''); }} className="mt-6 text-[12px] font-black text-[#d4a373] uppercase tracking-[0.2em] hover:underline">Xóa tất cả bộ lọc</button>)}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#FCF8F1] rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#E5D5C5]">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-black text-[#2C1E16] uppercase tracking-[0.2em]">{isEditing ? 'Cập nhật cửa hàng' : 'Thêm cửa hàng mới'}</h2>
                    <div className="h-1 w-12 bg-[#8C5A35] mt-2 rounded-full"></div>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-[#E5D5C5]/30 rounded-full transition-colors"><svg className="h-6 w-6 text-[#8C5A35]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Tên cửa hàng *</label>
                      <input type="text" value={newBranch.branchName} onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm" placeholder="Nhập tên cửa hàng" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Thành phố *</label>
                        {locationHierarchy.length > 0 ? (
                          <div className="relative">
                            <select value={selectedProvinceCode !== null ? selectedProvinceCode.toString() : ''} onChange={handleProvinceChange} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer" disabled={locationLoading} required>
                              <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                              {locationHierarchy.map((province) => (<option key={province.code} value={province.code.toString()}>{province.name}</option>))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#8C5A35]"><FaChevronDown size={10} /></div>
                          </div>
                        ) : (
                          <input type="text" value={newBranch.city} onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm" placeholder="Nhập thành phố" />
                        )}
                      </div>
                      <div className="group">
                        <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Quận/Huyện *</label>
                        {locationHierarchy.length > 0 ? (
                          <div className="relative">
                            <select value={selectedDistrictCode !== null ? selectedDistrictCode.toString() : ''} onChange={handleDistrictChange} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer" disabled={!selectedProvinceCode || locationLoading} required>
                              <option value="" disabled>Chọn Quận/Huyện</option>
                              {districtOptions.map((district) => (<option key={district.code} value={district.code.toString()}>{district.name}</option>))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#8C5A35]"><FaChevronDown size={10} /></div>
                          </div>
                        ) : (
                          <input type="text" value={newBranch.district} onChange={(e) => setNewBranch({ ...newBranch, district: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm" placeholder="Nhập quận/huyện" />
                        )}
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Địa chỉ cụ thể *</label>
                      <input type="text" value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm" placeholder="Số nhà, tên đường..." />
                    </div>
                    <div className="group">
                      <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Tìm kiếm vị trí</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><FiSearch className="text-[#8C5A35]" /></div>
                          <input type="text" value={searchQuery} onChange={(e) => { const value = e.target.value; setSearchQuery(value); if (canUseGoong) setShowSuggestionList(true); }} onFocus={() => { if (canUseGoong && goongSuggestions.length > 0) setShowSuggestionList(true); }} onBlur={() => window.setTimeout(() => setShowSuggestionList(false), 150)} className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5D5C5] rounded-2xl text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm" placeholder={canUseGoong ? 'Gợi ý địa chỉ tự động...' : 'Tìm kiếm địa chỉ...'} />
                          {canUseGoong && showSuggestionList && goongSuggestions.length > 0 && (
                            <ul className="absolute z-[60] mt-2 w-full rounded-2xl border border-[#E5D5C5] bg-white shadow-2xl max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                              {goongSuggestions.map((suggestion) => (
                                <li key={suggestion.place_id} onMouseDown={(e) => { e.preventDefault(); void handleSelectSuggestion(suggestion); }} className="cursor-pointer px-4 py-3 hover:bg-[#FDF5E6] transition-colors border-b border-[#E5D5C5]/30 last:border-0">
                                  <p className="font-bold text-[13px] text-[#2C1E16]">{suggestion.structured_formatting?.main_text || suggestion.description}</p>
                                  {suggestion.structured_formatting?.secondary_text && (<p className="text-[11px] text-[#8C5A35] mt-0.5">{suggestion.structured_formatting.secondary_text}</p>)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button onClick={searchLocation} disabled={isSearchingLocation} className="px-6 py-3 bg-[#E5D5C5]/30 text-[#8C5A35] rounded-2xl hover:bg-[#E5D5C5]/50 transition-all font-black text-[12px] uppercase tracking-widest disabled:opacity-50">{isSearchingLocation ? '...' : 'Tìm'}</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[12px] font-black text-[#8C5A35] uppercase tracking-widest mb-2 ml-1">Vị trí bản đồ</label>
                    <div className="rounded-[2rem] overflow-hidden border-2 border-[#E5D5C5] shadow-inner h-[280px]">{renderMap()}</div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-[#E5D5C5] flex justify-between items-center">
                      <div><p className="text-[11px] font-black text-[#8C5A35] uppercase tracking-widest mb-1">Tọa độ GPS</p><p className="text-[13px] font-bold text-[#2C1E16]">{mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}</p></div>
                      <div className="w-10 h-10 rounded-full bg-[#FDF5E6] flex items-center justify-center"><FiMapPin className="text-[#8C5A35]" /></div>
                    </div>
                  </div>
                </div>
                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[#E5D5C5]/50">
                  <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-8 py-3 text-[12px] font-black text-[#8C5A35] uppercase tracking-[0.2em] hover:bg-[#E5D5C5]/20 rounded-2xl transition-all">Hủy bỏ</button>
                  <button onClick={isEditing ? handleUpdateBranch : handleCreateBranch} className="px-10 py-3 bg-[#2C1E16] text-[#FCF8F1] rounded-2xl hover:bg-[#8C5A35] transition-all font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-[#2C1E16]/20">{isEditing ? 'Cập nhật hệ thống' : 'Khởi tạo cửa hàng'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isCityModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-[#FCF8F1] rounded-[2.5rem] shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-[#E5D5C5] animate-in fade-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-[#2C1E16] uppercase tracking-[0.2em]">Chọn khu vực</h2>
                  <div className="h-1 w-12 bg-[#8C5A35] mt-2 rounded-full"></div>
                </div>
                <button 
                  onClick={() => setIsCityModalOpen(false)}
                  className="p-3 hover:bg-[#E5D5C5]/30 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6 text-[#8C5A35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Box */}
              <div className="px-8 mb-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiSearch className="text-[#8C5A35] group-focus-within:scale-110 transition-transform" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Tìm nhanh tỉnh thành..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5D5C5] rounded-[1.5rem] text-sm font-bold text-[#2C1E16] focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* City Grid */}
              <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => { setCityFilter(''); setIsCityModalOpen(false); }}
                    className={`p-4 rounded-2xl text-sm font-bold text-center transition-all border-2 ${
                      cityFilter === '' 
                      ? 'bg-[#2C1E16] text-[#FCF8F1] border-[#2C1E16] shadow-lg shadow-[#2C1E16]/20' 
                      : 'bg-white text-[#8C5A35] border-transparent hover:border-[#d4a373] hover:bg-[#FDF5E6]'
                    }`}
                  >
                    Tất cả
                  </button>
                  {filteredCityOptions.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setCityFilter(city); setIsCityModalOpen(false); }}
                      className={`p-4 rounded-2xl text-sm font-bold text-center transition-all border-2 truncate ${
                        cityFilter === city 
                        ? 'bg-[#2C1E16] text-[#FCF8F1] border-[#2C1E16] shadow-lg shadow-[#2C1E16]/20' 
                        : 'bg-white text-[#8C5A35] border-transparent hover:border-[#d4a373] hover:bg-[#FDF5E6]'
                      }`}
                      title={city}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                {filteredCityOptions.length === 0 && (
                  <div className="py-12 text-center">
                    <FiMapPin className="mx-auto h-12 w-12 text-[#E5D5C5] mb-4" />
                    <p className="text-[#8C5A35] font-black uppercase text-xs tracking-widest">Không tìm thấy tỉnh thành này</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;