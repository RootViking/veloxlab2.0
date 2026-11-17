/* Commitment visibility: the limited-spots lines and the guarantee lines.
   showLimitedSpots and showGuarantees in the config are the production switches.
   Off the production host the lines stay visible so a preview can be reviewed.
   ?preview=1 forces them on. ?preview=0 forces them off. */
(function (root) {
  function visible(switchOn, opts) {
    if (opts.preview === "1") return true;
    if (opts.preview === "0") return false;
    if (switchOn === true) return true;
    var host = opts.hostname || "";
    return host !== "veloxlab.studio" && host !== "www.veloxlab.studio";
  }

  function limitedSpotsVisible(options) {
    var opts = options || {};
    return visible(opts.showLimitedSpots, opts);
  }

  function guaranteesVisible(options) {
    var opts = options || {};
    return visible(opts.showGuarantees, opts);
  }

  var api = { limitedSpotsVisible: limitedSpotsVisible, guaranteesVisible: guaranteesVisible };
  root.VELOX_COMMITMENTS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
