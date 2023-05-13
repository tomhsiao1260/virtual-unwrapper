import json
import numpy as np

from PIL import Image
from sklearn.decomposition import PCA

segment_id = '20230503225234'

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

    # Construct an orthonormal basis for the plane
    e = np.array([1, 0, 0])
    u = np.cross(mean_normals, e)
    u /= np.linalg.norm(u)
    v = np.cross(mean_normals, u)
    v /= np.linalg.norm(v)
    A = np.column_stack((u, v))

    projected = vertices.dot(A)
    pca = PCA(n_components=2)
    pca.fit(projected)

    eigenvalues = pca.explained_variance_
    eigenvectors = pca.components_
    eigenvectors = np.dot(eigenvectors, A.T)

    totoal_area = np.round(totoal_area, decimals=5)
    mean_vertices = np.round(mean_vertices, decimals=5)
    mean_normals = np.round(mean_normals, decimals=5)
    eigenvalues = np.round(eigenvalues, decimals=5)
    eigenvectors = np.round(eigenvectors, decimals=5)

    tif_img = Image.open(f'{segment_id}.tif')
    tif_img.save(f'{segment_id}.png', 'png')

    data = {
        'area': totoal_area,
        'tifsize': tif_img.size,
        'center': mean_vertices.tolist(),
        'normal': mean_normals.tolist(),
        'eigenvalues': eigenvalues.tolist(),
        'eigenvectors': eigenvectors.tolist(),
    }

    with open(f'{segment_id}.json', "w") as f:
        json.dump(data, f)

    return data

vertices, normals, uvs, faces = parse_obj(f'{segment_id}.obj')
total_area = calc_area(vertices, faces)
data = calc_metric(vertices, normals, total_area)


