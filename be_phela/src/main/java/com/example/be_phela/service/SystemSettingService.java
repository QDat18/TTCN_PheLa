package com.example.be_phela.service;

import com.example.be_phela.model.SystemSetting;
import com.example.be_phela.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SystemSettingService {

    private final SystemSettingRepository repository;

    public SystemSettingService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    /** Lấy toàn bộ settings dưới dạng Map<key, value> */
    @Transactional(readOnly = true)
    public Map<String, String> getAllSettings() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(
                        SystemSetting::getSettingKey,
                        s -> s.getSettingValue() != null ? s.getSettingValue() : ""
                ));
    }

    /** Lấy value của 1 key, trả về defaultValue nếu không tồn tại */
    @Transactional(readOnly = true)
    public String get(String key, String defaultValue) {
        return repository.findById(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    /** Lấy value dạng số nguyên */
    @Transactional(readOnly = true)
    public int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(get(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /** Lấy value dạng double */
    @Transactional(readOnly = true)
    public double getDouble(String key, double defaultValue) {
        try {
            return Double.parseDouble(get(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /** Lấy value dạng boolean */
    @Transactional(readOnly = true)
    public boolean getBoolean(String key, boolean defaultValue) {
        String val = get(key, String.valueOf(defaultValue));
        return "true".equalsIgnoreCase(val);
    }

    /** Cập nhật nhiều settings cùng lúc (batch update từ Map<key, value>) */
    @Transactional
    public Map<String, String> updateSettings(Map<String, String> updates) {
        List<SystemSetting> toSave = updates.entrySet().stream()
                .map(entry -> {
                    Optional<SystemSetting> existing = repository.findById(entry.getKey());
                    if (existing.isPresent()) {
                        existing.get().setSettingValue(entry.getValue());
                        return existing.get();
                    } else {
                        return new SystemSetting(entry.getKey(), entry.getValue(), "general", null);
                    }
                })
                .collect(Collectors.toList());

        repository.saveAll(toSave);
        return getAllSettings();
    }

    /** Khởi tạo giá trị mặc định nếu chưa tồn tại trong DB */
    @Transactional
    public void initializeDefaults(List<SystemSetting> defaults) {
        for (SystemSetting setting : defaults) {
            if (!repository.existsById(setting.getSettingKey())) {
                repository.save(setting);
            }
        }
    }
}
