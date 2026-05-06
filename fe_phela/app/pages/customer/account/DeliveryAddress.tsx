import React, { useState, useEffect, useMemo, useRef } from 'react';
import HeadOrder from '~/components/customer/HeadOrder';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaStar, FaRegStar, FaSearchLocation, FaHome, FaBriefcase, FaEllipsisV, FaCheckCircle } from 'react-icons/fa';
import type { Province as ProvinceDTO, District as DistrictDTO, Ward as WardDTO } from '~/services/locationService';
import { getLocationHierarchy } from '~/services/locationService';

interface Address {
  addressId: string;
  city: string;
  district: string;
  ward: string;
  recipientName: string;
  phone: string;
  detailedAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}



interface GoongPrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

const DeliveryAddress = () => {
  const { user } = useAuth();
  const goongApiKey = import.meta.env.VITE_GOONG_API_KEY;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [locationHierarchy, setLocationHierarchy] = useState<ProvinceDTO[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({
    city: '',
    district: '',
    ward: '',
    recipientName: '',
    phone: '',
    detailedAddress: '',
    latitude: 0,
    longitude: 0,
    isDefault: false
  });
  const [mapUrl, setMapUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addressToPrefill, setAddressToPrefill] = useState<Partial<Address> | null>(null);
  const [goongSuggestions, setGoongSuggestions] = useState<GoongPrediction[]>([]);
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [goongError, setGoongError] = useState('');
  const [biasLocation, setBiasLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!showForm) {
      setBiasLocation(null);
      return;
    }

    // Hybrid Strategy: Fresh GPS -> Saved Backend Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBiasLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("GPS access denied or failed, using backend fallback...", error);
          if (user && 'latitude' in user && user.latitude && user.longitude) {
            setBiasLocation({
              lat: user.latitude as number,
              lng: user.longitude as number
            });
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    } else if (user && 'latitude' in user && user.latitude && user.longitude) {
      setBiasLocation({
        lat: user.latitude as number,
        lng: user.longitude as number
      });
    }
  }, [showForm, user]);

  const normalizeVietnamese = (value?: string) =>
    value ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

  const stripPrefixes = (s: string) => {
    // Remove common Vietnamese administrative prefixes
    // Using regex with unicode normalization considered
    return s.replace(/^(t\wnh|th\wnh ph\u1ed1|tp\.?|qu\u1eadn|huy\u1ec7n|ph\u01b0\u1eddng|x\u00e3|th\u1ecb tr\u1ea5n|th\u1ecb x\u00e3|h\u00e0 n\u1ed9i|h\u1ed3 ch\u00ed minh)\s+/gi, '').trim();
  };

  const isNameMatch = (candidate?: string, expected?: string) => {
    if (!candidate || !expected) return false;
    
    // 1. Basic normalization (accents, lowercase)
    const normalizedCandidate = normalizeVietnamese(candidate);
    const normalizedExpected = normalizeVietnamese(expected);
    
    // 2. Exact match check
    if (normalizedCandidate === normalizedExpected) return true;
    
    // 3. Strip prefixes and check again
    const strippedCandidate = stripPrefixes(normalizedCandidate);
    const strippedExpected = stripPrefixes(normalizedExpected);
    
    if (strippedCandidate === strippedExpected && strippedCandidate.length > 0) return true;

    // 4. Special check for numbered districts (e.g. "Quận 1")
    // If it's a number, we must match exactly to avoid "12" matching "1"
    const isNumberOnly = /^\d+$/.test(strippedExpected);
    if (isNumberOnly) {
       return strippedCandidate === strippedExpected;
    }

    // 5. Containment check (only for non-numbers)
    return (
      (strippedCandidate.length > 2 && strippedExpected.includes(strippedCandidate)) ||
      (strippedExpected.length > 2 && strippedCandidate.includes(strippedExpected))
    );
  };

  const prefillLocationSelections = (address: Partial<Address>) => {
    if (!address || locationHierarchy.length === 0) {
      return;
    }

    const matchedProvince = locationHierarchy.find((province) =>
      isNameMatch(province.name, address.city)
    );

    if (!matchedProvince) {
      setSelectedProvinceCode(null);
      setSelectedDistrictCode(null);
      setSelectedWardCode(null);
      return;
    }

    if (selectedProvinceCode !== matchedProvince.code) {
      setSelectedProvinceCode(matchedProvince.code);
    }

    let matchedDistrict = matchedProvince.districts?.find((district) =>
      isNameMatch(district.name, address.district)
    );

    let matchedWard: WardDTO | undefined;

    // Fallback: If district not found by name, try to find it via Ward match or search detailedAddress
    if (!matchedDistrict && address.ward) {
       // Search all districts in this province for this ward
       for (const district of matchedProvince.districts || []) {
         const ward = district.wards?.find(w => isNameMatch(w.name, address.ward));
         if (ward) {
           matchedDistrict = district;
           matchedWard = ward;
           break;
         }
       }
    }

    // Still no district? Try to see if any district name is in the detailedAddress
    if (!matchedDistrict && address.detailedAddress) {
       matchedDistrict = matchedProvince.districts?.find(district => 
         isNameMatch(address.detailedAddress, district.name)
       );
    }

    if (matchedDistrict) {
      if (selectedDistrictCode !== matchedDistrict.code) {
        setSelectedDistrictCode(matchedDistrict.code);
      }
      
      if (!matchedWard) {
        matchedWard = matchedDistrict.wards?.find((ward) => isNameMatch(ward.name, address.ward));
      }

      if (matchedWard) {
        if (selectedWardCode !== matchedWard.code) {
          setSelectedWardCode(matchedWard.code);
        }
      } else {
        setSelectedWardCode(null);
      }
    } else {
      setSelectedDistrictCode(null);
      setSelectedWardCode(null);
    }

    setCurrentAddress((prev) => {
      const updates: Partial<Address> = {};

      if (matchedProvince && prev.city !== matchedProvince.name) {
        updates.city = matchedProvince.name;
      }

      if (matchedDistrict) {
        if (prev.district !== matchedDistrict.name) {
          updates.district = matchedDistrict.name;
        }
      }

      if (matchedWard) {
        if (prev.ward !== matchedWard.name) {
          updates.ward = matchedWard.name;
        }
      }

      if (Object.keys(updates).length === 0) {
        return prev;
      }

      return {
        ...prev,
        ...updates,
      };
    });
  };

  const selectedProvince: ProvinceDTO | null = useMemo(() => {
    if (selectedProvinceCode === null) return null;
    return locationHierarchy.find((province) => province.code === selectedProvinceCode) ?? null;
  }, [locationHierarchy, selectedProvinceCode]);

  const districtOptions: DistrictDTO[] = useMemo(() => {
    return selectedProvince?.districts ?? [];
  }, [selectedProvince]);

  const selectedDistrict: DistrictDTO | null = useMemo(() => {
    if (selectedDistrictCode === null) return null;
    return districtOptions.find((district) => district.code === selectedDistrictCode) ?? null;
  }, [districtOptions, selectedDistrictCode]);

  const wardOptions: WardDTO[] = useMemo(() => {
    return selectedDistrict?.wards ?? [];
  }, [selectedDistrict]);

  const useLocationDropdowns = locationHierarchy.length > 0;
  // Check if it's a real key or just the placeholder/missing
  const canUseGoong = Boolean(goongApiKey && !goongApiKey.startsWith('Kzxxxx') && goongApiKey.length > 10);

  useEffect(() => {
    const customerId = (user as any)?.customerId;
    if (customerId && !isFetchingRef.current) {
      fetchAddresses();
    }
  }, [(user as any)?.customerId]);

  useEffect(() => {
    if (!showForm) {
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

        if (canUseGoong) {
          // Normal Goong Strategy
          const biasQuery = biasLocation ? `&location=${biasLocation.lat},${biasLocation.lng}` : '';
          const response = await fetch(
            `https://rsapi.goong.io/place/autocomplete?api_key=${goongApiKey}&input=${encodeURIComponent(trimmed)}${biasQuery}`,
            { signal: controller.signal }
          );

          if (!response.ok) throw new Error(`Goong failed`);
          const data = await response.json();
          const predictions: GoongPrediction[] = data?.predictions ?? [];
          setGoongSuggestions(predictions);
          setShowSuggestionList(predictions.length > 0);
        } else {
          // Fallback Strategy: Nominatim (Keyless)
          // We use viewbox to bias results around current location
          let biasParams = '';
          if (biasLocation) {
             const offset = 0.1; // ~10km bias
             biasParams = `&viewbox=${biasLocation.lng - offset},${biasLocation.lat + offset},${biasLocation.lng + offset},${biasLocation.lat - offset}&bounded=0`;
          }
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=5&countrycodes=vn${biasParams}`,
            { signal: controller.signal }
          );

          if (!response.ok) throw new Error(`Nominatim failed`);
          const data = await response.json();
          
          // Map Nominatim results to Goong interface format
          const mapped: GoongPrediction[] = data.map((item: any) => ({
            description: item.display_name,
            place_id: `osm-${item.place_id}`, // Prefix to distinguish from Goong
            structured_formatting: {
              main_text: item.name || item.display_name.split(',')[0],
              secondary_text: item.display_name.split(',').slice(1).join(',').trim()
            },
            // Store raw details to avoid another API call
            _raw: item 
          }));
          
          setGoongSuggestions(mapped);
          setShowSuggestionList(mapped.length > 0);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Autocomplete error:', err);
        setGoongSuggestions([]);
        setShowSuggestionList(false);
        if (canUseGoong) setGoongError('Gợi ý Goong lỗi, đang dùng hệ thống dự phòng...');
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      setIsLoadingSuggestions(false);
    };
  }, [searchQuery, goongApiKey, showForm, canUseGoong, biasLocation]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationLoading(true);
        const data = await getLocationHierarchy();
        setLocationHierarchy(data);
        setLocationError('');
      } catch (err) {
        console.error('Error fetching location hierarchy:', err);
        setLocationError('Không thể tải dữ liệu vị trí. Vui lòng thử lại sau.');
      } finally {
        setLocationLoading(false);
      }
    };

    loadLocations();
  }, []);

  useEffect(() => {
    if (!useLocationDropdowns || !showForm || addressToPrefill !== null) {
      return;
    }
    if (selectedProvinceCode !== null) {
      return;
    }
    if (currentAddress.city) {
      setAddressToPrefill({ ...currentAddress });
    }
  }, [
    useLocationDropdowns,
    showForm,
    addressToPrefill,
    selectedProvinceCode,
    currentAddress.city,
    currentAddress.district,
    currentAddress.ward,
  ]);

  useEffect(() => {
    if (showForm && currentAddress.detailedAddress) {
      updateMapUrl();
    }
  }, [showForm, currentAddress.detailedAddress, currentAddress.latitude, currentAddress.longitude]);

  useEffect(() => {
    if (!addressToPrefill || locationHierarchy.length === 0) {
      return;
    }
    prefillLocationSelections(addressToPrefill);
    setAddressToPrefill(null);
  }, [addressToPrefill, locationHierarchy]);

  useEffect(() => {
    if (!showForm) {
      setGoongSuggestions([]);
      setShowSuggestionList(false);
      setGoongError('');
    }
  }, [showForm]);

  const fetchAddresses = async () => {
    if (isFetchingRef.current) return;
    
    const customerId = (user as any)?.customerId;
    if (!customerId) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await api.get(`/api/address/customer/${customerId}`);
      setAddresses(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Không thể tải danh sách địa chỉ.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const updateMapUrl = () => {
    const fallbackLat = 10.762622;
    const fallbackLng = 106.660172;
    const lat = currentAddress.latitude || fallbackLat;
    const lng = currentAddress.longitude || fallbackLng;

    if (goongApiKey && currentAddress.latitude && currentAddress.longitude) {
      const url = `https://maps.goong.io/maps/embed?api_key=${goongApiKey}&center=${lat},${lng}&marker=${lat},${lng}&zoom=16`;
      setMapUrl(url);
      return;
    }

    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
    setMapUrl(url);
  };

  const handleSelectSuggestion = async (suggestion: GoongPrediction) => {
    setShowSuggestionList(false);
    setGoongSuggestions([]);
    setSearchQuery(suggestion.description);

    // If it's a Nominatim fallback result, we already have details in _raw
    if (suggestion.place_id.startsWith('osm-')) {
      const item = (suggestion as any)._raw;
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const addr = item.address || {};
      
      const updatedAddress: Partial<Address> = {
        ...currentAddress,
        city: addr.province || addr.city || addr.state || '',
        district: addr.district || addr.county || addr.city_district || addr.suburb || '',
        ward: addr.ward || addr.suburb || addr.quarter || addr.village || '',
        detailedAddress: item.display_name,
        latitude: lat,
        longitude: lng,
      };
      
      setCurrentAddress(updatedAddress);
      setAddressToPrefill(updatedAddress);
      return;
    }

    if (!goongApiKey) return;
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

      const updatedAddress: Partial<Address> = {
        ...currentAddress,
        city: compound.city || compound.province || currentAddress.city || '',
        district: compound.district || currentAddress.district || '',
        ward: compound.ward || currentAddress.ward || '',
        detailedAddress: result.formatted_address || suggestion.description,
        latitude: geometry?.lat ? parseFloat(geometry.lat) : currentAddress.latitude,
        longitude: geometry?.lng ? parseFloat(geometry.lng) : currentAddress.longitude,
      };

      setCurrentAddress(updatedAddress);
      setAddressToPrefill(updatedAddress);
    } catch (err) {
      console.error('Error fetching Goong place detail:', err);
      setGoongError('Không thể lấy chi tiết địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!useLocationDropdowns) return;
    const { value } = event.target;
    if (!value) {
      setSelectedProvinceCode(null);
      setSelectedDistrictCode(null);
      setSelectedWardCode(null);
      setCurrentAddress((prev) => ({
        ...prev,
        city: '',
        district: '',
        ward: '',
      }));
      return;
    }

    const code = Number(value);
    const province = locationHierarchy.find((item) => item.code === code) ?? null;

    setSelectedProvinceCode(code);
    setSelectedDistrictCode(null);
    setSelectedWardCode(null);
    setCurrentAddress((prev) => ({
      ...prev,
      city: province?.name ?? '',
      district: '',
      ward: '',
    }));
  };

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!useLocationDropdowns) return;
    const { value } = event.target;
    if (!value) {
      setSelectedDistrictCode(null);
      setSelectedWardCode(null);
      setCurrentAddress((prev) => ({
        ...prev,
        district: '',
        ward: '',
      }));
      return;
    }

    const code = Number(value);
    const district = districtOptions.find((item) => item.code === code) ?? null;

    setSelectedDistrictCode(code);
    setSelectedWardCode(null);
    setCurrentAddress((prev) => ({
      ...prev,
      district: district?.name ?? '',
      ward: '',
    }));
  };

  const handleWardChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!useLocationDropdowns) return;
    const { value } = event.target;
    if (!value) {
      setSelectedWardCode(null);
      setCurrentAddress((prev) => ({
        ...prev,
        ward: '',
      }));
      return;
    }

    const code = Number(value);
    const ward = wardOptions.find((item) => item.code === code) ?? null;

    setSelectedWardCode(code);
    setCurrentAddress((prev) => ({
      ...prev,
      ward: ward?.name ?? '',
    }));
  };

  const handleSearchLocation = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (goongApiKey) {
      if (goongSuggestions.length > 0) {
        await handleSelectSuggestion(goongSuggestions[0]);
        return;
      }

      try {
        setIsSearchingLocation(true);
        setGoongError('');
        const response = await fetch(
          `https://rsapi.goong.io/Geocode?api_key=${goongApiKey}&address=${encodeURIComponent(trimmed)}`
        );

        if (!response.ok) {
          throw new Error(`Goong geocode failed with status ${response.status}`);
        }

        const data = await response.json();
        const firstResult = data?.results?.[0];

        if (firstResult) {
          const compound = firstResult.compound ?? {};
          const location = firstResult.geometry?.location;

          const updatedAddress: Partial<Address> = {
            ...currentAddress,
            city: compound.city || compound.province || currentAddress.city || '',
            district: compound.district || currentAddress.district || '',
            ward: compound.ward || currentAddress.ward || '',
            detailedAddress: firstResult.formatted_address || trimmed,
            latitude: location?.lat ? parseFloat(location.lat) : currentAddress.latitude,
            longitude: location?.lng ? parseFloat(location.lng) : currentAddress.longitude,
          };

          setCurrentAddress(updatedAddress);
          setAddressToPrefill(updatedAddress);
        } else {
          setGoongError('Không tìm thấy địa chỉ phù hợp. Vui lòng thử từ khóa khác.');
        }
      } catch (err) {
        console.error('Error searching location with Goong:', err);
        setGoongError('Có lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.');
      } finally {
        setIsSearchingLocation(false);
      }

      return;
    }

    try {
      setIsSearchingLocation(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        const addressInfo = (firstResult.address ?? {}) as Record<string, string>;
        const provinceCandidate =
          addressInfo.province ||
          addressInfo.state ||
          addressInfo.region ||
          addressInfo.city ||
          addressInfo.municipality;

        const districtCandidate =
          addressInfo.district ||
          addressInfo.county ||
          addressInfo.state_district ||
          addressInfo.city_district;

        const wardCandidate =
          addressInfo.ward ||
          addressInfo.suburb ||
          addressInfo.village ||
          addressInfo.town ||
          addressInfo.quarter;

        const updatedAddress: Partial<Address> = {
          ...currentAddress,
          city: provinceCandidate ?? currentAddress.city ?? '',
          district: districtCandidate ?? currentAddress.district ?? '',
          ward: wardCandidate ?? currentAddress.ward ?? '',
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
          detailedAddress: firstResult.display_name
        };

        setCurrentAddress(updatedAddress);
        setAddressToPrefill(updatedAddress);
      } else {
        alert('Không tìm thấy địa chỉ. Vui lòng thử lại với từ khóa khác.');
      }
    } catch (err) {
      console.error('Error searching location:', err);
      alert('Có lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSearchingLocation(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.type !== 'customer') return;

    try {
      if (editMode && currentAddress.addressId) {
        await api.put(`/api/address/${currentAddress.addressId}`, currentAddress);
      } else {
        await api.post(`/api/address/customer/${user.customerId}`, currentAddress);
      }

      fetchAddresses();
      resetForm();
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Có lỗi khi lưu địa chỉ. Vui lòng thử lại.');
    }
  };

  const handleEdit = (address: Address) => {
    setCurrentAddress(address);
    setEditMode(true);
    setShowForm(true);
    setSelectedProvinceCode(null);
    setSelectedDistrictCode(null);
    setSelectedWardCode(null);
    setAddressToPrefill(address);
    setSearchQuery(address.detailedAddress ?? '');
    setGoongSuggestions([]);
    setGoongError('');
  };

  const handleAddNewAddress = () => {
    setCurrentAddress({
      city: '',
      district: '',
      ward: '',
      recipientName: user && user.type === 'customer' ? (user as any).fullname || '' : '',
      phone: user && user.type === 'customer' ? (user as any).phone || '' : '',
      detailedAddress: '',
      latitude: 0,
      longitude: 0,
      isDefault: false
    });
    setMapUrl('');
    setEditMode(false);
    setShowForm(true);
    setSelectedProvinceCode(null);
    setSelectedDistrictCode(null);
    setSelectedWardCode(null);
    setSearchQuery('');
    setAddressToPrefill(null);
    setGoongSuggestions([]);
    setGoongError('');
    setShowSuggestionList(false);
  };

  const handleDelete = async (addressId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        await api.delete(`/api/address/${addressId}`);
        fetchAddresses();
      } catch (err) {
        console.error('Error deleting address:', err);
        alert('Có lỗi khi xóa địa chỉ. Vui lòng thử lại.');
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user || user.type !== 'customer') return;
    try {
      await api.patch(`/api/address/customer/${user.customerId}/default/${addressId}`);
      fetchAddresses();
    } catch (err) {
      console.error('Error setting default address:', err);
      alert('Có lỗi khi đặt địa chỉ mặc định. Vui lòng thử lại.');
    }
  };

  const resetForm = () => {
    setCurrentAddress({
      city: '',
      district: '',
      ward: '',
      recipientName: '',
      phone: '',
      detailedAddress: '',
      latitude: 0,
      longitude: 0,
      isDefault: false
    });
    setSelectedProvinceCode(null);
    setSelectedDistrictCode(null);
    setSelectedWardCode(null);
    setAddressToPrefill(null);
    setSearchQuery('');
    setMapUrl('');
    setGoongSuggestions([]);
    setShowSuggestionList(false);
    setGoongError('');
    setEditMode(false);
    setShowForm(false);
  };



  if (loading) return <div className="text-center py-8">Đang tải địa chỉ...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div>
      <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <HeadOrder />
      </div>
      <div className="container mx-auto mt-16 p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Địa chỉ giao hàng</h1>
          <button
            onClick={handleAddNewAddress}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            + Thêm địa chỉ mới
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên người nhận</label>
                  <input
                    type="text"
                    name="recipientName"
                    value={currentAddress.recipientName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={currentAddress.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
                  {useLocationDropdowns ? (
                    <select
                      name="city"
                      value={selectedProvinceCode !== null ? selectedProvinceCode.toString() : ''}
                      onChange={handleProvinceChange}
                      className="w-full p-2 border rounded"
                      required
                      disabled={locationLoading}
                    >
                      <option value="" disabled>
                        Chọn Tỉnh/Thành phố
                      </option>
                      {locationHierarchy.map((province) => (
                        <option key={province.code} value={province.code.toString()}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="city"
                      value={currentAddress.city}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                  {useLocationDropdowns ? (
                    <select
                      name="district"
                      value={selectedDistrictCode !== null ? selectedDistrictCode.toString() : ''}
                      onChange={handleDistrictChange}
                      className="w-full p-2 border rounded"
                      required
                      disabled={!selectedProvinceCode || locationLoading}
                    >
                      <option value="" disabled>
                        Chọn Quận/Huyện
                      </option>
                      {districtOptions.map((district) => (
                        <option key={district.code} value={district.code.toString()}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="district"
                      value={currentAddress.district}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phường/Xã</label>
                  {useLocationDropdowns ? (
                    <select
                      name="ward"
                      value={selectedWardCode !== null ? selectedWardCode.toString() : ''}
                      onChange={handleWardChange}
                      className="w-full p-2 border rounded"
                      required
                      disabled={!selectedDistrictCode || locationLoading}
                    >
                      <option value="" disabled>
                        Chọn Phường/Xã
                      </option>
                      {wardOptions.map((ward) => (
                        <option key={ward.code} value={ward.code.toString()}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="ward"
                      value={currentAddress.ward}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  )}
                </div>
                {useLocationDropdowns && (locationLoading || locationError) && (
                  <div className="md:col-span-2 text-sm">
                    {locationLoading && (
                      <span className="text-gray-500">Đang tải danh sách tỉnh/quận/phường...</span>
                    )}
                    {locationLoading && locationError && ' '}
                    {locationError && (
                      <span className="text-red-500">{locationError}</span>
                    )}
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Tìm kiếm địa chỉ</label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start mb-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchQuery(value);
                          setShowSuggestionList(true);
                        }}
                        onFocus={() => {
                          if (goongSuggestions.length > 0) {
                            setShowSuggestionList(true);
                          }
                        }}
                        onBlur={() => {
                          window.setTimeout(() => setShowSuggestionList(false), 150);
                        }}
                        placeholder={canUseGoong ? 'Nhập địa chỉ hoặc địa danh, hệ thống gợi ý tự động' : 'Nhập địa chỉ để tìm kiếm'}
                        className="w-full p-2 border rounded"
                      />
                      {showSuggestionList && goongSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow max-h-72 overflow-y-auto">
                          {biasLocation && (
                             <div className="px-3 py-1.5 bg-[#FDF5E6] border-b border-[#E5D5C5]/30 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                               <span className="text-[10px] font-bold text-[#8C5A35] uppercase tracking-wider">Gợi ý gần bạn</span>
                             </div>
                          )}
                          <ul className="divide-y divide-gray-100">
                            {goongSuggestions.map((suggestion) => (
                              <li
                                key={suggestion.place_id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  void handleSelectSuggestion(suggestion);
                                }}
                                className="cursor-pointer px-3 py-2.5 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-sm text-gray-900 leading-tight">
                                      {suggestion.structured_formatting?.main_text || suggestion.description}
                                    </p>
                                    {suggestion.structured_formatting?.secondary_text && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {suggestion.structured_formatting.secondary_text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {showSuggestionList && isLoadingSuggestions && (
                        <span className="absolute right-3 top-3 text-xs text-gray-400">Đang gợi ý...</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchLocation}
                      className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-60"
                      disabled={isSearchingLocation}
                    >
                      <FaSearchLocation />
                      {isSearchingLocation ? 'Đang tìm...' : 'Tìm'}
                    </button>
                  </div>
                  {(canUseGoong || !canUseGoong) && goongError && (
                    <p className="mb-2 text-sm text-red-500">{goongError}</p>
                  )}


                  <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    name="detailedAddress"
                    value={currentAddress.detailedAddress}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded mb-2"
                    required
                  />

                  {mapUrl && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[#E5D5C5]/50 shadow-inner">
                      <iframe
                        src={mapUrl}
                        width="100%"
                        height="300"
                        style={{ border: 'none' }}
                        loading="lazy"
                        title="Bản đồ địa chỉ"
                      />
                      {canUseGoong && currentAddress.latitude && currentAddress.longitude && (
                        <div className="bg-[#fdfcfb] px-3 py-2 border-t border-[#E5D5C5]/30">
                           <p className="text-[10px] text-[#8C5A35] font-medium flex items-center gap-1">
                             <img src="https://goong.io/assets/images/logo.png" alt="Goong" className="h-3 inline" /> 
                             Bản đồ được cung cấp bởi Goong Maps.
                           </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={currentAddress.isDefault || false}
                    onChange={(e) => setCurrentAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                >
                  {editMode ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {addresses.length === 0 ? (
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-[#E5D5C5] flex flex-col items-center">
              <div className="w-20 h-20 bg-[#FDF5E6] rounded-full flex items-center justify-center mb-4 text-[#8C5A35]/30">
                <FaMapMarkerAlt size={40} />
              </div>
              <p className="text-[#8C5A35] font-bold text-lg">Bạn chưa có địa chỉ giao hàng nào</p>
              <p className="text-[#8C5A35]/60 text-sm mt-1">Hãy thêm địa chỉ để Phê La có thể phục vụ bạn tốt hơn</p>
              <button 
                onClick={handleAddNewAddress}
                className="mt-6 px-6 py-2.5 bg-[#8C5A35] text-white rounded-full font-bold text-sm hover:bg-[#5C4D43] transition-all shadow-lg shadow-[#8C5A35]/20"
              >
                + Thêm địa chỉ ngay
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.addressId}
                className={`group relative overflow-hidden bg-white rounded-2xl border transition-all duration-300 ${
                  address.isDefault 
                    ? 'border-[#B8860B] shadow-[0_10px_30px_rgba(184,134,11,0.1)] ring-1 ring-[#B8860B]/20' 
                    : 'border-[#E5D5C5]/50 shadow-sm hover:shadow-xl hover:border-[#8C5A35]/30'
                }`}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#FDF5E6] rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 items-start flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      address.isDefault ? 'bg-[#B8860B] text-white' : 'bg-[#FDF5E6] text-[#8C5A35]'
                    }`}>
                      {address.detailedAddress.toLowerCase().includes('văn phòng') || address.detailedAddress.toLowerCase().includes('công ty') 
                        ? <FaBriefcase size={22} /> 
                        : <FaHome size={22} />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-[#5C4D43] text-lg truncate uppercase tracking-tight">
                          {address.recipientName}
                        </h3>
                        {address.isDefault && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-[#B8860B]/10 text-[#B8860B] text-[10px] font-black rounded-full uppercase tracking-widest border border-[#B8860B]/20">
                            <FaCheckCircle className="text-[12px]" /> Mặc định
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-[#8C5A35]/80 mb-2">
                        <span className="font-bold">{address.phone}</span>
                        <span className="w-1 h-1 bg-[#E5D5C5] rounded-full"></span>
                        <span className="font-medium opacity-80 italic">Giao hàng tận nơi</span>
                      </div>

                      <p className="text-[#5C4D43] text-sm leading-relaxed flex items-start gap-1.5 line-clamp-2">
                        <FaMapMarkerAlt className="mt-1 text-[#8C5A35] flex-shrink-0" />
                        <span>
                          <span className="font-bold">{address.detailedAddress}</span>, {address.ward}, {address.district}, {address.city}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#E5D5C5]/30">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.addressId)}
                        className="flex-1 md:flex-none px-4 py-2 text-[#8C5A35] hover:bg-[#FDF5E6] rounded-xl text-xs font-bold transition-all border border-transparent hover:border-[#E5D5C5]"
                      >
                        Đặt mặc định
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(address)}
                      className="w-10 h-10 flex items-center justify-center text-[#5C4D43] hover:bg-[#FDF5E6] hover:text-[#8C5A35] rounded-xl transition-all"
                      title="Chỉnh sửa"
                    >
                      <FaEdit size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(address.addressId)}
                      className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      title="Xóa"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddress;