/**
 * Get a learning-focused response to a specific subject question
 * 
 * @param query   The student's question
 * @param subject The academic subject
 * @return The AI model's educational response
 */
public Mono<String> getSubjectSpecificResponse(String query, String subject) {
    log.info("Processing subject-specific query: {}, subject: {}", query, subject);

    // 添加主题相关的上下文以获得更好的响应
    String contextPrompt = "I'm helping a student understand concepts in " + subject + ". ";
    String enhancedQuery = contextPrompt + query;

    return getAiResponse(enhancedQuery, null);
}