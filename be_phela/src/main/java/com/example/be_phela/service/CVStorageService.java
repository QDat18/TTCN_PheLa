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

    // Thư mục lưu trữ CV files
    private final Path cvStorageLocation;

    // Danh sách các định dạng file CV được chấp nhận
    private static final List<String> ALLOWED_CV_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // Kích thước file tối đa (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    public CVStorageService(@Value("${app.cv.upload-dir:uploads/cv}") String uploadDir) {
        this.cvStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.cvStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Không thể tạo thư mục lưu trữ CV: " + uploadDir, ex);
        }
    }

    /**
     * Lưu file CV vào local storage
     */
    public String storeCVFile(MultipartFile file) {
        // Validate file
        validateCVFile(file);

        try {
            // Tạo tên file độc nhất
            String originalFileName = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFileName);
            String fileName = "CV_" + UUID.randomUUID().toString() + "_" +
                    System.currentTimeMillis() + fileExtension;

            // Kiểm tra tên file an toàn
            if (fileName.contains("..")) {
                throw new RuntimeException("Tên file không hợp lệ: " + fileName);
            }

            // Lưu file
            Path targetLocation = this.cvStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Trả về đường dẫn relative
            return "/uploads/cv/" + fileName;

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
            throw new IllegalArgumentException("File CV không được vượt quá 5MB");
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
            if (filePath != null && filePath.startsWith("/uploads/cv/")) {
                String fileName = filePath.substring("/uploads/cv/".length());
                Path path = this.cvStorageLocation.resolve(fileName);
                return Files.exists(path);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy kích thước file
     */
    public long getFileSize(String filePath) {
        try {
            if (filePath != null && filePath.startsWith("/uploads/cv/")) {
                String fileName = filePath.substring("/uploads/cv/".length());
                Path path = this.cvStorageLocation.resolve(fileName);
                return Files.size(path);
            }
            return 0;
        } catch (IOException e) {
            return 0;
        }
    }
}