package com.example.be_phela.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@Lazy(false)
public class DatabaseFixer {
    private static final Logger log = LoggerFactory.getLogger(DatabaseFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixDatabase() {
        try {
            log.info("Starting database schema fix for Google OAuth support...");
            
            // Remove NOT NULL constraints to support OAuth2 registration (where some fields might be null initially)
            String[] queries = {
                "ALTER TABLE customer ALTER COLUMN phone DROP NOT NULL;",
                "ALTER TABLE customer ALTER COLUMN fullname DROP NOT NULL;",
                "ALTER TABLE customer ALTER COLUMN password DROP NOT NULL;"
            };

            for (String query : queries) {
                try {
                    jdbcTemplate.execute(query);
                } catch (Exception e) {
                    log.debug("Notice: Query failed or already applied: {}. Message: {}", query, e.getMessage());
                }
            }
            
            log.info("Database schema check/fix completed: 'phone', 'fullname', and 'password' constraints processed.");
        } catch (Exception e) {
            log.warn("Database fix process encountered an unexpected issue: {}", e.getMessage());
        }
    }
}
