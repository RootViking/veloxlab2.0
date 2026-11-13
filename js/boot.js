/* Runs before first paint: lets CSS know scripts are on, with a safety net
   so the hero never stays hidden if a later script fails.
   ?og renders the hero as a still for the social preview image (assets/og.jpg). */
document.documentElement.classList.add("js");
if (/[?&]og\b/.test(location.search)) document.documentElement.classList.add("og-shot", "is-loaded");
setTimeout(function () { document.documentElement.classList.add("is-loaded"); }, 7000);
