(() => {
	// El iframe tiene su propio viewport para activar los breakpoints de Bootstrap.
	if (window.self !== window.top) return;
	const toolbar = document.createElement("nav");
	toolbar.className = "bg-body-tertiary border-bottom px-3 py-2 d-flex justify-content-end";
	toolbar.setAttribute("aria-label", "Vista previa del proyecto");
	toolbar.innerHTML = '<button type="button" class="btn btn-outline-primary btn-sm"><i class="bi bi-phone me-2" aria-hidden="true"></i>Ver versión móvil</button>';
	document.body.prepend(toolbar);
	const trigger = toolbar.querySelector("button");
	trigger.addEventListener("click", () => {
		const preview = document.createElement("section");
		preview.className = "position-fixed top-0 start-0 w-100 h-100 bg-body-tertiary d-flex flex-column z-3";
		preview.setAttribute("role", "dialog");
		preview.setAttribute("aria-modal", "true");
		preview.setAttribute("aria-label", "Vista previa móvil");
		preview.innerHTML = `
			<div class="bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
				<span class="fw-semibold"><i class="bi bi-phone me-2" aria-hidden="true"></i>Vista móvil · 390 px</span>
				<button type="button" class="btn btn-outline-primary btn-sm"><i class="bi bi-display me-2" aria-hidden="true"></i>Volver a escritorio</button>
			</div>
			<div class="flex-grow-1 overflow-auto p-2 p-sm-3">
				<iframe width="390" height="700" class="d-block mx-auto h-100 mw-100 border rounded-4 bg-white shadow" title="Versión móvil del proyecto"></iframe>
			</div>`;
		const background = [...document.body.children];
		const previousInert = background.map((element) => element.inert);
		const wasOverflowHidden = document.body.classList.contains("overflow-hidden");
		background.forEach((element) => { element.inert = true; });
		document.body.classList.add("overflow-hidden");
		document.body.append(preview);
		preview.querySelector("iframe").src = window.location.href;
		const close = () => {
			preview.remove();
			background.forEach((element, index) => { element.inert = previousInert[index]; });
			if (!wasOverflowHidden) document.body.classList.remove("overflow-hidden");
			window.removeEventListener("keydown", onKeydown);
			trigger.focus();
		};
		const onKeydown = (event) => { if (event.key === "Escape") close(); };
		const closeButton = preview.querySelector("button");
		closeButton.addEventListener("click", close);
		window.addEventListener("keydown", onKeydown);
		closeButton.focus();
	});
})();
