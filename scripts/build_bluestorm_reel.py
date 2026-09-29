"""Build the BlueStorm cable reel in a separate Blender scene and export a web GLB.

Run from the Blender MCP code tool with:
    exec(compile(open('/Users/JeemHome/ufuk/ufuk-connect-bazaar/scripts/build_bluestorm_reel.py').read(),
                 'build_bluestorm_reel.py', 'exec'))
"""

import bpy
import math
import os
from mathutils import Vector


ROOT = "/Users/JeemHome/ufuk/ufuk-connect-bazaar"
GLB_PATH = os.path.join(ROOT, "public/models/bluestorm-lan-reel.glb")
BLEND_PATH = os.path.join(ROOT, "assets/bluestorm-lan-reel.blend")
POSTER_PATH = os.path.join(ROOT, "public/models/bluestorm-lan-reel.png")

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


def material(name, color, metallic=0.0, roughness=0.6, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
    return mat


wood = material("Birch plywood / warm natural", (0.68, 0.47, 0.28), roughness=0.76)
wood_edge = material("Plywood cut edge", (0.46, 0.29, 0.16), roughness=0.85)
wood_light = material("Plywood grain highlight", (0.76, 0.55, 0.34), roughness=0.82)
navy = material("BlueStorm deep navy print", (0.025, 0.08, 0.23), roughness=0.82)
black = material("Outdoor LAN cable / black jacket", (0.012, 0.018, 0.027), roughness=0.45)
black_highlight = material("Cable seam", (0.06, 0.08, 0.11), roughness=0.51)
metal = material("Brushed silver rivets", (0.48, 0.57, 0.62), metallic=0.85, roughness=0.27)
gold = material("RJ45 gold contacts", (0.82, 0.55, 0.16), metallic=0.82, roughness=0.21)
plug = material("RJ45 clear polycarbonate", (0.6, 0.76, 0.87), metallic=0.05, roughness=0.16, alpha=0.42)
plug_solid = material("RJ45 edge and latch", (0.30, 0.45, 0.58), metallic=0.07, roughness=0.29, alpha=0.75)
label_mat = material("Product sticker", (0.89, 0.9, 0.88), roughness=0.78)
strand_colors = [
    material("Pair orange", (0.91, 0.29, 0.04)),
    material("Pair white orange", (0.95, 0.81, 0.64)),
    material("Pair green", (0.06, 0.48, 0.15)),
    material("Pair white green", (0.72, 0.89, 0.71)),
    material("Pair blue", (0.04, 0.26, 0.7)),
    material("Pair white blue", (0.72, 0.81, 0.94)),
    material("Pair brown", (0.45, 0.20, 0.06)),
    material("Pair white brown", (0.86, 0.72, 0.57)),
]


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
front_root = empty("FrontFlange", reel_root)
back_root = empty("BackFlange", reel_root)
connector_root = empty("RJ45Connector", reel_root, (2.37, -0.54, -0.91))


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
    return mesh_object(name, verts, faces, mat, parent)


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


def tube(name, points, radius, mat, parent, sides=8):
    verts = []
    faces = []
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
annulus("DrumCore", 0, 0.63, 0.18, 1.28, wood_edge, reel_root)

# Thin rings make the broad wooden surface read as layered birch, without heavy textures.
for idx, radius in enumerate((0.9, 1.24, 1.56)):
    annulus("PlywoodGrowthRing_%d" % idx, -0.752, radius, radius - 0.007,
            0.002, wood_light if idx != 1 else wood_edge, front_root, 96)

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

# Dense black jacket winding, laid in three concentric layers across the barrel.
for layer in range(3):
    radius = 1.04 + layer * 0.12
    turns = 8
    count = turns * 64 + 1
    points = []
    for i in range(count):
        t = i / (count - 1)
        a = 2 * math.pi * turns * t + layer * 0.67
        y = -0.48 + 0.96 * (t if layer % 2 == 0 else 1 - t)
        points.append((radius * math.cos(a), y, radius * math.sin(a)))
    tube("BlackCableWinding_%d" % (layer + 1), points, 0.061, black, reel_root, 7)

# A visible free end leads from the winding to the RJ45 plug.
tail_points = [
    (1.01, -0.36, -0.17), (1.16, -0.41, -0.22), (1.34, -0.49, -0.35),
    (1.52, -0.55, -0.54), (1.72, -0.55, -0.73), (1.92, -0.54, -0.88),
    (2.13, -0.54, -0.91), (2.31, -0.54, -0.91),
]
tube("CableFreeEnd", tail_points, 0.059, black, reel_root, 10)

# RJ45 connector: clear shell, strain boot, latch, eight gold pins, and eight visible conductors.
box("StrainReliefBoot", (-0.065, 0, 0), (0.30, 0.27, 0.25), black_highlight, connector_root, 0.045)
for i in range(4):
    box("BootRib_%d" % i, (-0.17 + i * 0.048, 0, 0),
        (0.017, 0.30, 0.28), black, connector_root, 0.005)
box("ClearPlugHousing", (0.31, 0, 0), (0.52, 0.34, 0.28), plug, connector_root, 0.025)
box("PlugNose", (0.59, 0, -0.01), (0.10, 0.31, 0.21), plug_solid, connector_root, 0.014)
box("SpringLatch", (0.27, 0, 0.205), (0.40, 0.15, 0.035), plug_solid, connector_root, 0.012)
for i in range(8):
    y = -0.133 + i * 0.038
    box("GoldContact_%02d" % (i + 1), (0.584, y, 0.084),
        (0.084, 0.023, 0.018), gold, connector_root, 0.002)
    box("Conductor_%02d" % (i + 1), (0.27, y, -0.015),
        (0.32, 0.017, 0.018), strand_colors[i], connector_root, 0.003)

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
camera_data.ortho_scale = 5.9
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
scene.cycles.samples = 32
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
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_yup=True,
)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
bpy.ops.render.render(write_still=True)

result = {
    "status": "ok",
    "scene": scene.name,
    "objects": len(collection.objects),
    "glb": GLB_PATH,
    "glb_bytes": os.path.getsize(GLB_PATH),
    "blend": BLEND_PATH,
    "poster": POSTER_PATH,
}
