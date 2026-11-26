# Ganjoor Agent Evaluation Protocol

## Scope and honesty of the baseline

The repository already contains `evaluation/evaluation.xml` (10 multi-step questions) and
`tests/verify-evaluation.ts` (a scripted MCP-tool workflow that replays the questions). The script
checks that tool calls return without MCP errors and prints computed outputs. **It is not an AI-agent
evaluation**: it does not invoke a language model, score tool selection, or assert computed answers
against the answer key.

This document defines a repeatable protocol for the requested agent evaluation. A live agent baseline
has **not been executed in this environment**. Results must be recorded after an authorized agent run;
do not label the baseline as passed until then.

## Tasks

Use the 10 questions and answer key in `evaluation/evaluation.xml`. They cover:
1. Hafez ghazal 494 quotation/poet attribution.
2. Corpus-wide most-used metre vs ghazal metre and verse count.
3. Poet filtering by Hijri birth/death years.
4. Kinship-graph connected-component size from Kayumars.
5. Recitation count for Hafez ghazal 494.
6. Hafez ghazal and Khayyam rubai count comparison.
7. FAQ category for Khayyam attribution discussion.
8. Masnavi first dafter poem count.
9. Exact title for poem ID 13836.
10. Rhyme and first verse for Hafez ghazal 494.

## Repeatable procedure

1. Use a fresh agent conversation and the same MCP server commit.
2. Give the agent one evaluation question at a time, verbatim from XML.
3. Do not expose the expected answer to the agent.
4. Save the agent transcript, tool calls, tool arguments, tool results, and final response.
5. Run `npx tsx tests/verify-evaluation.ts` separately as a scripted tool-path sanity check.
6. Compare the agent's answer with the XML answer key. Normalize only whitespace where the question permits; preserve exact Persian strings when exact spelling is requested.
7. Record all scores and failures in the baseline table below and attach anonymized transcripts as artifacts.

## Scoring rubric (0–10 per task)

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Answer correctness | Wrong / no answer | Partially correct | Correct, answer-key matched |
| Tool choice | Unrelated or missing tools | Mostly appropriate | Appropriate tools and sequence |
| Call efficiency | Excessive / failed calls | Some unnecessary calls | Minimal reasonable calls |
| Evidence & reasoning | Unsupported guess | Some tool evidence | Answer traceable to returned data |
| Output/context discipline | Unusable / overlong | Minor issues | Concise, format-compliant |

Maximum: 100 points for 10 tasks. Report task-level scores and total, not only an aggregate.

## Baseline results

| Task | Scripted MCP harness | Real-agent run | Score / 10 | Notes |
| --- | --- | --- | --- | --- |
| Q1–Q10 | Harness exists; execute separately | Pending | Pending | No run evidence attached yet |

## Run scripted MCP harness

```bash
npx tsx tests/verify-evaluation.ts
```

This harness is a deterministic tool-workflow sanity check, not a substitute for a model-agent run. It requires access to the live Ganjoor API.

## Report template

- Date / timezone:
- Agent/model and configuration:
- Server commit SHA:
- Ganjoor API availability:
- Task scores Q1–Q10:
- Total score / 100:
- Failed or unnecessary tool calls:
- Answer mismatches:
- Context/output-limit issues:
- Transcript and tool-call artifact links:
- Follow-up issues created:

Never commit API keys or private transcripts containing secrets.
