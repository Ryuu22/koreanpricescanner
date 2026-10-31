// Ad slots (Kakao AdFit). Paste the unit IDs ("DAN-...") from adfit.kakao.com once the
// site is approved. Leave an ID empty and that slot stays hidden.
(function () {
  "use strict";

  const SLOTS = {
    "ad-top": {
      pc: { unit: "", width: 728, height: 90 },
      mobile: { unit: "", width: 320, height: 100 },
    },
  };

  const mobile = window.matchMedia("(max-width: 760px)").matches;
  let used = false;
  for (const [id, sizes] of Object.entries(SLOTS)) {
    const slot = document.getElementById(id);
    const ad = mobile ? sizes.mobile : sizes.pc;
    if (!slot || !ad.unit) continue;
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.dataset.adUnit = ad.unit;
    ins.dataset.adWidth = ad.width;
    ins.dataset.adHeight = ad.height;
    slot.appendChild(ins);
    slot.classList.add("on");
    used = true;
  }
  if (used) {
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/kas/static/ba.min.js";
    s.async = true;
    document.body.appendChild(s);
  }
})();
