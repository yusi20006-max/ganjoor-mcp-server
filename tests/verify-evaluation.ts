/**
 * Verifies each evaluation answer is reachable using only the MCP tools.
 * Run with: npx tsx tests/verify-evaluation.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";


async function main(): Promise<void> {
  const server = createServer();
  const client = new Client({ name: "eval-verify", version: "1.0.0" });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);

  const call = async (tool: string, args: Record<string, unknown>) => {
    const r = await client.callTool({ name: tool, arguments: args });
    if (r.isError) throw new Error(`${tool} errored: ${JSON.stringify(r.content).slice(0, 200)}`);
    const structured = (r.structuredContent ?? {}) as Record<string, unknown>;
    return {
      structured,
      text: ((r.content ?? []) as Array<{ text?: string }>).map((p) => p.text ?? "").join("\n"),
    };
  };

  const checks: Array<{ q: number; label: string; expected: string; run: () => Promise<string> }> = [
    {
      q: 1,
      label: "Q1 poet who quotes Hafez ghazal 494",
      expected: "فیض کاشانی",
      run: async () => {
        const { structured } = await call("ganjoor_get_poem_quoted_poems", {
          poem_id: 2623,
          items_count: 0,
        });
        const quotes = structured.quotes as Array<{ related_poet_name: string | null }>;
        return [...new Set(quotes.map((q) => q.related_poet_name).filter((name): name is string => Boolean(name)))].sort().join(" | ");
      },
    },
    {
      q: 2,
      label: "Q2 most-used metre vs ghazal 494 (expect False / 16 verses)",
      expected: "same=false | verses=16",
      run: async () => {
        const { structured: rh } = await call("ganjoor_list_rhythms", { page_size: 100 });
        const rhythms = rh.rhythms as Array<{ rhythm: string; verse_count: number }>;
        const top = [...rhythms].sort((a, b) => b.verse_count - a.verse_count)[0];
        const { structured: sec } = await call("ganjoor_get_poem_sections", { poem_id: 2623 });
        const sections = sec.sections as Array<{ metre: string | null }>;
        const poemMetre = sections[0]?.metre ?? "";
        const { structured: p } = await call("ganjoor_get_poem", {
          url: "hafez/ghazal/sh494",
          include_recitations: false,
        });
        const couplets = p.couplets_count as number;
        const isTop = poemMetre.startsWith(top.rhythm.split(" (")[0]);
        return `same=${isTop} | verses=${couplets * 2}`;
      },
    },
    {
      q: 3,
      label: "Q3 Hafez profile birth and death years",
      expected: "PENDING",
      run: async () => {
        const { structured } = await call("ganjoor_get_poet", {
          id: 2,
          include_cats: false,
          response_format: "json",
        });
        const result = `${structured.name} | birth=${structured.birth_year_hijri} | death=${structured.death_year_hijri}`;
        console.log("Q3 Hafez profile:", result);
        return result;
      },
    },
        {
      q: 4,
      label: "Q4 Kayumars kinship component size",
      expected: "personCount=196",
      run: async () => {
        const { structured: found } = await call("ganjoor_list_people", { search: "کیومرث" });
        const people = found.people as Array<{ id: number; name: string }>;
        const kayumars = people.find((p) => p.name === "کیومرث");
        const { structured } = await call("ganjoor_get_person_family_tree", {
          person_id: kayumars?.id ?? 1,
        });
        return `personCount=${structured.person_count}`;
      },
    },
    {
      q: 5,
      label: "Q5 recitation count for ghazal 494",
      expected: "total=14",
      run: async () => {
        const { structured } = await call("ganjoor_get_poem_recitations", {
          poem_id: 2623,
          page_size: 100,
        });
        return `total=${structured.total}`;
      },
    },
    {
      q: 6,
      label: "Q6 Hafez ghazals vs Khayyam rubaiyat",
      expected: "hafez=495 khayyam=178",
      run: async () => {
        const { structured: kh } = await call("ganjoor_get_poet", { id: 3, include_cats: true });
        const cats = (kh.cats ?? []) as Array<{ id: number; title: string }>;
        const rubaiyat = cats.find((c) => c.title === "رباعیات")!;
        const { structured: h } = await call("ganjoor_list_category_poems", {
          cat_id: 24,
          page_size: 1,
        });
        const { structured: r } = await call("ganjoor_list_category_poems", {
          cat_id: rubaiyat.id,
          page_size: 1,
        });
        return `hafez=${h.total} khayyam=${r.total}`;
      },
    },
    {
      q: 7,
      label: "Q7 FAQ category of the Khayyam-attribution entry",
      expected: "متن اشعار و موارد عمومی",
      run: async () => {
        const { structured } = await call("ganjoor_get_faq_items", { cat_id: 2, page_size: 100 });
        const items = structured.items as Array<{ id: number; question: string }>;
        const entry = items.find((i) => i.question.includes("خیام"));
        const { structured: cats } = await call("ganjoor_list_faq_categories", {});
        const categories = cats.categories as Array<{ id: number; title: string }>;
        const cat = categories.find((c) => c.id === 2);
        return entry && cat ? cat.title : "NO_MATCH";
      },
    },
    {
      q: 8,
      label: "Q8 Masnavi first dafter poem count",
      expected: "poems=172",
      run: async () => {
        const { structured: rumi } = await call("ganjoor_get_poet", { id: 5, include_cats: true });
        const cats = (rumi.cats ?? []) as Array<{ id: number; title: string }>;
        const masnavi = cats.find((c) => c.title === "مثنوی معنوی")!;
        const { structured: mas } = await call("ganjoor_get_category", {
          cat_id: masnavi.id,
          include_poems: false,
        });
        const children = (mas.children ?? []) as Array<{ id: number; title: string }>;
        const first = children.find((c) => c.title === "دفتر اول")!;
        const { structured: d1 } = await call("ganjoor_get_category", {
          cat_id: first.id,
          include_children: false,
        });
        return `poems=${d1.poems_total}`;
      },
    },
    {
      q: 9,
      label: "Q9 full title of page id 13836",
      expected: "رودکی » قصاید و قطعات » شمارهٔ ۲",
      run: async () => {
        const { structured } = await call("ganjoor_get_poem_by_id", {
          poem_id: 13836,
          include_recitations: false,
        });
        return String(structured.full_title ?? "NO_MATCH");
      },
    },
    {
      q: 10,
      label: "Q10 rhyme + first verse of ghazal 494",
      expected: "انبهدرایی || اِی دِل! گَر از آن چاهِ زَنَخْدان به دَرآیی",
      run: async () => {
        const { structured: rhyme } = await call("ganjoor_analyze_poem_rhyme", { poem_id: 2623 });
        const { structured: verses } = await call("ganjoor_get_poem_verses", { poem_id: 2623 });
        const list = verses.verses as Array<{ text: string; position: number }>;
        return `${rhyme.rhyme} || ${list[0]?.text}`;
      },
    },
  ];

  for (const check of checks) {
    try {
      const result = await check.run();
      const passed = result === check.expected;
      if (!passed) process.exitCode = 1;
      console.log(`Q${String(check.q).padStart(2)} ${passed ? "✓" : "✗"} ${check.label}\n     → ${result}\n     expected: ${check.expected}`);
    } catch (error) {
      console.log(`Q${String(check.q).padStart(2)} ✗ ${check.label}\n     → ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  await client.close();
  await server.close();
}

main().catch((error) => {
  console.error("crashed:", error);
  process.exit(1);
});
