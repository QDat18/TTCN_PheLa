package com.example.be_phela.model.listener;

import com.example.be_phela.config.SpringContextHelper;
import com.example.be_phela.model.SystemSetting;
import com.example.be_phela.repository.SystemSettingRepository;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;

public class AiKnowledgeDirtyListener {

    @PostPersist
    @PostUpdate
    @PostRemove
    public void markDirty(Object entity) {
        try {
            SystemSettingRepository repository = SpringContextHelper.getBean(SystemSettingRepository.class);
            if (repository != null) {
                SystemSetting setting = repository.findById("ai.knowledge_dirty")
                        .orElse(new SystemSetting("ai.knowledge_dirty", "true", "ai", "AI Knowledge base dirty flag"));
                setting.setSettingValue("true");
                repository.save(setting);
                System.out.println("AI Knowledge flagged as DIRTY due to change in entity: " + entity.getClass().getSimpleName());
            }
        } catch (Exception e) {
            System.err.println("Failed to mark AI Knowledge dirty: " + e.getMessage());
        }
    }
}
