# BlueStorm LAN reel model

The homepage presents this model with scroll-controlled cable pull, sway, and RJ45 close-up. The current editable source and media assets are:

- `bluestorm-lan-reel-detailed.blend`: current Blender scene with packed wood texture and animation.
- `bluestorm-lan-reel.blend`: earlier local scene, retained separately.
- `../public/models/bluestorm-lan-reel.glb`: web asset with one 180-frame animation at 30 fps.
- `../public/models/bluestorm-lan-reel.png`: closed reel poster.
- `bluestorm-cable-pulled.png`, `bluestorm-cable-sway.png`, `bluestorm-rj45-detail.png`: inspection renders.

In Blender, use the timeline: frame 1 is wound, 32 is partly pulled, 64 is fully pulled, 88 and 112 sway in opposite directions, 136 settles, and 180 retracts. `PullableOuterCable` has four shape keys (`HalfPull`, `FullPull`, `SwayLeft`, `SwayRight`). The `RJ45Connector` and `SpoolAssembly` transforms are keyed to stay coordinated with the cable.

The GLB includes one animation with morph weights plus connector translation/rotation and reel rotation. The website scrubs the animation with scroll and aligns the plug to the morphed cable tip on each frame so their different interpolation tracks cannot separate. The connector has eight contacts and conductor colors in T568B order.

The model is an image-based product visualization, not a dimensional CAD specification.
