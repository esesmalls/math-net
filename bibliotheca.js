(function () {
  "use strict";

  const reviewed = "2026-08-12";
  const works = {
    "telescope-conjecture-counterexamples": work("$K$-theoretic counterexamples to Ravenel's telescope conjecture", ["Robert Burklund", "Jeremy Hahn", "Ishan Levy", "Tomer M. Schlank"], "preprint", arxiv("2310.17459", 1, "2023-10-26", "2023-10-26")),
    "last-kervaire-invariant": work("On the Last Kervaire Invariant Problem", ["Weinan Lin", "Guozhen Wang", "Zhouli Xu"], "preprint", arxiv("2412.10879", 2, "2024-12-15", "2025-02-22")),
    "seifert-surfaces-four-ball": work("Non-isotopic Seifert surfaces in the 4-ball", ["Zsombor Fehér"], "preprint", arxiv("2304.12113", 2, "2023-04-24", "2023-12-01")),
    "symmetric-power-functoriality": work("Symmetric power functoriality for Hilbert modular forms", ["James Newton", "Jack A. Thorne"], "published", arxiv("2212.03595", 2, "2022-12-07", "2025-02-19"), publication("article-journal", "10.4007/annals.2026.203.1.4", "Annals of Mathematics", 2026, "203", "1", "283-347")),
    "unbounded-denominators": work("The Unbounded Denominators Conjecture", ["Frank Calegari", "Vesselin Dimitrov", "Yunqing Tang"], "published", arxiv("2109.09040", 4, "2021-09-19", "2024-09-17"), publication("article-journal", "10.1090/jams/1053", "Journal of the American Mathematical Society", 2025, "38", "3", "627-702")),
    "kelley-meka-roth": work("Strong Bounds for 3-Progressions", ["Zander Kelley", "Raghu Meka"], "published", arxiv("2302.05537", 6, "2023-02-11", "2024-10-29"), publication("paper-conference", "10.1109/FOCS57990.2023.00059", "2023 IEEE 64th Annual Symposium on Foundations of Computer Science", 2023, "", "", "933-973")),
    "lqg-metric-uniqueness": work("Uniqueness of the critical and supercritical Liouville quantum gravity metrics", ["Jian Ding", "Ewain Gwynne"], "published", arxiv("2110.00177", 3, "2021-10-01", "2022-09-02"), publication("article-journal", "10.1112/plms.12492", "Proceedings of the London Mathematical Society", 2023, "126", "1", "216-333")),
    "sle4-removability": work("Conformal removability of SLE4", ["Konstantinos Kavvadias", "Jason Miller", "Lukas Schoug"], "preprint", arxiv("2209.10532", 1, "2022-09-22", "2022-09-22")),
    "non-simple-sle-removability": work("Conformal removability of non-simple Schramm-Loewner evolutions", ["Konstantinos Kavvadias", "Jason Miller", "Lukas Schoug"], "published", arxiv("2302.10857", 2, "2023-02-22", "2026-05-05"), publication("article-journal", "10.1007/s00222-026-01427-3", "Inventiones Mathematicae", 2026)),
    "multiplicity-one-mean-curvature": work("On the Multiplicity One Conjecture for Mean Curvature Flows of surfaces", ["Richard H. Bamler", "Bruce Kleiner"], "preprint", arxiv("2312.02106", 3, "2023-12-05", "2024-11-12")),
    "compact-bonnet-pairs": work("Compact Bonnet Pairs: isometric tori with the same curvatures", ["Alexander I. Bobenko", "Tim Hoffmann", "Andrew O. Sageman-Furnas"], "published", arxiv("2110.06335", 2, "2021-10-13", "2023-12-27"), publication("article-journal", "10.1007/s10240-025-00159-z", "Publications Mathématiques de l'IHÉS", 2025, "142", "", "241-293")),
    "positive-mass-stability": work("Stability of Euclidean 3-space for the positive mass theorem", ["Conghan Dong", "Antoine Song"], "published", arxiv("2302.07414", 3, "2023-02-15", "2024-12-04"), publication("article-journal", "10.1007/s00222-024-01302-z", "Inventiones Mathematicae", 2025, "239", "1", "287-319")),
    "kahn-kalai-theorem": work("A Proof of the Kahn-Kalai Conjecture", ["Jinyoung Park", "Huy Tuan Pham"], "published", arxiv("2203.17207", 2, "2022-04-01", "2023-04-14"), publication("article-journal", "10.1090/jams/1028", "Journal of the American Mathematical Society", 2024, "37", "1", "235-243")),
    "erdos-faber-lovasz": work("A proof of the Erdős-Faber-Lovász conjecture", ["Dong Yeap Kang", "Tom Kelly", "Daniela Kühn", "Abhishek Methuku", "Deryk Osthus"], "published", arxiv("2101.04698", 3, "2021-01-13", "2023-01-25"), publication("article-journal", "10.4007/annals.2023.198.2.2", "Annals of Mathematics", 2023, "198", "2", "537-618")),
    "union-closed-lower-bound": work("A constant lower bound for the union-closed sets conjecture", ["Justin Gilmer"], "preprint", arxiv("2211.09055", 2, "2022-11-17", "2022-11-28")),
    "three-dimensional-kakeya": work("Volume estimates for unions of convex sets, and the Kakeya set conjecture in three dimensions", ["Hong Wang", "Joshua Zahl"], "preprint", arxiv("2502.17655", 1, "2025-02-25", "2025-02-25")),
    "furstenberg-set-conjecture": work("Furstenberg sets estimate in the plane", ["Kevin Ren", "Hong Wang"], "preprint", arxiv("2308.08819", 3, "2023-08-17", "2025-01-20")),
    "restriction-estimates-r3": work("Restriction estimates using decoupling theorems and two-ends Furstenberg inequalities", ["Hong Wang", "Shukun Wu"], "preprint", arxiv("2411.08871", 3, "2024-11-14", "2024-12-20"))
  };

  function arxiv(id, version, submitted, updated) {
    return { id, version, submitted, updated };
  }

  function publication(type, doi, venue, year, volume, issue, pages) {
    return { type, doi, venue, year, volume: volume || "", issue: issue || "", pages: pages || "" };
  }

  function work(title, authors, status, arxivRecord, publishedRecord) {
    return {
      title,
      authors,
      status,
      type: publishedRecord ? publishedRecord.type : "manuscript",
      issued: publishedRecord ? publishedRecord.year : Number(arxivRecord.submitted.slice(0, 4)),
      arxiv: arxivRecord,
      publication: publishedRecord || null
    };
  }

  function splitAuthors(value) {
    return String(value || "Anonymous")
      .split(/,|;/)
      .map((name) => name.trim())
      .filter(Boolean);
  }

  function canonicalUrl(record) {
    if (record.publication && record.publication.doi) return `https://doi.org/${record.publication.doi}`;
    if (record.arxiv && record.arxiv.id) return `https://arxiv.org/abs/${record.arxiv.id}`;
    return record.url || "";
  }

  function fallbackRecord(result) {
    const yearMatch = String(result.year || "").match(/\d{4}/g);
    return {
      slug: result.slug,
      title: result.title,
      authors: splitAuthors(result.authors),
      status: result.status,
      type: "reference-entry",
      issued: yearMatch ? Number(yearMatch[yearMatch.length - 1]) : null,
      arxiv: null,
      publication: null,
      url: result.sources && result.sources[0] ? result.sources[0].url : "",
      explicit: false
    };
  }

  function recordFor(result) {
    if (!result) return null;
    const explicit = works[result.slug];
    return explicit ? Object.assign({ slug: result.slug, explicit: true }, explicit) : fallbackRecord(result);
  }

  function citationKey(record) {
    const lead = (record.authors[0] || "anonymous").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).pop();
    const word = record.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).find((part) => part.length > 4) || "result";
    return `${lead}${record.issued || "nd"}${word}`.replace(/[^a-z0-9]/gi, "");
  }

  function toCSL(input) {
    const record = input.slug && input.title && input.authors && input.explicit !== undefined ? input : recordFor(input);
    const csl = {
      id: citationKey(record),
      type: record.type === "reference-entry" ? "entry-encyclopedia" : record.type,
      title: record.title,
      author: record.authors.map((literal) => ({ literal })),
      issued: { "date-parts": [[record.issued]] },
      URL: canonicalUrl(record)
    };
    if (record.publication) {
      csl.DOI = record.publication.doi;
      csl["container-title"] = record.publication.venue;
      if (record.publication.volume) csl.volume = record.publication.volume;
      if (record.publication.issue) csl.issue = record.publication.issue;
      if (record.publication.pages) csl.page = record.publication.pages;
    }
    if (record.arxiv) {
      csl.archive = "arXiv";
      csl.archive_location = record.arxiv.id;
    }
    return csl;
  }

  function bibValue(value) {
    return String(value).replace(/([%&_#])/g, "\\$1");
  }

  function toBibTeX(input) {
    const record = input.slug && input.title && input.authors && input.explicit !== undefined ? input : recordFor(input);
    const kind = record.type === "article-journal" ? "article" : record.type === "paper-conference" ? "inproceedings" : "misc";
    const fields = [
      ["title", record.title],
      ["author", record.authors.join(" and ")],
      ["year", record.issued],
      ["url", canonicalUrl(record)]
    ];
    if (record.publication) {
      fields.push([kind === "article" ? "journal" : "booktitle", record.publication.venue], ["doi", record.publication.doi]);
      if (record.publication.volume) fields.push(["volume", record.publication.volume]);
      if (record.publication.issue) fields.push(["number", record.publication.issue]);
      if (record.publication.pages) fields.push(["pages", record.publication.pages.replace("-", "--")]);
    } else if (record.arxiv) {
      fields.push(["eprint", record.arxiv.id], ["archivePrefix", "arXiv"]);
    }
    const body = fields.filter((entry) => entry[1] !== null && entry[1] !== "").map(([key, value]) => `  ${key} = {${bibValue(value)}}`).join(",\n");
    return `@${kind}{${citationKey(record)},\n${body}\n}\n`;
  }

  function audit(results) {
    const issues = [];
    const recent = (results || []).filter((item) => item.era === "recent");
    recent.forEach((item) => {
      const record = works[item.slug];
      if (!record) issues.push(`${item.slug}: missing explicit canonical identity`);
      else if (record.status !== item.status) issues.push(`${item.slug}: status differs between corpus and Bibliotheca`);
      else if (record.status === "published" && (!record.publication || !record.publication.doi)) issues.push(`${item.slug}: published work lacks DOI identity`);
    });
    const arxivIds = recent.map((item) => works[item.slug] && works[item.slug].arxiv.id).filter(Boolean);
    const dois = recent.map((item) => works[item.slug] && works[item.slug].publication && works[item.slug].publication.doi).filter(Boolean);
    if (new Set(arxivIds).size !== arxivIds.length) issues.push("duplicate arXiv identity");
    if (new Set(dois).size !== dois.length) issues.push("duplicate DOI identity");
    return issues;
  }

  window.MATH_BIBLIOTHECA = {
    schemaVersion: 1,
    reviewed,
    works,
    recordFor,
    canonicalUrl,
    citationKey,
    toCSL,
    toBibTeX,
    audit
  };
}());
