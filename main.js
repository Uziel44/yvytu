/**
 * YVYTU Filtros
 * Efeitos baseados na landing da Electro Test (Lenis + GSAP), em script
 * clássico para o site abrir direto pelo arquivo, sem servidor nem build.
 */
(() => {
  "use strict";

  window.yvytuPronto = true;

  const html = document.documentElement;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const animar = Boolean(gsap && ScrollTrigger) && !reduzido;

  if (animar) gsap.registerPlugin(ScrollTrigger);
  else html.classList.remove("anim");

  /* ---------------------------------------------------------------- scroll */
  const lenis =
    !reduzido && window.Lenis
      ? new window.Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          autoRaf: true,
          syncTouch: false,
        })
      : null;

  if (lenis && animar) lenis.on("scroll", ScrollTrigger.update);

  const header = $("[data-header]");
  const alturaTopo = () => (window.innerWidth <= 640 ? 64 : 72);

  function rolarPara(alvo) {
    let destino = 0;
    if (alvo !== 0 && alvo.id !== "inicio") {
      // nas seções, o título fica logo abaixo do menu (sem o respiro inteiro)
      const respiro = alvo.classList.contains("section")
        ? parseFloat(getComputedStyle(alvo).paddingTop) - 32
        : -24;
      destino = Math.max(0, alvo.getBoundingClientRect().top + window.scrollY - alturaTopo() + respiro);
    }
    if (lenis) lenis.scrollTo(destino, { duration: 1.2 });
    else window.scrollTo({ top: destino, behavior: reduzido ? "auto" : "smooth" });
  }

  const barra = $("[data-progress]");
  const botaoTopo = $("[data-to-top]");
  let marcado = false;

  function aoRolar() {
    const y = window.scrollY;
    const max = html.scrollHeight - window.innerHeight;
    header.dataset.scrolled = String(y > 40);
    barra.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    botaoTopo.dataset.visible = String(y > window.innerHeight * 0.75);
    marcado = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (marcado) return;
      marcado = true;
      requestAnimationFrame(aoRolar);
    },
    { passive: true },
  );
  aoRolar();

  /* ------------------------------------------------------------- mega menu */
  const gatilhos = $$("[data-mega]");
  const paineis = $$("[data-panel]");
  const veu = $("[data-scrim]");
  let aberto = null;
  let abertoPor = null;
  let espera = 0;

  function abrirMega(id, como) {
    clearTimeout(espera);
    aberto = id;
    abertoPor = como;
    gatilhos.forEach((g) => g.setAttribute("aria-expanded", String(g.dataset.mega === id)));
    paineis.forEach((p) => p.classList.toggle("is-open", p.dataset.panel === id));
    veu.classList.add("is-on");
  }

  function fecharMega() {
    clearTimeout(espera);
    aberto = null;
    abertoPor = null;
    gatilhos.forEach((g) => g.setAttribute("aria-expanded", "false"));
    paineis.forEach((p) => p.classList.remove("is-open"));
    veu.classList.remove("is-on");
  }

  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  gatilhos.forEach((gatilho) => {
    const id = gatilho.dataset.mega;

    gatilho.addEventListener("click", () => {
      if (aberto === id && abertoPor === "clique") fecharMega();
      else abrirMega(id, "clique");
    });

    // seta para baixo entra no painel
    gatilho.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown") return;
      e.preventDefault();
      abrirMega(id, "clique");
      const painel = $(`[data-panel="${id}"]`);
      setTimeout(() => $("a", painel)?.focus(), 60);
    });

    if (temMouse) {
      gatilho.addEventListener("mouseenter", () => {
        clearTimeout(espera);
        espera = setTimeout(() => abrirMega(id, "mouse"), aberto ? 40 : 140);
      });
    }
  });

  if (temMouse) {
    header.addEventListener("mouseleave", () => {
      clearTimeout(espera);
      espera = setTimeout(fecharMega, 220);
    });
    paineis.forEach((p) => p.addEventListener("mouseenter", () => clearTimeout(espera)));
    $$(".tools, [data-nav], .logo").forEach((el) =>
      el.addEventListener("mouseenter", () => {
        clearTimeout(espera);
        espera = setTimeout(fecharMega, 120);
      }),
    );
  }

  veu.addEventListener("click", fecharMega);
  header.addEventListener("focusout", (e) => {
    if (e.relatedTarget && !header.contains(e.relatedTarget)) fecharMega();
  });

  /* ------------------------------------------------------------- acordeão */
  const imagemGaleria = $("[data-gallery-image]");
  const legendaGaleria = $("[data-gallery-caption]");
  let troca = 0;

  function trocarImagem(gatilho) {
    const { img, alt, caption } = gatilho.dataset;
    if (!img || !imagemGaleria) return;
    clearTimeout(troca);
    if (imagemGaleria.getAttribute("src") === img) {
      imagemGaleria.classList.remove("is-swapping");
      return;
    }
    imagemGaleria.classList.add("is-swapping");
    troca = setTimeout(() => {
      imagemGaleria.src = img;
      imagemGaleria.alt = alt;
      legendaGaleria.textContent = caption;
      imagemGaleria
        .decode()
        .catch(() => {})
        .finally(() => imagemGaleria.classList.remove("is-swapping"));
    }, 250);
  }

  function definirItem(gatilho, abrir) {
    gatilho.setAttribute("aria-expanded", String(abrir));
    if (abrir) trocarImagem(gatilho);
  }

  $$("[data-accordion]").forEach((grupo) => {
    const itens = $$(".acc-trigger", grupo);

    itens.forEach((gatilho, i) => {
      gatilho.addEventListener("click", () => {
        const abrir = gatilho.getAttribute("aria-expanded") !== "true";
        itens.forEach((outro) => outro !== gatilho && definirItem(outro, false));
        definirItem(gatilho, abrir);
        if (animar) setTimeout(() => ScrollTrigger.refresh(), 500);
      });

      gatilho.addEventListener("keydown", (e) => {
        const destino = {
          ArrowDown: (i + 1) % itens.length,
          ArrowUp: (i - 1 + itens.length) % itens.length,
          Home: 0,
          End: itens.length - 1,
        }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        itens[destino].focus();
      });
    });
  });

  function abrirLinha(chave) {
    const itens = $$("[data-catalog] .acc-trigger");
    itens.forEach((g) => definirItem(g, g.dataset.key === chave));
    if (animar) setTimeout(() => ScrollTrigger.refresh(), 500);
  }

  // pré-carrega as fotos da galeria para a troca ser instantânea
  window.addEventListener("load", () => {
    $$("[data-catalog] [data-img]").forEach((g) => {
      new Image().src = g.dataset.img;
    });
  });

  /* -------------------------------------------------------------- janelas */
  const dialogos = $$("dialog");

  function fecharDialogos() {
    dialogos.forEach((d) => d.open && d.close());
  }

  function abrirDialogo(nome) {
    const dlg = $(`#dlg-${nome}`);
    if (!dlg) return;
    fecharMega();
    fecharDialogos();
    dlg.showModal();
    lenis?.stop();
    html.style.overflow = "hidden";
    if (nome === "busca") {
      campo.value = "";
      buscar("");
      // no celular não abre o teclado sozinho, para as sugestões ficarem à vista
      if (window.matchMedia("(pointer: fine)").matches) campo.focus();
    }
  }

  function liberarRolagem() {
    if (dialogos.some((d) => d.open)) return;
    lenis?.start();
    html.style.overflow = "";
  }

  dialogos.forEach((dlg) => {
    dlg.addEventListener("close", liberarRolagem);
    // clique no fundo escuro fecha
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  /* ---------------------------------------------------------------- busca */
  const campo = $("[data-search-input]");
  const resultados = $("[data-search-results]");
  const estado = $("[data-search-status]");
  const normalizar = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

  const indice = [];
  const extras = {
    mantas: "manta rolo",
    grossos: "grosso pre-filtro",
    finos: "fino",
    absolutos: "absoluto hepa",
    complementos: "complemento caixa acessorio",
  };

  $$("[data-catalog] .acc-item").forEach((item) => {
    const gatilho = $(".acc-trigger", item);
    const familia = gatilho.firstChild.textContent.trim();
    $$(".lines li", item).forEach((li) => {
      indice.push({
        titulo: $("strong", li).textContent,
        texto: $("span", li).textContent,
        grupo: familia,
        extra: extras[gatilho.dataset.key],
        linha: gatilho.dataset.key,
        item: li,
      });
    });
  });

  /* sugestões: categorias (tiradas do catálogo) e filtros mais procurados */
  const sugestoes = $("[data-search-suggest]");
  let destaque = 0;

  function irParaCategoria(chave) {
    fecharDialogos();
    liberarRolagem();
    abrirLinha(chave);
    rolarPara($("#linhas"));
  }

  // abre a categoria, rola até a linha e pisca o item
  function irParaLinha(chave, li) {
    fecharDialogos();
    liberarRolagem();
    abrirLinha(chave);
    // espera o acordeão terminar de abrir para medir a posição certa
    setTimeout(() => {
      const caixa = li.getBoundingClientRect();
      const y = Math.max(0, caixa.top + window.scrollY - (window.innerHeight - caixa.height) / 2);
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: reduzido ? "auto" : "smooth" });

      clearTimeout(destaque);
      $$(".lines li.is-found").forEach((outro) => outro.classList.remove("is-found"));
      li.classList.add("is-found");
      li.setAttribute("tabindex", "-1");
      li.focus({ preventScroll: true });
      destaque = setTimeout(() => li.classList.remove("is-found"), 3500);
    }, reduzido ? 0 : 520);
  }

  $$("[data-catalog] .acc-item").forEach((item, i) => {
    const gatilho = $(".acc-trigger", item);
    const li = document.createElement("li");
    li.style.setProperty("--i", i);
    const botao = document.createElement("button");
    botao.type = "button";
    botao.dataset.verCategoria = gatilho.dataset.key;
    const total = document.createElement("span");
    total.textContent = $$(".lines li", item).length;
    botao.append(gatilho.firstChild.textContent.trim(), total);
    botao.addEventListener("click", () => irParaCategoria(gatilho.dataset.key));
    li.append(botao);
    $("[data-search-cats]").append(li);
  });

  $$("[data-ver-linha]").forEach((botao) => {
    const li = $(`[data-catalog] img[src="img/linhas/${botao.dataset.verLinha}.jpg"]`)?.closest("li");
    if (!li) return;
    const chave = $(".acc-trigger", li.closest(".acc-item")).dataset.key;
    botao.addEventListener("click", () => irParaLinha(chave, li));
  });

  $$(".industries h3").forEach((h) => {
    indice.push({ titulo: h.textContent, texto: "Indústria atendida pela YVYTU", grupo: "Indústrias", destino: "#industrias" });
  });

  $$(".news article").forEach((card) => {
    indice.push({
      titulo: $("h3", card).textContent,
      texto: $("p", card).textContent,
      grupo: "Conheça melhor",
      janela: $("[data-open]", card).dataset.open,
    });
  });

  indice.push(
    { titulo: "Filtros multibolsas", texto: "Classes G3 a F9, de 3 a 8 ou mais sacolas", grupo: "Multibolsas", extra: "bolsa sacola g3 g4 f5 f6 f7 f8 f9", destino: "#destaque" },
    { titulo: "Sobre a YVYTU", texto: "ISO 9001:2015 e norma ABNT NBR 7256", grupo: "Empresa", extra: "qualidade certificacao norma", destino: "#sobre" },
    { titulo: "Fale conosco", texto: "Telefone e WhatsApp", grupo: "Contato", extra: "orcamento endereco", janela: "contato" },
  );

  indice.forEach((item) => {
    item.palheiro = normalizar(`${item.titulo} ${item.texto} ${item.grupo} ${item.extra || ""}`);
  });

  function buscar(consulta) {
    const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
    resultados.replaceChildren();

    if (!termos.length) {
      estado.textContent = "";
      sugestoes.hidden = false;
      return;
    }

    const achados = indice.filter((item) => termos.every((t) => item.palheiro.includes(t)));
    // sem resultados, as sugestões voltam para ajudar
    sugestoes.hidden = achados.length > 0;

    estado.textContent = achados.length
      ? `${achados.length} ${achados.length === 1 ? "resultado" : "resultados"}`
      : `Nada encontrado para “${consulta.trim()}”. Tente “manta”, “HEPA” ou “carvão”.`;

    achados.forEach((item) => {
      const li = document.createElement("li");
      const botao = document.createElement("button");
      botao.type = "button";
      for (const [tag, texto] of [["strong", item.titulo], ["em", item.grupo], ["span", item.texto]]) {
        const el = document.createElement(tag);
        el.textContent = texto;
        botao.append(el);
      }
      botao.addEventListener("click", () => {
        if (item.linha) return irParaLinha(item.linha, item.item);
        fecharDialogos();
        liberarRolagem();
        if (item.janela) return abrirDialogo(item.janela);
        rolarPara($(item.destino));
      });
      li.append(botao);
      resultados.append(li);
    });
  }

  campo.addEventListener("input", () => buscar(campo.value));
  campo.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    // sem isto, o Enter "clica" de novo no botão que recebe o foco ao fechar
    e.preventDefault();
    $("button", resultados)?.click();
  });

  /* -------------------------------------------------------------- cliques */
  document.addEventListener("click", (e) => {
    if (aberto && !header.contains(e.target) && e.target !== veu) fecharMega();

    if (e.target.closest("[data-close]")) {
      e.target.closest("dialog").close();
      liberarRolagem();
      return;
    }

    if (e.target.closest("[data-top]")) {
      rolarPara(0);
      return;
    }

    const abre = e.target.closest("[data-open]");
    if (abre) {
      e.preventDefault();
      abrirDialogo(abre.dataset.open);
      return;
    }

    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    const alvo = href.length > 1 && $(href);
    if (!alvo) return;

    e.preventDefault();
    if (link.dataset.line) abrirLinha(link.dataset.line);
    fecharMega();
    fecharDialogos();
    liberarRolagem();
    if (link.classList.contains("skip")) {
      alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
    }
    rolarPara(alvo);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !aberto) return;
    const gatilho = $(`[data-mega="${aberto}"]`);
    fecharMega();
    gatilho.focus();
  });

  /* ------------------------------------------------------------ scrollspy */
  const mapaNav = {
    produtos: $('[data-mega="produtos"]'),
    industrias: $('[data-mega="industrias"]'),
    sobre: $('[data-mega="sobre"]'),
    saiba: $('[data-nav="saiba"]'),
  };

  const espiao = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        Object.values(mapaNav).forEach((n) => n.removeAttribute("aria-current"));
        mapaNav[entrada.target.dataset.spy]?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  $$("[data-spy]").forEach((secao) => espiao.observe(secao));

  $("[data-year]").textContent = new Date().getFullYear();

  /* ------------------------------------------- passos do multibolsa */
  const bolsas = $$("[data-bags-art] span");
  const legendaBolsas = $("[data-bags-caption]");
  const opcoesBolsas = $$("[data-bags]");
  const acabamentos = $$("[data-finish]");
  let demoBolsas = 0;
  let demoAcabamento = 0;

  function mostrarBolsas(n) {
    bolsas.forEach((bolsa, i) => bolsa.classList.toggle("is-off", i >= n));
    opcoesBolsas.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.bags) === n)));
    legendaBolsas.textContent = n === 8 ? "8 sacolas ou mais" : `${n} sacolas`;
  }

  function escolherAcabamento(escolhido) {
    acabamentos.forEach((b, i) => b.setAttribute("aria-pressed", String(i === escolhido)));
  }

  // demonstração: roda uma única vez; para assim que a pessoa clica
  function demonstrar(passos, intervalo, aplicar) {
    let i = 0;
    aplicar(passos[0]);
    const relogio = setInterval(() => {
      i += 1;
      aplicar(passos[i]);
      if (i >= passos.length - 1) clearInterval(relogio);
    }, intervalo);
    return relogio;
  }

  opcoesBolsas.forEach((botao) =>
    botao.addEventListener("click", () => {
      clearInterval(demoBolsas);
      legendaBolsas.setAttribute("aria-live", "polite");
      mostrarBolsas(Number(botao.dataset.bags));
    }),
  );

  acabamentos.forEach((botao, i) =>
    botao.addEventListener("click", () => {
      clearInterval(demoAcabamento);
      escolherAcabamento(i);
    }),
  );

  if (!reduzido) {
    const verPassos = new IntersectionObserver(
      (entradas, obs) => {
        entradas.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          target.classList.add("is-visible");
          if ($("[data-bags-art]", target)) demoBolsas = demonstrar([3, 4, 5, 6, 8], 850, mostrarBolsas);
          if ($("[data-finish]", target)) demoAcabamento = demonstrar([0, 1, 2, 0], 900, escolherAcabamento);
          obs.unobserve(target);
        });
      },
      { threshold: 0.55 },
    );
    $$(".step").forEach((cartao) => verPassos.observe(cartao));
  }

  if (!animar) return;

  /* ---------------------------------------------- linha dos passos */
  gsap.fromTo(
    "[data-steps-fill]",
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: ".steps-wrap", start: "top 85%", end: "top 30%", scrub: 0.6 },
    },
  );

  /* ---------------------------------------------------- entrada do hero */
  const imagemHero = $("[data-hero-image]");

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .fromTo(imagemHero, { scale: 1.16 }, { scale: 1.05, duration: 2.2 }, 0)
    .fromTo("[data-hero-card]", { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.15)
    .fromTo("[data-hero-item]", { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 0.35);

  /* --------------------------------------------------- revelar ao rolar */
  const DE = {
    up: { y: 48, opacity: 0 },
    left: { x: -56, opacity: 0 },
    right: { x: 56, opacity: 0 },
  };

  const soltos = $$("[data-reveal]").filter((el) => !el.closest("[data-reveal-group]"));
  const grupos = $$("[data-reveal-group]");
  const pequeno = window.innerWidth < 900;

  const filhosDe = (el) => (el.hasAttribute("data-reveal-group") ? $$("[data-reveal]", el) : [el]);

  soltos.forEach((el) => {
    // no celular os blocos laterais entram de baixo, para não alargar a página
    const direcao = pequeno ? "up" : el.dataset.reveal || "up";
    gsap.set(el, DE[direcao] || DE.up);
  });
  grupos.forEach((g) => gsap.set($$("[data-reveal]", g), DE.up));

  function revelar(el) {
    if (el.dataset.revelado) return;
    el.dataset.revelado = "1";
    gsap.to(filhosDe(el), {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      clearProps: "transform",
    });
  }

  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        revelar(entrada.target);
        obs.unobserve(entrada.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
  );
  [...soltos, ...grupos].forEach((el) => observador.observe(el));

  // rede de segurança: só o que já está na tela (o resto anima ao chegar)
  window.addEventListener("load", () => {
    setTimeout(() => {
      [...soltos, ...grupos].forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) revelar(el);
      });
    }, 1500);
    ScrollTrigger.refresh();
  });

  /* ----------------------------------------------------------- contadores */
  $$("[data-counter]").forEach((el) => {
    const alvo = Number(el.dataset.counter);
    const valor = { n: 0 };
    el.textContent = "0";
    gsap.to(valor, {
      n: alvo,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top bottom", once: true },
      onUpdate: () => {
        el.textContent = Math.round(valor.n);
      },
    });
  });

  /* ------------------------------------------------------------- parallax */
  gsap.matchMedia().add("(min-width: 1024px)", () => {
    gsap.fromTo(
      imagemHero,
      { yPercent: 0 },
      {
        yPercent: 9,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      },
    );

    $$("[data-parallax]").forEach((el) => {
      const força = Number(el.dataset.parallax);
      gsap.set(el, { scale: 1 + força * 1.6 });
      gsap.fromTo(
        el,
        { yPercent: -força * 60 },
        {
          yPercent: força * 60,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
  });
})();
