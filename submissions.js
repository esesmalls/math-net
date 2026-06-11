(function () {
  "use strict";

  const DB_NAME = "math-net-review";
  const STORE = "submissions";
  const VERSION = 1;
  const MAX_PDF = 20 * 1024 * 1024;
  const isFileProtocol = location.protocol === "file:";
  const $ = (selector, parent = document) => parent.querySelector(selector);

  class IndexedDbSubmissionRepository {
    open() {
      if (!this.promise) {
        this.promise = new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, VERSION);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
              const store = db.createObjectStore(STORE, { keyPath: "id" });
              store.createIndex("domain", "domain");
              store.createIndex("status", "status");
              store.createIndex("createdAt", "createdAt");
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      return this.promise;
    }
    async transaction(mode, operation) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try { result = operation(store); } catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      });
    }
    put(record) { return this.transaction("readwrite", (store) => store.put(record)); }
    delete(id) { return this.transaction("readwrite", (store) => store.delete(id)); }
    async getAll() {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        request.onerror = () => reject(request.error);
      });
    }
  }

  window.SubmissionRepository = IndexedDbSubmissionRepository;
  const repository = new IndexedDbSubmissionRepository();
  const form = $("#submission-form");
  const statusNode = $("#submission-status");
  const pdfStatus = $("#pdf-status");
  const dialog = $("#archivum-dialog");
  const list = $("#archive-list");
  const domainFilter = $("#archive-domain-filter");
  const statusFilter = $("#archive-status-filter");

  Object.entries(window.MATH_NET.domains).forEach(([key, domain]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = domain.name;
    domainFilter.appendChild(option);
  });

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function validatePdf(file) {
    if (!file) return "Attach one PDF folio.";
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are accepted.";
    if (file.size > MAX_PDF) return "The PDF exceeds the 20MB limit.";
    return "";
  }

  function setReadOnly() {
    if (!isFileProtocol) return;
    form.querySelectorAll("input, textarea, select, button").forEach((control) => { control.disabled = true; });
    $("#open-archivum").disabled = true;
    statusNode.textContent = "Local review storage requires GitHub Pages or localhost. This file:// preview is read-only.";
  }

  form.pdf.addEventListener("change", () => {
    const file = form.pdf.files[0];
    const error = validatePdf(file);
    pdfStatus.textContent = error || `${file.name} · ${formatBytes(file.size)} · ready`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = form.pdf.files[0];
    const error = validatePdf(file);
    if (error) { statusNode.textContent = error; return; }
    const record = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "submitted",
      reviewNotes: "",
      domain: form.domain.value,
      title: form.title.value.trim(),
      summary: form.summary.value.trim(),
      author: form.author.value.trim(),
      email: form.email.value.trim(),
      pdfName: file.name,
      pdfType: file.type || "application/pdf",
      pdfSize: file.size,
      pdf: file
    };
    try {
      await repository.put(record);
      form.reset();
      pdfStatus.textContent = "No folio attached.";
      statusNode.textContent = "Discovery sealed into the local Archivum.";
    } catch (saveError) {
      statusNode.textContent = `Could not save locally: ${saveError.message}`;
    }
  });

  function button(label, action) {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.addEventListener("click", action);
    return node;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function renderArchive() {
    const records = await repository.getAll();
    const filtered = records.filter((record) =>
      (!domainFilter.value || record.domain === domainFilter.value) &&
      (!statusFilter.value || record.status === statusFilter.value)
    );
    list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "archive-empty";
      empty.textContent = "No local folios match this filter.";
      list.appendChild(empty);
      return;
    }
    filtered.forEach((record) => {
      const article = document.createElement("article");
      article.className = "archive-record";
      const head = document.createElement("div");
      head.className = "archive-record-head";
      const heading = document.createElement("div");
      const meta = document.createElement("div");
      meta.className = "archive-record-meta";
      meta.textContent = `${window.MATH_NET.domains[record.domain].name.toUpperCase()} · ${record.status.toUpperCase()} · ${new Date(record.createdAt).toLocaleString()}`;
      const title = document.createElement("h3");
      title.textContent = record.title;
      heading.append(meta, title);
      const author = document.createElement("p");
      author.className = "archive-record-meta";
      author.textContent = record.author ? `${record.author}${record.email ? ` · ${record.email}` : ""}` : "ANONYMOUS";
      head.append(heading, author);
      const summary = document.createElement("p");
      summary.textContent = record.summary;

      const review = document.createElement("div");
      review.className = "archive-review";
      const status = document.createElement("select");
      ["submitted", "under-review", "accepted", "rejected"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value; option.textContent = value.replace("-", " ");
        option.selected = record.status === value;
        status.appendChild(option);
      });
      const notes = document.createElement("textarea");
      notes.rows = 3;
      notes.placeholder = "Local review notes";
      notes.value = record.reviewNotes || "";
      review.append(status, notes);

      const actions = document.createElement("div");
      actions.className = "archive-actions";
      actions.append(
        button(`DOWNLOAD ${record.pdfName}`, () => downloadBlob(record.pdf, record.pdfName)),
        button("SAVE REVIEW", async () => {
          record.status = status.value;
          record.reviewNotes = notes.value.trim();
          record.updatedAt = new Date().toISOString();
          await repository.put(record);
          await renderArchive();
        }),
        button("DELETE LOCAL FOLIO", async () => {
          if (!confirm(`Delete "${record.title}" and its PDF from this browser?`)) return;
          await repository.delete(record.id);
          await renderArchive();
        })
      );
      article.append(head, summary, review, actions);
      list.appendChild(article);
    });
  }

  $("#open-archivum").addEventListener("click", async () => {
    await renderArchive();
    dialog.showModal();
  });
  $("#close-archivum").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  domainFilter.addEventListener("change", renderArchive);
  statusFilter.addEventListener("change", renderArchive);

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(value) { return [value & 255, (value >>> 8) & 255]; }
  function u32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function createZip(entries) {
    const parts = [];
    const central = [];
    let offset = 0;
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(await entry.data.arrayBuffer());
      const crc = crc32(data);
      const local = new Uint8Array([
        ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name
      ]);
      parts.push(local, data);
      const header = new Uint8Array([
        ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name
      ]);
      central.push(header);
      offset += local.length + data.length;
    }
    const centralSize = central.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array([
      ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
      ...u32(centralSize), ...u32(offset), ...u16(0)
    ]);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  function readU16(view, offset) { return view.getUint16(offset, true); }
  function readU32(view, offset) { return view.getUint32(offset, true); }

  async function parseZip(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const entries = {};
    let offset = 0;
    while (offset + 30 <= bytes.length && readU32(view, offset) === 0x04034b50) {
      const method = readU16(view, offset + 8);
      if (method !== 0) throw new Error("Only Math Net uncompressed review ZIP files are supported.");
      const size = readU32(view, offset + 18);
      const nameLength = readU16(view, offset + 26);
      const extraLength = readU16(view, offset + 28);
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
      entries[name] = bytes.slice(dataStart, dataStart + size);
      offset = dataStart + size;
    }
    return entries;
  }

  $("#export-archive").addEventListener("click", async () => {
    const records = await repository.getAll();
    const metadata = records.map(({ pdf, ...record }) => record);
    const entries = [{ name: "manifest.json", data: encoder.encode(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), records: metadata }, null, 2)) }];
    records.forEach((record) => entries.push({ name: `pdf/${record.id}.pdf`, data: record.pdf }));
    downloadBlob(await createZip(entries), `math-net-review-${new Date().toISOString().slice(0, 10)}.zip`);
  });

  $("#import-archive").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const entries = await parseZip(file);
      if (!entries["manifest.json"]) throw new Error("manifest.json is missing.");
      const manifest = JSON.parse(decoder.decode(entries["manifest.json"]));
      for (const metadata of manifest.records || []) {
        const pdfBytes = entries[`pdf/${metadata.id}.pdf`];
        if (!pdfBytes) continue;
        await repository.put({ ...metadata, pdf: new Blob([pdfBytes], { type: "application/pdf" }) });
      }
      await renderArchive();
    } catch (error) {
      alert(`Could not import review ZIP: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  });

  $("#export-publications").addEventListener("click", async () => {
    const records = (await repository.getAll()).filter((record) => record.status === "accepted");
    const drafts = records.map((record) => ({
      id: record.id,
      domain: record.domain,
      title: record.title,
      summary: record.summary,
      author: record.author || "Anonymous",
      acceptedAt: record.updatedAt,
      sourcePdf: record.pdfName,
      reviewNotes: record.reviewNotes
    }));
    downloadBlob(new Blob([JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), drafts }, null, 2)], { type: "application/json" }), "publication-draft.json");
  });

  setReadOnly();
}());
