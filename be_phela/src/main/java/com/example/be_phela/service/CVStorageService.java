package com.example.be_phela.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class CVStorageService {

    private final FileStorageService fileStorageService;

    // Danh sách các định dạng file CV được chấp nhận
    private static final List<String> ALLOWED_CV_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // Kích thước file tối đa (10MB) - Tăng giới hạn cho cloud
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final Path cvStorageLocation;

    public CVStorageService(FileStorageService fileStorageService, 
                            @Value("${app.cv.upload-dir:uploads/cv}") String uploadDir) {
        this.fileStorageService = fileStorageService;
        this.cvStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /**
     * Lưu file CV vào Cloudinary
     */
    public String storeCVFile(MultipartFile file) {
        // Validate file
        validateCVFile(file);

        try {
            // Upload lên Cloudinary trong folder "cv"
            String cvUrl = fileStorageService.storeFile(file, "cv");
            if (cvUrl == null) {
                throw new RuntimeException("Lỗi khi upload CV lên Cloudinary: URL trả về là null");
            }
            return cvUrl;

        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu file CV: " + file.getOriginalFilename(), ex);
        }
    }

    /**
     * Validate CV file
     */
    private void validateCVFile(MultipartFile file) {
        // Kiểm tra file có rỗng không
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File CV không được để trống");
        }

        // Kiểm tra kích thước file
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File CV không được vượt quá 10MB");
        }

        // Kiểm tra định dạng file
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CV_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File CV phải có định dạng PDF, DOC hoặc DOCX");
        }

        // Kiểm tra tên file
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("File CV phải có tên hợp lệ");
        }

        // Kiểm tra extension
        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        if (!fileExtension.matches("\\.(pdf|doc|docx)$")) {
            throw new IllegalArgumentException("File CV phải có đuôi .pdf, .doc hoặc .docx");
        }
    }

    /**
     * Lấy extension của file
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Xóa file CV (nếu cần)
     */
    public boolean deleteCVFile(String filePath) {
        try {
            if (filePath != null && filePath.startsWith("/uploads/cv/")) {
                String fileName = filePath.substring("/uploads/cv/".length());
                Path path = this.cvStorageLocation.resolve(fileName);
                return Files.deleteIfExists(path);
            }
            // Đối với Cloudinary, việc xóa phức tạp hơn (cần public_id)
            // Hiện tại tạm thời chỉ hỗ trợ xóa file local
            return false;
        } catch (IOException e) {
            System.err.println("Lỗi khi xóa file CV: " + e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra file có tồn tại không
     */
    public boolean fileExists(String filePath) {
        try {
            if (filePath == null) return false;
            
            if (filePath.startsWith("/uploads/cv/")) {
                String fileName = filePath.substring("/uploads/cv/".length());
                Path path = this.cvStorageLocation.resolve(fileName);
                return Files.exists(path);
            }
            
            // Đối với Cloudinary URL, giả định là tồn tại nếu có URL
            return filePath.startsWith("http");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy kích thước file
     */
    public long getFileSize(String filePath) {
        try {
            if (filePath == null) return 0;

            if (filePath.startsWith("/uploads/cv/")) {
                String fileName = filePath.substring("/uploads/cv/".length());
                Path path = this.cvStorageLocation.resolve(fileName);
                return Files.size(path);
            }
            
            // Cloudinary: khó lấy size trực tiếp từ URL mà không dùng API
            return 0;
        } catch (IOException e) {
            return 0;
        }
    }
}