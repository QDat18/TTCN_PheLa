package com.example.be_phela.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCreateDTO {

    @NotBlank(message = "Product name is required")
    @Size(min = 1, max = 255, message = "Product name must be between 1 and 255 characters")
    @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-_.,()]+$", message = "Product name contains invalid characters")
    private String productName;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @DecimalMax(value = "999999.99", message = "Price cannot exceed 999,999.99")
    @Digits(integer = 6, fraction = 2, message = "Price format is invalid")
    private Double originalPrice;

    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    @Pattern(regexp = "^(https?://)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([/\\w \\.-]*)*/?\\.(jpg|jpeg|png|gif|webp)$",
             message = "Invalid image URL format",
             flags = Pattern.Flag.CASE_INSENSITIVE)
    private String imageUrl;
}
