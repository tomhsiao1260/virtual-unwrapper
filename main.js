import './style.css'
import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { DragControls } from 'three/addons/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
camera.position.set(0, -3, 0)
camera.up.set(0, 0, 1)
camera.lookAt(0, 0, 0)
scene.add(camera)

// Plane
const textureWidth = 189
const textureHeight = 1547
const pSize = 0.15

const geometry = new THREE.PlaneGeometry(pSize, pSize * textureHeight / textureWidth, 100, 100)
const positions = geometry.getAttribute('position').array

for (let i = 0; i < positions.length / 3; i++) {
    const xo = positions[3 * i + 0]
    const yo = positions[3 * i + 1]
    const zo = positions[3 * i + 2]

    positions[3 * i + 0] = xo
    positions[3 * i + 1] = zo
    positions[3 * i + 2] = yo
}

const posTexture = new THREE.TextureLoader().load('20230702185753.png', render)
const uvTexture = new THREE.TextureLoader().load('20230702185753_r3_uv.png', render)
const dTexture = new THREE.TextureLoader().load('20230702185753_r3_d.png', render)
const labTexture = new THREE.TextureLoader().load('20230702185753_inklabels.png', render)

const material = new Shader()
posTexture.minFilter = THREE.NearestFilter
posTexture.magFilter = THREE.NearestFilter
material.uniforms.tPosition.value = posTexture

uvTexture.minFilter = THREE.NearestFilter
uvTexture.magFilter = THREE.NearestFilter
material.uniforms.tUV.value = uvTexture

dTexture.minFilter = THREE.NearestFilter
dTexture.magFilter = THREE.NearestFilter
material.uniforms.tDistance.value = dTexture

labTexture.minFilter = THREE.NearestFilter
labTexture.magFilter = THREE.NearestFilter
material.uniforms.tLabel.value = labTexture

const p1 = new THREE.Mesh(geometry, material)
const p2 = new THREE.Mesh(geometry, material)

const meshList = [ p1, p2 ]
meshList.forEach((mesh) => scene.add(mesh))

// GUI
const params = { flatten: 0, left: 0, right: 0, top: 0, bottom: 0 }

const gui = new GUI()
gui.add(params, 'flatten', 0, 1, 0.01).name('flatten').onChange(render)
gui.add(params, 'left', 0, 1, 0.01).name('left').onChange(render)
gui.add(params, 'right', 0, 1, 0.01).name('right').onChange(render)
gui.add(params, 'top', 0, 1, 0.01).name('top').onChange(render)
gui.add(params, 'bottom', 0, 1, 0.01).name('bottom').onChange(render)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = false
controls.screenSpacePanning = true
controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
controls.addEventListener('change', render)

const drag = new DragControls([ ...meshList ], camera, canvas)
drag.addEventListener('drag', render)
drag.addEventListener('dragstart', () => { controls.enabled = false })
drag.addEventListener('dragend', () => { controls.enabled = true })

// Render
function render() {
    meshList.forEach((mesh, i) => {
        mesh.visible = params[i + 1]
        mesh.material.uniforms.uFlatten.value = params.flatten
        mesh.material.uniforms.uLeft.value = params.left
        mesh.material.uniforms.uRight.value = params.right
        mesh.material.uniforms.uTop.value = params.top
        mesh.material.uniforms.uBottom.value = params.bottom
    })

    renderer.render(scene, camera)
}
render()
