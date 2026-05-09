package com.email.writer.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {

        // Build Prompt
        String prompt = buildPrompt(emailRequest);

        // Request Body
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of(
                                "parts", new Object[]{
                                        Map.of("text", prompt)
                                }
                        )
                }
        );

        // API Call
        String response;

        try {

            response = webClient.post()
                    .uri(geminiApiUrl + "?key=" + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {

            return "Error calling Gemini API: " + e.getMessage();
        }

        // Extract and Return Response
        return extractResponseContent(response);
    }

    private String extractResponseContent(String response) {

        try {

            ObjectMapper mapper = new ObjectMapper();

            JsonNode rootNode = mapper.readTree(response);

            return rootNode
                    .path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

        } catch (Exception e) {

            return "Error processing response: " + e.getMessage();
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {

        StringBuilder prompt = new StringBuilder();

        prompt.append(
                "Generate only one concise professional email reply for the following email content. " +
                        "Do not generate multiple options. " +
                        "Do not include placeholders like [Sender Name]. " +
                        "Please don't generate a subject line. "
        );

        if (emailRequest.getTone() != null &&
                !emailRequest.getTone().isEmpty()) {

            prompt.append("Use a ")
                    .append(emailRequest.getTone())
                    .append(" tone. ");
        }

        prompt.append("\nOriginal email:\n")
                .append(emailRequest.getEmailContent());

        return prompt.toString();
    }
}