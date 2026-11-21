/* Load magnitude is the member body; force direction is a blue/red end band. */
(function(root){
  "use strict";
  function color(r){return r<.5?0x4caf50:r<.8?0xffc107:r<1?0xff5722:0xb71c1c;}
  function update(entry,info,enabled,highlight){
    const broken=!!(info&&info.broken), slack=!!(info&&info.slack);
    const ratio=info?(Number.isFinite(info.ratio)?info.ratio:info.peak||0):0;
    entry.material.color.setHex(broken?0xb71c1c:slack?0x9e9e9e:enabled&&info?color(ratio):entry.baseColor);
    entry.material.emissive.setHex(highlight?0x392507:0x000000);
    entry.bandMaterial.color.setHex(info&&(info.mode==="tension"||info.fs>=0)?0x2e7dd1:0xd2452f);
    entry.bands.forEach(m=>m.visible=!!(enabled&&info&&!slack&&!broken));
  }
  root.Stress3D={color,update};
})(typeof self!=="undefined"?self:this);
