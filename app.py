import os
import json
import shutil
import numpy as np
from PIL import Image
from sklearn.decomposition import PCA

# Enter Volpkg & Segment_id info
volpkg_name = '../full-scrolls/Scroll1.volpkg'
segment_id = '20230509182749'
# segment_id = '20230504093154'
# segment_id = '20230503225234'


# You don't need to alter the file name below
input_folder = f'{volpkg_name}/paths/{segment_id}/'
obj_file = os.path.join(input_folder, f'{segment_id}.obj')
tif_file = os.path.join(input_folder, f'{segment_id}.tif')

output_folder = 'output'
obj_copy_file = os.path.join(output_folder, 'segment.obj')
png_file = os.path.join(output_folder, 'segment.png')
json_file = os.path.join(output_folder, 'segment.json')

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

def parse_obj(filename):
    vertices = []
    normals = []
    uvs = []
    faces = []

    with open(filename, 'r') as f:
        for line in f:
            if line.startswith('v '):
                vertices.append([float(x) for x in line[2:].split()])
            elif line.startswith('vn '):
                normals.append([float(x) for x in line[3:].split()])
            elif line.startswith('vt '):
                uvs.append([float(x) for x in line[3:].split()])
            elif line.startswith('f '):
                indices = [int(x.split('/')[0]) - 1 for x in line.split()[1:]]
                faces.append(indices)

    vertices = np.array(vertices)
    normals = np.array(normals)
    uvs = np.array(uvs)
    faces = np.array(faces)

    return vertices, normals, uvs, faces

def save_obj(filename, vertices, normals, uvs, faces):
    with open(filename, 'w') as f:

        for i in range(len(vertices)):
            vertex = vertices[i]
            normal = normals[i]
            f.write(f"v {' '.join(str(x) for x in vertex)}\n")
            f.write(f"vn {' '.join(str(x) for x in normal)}\n")

        for uv in uvs:
            f.write(f"vt {' '.join(str(x) for x in uv)}\n")

        for face in faces:
            indices = ' '.join(f"{x+1}/{x+1}/{x+1}" for x in face)
            f.write(f"f {indices}\n")

def calc_area(vertices, faces):
    a = vertices[faces[:, 0], :]
    b = vertices[faces[:, 1], :]
    c = vertices[faces[:, 2], :]

    ab = b - a
    ac = c - a
    cross = np.cross(ab, ac)
    face_areas = 0.5 * np.sqrt(np.sum(cross ** 2, axis=1))

    return np.sum(face_areas)

def calc_metric(vertices, normals, totoal_area):
    mean_vertices = np.mean(vertices, axis=0)
    mean_normals = np.mean(normals, axis=0)

    # Save texture image
    tif_img = Image.open(tif_file)
    tif_img = np.array(tif_img, dtype=np.float32)
    tif_img /= 65535.0 / 255.0
    tif_img = tif_img.astype(np.uint8)
    Image.fromarray(tif_img).save(png_file, format='PNG')

    # Calculate bounding box
    distances = np.linalg.norm(vertices - mean_vertices, axis=1)
    farthest_vertex = vertices[np.argmax(distances)]
    bounding_box = farthest_vertex - mean_vertices

    # Construct an orthonormal basis for the plane
    e = np.array([1, 0, 0])
    u = np.cross(mean_normals, e)
    u /= np.linalg.norm(u)
    v = np.cross(mean_normals, u)
    v /= np.linalg.norm(v)
    A = np.column_stack((u, v))

    # projected = vertices.dot(A)
    # pca = PCA(n_components=2)
    # pca.fit(projected)

    # basevectors = pca.components_
    # basevectors = np.dot(eigenvectors, A.T)
    basevectors = A.T

    totoal_area = np.round(totoal_area, decimals=5)
    mean_vertices = np.round(mean_vertices, decimals=5)
    mean_normals = np.round(mean_normals, decimals=5)
    bounding_box = np.round(bounding_box, decimals=5)
    basevectors = np.round(basevectors, decimals=5)

    data = {
        'area': totoal_area,
        'tifsize': (tif_img.shape[1], tif_img.shape[0]),
        'center': mean_vertices.tolist(),
        'normal': mean_normals.tolist(),
        'boundingbox': bounding_box.tolist(),
        'basevectors': basevectors.tolist(),
    }

    with open(json_file, "w") as f:
        json.dump(data, f)

    return data

def processing(vertices, normals, uvs, faces):
    # generate a new face on back side (haven't used yet)

    # n_vertices = vertices - normals * 10
    # n_normals = -normals
    # n_uvs = uvs
    # n_faces = np.flip(faces + len(vertices), axis=1)

    # d_vertices = np.concatenate((vertices, n_vertices), axis=0)
    # d_normals = np.concatenate((normals, n_normals), axis=0)
    # d_uvs = np.concatenate((uvs, n_uvs), axis=0)
    # d_faces = np.concatenate((faces, n_faces), axis=0)

    d_vertices = vertices
    d_normals = normals
    d_uvs = uvs
    d_faces = faces

    # Calculate bounding box
    mean_vertices = np.mean(vertices, axis=0)
    distances = np.linalg.norm(vertices - mean_vertices, axis=1)
    farthest_vertex = vertices[np.argmax(distances)]
    bounding_box = farthest_vertex - mean_vertices

    # translate & rescale
    d_vertices = (d_vertices - mean_vertices) / np.amax(bounding_box)
    d_vertices = np.around(d_vertices, decimals=5)

    return d_vertices, d_normals, d_uvs, d_faces

vertices, normals, uvs, faces = parse_obj(obj_file)
total_area = calc_area(vertices, faces)
data = calc_metric(vertices, normals, total_area)

# Copy the generated files to the client folder
shutil.copy(obj_file , obj_copy_file)
shutil.copy(json_file , 'client/src')
shutil.copy(png_file , 'client/static')
shutil.copy(obj_copy_file , 'client/static')


