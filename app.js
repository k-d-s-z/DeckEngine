(() => {
  var I18N_LANG = (() => {
      try {
        let l = localStorage.getItem("lang");
        if (l === "pl" || l === "en") return l;
      } catch {
        /* localStorage niedostępny – zostaje język przeglądarki */
      }
      return /^pl/i.test(navigator.language || "") ? "pl" : "en";
    })(),
    I18N_EN = /*@I18N_EN@*/ {},
    I18N_T = (pl, ...a) => {
      let s = I18N_LANG === "en" && I18N_EN[pl] !== void 0 ? I18N_EN[pl] : pl,
        q = 0;
      return s.replace(/\{(\d*)(?:\|([^|}]*)\|([^}]*))?\}/g, (_m, i, o, p) => {
        let v = a[i === "" ? q++ : +i];
        return o !== void 0 ? (+v === 1 ? o : p) : v;
      });
    };
  document.documentElement.lang = I18N_LANG;
  var dn = "automa-decks",
    Pt;
  function pn() {
    return (
      Pt ||
        (Pt = new Promise((t, e) => {
          let n = indexedDB.open(dn, 1);
          ((n.onupgradeneeded = () => {
            let a = n.result;
            (a.createObjectStore("games", { keyPath: "id" }),
              a.createObjectStore("cards", { keyPath: "id" }).createIndex("gameId", "gameId"),
              a.createObjectStore("state", { keyPath: "gameId" }));
          }),
            (n.onsuccess = () => t(n.result)),
            (n.onerror = () => e(n.error)),
            (n.onblocked = () => e(new Error(I18N_T("Baza danych jest zablokowana przez inną kartę przeglądarki.")))));
        }).catch((err) => {
          Pt = void 0; // nieudane otwarcie nie może zostać zapamiętane – kolejna próba otworzy bazę od nowa
          throw err;
        })),
      Pt
    );
  }
  var T = (t) =>
      new Promise((e, n) => {
        ((t.onsuccess = () => e(t.result)), (t.onerror = () => n(t.error)));
      }),
    fn = (t) =>
      new Promise((e, n) => {
        ((t.oncomplete = () => e()),
          (t.onerror = () => n(t.error)),
          (t.onabort = () => n(t.error || new Error(I18N_T("Transakcja przerwana (brak miejsca?).")))));
      });
  async function F(t, e, n) {
    let o = (await pn()).transaction(t, e),
      s = fn(o),
      r = await n(o);
    return (await s, r);
  }
  async function se() {
    return (await F("games", "readonly", (e) => T(e.objectStore("games").getAll()))).sort((e, n) =>
      e.name.localeCompare(n.name, "pl", { numeric: !0 }),
    );
  }
  var tt = (t) => F("games", "readonly", (e) => T(e.objectStore("games").get(t))),
    re = (t) => F("games", "readwrite", (e) => T(e.objectStore("games").put(t)));
  async function pt(t, e) {
    return F("games", "readwrite", async (n) => {
      let a = n.objectStore("games"),
        o = await T(a.get(t));
      return o ? (e(o), (o.updatedAt = Date.now()), await T(a.put(o)), o) : null;
    });
  }
  async function ie(t) {
    return F(["games", "cards", "state"], "readwrite", async (e) => {
      let n = e.objectStore("cards"),
        a = await T(n.index("gameId").getAllKeys(t));
      for (let o of a) n.delete(o);
      (e.objectStore("state").delete(t), e.objectStore("games").delete(t));
    });
  }
  async function et(t) {
    return (await F("cards", "readonly", (n) => T(n.objectStore("cards").index("gameId").getAll(t)))).sort(
      (n, a) => n.order - a.order,
    );
  }
  var ce = (t) =>
      F("cards", "readwrite", (e) => {
        let n = e.objectStore("cards");
        for (let a of t) n.put(a);
      }),
    le = (t) => F("cards", "readwrite", (e) => T(e.objectStore("cards").delete(t)));
  async function Ot(t, e) {
    return F("cards", "readwrite", async (n) => {
      let a = n.objectStore("cards"),
        o = await T(a.get(t));
      return o ? (e(o), await T(a.put(o)), o) : null;
    });
  }
  async function ft(t) {
    let e = await et(t);
    await pt(t, (n) => {
      ((n.cardCount = e.length),
        (n.deckSize = e.reduce((a, o) => a + (o.copies | 0), 0)),
        // Okładka: własny obraz > wskazana karta > pierwsza karta.
        n.coverCardId && !e.some((c) => c.id === n.coverCardId) && delete n.coverCardId);
      let pick = (n.coverCardId && e.find((c) => c.id === n.coverCardId)) || e[0];
      n.cover = n.coverCustom || (pick ? pick.thumb || pick.blob : null);
    });
  }
  async function ue(t, e) {
    return F(["games", "cards", "state"], "readwrite", async (n) => {
      let a = n.objectStore("cards"),
        o = await T(a.index("gameId").getAllKeys(t.id));
      for (let s of o) a.delete(s);
      (n.objectStore("state").delete(t.id), n.objectStore("games").put(t));
      for (let s of e) a.put(s);
    });
  }
  var de = (t) => F("state", "readonly", (e) => T(e.objectStore("state").get(t))),
    pe = (t) => F("state", "readwrite", (e) => T(e.objectStore("state").put(t))),
    fe = (t) => F("state", "readwrite", (e) => T(e.objectStore("state").delete(t)));
  async function mt() {
    try {
      return navigator.storage?.persist && !(await navigator.storage.persisted())
        ? await navigator.storage.persist()
        : !!(await navigator.storage?.persisted?.());
    } catch {
      return !1;
    }
  }
  async function me() {
    try {
      let t = (await navigator.storage?.estimate?.()) || {},
        e = (await navigator.storage?.persisted?.()) ?? null;
      return { usage: t.usage ?? null, quota: t.quota ?? null, persisted: e };
    } catch {
      return { usage: null, quota: null, persisted: null };
    }
  }
  var It = (t, e = document) => e.querySelector(t);
  function d(t, e = {}, ...n) {
    let a = document.createElement(t);
    for (let [o, s] of Object.entries(e || {}))
      s == null ||
        s === !1 ||
        (o === "class"
          ? (a.className = s)
          : o === "html"
            ? (a.innerHTML = s)
            : o.startsWith("on") && typeof s == "function"
              ? a.addEventListener(o.slice(2), s)
              : o === "style" && typeof s == "object"
                ? Object.assign(a.style, s)
                : s === !0
                  ? a.setAttribute(o, "")
                  : a.setAttribute(o, s));
    for (let o of n.flat()) o == null || o === !1 || a.append(o.nodeType ? o : document.createTextNode(String(o)));
    return a;
  }
  var H = () =>
      crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
    ge = (t, e) => t.localeCompare(e, void 0, { numeric: !0, sensitivity: "base" });
  function we(t) {
    return t < 1024
      ? t + " B"
      : t < 1024 * 1024
        ? (t / 1024).toFixed(0) + " KB"
        : t < 1024 ** 3
          ? (t / 1024 / 1024).toFixed(1) + " MB"
          : (t / 1024 ** 3).toFixed(2) + " GB";
  }
  var ye = (t) =>
      String(t)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ł/g, "l")
        .replace(/Ł/g, "L")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "gra",
    mn = {
      back: ["M15 18l-6-6 6-6"],
      home: ["M3 11l9-8 9 8", "M5 9.5V21h14V9.5", "M10 21v-6h4v6"],
      undo: ["M9 14L4 9l5-5", "M4 9h10.5a5.5 5.5 0 010 11H11"],
      shuffle: ["M16 3h5v5", "M4 20L21 3", "M21 16v5h-5", "M15 15l6 6", "M4 4l5 5"],
      draw: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
      discard: [
        "M5 17V5a2 2 0 012-2h6",
        "M11 7h6a2 2 0 012 2v10a2 2 0 01-2 2h-6a2 2 0 01-2-2V9a2 2 0 012-2z",
        "M12 12.5l4 4",
        "M16 12.5l-4 4",
      ],
      list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
      edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"],
      plus: ["M12 5v14", "M5 12h14"],
      minus: ["M5 12h14"],
      rotate: ["M21 12a9 9 0 11-3-6.7", "M21 4v5h-5"],
      trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"],
      download: ["M12 3v12", "M7 10l5 5 5-5", "M5 21h14"],
      upload: ["M12 15V3", "M7 8l5-5 5 5", "M5 21h14"],
      star: ["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"],
      image: ["M3 3h18v18H3z", "M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M21 15l-5-5L5 21"],
      grid: ["M3 3h18v18H3z", "M3 9h18", "M3 15h18", "M9 3v18", "M15 3v18"],
      x: ["M18 6L6 18", "M6 6l12 12"],
      more: ["M12 5h.01", "M12 12h.01", "M12 19h.01"],
      prev: ["M15 18l-6-6 6-6"],
      next: ["M9 18l6-6-6-6"],
    };
  function cardsWord(n) {
    if (I18N_LANG === "en") return n === 1 ? "card" : "cards";
    return n === 1 ? "karta" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "karty" : "kart";
  }
  // „Talia: 24 karty”; gdy karty mają kopie, dodatkowo liczba unikalnych kart.
  function deckText(uniq, deck) {
    return deck === uniq
      ? I18N_T("Talia: {} {}", deck, cardsWord(deck))
      : I18N_T("Talia: {} {} (unikalnych: {})", deck, cardsWord(deck), uniq);
  }
  function W(t) {
    return `<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(mn[t] || []).map((n) => `<path d="${n}"/>`).join("")}</svg>`;
  }
  function G(t, e, n, a = "") {
    return d("button", { class: "icon-btn " + a, type: "button", "aria-label": e, title: e, html: W(t), onclick: n });
  }
  function D(t, e = 2600, k) {
    k =
      k ||
      (/^(Nie uda|B\u0142\u0105d|Eksport nie|Import nie|Could not|Error|Export failed|Import failed)/.test(t)
        ? "error"
        : /^(Nie znaleziono|\u017Badna|Pomini\u0119to|Koniec talii|Wykryto|Dopasowano|Game not found|No images|No PDF|No card|Skipped|End of deck|Detected|Margins were)/.test(
              t,
            )
          ? "warn"
          : /^(Dodano|Obr\xF3cono|Nowa talia|Talia przetasowana|Partia zresetowana|Cards added|Rotated|New deck|Deck reshuffled|Game reset)/.test(
                t,
              )
            ? "ok"
            : "");
    e = k === "error" ? Math.max(e, 7e3) : k === "warn" ? Math.max(e, 4500) : e;
    let n = It("#toasts"),
      a,
      x = () => {
        a.isConnected && !a.classList.contains("out") && (a.classList.add("out"), setTimeout(() => a.remove(), 300));
      };
    a = d(
      "div",
      { class: "toast" + (k ? " " + k : ""), role: k === "error" ? "alert" : "status", onclick: x },
      d("span", { class: "toast-msg" }, t),
      d("button", {
        type: "button",
        class: "toast-x",
        "aria-label": I18N_T("Zamknij komunikat"),
        onclick: (v) => {
          (v.stopPropagation(), x());
        },
        html: W("x"),
      }),
    );
    (n.append(a), setTimeout(x, e));
  }
  let DLGN = 0;
  function lbl(box, h) {
    h.id = "dlg-t" + ++DLGN;
    box.setAttribute("aria-labelledby", h.id);
    return h;
  }
  function Rt(t) {
    let e = d("dialog", { class: "dlg " + (t || "") });
    return (
      document.body.append(e),
      e.addEventListener("click", (n) => {
        n.target === e && e.close();
      }),
      e
    );
  }
  function nt({ title: t, text: e, buttons: n, sheet: a = !1 }) {
    return new Promise((o) => {
      let s = Rt(a ? "sheet" : ""),
        r = null;
      (s.append(
        lbl(s, d("h3", {}, t)),
        ...(e ? [d("p", { class: "dlg-text" }, e)] : []),
        d(
          "div",
          { class: "dlg-buttons" },
          n
            .filter((i) => !i.hidden)
            .map((i) =>
              d(
                "button",
                {
                  type: "button",
                  class: "btn " + (i.kind || ""),
                  onclick: () => {
                    ((r = i.value), s.close());
                  },
                },
                d("span", { class: "btn-label" }, i.label),
                i.sub ? d("span", { class: "btn-sub" }, i.sub) : null,
              ),
            ),
        ),
      ),
        s.addEventListener("close", () => {
          (s.remove(), o(r));
        }),
        s.showModal());
    });
  }
  async function bigOk(t) {
    return (
      (await nt({
        title: I18N_T("Duży import"),
        text: t,
        buttons: [
          { label: I18N_T("Kontynuuj"), value: !0, kind: "primary" },
          { label: I18N_T("Anuluj"), value: !1 },
        ],
      })) === !0
    );
  }
  function impAbort() {
    return Object.assign(new Error("abort"), { abort: !0 });
  }
  function be({ title: t, label: e, value: n = "", ok: a = "OK" }) {
    return new Promise((o) => {
      let s = Rt(""),
        r = null,
        i = d("input", {
          type: "text",
          class: "text-input",
          value: n,
          maxlength: 120,
          "aria-label": e,
          placeholder: e,
        }),
        c = () => {
          ((r = i.value.trim()), s.close());
        };
      (i.addEventListener("keydown", (u) => {
        u.key === "Enter" && (u.preventDefault(), c());
      }),
        s.append(
          lbl(s, d("h3", {}, t)),
          i,
          d(
            "div",
            { class: "dlg-buttons row" },
            d("button", { type: "button", class: "btn ghost", onclick: () => s.close() }, I18N_T("Anuluj")),
            d("button", { type: "button", class: "btn primary", onclick: c }, a),
          ),
        ),
        s.addEventListener("close", () => {
          (s.remove(), o(r || null));
        }),
        s.showModal(),
        i.focus(),
        i.select());
    });
  }
  function $t({ title: t, content: e, onClose: n }) {
    let a = Rt("sheet wide");
    return (
      a.append(
        d(
          "div",
          { class: "sheet-head" },
          lbl(a, d("h3", {}, t)),
          G("x", I18N_T("Zamknij"), () => a.close(), "small"),
        ),
        e,
      ),
      a.addEventListener("close", () => {
        (a.remove(), n?.());
      }),
      a.showModal(),
      { close: () => a.close() }
    );
  }
  function _(t, cx) {
    let cancelled = !1,
      cbtn = cx
        ? d(
            "button",
            {
              type: "button",
              class: "btn ghost",
              onclick: () => {
                ((cancelled = !0), (cbtn.disabled = !0), (n.textContent = I18N_T("Przerywam…")), impCancelRender());
              },
            },
            I18N_T("Anuluj"),
          )
        : null,
      e = d("div", { class: "bar-fill" }),
      n = d("div", { class: "busy-text" }, t),
      bt = d(
        "div",
        {
          class: "bar-track",
          role: "progressbar",
          "aria-label": I18N_T("Postęp"),
          "aria-valuemin": "0",
          "aria-valuemax": "100",
        },
        e,
      ),
      a = d(
        "div",
        { class: "busy", role: "status", "aria-live": "polite", "aria-busy": "true" },
        d("div", { class: "busy-box" }, d("div", { class: "spinner", "aria-hidden": "true" }), n, bt, cbtn),
      );
    return (
      document.body.append(a),
      {
        get cancelled() {
          return cancelled;
        },
        set(o, s) {
          o != null && (n.textContent = o);
          if (s != null) {
            let q = Math.round(Math.max(0, Math.min(1, s)) * 100);
            e.style.width = q + "%";
            bt.setAttribute("aria-valuenow", String(q));
          }
        },
        close() {
          a.remove();
        },
      }
    );
  }
  function ke(t, e = !0) {
    return new Promise((n) => {
      let a = d("input", { type: "file", accept: t, multiple: e, style: { display: "none" } });
      document.body.append(a);
      let o = !1,
        s = (r) => {
          o || ((o = !0), a.remove(), n(r));
        };
      (a.addEventListener("change", () => s([...a.files])), a.addEventListener("cancel", () => s([])), a.click());
    });
  }
  function Nt({ label: t, sub: e, accept: n, multiple: a = !0, kind: o = "", onFiles: s }) {
    let r = d("input", { type: "file", accept: n, multiple: a, class: "file-hidden" });
    return (
      r.addEventListener("change", () => {
        let i = [...r.files];
        ((r.value = ""), i.length && s(i));
      }),
      d(
        "label",
        { class: "btn " + o },
        r,
        d("span", { class: "btn-label" }, t),
        e ? d("span", { class: "btn-sub" }, e) : null,
      )
    );
  }
  async function Tt(t, e) {
    try {
      let o = new File([t], e, { type: t.type || "application/octet-stream" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [o] }))
        return (await navigator.share({ files: [o], title: e }), !0);
    } catch (o) {
      if (o?.name === "AbortError") return !1;
    }
    let n = URL.createObjectURL(t),
      a = d("a", { href: n, download: e });
    return (document.body.append(a), a.click(), a.remove(), setTimeout(() => URL.revokeObjectURL(n), 6e4), !0);
  }
  function xe(t, e) {
    if (e) return Math.floor(e() * t);
    let n = Math.floor(4294967296 / t) * t,
      a = new Uint32Array(1),
      o;
    do (crypto.getRandomValues(a), (o = a[0]));
    while (o >= n);
    return o % t;
  }
  function ht(t, e) {
    let n = t.slice();
    for (let a = n.length - 1; a > 0; a--) {
      let o = xe(a + 1, e);
      [n[a], n[o]] = [n[o], n[a]];
    }
    return n;
  }
  function ve(t) {
    let e = [];
    for (let n of t) for (let a = 0; a < (n.copies | 0); a++) e.push(n.id + "~" + a);
    return e;
  }
  // Przycięcie brzegu karty na ekranie gry (w % z każdej strony): ukrywa biały margines z niedokładnego cięcia.
  var EDGE_TRIM_MAX = 4,
    edgeTrimOf = (g) => (g.edgeTrim == null ? 1 : Math.max(0, Math.min(EDGE_TRIM_MAX, Math.round(+g.edgeTrim) || 0)));
  var Ft = (t) => t.slice(0, t.lastIndexOf("~"));
  function ze(t, e, n) {
    return { gameId: t, draw: ht(ve(e), n), discard: [], shown: [], dg: [], undo: [], updatedAt: Date.now() };
  }
  function Me(t, e, n) {
    Array.isArray(t.shown) || ((t.shown = t.discard.length ? [t.discard.pop()] : []), (t.undo = []));
    let a = ve(e),
      o = new Set(a),
      s = t.draw.filter((l) => o.has(l)),
      r = t.discard.filter((l) => o.has(l)),
      h0 = t.shown.filter((l) => o.has(l)),
      i = new Set([...s, ...r, ...h0]),
      c = a.filter((l) => !i.has(l)),
      u = s.length !== t.draw.length || r.length !== t.discard.length || h0.length !== t.shown.length || c.length > 0;
    for (let l of c) s.splice(xe(s.length + 1, n), 0, l);
    return (
      (t.draw = s),
      (t.discard = r),
      (t.shown = h0),
      (u || !Array.isArray(t.dg) || t.dg.reduce((x, y) => x + y, 0) !== r.length) && (t.dg = null),
      u && (t.undo = []),
      Array.isArray(t.undo) || (t.undo = []),
      u
    );
  }
  function gt(t) {
    (t.undo.push({
      draw: t.draw.slice(),
      discard: t.discard.slice(),
      shown: t.shown.slice(),
      dg: Array.isArray(t.dg) ? t.dg.slice() : null,
    }),
      t.undo.length > 40 && t.undo.shift(),
      (t.updatedAt = Date.now()));
  }
  function je(t, n = 1, ns = !1) {
    if (!t.draw.length) return !1;
    ns || gt(t);
    t.shown.length && (t.discard.push(...t.shown), Array.isArray(t.dg) && t.dg.push(t.shown.length));
    t.shown = [];
    for (let k = 0; k < n && t.draw.length; k++) t.shown.push(t.draw.pop());
    return ((t.updatedAt = Date.now()), !0);
  }
  function RS(t) {
    gt(t);
    t.discard.push(...t.shown);
    t.shown = [];
    t.draw = ht(t.discard);
    t.discard = [];
    t.dg = [];
  }
  function Ue(t) {
    let e = t.undo.pop();
    return e
      ? ((t.draw = e.draw),
        (t.discard = e.discard),
        (t.shown = e.shown || []),
        (t.dg = e.dg === void 0 ? null : e.dg),
        (t.updatedAt = Date.now()),
        !0)
      : !1;
  }
  function Se(t, e) {
    (gt(t), (t.draw = ht(t.draw.concat(t.discard, t.shown), e)), (t.discard = []), (t.shown = []), (t.dg = []));
  }
  function Be(t, e) {
    (gt(t), (t.draw = ht(t.draw, e)));
  }
  function Ae(t, e) {
    (gt(t), (t.draw = ht(t.discard, e).concat(t.draw)), (t.discard = []), (t.dg = []));
  }
  var Le = new TextEncoder(),
    hn = new TextDecoder(),
    lt;
  function gn() {
    if (lt) return lt;
    lt = new Uint32Array(256);
    for (let t = 0; t < 256; t++) {
      let e = t;
      for (let n = 0; n < 8; n++) e = e & 1 ? 3988292384 ^ (e >>> 1) : e >>> 1;
      lt[t] = e >>> 0;
    }
    return lt;
  }
  function wn(t) {
    let e = gn(),
      n = 4294967295;
    for (let a = 0; a < t.length; a++) n = e[(n ^ t[a]) & 255] ^ (n >>> 8);
    return (n ^ 4294967295) >>> 0;
  }
  function yn(t) {
    let e = (t.getHours() << 11) | (t.getMinutes() << 5) | (t.getSeconds() >> 1),
      n = (Math.max(0, t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate();
    return { time: e, date: n };
  }
  async function Ee(t) {
    if (t.length > 65534) throw new Error(I18N_T("Za dużo plików w jednym archiwum ZIP."));
    let e = [],
      n = [],
      { time: a, date: o } = yn(new Date()),
      s = 0;
    for (let c of t) {
      let u = Le.encode(c.name),
        l = typeof Blob < "u" && c.data instanceof Blob,
        f = typeof c.data == "string" ? Le.encode(c.data) : l ? new Uint8Array(await c.data.arrayBuffer()) : c.data,
        p = f.length;
      if (p > 4294967294 || s > 4294967294) throw new Error(I18N_T("Archiwum ZIP jest za duże (limit 4 GB)."));
      let m = wn(f),
        g = new DataView(new ArrayBuffer(30));
      (g.setUint32(0, 67324752, !0),
        g.setUint16(4, 20, !0),
        g.setUint16(6, 2048, !0),
        g.setUint16(8, 0, !0),
        g.setUint16(10, a, !0),
        g.setUint16(12, o, !0),
        g.setUint32(14, m, !0),
        g.setUint32(18, p, !0),
        g.setUint32(22, p, !0),
        g.setUint16(26, u.length, !0),
        g.setUint16(28, 0, !0),
        e.push(g.buffer, u, l ? c.data : f));
      let w = new DataView(new ArrayBuffer(46));
      (w.setUint32(0, 33639248, !0),
        w.setUint16(4, 20, !0),
        w.setUint16(6, 20, !0),
        w.setUint16(8, 2048, !0),
        w.setUint16(10, 0, !0),
        w.setUint16(12, a, !0),
        w.setUint16(14, o, !0),
        w.setUint32(16, m, !0),
        w.setUint32(20, p, !0),
        w.setUint32(24, p, !0),
        w.setUint16(28, u.length, !0),
        w.setUint16(30, 0, !0),
        w.setUint16(32, 0, !0),
        w.setUint16(34, 0, !0),
        w.setUint16(36, 0, !0),
        w.setUint32(38, 0, !0),
        w.setUint32(42, s, !0),
        n.push(w.buffer, u),
        (s += 30 + u.length + p));
    }
    let r = 0;
    for (let c of n) (e.push(c), (r += c.byteLength ?? c.length));
    let i = new DataView(new ArrayBuffer(22));
    return (
      i.setUint32(0, 101010256, !0),
      i.setUint16(8, t.length, !0),
      i.setUint16(10, t.length, !0),
      i.setUint32(12, r, !0),
      i.setUint32(16, s, !0),
      e.push(i.buffer),
      new Blob(e, { type: "application/zip" })
    );
  }
  // --- Odczyt ZIP z twardymi limitami (ochrona przed zip bombami i uszkodzonymi plikami) ---
  var ZIP_ENTRY_MAX = 60e6, // maks. rozmiar jednego pliku po rozpakowaniu
    ZIP_MANIFEST_MAX = 5e6; // maks. rozmiar manifest.json
  function zipErr(t) {
    return Object.assign(new Error(t), { zip: !0 });
  }
  function crcAdd(c, t) {
    let e = gn();
    for (let a = 0; a < t.length; a++) c = e[(c ^ t[a]) & 255] ^ (c >>> 8);
    return c;
  }
  async function wt(t) {
    let e = t.size;
    if (e < 22) throw zipErr(I18N_T("To nie jest poprawny plik ZIP."));
    let n = Math.min(e, 65621),
      a = new DataView(await t.slice(e - n).arrayBuffer()),
      o = -1;
    for (let m = n - 22; m >= 0; m--)
      if (a.getUint32(m, !0) === 101010256 && m + 22 + a.getUint16(m + 20, !0) <= n) {
        o = m;
        break;
      }
    if (o < 0) throw zipErr(I18N_T("To nie jest poprawny plik ZIP."));
    let eocd = e - n + o,
      s = a.getUint16(o + 10, !0),
      r = a.getUint32(o + 12, !0),
      i = a.getUint32(o + 16, !0);
    if (s === 65535 || i === 4294967295 || r === 4294967295) throw zipErr(I18N_T("Archiwa ZIP64 nie są obsługiwane."));
    // jeden dysk, spójna liczba wpisów, katalog w całości przed końcem pliku i rozsądnego rozmiaru
    if (a.getUint16(o + 4, !0) !== 0 || a.getUint16(o + 6, !0) !== 0 || a.getUint16(o + 8, !0) !== s)
      throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
    if (i + r > eocd || r > 33554432 || s * 46 > r) throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
    let c = await t.slice(i, i + r).arrayBuffer(),
      u = new DataView(c),
      l = new Uint8Array(c),
      f = [],
      p = 0,
      names = new Set(),
      spans = [];
    for (let m = 0; m < s; m++) {
      if (p + 46 > u.byteLength || u.getUint32(p, !0) !== 33639248) throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
      let fl = u.getUint16(p + 8, !0),
        g = u.getUint16(p + 10, !0),
        crc = u.getUint32(p + 16, !0),
        w = u.getUint32(p + 20, !0),
        A = u.getUint32(p + 24, !0),
        U = u.getUint16(p + 28, !0),
        R = u.getUint16(p + 30, !0),
        L = u.getUint16(p + 32, !0),
        z = u.getUint32(p + 42, !0);
      if (p + 46 + U + R + L > u.byteLength) throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
      let P = hn.decode(l.subarray(p + 46, p + 46 + U));
      p += 46 + U + R + L;
      if (names.has(P)) throw zipErr(I18N_T("Archiwum ZIP zawiera zduplikowane nazwy plików."));
      names.add(P);
      // dane wpisu muszą leżeć przed katalogiem; wpisy nie mogą na siebie zachodzić
      if (z + 30 + U + w > i) throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
      spans.push([z, z + 30 + U + w]);
      let enc = !!(fl & 65);
      f.push({
        name: P,
        size: A,
        isDir: P.endsWith("/"),
        async blob(limit = ZIP_ENTRY_MAX) {
          if (enc) throw zipErr(I18N_T("Plik „{}” w archiwum jest zaszyfrowany – to nieobsługiwane.", P));
          if (A > limit)
            throw zipErr(I18N_T("Plik „{}” w archiwum jest za duży (limit {} MB).", P, Math.round(limit / 1e6)));
          let y = new DataView(await t.slice(z, z + 30).arrayBuffer());
          if (y.getUint32(0, !0) !== 67324752 || y.getUint16(8, !0) !== g)
            throw zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
          let v = z + 30 + y.getUint16(26, !0) + y.getUint16(28, !0);
          if (v + w > i) throw zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
          let B = t.slice(v, v + w),
            bad = () => zipErr(I18N_T("Plik „{}” w archiwum jest uszkodzony (błędna suma kontrolna).", P));
          if (g === 0) {
            if (w !== A) throw zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
            if ((crcAdd(4294967295, new Uint8Array(await B.arrayBuffer())) ^ 4294967295) >>> 0 !== crc) throw bad();
            return B;
          }
          if (g === 8) {
            if (typeof DecompressionStream > "u")
              throw new Error(I18N_T("Ta przeglądarka nie potrafi rozpakować skompresowanego ZIP-a."));
            let rd = B.stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader(),
              chunks = [],
              cnt = 0,
              cc = 4294967295;
            try {
              for (;;) {
                let { value: q, done: dn } = await rd.read();
                if (dn) break;
                cnt += q.length;
                // twardy limit: deklarowany rozmiar i limit wpisu – bomba jest przerywana w trakcie
                if (cnt > A || cnt > limit) throw zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
                cc = crcAdd(cc, q);
                chunks.push(q);
              }
              if (cnt !== A) throw zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
              if ((cc ^ 4294967295) >>> 0 !== crc) throw bad();
            } catch (err) {
              try {
                await rd.cancel();
              } catch {
                /* strumień już zamknięty – ważny jest błąd źródłowy rzucany niżej */
              }
              throw err?.zip ? err : zipErr(I18N_T("Uszkodzony wpis ZIP: ") + P);
            }
            return new Blob(chunks);
          }
          throw zipErr(I18N_T("Nieobsługiwana metoda kompresji w ZIP (") + g + ").");
        },
      });
    }
    spans.sort((x, y) => x[0] - y[0]);
    for (let m = 1; m < spans.length; m++)
      if (spans[m][0] < spans[m - 1][1]) throw zipErr(I18N_T("Uszkodzony katalog ZIP."));
    return f;
  }
  var bn = {
      webp: "image/webp",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      avif: "image/avif",
    },
    Ce = (t) => (String(t).split(".").pop() || "").toLowerCase(),
    at = (t) => bn[Ce(t)] || "",
    Gt = (t) => !!at(t),
    yt = (t) =>
      String(t)
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, "");
  function bt(t, e = 0.92) {
    return new Promise((n, a) => {
      t.toBlob(
        (o) => {
          if (o && o.type === "image/webp") return n(o);
          t.toBlob((s) => (s ? n(s) : a(new Error(I18N_T("Nie udało się zakodować obrazu.")))), "image/jpeg", e);
        },
        "image/webp",
        e,
      );
    });
  }
  async function kt(t) {
    if (t.size > 6e7) throw new Error(I18N_T("Plik graficzny jest zbyt duży (limit 60 MB)."));
    let b = await ktRaw(t),
      bw = b.naturalWidth || b.width,
      bh = b.naturalHeight || b.height;
    if (bw * bh > 12e7) {
      b.close?.();
      throw new Error(I18N_T("Obraz jest zbyt duży ({} Mpx).", Math.round((bw * bh) / 1e6)));
    }
    return b;
  }
  async function ktRaw(t) {
    try {
      return await createImageBitmap(t);
    } catch {
      let e = URL.createObjectURL(t);
      try {
        let n = new Image();
        return ((n.src = e), await n.decode(), n);
      } finally {
        URL.revokeObjectURL(e);
      }
    }
  }
  var Zt = (t) => [t.naturalWidth || t.width, t.naturalHeight || t.height];
  function De(t, e) {
    let [n, a] = Zt(t),
      o = Math.min(1, e / Math.max(n, a)),
      s = document.createElement("canvas");
    ((s.width = Math.max(1, Math.round(n * o))), (s.height = Math.max(1, Math.round(a * o))));
    let r = s.getContext("2d");
    return (
      (r.fillStyle = "#fff"),
      r.fillRect(0, 0, s.width, s.height),
      (r.imageSmoothingQuality = "high"),
      r.drawImage(t, 0, 0, s.width, s.height),
      s
    );
  }
  async function xt(t) {
    return bt(De(t, 360), 0.8);
  }
  async function Pe(t, e) {
    let n = await kt(t);
    try {
      let [a, o] = Zt(n),
        s =
          ["image/png", "image/jpeg", "image/webp"].includes(t.type) &&
          Math.max(a, o) <= 2600 &&
          t.size <= 3 * 1024 * 1024,
        r = t,
        i = a,
        c = o;
      if (!s) {
        let u = De(n, 2600);
        ((r = await bt(u, 0.92)), (i = u.width), (c = u.height));
      }
      return { name: e ?? yt(t.name || "karta"), blob: r, thumb: await xt(n), w: i, h: c };
    } finally {
      n.close?.();
    }
  }
  // Obrót obrazu o 90° w prawo (do okładki); zwraca nowy JPEG.
  async function rotateBlob90(blob) {
    let img = await kt(blob);
    try {
      let [w, h] = Zt(img),
        cv = document.createElement("canvas");
      ((cv.width = h), (cv.height = w));
      let cx = cv.getContext("2d");
      (cx.translate(h / 2, w / 2), cx.rotate(Math.PI / 2), cx.drawImage(img, -w / 2, -h / 2));
      return await bt(cv, 0.85);
    } finally {
      img.close?.();
    }
  }
  async function Oe(t) {
    let e = await kt(t);
    try {
      let [n, a] = Zt(e);
      return { thumb: await xt(e), w: n, h: a };
    } finally {
      e.close?.();
    }
  }
  var Ie = "automa-deck-backup",
    Re = 1,
    kn = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif" };
  var coverIdx = (g, cards) => (g.coverCardId ? cards.findIndex((c) => c.id === g.coverCardId) : -1),
    coverPath = (g, files) => {
      let path = `covers/${g.id}.${kn[g.coverCustom.type] || "img"}`;
      return (files.push({ name: path, data: g.coverCustom }), path);
    };
  async function Wt(t, e) {
    let n = [],
      a = [],
      o = 0,
      s = 0,
      r = [];
    for (let c of t) {
      let u = await tt(c);
      if (!u) continue;
      let l = await et(c);
      ((o += l.length), r.push({ g: u, cards: l }));
    }
    for (let { g: c, cards: u } of r) {
      let l = [];
      (u.forEach((f, p) => {
        let m = `cards/${c.id}/${String(p + 1).padStart(3, "0")}.${kn[f.blob.type] || "img"}`;
        (n.push({ name: m, data: f.blob }),
          l.push({ id: f.id, name: f.name, copies: f.copies, file: m, w: f.w, h: f.h }),
          e?.(++s / Math.max(1, o)));
      }),
        a.push({
          id: c.id,
          name: c.name,
          notes: c.notes || "",
          drawCount: c.drawCount || 1,
          edgeTrim: edgeTrimOf(c),
          orientation: c.orientation || "auto",
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          cards: l,
          ...(coverIdx(c, u) >= 0 ? { coverCard: coverIdx(c, u) } : {}),
          ...(c.coverCustom ? { coverFile: coverPath(c, n) } : {}),
        }));
    }
    let i = { format: Ie, version: Re, app: "DeckEngine", exportedAt: new Date().toISOString(), games: a };
    return (n.unshift({ name: "manifest.json", data: JSON.stringify(i, null, 2) }), Ee(n));
  }
  async function $e(t, { onConflict: e, onProgress: n } = {}) {
    let a = await wt(t),
      o = a.find((l) => l.name === "manifest.json");
    if (!o)
      throw new Error(I18N_T("W archiwum nie ma pliku manifest.json – to nie jest kopia zapasowa z tej aplikacji."));
    let s;
    try {
      s = JSON.parse(await (await o.blob(ZIP_MANIFEST_MAX)).text());
    } catch {
      throw new Error(I18N_T("Plik manifest.json jest uszkodzony."));
    }
    if (s?.format !== Ie || !Array.isArray(s.games)) throw new Error(I18N_T("Nieznany format kopii zapasowej."));
    if (!(s.version <= Re))
      throw new Error(I18N_T("Kopia pochodzi z nowszej wersji aplikacji (format ") + s.version + ").");
    // Walidacja z limitami – uszkodzony lub złośliwy manifest nie może wyczerpać pamięci.
    if (s.games.length > 200) throw new Error(I18N_T("Kopia zawiera zbyt wiele gier (limit {}).", 200));
    {
      let totCards = 0;
      for (let gm of s.games) {
        if (!gm || typeof gm != "object" || !Array.isArray(gm.cards)) continue;
        if (gm.cards.length > 3000) throw new Error(I18N_T("Gra w kopii ma zbyt wiele kart (limit {}).", 3000));
        totCards += gm.cards.length;
      }
      if (totCards > 20000) throw new Error(I18N_T("Kopia zawiera zbyt wiele kart (limit {}).", 20000));
    }
    let totBytes = 0;
    let r = new Map(a.map((l) => [l.name, l])),
      i = { added: 0, replaced: 0, copied: 0, skipped: 0, failed: 0, cards: 0 },
      firstErr = null,
      c = s.games.reduce((l, f) => l + (f.cards?.length || 0), 0),
      u = 0;
    for (let l of s.games) {
      if (typeof l?.id != "string" || l.id.length > 100 || !Array.isArray(l.cards)) continue;
      // Każda gra jest importowana osobno: błąd jednej nie przerywa pozostałych, a wynik jest zliczany.
      try {
        let f = l.id,
          p = "new",
          m = await tt(l.id);
        if (m) {
          let U = e ? await e(m, l) : "copy";
          if (U === "skip" || U == null) {
            (i.skipped++, (u += l.cards.length));
            continue;
          }
          ((p = U === "replace" ? "replace" : "copy"), p === "copy" && (f = H()));
        }
        let g = [],
          w = 0,
          ci = -1,
          idByIdx = new Map();
        for (let U of l.cards) {
          ci++;
          n?.(u++ / Math.max(1, c));
          let R = typeof U?.file == "string" ? r.get(U.file) : null;
          if (!R) continue;
          let L = at(U.file);
          if (!L) continue;
          let z = new Blob([await R.blob()], { type: L });
          if ((totBytes += z.size) > 1e9) {
            let big = new Error(I18N_T("Kopia jest zbyt duża po rozpakowaniu (limit {} GB).", 1));
            throw ((big.fatal = !0), big);
          }
          let { thumb: P, w: y, h: v } = await Oe(z);
          g.push({
            id: H(), // zawsze nowe ID – identyfikatory z kopii nie mogą nadpisać kart innych gier
            gameId: f,
            order: w++,
            name: String(U.name ?? "").slice(0, 120),
            copies: Math.max(0, Math.min(99, Number.isFinite(+U.copies) ? Math.round(+U.copies) : 1)),
            blob: z,
            thumb: P,
            w: y,
            h: v,
          });
          idByIdx.set(ci, g[g.length - 1].id);
        }
        // Okładka z kopii: wskazana karta (po indeksie, bo ID kart są nadawane od nowa) i/lub własny obraz.
        let coverCardNew = Number.isInteger(l.coverCard) ? idByIdx.get(l.coverCard) : void 0,
          coverCustomNew = null;
        if (typeof l.coverFile == "string" && r.get(l.coverFile) && at(l.coverFile)) {
          try {
            let cb = new Blob([await r.get(l.coverFile).blob()], { type: at(l.coverFile) });
            if ((totBytes += cb.size) <= 1e9) coverCustomNew = (await Oe(cb)).thumb;
          } catch (err) {
            console.error(err);
          }
        }
        let A = Date.now();
        (await ue(
          {
            id: f,
            name: String(l.name || "Gra").slice(0, 120) + (p === "copy" ? I18N_T(" (kopia)") : ""),
            notes: String(l.notes || "").slice(0, 20000),
            drawCount: Math.max(1, Math.min(6, Math.round(+l.drawCount) || 1)),
            edgeTrim: edgeTrimOf(l),
            orientation: ["portrait", "landscape"].includes(l.orientation) ? l.orientation : "auto",
            createdAt: Number.isFinite(+l.createdAt) && +l.createdAt > 0 ? +l.createdAt : A,
            updatedAt: A,
            cover: coverCustomNew || (g.find((x) => x.id === coverCardNew) || g[0])?.thumb || null,
            ...(coverCardNew ? { coverCardId: coverCardNew } : {}),
            ...(coverCustomNew ? { coverCustom: coverCustomNew } : {}),
            cardCount: g.length,
            deckSize: g.reduce((U, R) => U + R.copies, 0),
          },
          g,
        ),
          (i.cards += g.length),
          p === "new" ? i.added++ : p === "replace" ? i.replaced++ : i.copied++);
      } catch (err) {
        if (err?.fatal) throw err;
        console.error(err);
        i.failed++;
        firstErr ||= err;
      }
    }
    if (i.failed && !(i.added + i.replaced + i.copied)) throw firstErr;
    return (n?.(1), i);
  }
  var st = Object.freeze({ cols: 3, rows: 3, mL: 5, mT: 5, mR: 5, mB: 5, gx: 2, gy: 2, inset: 0 });
  function _t(t, e, n) {
    let a = (t.mL / 100) * e,
      o = (t.mT / 100) * n,
      s = e - (t.mR / 100) * e,
      r = n - (t.mB / 100) * n,
      i = (t.gx / 100) * e,
      c = (t.gy / 100) * n,
      u = (s - a - i * (t.cols - 1)) / t.cols,
      l = (r - o - c * (t.rows - 1)) / t.rows,
      f = [];
    if (!(u > 2 && l > 2)) return f;
    let p = (t.inset / 100) * u,
      m = (t.inset / 100) * l;
    for (let g = 0; g < t.rows; g++)
      for (let w = 0; w < t.cols; w++)
        f.push({ r: g, c: w, x: a + w * (u + i) + p, y: o + g * (l + c) + m, w: u - 2 * p, h: l - 2 * m });
    return f;
  }
  function Vt(t, e, n) {
    let a = Math.max(2, Math.round(Math.min(e, n) * 0.015)),
      o = new Uint32Array(32),
      s = new Float64Array(32),
      r = (c) => {
        (o[c >> 3]++, (s[c >> 3] += c));
      };
    for (let c = 0; c < n; c++)
      if (c < a || c >= n - a) for (let u = 0; u < e; u++) r(t[c * e + u]);
      else {
        for (let u = 0; u < a; u++) r(t[c * e + u]);
        for (let u = e - a; u < e; u++) r(t[c * e + u]);
      }
    let i = 0;
    for (let c = 1; c < 32; c++) o[c] > o[i] && (i = c);
    return s[i] / Math.max(1, o[i]);
  }
  function qt(t, e, n, a = 24, o = Vt(t, e, n)) {
    let s = new Uint8Array(e * n);
    for (let r = 0; r < s.length; r++) s[r] = Math.abs(t[r] - o) > a ? 1 : 0;
    return s;
  }
  function Ke(t, e, n) {
    let a = new Uint8Array(t.length);
    for (let s = 0; s < n; s++) {
      let r = s * e;
      for (let i = 0; i < e; i++) a[r + i] = t[r + i] | (i > 0 ? t[r + i - 1] : 0) | (i < e - 1 ? t[r + i + 1] : 0);
    }
    let o = new Uint8Array(t.length);
    for (let s = 0; s < n; s++)
      for (let r = 0; r < e; r++) {
        let i = s * e + r;
        o[i] = a[i] | (s > 0 ? a[i - e] : 0) | (s < n - 1 ? a[i + e] : 0);
      }
    return o;
  }
  function _e(t, e, n) {
    let a = new Uint8Array(e * n),
      o = new Int32Array(e * n),
      s = [];
    for (let r = 0; r < t.length; r++) {
      if (!t[r] || a[r]) continue;
      let i = 0;
      ((o[i++] = r), (a[r] = 1));
      let c = e,
        u = n,
        l = 0,
        f = 0,
        p = 0;
      for (; i; ) {
        let m = o[--i],
          g = m % e,
          w = (m - g) / e;
        (p++,
          g < c && (c = g),
          g > l && (l = g),
          w < u && (u = w),
          w > f && (f = w),
          g > 0 && t[m - 1] && !a[m - 1] && ((a[m - 1] = 1), (o[i++] = m - 1)),
          g < e - 1 && t[m + 1] && !a[m + 1] && ((a[m + 1] = 1), (o[i++] = m + 1)),
          w > 0 && t[m - e] && !a[m - e] && ((a[m - e] = 1), (o[i++] = m - e)),
          w < n - 1 && t[m + e] && !a[m + e] && ((a[m + e] = 1), (o[i++] = m + e)));
      }
      s.push({ x0: c, y0: u, x1: l + 1, y1: f + 1, area: p });
    }
    return s;
  }
  var ot = (t) => Math.round(t * 10) / 10,
    X = (t) => t.reduce((e, n) => e + n, 0) / (t.length || 1);
  function Ne(t, e) {
    let n = t.slice().sort((o, s) => o - s),
      a = [];
    for (let o of n) {
      let s = a[a.length - 1];
      s && o - X(s) < e ? s.push(o) : a.push([o]);
    }
    return a.map(X);
  }
  function ut({ cols: t, rows: e, x0: n, y0: a, cw: o, ch: s, gx: r, gy: i }, c, u) {
    let l = t * o + (t - 1) * r,
      f = e * s + (e - 1) * i;
    return {
      cols: t,
      rows: e,
      mL: ot((n / c) * 100),
      mR: ot(((c - n - l) / c) * 100),
      mT: ot((a / u) * 100),
      mB: ot(((u - a - f) / u) * 100),
      gx: ot((r / c) * 100),
      gy: ot((i / u) * 100),
      inset: 0,
    };
  }
  function xn(t, e, n) {
    let a = _e(Ke(t, e, n), e, n),
      o = e * 0.07,
      s = n * 0.07,
      r = a
        .map((w) => ({ x0: w.x0 + 1, y0: w.y0 + 1, x1: w.x1 - 1, y1: w.y1 - 1 }))
        .map((w) => ({ ...w, bw: w.x1 - w.x0, bh: w.y1 - w.y0 }))
        .filter((w) => w.bw >= o && w.bh >= s);
    if (r.length < 2 || r.length > 400) return null;
    let i = [];
    for (let w of r) {
      let A = i.find((U) => Math.abs(w.bw - U.bw) <= 0.05 * U.bw && Math.abs(w.bh - U.bh) <= 0.05 * U.bh);
      A ? A.items.push(w) : i.push({ bw: w.bw, bh: w.bh, items: [w] });
    }
    i.sort((w, A) => A.items.length - w.items.length || A.bw * A.bh - w.bw * w.bh);
    let c = i[0];
    if (c.items.length < 2) return null;
    let u = X(c.items.map((w) => w.bw)),
      l = X(c.items.map((w) => w.bh)),
      f = Ne(
        c.items.map((w) => w.x0),
        0.35 * u,
      ),
      p = Ne(
        c.items.map((w) => w.y0),
        0.35 * l,
      );
    if (f.length > 10 || p.length > 10) return null;
    let m = f.length > 1 ? Math.max(0, (f[f.length - 1] - f[0]) / (f.length - 1) - u) : 0,
      g = p.length > 1 ? Math.max(0, (p[p.length - 1] - p[0]) / (p.length - 1) - l) : 0;
    return {
      method: "plamy",
      params: ut({ cols: f.length, rows: p.length, x0: f[0], y0: p[0], cw: u, ch: l, gx: m, gy: g }, e, n),
    };
  }
  function vt(t, e, n, a) {
    let o = [],
      s = -1;
    for (let i = 0; i <= t.length; i++) {
      let c = i < t.length && t[i] > e;
      c && s < 0 ? (s = i) : !c && s >= 0 && (o.push({ s, e: i }), (s = -1));
    }
    let r = [];
    for (let i of o) {
      let c = r[r.length - 1];
      c && i.s - c.e < a ? (c.e = i.e) : r.push({ ...i });
    }
    return r.filter((i) => i.e - i.s >= n);
  }
  function Ve(t, e, n, a = 0, o = e) {
    let s = new Float32Array(n);
    for (let r = 0; r < n; r++) {
      let i = 0;
      for (let c = a; c < o; c++) i += t[r * e + c];
      s[r] = i / Math.max(1, o - a);
    }
    return s;
  }
  function qe(t, e, n, a = 0, o = n) {
    let s = new Float32Array(e);
    for (let r = a; r < o; r++) for (let i = 0; i < e; i++) s[i] += t[r * e + i];
    for (let r = 0; r < e; r++) s[r] /= Math.max(1, o - a);
    return s;
  }
  function vn(t, e, n, a = 0.0015, o = 0.07) {
    let s = Math.max(2, Math.round(n * 0.008)),
      r = Math.max(2, Math.round(e * 0.008)),
      i = vt(Ve(t, e, n), a, Math.round(n * o), s);
    if (!i.length) return null;
    let c = new Float32Array(e),
      u = 0;
    for (let z of i) {
      let P = qe(t, e, n, z.s, z.e);
      for (let y = 0; y < e; y++) c[y] += P[y] * (z.e - z.s);
      u += z.e - z.s;
    }
    for (let z = 0; z < e; z++) c[z] /= u;
    let l = vt(c, a, Math.round(e * o), r);
    if (!l.length) return null;
    let f = new Float32Array(n),
      p = 0;
    for (let z of l) p += z.e - z.s;
    for (let z = 0; z < n; z++) {
      let P = 0;
      for (let y of l) for (let v = y.s; v < y.e; v++) P += t[z * e + v];
      f[z] = P / p;
    }
    let m = vt(f, a, Math.round(n * o), s),
      g = m.length ? m : i;
    if (g.length > 10 || l.length > 10) return null;
    let w = (z) => {
      let P = X(z.map((y) => y.e - y.s));
      return z.every((y) => Math.abs(y.e - y.s - P) <= 0.2 * P);
    };
    if (!w(l) || !w(g)) return null;
    let A = X(l.map((z) => z.e - z.s)),
      U = X(g.map((z) => z.e - z.s)),
      R = l.length > 1 ? (l[l.length - 1].s - l[0].s) / (l.length - 1) - A : 0,
      L = g.length > 1 ? (g[g.length - 1].s - g[0].s) / (g.length - 1) - U : 0;
    return {
      method: "przerwy",
      params: ut(
        {
          cols: l.length,
          rows: g.length,
          x0: l[0].s,
          y0: g[0].s,
          cw: A,
          ch: U,
          gx: Math.max(0, R),
          gy: Math.max(0, L),
        },
        e,
        n,
      ),
    };
  }
  function Te(t, e) {
    let n = vt(t, 0.004, 1, Math.max(2, Math.round(e * 0.005)));
    if (((n = n.filter((r) => r.e - r.s >= e * 0.03)), !n.length)) return null;
    let a = [];
    for (let r of n) {
      let i = a[a.length - 1];
      i && r.s - i.e < e * 0.08 ? (i.e = r.e) : a.push({ ...r });
    }
    let o = a[0],
      s = -1;
    for (let r of a) {
      let i = 0;
      for (let c = r.s; c < r.e; c++) i += t[c];
      i > s && ((s = i), (o = r));
    }
    return o;
  }
  function Ht(t, e, n) {
    let a = Te(Ve(t, e, n), n);
    if (!a) return null;
    let o = Te(qe(t, e, n, a.s, a.e), e);
    return o ? { x0: o.s, x1: o.e, y0: a.s, y1: a.e } : null;
  }
  function Fe(t) {
    let e = t.length,
      n = 0,
      a = 0,
      o = 0,
      s = 0;
    t.forEach((u, l) => {
      ((n += l), (a += u), (o += l * l), (s += l * u));
    });
    let r = e * o - n * n,
      i = r ? (e * s - n * a) / r : 0;
    return { a: (a - i * n) / e, pitch: i };
  }
  function zn(t, e, n, a, o) {
    let s = (l) => Math.abs(t[l] - o) > 110,
      r = a.x1 - a.x0,
      i = a.y1 - a.y0,
      c = new Float32Array(e),
      u = new Float32Array(n);
    for (let l = a.x0; l < a.x1; l++) {
      let f = 0,
        p = 0,
        m = 0;
      for (let g = a.y0; g < a.y1; g++)
        s(g * e + l) ? ((f += 1 + (f > 0 ? p : 0)), (p = 0), f > m && (m = f)) : ++p > 2 && (f = 0);
      c[l] = m / i;
    }
    for (let l = a.y0; l < a.y1; l++) {
      let f = 0,
        p = 0,
        m = 0;
      for (let g = a.x0; g < a.x1; g++)
        s(l * e + g) ? ((f += 1 + (f > 0 ? p : 0)), (p = 0), f > m && (m = f)) : ++p > 2 && (f = 0);
      u[l] = m / r;
    }
    return { col: c, row: u };
  }
  function Ge(t, e, n, a) {
    let o = [],
      s = -1,
      r = -1,
      i = () => {
        if (s < 0) return;
        let c = 0,
          u = 0;
        for (let l = s; l <= r; l++) ((c += t[l]), (u += t[l] * l));
        (o.push({ c: u / c + 0.5, strength: c }), (s = -1));
      };
    for (let c = e; c < n; c++) t[c] >= a ? (s < 0 && (s = c), (r = c)) : s >= 0 && c - r > 1 && i();
    return (i(), o);
  }
  function Ze(t, e, n, a) {
    let o = n - e,
      s = null;
    for (let r = 2; r <= 8; r++) {
      let i = o / r;
      if (i < 0.07 * a) break;
      let c = Math.max(2, 0.08 * i),
        u = 1 / 0,
        l = !0;
      for (let f = 1; f < r; f++) {
        let p = e + f * i,
          m = null;
        for (let g of t) Math.abs(g.c - p) <= c && (!m || g.strength > m.strength) && (m = g);
        if (!m) {
          l = !1;
          break;
        }
        m.strength < u && (u = m.strength);
      }
      l &&
        (!s || u > s.minStr * 1.15 || (u >= s.minStr * 0.87 && r > s.n && u >= s.minStr)) &&
        (s = { n: r, minStr: u });
    }
    return s ? s.n : 1;
  }
  function Mn(t, e, n, a) {
    if (!a) return null;
    let o = Vt(t, e, n),
      { col: s, row: r } = zn(t, e, n, a, o),
      i = Ge(s, a.x0, a.x1, 0.4),
      c = Ge(r, a.y0, a.y1, 0.4),
      u = Ze(i, a.x0, a.x1, e),
      l = Ze(c, a.y0, a.y1, n);
    if (u * l < 2) return null;
    let f = (a.x1 - a.x0) / u,
      p = (a.y1 - a.y0) / l,
      m = f / p;
    return m < 0.35 || m > 2.2
      ? null
      : { method: "ramki", params: ut({ cols: u, rows: l, x0: a.x0, y0: a.y0, cw: f, ch: p, gx: 0, gy: 0 }, e, n) };
  }
  function He(t, e, n, a, o) {
    let s = Ht(t, e, n) || { x0: 0, y0: 0, x1: e, y1: n };
    return {
      method: "obrys",
      params: ut(
        { cols: a, rows: o, x0: s.x0, y0: s.y0, cw: (s.x1 - s.x0) / a, ch: (s.y1 - s.y0) / o, gx: 0, gy: 0 },
        e,
        n,
      ),
    };
  }
  function Kt(t, e, n, a, o = 0.35) {
    let s = (n - e) / a,
      r = [e];
    for (let i = 1; i < a; i++) {
      let c = e + i * s,
        u = Math.max(2, Math.round(s * o)),
        l = Math.round(c),
        f = -1;
      for (let p = Math.max(1, Math.round(c) - u); p <= Math.min(t.length - 2, Math.round(c) + u); p++)
        t[p] > f && ((f = t[p]), (l = p));
      r.push(l);
    }
    return (r.push(n), r);
  }
  function Xe(t, e, n, a) {
    let o = Ht(e, n, a) || { x0: 0, y0: 0, x1: n, y1: a },
      s = { s: o.y0, e: o.y1 },
      r = { s: o.x0, e: o.x1 },
      i = new Float32Array(n),
      c = new Float32Array(a);
    for (let u = 1; u < n - 1; u++) {
      let l = 0;
      for (let f = s.s; f < s.e; f++) l += Math.abs(t[f * n + u + 1] - t[f * n + u - 1]);
      i[u] = l / (s.e - s.s);
    }
    for (let u = 1; u < a - 1; u++) {
      let l = 0;
      for (let f = r.s; f < r.e; f++) l += Math.abs(t[(u + 1) * n + f] - t[(u - 1) * n + f]);
      c[u] = l / (r.e - r.s);
    }
    return { rBand: s, cBand: r, ex: i, ey: c };
  }
  function jn(t, e, n, a, o, s) {
    let { rBand: r, cBand: i, ex: c, ey: u } = Xe(t, e, n, a),
      l = Kt(c, i.s, i.e, o),
      f = Kt(u, r.s, r.e, s),
      p = Fe(l),
      m = Fe(f);
    return {
      method: I18N_T("krawędzie"),
      params: ut({ cols: o, rows: s, x0: p.a, y0: m.a, cw: p.pitch, ch: m.pitch, gx: 0, gy: 0 }, n, a),
    };
  }
  function We(t, e, n) {
    let a = 0;
    for (let s = e; s < n; s++) t[s] > a && (a = t[s]);
    if (a <= 0) return 1;
    let o = 1;
    for (let s = 2; s <= 8; s++) {
      let r = Kt(t, e, n, s, 0.08),
        i = !0;
      for (let c = 1; c < s; c++)
        if (t[r[c]] < 0.3 * a) {
          i = !1;
          break;
        }
      i && (o = s);
    }
    return o;
  }
  function Un(t, e, n, a) {
    let { rBand: o, cBand: s, ex: r, ey: i } = Xe(t, e, n, a);
    return { cols: We(r, s.s, s.e), rows: We(i, o.s, o.e) };
  }
  function detectCutBounds(data, w, h) {
    function axis(vertical) {
      const size = vertical ? w : h,
        span = vertical ? h : w,
        scores = new Float32Array(size);
      const lo = Math.floor(span * 0.035),
        hi = Math.ceil(span * 0.965);
      for (let p = 0; p < size; p++) {
        let run = 0,
          gap = 0,
          best = 0,
          total = 0;
        for (let q = lo; q < hi; q++) {
          let v = data[vertical ? q * w + p : p * w + q];
          if (v < 115) {
            total++;
            run += 1 + gap;
            gap = 0;
            best = Math.max(best, run);
          } else if (run && ++gap > 1) {
            run = 0;
            gap = 0;
          }
        }
        scores[p] = best / (hi - lo) > 0.48 ? total / (hi - lo) : 0;
      }
      let peaks = [];
      for (let p = 0; p < size; ) {
        if (scores[p] < 0.48) {
          p++;
          continue;
        }
        let a = p,
          weight = 0,
          sum = 0;
        while (p < size && scores[p] >= 0.48) {
          weight += scores[p];
          sum += p * scores[p];
          p++;
        }
        if (p - a <= Math.max(4, size * 0.012)) peaks.push({ p: sum / weight, s: weight / (p - a) });
      }
      const left = peaks.filter((v) => v.p >= size * 0.008 && v.p < size * 0.24),
        right = peaks.filter((v) => v.p > size * 0.76 && v.p < size * 0.992);
      let best = null;
      for (let a of left)
        for (let b of right) {
          let width = b.p - a.p;
          if (width < size * 0.55) continue;
          let inside = peaks.filter((v) => v.p > a.p + size * 0.02 && v.p < b.p - size * 0.02),
            regular = 0;
          for (let count = 2; count <= 10; count++) {
            let hits = 0;
            for (let k = 1; k < count; k++)
              if (inside.some((v) => Math.abs(v.p - (a.p + (k * width) / count)) < Math.max(3, size * 0.008))) hits++;
            if (hits === count - 1) regular = Math.max(regular, hits);
          }
          let score = a.s + b.s + Math.min(regular, 4) * 0.15;
          if (!best || score > best.score) best = { a: a.p, b: b.p, score };
        }
      return best;
    }
    const x = axis(true),
      y = axis(false);
    if (!x || !y) return null;
    return {
      mL: ot((x.a / w) * 100),
      mR: ot(((w - x.b) / w) * 100),
      mT: ot((y.a / h) * 100),
      mB: ot(((h - y.b) / h) * 100),
    };
  }
  function detectMargins(data, w, h) {
    // 1) "gruba" zawartość: piksel liczy się, gdy leży w plamie niebiałej szerokiej ORAZ wysokiej na >=T px.
    //    Cienkie linie cięcia (1-3 px), także przedłużone w marginesy, odpadają.
    const WHITE = 225,
      T = Math.max(5, Math.round(Math.min(w, h) * 0.011)),
      n = w * h;
    const hr = new Uint16Array(n),
      vr = new Uint16Array(n);
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        if (data[y * w + x] >= WHITE) {
          x++;
          continue;
        }
        let s = x;
        while (x < w && data[y * w + x] < WHITE) x++;
        for (let k = s; k < x; k++) hr[y * w + k] = x - s;
      }
    }
    for (let x = 0; x < w; x++) {
      let y = 0;
      while (y < h) {
        if (data[y * w + x] >= WHITE) {
          y++;
          continue;
        }
        let s = y;
        while (y < h && data[y * w + x] < WHITE) y++;
        for (let k = s; k < y; k++) vr[k * w + x] = y - s;
      }
    }
    const rowC = new Uint32Array(h),
      colC = new Uint32Array(w);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (hr[y * w + x] >= T && vr[y * w + x] >= T) {
          rowC[y]++;
          colC[x]++;
        }
    const need = Math.max(T, Math.round(Math.min(w, h) * 0.03));
    const first = (a, m) => {
      for (let i = 0; i < a.length; i++) if (a[i] >= m) return i;
      return -1;
    };
    const last = (a, m) => {
      for (let i = a.length - 1; i >= 0; i--) if (a[i] >= m) return i;
      return -1;
    };
    let x0 = first(colC, need),
      x1 = last(colC, need) + 1,
      y0 = first(rowC, need),
      y1 = last(rowC, need) + 1;
    if (x0 < 0 || y0 < 0 || x1 - x0 < w * 0.25 || y1 - y0 < h * 0.25) return null;
    // 2) znaczniki cięcia w marginesach (cienkie linie poza zawartością) = dokładne linie siatki
    function marks(len, from, to, strips, cnt) {
      // strips: [[a,b],...] zakres poprzeczny; cnt(pos,a,b)=ilość ciemnych px
      let total = 0;
      for (const [a, b] of strips) total += Math.max(0, b - a);
      if (total < 6) return [];
      const sc = new Float32Array(len);
      for (let p = from; p < to; p++) {
        let c = 0;
        for (const [a, b] of strips) if (b > a) c += cnt(p, a, b);
        sc[p] = c / total;
      }
      const out = [];
      for (let p = from; p < to; ) {
        if (sc[p] < 0.3) {
          p++;
          continue;
        }
        let a = p,
          sum = 0,
          wt = 0;
        while (p < to && sc[p] >= 0.3) {
          sum += p * sc[p];
          wt += sc[p];
          p++;
        }
        if (p - a <= Math.max(4, len * 0.012)) out.push(sum / wt + 0.5);
      }
      return out;
    }
    const DARK = 190;
    const cntV = (x, a, b) => {
      let c = 0;
      for (let y = a; y < b; y++) if (data[y * w + x] < DARK) c++;
      return c;
    };
    const cntH = (y, a, b) => {
      let c = 0;
      for (let x = a; x < b; x++) if (data[y * w + x] < DARK) c++;
      return c;
    };
    const margin = 2;
    const mx = marks(
      w,
      Math.round(w * 0.01),
      Math.round(w * 0.99),
      [
        [0, y0 - margin],
        [y1 + margin, h],
      ],
      cntV,
    );
    const my = marks(
      h,
      Math.round(h * 0.01),
      Math.round(h * 0.99),
      [
        [0, x0 - margin],
        [x1 + margin, w],
      ],
      cntH,
    );
    // czy znaczniki tworzą regularną siatkę?
    function regular(m) {
      if (m.length < 2 || m.length > 11) return false;
      const d = [];
      for (let i = 1; i < m.length; i++) d.push(m[i] - m[i - 1]);
      const avg = d.reduce((a, b) => a + b, 0) / d.length;
      return d.every((v) => Math.abs(v - avg) <= Math.max(3, avg * 0.08));
    }
    let L = x0,
      R = x1,
      Tp = y0,
      B = y1,
      cols = 0,
      rows = 0;
    const okx = regular(mx),
      oky = regular(my);
    if (okx) {
      L = mx[0];
      R = mx[mx.length - 1];
      cols = mx.length - 1;
    }
    if (oky) {
      Tp = my[0];
      B = my[my.length - 1];
      rows = my.length - 1;
    }
    return {
      mL: ot((L / w) * 100),
      mR: ot(((w - R) / w) * 100),
      mT: ot((Tp / h) * 100),
      mB: ot(((h - B) / h) * 100),
      cols,
      rows,
      marksX: okx,
      marksY: oky,
    };
  }
  function zt(t, e, n, a = {}) {
    const m = detectMargins(t, e, n),
      hint = a.hint,
      bounds = m && { mL: m.mL, mR: m.mR, mT: m.mT, mB: m.mB };
    // znaczniki cięcia dają pełną siatkę (kolumny, wiersze, brak odstępów)
    if (m && m.cols * m.rows > 1 && (!hint || (hint.cols === m.cols && hint.rows === m.rows)))
      return {
        method: I18N_T("znaczniki cięcia"),
        params: { ...st, ...bounds, cols: m.cols, rows: m.rows, gx: 0, gy: 0 },
      };
    let result = legacyGridDetection(t, e, n, a);
    if (bounds && result)
      return { ...result, params: { ...result.params, ...bounds }, method: result.method + I18N_T(" + marginesy") };
    if (bounds) {
      let h2 = hint || { cols: st.cols, rows: st.rows };
      return { method: I18N_T("marginesy; siatka do sprawdzenia"), params: { ...st, ...h2, ...bounds, gx: 0, gy: 0 } };
    }
    return result;
  }
  function legacyGridDetection(t, e, n, a = {}) {
    let o = qt(t, e, n),
      s = a.hint,
      r = Ht(o, e, n),
      i = (p) => p && p.params.cols * p.params.rows > 1,
      c = (p) => p && (s ? p.params.cols === s.cols && p.params.rows === s.rows : i(p)),
      u = (p) => !r || Sn(p.params, r, e, n),
      l = xn(o, e, n);
    if (c(l) && u(l)) return l;
    let f = vn(o, e, n);
    if (c(f) && u(f)) return f;
    if (!s) {
      let p = Mn(t, e, n, r);
      if (p) return p;
    }
    if (s && s.cols * s.rows > 1) return He(o, e, n, s.cols, s.rows);
    if (a.infer) {
      let p = Un(t, o, e, n);
      if (p.cols * p.rows > 1) return { ...jn(t, o, e, n, p.cols, p.rows), method: I18N_T("krawędzie (zgadnięte)") };
    }
    return null;
  }
  function Xt(t, e, n, a, o) {
    if (a * o < 1) return null;
    let s = a * o > 1 ? zt(t, e, n, { hint: { cols: a, rows: o } }) : null;
    if (s) return s;
    let r = qt(t, e, n);
    return He(r, e, n, a, o);
  }
  function Sn(t, e, n, a) {
    let o = (t.mL / 100) * n,
      s = n - (t.mR / 100) * n,
      r = (t.mT / 100) * a,
      i = a - (t.mB / 100) * a,
      c = 0.07 * n,
      u = 0.07 * a;
    return Math.abs(o - e.x0) <= c && Math.abs(s - e.x1) <= c && Math.abs(r - e.y0) <= u && Math.abs(i - e.y1) <= u;
  }
  function Je(t, e, n) {
    let a = qt(t, e, n),
      o = 0;
    for (let r = 0; r < a.length; r++) o += a[r];
    let s = o / a.length;
    return s < 8e-4
      ? !0
      : s > 0.012
        ? !1
        : !_e(Ke(a, e, n), e, n).some((r) => r.x1 - r.x0 >= e * 0.07 && r.y1 - r.y0 >= n * 0.07);
  }
  function Qe(t, e, n) {
    let a = Math.round(e * 0.07),
      o = Math.round(n * 0.07),
      s = new Uint8Array((e - 2 * a) * (n - 2 * o)),
      r = e - 2 * a,
      i = n - 2 * o;
    if (r < 4 || i < 4) return !1;
    for (let l = 0; l < i; l++) for (let f = 0; f < r; f++) s[l * r + f] = t[(l + o) * e + f + a];
    let c = Vt(s, r, i),
      u = 0;
    for (let l = 0; l < s.length; l++) Math.abs(s[l] - c) > 24 && u++;
    return u / s.length < 0.0025;
  }
  var Bn = 250,
    en = 3400,
    Qt = 700,
    Jt,
    Ye = (t) => {
      let e = atob(t),
        n = new Uint8Array(e.length);
      for (let a = 0; a < e.length; a++) n[a] = e.charCodeAt(a);
      return URL.createObjectURL(new Blob([n], { type: "text/javascript" }));
    };
  function An() {
    if (!Jt) {
      let t = window.__PDFJS_EMBED,
        e = t ? Ye(t.main) : new URL("lib/pdf.min.mjs", document.baseURI).href,
        n = t ? Ye(t.worker) : new URL("lib/pdf.worker.min.mjs", document.baseURI).href;
      Jt = import(e).then((a) => ((a.GlobalWorkerOptions.workerSrc = n), a));
    }
    return Jt;
  }
  var curRender = null;
  // Przerywa renderowanie strony PDF trwające w tej chwili (przycisk „Anuluj”).
  function impCancelRender() {
    try {
      curRender?.cancel();
    } catch {
      /* render już zakończony */
    }
  }
  var PDF_PAGE_TIMEOUT = 6e4, // maks. czas renderowania jednej strony
    PDF_OPEN_TIMEOUT = 6e4, // maks. czas otwierania pliku PDF
    IMPORT_MAX_PAGES = 1000; // twardy limit stron/obrazów w jednym imporcie
  async function pdfOpen(data) {
    let task = (await An()).getDocument({ data, isEvalSupported: !1, enableScripting: !1 }),
      timer;
    try {
      return await Promise.race([
        task.promise,
        new Promise((_rs, rj) => {
          timer = setTimeout(() => {
            try {
              task.destroy();
            } catch {
              /* zadanie już zniszczone; błąd zgłaszamy niżej */
            }
            rj(new Error(I18N_T("Otwieranie PDF trwa zbyt długo.")));
          }, PDF_OPEN_TIMEOUT);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async function Ln(t, e, n) {
    let a = await t.getPage(e),
      o = a.getViewport({ scale: 1 });
    if (!(o.width > 0 && o.height > 0)) throw new Error(I18N_T("Strona PDF ma nieprawidłowe wymiary."));
    let mx = en / Math.max(o.width, o.height),
      s = n ? Math.min(n / o.width, mx) : Math.min(Bn / 72, mx),
      r = a.getViewport({ scale: s }),
      i = document.createElement("canvas");
    ((i.width = Math.max(1, Math.ceil(r.width))), (i.height = Math.max(1, Math.ceil(r.height))));
    let c = i.getContext("2d");
    ((c.fillStyle = "#fff"), c.fillRect(0, 0, i.width, i.height));
    let task = a.render({ canvasContext: c, canvas: i, viewport: r }),
      timer;
    curRender = task;
    try {
      await Promise.race([
        task.promise,
        new Promise((_rs, rj) => {
          timer = setTimeout(() => {
            // strona się zawiesiła: przerwij render i zamknij dokument (kończy jego worker)
            try {
              task.cancel();
            } catch {
              /* render już zakończony */
            }
            try {
              t.destroy();
            } catch {
              /* dokument już zamknięty; błąd zgłaszamy niżej */
            }
            rj(new Error(I18N_T("Strona PDF renderuje się zbyt długo.")));
          }, PDF_PAGE_TIMEOUT);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      curRender === task && (curRender = null);
    }
    a.cleanup();
    return i;
  }
  async function En(t, e) {
    let n = await kt(t);
    try {
      let a = n.naturalWidth || n.width,
        o = n.naturalHeight || n.height,
        s = e ? Math.min(1, e / a) : Math.min(1, en / Math.max(a, o)),
        r = document.createElement("canvas");
      ((r.width = Math.round(a * s)), (r.height = Math.round(o * s)));
      let i = r.getContext("2d");
      return ((i.fillStyle = "#fff"), i.fillRect(0, 0, r.width, r.height), i.drawImage(n, 0, 0, r.width, r.height), r);
    } finally {
      n.close?.();
    }
  }
  function jt(t, e = Qt) {
    let n = Math.min(1, e / t.width),
      a = Math.max(1, Math.round(t.width * n)),
      o = Math.max(1, Math.round(t.height * n)),
      s = t;
    if (n < 1) {
      ((s = document.createElement("canvas")), (s.width = a), (s.height = o));
      let c = s.getContext("2d");
      ((c.imageSmoothingQuality = "high"), c.drawImage(t, 0, 0, a, o));
    }
    let r = s.getContext("2d").getImageData(0, 0, a, o).data,
      i = new Uint8Array(a * o);
    for (let c = 0, u = 0; u < i.length; c += 4, u++)
      i[u] = r[c + 3] === 0 ? 255 : (r[c] * 299 + r[c + 1] * 587 + r[c + 2] * 114) / 1e3;
    return (s !== t && (s.width = 0), { data: i, w: a, h: o });
  }
  function Cn(t) {
    let e = jt(t, 120);
    return Qe(e.data, e.w, e.h);
  }
  var tn = [
      ["cols", I18N_T("Kolumny"), 1, 10, 1, ""],
      ["rows", I18N_T("Wiersze"), 1, 10, 1, ""],
      ["mL", I18N_T("Margines lewy"), 0, 40, 0.1, "%"],
      ["mT", I18N_T("Margines górny"), 0, 40, 0.1, "%"],
      ["mR", I18N_T("Margines prawy"), 0, 40, 0.1, "%"],
      ["mB", I18N_T("Margines dolny"), 0, 40, 0.1, "%"],
      ["gx", I18N_T("Odstęp poziomy"), 0, 15, 0.1, "%"],
      ["gy", I18N_T("Odstęp pionowy"), 0, 15, 0.1, "%"],
      ["inset", I18N_T("Przytnij brzegi kart"), 0, 15, 0.1, "%"],
    ],
    Mt = "http://www.w3.org/2000/svg";
  async function nn(t) {
    let e = d("div", {
      class: "modal importer",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "imp-title",
      tabindex: "-1",
    });
    let prevF = document.activeElement;
    e.addEventListener("keydown", (kv) => {
      if (kv.key !== "Tab") return;
      let fl = [
        ...e.querySelectorAll('button, input, select, summary, a[href], [tabindex]:not([tabindex="-1"])'),
      ].filter((q) => !q.disabled && q.offsetParent !== null);
      if (!fl.length) {
        kv.preventDefault();
        return;
      }
      let f0 = fl[0],
        f1 = fl[fl.length - 1];
      kv.shiftKey && (document.activeElement === f0 || document.activeElement === e)
        ? (kv.preventDefault(), f1.focus())
        : !kv.shiftKey && document.activeElement === f1 && (kv.preventDefault(), f0.focus());
    });
    document.body.append(e);
    e.focus();
    let moF = new MutationObserver(() => {
      e.isConnected || (moF.disconnect(), prevF?.isConnected && prevF.focus?.());
    });
    moF.observe(document.body, { childList: !0 });
    let n = _(I18N_T("Otwieranie plików…"), !0),
      a = [],
      o = [],
      s = { ...st },
      askS = !1,
      askP = !1;
    try {
      for (let h of t)
        if (n.cancelled) throw impAbort();
        else if (o.length >= IMPORT_MAX_PAGES)
          throw new Error(I18N_T("Za dużo stron do zaimportowania naraz (limit {}).", IMPORT_MAX_PAGES));
        else if (/\.pdf$/i.test(h.name) || h.type === "application/pdf") {
          if (
            h.size > 8e7 &&
            !askS &&
            ((askS = !0),
            !(await bigOk(
              I18N_T(
                "Plik „{}” ma {} MB. Duże pliki mogą zużyć dużo pamięci, zwłaszcza na telefonie.",
                h.name,
                Math.round(h.size / 1048576),
              ),
            )))
          )
            throw impAbort();
          let x = await pdfOpen(new Uint8Array(await h.arrayBuffer()));
          a.push(x);
          if (o.length + x.numPages > IMPORT_MAX_PAGES)
            throw new Error(I18N_T("Za dużo stron do zaimportowania naraz (limit {}).", IMPORT_MAX_PAGES));
          for (let j = 1; j <= x.numPages; j++)
            o.push({ label: x.numPages > 1 ? I18N_T("{} · str. {}", h.name, j) : h.name, render: (E) => Ln(x, j, E) });
          if (o.length > 150 && !askP) {
            askP = !0;
            if (
              !(await bigOk(
                I18N_T(
                  "Do zaimportowania jest {} stron lub obrazów. Analiza może potrwać i zająć dużo pamięci.",
                  o.length,
                ),
              ))
            )
              throw impAbort();
          }
        } else h.type.startsWith("image/") && o.push({ label: h.name, render: (k) => En(h, k) });
    } catch (h) {
      return (
        console.error(h),
        n.close(),
        e.remove(),
        a.forEach((k) => k.destroy?.()),
        h?.abort
          ? D(I18N_T("Import przerwany."))
          : D(I18N_T("Nie udało się otworzyć pliku: ") + (h?.message || h), 6e3),
        null
      );
    }
    if ((n.close(), !o.length)) return (e.remove(), D(I18N_T("Nie znaleziono stron PDF ani obrazów.")), null);
    {
      let h = _(I18N_T("Analizuję strony…"), !0);
      try {
        for (let k = 0; k < o.length; k++) {
          if (h.cancelled) break;
          h.set(I18N_T("Strona {} z {}…", k + 1, o.length), k / o.length);
          let x = o[k];
          ((x.blank = !1), (x.det = null));
          try {
            let j = await x.render(Qt),
              E = jt(j, Qt);
            ((j.width = 0),
              (x.blank = Je(E.data, E.w, E.h)),
              (x.det = x.blank ? null : zt(E.data, E.w, E.h)),
              !x.blank && !x.det && (x.fit = Xt(E.data, E.w, E.h, st.cols, st.rows)));
          } catch (j) {
            console.warn(I18N_T("Analiza strony nie powiodła się:"), k + 1, j);
          }
        }
      } finally {
        h.close();
      }
      // Sprawdzenie poza finally: return w finally połknąłby ewentualny wyjątek z pętli.
      if (h.cancelled) return (e.remove(), a.forEach((k) => k.destroy?.()), D(I18N_T("Import przerwany.")), null);
    }
    let r = o
        .filter((h) => h.det)
        .sort((h, k) => k.det.params.cols * k.det.params.rows - h.det.params.cols * h.det.params.rows)[0],
      i = o.find((h) => h.fit);
    r ? (s = { ...st, ...r.det.params }) : i && (s = { ...st, ...i.fit.params });
    let c = o.filter((h) => h.blank).length,
      u = c === o.length;
    for (let h of o) ((h.include = !h.blank || u), (h.params = s), (h.excluded = new Set()));
    let l = Math.max(
        0,
        o.findIndex((h) => !h.blank),
      ),
      f = null,
      p = 0,
      m = !0,
      g = !0,
      w = !1,
      A = d("button", { class: "btn primary", type: "button" }, I18N_T("Dodaj karty")),
      U = d("button", {
        class: "icon-btn",
        type: "button",
        "aria-label": I18N_T("Anuluj import"),
        title: I18N_T("Anuluj"),
        html: W("x"),
      }),
      R = d(
        "header",
        { class: "topbar" },
        U,
        d("h2", { id: "imp-title" }, I18N_T("Import kart z arkusza")),
        d("span", { class: "grow" }),
        A,
      ),
      L = d("div", { class: "sheet-wrap" }),
      z = d("div", { class: "stage-spin" }, d("div", { class: "spinner" }), I18N_T("Renderowanie strony…")),
      P = d("div", { class: "imp-stage" }, L, z),
      y = d("div", { class: "page-label" }),
      v = d("button", {
        class: "icon-btn small",
        type: "button",
        "aria-label": I18N_T("Poprzednia strona"),
        html: W("prev"),
      }),
      B = d("button", {
        class: "icon-btn small",
        type: "button",
        "aria-label": I18N_T("Następna strona"),
        html: W("next"),
      }),
      M = d("input", { type: "checkbox", checked: !1 }),
      $ = d("div", { class: "pager" }, v, y, B, d("label", { class: "check" }, M, I18N_T(" Pomiń stronę"))),
      b = d("input", { type: "checkbox", checked: !0 }),
      S = {},
      Z = {},
      dt = tn.map(([h, k, x, j, E]) => {
        let C = d("output", {}, ""),
          O = d("input", { type: "range", min: x, max: j, step: E });
        return (
          O.addEventListener("input", () => {
            ((o[l].params[h] = +O.value),
              (h === "cols" || h === "rows") && (w = !0),
              (C.textContent = J(h, +O.value)),
              q());
          }),
          (S[h] = C),
          (Z[h] = O),
          d("label", { class: "ctl" }, d("span", {}, k), O, C)
        );
      }),
      J = (h, k) => (["cols", "rows"].includes(h) ? String(k) : (+k).toFixed(1) + "%");
    function detectMarginsOnly() {
      if (!f) return;
      let image = jt(f.canvas),
        bounds = detectCutBounds(image.data, image.w, image.h);
      if (!bounds) {
        D(
          I18N_T(
            "Nie wykryto pewnych granic cięcia. Ustaw marginesy suwakami; dotychczasowe wartości pozostają bez zmian.",
          ),
          6000,
        );
        return;
      }
      Object.assign(o[l].params, bounds);
      it();
      q();
      D(
        I18N_T("Dopasowano marginesy do linii cięcia. Sprawdź podgląd; liczba kolumn i wierszy pozostaje bez zmian."),
        5000,
      );
    }
    let coverCell = null,
      coverMode = !1;
    function updCoverUi() {
      coverBtn.classList.toggle("on", coverMode);
      Q.classList.toggle("picking", coverMode);
      coverStatus.hidden = !coverCell && !coverMode;
      coverStatus.replaceChildren(
        coverMode
          ? I18N_T("Dotknij pola, które ma być okładką (może być pominięte w talii).")
          : coverCell
            ? I18N_T("Okładka: strona {}, pole {}. Pole nie musi trafić do talii.", coverCell.page + 1, coverCell.n)
            : "",
        ...(coverCell && !coverMode
          ? [
              d(
                "button",
                {
                  class: "btn ghost",
                  type: "button",
                  onclick: () => {
                    ((coverCell = null), updCoverUi(), q(), Ct());
                  },
                },
                I18N_T("Usuń okładkę"),
              ),
            ]
          : []),
      );
    }
    let marginButton = d(
        "button",
        { class: "btn", type: "button", onclick: detectMarginsOnly },
        I18N_T("Wykryj marginesy"),
      ),
      Yt = d("button", { class: "btn", type: "button" }, I18N_T("Wykryj siatkę")),
      coverBtn = d(
        "button",
        {
          class: "btn ghost cover-pick-btn",
          type: "button",
          onclick: () => {
            ((coverMode = !coverMode), updCoverUi());
          },
        },
        I18N_T("★ Wybierz okładkę"),
      ),
      coverStatus = d("p", { class: "hint cover-status", hidden: !0 }),
      te = d("button", { class: "btn ghost", type: "button" }, I18N_T("Zaznacz wszystkie pola na stronie")),
      ee = d("button", { class: "btn ghost", type: "button" }, I18N_T("Odznacz wszystkie pola na stronie")),
      Lt = d("input", { type: "checkbox", checked: !0 }),
      Et = d("input", { type: "checkbox", checked: !0 }),
      rn = d(
        "aside",
        { class: "imp-panel" },
        $,
        d("div", { class: "row wrap" }, marginButton, Yt, te, ee),
        d("div", { class: "row wrap" }, coverBtn),
        coverStatus,
        ...dt.slice(0, 2),
        d(
          "details",
          { class: "adv" },
          d("summary", {}, I18N_T("Zaawansowane: marginesy, odstępy, przycinanie")),
          ...dt.slice(2),
        ),
        d("label", { class: "check" }, Lt, I18N_T(" Ta sama siatka na wszystkich stronach")),
        d("label", { class: "check" }, b, I18N_T(" Pomiń puste strony (wykryte automatycznie)")),
        d("label", { class: "check" }, Et, I18N_T(" Pomiń puste pola (bez treści)")),
        d(
          "p",
          { class: "hint" },
          I18N_T(
            "Dotknij karty na podglądzie, aby ją wyłączyć (np. rewers, strona z zasadami). Pola z czerwoną obwódką będą wycięte. Jeśli siatka leży krzywo, otwórz „Zaawansowane” i popraw marginesy.",
          ),
        ),
      );
    e.append(R, d("div", { class: "imp-body" }, P, rn));
    let Q = document.createElementNS(Mt, "svg");
    (Q.setAttribute("class", "overlay"), Q.setAttribute("preserveAspectRatio", "none"), L.append(Q));
    function ne() {
      if (!f) return;
      let h = P.getBoundingClientRect(),
        k = 16,
        x = Math.min((h.width - k) / f.canvas.width, (h.height - k) / f.canvas.height);
      ((L.style.width = Math.max(40, f.canvas.width * x) + "px"),
        (L.style.height = Math.max(40, f.canvas.height * x) + "px"));
    }
    let ae = new ResizeObserver(ne);
    ae.observe(P);
    function q() {
      if ((Ct(), !f)) return;
      let h = f.canvas.width,
        k = f.canvas.height,
        x = o[l];
      (Q.setAttribute("viewBox", `0 0 ${h} ${k}`), Q.replaceChildren());
      let j = _t(x.params, h, k),
        E = Math.round(h * 0.035);
      for (let C of j) {
        let O = x.excluded.has(C.r + "," + C.c),
          isCover = !!coverCell && coverCell.page === l && coverCell.key === C.r + "," + C.c,
          I = document.createElementNS(Mt, "g");
        I.setAttribute("class", "cell" + (O ? " off" : "") + (isCover ? " cover" : ""));
        let N = document.createElementNS(Mt, "rect");
        for (let [ct, un] of Object.entries({ x: C.x, y: C.y, width: C.w, height: C.h })) N.setAttribute(ct, un);
        let Y = document.createElementNS(Mt, "text");
        (Y.setAttribute("x", C.x + C.w / 2),
          Y.setAttribute("y", C.y + C.h / 2 + E / 3),
          Y.setAttribute("font-size", E),
          Y.setAttribute("text-anchor", "middle"),
          (Y.textContent = isCover ? "\u2605" : O ? "\xD7" : String(C.r * x.params.cols + C.c + 1)),
          I.append(N, Y),
          I.addEventListener("click", () => {
            let ct = C.r + "," + C.c;
            if (coverMode) {
              ((coverCell = isCover ? null : { page: l, key: ct, n: C.r * x.params.cols + C.c + 1 }),
                (coverMode = !1),
                updCoverUi(),
                q(),
                Ct());
              return;
            }
            (x.excluded.has(ct) ? x.excluded.delete(ct) : x.excluded.add(ct), q());
          }),
          Q.append(I));
      }
    }
    function it() {
      let h = o[l].params;
      for (let [k] of tn) ((Z[k].value = h[k]), (S[k].textContent = J(k, h[k])));
      ((M.checked = !o[l].include),
        (y.textContent = `${l + 1} / ${o.length} \xB7 ${o[l].label}${o[l].blank ? I18N_T(" · pusta") : ""}`),
        (v.disabled = l === 0),
        (B.disabled = l === o.length - 1),
        L.classList.toggle("skipped", !o[l].include));
    }
    function Ct() {
      let h = 0;
      for (let x of o) {
        if (!x.include) continue;
        let j = x.params.cols * x.params.rows;
        for (let E of x.excluded) {
          let [C, O] = E.split(",").map(Number);
          C < x.params.rows && O < x.params.cols && j--;
        }
        h += j;
      }
      ((A.textContent = h ? I18N_T("Dodaj {} kart", h) : coverCell ? I18N_T("Ustaw okładkę") : I18N_T("Dodaj karty")),
        (A.disabled = h === 0 && !coverCell));
    }
    async function Dt(h) {
      l = h;
      let k = ++p;
      (it(), (z.hidden = !1), (L.style.visibility = "hidden"));
      let x;
      try {
        x = await o[h].render();
      } catch (j) {
        (console.error(j),
          k === p && ((z.hidden = !0), D(I18N_T("Nie udało się wyświetlić strony: ") + (j?.message || j), 5e3)));
        return;
      }
      k === p &&
        (f && (f.canvas.width = 0),
        (f = { canvas: x }),
        (x.className = "page-canvas"),
        L.querySelector("canvas")?.remove(),
        L.prepend(x),
        (z.hidden = !0),
        (L.style.visibility = ""),
        ne(),
        q());
    }
    function cn() {
      if (!f) return !1;
      let h = o[l],
        k = jt(f.canvas),
        x = w ? { cols: h.params.cols, rows: h.params.rows } : null,
        j = zt(k.data, k.w, k.h, { hint: x, infer: !x });
      return j
        ? (Object.assign(h.params, j.params),
          h.excluded.clear(),
          it(),
          q(),
          D(I18N_T("Wykryto siatkę {}×{}. Sprawdź i w razie potrzeby popraw.", j.params.cols, j.params.rows), 4e3),
          !0)
        : (D(
            x
              ? I18N_T("Nie udało się dopasować siatki – popraw marginesy suwakami.")
              : I18N_T(
                  "Nie udało się wykryć układu kart. Ustaw liczbę kolumn i wierszy suwakami – siatka sama dopasuje się do krawędzi.",
                ),
            7e3,
          ),
          !1);
    }
    ((v.onclick = () => {
      l > 0 && Dt(l - 1);
    }),
      (B.onclick = () => {
        l < o.length - 1 && Dt(l + 1);
      }),
      (M.onchange = () => {
        ((o[l].include = !M.checked), L.classList.toggle("skipped", M.checked), Ct());
      }),
      (Yt.onclick = () => cn()),
      (b.onchange = () => {
        for (let h of o) h.blank && (h.include = !b.checked);
        (it(), Ct());
      }),
      (te.onclick = () => {
        (o[l].excluded.clear(), q());
      }),
      (ee.onclick = () => {
        let h = o[l];
        for (let k = 0; k < h.params.rows; k++) for (let x = 0; x < h.params.cols; x++) h.excluded.add(k + "," + x);
        q();
      }),
      (Et.onchange = () => {
        g = Et.checked;
      }),
      (Lt.onchange = () => {
        if (((m = Lt.checked), m)) {
          s = o[l].params;
          for (let h of o) h.params = s;
        } else for (let h of o) h.params = { ...o[l].params };
        it();
      }));
    function oe() {
      (p++, ae.disconnect(), f && (f.canvas.width = 0), a.forEach((h) => h.destroy?.()), e.remove());
    }
    async function ln() {
      let h = _(I18N_T("Wycinanie kart…")),
        k = [];
      try {
        let x = o.map((j, E) => ({ p: j, i: E })).filter(({ p: j }) => j.include);
        for (let j = 0; j < x.length; j++) {
          let { p: E, i: C } = x[j];
          h.set(I18N_T("Strona {} z {}…", j + 1, x.length), j / x.length);
          let O = C === l && f ? f.canvas : await E.render();
          for (let I of _t(E.params, O.width, O.height)) {
            if (E.excluded.has(I.r + "," + I.c)) continue;
            let N = document.createElement("canvas");
            ((N.width = Math.max(1, Math.round(I.w))),
              (N.height = Math.max(1, Math.round(I.h))),
              N.getContext("2d").drawImage(O, I.x, I.y, I.w, I.h, 0, 0, N.width, N.height),
              !(g && Cn(N)) &&
                (k.push({
                  name: `${C + 1}-${I.r + 1}-${I.c + 1}`,
                  blob: await bt(N, 0.92),
                  thumb: await xt(N),
                  w: N.width,
                  h: N.height,
                }),
                (N.width = 0)));
          }
          (C === l && f) || (O.width = 0);
        }
        if (coverCell) {
          // Okładka może pochodzić z pominiętego pola lub strony (np. rewers) – nie trafia do talii.
          let E = o[coverCell.page],
            O = coverCell.page === l && f ? f.canvas : await E.render(),
            [cr, cc] = coverCell.key.split(",").map(Number),
            I = _t(E.params, O.width, O.height).find((z) => z.r === cr && z.c === cc);
          if (I) {
            let N = document.createElement("canvas");
            ((N.width = Math.max(1, Math.round(I.w))),
              (N.height = Math.max(1, Math.round(I.h))),
              N.getContext("2d").drawImage(O, I.x, I.y, I.w, I.h, 0, 0, N.width, N.height),
              (k.cover = await xt(N)),
              (N.width = 0));
          }
          (coverCell.page === l && f) || (O.width = 0);
        }
      } finally {
        h.close();
      }
      return k;
    }
    return new Promise((h) => {
      ((U.onclick = () => {
        (oe(), h(null));
      }),
        (A.onclick = async () => {
          A.disabled = !0;
          try {
            let k = await ln();
            if (!k.length && !k.cover) {
              (D(I18N_T("Żadna karta nie została wycięta (wszystkie pola puste lub wyłączone).")), (A.disabled = !1));
              return;
            }
            (oe(), h(k));
          } catch (k) {
            (console.error(k), D(I18N_T("Błąd podczas wycinania: ") + (k?.message || k), 6e3), (A.disabled = !1));
          }
        }),
        Dt(l).then(() => {
          (c && !u && D(I18N_T("Pominięto puste strony: {}.", c), 3500),
            r ||
              D(
                I18N_T(
                  "Nie wykryto układu kart automatycznie. Ustaw liczbę kolumn i wierszy suwakami – siatka sama dopasuje się do krawędzi.",
                ),
                8e3,
              ));
        }));
    });
  }
  var rt = It("#app"),
    Ut = null,
    an = 0,
    K = (t) => {
      location.hash = t;
    },
    on = () => K("#/"),
    St = () => new Date().toISOString().slice(0, 10),
    Dn = (t, e) => {
      let n;
      return (...a) => {
        (clearTimeout(n), (n = setTimeout(() => t(...a), e)));
      };
    };
  async function Bt() {
    let t = ++an;
    if (Ut) {
      try {
        await Ut();
      } catch (a) {
        console.error(a);
      }
      Ut = null;
    }
    let [, e, n] = (location.hash || "#/").split("/");
    rt.replaceChildren();
    try {
      let a = e === "play" && n ? await On(n) : e === "edit" && n ? await In(n) : await Pn();
      t !== an ? await a?.() : (Ut = a);
    } catch (a) {
      (console.error(a),
        rt.replaceChildren(
          d(
            "div",
            { class: "view center" },
            d("p", {}, I18N_T("Coś poszło nie tak: ") + (a?.message || a)),
            d("button", { class: "btn", onclick: () => K("#/") }, I18N_T("Wróć do biblioteki")),
          ),
        ));
    }
  }
  window.addEventListener("hashchange", Bt);
  var lastGlobalErrorAt = 0;
  function reportGlobalError(reason) {
    console.error(reason);
    // Anulowanie (przerwany import, render) to normalna sytuacja, nie błąd.
    let name = reason?.name || "";
    if (name === "AbortError" || name === "RenderingCancelledException" || reason?.cancelled) return;
    let now = Date.now();
    if (now - lastGlobalErrorAt < 5000) return;
    lastGlobalErrorAt = now;
    D(I18N_T("Coś poszło nie tak: ") + (reason?.message || reason), 6e3, "error");
  }
  window.addEventListener("unhandledrejection", (ev) => reportGlobalError(ev.reason));
  window.addEventListener("error", (ev) => ev.error && reportGlobalError(ev.error));
  var IP = null,
    IS = new Set();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    IP = e;
    IS.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    IP = null;
    IS.forEach((f) => f());
    D(I18N_T("Aplikacja zainstalowana."), 3e3, "ok");
  });
  function lsGet(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(k, v);
      return !0;
    } catch {
      return !1;
    }
  }
  function installBar() {
    let standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === !0,
      ios =
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      dismissed = () => {
        try {
          return Date.now() - (+localStorage.getItem("installDismissed") || 0) < 12096e5;
        } catch {
          return !1;
        }
      },
      btn = d("button", {
        type: "button",
        class: "btn primary tb",
        onclick: async () => {
          if (IP) {
            let p = IP;
            IP = null;
            try {
              p.prompt();
              await p.userChoice;
            } catch {
              /* użytkownik zamknął okno instalacji lub przeglądarka je odrzuciła */
            }
            refresh();
          } else
            await nt({
              title: I18N_T("Dodaj do ekranu początkowego"),
              text: I18N_T(
                "W Safari stuknij ikonę Udostępnij (kwadrat ze strzałką), przewiń listę i wybierz „Dodaj do ekranu początkowego”.",
              ),
              buttons: [{ label: "OK", value: !0, kind: "primary" }],
            });
        },
      }),
      x = G(
        "x",
        I18N_T("Ukryj"),
        () => {
          try {
            localStorage.setItem("installDismissed", String(Date.now()));
          } catch {
            /* brak pamięci lokalnej – baner pokaże się ponownie */
          }
          el.hidden = !0;
        },
        "small",
      ),
      el = d(
        "div",
        { class: "inst-chip", hidden: !0 },
        d(
          "span",
          { class: "grow" },
          I18N_T("Zainstaluj aplikację na urządzeniu – otwiera się jak zwykła aplikacja i działa offline."),
        ),
        btn,
        x,
      );
    function refresh() {
      btn.textContent = IP ? I18N_T("Zainstaluj") : I18N_T("Jak zainstalować");
      el.hidden = standalone() || dismissed() || !(IP || ios);
    }
    refresh.el = el;
    refresh.t = Date.now();
    for (let f of [...IS]) f.el && !f.el.isConnected && Date.now() - f.t > 5e3 && IS.delete(f);
    IS.add(refresh);
    refresh();
    return el;
  }
  function langSwitch() {
    let mk = (code, label, name) =>
      d(
        "button",
        {
          type: "button",
          class: "lang-btn" + (I18N_LANG === code ? " on" : ""),
          "aria-pressed": String(I18N_LANG === code),
          title: name,
          lang: code,
          onclick: () => {
            if (I18N_LANG === code) return;
            try {
              localStorage.setItem("lang", code);
            } catch {
              /* brak pamięci lokalnej – język nie zostanie zapamiętany */
            }
            location.reload();
          },
        },
        label,
      );
    return d(
      "div",
      { class: "lang-sw", role: "group", "aria-label": I18N_T("J\u0119zyk") },
      mk("en", "EN", "English"),
      mk("pl", "PL", "Polski"),
    );
  }
  function bkInfo(c, hasGames) {
    if (!c)
      return { stale: !!hasGames, text: I18N_T("kopii zapasowej jeszcze nie wykonano"), short: I18N_T("brak kopii") };
    let [y, m, dd] = String(c).split("-").map(Number),
      a = new Date(y, (m || 1) - 1, dd || 1),
      b = new Date(),
      days = Math.max(0, Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - a) / 864e5));
    let rel = days === 0 ? I18N_T("dziś") : days === 1 ? I18N_T("wczoraj") : days + I18N_T(" dni temu");
    return { stale: !!hasGames && days > 14, text: I18N_T("ostatnia kopia: ") + rel, short: rel };
  }
  async function Pn() {
    let t = await se(),
      e = [],
      n = (p) => {
        let m = URL.createObjectURL(p);
        return (e.push(m), m);
      },
      a = d(
        "button",
        { class: "btn ghost tb", type: "button", title: I18N_T("Wczytaj kopię zapasową (plik ZIP)"), onclick: f },
        d("span", { html: W("upload") }),
        I18N_T("Wczytaj"),
        d("span", { class: "tb-long" }, I18N_T(" kopię")),
      ),
      o = d(
        "button",
        {
          class: "btn ghost tb",
          type: "button",
          title: I18N_T("Zapisz wszystkie gry do kopii zapasowej (plik ZIP)"),
          onclick: l,
        },
        d("span", { html: W("download") }),
        I18N_T("Zapisz"),
        d("span", { class: "tb-long" }, I18N_T(" kopię")),
      );
    o.disabled = !t.length;
    let bk = bkInfo(lsGet("lastBackup"), t.length);
    bk.stale && (o.classList.add("warn"), (o.title += " \u2013 " + bk.text));
    let s = d(
        "div",
        { class: "game-grid" },
        t.map((p) =>
          d(
            "div",
            { class: "game" },
            d(
              "button",
              { class: "game-main", type: "button", onclick: () => K("#/play/" + p.id) },
              p.cover
                ? d("img", { src: n(p.cover), alt: "", loading: "lazy", decoding: "async" })
                : d("div", { class: "noimg", html: W("image") }),
              d(
                "div",
                { class: "game-text" },
                d("div", { class: "game-name" }, p.name),
                d("div", { class: "game-sub" }, p.cardCount ? deckText(p.cardCount, p.deckSize) : I18N_T("brak kart")),
              ),
            ),
            d(
              "div",
              { class: "game-actions" },
              G("edit", I18N_T("Edytuj grę ") + p.name, () => K("#/edit/" + p.id), "small game-edit"),
              G("trash", I18N_T("Usuń grę ") + p.name, () => delGameFromList(p), "small danger game-del"),
            ),
          ),
        ),
        d(
          "button",
          { class: "game new", type: "button", onclick: u },
          d("div", { class: "noimg", html: W("plus") }),
          d("div", { class: "game-name" }, I18N_T("Nowa gra")),
        ),
      ),
      r = d("p", { class: "foot" }),
      i = d(
        "div",
        { class: "view library" },
        d(
          "header",
          { class: "topbar" },
          d("h1", {}, "DeckEngine"),
          d("span", { class: "grow" }),
          a,
          o,
          langSwitch(),
        ),
        d(
          "main",
          { class: "scroll" },
          bk.stale
            ? d(
                "button",
                { class: "bk-chip", type: "button", onclick: l },
                d("span", { class: "bk-dot" }),
                d(
                  "span",
                  { class: "grow" },
                  bk.short === I18N_T("brak kopii")
                    ? I18N_T("Nie masz jeszcze kopii zapasowej")
                    : I18N_T("Ostatnia kopia zapasowa: ") + bk.short,
                ),
                d("strong", {}, I18N_T("Zapisz teraz")),
              )
            : null,
          installBar(),
          t.length
            ? null
            : d(
                "div",
                { class: "welcome" },
                d("h2", {}, I18N_T("Zacznij od dodania gry")),
                d(
                  "p",
                  {},
                  I18N_T(
                    "Utwórz grę, a potem dodaj karty automy: z PDF-a (aplikacja sama pocina arkusz na karty), z obrazów, albo z ZIP-a.",
                  ),
                ),
                d(
                  "p",
                  {},
                  I18N_T(
                    "Wszystko działa offline i zostaje na tym urządzeniu. Pamiętaj o kopii zapasowej (przycisk „Zapisz kopię” u góry).",
                  ),
                ),
              ),
          s,
          r,
        ),
      );
    rt.append(i);
    let c = lsGet("lastBackup");
    me().then((p) => {
      let m = [];
      (p.usage != null && m.push(I18N_T("Zajęte miejsce: ") + we(p.usage)),
        p.persisted != null &&
          m.push(p.persisted ? I18N_T("pamięć trwała") : I18N_T("pamięć może być czyszczona przez przeglądarkę")),
        m.push(bkInfo(c, 0).text),
        m.push(I18N_T("wersja") + " " + APP_VER),
        (r.textContent = m.join(" \xB7 ")));
    });
    async function delGameFromList(p) {
      // Przycisk „Anuluj” jest pierwszy, żeby przypadkowe Enter/Spacja nie usuwały gry.
      let ok = await nt({
        title: I18N_T("Usunąć grę?"),
        text: I18N_T(
          "Gra „{}” razem ze wszystkimi kartami zostanie trwale usunięta z tego urządzenia. Jeśli nie masz kopii zapasowej, nie da się tego cofnąć.",
          p.name,
        ),
        buttons: [
          { label: I18N_T("Anuluj"), value: null, kind: "ghost" },
          { label: I18N_T("Usuń grę"), value: !0, kind: "danger" },
        ],
      });
      if (ok !== !0) return;
      try {
        await ie(p.id);
        D(I18N_T("Gra usunięta."), 3e3);
      } catch (err) {
        console.error(err);
        D(I18N_T("Nie udało się usunąć gry."), 4e3);
      }
      Bt();
    }
    async function u() {
      let p = await be({ title: I18N_T("Nowa gra"), label: I18N_T("Nazwa gry"), ok: I18N_T("Utwórz") });
      if (!p) return;
      let m = H(),
        g = Date.now();
      (await re({ id: m, name: p, notes: "", createdAt: g, updatedAt: g, cover: null, cardCount: 0, deckSize: 0 }),
        mt(),
        K("#/edit/" + m));
    }
    async function l() {
      let p = _(I18N_T("Przygotowuję kopię zapasową…"));
      try {
        let m = await Wt(
          t.map((g) => g.id),
          (g) => p.set(null, g),
        );
        (p.close(), (await Tt(m, `DeckEngine-${St()}.zip`)) && lsSet("lastBackup", St()), Bt());
      } catch (m) {
        (p.close(), console.error(m), D(I18N_T("Eksport nie powiódł się: ") + (m?.message || m), 6e3));
      }
    }
    async function f() {
      let [p] = await ke(".zip,application/zip", !1);
      if (!p) return;
      let m = _(I18N_T("Importuję kopię zapasową…"));
      try {
        let g = await $e(p, {
          onProgress: (A) => m.set(null, A),
          onConflict: (A, U) => (
            m.close(),
            nt({
              title: I18N_T("Gra już istnieje"),
              text: I18N_T("W aplikacji jest już „{}”. Co zrobić z grą „{}” z kopii?", A.name, U.name),
              buttons: [
                {
                  label: I18N_T("Zastąp istniejącą"),
                  sub: I18N_T("Karty i bieżąca partia zostaną zastąpione"),
                  value: "replace",
                  kind: "primary",
                },
                {
                  label: I18N_T("Zachowaj obie"),
                  sub: I18N_T("Import doda drugą grę z dopiskiem „(kopia)”"),
                  value: "copy",
                },
                { label: I18N_T("Pomiń tę grę"), value: "skip", kind: "ghost" },
              ],
            })
          ),
        });
        (m.close(), mt());
        let w = g.added + g.replaced + g.copied;
        (D(
          (w ? I18N_T("Zaimportowano gry: {} (kart: {}).", w, g.cards) : I18N_T("Nic nie zaimportowano.")) +
            (g.failed ? " " + I18N_T("Nie udało się zaimportować gier: {}.", g.failed) : ""),
          g.failed ? 8e3 : 4e3,
        ),
          Bt());
      } catch (g) {
        (m.close(), console.error(g), D(I18N_T("Import nie powiódł się: ") + (g?.message || g), 7e3));
      }
    }
    return () => e.forEach((p) => URL.revokeObjectURL(p));
  }
  async function On(t) {
    let e = await tt(t);
    if (!e) return (D(I18N_T("Nie znaleziono gry.")), K("#/"), null);
    let n = await et(t);
    if (!n.some((b) => b.copies > 0))
      return (
        rt.append(
          d(
            "div",
            { class: "view center" },
            d("h2", {}, e.name),
            d("p", {}, I18N_T("Ta gra nie ma jeszcze żadnych kart w talii.")),
            d(
              "div",
              { class: "row" },
              d("button", { class: "btn", onclick: () => K("#/") }, I18N_T("Biblioteka")),
              d("button", { class: "btn primary", onclick: () => K("#/edit/" + t) }, I18N_T("Dodaj karty")),
            ),
          ),
        ),
        null
      );
    let a = new Map(n.map((b) => [b.id, b])),
      DN = Math.max(1, Math.min(6, e.drawCount | 0 || 1)),
      trimScale = (1 / (1 - (2 * edgeTrimOf(e)) / 100)).toFixed(4),
      o = await de(t);
    o ? Me(o, n) : (o = ze(t, n));
    let saveWarned = !1,
      s = () =>
        pe(o).catch((b) => {
          console.error(b);
          saveWarned || ((saveWarned = !0), D(I18N_T("Nie udało się zapisać stanu partii (brak miejsca?)."), 6e3));
        });
    s();
    let r = new Map(),
      i = (b) => {
        let S = r.get(b);
        return (S || ((S = URL.createObjectURL(a.get(b).blob)), r.set(b, S)), S);
      },
      c = null,
      u = d("div", {
        class: "stage",
        onclick: () => {
          c && ((c = null), L());
        },
      }),
      l = d("span", { class: "badge" }),
      f = d("span", { class: "badge muted" }),
      p = d(
        "button",
        {
          class: "draw-btn",
          type: "button",
          "aria-label": I18N_T("Dobierz kartę"),
          title: DN > 1 ? I18N_T("Dobierz karty: {} (spacja)", DN) : I18N_T("Dobierz kartę (spacja)"),
          onclick: z,
          html: W("draw"),
        },
        l,
      ),
      m = G("undo", I18N_T("Cofnij ostatnią akcję (Z)"), P),
      g = G("shuffle", I18N_T("Tasuj (S)"), () => y(!1)),
      w = d(
        "button",
        {
          class: "icon-btn",
          type: "button",
          "aria-label": I18N_T("Odrzucone karty"),
          title: I18N_T("Odrzucone karty"),
          onclick: v,
          html: W("discard"),
        },
        f,
      ),
      A = G("home", I18N_T("Wróć do biblioteki"), on),
      U = d("nav", { class: "bar", "aria-label": I18N_T("Sterowanie talią") }, A, m, p, g, w),
      R = d("div", { class: "view play" }, u, U);
    rt.append(R);
    let cur = [];
    function lay() {
      let g = u.firstChild;
      if (!g || !g.classList || !g.classList.contains("card-grid") || !cur.length) return;
      let k = cur.length,
        W = u.clientWidth,
        H = u.clientHeight,
        gp = 8,
        pd = 8,
        r = cur.reduce((x, y) => x + (y.w || 3) / (y.h || 4), 0) / k,
        cols = 1,
        cw;
      if (W < 640 && H > W) cw = Math.max(60, Math.min(W - 2 * pd, (H - 2 * pd) * r));
      else {
        let best = 0;
        for (let q = 1; q <= k; q++) {
          let rr = Math.ceil(k / q),
            w1 = Math.min((W - gp * (q - 1) - 2 * pd) / q, ((H - gp * (rr - 1) - 2 * pd) / rr) * r);
          if (w1 > best + 0.5) {
            best = w1;
            cols = q;
          }
        }
        cw = Math.max(60, best);
      }
      let inn = g.firstChild;
      inn.style.width = Math.floor(cols * cw + (cols - 1) * gp) + "px";
      for (let im of inn.children) im.style.width = Math.floor(cw) + "px";
    }
    function L() {
      let ids = (c ? [c] : o.shown).filter((b) => a.get(Ft(b)));
      u.replaceChildren();
      cur = ids.map((b) => a.get(Ft(b)));
      if (ids.length) {
        let els = ids.map((b) => {
          let S = a.get(Ft(b)),
            im = d(
              "div",
              { class: "gcard", style: "--ts:" + trimScale },
              d("img", {
                class: "gcard-img",
                src: i(S.id),
                alt: S.name || I18N_T("Karta"),
                draggable: "false",
                decoding: "async",
              }),
            );
          !c &&
            ids.length > 1 &&
            (im.classList.add("tap"),
            im.addEventListener("click", (ev) => {
              ev.stopPropagation();
              c = b;
              L();
            }));
          return im;
        });
        u.append(d("div", { class: "card-grid" }, d("div", { class: "card-grid-in" }, els)));
        lay();
      } else {
        u.append(
          d(
            "div",
            { class: "hint-box" },
            d("h2", {}, e.name),
            d(
              "p",
              {},
              !o.discard.length && o.undo.length
                ? I18N_T("Talia przetasowana.")
                : DN > 1
                  ? I18N_T("Naciśnij przycisk dobierania, aby odkryć karty ({} naraz).", DN)
                  : I18N_T("Naciśnij przycisk dobierania, aby wylosować kartę."),
            ),
            d("p", { class: "muted" }, I18N_T("Kart w talii: {}", o.draw.length)),
          ),
        );
      }
      u.append(
        d(
          "div",
          { class: "hud-read", "aria-hidden": "true" },
          d("span", { class: "hud-k" }, I18N_T("TALIA")),
          d("b", {}, String(o.draw.length)),
          d("span", { class: "hud-k" }, I18N_T("ODRZUCONE")),
          d("b", {}, String(o.discard.length)),
          d(
            "div",
            { class: "hud-bar" },
            d("i", {
              style:
                "width:" +
                Math.round(
                  (100 * o.draw.length) / Math.max(1, o.draw.length + o.discard.length + (o.shown?.length || 0)),
                ) +
                "%",
            }),
          ),
        ),
      );
      (c && u.append(d("div", { class: "preview-flag" }, I18N_T("Podgląd karty – dotknij, aby wrócić"))),
        (l.textContent = o.draw.length),
        (f.textContent = o.discard.length),
        (m.disabled = !o.undo.length),
        p.classList.toggle("empty", o.draw.length === 0));
    }
    let ask = (ti, tx) =>
      nt({
        title: ti,
        text: tx,
        buttons: [
          { label: I18N_T("Tak"), value: !0, kind: "primary" },
          { label: I18N_T("Nie"), value: null, kind: "ghost" },
        ],
      });
    async function z() {
      c = null;
      if (!o.draw.length) {
        if (
          await ask(
            I18N_T("Koniec talii"),
            I18N_T("Nie ma już kart do dobrania. Przetasować odrzucone i utworzyć nową talię?"),
          )
        ) {
          RS(o);
          je(o, DN, !0);
          s();
        }
        L();
        return;
      }
      let had = o.draw.length;
      je(o, DN);
      s();
      L();
      if (had < DN) {
        if (o.discard.length) {
          if (
            await ask(
              I18N_T("Koniec talii"),
              I18N_T(
                "Odkryto ostatnie karty ({} z {}). Przetasować odrzucone, utworzyć nową talię i dobrać brakujące karty ({})?",
                had,
                DN,
                DN - had,
              ),
            )
          ) {
            Ae(o);
            while (o.shown.length < DN && o.draw.length) o.shown.push(o.draw.pop());
            s();
            L();
            D(I18N_T("Nowa talia z odrzuconych kart."));
          }
        } else D(I18N_T("Koniec talii."));
      }
    }
    function P() {
      ((c = null), Ue(o) && (s(), L()));
    }
    async function y(b) {
      let S = await nt({
        sheet: !0,
        title: b ? I18N_T("Talia wyczerpana") : I18N_T("Tasowanie"),
        text: b ? I18N_T("Nie ma już kart do dobrania. Jak przetasować?") : I18N_T("Co przetasować?"),
        buttons: [
          {
            label: I18N_T("Wszystkie karty"),
            sub: I18N_T("Odrzucone wracają do talii, całość jest tasowana"),
            value: "all",
            kind: "primary",
          },
          {
            label: I18N_T("Tylko karty w talii"),
            sub: I18N_T("Odrzucone zostają odłożone na bok"),
            value: "draw",
            hidden: o.draw.length < 2,
          },
          {
            label: I18N_T("Odrzucone pod talię"),
            sub: I18N_T("Odrzucone tasowane osobno i kładzione pod spód talii"),
            value: "under",
            hidden: !o.discard.length || !o.draw.length,
          },
          { label: I18N_T("Anuluj"), value: null, kind: "ghost" },
        ],
      });
      S &&
        ((c = null),
        S === "all" ? Se(o) : S === "draw" ? Be(o) : S === "under" && Ae(o),
        s(),
        L(),
        D(I18N_T("Talia przetasowana (cofnięcie: ikona strzałki).")));
    }
    function v() {
      let Z,
        mk = (dt, num) => {
          let V = a.get(Ft(dt));
          return d(
            "button",
            {
              class: "thumb",
              type: "button",
              "aria-label": I18N_T("Odrzucona karta {}", num),
              onclick: () => {
                ((c = dt), Z.close(), L());
              },
            },
            V
              ? d("img", {
                  src: URL.createObjectURL(V.thumb || V.blob),
                  alt: V.name || "",
                  onload: (At) => URL.revokeObjectURL(At.target.src),
                })
              : null,
            d("span", { class: "thumb-n" }, String(num)),
          );
        },
        tot = o.discard.length,
        S;
      if (!tot) S = d("p", { class: "muted pad" }, I18N_T("Nie odrzucono jeszcze żadnej karty."));
      else if (DN > 1 && Array.isArray(o.dg) && o.dg.length && o.dg.reduce((x, y) => x + y, 0) === tot) {
        let st = 0,
          gs = o.dg
            .map((sz, gi) => {
              let it = o.discard.slice(st, st + sz).map((dt, k) => mk(dt, st + k + 1));
              st += sz;
              return d(
                "div",
                { class: "turn" },
                d("h4", { class: "turn-h" }, I18N_T("Tura {}", gi + 1)),
                d("div", { class: "thumb-grid" }, it),
              );
            })
            .reverse();
        S = d("div", {}, gs);
      } else {
        let b = [...o.discard].reverse();
        S = d(
          "div",
          { class: "thumb-grid" },
          b.map((dt, J) => mk(dt, b.length - J)),
        );
      }
      Z = $t({ title: I18N_T("Odrzucone ({}) – najnowsze pierwsze", tot), content: S });
    }
    let B = (b) => {
      document.querySelector("dialog[open]") ||
        b.target.closest?.("input, textarea, select, [contenteditable]") ||
        b.defaultPrevented ||
        ((b.key === " " || b.key === "Enter") && b.target.closest?.("button, a, summary")) ||
        b.ctrlKey ||
        b.metaKey ||
        b.altKey ||
        (b.key === " " || b.key === "Enter" || b.key === "ArrowRight"
          ? (b.preventDefault(), z())
          : b.key === "z" || b.key === "Z" || b.key === "ArrowLeft" || b.key === "Backspace"
            ? (b.preventDefault(), P())
            : b.key === "s" || b.key === "S"
              ? (b.preventDefault(), y(!1))
              : b.key === "Escape" && c && ((c = null), L()));
    };
    window.addEventListener("keydown", B);
    let ro = new ResizeObserver(() => lay());
    ro.observe(u);
    let OR1 =
        e.orientation === "portrait" || e.orientation === "landscape"
          ? e.orientation
          : n.filter((x) => x.w > x.h).length > n.length / 2
            ? "landscape"
            : "portrait",
      tch = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900,
      lk = !1,
      hOff = !1,
      hnt = null,
      fsO = !1,
      mqO = matchMedia("(orientation: landscape)"),
      chkO = () => {
        let cur = mqO.matches ? "landscape" : "portrait",
          need = tch && !lk && !hOff && cur !== OR1;
        if (!need) {
          (hnt?.remove(), (hnt = null));
          return;
        }
        if (hnt) return;
        let canFs = !!document.documentElement.requestFullscreen && !!screen.orientation?.lock;
        ((hnt = d(
          "div",
          { class: "orient-hint", role: "status" },
          d(
            "span",
            { class: "grow" },
            OR1 === "landscape"
              ? I18N_T("Obróć telefon do pozycji poziomej")
              : I18N_T("Obróć telefon do pozycji pionowej"),
          ),
          canFs
            ? d(
                "button",
                {
                  type: "button",
                  class: "btn primary tb",
                  onclick: async () => {
                    try {
                      (await document.documentElement.requestFullscreen(),
                        (fsO = !0),
                        await screen.orientation.lock(OR1),
                        (lk = !0));
                    } catch {
                      /* blokada orientacji nieobsługiwana (np. iOS) – działa podpowiedź obrotu */
                    }
                    chkO();
                  },
                },
                I18N_T("Pełen ekran i blokada"),
              )
            : null,
          G(
            "x",
            I18N_T("Ukryj"),
            () => {
              ((hOff = !0), chkO());
            },
            "small",
          ),
        )),
          R.append(hnt));
      },
      tryLock = async () => {
        if (tch && screen.orientation?.lock) {
          try {
            (await screen.orientation.lock(OR1), (lk = !0));
          } catch {
            lk = !1;
          }
        }
        chkO();
      };
    (mqO.addEventListener("change", chkO), tryLock());
    let M = null,
      $ = async () => {
        try {
          "wakeLock" in navigator &&
            document.visibilityState === "visible" &&
            (M = await navigator.wakeLock.request("screen"));
        } catch {
          /* Wake Lock niedostępny lub odrzucony – ekran może zgasnąć */
        }
      };
    return (
      document.addEventListener("visibilitychange", $),
      $(),
      L(),
      () => {
        (ro.disconnect(), mqO.removeEventListener("change", chkO));
        try {
          screen.orientation?.unlock?.();
        } catch {
          /* nic do odblokowania */
        }
        fsO && document.fullscreenElement && document.exitFullscreen().catch(() => {});
        (hnt?.remove(),
          window.removeEventListener("keydown", B),
          document.removeEventListener("visibilitychange", $),
          M?.release?.().catch?.(() => {}));
        for (let b of r.values()) URL.revokeObjectURL(b);
      }
    );
  }
  async function In(t) {
    let e = await tt(t);
    if (!e) return (D(I18N_T("Nie znaleziono gry.")), K("#/"), null);
    let n = await et(t),
      a = new Map(),
      o = (y) => {
        let v = a.get(y.id);
        return (v || ((v = URL.createObjectURL(y.thumb || y.blob)), a.set(y.id, v)), v);
      },
      s = Dn(() => ft(t).catch(console.error), 300),
      r = d("input", { class: "title-input", value: e.name, maxlength: 120, "aria-label": I18N_T("Nazwa gry") });
    r.addEventListener("change", async () => {
      let y = r.value.trim() || I18N_T("Bez nazwy");
      ((r.value = y),
        await pt(t, (v) => {
          v.name = y;
        }));
    });
    let i = d(
      "textarea",
      {
        class: "notes",
        rows: 2,
        placeholder: I18N_T("Notatki do gry (np. kiedy tasować talię, jak czytać karty)…"),
        "aria-label": I18N_T("Notatki"),
      },
      e.notes || "",
    );
    i.addEventListener("change", () =>
      pt(t, (y) => {
        y.notes = i.value;
      }),
    );
    let coverCardNow = e.coverCardId || null,
      coverCustomBlob = e.coverCustom || null,
      coverMarks = new Map(),
      coverUrl = null,
      coverPrev = d("img", { class: "cover-prev", alt: "" }),
      coverSub = d("span", { class: "muted" }),
      coverDefaultCard = () => n[0] || null,
      coverClear = d(
        "button",
        {
          type: "button",
          class: "btn ghost",
          onclick: async () => {
            await pt(t, (g) => {
              delete g.coverCustom;
              delete g.coverCardId;
            });
            coverCustomBlob = null;
            coverCardNow = null;
            refreshCover();
            s();
          },
        },
        d("span", { class: "btn-label" }, I18N_T("Przywróć domyślną okładkę")),
      ),
      coverRotate = d(
        "button",
        {
          type: "button",
          class: "btn",
          onclick: async () => {
            let src = coverCustomBlob || coverDefaultCard()?.thumb || coverDefaultCard()?.blob;
            if (!src) return;
            try {
              let rotated = await rotateBlob90(src);
              await pt(t, (g) => {
                g.coverCustom = rotated;
              });
              coverCustomBlob = rotated;
              refreshCover();
              s();
            } catch (err) {
              console.error(err);
              D(I18N_T("Nie udało się obrócić okładki."), 4e3);
            }
          },
        },
        d("span", { html: W("rotate") }),
        d("span", { class: "btn-label" }, I18N_T("Obróć okładkę")),
      ),
      coverPick = Nt({
        label: I18N_T("Wybierz obraz"),
        accept: "image/*",
        multiple: !1,
        kind: "",
        onFiles: async (files) => {
          let f = files[0];
          if (!f) return;
          if (f.size > 60 * 1024 * 1024) return void D(I18N_T("Plik graficzny jest zbyt duży (limit 60 MB)."), 4e3);
          try {
            let { thumb } = await Oe(new Blob([f], { type: f.type }));
            await pt(t, (g) => {
              g.coverCustom = thumb;
              delete g.coverCardId;
            });
            coverCustomBlob = thumb;
            coverCardNow = null;
            refreshCover();
            s();
          } catch (err) {
            console.error(err);
            D(I18N_T("Nie udało się wczytać obrazu okładki."), 4e3);
          }
        },
      }),
      refreshCover = () => {
        let pick = coverDefaultCard(),
          blob = coverCustomBlob || (pick ? pick.thumb || pick.blob : null);
        for (let [id, b] of coverMarks) {
          if (!b.isConnected) {
            coverMarks.delete(id);
            continue;
          }
          let on = !!coverCustomBlob && coverCardNow === id;
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", String(on));
        }
        coverUrl && URL.revokeObjectURL(coverUrl);
        coverUrl = blob ? URL.createObjectURL(blob) : null;
        coverPrev.hidden = !blob;
        blob && (coverPrev.src = coverUrl);
        coverClear.hidden = !coverCustomBlob;
        coverRotate.hidden = !blob;
        coverSub.textContent = coverCustomBlob
          ? I18N_T("Własna okładka")
          : pick
            ? I18N_T("Domyślnie: pierwsza karta z talii")
            : I18N_T("Brak okładki");
      },
      coverRow = d(
        "div",
        { class: "setting cover-setting" },
        coverPrev,
        d(
          "div",
          { class: "setting-text" },
          d("strong", {}, I18N_T("Okładka gry")),
          coverSub,
          d(
            "span",
            { class: "muted" },
            I18N_T(
              "Wskaż kartę gwiazdką, wybierz własny obraz albo ustaw okładkę w importerze PDF. Okładka nie trafia do talii.",
            ),
          ),
        ),
        d("div", { class: "cover-actions" }, coverPick, coverRotate, coverClear),
      ),
      dc = Math.max(1, Math.min(6, e.drawCount | 0 || 1)),
      dv = d("span", { class: "copies" }, String(dc)),
      setDc = async (x) => {
        let nv = Math.max(1, Math.min(6, dc + x));
        if (nv === dc) return;
        dc = nv;
        dv.textContent = String(nv);
        dmin.disabled = nv <= 1;
        dplus.disabled = nv >= 6;
        await pt(t, (g) => {
          g.drawCount = nv;
        });
      },
      dmin = G("minus", I18N_T("Mniej kart dobieranych naraz"), () => setDc(-1), "small"),
      dplus = G("plus", I18N_T("Więcej kart dobieranych naraz"), () => setDc(1), "small"),
      drawRow = d(
        "div",
        { class: "setting" },
        d(
          "div",
          { class: "setting-text" },
          d("strong", {}, I18N_T("Karty dobierane naraz")),
          d("span", { class: "muted" }, I18N_T("Ile kart odkrywa jedno dobranie")),
        ),
        dmin,
        dv,
        dplus,
      ),
      trimNow = edgeTrimOf(e),
      trimValEl = d("span", { class: "copies" }, trimNow + "%"),
      setTrimStep = async (x) => {
        let nv = Math.max(0, Math.min(EDGE_TRIM_MAX, trimNow + x));
        if (nv === trimNow) return;
        trimNow = nv;
        trimValEl.textContent = nv + "%";
        trimMinBtn.disabled = nv <= 0;
        trimPlusBtn.disabled = nv >= EDGE_TRIM_MAX;
        await pt(t, (g) => {
          g.edgeTrim = nv;
        });
      },
      trimMinBtn = G("minus", I18N_T("Mniejsze przycięcie brzegu karty"), () => setTrimStep(-1), "small"),
      trimPlusBtn = G("plus", I18N_T("Większe przycięcie brzegu karty"), () => setTrimStep(1), "small"),
      trimRow = d(
        "div",
        { class: "setting" },
        d(
          "div",
          { class: "setting-text" },
          d("strong", {}, I18N_T("Przytnij brzeg karty")),
          d("span", { class: "muted" }, I18N_T("Ukrywa biały margines po cięciu (tylko na ekranie gry)")),
        ),
        trimMinBtn,
        trimValEl,
        trimPlusBtn,
      ),
      OV = ["portrait", "landscape"].includes(e.orientation) ? e.orientation : "auto",
      orBtns = [
        ["auto", "Automatycznie"],
        ["portrait", "Pionowo"],
        ["landscape", "Poziomo"],
      ].map(([k, l]) =>
        d(
          "button",
          {
            type: "button",
            class: "seg-btn" + (k === OV ? " on" : ""),
            "aria-pressed": String(k === OV),
            "data-k": k,
            onclick: async () => {
              OV = k;
              orBtns.forEach((b) => {
                let on = b.dataset.k === OV;
                (b.classList.toggle("on", on), b.setAttribute("aria-pressed", String(on)));
              });
              await pt(t, (g) => {
                g.orientation = k;
              });
            },
          },
          I18N_T(l),
        ),
      ),
      orRow = d(
        "div",
        { class: "setting col" },
        d(
          "div",
          { class: "setting-text" },
          d("strong", {}, I18N_T("Orientacja ekranu podczas gry")),
          d("span", { class: "muted" }, I18N_T("Blokuje obrót telefonu. „Automatycznie” dobiera ją do kształtu kart.")),
        ),
        d("div", { class: "seg", role: "group" }, orBtns),
      ),
      c = d("p", { class: "muted summary" }),
      bulk = d(
        "button",
        {
          class: "btn ghost tb",
          type: "button",
          title: I18N_T("Obróć wszystkie karty o 90°"),
          onclick: () => rotAll(),
        },
        d("span", { html: W("rotate") }),
        I18N_T("Obróć karty"),
      ),
      u = d("div", { class: "tile-grid" }),
      l = d("button", { class: "btn primary", type: "button", onclick: () => K("#/play/" + t) }, I18N_T("Graj")),
      f = G("more", I18N_T("Więcej"), P),
      p = d(
        "div",
        { class: "view edit" },
        d("header", { class: "topbar" }, G("back", I18N_T("Wróć do biblioteki"), on), r, l, f),
        d(
          "main",
          { class: "scroll" },
          d("h2", { class: "sec-h" }, I18N_T("Ustawienia gry")),
          drawRow,
          trimRow,
          coverRow,
          orRow,
          d("h2", { class: "sec-h sec-gap" }, I18N_T("Karty")),
          d("div", { class: "row summary-row" }, c, d("span", { class: "grow" }), bulk),
          u,
          d(
            "div",
            { class: "add-row" },
            d("button", {
              class: "btn primary big",
              type: "button",
              onclick: R,
              html: W("plus") + "<span>" + I18N_T("Dodaj karty") + "</span>",
            }),
          ),
          i,
        ),
      );
    rt.append(p);
    dmin.disabled = dc <= 1;
    trimMinBtn.disabled = trimNow <= 0;
    trimPlusBtn.disabled = trimNow >= EDGE_TRIM_MAX;
    dplus.disabled = dc >= 6;
    function m() {
      refreshCover();
      bulk.hidden = !n.length;
      let y = n.reduce((v, B) => v + B.copies, 0);
      ((c.textContent = n.length
        ? deckText(n.length, y)
        : I18N_T("Brak kart. Dodaj obrazy albo pociętą na karty stronę PDF.")),
        u.replaceChildren(...n.map(g)));
    }
    function g(y) {
      let IM = d("img", { src: o(y), alt: y.name || I18N_T("Karta"), loading: "lazy" }),
        RB = G(
          "rotate",
          I18N_T("Obróć kartę o 90° w prawo"),
          async () => {
            try {
              await rotOne(y, 1);
              IM.src = o(y);
              s();
            } catch (E) {
              console.error(E);
              D(I18N_T("Nie udało się obrócić karty."), 4e3);
            }
          },
          "small tile-rot",
        ),
        DB = G("trash", I18N_T("Usuń kartę"), () => A(y), "small danger tile-del"),
        CB = G(
          "star",
          I18N_T("Ustaw jako okładkę gry"),
          async () => {
            // Zapisujemy kopię obrazu: okładka zostaje także po usunięciu tej karty z talii.
            let snap = y.thumb || y.blob;
            await pt(t, (g) => {
              g.coverCardId = y.id;
              g.coverCustom = snap;
            });
            coverCardNow = y.id;
            coverCustomBlob = snap;
            refreshCover();
            s();
          },
          "small tile-cover",
        ),
        OFFB = d("span", { class: "tile-off-badge" }, I18N_T("Wyłączona"));
      let v = d("span", { class: "copies" }, "\xD7" + y.copies),
        B = async (b) => {
          let S = Math.max(0, Math.min(99, y.copies + b));
          S !== y.copies &&
            ((y.copies = S),
            (v.textContent = "\xD7" + S),
            $.classList.toggle("off", S === 0),
            await Ot(y.id, (Z) => {
              Z.copies = S;
            }),
            w(),
            s());
        },
        M = d("input", {
          class: "tile-name",
          value: y.name,
          placeholder: I18N_T("nazwa karty"),
          "aria-label": I18N_T("Nazwa karty"),
          maxlength: 120,
        });
      M.addEventListener("change", () => {
        ((y.name = M.value),
          Ot(y.id, (b) => {
            b.name = M.value;
          }));
      });
      let $ = d(
        "div",
        { class: "tile" + (y.copies === 0 ? " off" : "") },
        IM,
        OFFB,
        RB,
        DB,
        CB,
        M,
        d(
          "div",
          { class: "tile-row" },
          G("minus", I18N_T("Mniej kopii"), () => B(-1), "small"),
          v,
          G("plus", I18N_T("Więcej kopii"), () => B(1), "small"),
        ),
      );
      coverMarks.set(y.id, CB);
      {
        let on = !!coverCustomBlob && coverCardNow === y.id;
        CB.classList.toggle("on", on);
        CB.setAttribute("aria-pressed", String(on));
      }
      return $;
    }
    async function rotOne(y, dir) {
      let img = await kt(y.blob),
        W0,
        H0,
        cv;
      try {
        W0 = img.naturalWidth || img.width;
        H0 = img.naturalHeight || img.height;
        cv = document.createElement("canvas");
        cv.width = H0;
        cv.height = W0;
        let cx = cv.getContext("2d");
        cx.translate(H0 / 2, W0 / 2);
        cx.rotate((dir * Math.PI) / 2);
        cx.drawImage(img, -W0 / 2, -H0 / 2);
      } finally {
        img.close?.();
      }
      let ty = ["image/png", "image/jpeg", "image/webp"].includes(y.blob.type) ? y.blob.type : "image/jpeg",
        bl = await new Promise((r) => cv.toBlob(r, ty, 0.95));
      if (!bl) throw new Error(I18N_T("nie udało się obrócić obrazu"));
      let th = await xt(cv);
      cv.width = 0;
      await Ot(y.id, (q) => {
        q.blob = bl;
        q.thumb = th;
        q.w = H0;
        q.h = W0;
      });
      y.blob = bl;
      y.thumb = th;
      y.w = H0;
      y.h = W0;
      let old = a.get(y.id);
      old && URL.revokeObjectURL(old);
      a.delete(y.id);
    }
    async function rotAll() {
      let dir = await nt({
        title: I18N_T("Obrócić wszystkie karty?"),
        text: I18N_T(
          "Wszystkie karty w tej grze zostaną obrócone o 90°. Przyda się, gdy karty są poziome, a arkusz w PDF-ie był pionowy.",
        ),
        buttons: [
          { label: I18N_T("90° w prawo"), sub: I18N_T("zgodnie z ruchem wskazówek zegara"), value: 1, kind: "primary" },
          { label: I18N_T("90° w lewo"), sub: I18N_T("przeciwnie do ruchu wskazówek zegara"), value: -1 },
          { label: I18N_T("Anuluj"), value: null, kind: "ghost" },
        ],
      });
      if (!dir) return;
      let pr = _(I18N_T("Obracam karty…"));
      try {
        for (let k = 0; k < n.length; k++) {
          pr.set(I18N_T("Karta {} z {}…", k + 1, n.length), k / n.length);
          await rotOne(n[k], dir);
        }
        pr.close();
        m();
        s();
        D(I18N_T("Obrócono karty: {}.", n.length));
      } catch (E) {
        pr.close();
        console.error(E);
        m();
        s();
        D(I18N_T("Błąd podczas obracania: ") + (E?.message || E), 6e3);
      }
    }
    function w() {
      let y = n.reduce((v, B) => v + B.copies, 0);
      c.textContent = deckText(n.length, y);
    }
    async function A(y) {
      (await nt({
        title: I18N_T("Usunąć kartę?"),
        text: y.name ? I18N_T("Karta „{}” zostanie usunięta z gry.", y.name) : I18N_T("Karta zostanie usunięta z gry."),
        buttons: [
          { label: I18N_T("Usuń"), value: !0, kind: "danger" },
          { label: I18N_T("Anuluj"), value: null, kind: "ghost" },
        ],
      })) && (await le(y.id), (n = n.filter((B) => B.id !== y.id)), m(), s());
    }
    async function U(y) {
      if (y.cover) {
        await pt(t, (g) => {
          g.coverCustom = y.cover;
          delete g.coverCardId;
        });
        coverCustomBlob = y.cover;
        coverCardNow = null;
      }
      if (!y.length) {
        await ft(t);
        refreshCover();
        mt();
        D(I18N_T("Ustawiono okładkę gry."));
        return;
      }
      let v = n.reduce((M, $) => Math.max(M, $.order), -1) + 1,
        B = y.map((M) => ({
          id: H(),
          gameId: t,
          order: v++,
          name: M.name || "",
          copies: 1,
          blob: M.blob,
          thumb: M.thumb,
          w: M.w,
          h: M.h,
        }));
      (await ce(B),
        (n = n.concat(B)),
        m(),
        await ft(t),
        mt(),
        D(I18N_T(y.cover ? "Dodano kart: {}. Ustawiono też okładkę." : "Dodano kart: {}.", B.length)));
    }
    function R() {
      let y = $t({
        title: I18N_T("Dodaj karty"),
        content: d(
          "div",
          { class: "dlg-buttons" },
          Nt({
            label: I18N_T("PDF lub arkusz do pocięcia"),
            sub: I18N_T("Strona z siatką kart zostanie wycięta na osobne karty"),
            accept: "application/pdf,.pdf,image/*",
            onFiles: (v) => {
              (y.close(), z(v));
            },
          }),
          Nt({
            label: I18N_T("Obrazy lub ZIP z obrazami"),
            sub: I18N_T("Każdy plik graficzny to jedna karta"),
            accept: "image/*,.zip,application/zip",
            onFiles: (v) => {
              (y.close(), L(v));
            },
          }),
        ),
      });
    }
    async function L(y) {
      let v = _(I18N_T("Wczytuję pliki…"), !0),
        B = 0;
      try {
        let M = [];
        for (let b of y)
          if (/\.zip$/i.test(b.name))
            for (let S of await wt(b)) {
              let Z = S.name.split("/").pop();
              S.isDir ||
                Z.startsWith(".") ||
                S.name.startsWith("__MACOSX/") ||
                !Gt(Z) ||
                M.push({
                  sort: S.name,
                  size: S.size,
                  name: yt(Z),
                  get: async () => new Blob([await S.blob()], { type: at(Z) }),
                });
            }
          else
            (b.type.startsWith("image/") || Gt(b.name)) &&
              M.push({
                sort: b.name,
                size: b.size,
                name: yt(b.name),
                get: async () => (b.type ? b : new Blob([b], { type: at(b.name) })),
              });
        M.sort((b, S) => ge(b.sort, S.sort));
        let tb = M.reduce((q, b) => q + (b.size || 0), 0);
        if (M.length > 3000 || tb > 1.5e9) {
          v.close();
          D(I18N_T("Za dużo plików do zaimportowania naraz (limit {} plików, {} GB).", 3000, 1.5), 6e3);
          return;
        }
        if (
          (M.length > 300 || tb > 4e8) &&
          !(await bigOk(
            I18N_T(
              "Do zaimportowania jest {} plików ({} MB). Może to zająć dużo pamięci i czasu.",
              M.length,
              Math.round(tb / 1048576),
            ),
          ))
        )
          return v.close();
        let $ = [];
        for (let b = 0; b < M.length; b++) {
          if (v.cancelled) break;
          v.set(I18N_T("Karta {} z {}…", b + 1, M.length), b / M.length);
          try {
            $.push(await Pe(await M[b].get(), M[b].name));
          } catch (S) {
            (console.warn(I18N_T("pominięto"), M[b].sort, S), B++);
          }
        }
        (v.close(),
          v.cancelled
            ? D(I18N_T("Import przerwany."))
            : $.length
              ? await U($)
              : D(I18N_T("Nie znaleziono obrazów do dodania.")),
          B && D(I18N_T("Nie udało się wczytać plików: {}.", B), 5e3));
      } catch (M) {
        (v.close(), console.error(M), D(I18N_T("Błąd: ") + (M?.message || M), 6e3));
      }
    }
    async function z(y) {
      let v = await nn(y);
      v && (v.length || v.cover) && (await U(v));
    }
    async function P() {
      let y = await nt({
        sheet: !0,
        title: e.name || r.value || I18N_T("Bez nazwy"),
        buttons: [
          { label: I18N_T("Eksportuj tę grę (ZIP)"), sub: I18N_T("Kopia zapasowa tylko tej gry"), value: "export" },
          {
            label: I18N_T("Zacznij partię od nowa"),
            sub: I18N_T("Przetasuj całą talię i wyczyść odrzucone"),
            value: "reset",
            hidden: !n.length,
          },
          { label: I18N_T("Usuń grę"), value: "delete", kind: "danger" },
          { label: I18N_T("Zamknij"), value: null, kind: "ghost" },
        ],
      });
      if (y === "export") {
        let v = _(I18N_T("Przygotowuję plik…"));
        try {
          let B = await Wt([t], (M) => v.set(null, M));
          (v.close(), (await Tt(B, `${ye(r.value)}-${St()}.zip`)) && lsSet("lastBackup", St()));
        } catch (B) {
          (v.close(), console.error(B), D(I18N_T("Eksport nie powiódł się: ") + (B?.message || B), 6e3));
        }
      } else if (y === "reset") (await fe(t), D(I18N_T("Partia zresetowana – talia będzie przetasowana od nowa.")));
      else if (y === "delete") {
        if (
          !(await nt({
            title: I18N_T("Usunąć grę?"),
            text: I18N_T(
              "Gra „{}” razem ze wszystkimi kartami zostanie trwale usunięta z tego urządzenia. Jeśli nie masz kopii zapasowej, nie da się tego cofnąć.",
              r.value,
            ),
            buttons: [
              { label: I18N_T("Usuń grę"), value: !0, kind: "danger" },
              { label: I18N_T("Anuluj"), value: null, kind: "ghost" },
            ],
          }))
        )
          return;
        (await ie(t), K("#/"));
      }
    }
    return (
      m(),
      async () => {
        for (let y of a.values()) URL.revokeObjectURL(y);
        coverUrl && URL.revokeObjectURL(coverUrl);
        try {
          await ft(t);
        } catch (y) {
          console.error(y);
        }
      }
    );
  }
  var APP_VER = "2026.11.20-v19";
  function showUpd() {
    if (document.querySelector(".upd-bar")) return;
    let ub = d(
      "div",
      { class: "upd-bar", role: "status" },
      d("span", { class: "grow" }, I18N_T("Dostępna nowa wersja aplikacji.")),
      d("button", { type: "button", class: "btn primary tb", onclick: () => location.reload() }, I18N_T("Odśwież")),
      G("x", I18N_T("Ukryj"), () => ub.remove(), "small"),
    );
    document.body.append(ub);
  }
  "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
    (() => {
      let hadCtl = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        hadCtl && showUpd();
      });
      navigator.serviceWorker.addEventListener("message", (ev) => {
        ev.data && ev.data.type === "update" && showUpd();
      });
      navigator.serviceWorker
        .register("sw.js")
        .then((t) => {
          t.addEventListener("updatefound", () => {
            let e = t.installing;
            e?.addEventListener("statechange", () => {
              e.state === "installed" && navigator.serviceWorker.controller && showUpd();
            });
          });
        })
        .catch((t) => console.warn("Service worker:", t));
    })();
  Bt();
})();
