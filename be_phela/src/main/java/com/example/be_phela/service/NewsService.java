package com.example.be_phela.service;

import com.example.be_phela.dto.response.NewsResponseDTO;
import com.example.be_phela.model.News;
import com.example.be_phela.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public NewsResponseDTO createNews(String title, String summary, String content, MultipartFile thumbnail) throws IOException {
        String thumbnailUrl = null;
        if (thumbnail != null && !thumbnail.isEmpty()) {
            thumbnailUrl = fileStorageService.storeNewsThumbnail(thumbnail);
        }

        LocalDateTime now = LocalDateTime.now();

        News news = News.builder()
                .title(title)
                .summary(summary)
                .content(content)
                .thumbnailUrl(thumbnailUrl)
                .createdAt(now)
                .updatedAt(now)
                .build();

        News savedNews = newsRepository.save(news);
        return mapToResponseDTO(savedNews);
    }

    @Transactional
    public NewsResponseDTO updateNews(String newsId, String title, String summary, String content, MultipartFile thumbnail) throws IOException {
        News existingNews = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));

        if (thumbnail != null && !thumbnail.isEmpty()) {
            String newThumbnailUrl = fileStorageService.storeNewsThumbnail(thumbnail);
            existingNews.setThumbnailUrl(newThumbnailUrl);
            // Optional: Xóa ảnh cũ trên Cloudinary tại đây nếu cần
        }

        existingNews.setTitle(title);
        existingNews.setSummary(summary);
        existingNews.setContent(content);
        existingNews.setUpdatedAt(LocalDateTime.now());

        News updatedNews = newsRepository.save(existingNews);
        return mapToResponseDTO(updatedNews);
    }

    @Transactional
    public void deleteNews(String newsId) {
        if (!newsRepository.existsById(newsId)) {
            throw new RuntimeException("News not found with id: " + newsId);
        }
        newsRepository.deleteById(newsId);
    }


    @Transactional(readOnly = true)
    public List<NewsResponseDTO> getAllNewsForCustomer() {
        return newsRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NewsResponseDTO getNewsById(String newsId) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));
        return mapToResponseDTO(news);
    }


    private NewsResponseDTO mapToResponseDTO(News news) {
        return NewsResponseDTO.builder()
                .newsId(news.getNewsId())
                .title(news.getTitle())
                .summary(news.getSummary())
                .content(news.getContent())
                .thumbnailUrl(news.getThumbnailUrl())
                .createdAt(news.getCreatedAt())
                .updatedAt(news.getUpdatedAt())
                .build();
    }
}