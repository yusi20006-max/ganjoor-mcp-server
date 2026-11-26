# Python Reference vs TypeScript Ganjoor MCP Feature Audit

This comparison is a static repository/tool-surface review. It does not claim live API endpoint
verification or full feature parity. Where API support or implementation was not established, the
decision is marked **verify/defer** rather than inferred.

| Capability | Python reference | TypeScript implementation | Evidence / status | Recommendation |
|---|---|---|---|---|
| Poet lookup/listing | Yes | `ganjoor_list_poets`, `ganjoor_get_poet`, century listing | Tool surface present | Keep |
| Categories/books | Yes | Category and book tools | Tool surface present | Keep |
| Poem fetch by ID/URL | Yes | `ganjoor_get_poem`, `ganjoor_get_poem_by_id`, verses | Tool surface present | Keep |
| Keyword poem search | Yes | `ganjoor_search_poems` | Tool surface present | Keep |
| Semantic search | Yes, embedding-service dependent | `ganjoor_semantic_search_poems` | Tool exists; upstream may return unavailable/503 | Keep optional; document fallback |
| Verse/hemistich search | Python feature reported | No dedicated verse-search tool identified in current TypeScript tool registry | Not demonstrated | Verify API endpoint and value; defer |
| Prosody/rhythm | Yes | Rhythm listing and poem rhythm analysis | Tool surface present | Keep |
| Rhyme analysis | Yes | Rhyme analysis | Tool surface present | Keep |
| Poems sharing metre/rhyme | Yes | Similar poems tool | Tool surface present | Keep |
| Related poems / quotations | Yes | Quoted-poem relationships and related sections | Tool surface present, narrower than generic related-poem semantics | Keep; document scope |
| Audio recitations | Yes | Search/get/list recitations and timing | Tool surface present | Keep |
| Interpretations/commentary | Python feature reported | Recent comments and FAQ tools exist; dedicated poem interpretation tool not identified | Not proven equivalent | Verify endpoint/data; defer |
| Manuscript museum | Python feature reported | Poem image/facsimile retrieval exists; dedicated museum catalog/search not identified | Partial coverage only | Verify API; defer dedicated catalog |
| Tajik poems | Python feature reported | Language-tagged sections exist; dedicated Tajik corpus search not identified | Not proven equivalent | Verify data/API; defer |
| People/family trees | Yes | Person lookup, relations, family-tree graph | Tool surface present | Keep |
| Images, geotags, corrections | Yes | Poem images, geotags, corrections | Tool surface present | Keep |
| Comments and FAQ | Yes | Comments and FAQ tools | Tool surface present | Keep |

## Summary

The TypeScript server covers many core public Ganjoor workflows, but this static comparison **does not
support a claim of complete high-value parity**. In particular, dedicated verse search, poem
interpretation, museum-catalog workflows, and Tajik-specific retrieval remain unverified or not
identified. Semantic search is present but depends on the upstream embedding feature.

No Python source was copied. The reference repository's license must be reviewed before any code
porting. This matrix recommends keeping existing tools, verifying API support before adding new
features, and deferring unsupported or ambiguous parity work.

## Follow-up research

For each deferred feature, record the public Ganjoor endpoint, response shape, API availability,
fixture coverage, value, and license implications before opening an implementation PR.
