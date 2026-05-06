package com.example.be_phela.config;
import com.example.be_phela.service.AiKnowledgeService;

import com.example.be_phela.model.*;
import com.example.be_phela.model.enums.*;
import com.example.be_phela.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final VoucherRepository voucherRepository;
    private final AiKnowledgeService aiKnowledgeService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DataSeeder(AdminRepository adminRepository,
                      CustomerRepository customerRepository,
                      PasswordEncoder passwordEncoder,
                      BranchRepository branchRepository,
                      ProductRepository productRepository,
                      CategoryRepository categoryRepository,
                      VoucherRepository voucherRepository,
                      AiKnowledgeService aiKnowledgeService,
                      org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.adminRepository = adminRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.voucherRepository = voucherRepository;
        this.aiKnowledgeService = aiKnowledgeService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE product DROP CONSTRAINT IF EXISTS product_status_check;");
            jdbcTemplate.execute("ALTER TABLE branch DROP CONSTRAINT IF EXISTS branch_status_check;");
        } catch (Exception e) {
            // Log constraint error but proceed
            System.err.println("Could not drop status check constraint: " + e.getMessage());
        }

        seedBranches();
        seedAdmins();
        seedCustomers();
        seedCategories();
        seedProducts();
        seedVouchers();
        seedAiKnowledge();
    }

    private void seedAiKnowledge() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM phela_ai_embeddings", Long.class);
            if (count == null || count == 0) {
                System.out.println("AI Knowledge table is empty. Starting initial synchronization...");
                aiKnowledgeService.syncKnowledgeBase();
            } else {
                System.out.println("AI Knowledge base already has " + count + " entries. Skipping auto-sync.");
            }
        } catch (Exception e) {
            System.err.println("Could not check or seed AI Knowledge: " + e.getMessage());
        }
    }

    private void seedBranches() {
        if (branchRepository.count() == 0) {
            Branch b1 = Branch.builder()
                    .branchCode("HN001")
                    .branchName("Phê La Cầu Giấy")
                    .city("Hà Nội")
                    .district("Cầu Giấy")
                    .address("Cầu Giấy, Hà Nội")
                    .latitude(21.028511)
                    .longitude(105.791556)
                    .status(ProductStatus.SHOW)
                    .build();
            
            Branch b2 = Branch.builder()
                    .branchCode("HCM001")
                    .branchName("Phê La Quận 1")
                    .city("Hồ Chí Minh")
                    .district("Quận 1")
                    .address("Quận 1, HCM")
                    .latitude(10.776889)
                    .longitude(106.700897)
                    .status(ProductStatus.SHOW)
                    .build();
            
            branchRepository.saveAll(List.of(b1, b2));
        }
    }

    private void seedAdmins() {
        if (adminRepository.count() == 0) {
            Admin superAdmin = Admin.builder()
                    .username("superadmin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullname("Super Admin")
                    .role(Roles.SUPER_ADMIN)
                    .status(Status.ACTIVE)
                    .gender("Male")
                    .email("super@phela.com")
                    .phone("0999999999")
                    .employCode("EMP001")
                    .build();
            adminRepository.save(superAdmin);
        }
    }

    private void seedCustomers() {
        if (customerRepository.findByUsername("customer").isEmpty()) {
            Customer c = Customer.builder()
                    .customerCode("CUS001")
                    .username("customer")
                    .password(passwordEncoder.encode("customer123"))
                    .fullname("John Doe")
                    .email("john@example.com")
                    .phone("0888888888")
                    .gender("Male")
                    .role(Roles.CUSTOMER)
                    .status(Status.ACTIVE)
                    .build();
            customerRepository.save(c);
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            Category c1 = Category.builder().categoryCode("SYPHON").categoryName("Syphon").description("Trà pha chế bằng phương pháp Syphon").build();
            Category c2 = Category.builder().categoryCode("MOKA_POT").categoryName("Moka Pot").description("Trà pha chế bằng phương pháp ấm Moka").build();
            Category c3 = Category.builder().categoryCode("FRENCH_PRESS").categoryName("French Press").description("Trà pha chế bằng phương pháp French Press").build();
            Category c4 = Category.builder().categoryCode("COLD_BREW").categoryName("Cold Brew").description("Trà ủ lạnh, tươi mát").build();
            Category c5 = Category.builder().categoryCode("CA_PHE").categoryName("Cà Phê").description("Cà phê thủ công").build();
            Category c6 = Category.builder().categoryCode("O_LONG_MATCHA").categoryName("Ô Long Matcha").description("Các sản phẩm ô long matcha đặc biệt").build();
            Category c7 = Category.builder().categoryCode("TOPPING").categoryName("Topping").description("Các loại topping dùng kèm").build();

            categoryRepository.saveAll(List.of(c1, c2, c3, c4, c5, c6, c7));
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            Category syphon = categoryRepository.findById("SYPHON").orElse(null);
            Category moka = categoryRepository.findById("MOKA_POT").orElse(null);
            Category french = categoryRepository.findById("FRENCH_PRESS").orElse(null);
            Category cold = categoryRepository.findById("COLD_BREW").orElse(null);
            Category caPhe = categoryRepository.findById("CA_PHE").orElse(null);
            Category matcha = categoryRepository.findById("O_LONG_MATCHA").orElse(null);
            Category topping = categoryRepository.findById("TOPPING").orElse(null);

            if (syphon != null && moka != null && french != null && cold != null && caPhe != null && matcha != null && topping != null) {
                // SYPHON
                Product p1 = createProduct("SP001", "Ô Long Sữa Phê La", 54000.0, "https://phela.vn/wp-content/uploads/2021/04/Artboard-1-copy.png", syphon, true);
                Product p2 = createProduct("SP002", "Ô Long Nhài Sữa", 54000.0, "https://phela.vn/wp-content/uploads/2021/04/Artboard-1-copy-2.png", syphon, true);
                Product p3 = createProduct("SP003", "Phong Lan (Ô Long Vani Sữa)", 54000.0, "https://phela.vn/wp-content/uploads/2021/04/Artboard-1-copy-7.png", syphon, true);
                
                // MOKA POT
                Product p4 = createProduct("MK001", "Khói B'Lao", 54000.0, "https://phela.vn/wp-content/uploads/2021/04/Artboard-1-copy-3.png", moka, true);
                Product p5 = createProduct("MK002", "Tấm", 54000.0, "https://placehold.co/500x500?text=Tam", moka, true);

                // FRENCH PRESS
                Product p6 = createProduct("FP001", "Lụa Đào", 54000.0, "https://placehold.co/500x500?text=Lua+Dao", french, true);
                Product p7 = createProduct("FP002", "Trà Vỏ Cà Phê", 54000.0, "https://placehold.co/500x500?text=Tra+Vo+Ca+Phe", french, true);

                // COLD BREW
                Product p8 = createProduct("CB001", "Lang Biang", 54000.0, "https://placehold.co/500x500?text=Lang+Biang", cold, true);
                Product p9 = createProduct("CB002", "Bòng Bưởi", 64000.0, "https://placehold.co/500x500?text=Bong+Buoi", cold, true);

                // CA PHE
                Product p10 = createProduct("CP001", "Phê Đen", 39000.0, "https://placehold.co/500x500?text=Phe+Den", caPhe, true);
                Product p11 = createProduct("CP002", "Phê Nâu", 39000.0, "https://placehold.co/500x500?text=Phe+Nau", caPhe, true);
                Product p12 = createProduct("CP003", "Phê Xỉu Vani", 50000.0, "https://placehold.co/500x500?text=Phe+Xiu+Vani", caPhe, true);

                // MATCHA
                Product p13 = createProduct("OM001", "Matcha Phan Xi Păng", 64000.0, "https://placehold.co/500x500?text=Matcha+Phan+Xi+Pang", matcha, true);

                // TOPPING
                Product p14 = createProduct("TP001", "Trân Châu Gạo Rang", 10000.0, "https://placehold.co/500x500?text=Tran+Chau+Gao+Rang", topping, false);
                Product p15 = createProduct("TP002", "Thạch Trà Đào Hồng", 15000.0, "https://placehold.co/500x500?text=Thach+Tra+Dao+Hong", topping, false);

                productRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15));
            }
        }
    }

    private Product createProduct(String code, String name, Double price, String image, Category category, boolean hotStatus) {
        return Product.builder()
                .productCode(code)
                .productName(name)
                .description("Hương vị nguyên bản từ Phê La")
                .originalPrice(price)
                .discountPrice(price)
                .pointCost(price.intValue() / 1000)
                .isGift(false)
                .imageUrl(image)
                .status(hotStatus ? ProductStatus.HOT : ProductStatus.SHOW)
                .category(category)
                .build();
    }

    private void seedVouchers() {
        upsertVoucher("WELCOMEPHELA", "Chào mừng bạn mới", "Giảm 20% cho đơn hàng đầu tiên", 
            DiscountType.PERCENTAGE, 20.0, 50000.0, 50000.0, 1000);
        
        upsertVoucher("PHELA2026", "Phê La 2026", "Giảm trực tiếp 30.000đ cho đơn từ 100k", 
            DiscountType.FIXED_AMOUNT, 30000.0, 100000.0, 30000.0, 500);
    }

    private void upsertVoucher(String code, String name, String desc, DiscountType type, 
                              Double value, Double minOrder, Double maxDiscount, Integer limit) {
        Voucher voucher = voucherRepository.findByCode(code).orElse(new Voucher());
        voucher.setCode(code);
        voucher.setName(name);
        voucher.setDescription(desc);
        voucher.setType(type);
        voucher.setValue(value);
        voucher.setMinOrderAmount(minOrder);
        voucher.setMaxDiscountAmount(maxDiscount);
        if (voucher.getStartDate() == null) voucher.setStartDate(java.time.LocalDateTime.now().minusDays(1));
        if (voucher.getEndDate() == null) voucher.setEndDate(java.time.LocalDateTime.now().plusMonths(1));
        voucher.setStatus(PromotionStatus.ACTIVE);
        voucher.setUsageLimit(limit);
        if (voucher.getUsedCount() == null) voucher.setUsedCount(0);
        voucherRepository.save(voucher);
    }
}
