# BlueStorm LAN reel model

The homepage presents this model with scroll-controlled cable pull, sway, and a close-up of the exposed twisted pairs. The current editable source and media assets are:

- `bluestorm-lan-reel-detailed.blend`: current Blender scene with packed wood texture and animation.
- `bluestorm-lan-reel.blend`: earlier local scene, retained separately.
- `../public/models/bluestorm-lan-reel.glb`: web asset with one 180-frame animation at 30 fps.
- `../public/models/bluestorm-lan-reel.png`: closed reel poster.
- `bluestorm-cable-pulled.png`, `bluestorm-cable-sway.png`, `bluestorm-twisted-pairs-detail.png`: inspection renders.

In Blender, use the timeline: frame 1 is wound, 32 is partly pulled, 64 is fully pulled, 88 and 112 sway in opposite directions, 136 settles, and 180 retracts. `PullableOuterCable` has four shape keys (`HalfPull`, `FullPull`, `SwayLeft`, `SwayRight`). The `CableCutaway` and `SpoolAssembly` transforms are keyed to stay coordinated with the cable.

The GLB includes one animation with morph weights plus cable tip translation/rotation and reel rotation. The website scrubs the animation with scroll and aligns the exposed cutaway to the morphed cable tip on each frame. The cutaway shows a black jacket, foil, woven shield, inner separator, four twisted pairs and eight exposed copper cores.

The model is an image-based product visualization, not a dimensional CAD specification.
