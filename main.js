import './style.css'
import * as THREE from 'three'
import { ArcballControls } from 'three/addons/controls/ArcballControls.js'
import { Shader } from './Shader'

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Save sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
})

// Scene
const scene = new THREE.Scene()

// Camera
const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(-1 * aspect, 1 * aspect, 1, -1, 0.01, 100)
camera.up.set(0, 0, 1)
camera.position.y = -3
scene.add(camera)

// Plane
const textureWidth = 189
const textureHeight = 1547
const pSize = 0.15

const geometry = new THREE.PlaneGeometry(pSize, pSize * textureHeight / textureWidth, 100, 100)

const uvTexture = new THREE.TextureLoader().load('20230702185753_r3_uv.png', render)
const dTexture = new THREE.TextureLoader().load('20230702185753_r3_d.png', render)

const material = new Shader()
uvTexture.minFilter = THREE.NearestFilter
uvTexture.magFilter = THREE.NearestFilter
material.uniforms.tDiffuse.value = uvTexture

dTexture.minFilter = THREE.NearestFilter
dTexture.magFilter = THREE.NearestFilter
material.uniforms.tEdge.value = dTexture

const p1 = new THREE.Mesh(geometry, material)
p1.rotation.x = Math.PI / 2

const meshList = [ p1 ]
meshList.forEach((mesh) => scene.add(mesh))

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

// Controls
const controls = new ArcballControls(camera, canvas, scene)
controls.addEventListener('change', render)

// Render
function render() {
    renderer.render(scene, camera)
}
render()
