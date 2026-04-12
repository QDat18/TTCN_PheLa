package com.example.be_phela.repository;

import com.example.be_phela.model.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, String> {
    List<News> findAllByOrderByCreatedAtDesc();
}
