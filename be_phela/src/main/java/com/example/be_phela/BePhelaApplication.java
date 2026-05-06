package com.example.be_phela;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableJpaRepositories(basePackages = "com.example.be_phela.repository")
@EntityScan(basePackages = "com.example.be_phela.model")
public class BePhelaApplication {

    public static void main(String[] args) {
        // Load .env file before Spring Boot starts
        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        // Set system properties from .env file
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
                System.out.println("DEBUG: Loaded env key: " + entry.getKey());
            }
        });

        // === CRITICAL DEBUG: Verify JWT_SIGNER_KEY is loaded correctly ===
        String jwtKey = System.getProperty("JWT_SIGNER_KEY");
        System.out.println("=== JWT_SIGNER_KEY DEBUG ===");
        System.out.println("  From System.getProperty: " + (jwtKey != null ? "length=" + jwtKey.length() + ", prefix=" + jwtKey.substring(0, Math.min(10, jwtKey.length())) : "NULL!"));
        String dotenvKey = dotenv.get("JWT_SIGNER_KEY");
        System.out.println("  From dotenv.get:         " + (dotenvKey != null ? "length=" + dotenvKey.length() + ", prefix=" + dotenvKey.substring(0, Math.min(10, dotenvKey.length())) : "NULL!"));
        System.out.println("  Contains '+': " + (jwtKey != null && jwtKey.contains("+")));
        System.out.println("  Contains '/': " + (jwtKey != null && jwtKey.contains("/")));
        System.out.println("  Ends with '==': " + (jwtKey != null && jwtKey.endsWith("==")));
        System.out.println("============================");

        SpringApplication.run(BePhelaApplication.class, args);
    }

}
