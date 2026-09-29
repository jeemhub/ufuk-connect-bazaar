"""Build the BlueStorm cable reel in a separate Blender scene and export a web GLB.

Run from the Blender MCP code tool with:
    exec(compile(open('/Users/JeemHome/ufuk/ufuk-connect-bazaar/scripts/build_bluestorm_reel.py').read(),
                 'build_bluestorm_reel.py', 'exec'))
"""

import bpy
import math
import os
import random
from mathutils import Vector


ROOT = "/Users/JeemHome/ufuk/ufuk-connect-bazaar"
GLB_PATH = os.path.join(ROOT, "public/models/bluestorm-lan-reel.glb")
BLEND_PATH = os.path.join(ROOT, "assets/bluestorm-lan-reel-detailed.blend")
POSTER_PATH = os.path.join(ROOT, "public/models/bluestorm-lan-reel.png")
PULL_PREVIEW_PATH = os.path.join(ROOT, "assets/bluestorm-cable-pulled.png")
SWAY_PREVIEW_PATH = os.path.join(ROOT, "assets/bluestorm-cable-sway.png")
PAIR_PREVIEW_PATH = os.path.join(ROOT, "assets/bluestorm-twisted-pairs-detail.png")
WOOD_TEX_PATH = os.path.join(ROOT, "assets/bluestorm-wood-grain.png")

os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)

old = bpy.data.scenes.get("BlueStorm Product Studio")
if old:
    old_collection = bpy.data.collections.get("BlueStorm LAN Reel")
    bpy.data.scenes.remove(old)
    if old_collection:
        for old_object in list(old_collection.objects):
            bpy.data.objects.remove(old_object, do_unlink=True)
        bpy.data.collections.remove(old_collection)
scene = bpy.data.scenes.new("BlueStorm Product Studio")
bpy.context.window.scene = scene
scene.unit_settings.system = "METRIC"
collection = bpy.data.collections.new("BlueStorm LAN Reel")
scene.collection.children.link(collection)


def material(name, color, metallic=0.0, roughness=0.6, alpha=1.0, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
    return mat


wood = material("Birch plywood / natural grain", (0.58, 0.39, 0.22), roughness=0.79)
wood_edge = material("Plywood cut edge", (0.39, 0.25, 0.14), roughness=0.86)
wood_light = material("Plywood grain highlight", (0.69, 0.48, 0.27), roughness=0.83)
navy = material("BlueStorm deep navy print", (0.012, 0.035, 0.11), roughness=0.94)
black = material("Outdoor LAN cable / textured black jacket", (0.008, 0.014, 0.023), roughness=0.61)
black_highlight = material("Cable seam", (0.06, 0.08, 0.11), roughness=0.51)
metal = material("Brushed steel axle fittings", (0.43, 0.49, 0.53), metallic=0.82, roughness=0.31)
label_mat = material("Product sticker", (0.89, 0.9, 0.88), roughness=0.78)
silver_foil = material("Aluminum foil shielding", (0.52, 0.58, 0.61), metallic=0.86, roughness=0.38)
silver_braid = material("Woven tinned copper shield", (0.65, 0.69, 0.70), metallic=0.84, roughness=0.36)
inner_sleeve = material("Pale inner cable separator", (0.74, 0.77, 0.73), roughness=0.76)
copper = material("Exposed copper conductor", (0.77, 0.37, 0.12), metallic=0.74, roughness=0.32)
pair_materials = [
    ("Blue", material("Blue pair insulation", (0.025, 0.16, 0.66), roughness=0.48),
     material("White blue pair insulation", (0.84, 0.87, 0.82), roughness=0.53)),
    ("Orange", material("Orange pair insulation", (0.94, 0.34, 0.025), roughness=0.48),
     material("White orange pair insulation", (0.89, 0.87, 0.80), roughness=0.53)),
    ("Green", material("Green pair insulation", (0.025, 0.44, 0.11), roughness=0.48),
     material("White green pair insulation", (0.85, 0.89, 0.82), roughness=0.53)),
    ("Brown", material("Brown pair insulation", (0.38, 0.17, 0.065), roughness=0.48),
     material("White brown pair insulation", (0.86, 0.83, 0.77), roughness=0.53)),
]


def make_wood_texture():
    """Image based grain survives glTF export; the previous procedural look did not."""
    size = 1024
    image = bpy.data.images.new("BlueStorm birch grain atlas", width=size, height=size, alpha=True)
    pixels = [0.0] * (size * size * 4)
    for j in range(size):
        z = (j / (size - 1) - 0.5) * 2
        for i in range(size):
            x = (i / (size - 1) - 0.5) * 2
            radial = math.sqrt(x * x + z * z)
            direction = x * 11.0 + math.sin(z * 4.6 + x * 2.0) * 0.75
            grain = math.sin(direction + 0.35 * math.sin(radial * 26))
            fine = math.sin(x * 83 + z * 11 + 1.1 * math.sin(z * 18))
            knots = math.exp(-((x + 0.27) ** 2 / 0.012 + (z - 0.36) ** 2 / 0.005))
            variation = 0.044 * grain + 0.013 * fine - 0.055 * knots
            variation += 0.018 * math.sin(3 * x + 2 * z) * math.sin(5 * z - 4 * x)
            speckle = 0.006 * math.sin(i * 12.9898 + j * 78.233)
            v = variation + speckle
            k = (j * size + i) * 4
            pixels[k:k + 4] = (max(0.05, 0.59 + v), max(0.05, 0.405 + v * 0.82),
                                max(0.05, 0.246 + v * 0.54), 1.0)
    image.pixels.foreach_set(pixels)
    image.filepath_raw = WOOD_TEX_PATH
    image.file_format = "PNG"
    image.save()
    image.pack()
    texture = wood.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    wood.node_tree.links.new(texture.outputs["Color"], wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
    return image


make_wood_texture()


def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.13
    obj.location = location
    if parent:
        obj.parent = parent
    return obj


reel_root = empty("ReelRoot")
spool_body_root = empty("SpoolAssembly", reel_root)
front_root = empty("FrontFlange", spool_body_root)
back_root = empty("BackFlange", spool_body_root)
cutaway_root = empty("CableCutaway", reel_root, (2.24, -0.54, -0.91))


def mesh_object(name, verts, faces, mat, parent=None):
    data = bpy.data.meshes.new(name + " mesh")
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    for poly in data.polygons:
        poly.use_smooth = True
    return obj


def annulus(name, y, outer, inner, depth, mat, parent, segments=96):
    verts = []
    for yy, radius in ((y - depth / 2, outer), (y - depth / 2, inner),
                       (y + depth / 2, outer), (y + depth / 2, inner)):
        for i in range(segments):
            a = i * 2 * math.pi / segments
            verts.append((radius * math.cos(a), yy, radius * math.sin(a)))
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.extend([
            (i, j, segments + j, segments + i),
            (2 * segments + j, 2 * segments + i, 3 * segments + i, 3 * segments + j),
            (i, 2 * segments + i, 2 * segments + j, j),
            (segments + j, 3 * segments + j, 3 * segments + i, segments + i),
        ])
    obj = mesh_object(name, verts, faces, mat, parent)
    uv = obj.data.uv_layers.new(name="Wood face UV")
    for polygon in obj.data.polygons:
        for loop_index in polygon.loop_indices:
            vertex = obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
            uv.data[loop_index].uv = (vertex.x / (outer * 2) + 0.5,
                                      vertex.z / (outer * 2) + 0.5)
    if name in ("FrontPlywood", "BackPlywood"):
        bevel = obj.modifiers.new("Soft machined plywood rim", "BEVEL")
        bevel.width = 0.016
        bevel.segments = 3
        obj.modifiers.new("Weighted rim normals", "WEIGHTED_NORMAL")
    return obj


def box(name, location, scale, mat, parent, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Soft edges", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, mat, parent, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location,
                                        rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def tube_vertices(points, radius, sides=8):
    verts = []
    for k, p in enumerate(points):
        tangent = Vector(points[min(k + 1, len(points) - 1)]) - Vector(points[max(k - 1, 0)])
        tangent.normalize()
        axis = Vector((0, 1, 0))
        if abs(tangent.dot(axis)) > 0.94:
            axis = Vector((1, 0, 0))
        normal = tangent.cross(axis).normalized()
        binormal = tangent.cross(normal).normalized()
        for j in range(sides):
            a = j * 2 * math.pi / sides
            v = Vector(p) + radius * (normal * math.cos(a) + binormal * math.sin(a))
            verts.append(tuple(v))
    return verts


def tube(name, points, radius, mat, parent, sides=8):
    verts = tube_vertices(points, radius, sides)
    faces = []
    for k in range(len(points)):
        if k:
            for j in range(sides):
                n = (j + 1) % sides
                faces.append(((k - 1) * sides + j, (k - 1) * sides + n,
                              k * sides + n, k * sides + j))
    faces.append(tuple(reversed(tuple(range(sides)))))
    faces.append(tuple((len(points) - 1) * sides + j for j in range(sides)))
    return mesh_object(name, verts, faces, mat, parent)


def text_mesh(name, value, location, size, mat, parent, align="LEFT"):
    data = bpy.data.curves.new(name + " text", "FONT")
    data.body = value
    data.size = size
    data.align_x = align
    # Flat ink keeps the printed lettering crisp and the web asset small.
    data.extrude = 0
    data.bevel_depth = 0
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(mat)
    obj.parent = parent
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object


# Two cut plywood flanges and the central drum. The through-hole remains real geometry.
annulus("FrontPlywood", -0.68, 1.72, 0.18, 0.135, wood, front_root)
annulus("FrontCutEdge", -0.68, 1.72, 1.685, 0.137, wood_edge, front_root)
annulus("FrontInnerRing", -0.755, 0.235, 0.18, 0.012, metal, front_root)
annulus("BackPlywood", 0.68, 1.72, 0.18, 0.135, wood, back_root)
annulus("BackCutEdge", 0.68, 1.72, 1.685, 0.137, wood_edge, back_root)
annulus("DrumCore", 0, 0.63, 0.18, 1.28, wood_edge, spool_body_root)
annulus("DarkAxleBore", 0, 0.179, 0.153, 1.52, black_highlight,
        spool_body_root, 64)

# Fine alternating layers on the cut rim make the flanges read as plywood,
# rather than a single smooth molded disc.
for side_name, root, center in (("Front", front_root, -0.68),
                                ("Back", back_root, 0.68)):
    for layer in range(5):
        y = center - 0.052 + layer * 0.026
        annulus("%sPlywoodPly_%02d" % (side_name, layer + 1), y,
                1.726, 1.704, 0.011,
                wood_light if layer % 2 else wood_edge, root, 96)

# Printed face art follows the reference layout.
text_mesh("BlueStormLogo", "BlueStorm", (-0.50, -0.759, 0.93), 0.33, navy, front_root)
text_mesh("BrandWebAddress", "www.blue-storm.ca", (-0.48, -0.761, 0.65), 0.12, navy, front_root)
text_mesh("LowerWebAddress", "www.blue-storm.ca", (0, -0.761, -1.31), 0.20,
          navy, front_root, "CENTER")
for n in range(3):
    pts = []
    for k in range(18):
        a = -1.15 + k * 2.3 / 17
        r = 0.25 + n * 0.073
        pts.append((-1.02 + r * math.cos(a), -0.762, 1.01 + r * math.sin(a)))
    tube("StormMarkArc_%d" % n, pts, 0.019, navy, front_root, 5)

# Sticker and four metal fasteners on the front flange.
box("ProductSticker", (-0.86, -0.759, -0.22), (0.77, 0.008, 0.32), label_mat, front_root, 0.016)
text_mesh("StickerBrand", "BlueStorm", (-1.20, -0.766, -0.15), 0.083, navy, front_root)
text_mesh("StickerDetail", "OUTDOOR LAN CABLE", (-1.20, -0.766, -0.27), 0.054, navy, front_root)
for x, z in ((-0.25, 0.30), (0.63, 0.26), (-0.36, -0.57), (0.61, -0.44)):
    cylinder("SteelRivet", (x, -0.765, z), 0.070, 0.025, metal, front_root, 24)
    cylinder("RivetCenter", (x, -0.784, z), 0.032, 0.009, black_highlight, front_root, 20)
    slot = box("ScrewDriveSlot", (x, -0.792, z), (0.042, 0.004, 0.007),
               black, front_root, 0.001)
    slot.rotation_euler[1] = 0.20 + x * 0.37

random.seed(47)
for i in range(24):
    x = -1.19 + i * 0.027
    w = 0.006 if i % 3 else 0.012
    box("LabelBarcode_%02d" % i, (x, -0.769, -0.344),
        (w, 0.002, 0.049 + random.random() * 0.014), black_highlight, front_root)

# The inner windings stay on the reel; the outer winding is one continuous,
# shape-keyed cable. Its last turn becomes the free end as it is pulled.
for layer in range(2):
    radius = 1.04 + layer * 0.12
    turns = 8
    count = turns * 64 + 1
    points = []
    for i in range(count):
        t = i / (count - 1)
        a = 2 * math.pi * turns * t + layer * 0.67
        y = -0.48 + 0.96 * (t if layer % 2 == 0 else 1 - t)
        points.append((radius * math.cos(a), y, radius * math.sin(a)))
    tube("BlackCableWinding_%d" % (layer + 1), points, 0.061, black, spool_body_root, 7)

COIL_SAMPLES = 8 * 56
TAIL_SAMPLES = 64
TOTAL_SAMPLES = COIL_SAMPLES + TAIL_SAMPLES + 1
CABLE_RADIUS = 1.28
EXIT_ANGLE = -0.55


def cubic(a, b, c, d, t):
    return (1 - t) ** 3 * Vector(a) + 3 * (1 - t) ** 2 * t * Vector(b) + 3 * (1 - t) * t * t * Vector(c) + t ** 3 * Vector(d)


def cable_end(pull, sway):
    return Vector((2.14 + 2.20 * pull, -0.54 + 0.44 * sway,
                   -0.91 - 0.25 * pull + 0.26 * sway))


def cable_path(pull, sway):
    remaining_turns = 8.0 - 1.25 * pull
    split = round(COIL_SAMPLES * remaining_turns / 8.0)
    start_tail = Vector((CABLE_RADIUS * math.cos(EXIT_ANGLE), -0.45,
                         CABLE_RADIUS * math.sin(EXIT_ANGLE)))
    end = cable_end(pull, sway)
    c1 = start_tail + Vector((0.37, -0.035, -0.15))
    c2 = end + Vector((-0.48 - 0.20 * pull, -0.04 - 0.18 * sway, 0.055))
    path = []
    for i in range(TOTAL_SAMPLES):
        if i <= split:
            t = i / max(1, split)
            angle = EXIT_ANGLE - 2 * math.pi * remaining_turns * (1 - t)
            path.append((CABLE_RADIUS * math.cos(angle), 0.45 - 0.90 * t,
                         CABLE_RADIUS * math.sin(angle)))
        else:
            t = (i - split) / (TOTAL_SAMPLES - 1 - split)
            p = cubic(start_tail, c1, c2, end, t)
            p.y += math.sin(math.pi * t) * 0.42 * sway
            p.z += math.sin(math.pi * t) * 0.15 * sway
            path.append(tuple(p))
    return path


animated_cable = tube("PullableOuterCable", cable_path(0, 0), 0.061, black, reel_root, 9)
animated_cable.shape_key_add(name="Basis")
state_shapes = {
    "HalfPull": (0.5, 0),
    "FullPull": (1, 0),
    "SwayLeft": (1, -1),
    "SwayRight": (1, 1),
}
for name, (pull, sway) in state_shapes.items():
    key = animated_cable.shape_key_add(name=name)
    verts = tube_vertices(cable_path(pull, sway), 0.061, 9)
    for point, vertex in zip(key.data, verts):
        point.co = vertex

timeline = {
    1: (0, 0, None),
    32: (0.5, 0, "HalfPull"),
    64: (1, 0, "FullPull"),
    88: (1, -1, "SwayLeft"),
    112: (1, 1, "SwayRight"),
    136: (1, 0, "FullPull"),
    180: (0, 0, None),
}
for frame, (pull, sway, active_shape) in timeline.items():
    for key in animated_cable.data.shape_keys.key_blocks:
        if key.name == "Basis":
            continue
        key.value = 1.0 if key.name == active_shape else 0.0
        key.keyframe_insert(data_path="value", frame=frame, group="Pull and sway")
    cutaway_root.location = cable_end(pull, sway) + Vector((0.10, 0, 0))
    cutaway_root.rotation_euler = (0.025 * sway, 0.0, 0.10 * sway)
    cutaway_root.keyframe_insert(data_path="location", frame=frame, group="Pull and sway")
    cutaway_root.keyframe_insert(data_path="rotation_euler", frame=frame, group="Pull and sway")
    spool_body_root.rotation_euler[1] = -0.85 * pull
    spool_body_root.keyframe_insert(data_path="rotation_euler", frame=frame, group="Unwinding reel")

scene.frame_start = 1
scene.frame_end = 180
scene.render.fps = 30
scene.frame_set(1)

# The cable ends in a physical cutaway: jacket, foil, braided shield, pale
# separator and four twisted pairs. The whole assembly follows the cable tip.
tube("CutawayBlackJacket", [(-0.10, 0, 0), (0.16, 0, 0)], 0.061,
     black, cutaway_root, 20)
tube("ShieldFoil", [(0.145, 0, 0), (0.40, 0, 0)], 0.056,
     silver_foil, cutaway_root, 20)
for direction in (-1, 1):
    for strand in range(12):
        braid = []
        for step in range(29):
            t = step / 28
            angle = 2 * math.pi * (strand / 12 + direction * 2.25 * t)
            braid.append((0.165 + 0.22 * t,
                          0.059 * math.cos(angle), 0.059 * math.sin(angle)))
        tube("ShieldBraid_%s_%02d" % ("L" if direction < 0 else "R", strand),
             braid, 0.0021, silver_braid, cutaway_root, 5)
tube("InnerPairSeparator", [(0.38, 0, 0), (0.54, 0, 0)], 0.046,
     inner_sleeve, cutaway_root, 18)

pair_layout = [
    (pair_materials[0], (-0.016, 0.015), (-0.225, 0.025)),
    (pair_materials[3], (-0.016, -0.015), (-0.075, 0.190)),
    (pair_materials[1], (0.016, 0.015), (0.095, 0.200)),
    (pair_materials[2], (0.016, -0.015), (0.235, 0.035)),
]

def pair_point(pair_index, strand, t):
    _, start, finish = pair_layout[pair_index]
    fan = t * t * (3 - 2 * t)
    center_y = start[0] * (1 - fan) + finish[0] * fan
    center_z = start[1] * (1 - fan) + finish[1] * fan
    phase = 2 * math.pi * (2.85 * t + pair_index * 0.18) + strand * math.pi
    return (0.43 + 1.03 * t,
            center_y + 0.018 * math.cos(phase),
            center_z + 0.018 * math.sin(phase))

for pair_index, (pair_info, _, _) in enumerate(pair_layout):
    name, color_mat, white_mat = pair_info
    for strand, insulation in ((0, color_mat), (1, white_mat)):
        points = [pair_point(pair_index, strand, step / 96) for step in range(97)]
        tube("Twisted%s_%s" % (name, "Color" if strand == 0 else "White"),
             points, 0.0105, insulation, cutaway_root, 8)
        tip = Vector(points[-1])
        preceding = Vector(points[-3])
        tangent = (tip - preceding).normalized()
        copper_points = [tuple(tip + tangent * (0.017 * step)) for step in range(12)]
        tube("ExposedCopper_%s_%d" % (name, strand + 1),
             copper_points, 0.0044, copper, cutaway_root, 8)
        if strand == 1:
            # A colored tracer identifies which white conductor belongs to its pair.
            stripe = [(x, y + 0.009, z) for x, y, z in points]
            tube("TracerOnWhite_%s" % name, stripe, 0.0019,
                 color_mat, cutaway_root, 5)

# Studio setup, separate from model export.
studio = bpy.data.collections.new("Studio / render only")
scene.collection.children.link(studio)
world = bpy.data.worlds.new("BlueStorm Studio World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.63, 0.73, 0.86, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
scene.world = world

camera_data = bpy.data.cameras.new("Product camera")
camera = bpy.data.objects.new("Product camera", camera_data)
studio.objects.link(camera)
camera.location = (4.6, -7.2, 3.1)
target = Vector((0.35, 0, 0.05))
camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 6.5
scene.camera = camera

def area_light(name, location, energy, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    studio.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat("-Z", "Y").to_euler()

area_light("Key softbox", (1.0, -4.0, 5.0), 900, 5.0)
area_light("Fill softbox", (-3.0, -2.0, 1.0), 500, 4.0)
area_light("Rim softbox", (1.0, 2.7, 3.2), 1150, 3.5)

scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = POSTER_PATH
scene.view_settings.view_transform = "AgX"

bpy.ops.object.select_all(action="DESELECT")
for obj in collection.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = reel_root
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_animations=True,
    export_animation_mode="ACTIVE_ACTIONS",
    export_morph=True,
    export_morph_normal=False,
    export_cameras=False,
    export_lights=False,
    export_yup=True,
)

def point_camera(position, target, scale):
    camera.location = position
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.ortho_scale = scale


bpy.ops.render.render(write_still=True)
scene.frame_set(64)
point_camera((7.3, -8.1, 3.0), (1.55, -0.15, -0.15), 9.2)
scene.render.filepath = PULL_PREVIEW_PATH
bpy.ops.render.render(write_still=True)
scene.frame_set(112)
scene.render.filepath = SWAY_PREVIEW_PATH
bpy.ops.render.render(write_still=True)
scene.frame_set(64)
point_camera((6.8, -3.3, 1.6), (5.30, -0.54, -1.10), 2.35)
scene.render.filepath = PAIR_PREVIEW_PATH
bpy.ops.render.render(write_still=True)
scene.frame_set(1)
point_camera((4.6, -7.2, 3.1), (0.55, 0, 0.05), 6.5)
scene.render.filepath = POSTER_PATH
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

result = {
    "status": "ok",
    "scene": scene.name,
    "objects": len(collection.objects),
    "glb": GLB_PATH,
    "glb_bytes": os.path.getsize(GLB_PATH),
    "blend": BLEND_PATH,
    "poster": POSTER_PATH,
    "pulled_preview": PULL_PREVIEW_PATH,
    "sway_preview": SWAY_PREVIEW_PATH,
    "pair_preview": PAIR_PREVIEW_PATH,
    "wood_texture": WOOD_TEX_PATH,
    "animation_frames": scene.frame_end,
}
