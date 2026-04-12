package com.example.be_phela.service;

import com.example.be_phela.dto.request.ProductCreateDTO;
import com.example.be_phela.interService.IProductService;
import com.example.be_phela.mapper.ProductMapper;
import com.example.be_phela.model.Category;
import com.example.be_phela.model.Product;
import com.example.be_phela.model.enums.ProductStatus;
import com.example.be_phela.repository.CategoryRepository;
import com.example.be_phela.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;

@Service
public class ProductService implements IProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final FileStorageService fileStorageService;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository, ProductMapper productMapper, FileStorageService fileStorageService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productMapper = productMapper;
        this.fileStorageService = fileStorageService;
    }

    // Tạo mã sản phẩm
    private String generateProductCode() {
        long count = productRepository.count();
        return String.format("SP%04d", count + 1);
    }

    private boolean isProductCodeExists(String productCode) {
        return productRepository.existsByProductCode(productCode);
    }

    // Thêm sản phẩm mới
    @Override
    @Transactional
    public Product createProduct(ProductCreateDTO productDTO, String categoryCode, MultipartFile image) throws IOException {
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));

        // Upload ảnh lên Cloudinary và lấy URL
        if (image != null && !image.isEmpty()) {
            log.info("Uploading image for new product...");
            String folder = getFolderForCategory(categoryCode);
            String imageUrl = fileStorageService.storeFile(image, folder);
            log.info("Image URL received: {}", imageUrl);
            productDTO.setImageUrl(imageUrl);
        }

        Product product = productMapper.toProduct(productDTO);
        product.setProductCode(generateProductCode());
        product.setImageUrl(productDTO.getImageUrl());
        product.setCategory(category);
        product.setStatus(ProductStatus.SHOW); // Mặc định trạng thái là SHOW khi tạo mới
        return productRepository.save(product);
    }

    // Cập nhật sản phẩm
    @Override
    @Transactional
    public Product updateProduct(String productId, ProductCreateDTO productDTO, String categoryCode, MultipartFile image) throws IOException {
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));

        if (image != null && !image.isEmpty()) {
            String folder = getFolderForCategory(categoryCode);
            String newImageUrl = fileStorageService.storeFile(image, folder);
            productDTO.setImageUrl(newImageUrl);
        }

        existingProduct.setProductName(productDTO.getProductName());
        existingProduct.setDescription(productDTO.getDescription());
        existingProduct.setOriginalPrice(productDTO.getOriginalPrice() != null ? productDTO.getOriginalPrice() : existingProduct.getOriginalPrice());
        existingProduct.setImageUrl(productDTO.getImageUrl());
        existingProduct.setCategory(category);

        return productRepository.save(existingProduct);
    }

    // Chuyển trạng thái ẩn/hiện
    @Override
    @Transactional
    public Product toggleProductStatus(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        product.setStatus(product.getStatus() == ProductStatus.SHOW ? ProductStatus.HIDE : ProductStatus.SHOW);
        return productRepository.save(product);
    }

    // Lọc sản phẩm theo danh mục
    @Override
    public List<Product> getProductsByCategory(String categoryCode) {
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));
        return productRepository.findByCategory_CategoryCode(category.getCategoryCode());
    }

    //Xoa san pham
    @Override
    @Transactional
    public void deleteProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (!product.getOrderItems().isEmpty() || !product.getCartItems().isEmpty()) {
            throw new RuntimeException("Cannot delete product with existing orders or cart items");
        }
        productRepository.delete(product);
    }

    @Override
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public Product getProductByCode(String productCode) {
        return productRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found with code: " + productCode));
    }

    @Override
    public Page<Product> searchProductsByPrefix(String prefix, Pageable pageable) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return productRepository.findAll(pageable);
        }
        return productRepository.findByProductNameStartingWithIgnoreCaseOrDescriptionStartingWithIgnoreCase(
                prefix.trim(), prefix.trim(), pageable);
    }

    @Override
    public List<Product> getProductsByStatus(ProductStatus status) {
        return productRepository.findByStatus(status);
    }

    @Override
    public Product getProductById(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
    }

    @Override
    public Page<Product> getProductsByCategoryWithPagination(String categoryCode, Pageable pageable) {
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));
        return productRepository.findByCategory_CategoryCode(category.getCategoryCode(), pageable);
    }

    private String getFolderForCategory(String categoryCode) {
        if (categoryCode == null) return "products";
        return switch (categoryCode.toUpperCase()) {
            case "CF" -> "coffee";
            case "TEA" -> "olongmatcha";
            case "COLD_BREW" -> "cold_brew";
            case "SIGNATURE" -> "signature";
            case "PLUS" -> "plus";
            case "FRENCH_PRESS" -> "french_press";
            case "MOKA_POT" -> "moka_pot";
            case "SYPHON" -> "syphon";
            case "TOPPING" -> "topping";
            default -> categoryCode.toLowerCase();
        };
    }
}
