package com.example.be_phela.controller;

import com.example.be_phela.dto.response.NewsResponseDTO;
import com.example.be_phela.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    // ======================================================
    // =============== ENDPOINTS FOR ADMIN ==================
    // ======================================================

    @PostMapping(value = "/admin/news", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NewsResponseDTO> createNews(
            @RequestParam("title") String title,
            @RequestParam("summary") String summary,
            @RequestParam("content") String content,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail) throws IOException {
        NewsResponseDTO createdNews = newsService.createNews(title, summary, content, thumbnail);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdNews);
    }

    @PutMapping(value = "/admin/news/{newsId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NewsResponseDTO> updateNews(
            @PathVariable String newsId,
            @RequestParam("title") String title,
            @RequestParam("summary") String summary,
            @RequestParam("content") String content,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail) throws IOException {
        NewsResponseDTO updatedNews = newsService.updateNews(newsId, title, summary, content, thumbnail);
        return ResponseEntity.ok(updatedNews);
    }

    @DeleteMapping("/admin/news/{newsId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteNews(@PathVariable String newsId) {
        newsService.deleteNews(newsId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/news")
    public ResponseEntity<List<NewsResponseDTO>> getAllNewsForAdmin() {
        return ResponseEntity.ok(newsService.getAllNewsForCustomer());
    }

    // Và API lấy chi tiết một tin tức
    @GetMapping("/admin/news/{newsId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<NewsResponseDTO> getNewsByIdForAdmin(@PathVariable String newsId) {
        return ResponseEntity.ok(newsService.getNewsById(newsId));
    }


    // ======================================================
    // ============== ENDPOINTS FOR CUSTOMER ================
    // ======================================================

    @GetMapping("/news")
    public ResponseEntity<List<NewsResponseDTO>> getAllNews() {
        List<NewsResponseDTO> newsList = newsService.getAllNewsForCustomer();
        return ResponseEntity.ok(newsList);
    }

    @GetMapping("/news/{newsId}")
    public ResponseEntity<NewsResponseDTO> getNewsById(@PathVariable String newsId) {
        NewsResponseDTO news = newsService.getNewsById(newsId);
        return ResponseEntity.ok(news);
    }
}