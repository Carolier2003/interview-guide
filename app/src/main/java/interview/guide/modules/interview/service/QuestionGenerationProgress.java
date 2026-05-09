package interview.guide.modules.interview.service;

import java.util.function.Consumer;

@FunctionalInterface
public interface QuestionGenerationProgress extends Consumer<QuestionGenerationProgress.Event> {

    QuestionGenerationProgress NOOP = event -> {};

    record Event(String phase, int percent, String message) {}
}
