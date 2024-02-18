package org.eventhub.main.service.impl;

import org.eventhub.main.dto.EventResponse;
import org.eventhub.main.exception.BadSearchRequestException;
import org.eventhub.main.service.VectorSearchService;
import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VectorSearchServiceImpl implements VectorSearchService {
    private final EmbeddingClient embeddingClient;
    private final JdbcClient jdbcClient;

    @Autowired
    public VectorSearchServiceImpl(EmbeddingClient embeddingClient, JdbcClient jdbcClient) {
        this.embeddingClient = embeddingClient;
        this.jdbcClient = jdbcClient;
    }

    @Override
    public List<EventResponse> searchEvents(String prompt) {
        List<Double> embedding = embeddingClient.embed(prompt);

        JdbcClient.StatementSpec query = jdbcClient.sql(
                """
SELECT events.id, events.max_participants,events.created_at, events.start_at, events.expire_at,events.participant_count, events.state, events.owner_id, events.title, events.description, events.location, event_embeddings.embedding
FROM events
INNER JOIN event_embeddings ON events.embedding_id=event_embeddings.id
WHERE 1 - (embedding <=> :user_prompt::vector) >= 0.8
ORDER BY (embedding <=> :user_prompt::vector) LIMIT 15
""").param("user_prompt", embedding.toString());

        List<EventResponse> responsesList = query.query(EventResponse.class).list();
        if(responsesList.isEmpty()) {
            throw new BadSearchRequestException("Prompt: " + prompt + " is not meaningful. We cannot find any matches.");
        }

        return responsesList;
    }
}
