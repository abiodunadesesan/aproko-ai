# 09 - Prompt Architecture

## Objectives

- enforce consistent, grounded assistant behavior
- separate prompt concerns by task type
- make prompt changes auditable and versioned

## Prompt Layers

1. **System Layer**
   - product identity and behavior guardrails
2. **Policy Layer**
   - safety, privacy, refusal and uncertainty handling
3. **Task Layer**
   - workflow-specific instruction templates
4. **Context Layer**
   - retrieved chunks, memory facts, metadata
5. **Output Layer**
   - structured output contract (JSON/markdown/plain)

## Prompt Taxonomy

- `chat.general`
- `chat.grounded_qa`
- `summarize.document`
- `summarize.meeting`
- `notes.generate`
- `flashcards.generate`
- `quiz.generate`
- `memory.extract`
- `timeline.extract`

## Prompt Contract Rules

- Require citations for grounded answers.
- Disallow fabricated references.
- If context is insufficient, return explicit uncertainty.
- Include source provenance in intermediate reasoning metadata where possible.

## Example Prompt Skeleton

```text
SYSTEM: You are Aproko AI, a knowledge operating system assistant.
POLICY: Do not invent facts. Cite sources when answering from provided context.
TASK: Answer the user question with concise reasoning.
CONTEXT: <retrieved_chunks + memory_items>
OUTPUT: JSON with fields { answer, citations[], confidence }
```

## Prompt Versioning

- Each prompt template has:
  - `prompt_key`
  - `version`
  - `owner`
  - `change_notes`
- Rollout strategy: staged release with eval gates.

## Quality and Evaluation

- golden dataset per task type
- regressions tracked by:
  - factuality
  - citation correctness
  - completion format adherence

## Guardrails

- reject unsupported legal/medical claims when not grounded
- redact sensitive fields from memory context unless allowed
- enforce max context token budget and deterministic truncation

`TODO`: Final policy matrix for restricted domains and enterprise compliance profiles.

## Cross References

- RAG pipeline: `../08-rag/README.md`
- Memory extraction prompts: `../07-ai-memory/README.md`
- API output contracts: `../04-api/README.md`
