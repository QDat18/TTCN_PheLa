package com.example.be_phela.validation;

import com.example.be_phela.model.enums.Roles;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidRoleValidator implements ConstraintValidator<ValidRole, String> {

    @Override
    public void initialize(ValidRole constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String role, ConstraintValidatorContext context) {
        if (role == null || role.trim().isEmpty()) {
            return false;
        }

        try {
            // Check if the role exists in the Roles enum
            Roles.valueOf(role.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            // Set custom error message with available roles
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    "Invalid role '" + role + "'. Valid roles are: " + getValidRoles()
            ).addConstraintViolation();
            return false;
        }
    }

    private String getValidRoles() {
        StringBuilder roles = new StringBuilder();
        for (Roles role : Roles.values()) {
            if (roles.length() > 0) {
                roles.append(", ");
            }
            roles.append(role.name());
        }
        return roles.toString();
    }
}