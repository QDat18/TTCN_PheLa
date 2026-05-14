import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '~/AuthContext';
import axios from 'axios';
import {
  FiSettings, FiShield, FiDollarSign, FiMusic, FiInfo,
  FiSave, FiRefreshCw, FiAlertTriangle, FiCheck, FiLock,
  FiTruck, FiGift, FiZap, FiDatabase, FiGlobe, FiLoader, FiCreditCard
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// ========== Shared prop types ==========
interface FieldProps {
  label: string;
  settingKey: string;
  type?: string;
  unit?: string;
  val: (key: string) => string;
  set: (key: string, value: string) => void;
  dirty: Record<string, string>;
  settings: Record<string, string>;
}

interface ToggleProps {
  label: string;
  desc: string;
  settingKey: string;
  accentColor: string;
  val: (key: string) => string;
  toggle: (key: string) => void;
}

// ========== Top-level sub-components (MUST be outside SystemSettings to avoid remount bug) ==========
const Field: React.FC<FieldProps> = ({ label, settingKey, type = 'text', unit, val, set, dirty, settings }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={val(settingKey)}
        onChange={e => set(settingKey, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#d4a373]/30 focus:border-[#d4a373] outline-none transition-all"
        style={unit ? { paddingRight: '4rem' } : {}}
      />
      {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">{unit}</span>}
    </div>
    {dirty[settingKey] !== undefined && dirty[settingKey] !== settings[settingKey] && (
      <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
        <FiAlertTriangle size={11} /> Chưa lưu
      </p>
    )}
  </div>
);

const Toggle: React.FC<ToggleProps> = ({ label, desc, settingKey, accentColor, val, toggle }) => {
  const on = val(settingKey) === 'true';
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border md:col-span-2"
         style={{ background: on ? `${accentColor}10` : '#f9fafb', borderColor: on ? `${accentColor}30` : '#f3f4f6' }}>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: on ? accentColor : '#6b7280' }}>{label}</p>
        <p className="text-xs" style={{ color: `${accentColor}99` }}>{desc}</p>
      </div>
      <button onClick={() => toggle(settingKey)}
        className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${on ? 'justify-end' : 'bg-gray-300 justify-start'}`}
        style={on ? { background: accentColor } : {}}>
        <div className="w-4 h-4 bg-white rounded-full shadow" />
      </button>
    </div>
  );
};

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

const sections: SettingSection[] = [
  { id: 'general',   title: 'Thông tin hệ thống',     icon: FiInfo,       color: 'text-blue-500'   },
  { id: 'loyalty',   title: 'Điểm thưởng (Nốt nhạc)', icon: FiMusic,      color: 'text-purple-500' },
  { id: 'shipping',  title: 'Phí vận chuyển',          icon: FiTruck,      color: 'text-green-500'  },
  { id: 'promotion', title: 'Khuyến mãi & Voucher',    icon: FiGift,       color: 'text-orange-500' },
  { id: 'payment',   title: 'Tài khoản thanh toán',   icon: FiCreditCard, color: 'text-teal-500'   },
  { id: 'security',  title: 'Bảo mật & Phân quyền',   icon: FiShield,     color: 'text-red-500'    },
  { id: 'system',    title: 'Hệ thống & Dữ liệu',      icon: FiDatabase,   color: 'text-gray-500'   },
];

// Keys thuộc từng section
const SECTION_KEYS: Record<string, string[]> = {
  general:   ['site.name','site.description','site.email','site.phone','site.website'],
  loyalty:   ['loyalty.enabled','loyalty.spend_per_note','loyalty.note_value_vnd','loyalty.expiry_months',
               'loyalty.silver_threshold','loyalty.gold_threshold','loyalty.diamond_threshold'],
  shipping:  ['shipping.base_fee','shipping.free_threshold','shipping.free_enabled',
               'shipping.max_distance_km','shipping.extra_fee_per_km'],
  promotion: ['promotion.max_voucher_discount_pct','promotion.max_uses_per_voucher',
               'promotion.first_order_discount_pct','promotion.referral_enabled','promotion.referral_bonus_notes'],
  payment:   ['payment.bank_id','payment.account_no','payment.account_name','payment.transfer_prefix',
               'payment.sepay_api_key',
               'payment.cod_enabled','payment.bank_enabled','payment.payos_enabled','payment.min_online_amount'],
};

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Tất cả settings từ API
  const [settings, setSettings] = useState<Record<string, string>>({});
  // Dirty = đã chỉnh sửa, chưa lưu
  const [dirty, setDirty] = useState<Record<string, string>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Config từ ENV (PayOS + SePay status)
  const [envConfig, setEnvConfig] = useState<Record<string, boolean | string>>({});

  // ---------- Load tất cả settings từ API ----------
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (err) {
      toast.error('Không thể tải cài đặt hệ thống!');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ---------- Load ENV payment config ----------
  const loadEnvConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/settings/payment-env`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnvConfig(res.data);
    } catch {
      // silent fail
    }
  }, [token]);

  useEffect(() => { loadSettings(); loadEnvConfig(); }, [loadSettings, loadEnvConfig]);

  // Lấy giá trị hiện tại (dirty ưu tiên trước settings gốc)
  const val = (key: string) => (dirty[key] !== undefined ? dirty[key] : settings[key]) ?? '';

  // Cập nhật giá trị local
  const set = (key: string, value: string) =>
    setDirty(prev => ({ ...prev, [key]: value }));

  const toggle = (key: string) =>
    set(key, val(key) === 'true' ? 'false' : 'true');

  // ---------- Lưu section hiện tại ----------
  const handleSave = async (sectionId: string) => {
    if (!isSuperAdmin && sectionId === 'security') {
      toast.error('Chỉ Super Admin mới có thể thay đổi cài đặt bảo mật!');
      return;
    }
    const keys = SECTION_KEYS[sectionId];
    if (!keys) return;
    const payload: Record<string, string> = {};
    keys.forEach(k => { if (dirty[k] !== undefined) payload[k] = dirty[k]; });
    if (Object.keys(payload).length === 0) {
      toast.info('Không có thay đổi nào để lưu.');
      return;
    }
    try {
      setSaving(true);
      const res = await axios.put(`${API_BASE}/api/admin/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
      // Xoá dirty của section này
      setDirty(prev => {
        const next = { ...prev };
        keys.forEach(k => delete next[k]);
        return next;
      });
      toast.success(`Đã lưu "${sections.find(s => s.id === sectionId)?.title}" thành công!`);
    } catch {
      toast.error('Lưu thất bại! Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // ========== Render helpers (Field & Toggle are top-level components) ==========

  // ========== Section renderers ==========
  const renderGeneral = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Tên hệ thống"   settingKey="site.name"    val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Website"        settingKey="site.website" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Email liên hệ" settingKey="site.email"   type="email" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Hotline"        settingKey="site.phone"  val={val} set={set} dirty={dirty} settings={settings} />
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả hệ thống</label>
        <textarea rows={3} value={val('site.description')}
          onChange={e => set('site.description', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#d4a373]/30 focus:border-[#d4a373] outline-none resize-none" />
      </div>
      <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <FiInfo className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">Tên và hotline sẽ hiển thị trên email thông báo, hóa đơn và footer trang web.</p>
      </div>
    </div>
  );

  const renderLoyalty = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Chi tiêu để được 1 Nốt (VNĐ)" settingKey="loyalty.spend_per_note"  unit="VNĐ" type="number" val={val} set={set} dirty={dirty} settings={settings} />
        <Field label="Giá trị 1 Nốt nhạc (VNĐ giảm)" settingKey="loyalty.note_value_vnd" unit="VNĐ" type="number" val={val} set={set} dirty={dirty} settings={settings} />
        <Field label="Thời hạn Nốt nhạc (tháng)"     settingKey="loyalty.expiry_months"  unit="tháng" type="number" val={val} set={set} dirty={dirty} settings={settings} />
        <Toggle label="Kích hoạt tích điểm" desc="Cho phép khách hàng tích lũy Nốt nhạc"
                settingKey="loyalty.enabled" accentColor="#9333ea" val={val} toggle={toggle} />
      </div>
      <p className="text-sm font-bold text-gray-700">Ngưỡng thăng hạng thành viên</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'SILVER', key: 'loyalty.silver_threshold',  color: '#6b7280', bg: '#f3f4f6' },
          { label: 'GOLD',   key: 'loyalty.gold_threshold',    color: '#b45309', bg: '#fef3c7' },
          { label: 'DIAMOND',key: 'loyalty.diamond_threshold', color: '#1d4ed8', bg: '#eff6ff' },
        ].map(({ label, key, color, bg }) => (
          <div key={key} className="rounded-xl p-4 border-2" style={{ background: bg, borderColor: `${color}40` }}>
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{label}</span>
            <div className="mt-2 relative">
              <input type="number" value={val(key)} onChange={e => set(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white pr-8 focus:outline-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">♫</span>
            </div>
            {dirty[key] !== undefined && dirty[key] !== settings[key] && (
              <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><FiAlertTriangle size={10}/> Chưa lưu</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderShipping = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Phí giao hàng cơ bản"         settingKey="shipping.base_fee"         unit="VNĐ" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Ngưỡng miễn phí vận chuyển"   settingKey="shipping.free_threshold"   unit="VNĐ" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Khoảng cách tối đa giao hàng" settingKey="shipping.max_distance_km"  unit="km"  type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Phí phụ trội mỗi km"          settingKey="shipping.extra_fee_per_km" unit="VNĐ/km" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Toggle label="Cho phép miễn phí vận chuyển" desc="Tự động áp dụng khi đơn hàng đạt ngưỡng"
              settingKey="shipping.free_enabled" accentColor="#16a34a" val={val} toggle={toggle} />
    </div>
  );

  const renderPromotion = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Giảm tối đa mỗi voucher (%)"    settingKey="promotion.max_voucher_discount_pct" unit="%" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Số lần dùng tối đa / voucher"   settingKey="promotion.max_uses_per_voucher"     unit="lần" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Giảm giá đơn đầu tiên (%)"      settingKey="promotion.first_order_discount_pct" unit="%" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Field label="Thưởng giới thiệu (Nốt nhạc)"  settingKey="promotion.referral_bonus_notes"     unit="♫" type="number" val={val} set={set} dirty={dirty} settings={settings} />
      <Toggle label="Chương trình giới thiệu bạn bè" desc="Tặng Nốt nhạc khi giới thiệu khách hàng mới"
              settingKey="promotion.referral_enabled" accentColor="#ea580c" val={val} toggle={toggle} />
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      {/* Bank Account Info */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FiDollarSign className="text-teal-500" /> Thông tin tài khoản ngân hàng
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Số tài khoản" settingKey="payment.account_no" val={val} set={set} dirty={dirty} settings={settings} />
          <Field label="Tên chủ tài khoản" settingKey="payment.account_name" val={val} set={set} dirty={dirty} settings={settings} />
          <Field label="Mã ngân hàng (BIN)" settingKey="payment.bank_id" val={val} set={set} dirty={dirty} settings={settings} />
          <Field label="Tiền tố nội dung CK" settingKey="payment.transfer_prefix" val={val} set={set} dirty={dirty} settings={settings} />
        </div>
        {/* QR Preview */}
        {val('payment.account_no') && val('payment.bank_id') && (
          <div className="mt-4 flex items-center gap-4 bg-teal-50 border border-teal-100 rounded-xl p-4">
            <img
              src={`https://img.vietqr.io/image/${val('payment.bank_id')}-${val('payment.account_no')}-compact2.png?accountName=${encodeURIComponent(val('payment.account_name'))}&addInfo=${val('payment.transfer_prefix')}`}
              alt="QR thanh toán"
              className="w-28 h-28 rounded-lg border border-teal-200 bg-white object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
            <div>
              <p className="text-sm font-bold text-teal-800">Xem trước mã QR</p>
              <p className="text-xs text-teal-600 mt-1">
                Ngân hàng: <strong>{val('payment.bank_id').toUpperCase()}</strong><br />
                Số TK: <strong>{val('payment.account_no')}</strong><br />
                Tên: <strong>{val('payment.account_name')}</strong>
              </p>
              <p className="text-xs text-teal-400 mt-2">Powered by VietQR</p>
            </div>
          </div>
        )}
      </div>

      {/* SePay Config */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FiGlobe className="text-teal-500" /> SePay Webhook
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="SePay API Key (Webhook Auth)" settingKey="payment.sepay_api_key"
                 val={val} set={set} dirty={dirty} settings={settings} />
          {/* Trạng thái ENV */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ENV: SEPAY_API_KEY</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${envConfig['env.sepay_api_key_configured'] ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-600">
                  {envConfig['env.sepay_api_key_configured'] ? 'Đã cấu hình trong ENV' : 'Chưa có ENV, dùng giá trị DB'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          SePay API Key được dùng để xác thực webhook chuyển khoản. Lưu ở DB để dễ cập nhật khi không có quyền truy cập ENV.
        </p>
      </div>

      {/* PayOS ENV Status */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FiZap className="text-teal-500" /> Trạng thái cấu hình PayOS (ENV)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Client ID', key: 'payos.client_id_configured' },
            { label: 'API Key',   key: 'payos.api_key_configured'   },
            { label: 'Checksum', key: 'payos.checksum_configured'   },
          ].map(({ label, key }) => (
            <div key={key} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${envConfig[key] ? 'bg-green-500' : 'bg-red-400'}`} />
              <div>
                <p className="text-xs font-bold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{envConfig[key] ? 'Đã cấu hình' : 'Chưa có'}</p>
              </div>
            </div>
          ))}
        </div>
        {envConfig['payos.return_url'] && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs text-gray-500"><span className="font-bold">Return URL:</span> {String(envConfig['payos.return_url'])}</p>
            <p className="text-xs text-gray-500"><span className="font-bold">Cancel URL:</span> {String(envConfig['payos.cancel_url'])}</p>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FiCreditCard className="text-teal-500" /> Phương thức thanh toán
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="Tiền mặt khi nhận (COD)" desc="Khách hàng trả tiền mặt khi nhận hàng"
                  settingKey="payment.cod_enabled" accentColor="#0d9488" val={val} toggle={toggle} />
          <Toggle label="Chuyển khoản ngân hàng" desc="Thanh toán qua QR có báo biến (SePay)"
                  settingKey="payment.bank_enabled" accentColor="#0d9488" val={val} toggle={toggle} />
          <Toggle label="Thanh toán qua PayOS" desc="Tạo link thanh toán qua cổng PayOS"
                  settingKey="payment.payos_enabled" accentColor="#0d9488" val={val} toggle={toggle} />
          <Field label="Số tiền tối thiểu thanh toán online (VNĐ)"
                 settingKey="payment.min_online_amount" type="number" unit="VNĐ"
                 val={val} set={set} dirty={dirty} settings={settings} />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <FiLock className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-700">Lưu ý bảo mật</p>
          <p className="text-xs text-amber-600 mt-0.5">Khóa API PayOS (Client ID, API Key, Checksum Key) được cấu hình qua biến môi trường (ENV), không lưu trong database để đảm bảo bảo mật.</p>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      {!isSuperAdmin && (
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl p-4">
          <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Quyền truy cập bị hạn chế</p>
            <p className="text-xs text-red-400 mt-0.5">Chỉ <strong>Super Admin</strong> mới được thay đổi cài đặt bảo mật.</p>
          </div>
        </div>
      )}
      <div className={`space-y-3 ${!isSuperAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
        {[
          'Yêu cầu xác minh email khi đăng ký',
          'Bật xác thực 2 yếu tố cho Admin',
          'Tự động khóa tài khoản sau 5 lần đăng nhập sai',
          'Ghi log mọi hành động Admin',
          'Phiên đăng nhập tự động hết hạn sau 8 giờ',
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <FiShield className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{item}</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sắp ra mắt</span>
          </div>
        ))}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
          <FiLock className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-700">Các cài đặt bảo mật chi tiết cần cấu hình trực tiếp trong file backend.</p>
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Frontend',       value: 'React Router v7 + Vite', icon: FiZap,      color: 'text-blue-500' },
          { label: 'Backend',        value: 'Spring Boot 3 + Java 21', icon: FiDatabase, color: 'text-green-500' },
          { label: 'Cơ sở dữ liệu', value: 'PostgreSQL (Supabase)',    icon: FiDatabase, color: 'text-purple-500' },
          { label: 'Cổng thanh toán',value: 'SePay Webhook',           icon: FiDollarSign,color:'text-yellow-500'},
          { label: 'Lưu trữ ảnh',   value: 'Cloudinary CDN',          icon: FiGlobe,    color: 'text-orange-500' },
          { label: 'Môi trường',     value: 'Production (Render)',      icon: FiSettings, color: 'text-gray-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-bold text-blue-700 mb-1">Thông tin DB Settings</p>
        <p className="text-xs text-blue-500">Bảng <code className="bg-blue-100 px-1 rounded">system_settings</code> lưu {Object.keys(settings).length} cài đặt. Mọi thay đổi được áp dụng ngay lập tức không cần restart server.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <FiLoader size={28} className="animate-spin" />
        <p className="text-sm">Đang tải cài đặt từ server...</p>
      </div>
    );
    switch (activeSection) {
      case 'general':   return renderGeneral();
      case 'loyalty':   return renderLoyalty();
      case 'shipping':  return renderShipping();
      case 'promotion': return renderPromotion();
      case 'payment':   return renderPayment();
      case 'security':  return renderSecurity();
      case 'system':    return renderSystem();
      default: return null;
    }
  };

  const activeInfo = sections.find(s => s.id === activeSection)!;
  const ActiveIcon = activeInfo.icon;
  const hasDirty = SECTION_KEYS[activeSection]?.some(k => dirty[k] !== undefined) ?? false;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <FiSettings className="text-[#d4a373]" /> Cài đặt Hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý cấu hình toàn bộ hệ thống Phê La · {Object.keys(settings).length > 0 ? `${Object.keys(settings).length} cài đặt đã tải` : 'Đang kết nối...'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const sectionDirty = SECTION_KEYS[section.id]?.some(k => dirty[k] !== undefined) ?? false;
                return (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all border-l-4 text-left
                      ${isActive ? 'border-[#d4a373] bg-[#FDF5E6] text-[#8C5A35] font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                    <Icon size={16} className={isActive ? 'text-[#d4a373]' : section.color} />
                    <span className="flex-1">{section.title}</span>
                    {sectionDirty && <span className="w-2 h-2 bg-orange-400 rounded-full" title="Có thay đổi chưa lưu" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FDF5E6] flex items-center justify-center">
                    <ActiveIcon size={18} className={activeInfo.color} />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-800 text-base">{activeInfo.title}</h2>
                    <p className="text-xs text-gray-400">
                      {hasDirty ? <span className="text-orange-500 font-semibold">Có thay đổi chưa lưu</span> : 'Đã đồng bộ với database'}
                    </p>
                  </div>
                </div>
                {activeSection !== 'system' && activeSection !== 'security' && (
                  <button onClick={() => handleSave(activeSection)} disabled={saving || loading}
                    className="flex items-center gap-2 bg-[#d4a373] hover:bg-[#bc8a5f] text-white text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-[#d4a373]/20">
                    {saving
                      ? <><FiRefreshCw className="animate-spin" size={14} /> Đang lưu...</>
                      : <><FiSave size={14} /> Lưu thay đổi</>}
                  </button>
                )}
              </div>
              <div className="p-6">{renderContent()}</div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 px-1">
              <FiCheck className="text-green-400" />
              <span>Thay đổi được lưu trực tiếp vào database và áp dụng ngay cho toàn bộ hệ thống.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
